/**
 * RoomRotatingEffect
 *
 * Static state machine for the "room spins" special event effect. Identical in AS3 to
 * RoomShakingEffect apart from the class name — the two are separate so a room can be shaking and
 * rotating independently. The renderer polls isVisualizationOn() every frame.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomRotatingEffect.as
 */
export class RoomRotatingEffect
{
    // AS3: RoomRotatingEffect.as::STATE_NOT_INITIALIZED
    public static readonly STATE_NOT_INITIALIZED: number = 0;

    // AS3: RoomRotatingEffect.as::STATE_START_DELAY
    public static readonly STATE_START_DELAY: number = 1;

    // AS3: RoomRotatingEffect.as::STATE_RUNNING
    public static readonly STATE_RUNNING: number = 2;

    // AS3: RoomRotatingEffect.as::STATE_OVER
    public static readonly STATE_OVER: number = 3;

    // AS3: RoomRotatingEffect.as::_SafeStr_4597 (name derived: the state machine's state)
    private static _state: number = 0;

    // AS3: RoomRotatingEffect.as::_SafeStr_7564 (name derived: read back by isVisualizationOn)
    private static _visualizationOn: boolean = false;

    // AS3: RoomRotatingEffect.as::_SafeStr_8020 (name derived: progress through the run window; AS3
    // computes it but exposes no getter — kept so the state machine stays a faithful copy)
    private static _delta: number = 0;

    // AS3: RoomRotatingEffect.as::_SafeStr_9464 (name derived: getTimer() stamp taken in init)
    private static _startTime: number = 0;

    // AS3: RoomRotatingEffect.as::_SafeStr_7383 (name derived: delay before the effect runs)
    private static _delay: number = 20000;

    // AS3: RoomRotatingEffect.as::_SafeStr_8014 (name derived: how long the effect runs)
    private static _duration: number = 5000;

    // AS3: RoomRotatingEffect.as::_SafeStr_5723 (the flash Timer; a timeout handle here)
    private static _timer: ReturnType<typeof setTimeout> | null = null;

    // AS3: RoomRotatingEffect.as::init()
    public static init(delay: number, duration: number): void
    {
        RoomRotatingEffect._delta = 0;
        RoomRotatingEffect._delay = delay;
        RoomRotatingEffect._duration = duration;
        RoomRotatingEffect._startTime = performance.now();
        RoomRotatingEffect._state = RoomRotatingEffect.STATE_START_DELAY;
    }

    // AS3: RoomRotatingEffect.as::turnVisualizationOn()
    public static turnVisualizationOn(): void
    {
        if(RoomRotatingEffect._state === RoomRotatingEffect.STATE_NOT_INITIALIZED
            || RoomRotatingEffect._state === RoomRotatingEffect.STATE_OVER)
        {
            return;
        }

        // AS3 arms a one-shot Timer(_duration, 1) that force-stops the effect. Note it is armed
        // before the elapsed-time check below, so it is started even on the call that immediately
        // moves the state to OVER — preserved verbatim.
        if(RoomRotatingEffect._timer === null)
        {
            RoomRotatingEffect._timer = setTimeout(
                RoomRotatingEffect.turnVisualizationOff,
                RoomRotatingEffect._duration
            );
        }

        const elapsed = performance.now() - RoomRotatingEffect._startTime;

        if(elapsed > RoomRotatingEffect._delay + RoomRotatingEffect._duration)
        {
            RoomRotatingEffect._state = RoomRotatingEffect.STATE_OVER;

            return;
        }

        RoomRotatingEffect._visualizationOn = true;

        if(elapsed < RoomRotatingEffect._delay)
        {
            RoomRotatingEffect._state = RoomRotatingEffect.STATE_START_DELAY;

            return;
        }

        RoomRotatingEffect._state = RoomRotatingEffect.STATE_RUNNING;
        RoomRotatingEffect._delta = (elapsed - RoomRotatingEffect._delay) / RoomRotatingEffect._duration;
    }

    // AS3: RoomRotatingEffect.as::turnVisualizationOff()
    public static turnVisualizationOff(): void
    {
        RoomRotatingEffect._visualizationOn = false;

        if(RoomRotatingEffect._timer !== null)
        {
            clearTimeout(RoomRotatingEffect._timer);
            RoomRotatingEffect._timer = null;
        }
    }

    // AS3: RoomRotatingEffect.as::isVisualizationOn()
    public static isVisualizationOn(): boolean
    {
        return RoomRotatingEffect._visualizationOn && RoomRotatingEffect.isRunning();
    }

    // AS3: RoomRotatingEffect.as::isRunning()
    private static isRunning(): boolean
    {
        return RoomRotatingEffect._state === RoomRotatingEffect.STATE_START_DELAY
            || RoomRotatingEffect._state === RoomRotatingEffect.STATE_RUNNING;
    }
}
