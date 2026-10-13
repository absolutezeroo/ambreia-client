import type {IWindow} from '@ambreia/ui/IWindow';

/** The HUD's popups (a menu, the emoticons, the chat settings): one open at a time. */
export class PopupSlot
{
    private _owner = '';
    private _window: IWindow | null = null;

    /**
     * Closes whatever is open; true when it was `owner`'s own popup, so that a button toggling its
     * popup leaves it closed.
     */
    closeFor(owner: string): boolean
    {
        const was = this._window !== null && this._owner === owner;

        this.close();

        return was;
    }

    /** `window` is now the open popup, `owner`'s. */
    hold(owner: string, window: IWindow): void
    {
        this.close();
        this._owner = owner;
        this._window = window;
    }

    close(): void
    {
        this._window?.destroy();
        this._window = null;
        this._owner = '';
    }
}
