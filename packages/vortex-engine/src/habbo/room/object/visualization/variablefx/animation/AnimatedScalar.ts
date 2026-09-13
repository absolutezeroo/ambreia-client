/**
 * A number that accelerates toward a target and brakes into it, rather than easing on a curve.
 *
 * This is why a bar fill overshoots-and-settles instead of sliding: there is a velocity, an
 * acceleration, a separate deceleration, and a speed cap, integrated in fixed sub-steps so the
 * result does not depend on the frame rate.
 *
 * Every private field is obfuscated in the AS3 except through its behaviour; `value` is the one
 * confirmed by a getter, and the rest are named from the arithmetic they take part in — the
 * braking-distance term `v² / (2 · d)` is what identifies the deceleration, and the clamp on
 * `|velocity|` the speed cap.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/animation/AnimatedScalar.as
 */
export class AnimatedScalar
{
    /**
     * Integration is chopped into steps of at most this many milliseconds. A long frame therefore
     * costs several steps rather than one big inaccurate one — with a single step, a lag spike
     * would fling the value past its target.
     */
    // AS3: .../variablefx/animation/AnimatedScalar.as::MAX_INTEGRATION_STEP_MS
    //   The AS3 declares the constant and then uses the literal 8 in `Math.min(remaining, 8)` —
    //   the decompiler inlined it. Same value either way.
    private static readonly MAX_INTEGRATION_STEP_MS: number = 8;

    // AS3: .../variablefx/animation/AnimatedScalar.as::_acceleration (name derived)
    private _acceleration: number;

    // AS3: .../variablefx/animation/AnimatedScalar.as::_deceleration (name derived)
    private _deceleration: number;

    // AS3: .../variablefx/animation/AnimatedScalar.as::_lastUpdateTimeMs
    private _lastUpdateTimeMs: number = 0;

    // AS3: .../variablefx/animation/AnimatedScalar.as::_maxSpeed (name derived)
    private _maxSpeed: number;

    // AS3: .../variablefx/animation/AnimatedScalar.as::_epsilon (name derived)
    private _epsilon: number;

    // AS3: .../variablefx/animation/AnimatedScalar.as::_velocity (name derived)
    private _velocity: number = 0;

    // AS3: .../variablefx/animation/AnimatedScalar.as::_target (name derived)
    private _target: number = 0;

    // AS3: .../variablefx/animation/AnimatedScalar.as::_value
    private _value: number = 0;

    /**
     * `deceleration` defaults to `acceleration` when not given — a symmetric ease.
     */
    // AS3: .../variablefx/animation/AnimatedScalar.as::AnimatedScalar()
    constructor(acceleration: number, maxSpeed: number, epsilon: number, deceleration: number | null = null)
    {
        this._acceleration = Math.max(0, acceleration);
        this._deceleration = Math.max(0, deceleration === null ? acceleration : deceleration);
        this._maxSpeed = Math.max(0, maxSpeed);
        this._epsilon = Math.max(0, epsilon);
    }

    // AS3: .../variablefx/animation/AnimatedScalar.as::sign()
    private static sign(value: number): number
    {
        if(value > 0) return 1;

        if(value < 0) return -1;

        return 0;
    }

    // AS3: .../variablefx/animation/AnimatedScalar.as::get value()
    get value(): number
    {
        return this._value;
    }

    // AS3: .../variablefx/animation/AnimatedScalar.as::snapTo()
    snapTo(value: number, timeMs: number): void
    {
        this._lastUpdateTimeMs = timeMs;
        this._velocity = 0;
        this._target = value;
        this._value = value;
    }

    /**
     * Catches up to `timeMs` BEFORE moving the target, so the motion so far is not discarded, then
     * keeps whatever speed it had — in the new direction, capped. That carried-over speed is what
     * makes a value chasing a moving target look continuous instead of restarting.
     */
    // AS3: .../variablefx/animation/AnimatedScalar.as::setTarget()
    setTarget(target: number, timeMs: number): void
    {
        this.update(timeMs);

        this._target = target;
        this._lastUpdateTimeMs = timeMs;

        const direction = this.resolveDirectionToTarget();

        if(direction === 0)
        {
            this.settle();

            return;
        }

        this._velocity = direction * Math.min(Math.abs(this._velocity), this._maxSpeed);
    }

    /**
     * `quantization` is how many steps the consumer renders in — 100 for a bar drawn in percent.
     *
     * It only ever ADDS a reason to redraw: when the value and the target land in different steps
     * the answer is true immediately, otherwise the ordinary epsilon test still decides. It is not
     * a filter, and reading it as one is backwards — a value creeping within a single step still
     * reports true, because it is still moving.
     *
     * In practice the branch rarely decides anything on its own: `setTarget()` settles when the
     * new target is within epsilon, which leaves value and target equal, and equal values quantise
     * equally at any factor.
     */
    // AS3: .../variablefx/animation/AnimatedScalar.as::needsUpdate()
    needsUpdate(_timeMs: number, quantization: number): boolean
    {
        if(quantization > 0 && ((this._target * quantization) | 0) !== ((this._value * quantization) | 0)) return true;

        return Math.abs(this._target - this._value) > this._epsilon || Math.abs(this._velocity) > this._epsilon;
    }

    // AS3: .../variablefx/animation/AnimatedScalar.as::update()
    update(timeMs: number): boolean
    {
        let remaining = Math.max(0, timeMs - this._lastUpdateTimeMs);

        if(remaining <= 0 || this.isSettled())
        {
            this._lastUpdateTimeMs = timeMs;

            return false;
        }

        const before = this._value;

        while(remaining > 0 && !this.isSettled())
        {
            const step = Math.min(remaining, AnimatedScalar.MAX_INTEGRATION_STEP_MS);

            this.integrateStep(step);
            remaining -= step;
        }

        this._lastUpdateTimeMs = timeMs;

        return this._value !== before;
    }

    // AS3: .../variablefx/animation/AnimatedScalar.as::settle()
    private settle(): boolean
    {
        const changed = this._value !== this._target || this._velocity !== 0;

        this._value = this._target;
        this._velocity = 0;

        return changed;
    }

    // AS3: .../variablefx/animation/AnimatedScalar.as::integrateStep()
    private integrateStep(stepMs: number): void
    {
        const distance = this._target - this._value;
        const direction = AnimatedScalar.sign(distance);

        if(direction === 0 || Math.abs(distance) <= this._epsilon)
        {
            this.settle();

            return;
        }

        const acceleration = this.resolveAcceleration(direction);
        const nextValue = this._value + this._velocity * stepMs + 0.5 * acceleration * stepMs * stepMs;
        let nextVelocity = this._velocity + acceleration * stepMs;

        // Overshot, or close enough: snap rather than oscillate around the target.
        if(AnimatedScalar.sign(this._target - nextValue) !== direction
            || Math.abs(this._target - nextValue) <= this._epsilon)
        {
            this.settle();

            return;
        }

        if(this._maxSpeed > 0 && Math.abs(nextVelocity) > this._maxSpeed)
        {
            nextVelocity = AnimatedScalar.sign(nextVelocity) * this._maxSpeed;
        }

        // Braking reversed the direction of travel — stop at zero instead of driving backwards.
        if(this._velocity !== 0
            && AnimatedScalar.sign(nextVelocity) !== AnimatedScalar.sign(this._velocity)
            && AnimatedScalar.sign(acceleration) !== direction)
        {
            nextVelocity = 0;
        }

        this._value = nextValue;
        this._velocity = nextVelocity;
    }

    /**
     * Accelerate, coast or brake, decided by comparing the distance it would take to stop against
     * the distance left.
     */
    // AS3: .../variablefx/animation/AnimatedScalar.as::resolveAcceleration()
    private resolveAcceleration(direction: number): number
    {
        const speedTowardTarget = this._velocity * direction;

        // Moving away from the target: accelerate back regardless of distance.
        if(speedTowardTarget < 0) return direction * this._acceleration;

        const brakingDistance = this._deceleration > 0
            ? speedTowardTarget * speedTowardTarget / (2 * this._deceleration)
            : 0;

        if(brakingDistance >= Math.abs(this._target - this._value)) return -direction * this._deceleration;

        if(this._maxSpeed > 0 && speedTowardTarget >= this._maxSpeed) return 0;

        return this._acceleration <= 0 ? 0 : direction * this._acceleration;
    }

    // AS3: .../variablefx/animation/AnimatedScalar.as::resolveDirectionToTarget()
    private resolveDirectionToTarget(): number
    {
        const distance = this._target - this._value;

        return Math.abs(distance) <= this._epsilon ? 0 : AnimatedScalar.sign(distance);
    }

    // AS3: .../variablefx/animation/AnimatedScalar.as::isSettled()
    private isSettled(): boolean
    {
        return Math.abs(this._target - this._value) <= this._epsilon && Math.abs(this._velocity) <= this._epsilon;
    }
}
