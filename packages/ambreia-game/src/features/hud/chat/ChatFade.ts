import type {IChatSettings} from '../../../ui/kit/chatModel';
import type {IFadeTimers} from './IFadeTimers';

/** How faint the chat gets when it hides for being idle: still there to find it again. */
export const IDLE_BLEND = 0.15;

const BROWSER_TIMERS: IFadeTimers = {
    set: (run, ms) => setTimeout(run, ms),
    clear: handle => clearTimeout(handle as ReturnType<typeof setTimeout>)
};

/** The chat fades out after its idle minutes without a line or a click (its settings), and comes back on the next one. */
export class ChatFade
{
    private _idle = false;
    private _timer: unknown = null;
    private _disposed = false;

    constructor(
        private readonly _settings: () => Readonly<IChatSettings>,
        private readonly _frame: () => {blend: number} | null,
        private readonly _timers: IFadeTimers = BROWSER_TIMERS
    ) {}

    /** The chat frame's blend: faint while idle, else the player's opacity. */
    blend(opacity: number): number
    {
        return this._idle ? IDLE_BLEND : opacity;
    }

    /** Something happened in the chat: it comes back if it had faded, and its idle clock restarts. */
    wake(): void
    {
        const settings = this._settings();

        if(this._timer !== null) this._timers.clear(this._timer);
        this._timer = null;

        if(this._idle)
        {
            this._idle = false;
            this.refresh();
        }

        if(!settings.hideIdle || this._disposed) return;

        this._timer = this._timers.set(() =>
        {
            this._idle = true;
            this.refresh();
        }, settings.idleMinutes * 60_000);
    }

    private refresh(): void
    {
        const frame = this._frame();

        if(frame) frame.blend = this.blend(this._settings().opacity);
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        if(this._timer !== null) this._timers.clear(this._timer);
        this._timer = null;
    }
}
