/**
 * RoomShakingEffect
 *
 * Static state machine for the "room shakes" special event effect. Identical in AS3 to
 * RoomRotatingEffect apart from the class name — the two are separate so a room can be shaking and
 * rotating independently. The renderer polls isVisualizationOn() every frame.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomShakingEffect.as
 */
export class RoomShakingEffect
{
    // AS3: RoomShakingEffect.as::STATE_NOT_INITIALIZED
    public static readonly STATE_NOT_INITIALIZED: number = 0;

    // AS3: RoomShakingEffect.as::STATE_START_DELAY
    public static readonly STATE_START_DELAY: number = 1;

    // AS3: RoomShakingEffect.as::STATE_RUNNING
    public static readonly STATE_RUNNING: number = 2;

    // AS3: RoomShakingEffect.as::STATE_OVER
    public static readonly STATE_OVER: number = 3;

    // AS3: RoomShakingEffect.as::_SafeStr_4597 (name derived: the state machine's state)
    private static _state: number = 0;

    // AS3: RoomShakingEffect.as::_SafeStr_7564 (name derived: read back by isVisualizationOn)
    private static _visualizationOn: boolean = false;

    // AS3: RoomShakingEffect.as::_SafeStr_8020 (name derived: progress through the run window; AS3
    // computes it but exposes no getter — kept so the state machine stays a faithful copy)
    private static _delta: number = 0;

    // AS3: RoomShakingEffect.as::_SafeStr_9464 (name derived: getTimer() stamp taken in init)
    private static _startTime: number = 0;

    // AS3: RoomShakingEffect.as::_SafeStr_7383 (name derived: delay before the effect runs)
    private static _delay: number = 20000;

    // AS3: RoomShakingEffect.as::_SafeStr_8014 (name derived: how long the effect runs)
    private static _duration: number = 5000;

    // AS3: RoomShakingEffect.as::_SafeStr_5723 (the flash Timer; a timeout handle here)
    private static _timer: ReturnType<typeof setTimeout> | null = null;

    // AS3: RoomShakingEffect.as::init()
    public static init(delay: number, duration: number): void
    {
        RoomShakingEffect._delta = 0;
        RoomShakingEffect._delay = delay;
        RoomShakingEffect._duration = duration;
        RoomShakingEffect._startTime = performance.now();
        RoomShakingEffect._state = RoomShakingEffect.STATE_START_DELAY;
    }

    // AS3: RoomShakingEffect.as::turnVisualizationOn()
    public static turnVisualizationOn(): void
    {
        if(RoomShakingEffect._state === RoomShakingEffect.STATE_NOT_INITIALIZED
            || RoomShakingEffect._state === RoomShakingEffect.STATE_OVER)
        {
            return;
        }

        // AS3 arms a one-shot Timer(_duration, 1) that force-stops the effect. Note it is armed
        // before the elapsed-time check below, so it is started even on the call that immediately
        // moves the state to OVER — preserved verbatim.
        if(RoomShakingEffect._timer === null)
        {
            RoomShakingEffect._timer = setTimeout(
                RoomShakingEffect.turnVisualizationOff,
                RoomShakingEffect._duration
            );
        }

        const elapsed = performance.now() - RoomShakingEffect._startTime;

        if(elapsed > RoomShakingEffect._delay + RoomShakingEffect._duration)
        {
            RoomShakingEffect._state = RoomShakingEffect.STATE_OVER;

            return;
        }

        RoomShakingEffect._visualizationOn = true;

        if(elapsed < RoomShakingEffect._delay)
        {
            RoomShakingEffect._state = RoomShakingEffect.STATE_START_DELAY;

            return;
        }

        RoomShakingEffect._state = RoomShakingEffect.STATE_RUNNING;
        RoomShakingEffect._delta = (elapsed - RoomShakingEffect._delay) / RoomShakingEffect._duration;
    }

    // AS3: RoomShakingEffect.as::turnVisualizationOff()
    public static turnVisualizationOff(): void
    {
        RoomShakingEffect._visualizationOn = false;

        if(RoomShakingEffect._timer !== null)
        {
            clearTimeout(RoomShakingEffect._timer);
            RoomShakingEffect._timer = null;
        }
    }

    // AS3: RoomShakingEffect.as::isVisualizationOn()
    public static isVisualizationOn(): boolean
    {
        return RoomShakingEffect._visualizationOn && RoomShakingEffect.isRunning();
    }

    // AS3: RoomShakingEffect.as::isRunning()
    private static isRunning(): boolean
    {
        return RoomShakingEffect._state === RoomShakingEffect.STATE_START_DELAY
            || RoomShakingEffect._state === RoomShakingEffect.STATE_RUNNING;
    }
}
