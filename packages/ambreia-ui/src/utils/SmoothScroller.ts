/**
 * Inertial/eased scroll animator used by scrollable windows.
 *
 * Animates a scroll position from its current value toward a target using a
 * cubic-bezier ease curve, with the animation duration shortened for large
 * wheel deltas ("inverse delta" ramp) and bounded by an estimated velocity
 * so retargeting mid-scroll doesn't overshoot.
 *
 * The AS3 original drives itself with a `flash.utils.Timer`; this port uses
 * `setInterval`/`performance.now()`, matching the convention already used
 * elsewhere in this codebase (see `ItemListController`'s scroll-wheel timer).
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/SmoothScroller.as
 */
export class SmoothScroller
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/SmoothScroller.as::DEFAULT_SCROLL_STEP
    public static readonly DEFAULT_SCROLL_STEP: number = 25;

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::DEFAULT_MAX_DURATION_MS
    private static readonly DEFAULT_MAX_DURATION_MS: number = 200;
    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::INVERSE_DELTA_RAMP_START_PX
    private static readonly INVERSE_DELTA_RAMP_START_PX: number = 120;
    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::INVERSE_DELTA_RAMP_END_PX
    private static readonly INVERSE_DELTA_RAMP_END_PX: number = 480;
    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::INVERSE_DELTA_MIN_DURATION_SCALE
    private static readonly INVERSE_DELTA_MIN_DURATION_SCALE: number = 0.5;
    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::VELOCITY_BOUND_FUDGE
    private static readonly VELOCITY_BOUND_FUDGE: number = 2.5;
    private static readonly EPSILON: number = 0.01;
    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::CURVE_X1
    private static readonly CURVE_X1: number = 0.42;
    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::CURVE_X2
    private static readonly CURVE_X2: number = 0.58;
    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::CURVE_Y2
    private static readonly CURVE_Y2: number = 1;
    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::MAX_SLOPE
    private static readonly MAX_SLOPE: number = 1000;
    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::NEWTON_ITERATIONS
    private static readonly NEWTON_ITERATIONS: number = 4;
    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::BINARY_SEARCH_ITERATIONS
    private static readonly BINARY_SEARCH_ITERATIONS: number = 8;

    private readonly _getPosition: () => number;
    private readonly _setPosition: (value: number) => void;
    private readonly _getMaxScroll: () => number;
    private readonly _onComplete: (() => void) | null;
    private readonly _normalized: boolean;
    private readonly _clampToBounds: boolean;
    private readonly _scrollStep: number;
    private readonly _tickIntervalMs: number;

    private _duration: number = SmoothScroller.DEFAULT_MAX_DURATION_MS;
    private _halfDuration: number = SmoothScroller.DEFAULT_MAX_DURATION_MS * 0.5;
    private _timer: ReturnType<typeof setInterval> | null = null;
    private _startValue: number = 0;
    private _targetValue: number = 0;
    private _startTime: number = 0;
    private _targetTime: number = 0;
    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::_curveControlY1
    private _curveControlY1: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/SmoothScroller.as::SmoothScroller()
    constructor(
        getPosition: () => number,
        setPosition: (value: number) => void,
        getMaxScroll: () => number,
        duration: number = 200,
        fps: number = 60,
        normalized: boolean = true,
        onComplete: (() => void) | null = null,
        scrollStep: number = NaN,
        clampToBounds: boolean = true
    )
    {
        this._scrollStep = Number.isNaN(scrollStep) ? SmoothScroller.DEFAULT_SCROLL_STEP : scrollStep;
        this.duration = duration;
        this._normalized = normalized;
        this._clampToBounds = clampToBounds;
        this._onComplete = onComplete;
        this._getPosition = getPosition;
        this._setPosition = setPosition;
        this._getMaxScroll = getMaxScroll;
        this._tickIntervalMs = Math.trunc(1000 / fps);
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::getBezierValue()
    private static getBezierValue(x: number, x1: number, y1: number, x2: number): number
    {
        x = SmoothScroller.clamp(x, 0, 1);

        const t = SmoothScroller.solveCurveTForX(x, x1, x2);

        return SmoothScroller.sampleCurve(t, y1, SmoothScroller.CURVE_Y2);
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::getBezierSlope()
    private static getBezierSlope(x: number, x1: number, y1: number, x2: number): number
    {
        x = SmoothScroller.clamp(x, 0, 1);

        const t = SmoothScroller.solveCurveTForX(x, x1, x2);
        const dxdt = SmoothScroller.sampleCurveDerivative(t, x1, x2);

        if(Math.abs(dxdt) < SmoothScroller.EPSILON)
        {
            return 0;
        }

        const dydt = SmoothScroller.sampleCurveDerivative(t, y1, SmoothScroller.CURVE_Y2);

        return dydt / dxdt;
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::solveCurveTForX()
    private static solveCurveTForX(x: number, x1: number, x2: number): number
    {
        let t = x;

        for(let i = 0; i < SmoothScroller.NEWTON_ITERATIONS; i++)
        {
            const error = SmoothScroller.sampleCurve(t, x1, x2) - x;

            if(Math.abs(error) < SmoothScroller.EPSILON)
            {
                return t;
            }

            const derivative = SmoothScroller.sampleCurveDerivative(t, x1, x2);

            if(Math.abs(derivative) < SmoothScroller.EPSILON)
            {
                break;
            }

            t -= error / derivative;
        }

        let low = 0;
        let high = 1;

        t = x;

        for(let i = 0; i < SmoothScroller.BINARY_SEARCH_ITERATIONS; i++)
        {
            const sample = SmoothScroller.sampleCurve(t, x1, x2);

            if(Math.abs(sample - x) < SmoothScroller.EPSILON)
            {
                return t;
            }

            if(sample > x)
            {
                high = t;
            }
            else
            {
                low = t;
            }

            t = (high + low) * 0.5;
        }

        return t;
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::sampleCurve()
    private static sampleCurve(t: number, p1: number, p2: number): number
    {
        return ((SmoothScroller.getCurveA(p1, p2) * t + SmoothScroller.getCurveB(p1, p2)) * t + SmoothScroller.getCurveC(p1)) * t;
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::sampleCurveDerivative()
    private static sampleCurveDerivative(t: number, p1: number, p2: number): number
    {
        return 3 * SmoothScroller.getCurveA(p1, p2) * t * t + 2 * SmoothScroller.getCurveB(p1, p2) * t + SmoothScroller.getCurveC(p1);
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::getCurveA()
    private static getCurveA(p1: number, p2: number): number
    {
        return 1 - 3 * p2 + 3 * p1;
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::getCurveB()
    private static getCurveB(p1: number, p2: number): number
    {
        return 3 * p2 - 6 * p1;
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::getCurveC()
    private static getCurveC(p1: number): number
    {
        return 3 * p1;
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::clamp()
    private static clamp(value: number, min: number, max: number): number
    {
        if(value < min) return min;
        if(value > max) return max;

        return value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/SmoothScroller.as::dispose()
    public dispose(): void
    {
        this.stop();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/SmoothScroller.as::get duration()
    public get duration(): number
    {
        return this._duration;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/SmoothScroller.as::set duration()
    public set duration(value: number)
    {
        if(!Number.isFinite(value) || value <= 0)
        {
            value = SmoothScroller.DEFAULT_MAX_DURATION_MS;
        }

        this._duration = value;
        this._halfDuration = value * 0.5;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/SmoothScroller.as::get isScrolling()
    public get isScrolling(): boolean
    {
        return this._timer !== null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/SmoothScroller.as::adjustStartPosition()
    public adjustStartPosition(delta: number): void
    {
        if(!this.isScrolling || !Number.isFinite(delta) || delta === 0)
        {
            return;
        }

        this._startValue = this.clampPosition(this._startValue + delta);
        this._targetValue = this.clampPosition(this._targetValue + delta);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/SmoothScroller.as::scrollWithWheel()
    public scrollWithWheel(delta: number): boolean
    {
        return this.scrollBySteps(delta);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/SmoothScroller.as::scrollBySteps()
    public scrollBySteps(steps: number): boolean
    {
        if(!Number.isFinite(steps) || steps === 0)
        {
            return false;
        }

        const maxScroll = this.getMaxScroll();

        if(this._normalized && (!Number.isFinite(maxScroll) || maxScroll <= 0))
        {
            this.stop();

            return false;
        }

        const delta = this.wheelDeltaToScrollDelta(steps, maxScroll);

        if(!Number.isFinite(delta) || delta === 0)
        {
            return false;
        }

        const now = performance.now();
        const currentValue = this.getPosition();
        const targetValue = this.clampPosition((this.isScrolling ? this._targetValue : currentValue) + delta);

        if(Math.abs(targetValue - currentValue) < SmoothScroller.EPSILON
			&& (!this.isScrolling || Math.abs(targetValue - this._targetValue) < SmoothScroller.EPSILON))
        {
            if(targetValue !== currentValue)
            {
                this.setPosition(targetValue);
                this.stop();

                return true;
            }

            this.stop();

            return false;
        }

        if(this.isScrolling)
        {
            this.updateTarget(now, targetValue);
        }
        else
        {
            this.startAnimation(now, currentValue, targetValue);
        }

        if(this._targetTime <= this._startTime)
        {
            this.complete();

            return false;
        }

        this.restartTimer();
        this.applyPositionAt(now + this._tickIntervalMs);

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/SmoothScroller.as::stop()
    public stop(): void
    {
        this.stopInternal(false);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/SmoothScroller.as::complete()
    public complete(): void
    {
        if(this._targetTime > this._startTime)
        {
            this.setPosition(this.clampPosition(this._targetValue));
        }

        this.stopInternal(true);
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::stopInternal()
    private stopInternal(fireCallback: boolean): void
    {
        const wasRunning = this._timer !== null;

        if(this._timer !== null)
        {
            clearInterval(this._timer);
            this._timer = null;
        }

        this._startTime = 0;
        this._targetTime = 0;
        this._startValue = 0;
        this._targetValue = 0;
        this._curveControlY1 = 0;

        if(fireCallback && wasRunning && this._onComplete)
        {
            this._onComplete();
        }
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::startAnimation()
    private startAnimation(now: number, start: number, target: number): void
    {
        this._startValue = this.clampPosition(start);
        this._targetValue = this.clampPosition(target);
        this._curveControlY1 = 0;
        this._startTime = now;
        this._targetTime = now + this.getInverseDeltaDurationMs(this._targetValue - this._startValue);
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::updateTarget()
    private updateTarget(now: number, target: number): void
    {
        target = this.clampPosition(target);

        if(Math.abs(this._targetValue - target) < SmoothScroller.EPSILON)
        {
            this._targetValue = target;

            return;
        }

        const currentValue = this.getValueAt(now);
        const remaining = target - currentValue;

        if(Math.abs(remaining) < SmoothScroller.EPSILON)
        {
            this._startValue = currentValue;
            this._targetValue = target;
            this._startTime = now;
            this._targetTime = now;

            return;
        }

        if(this._targetTime - this._startTime <= SmoothScroller.EPSILON)
        {
            this.startAnimation(now, currentValue, target);

            return;
        }

        const velocity = this.calculateVelocity(now);
        const boundedDuration = this.getBoundedDurationMs(remaining, velocity);

        if(!Number.isFinite(boundedDuration) || boundedDuration < SmoothScroller.EPSILON)
        {
            this._startValue = currentValue;
            this._targetValue = target;
            this._startTime = now;
            this._targetTime = now;

            return;
        }

        let initialSlope = velocity * (boundedDuration / remaining);
        initialSlope = SmoothScroller.clamp(initialSlope, -SmoothScroller.MAX_SLOPE, SmoothScroller.MAX_SLOPE);

        this._curveControlY1 = initialSlope * SmoothScroller.CURVE_X1;
        this._startValue = currentValue;
        this._targetValue = target;
        this._startTime = now;
        this._targetTime = now + boundedDuration;
    }

    private restartTimer(): void
    {
        if(this._timer !== null)
        {
            clearInterval(this._timer);
        }

        this._timer = setInterval(() => this.updateScrolling(), this._tickIntervalMs);
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::updateScrolling()
    private updateScrolling(): void
    {
        this.applyPositionAt(performance.now());
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::applyPositionAt()
    private applyPositionAt(now: number): void
    {
        this.setPosition(this.getValueAt(now));

        if(now >= this._targetTime || this._targetTime - this._startTime <= SmoothScroller.EPSILON)
        {
            this.complete();
        }
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::wheelDeltaToScrollDelta()
    private wheelDeltaToScrollDelta(steps: number, maxScroll: number): number
    {
        if(this._normalized)
        {
            return (-steps * this._scrollStep) / maxScroll;
        }

        return -steps * this._scrollStep;
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::getInverseDeltaDurationMs()
    private getInverseDeltaDurationMs(delta: number): number
    {
        const distance = Math.abs(delta);
        let duration = this._duration;

        if(distance > SmoothScroller.INVERSE_DELTA_RAMP_START_PX)
        {
            duration += (distance - SmoothScroller.INVERSE_DELTA_RAMP_START_PX)
				* (this._halfDuration - this._duration)
				/ (SmoothScroller.INVERSE_DELTA_RAMP_END_PX - SmoothScroller.INVERSE_DELTA_RAMP_START_PX);
        }

        return SmoothScroller.clamp(duration, this._halfDuration, this._duration);
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::getBoundedDurationMs()
    private getBoundedDurationMs(delta: number, velocity: number): number
    {
        const inverseDeltaDuration = this.getInverseDeltaDurationMs(delta);
        const velocityBound = this.getVelocityBasedDurationBoundMs(delta, velocity);

        return Math.min(inverseDeltaDuration, velocityBound);
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::getVelocityBasedDurationBoundMs()
    private getVelocityBasedDurationBoundMs(delta: number, velocity: number): number
    {
        if(Math.abs(delta) < SmoothScroller.EPSILON)
        {
            return 0;
        }

        if(Math.abs(velocity) < SmoothScroller.EPSILON)
        {
            return Number.MAX_VALUE;
        }

        const bound = (delta / velocity) * SmoothScroller.VELOCITY_BOUND_FUDGE;

        return bound < 0 ? Number.MAX_VALUE : bound;
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::getValueAt()
    private getValueAt(now: number): number
    {
        const span = this._targetTime - this._startTime;

        if(span <= SmoothScroller.EPSILON || now >= this._targetTime)
        {
            return this._targetValue;
        }

        if(now <= this._startTime)
        {
            return this._startValue;
        }

        const progress = (now - this._startTime) / span;
        const eased = SmoothScroller.getBezierValue(progress, SmoothScroller.CURVE_X1, this._curveControlY1, SmoothScroller.CURVE_X2);

        return this._startValue + (this._targetValue - this._startValue) * eased;
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::calculateVelocity()
    private calculateVelocity(now: number): number
    {
        const span = this._targetTime - this._startTime;

        if(span <= SmoothScroller.EPSILON)
        {
            return 0;
        }

        const progress = SmoothScroller.clamp((now - this._startTime) / span, 0, 1);
        const slope = SmoothScroller.getBezierSlope(progress, SmoothScroller.CURVE_X1, this._curveControlY1, SmoothScroller.CURVE_X2);

        return slope * ((this._targetValue - this._startValue) / span);
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::getPosition()
    private getPosition(): number
    {
        return this._getPosition();
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::setPosition()
    private setPosition(value: number): void
    {
        this._setPosition(value);
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::getMaxScroll()
    private getMaxScroll(): number
    {
        return this._getMaxScroll();
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::clampPosition()
    private clampPosition(value: number): number
    {
        if(!this._clampToBounds || !Number.isFinite(value))
        {
            return value;
        }

        const maxPosition = this.getMaxPosition();

        if(!Number.isFinite(maxPosition))
        {
            return value;
        }

        return SmoothScroller.clamp(value, 0, maxPosition);
    }

    // AS3: .../src/com/sulake/core/window/utils/SmoothScroller.as::getMaxPosition()
    private getMaxPosition(): number
    {
        if(this._normalized)
        {
            return 1;
        }

        const maxScroll = this.getMaxScroll();

        if(!Number.isFinite(maxScroll) || maxScroll < 0)
        {
            return NaN;
        }

        return maxScroll;
    }
}
