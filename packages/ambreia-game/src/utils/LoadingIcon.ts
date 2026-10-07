import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IIconWindow} from '@ambreia/ui/components/IIconWindow';

/**
 * LoadingIcon — a small spinner helper that cycles an IIconWindow through four asset frames on a timer
 * while a request is in flight. setVisible(icon, true) starts the animation and shows the icon;
 * setVisible(icon, false) stops and hides it.
 *
 * Port note: flash Timer → setInterval; `disposed` is tracked with an explicit flag (AS3 keys it off
 * the timer being null, which would also read true while merely stopped — the flag is equivalent and
 * clearer).
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/LoadingIcon.as
 */
export class LoadingIcon implements IDisposable
{
    // AS3: LoadingIcon.as::FRAMES
    private static readonly FRAMES: number[] = [23, 24, 25, 26];

    // AS3: LoadingIcon.as::_SafeStr_4902 (name derived: 160ms frame timer interval)
    private static readonly INTERVAL_MS: number = 160;

    // AS3: LoadingIcon.as::_SafeStr_4902 (name derived: the frame timer)
    private _timer: ReturnType<typeof setInterval> | null = null;

    // AS3: LoadingIcon.as::_icon
    private _icon: IIconWindow | null = null;

    // AS3: LoadingIcon.as::_SafeStr_6373 (name derived: current frame index)
    private _frame: number = 0;

    // AS3: LoadingIcon.as::_disposed (port-only explicit flag; see class note)
    private _disposed: boolean = false;

    // AS3: LoadingIcon.as::setVisible()
    setVisible(icon: IIconWindow, visible: boolean): void
    {
        this._icon = icon;

        if(this._icon == null)
        {
            return;
        }

        this._icon.visible = visible;

        if(visible)
        {
            this._icon.style = LoadingIcon.FRAMES[this._frame];
            this.start();
        }
        else
        {
            this.stop();
        }
    }

    // AS3: LoadingIcon.as::onTimer()
    private onTimer(): void
    {
        if(this._icon == null)
        {
            return;
        }

        this._frame += 1;

        if(this._frame >= LoadingIcon.FRAMES.length)
        {
            this._frame = 0;
        }

        this._icon.style = LoadingIcon.FRAMES[this._frame];
    }

    private start(): void
    {
        if(this._timer == null)
        {
            this._timer = setInterval(() => this.onTimer(), LoadingIcon.INTERVAL_MS);
        }
    }

    private stop(): void
    {
        if(this._timer != null)
        {
            clearInterval(this._timer);
            this._timer = null;
        }
    }

    // AS3: LoadingIcon.as::dispose()
    dispose(): void
    {
        this.stop();
        this._icon = null;
        this._disposed = true;
    }

    // AS3: LoadingIcon.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }
}
