import type {IRoomWidgetHandler} from '../IRoomWidgetHandler';
import type {IRoomWidgetHandlerContainer} from '../IRoomWidgetHandlerContainer';
import type {RoomWidgetMessage} from '../widget/messages/RoomWidgetMessage';
import type {RoomWidgetUpdateEvent} from '../widget/events/RoomWidgetUpdateEvent';
import {RoomWidgetScriptProceedMessage} from '../widget/messages/RoomWidgetScriptProceedMessage';

/**
 * The help-bubble tour's only server-facing act: telling a script it may proceed once the user has
 * dismissed the last bubble.
 *
 * Everything else about this widget travels over link events, not room events — see
 * `UiHelpBubblesWidget`, which registers itself as an `ILinkEventTracker`. That is why this
 * handler processes no engine events at all.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/UiHelpBubbleWidgetHandler.as
 */
export class UiHelpBubbleWidgetHandler implements IRoomWidgetHandler
{
    // AS3: .../handler/UiHelpBubbleWidgetHandler.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../handler/UiHelpBubbleWidgetHandler.as::_container
    private _container: IRoomWidgetHandlerContainer | null = null;

    // AS3: .../handler/UiHelpBubbleWidgetHandler.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    /**
     * Returns **"RWE_ROOM_POLL"**, not "RWE_UI_HELP_BUBBLE". That is AS3's own copy-paste, kept
     * verbatim — `FriendRequestWidgetHandler` returns the same string, and so did AS3's poll widget
     * handler, which the RPG fork removed with polls.
     *
     * It is harmless because `type` is only used to route `RETWE_OPEN_WIDGET`/`RETWE_CLOSE_WIDGET`
     * to a single handler, and this one's `processEvent()` is empty; the widget itself is filed
     * under the name passed to `createWidget()`, which *is* "RWE_UI_HELP_BUBBLE". Correcting it
     * would be a behaviour change, not a port — an open/close event aimed at "RWE_ROOM_POLL" would
     * stop reaching a handler that currently receives and ignores it.
     */
    // AS3: .../handler/UiHelpBubbleWidgetHandler.as::get type()
    get type(): string
    {
        return 'RWE_ROOM_POLL';
    }

    // AS3: .../handler/UiHelpBubbleWidgetHandler.as::get container()
    // AS3 declares only the setter; the getter is on IRoomWidgetHandler and every sibling has one.
    get container(): IRoomWidgetHandlerContainer | null
    {
        return this._container;
    }

    // AS3: .../handler/UiHelpBubbleWidgetHandler.as::set container()
    set container(value: IRoomWidgetHandlerContainer | null)
    {
        this._container = value;
    }

    /**
     * `RWPM_ANSWER` is the **same string** AS3's poll answer message uses, so in AS3 both handlers
     * are called for it and each is disambiguated only by its own cast failing. The RPG fork
     * removed polls, so this handler is now the only one; the cast below stays as AS3 wrote it.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/UiHelpBubbleWidgetHandler.as::getWidgetMessages()
    getWidgetMessages(): string[] | null
    {
        return [RoomWidgetScriptProceedMessage.ANSWER];
    }

    // AS3: .../handler/UiHelpBubbleWidgetHandler.as::processWidgetMessage()
    processWidgetMessage(message: RoomWidgetMessage): RoomWidgetUpdateEvent | null
    {
        if(!(message instanceof RoomWidgetScriptProceedMessage)) return null;

        if(message.type === RoomWidgetScriptProceedMessage.ANSWER)
        {
            this._container?.roomSession?.sendScriptProceed();
        }

        return null;
    }

    /**
     * AS3 lists `RWPM_ANSWER` here too — a widget *message* type in the engine-event list. Nothing
     * emits it as an event, so the registration is inert; kept because removing it would be a
     * judgement call about AS3's intent rather than a port of what it does.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/UiHelpBubbleWidgetHandler.as::getProcessedEvents()
    getProcessedEvents(): string[] | null
    {
        return [RoomWidgetScriptProceedMessage.ANSWER];
    }

    // AS3: .../handler/UiHelpBubbleWidgetHandler.as::processEvent()
    // Empty in AS3 too — this widget is driven by link events, not engine events.
    processEvent(_event: unknown): void
    {
    }

    // AS3: .../handler/UiHelpBubbleWidgetHandler.as::update()
    // Empty in AS3 too.
    update(): void
    {
    }

    // AS3: .../handler/UiHelpBubbleWidgetHandler.as::dispose()
    dispose(): void
    {
        this._disposed = true;
        this._container = null;
    }
}
