/**
 * RoomEnterEffect
 *
 * Static timer-driven dim/reveal effect used for the "new user" room-enter
 * tutorial moment: newly created room sprites are given a reduced alpha that
 * ramps back up to full over a short window after a start delay.
 *
 * @see sources/win63_version/room/utils/RoomEnterEffect.as
 */
export class RoomEnterEffect
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomEnterEffect.as::STATE_NOT_INITIALIZED
    public static readonly STATE_NOT_INITIALIZED: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomEnterEffect.as::STATE_START_DELAY
    public static readonly STATE_START_DELAY: number = 1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomEnterEffect.as::STATE_RUNNING
    public static readonly STATE_RUNNING: number = 2;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomEnterEffect.as::STATE_OVER
    public static readonly STATE_OVER: number = 3;

    private static _state: number = 0;
    private static _visualizationOn: boolean = false;
    private static _delta: number = 0;
    private static _startTime: number = 0;
    private static _delay: number = 20000;
    private static _duration: number = 2000;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomEnterEffect.as::init()
    public static init(delay: number, duration: number): void
    {
        RoomEnterEffect._delta = 0;
        RoomEnterEffect._delay = delay;
        RoomEnterEffect._duration = duration;
        RoomEnterEffect._startTime = performance.now();
        RoomEnterEffect._state = RoomEnterEffect.STATE_START_DELAY;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomEnterEffect.as::turnVisualizationOn()
    public static turnVisualizationOn(): void
    {
        if(RoomEnterEffect._state === RoomEnterEffect.STATE_NOT_INITIALIZED
			|| RoomEnterEffect._state === RoomEnterEffect.STATE_OVER)
        {
            return;
        }

        const elapsed = performance.now() - RoomEnterEffect._startTime;

        if(elapsed > RoomEnterEffect._delay + RoomEnterEffect._duration)
        {
            RoomEnterEffect._state = RoomEnterEffect.STATE_OVER;

            return;
        }

        RoomEnterEffect._visualizationOn = true;

        if(elapsed < RoomEnterEffect._delay)
        {
            RoomEnterEffect._state = RoomEnterEffect.STATE_START_DELAY;

            return;
        }

        RoomEnterEffect._state = RoomEnterEffect.STATE_RUNNING;
        RoomEnterEffect._delta = (elapsed - RoomEnterEffect._delay) / RoomEnterEffect._duration;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomEnterEffect.as::turnVisualizationOff()
    public static turnVisualizationOff(): void
    {
        RoomEnterEffect._visualizationOn = false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomEnterEffect.as::isVisualizationOn()
    public static isVisualizationOn(): boolean
    {
        return RoomEnterEffect._visualizationOn && RoomEnterEffect.isRunning();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomEnterEffect.as::isRunning()
    public static isRunning(): boolean
    {
        return RoomEnterEffect._state === RoomEnterEffect.STATE_START_DELAY
			|| RoomEnterEffect._state === RoomEnterEffect.STATE_RUNNING;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomEnterEffect.as::getDelta()
    public static getDelta(min: number = 0, max: number = 1): number
    {
        return Math.min(Math.max(RoomEnterEffect._delta, min), max);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomEnterEffect.as::get totalRunningTime()
    public static get totalRunningTime(): number
    {
        return RoomEnterEffect._delay + RoomEnterEffect._duration;
    }
}
