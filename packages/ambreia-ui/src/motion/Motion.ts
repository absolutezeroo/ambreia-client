import type {IWindow} from '../IWindow';

/**
 * Base motion class for window animations.
 *
 * In AS3 this used a `friend` namespace for start/stop/update/tick methods.
 * In TypeScript these are public methods managed by the {@link Motions} scheduler.
 * Subclasses override update() to apply per-frame changes to the target window.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/motion/Motion.as
 */
export class Motion
{
    constructor(target: IWindow | null)
    {
        this._target = target;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/motion/Motion.as::_target
    protected _target: IWindow | null;

    // AS3: .../src/com/sulake/core/window/motion/Motion.as::get target()
    public get target(): IWindow | null
    {
        return this._target;
    }

    // AS3: .../src/com/sulake/core/window/motion/Motion.as::set target()
    public set target(value: IWindow | null)
    {
        this._target = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/motion/Motion.as::_running
    protected _running: boolean = false;

    // AS3: .../src/com/sulake/core/window/motion/Motion.as::get running()
    public get running(): boolean
    {
        return this._running && this._target !== null && !this._target.disposed;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/motion/Motion.as::_complete
    protected _complete: boolean = true;

    // AS3: .../src/com/sulake/core/window/motion/Motion.as::get complete()
    public get complete(): boolean
    {
        return this._complete;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/motion/Motion.as::_tag
    protected _tag: string = '';

    // AS3: .../src/com/sulake/core/window/motion/Motion.as::get tag()
    public get tag(): string
    {
        return this._tag;
    }

    // AS3: .../src/com/sulake/core/window/motion/Motion.as::set tag()
    public set tag(value: string)
    {
        this._tag = value;
    }

    // AS3: .../src/com/sulake/core/window/motion/Motion.as::start()
    public start(): void
    {
        this._running = true;
    }

    // AS3: .../src/com/sulake/core/window/motion/Motion.as::update()
    public update(_progress: number): void
    {
    }

    // AS3: .../src/com/sulake/core/window/motion/Motion.as::stop()
    public stop(): void
    {
        this._target = null;
        this._running = false;
    }

    // AS3: .../src/com/sulake/core/window/motion/Motion.as::tick()
    public tick(_timestamp: number): void
    {
    }
}
