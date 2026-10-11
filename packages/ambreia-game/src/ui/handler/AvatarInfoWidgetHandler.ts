/**
 * AvatarInfoWidgetHandler — the RWE_AVATAR_INFO handler, reduced to the name bubble's needs.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/AvatarInfoWidgetHandler.as
 *
 * AS3's handler feeds the avatar, pet and bot context menus: dance, posture, use-product, pet
 * status, toolbar clicks, custom notifications. Since the core cut (2026-10-07) the widget only
 * shows the name bubble, which listens to the desktop's selection events itself and asks
 * `ObjectLocationRequestHandler` where to stand, so this handler is the widget's link to its
 * container and nothing more. The git tag `pre-noyau-client` keeps the full handler.
 */
import type {IRoomWidgetHandler} from '../IRoomWidgetHandler';
import type {IRoomWidgetHandlerContainer} from '../IRoomWidgetHandlerContainer';
import type {IRoomWidget} from '../widget/IRoomWidget';

export class AvatarInfoWidgetHandler implements IRoomWidgetHandler
{
    // AS3: .../src/com/sulake/habbo/ui/handler/AvatarInfoWidgetHandler.as::_disposed
    private _disposed: boolean = false;
    // AS3: .../src/com/sulake/habbo/ui/handler/AvatarInfoWidgetHandler.as::_container
    private _container: IRoomWidgetHandlerContainer | null = null;
    private _widget: IRoomWidget | null = null;

    // AS3: AvatarInfoWidgetHandler.as::set widget()
    public set widget(value: IRoomWidget | null)
    {
        this._widget = value;
    }

    // AS3: AvatarInfoWidgetHandler.as::get type()
    public get type(): string
    {
        return 'RWE_AVATAR_INFO';
    }

    // DEVIATION: AS3's setter also subscribes to the toolbar, the friend list and two incoming
    //   messages for the menus; none of them exists since the core cut.
    // AS3: AvatarInfoWidgetHandler.as::set container() / get container()
    public set container(value: IRoomWidgetHandlerContainer | null)
    {
        this._container = value;
    }

    // AS3: .../src/com/sulake/habbo/ui/handler/AvatarInfoWidgetHandler.as::get container()
    public get container(): IRoomWidgetHandlerContainer | null
    {
        return this._container;
    }

    // DEVIATION: AS3 claims the dance, posture, use-product and pet messages its menus send.
    // AS3: AvatarInfoWidgetHandler.as::getWidgetMessages()
    public getWidgetMessages(): string[]
    {
        return [];
    }

    // DEVIATION: AS3 processes user-data, dance and pet session events for its menus.
    // AS3: AvatarInfoWidgetHandler.as::getProcessedEvents()
    public getProcessedEvents(): string[]
    {
        return [];
    }

    // AS3: AvatarInfoWidgetHandler.as::processWidgetMessage()
    public processWidgetMessage(_message: unknown): null
    {
        return null;
    }

    // AS3: AvatarInfoWidgetHandler.as::processEvent()
    public processEvent(_event: unknown): void
    {
    }

    // AS3: AvatarInfoWidgetHandler.as::update()
    public update(): void
    {
    }

    // AS3: AvatarInfoWidgetHandler.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: AvatarInfoWidgetHandler.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._widget = null;
        this._container = null;
    }
}
