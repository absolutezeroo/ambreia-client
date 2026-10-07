/**
 * Animates a scalar value toward a target using constant-acceleration
 * physics (accelerate, then decelerate to a stop exactly at the target),
 * bounded by a maximum velocity, integrated in fixed sub-steps.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AnimatedScalar.as
 */
export class AnimatedScalar
{
    // AS3: .../src/com/sulake/habbo/window/utils/AnimatedScalar.as::MAX_INTEGRATION_STEP_MS
    private static readonly MAX_INTEGRATION_STEP_MS: number = 8;

    private readonly _acceleration: number;
    private readonly _maxVelocity: number;
    private readonly _tolerance: number;

    // AS3: .../src/com/sulake/habbo/window/utils/AnimatedScalar.as::_lastUpdateTimeMs
    private _lastUpdateTimeMs: number = 0;
    private _velocity: number = 0;
    private _target: number = 0;
    private _value: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AnimatedScalar.as::AnimatedScalar()
    constructor(acceleration: number, maxVelocity: number, tolerance: number)
    {
        this._acceleration = Math.max(0, acceleration);
        this._maxVelocity = Math.max(0, maxVelocity);
        this._tolerance = Math.max(0, tolerance);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AnimatedScalar.as::get value()
    public get value(): number
    {
        return this._value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AnimatedScalar.as::snapTo()
    public snapTo(value: number, nowMs: number): void
    {
        this._lastUpdateTimeMs = nowMs;
        this._velocity = 0;
        this._target = value;
        this._value = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AnimatedScalar.as::setTarget()
    public setTarget(value: number, nowMs: number): void
    {
        this.update(nowMs);
        this._target = value;
        this._lastUpdateTimeMs = nowMs;

        const direction = this.resolveDirectionToTarget();

        if(direction === 0)
        {
            this.settle();

            return;
        }

        this._velocity = direction * Math.min(Math.abs(this._velocity), this._maxVelocity);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AnimatedScalar.as::needsUpdate()
    public needsUpdate(_nowMs: number, scale: number = 1): boolean
    {
        if(scale > 0 && Math.trunc(this._target * scale) !== Math.trunc(this._value * scale))
        {
            return true;
        }

        return Math.abs(this._target - this._value) > this._tolerance || Math.abs(this._velocity) > this._tolerance;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AnimatedScalar.as::update()
    public update(nowMs: number): boolean
    {
        let remainingMs = Math.max(0, nowMs - this._lastUpdateTimeMs);

        if(remainingMs <= 0 || this.isSettled())
        {
            this._lastUpdateTimeMs = nowMs;

            return false;
        }

        const previous = this._value;

        while(remainingMs > 0 && !this.isSettled())
        {
            const step = Math.min(remainingMs, AnimatedScalar.MAX_INTEGRATION_STEP_MS);

            this.integrateStep(step);
            remainingMs -= step;
        }

        this._lastUpdateTimeMs = nowMs;

        return this._value !== previous;
    }

    // AS3: .../src/com/sulake/habbo/window/utils/AnimatedScalar.as::settle()
    private settle(): boolean
    {
        const changed = this._value !== this._target || this._velocity !== 0;

        this._value = this._target;
        this._velocity = 0;

        return changed;
    }

    // AS3: .../src/com/sulake/habbo/window/utils/AnimatedScalar.as::integrateStep()
    private integrateStep(dtMs: number): void
    {
        const remainingDistance = this._target - this._value;
        const direction = AnimatedScalar.sign(remainingDistance);

        if(direction === 0 || Math.abs(remainingDistance) <= this._tolerance)
        {
            this.settle();

            return;
        }

        const acceleration = this.resolveAcceleration(direction);
        const nextValue = this._value + this._velocity * dtMs + 0.5 * acceleration * dtMs * dtMs;
        let nextVelocity = this._velocity + acceleration * dtMs;

        if(AnimatedScalar.sign(this._target - nextValue) !== direction || Math.abs(this._target - nextValue) <= this._tolerance)
        {
            this.settle();

            return;
        }

        if(this._maxVelocity > 0 && Math.abs(nextVelocity) > this._maxVelocity)
        {
            nextVelocity = AnimatedScalar.sign(nextVelocity) * this._maxVelocity;
        }

        if(this._velocity !== 0 && AnimatedScalar.sign(nextVelocity) !== AnimatedScalar.sign(this._velocity) && AnimatedScalar.sign(acceleration) !== direction)
        {
            nextVelocity = 0;
        }

        this._value = nextValue;
        this._velocity = nextVelocity;
    }

    // AS3: .../src/com/sulake/habbo/window/utils/AnimatedScalar.as::resolveAcceleration()
    private resolveAcceleration(direction: number): number
    {
        if(this._acceleration <= 0)
        {
            return 0;
        }

        const signedVelocity = this._velocity * direction;

        if(signedVelocity < 0)
        {
            return direction * this._acceleration;
        }

        const brakingDistance = (signedVelocity * signedVelocity) / (2 * this._acceleration);

        if(brakingDistance >= Math.abs(this._target - this._value))
        {
            return -direction * this._acceleration;
        }

        if(this._maxVelocity > 0 && signedVelocity >= this._maxVelocity)
        {
            return 0;
        }

        return direction * this._acceleration;
    }

    // AS3: .../src/com/sulake/habbo/window/utils/AnimatedScalar.as::resolveDirectionToTarget()
    private resolveDirectionToTarget(): number
    {
        const remainingDistance = this._target - this._value;

        return Math.abs(remainingDistance) <= this._tolerance ? 0 : AnimatedScalar.sign(remainingDistance);
    }

    // AS3: .../src/com/sulake/habbo/window/utils/AnimatedScalar.as::isSettled()
    private isSettled(): boolean
    {
        return Math.abs(this._target - this._value) <= this._tolerance && Math.abs(this._velocity) <= this._tolerance;
    }

    // AS3: .../src/com/sulake/habbo/window/utils/AnimatedScalar.as::sign()
    private static sign(value: number): number
    {
        if(value > 0) return 1;
        if(value < 0) return -1;

        return 0;
    }
}
