/**
 * RoomWidgetFactory
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetFactory.as
 *
 * Since the core cut (2026-10-07) only two room widgets remain: the name bubble above avatars
 * (RWE_AVATAR_INFO) and the room loading bar (RWE_LOADINGBAR). Every other AS3 `RWE_*` case built
 * a hotel feature the server no longer serves; the git tag `pre-noyau-client` keeps them.
 */
import {Logger} from '@core/utils/Logger';
import type {IRoomWidgetFactory} from './IRoomWidgetFactory';
import type {IRoomWidgetHandler} from './IRoomWidgetHandler';
import type {RoomUI} from './RoomUI';
import {AvatarInfoWidget} from './widget/avatarinfo/AvatarInfoWidget';
import {LoadingBarWidget} from './widget/loadingbar/LoadingBarWidget';

const log = Logger.getLogger('habbo.ui.RoomWidgetFactory');

export class RoomWidgetFactory implements IRoomWidgetFactory
{
    // AS3: .../src/com/sulake/habbo/ui/widget/RoomWidgetFactory.as::_roomUI
    private _roomUI: RoomUI;
    private _disposed: boolean = false;

    constructor(roomUI: RoomUI)
    {
        this._roomUI = roomUI;
    }

    // DEVIATION: AS3 builds ~40 widget kinds here; after the core cut only the name bubble and the
    //   loading bar are left, and any other type answers null (logged).
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetFactory.as::createWidget()
    public createWidget(type: string, handler: IRoomWidgetHandler): unknown | null
    {
        if(!this._roomUI || !this._roomUI.windowManager) return null;

        switch(type)
        {
            case 'RWE_AVATAR_INFO':
                return new AvatarInfoWidget(
                    handler, this._roomUI.windowManager, this._roomUI.assets,
                    this._roomUI.localization, this._roomUI.config
                );
            // AS3: RoomWidgetFactory.as::createWidget() "RWE_LOADINGBAR"
            case 'RWE_LOADINGBAR':
                return new LoadingBarWidget(
                    handler,
                    this._roomUI.windowManager,
                    this._roomUI.assets,
                    this._roomUI.localization,
                    this._roomUI.config
                );
            default:
                log.debug(`Widget creation requested: ${type} (not built since the core cut — returning null)`);

                return null;
        }
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/RoomWidgetFactory.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/RoomWidgetFactory.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._roomUI = null!;
    }
}
