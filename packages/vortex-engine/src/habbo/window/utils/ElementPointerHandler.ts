import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import {ElementPointerMessageEvent} from '@habbo/communication/messages/incoming/notifications/ElementPointerMessageEvent';

/**
 * Handles element pointer (hint) messages from the server.
 *
 * Listens for ElementPointerMessageEvent and delegates to the window
 * manager's hint API to show or hide element pointers. When the server
 * sends a key, the handler shows the corresponding hint; when the key
 * is null or empty, the handler hides the current hint.
 *
 * @see sources/win63_version/habbo/window/utils/ElementPointerHandler.as
 */
export class ElementPointerHandler
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ElementPointerHandler.as::_windowManager
    private _windowManager: IHabboWindowManager | null;

    // AS3: sources/win63_version/habbo/window/utils/ElementPointerHandler.as::var_3740
    private _event: IMessageEvent | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ElementPointerHandler.as::ElementPointerHandler()
    constructor(windowManager: IHabboWindowManager)
    {
        this._windowManager = windowManager;

        if(this._windowManager.communication !== null)
        {
            this._event = new ElementPointerMessageEvent((e) => this.onElementPointerMessage(e as ElementPointerMessageEvent));
            this._windowManager.communication.addHabboConnectionMessageEvent(this._event);
        }
    }

    // Derived name: `disposed` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/win63_version/habbo/window/utils/ElementPointerHandler.as::get disposed()
    public get disposed(): boolean
    {
        return this._windowManager === null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ElementPointerHandler.as::onElementPointerMessage()
    private onElementPointerMessage(event: ElementPointerMessageEvent): void
    {
        if(!this._windowManager) return;

        const key = event.key;

        if(!key || key.length === 0)
        {
            this._windowManager.hideHint();
        }
        else
        {
            this._windowManager.showHint(key);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ElementPointerHandler.as::dispose()
    public dispose(): void
    {
        if(this._windowManager?.communication && this._event !== null)
        {
            this._windowManager.communication.removeHabboConnectionMessageEvent(this._event);
            this._event = null;
        }

        this._windowManager = null;
    }
}
