import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IRoomWidgetHandler} from '@habbo/ui/IRoomWidgetHandler';
import type {IRoomWidgetHandlerContainer} from '@habbo/ui/IRoomWidgetHandlerContainer';
import type {RoomDesktop} from '@habbo/ui/RoomDesktop';
import type {RoomThumbnailCameraWidget} from '@habbo/ui/widget/camera/RoomThumbnailCameraWidget';
import {ThumbnailStatusMessageEvent} from '@habbo/communication/messages/incoming/camera/ThumbnailStatusMessageEvent';
import type {ThumbnailStatusMessageParser} from '@habbo/communication/messages/parser/camera/ThumbnailStatusMessageParser';
import type {RenderRoomThumbnailMessageComposer} from '@habbo/communication/messages/outgoing/camera/RenderRoomThumbnailMessageComposer';

/**
 * Wires the room-thumbnail camera to its single incoming message.
 *
 * `ThumbnailStatus` destroys the widget window first and only then reports — so the result alert
 * appears over the room, not over a dead camera.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomThumbnailCameraWidgetHandler.as
 */
export class RoomThumbnailCameraWidgetHandler implements IRoomWidgetHandler
{
    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::_container
    private _container: IRoomWidgetHandlerContainer | null = null;

    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::_SafeStr_5844
    private _roomDesktop: RoomDesktop | null;

    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::_SafeStr_4549
    private _widget: RoomThumbnailCameraWidget | null = null;

    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::_SafeStr_7574
    private _thumbnailStatusEvent: ThumbnailStatusMessageEvent | null = null;

    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::RoomThumbnailCameraWidgetHandler()
    constructor(roomDesktop: RoomDesktop | null)
    {
        this._roomDesktop = roomDesktop;
    }

    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::get roomDesktop()
    get roomDesktop(): RoomDesktop | null
    {
        return this._roomDesktop;
    }

    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::getProcessedEvents()
    getProcessedEvents(): string[]
    {
        return [];
    }

    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::getWidgetMessages()
    getWidgetMessages(): string[] | null
    {
        return null;
    }

    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::processWidgetMessage()
    processWidgetMessage(_message: unknown): unknown
    {
        return null;
    }

    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::set widget()
    set widget(value: RoomThumbnailCameraWidget | null)
    {
        this._widget = value;
    }

    /**
	 * AS3 subscribes here and never unsubscribes on a container swap — only `dispose()` removes the
	 * event. Kept, but the event is created once so a second container cannot double-register it.
	 */
    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::set container()
    set container(value: IRoomWidgetHandlerContainer | null)
    {
        this._container = value;

        if(this._thumbnailStatusEvent === null)
        {
            this._thumbnailStatusEvent = new ThumbnailStatusMessageEvent(this.onThumbnailStatus);
        }

        this._container?.connection?.addMessageEvent(this._thumbnailStatusEvent);
    }

    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::get container()
    get container(): IRoomWidgetHandlerContainer | null
    {
        return this._container;
    }

    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::dispose()
    dispose(): void
    {
        if(this._container && this._container.connection && this._thumbnailStatusEvent)
        {
            this._container.connection.removeMessageEvent(this._thumbnailStatusEvent);
        }
    }

    /**
	 * AS3 returns a literal `false` — this handler is never treated as disposed, which is why
	 * `dispose()` above does not set a flag either.
	 */
    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::get disposed()
    get disposed(): boolean
    {
        return false;
    }

    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::processEvent()
    processEvent(_event: unknown): void
    {
    }

    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::update()
    update(): void
    {
    }

    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::get type()
    get type(): string
    {
        return 'RWE_ROOM_THUMBNAIL_CAMERA';
    }

    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::collectPhotoData()
    collectPhotoData(): RenderRoomThumbnailMessageComposer | null
    {
        if(this._roomDesktop === null || this._widget === null)
        {
            return null;
        }

        // The `true` selects the thumbnail composer, which packs in its constructor. Header 1985 is
        // the one the emulator answers on, and the picture it stores is what every listing of this
        // room then shows — `navigator.thumbnail.url_base` + the room id + `.png`.
        return this._roomDesktop.roomEngine?.getRenderRoomMessage(
            this._widget.viewPort,
            this._roomDesktop.roomBackgroundColor,
            true
        ) as RenderRoomThumbnailMessageComposer | null ?? null;
    }

    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::sendPhotoData()
    sendPhotoData(message: RenderRoomThumbnailMessageComposer): void
    {
        this._container?.connection?.send(message);
    }

    // AS3: .../ui/handler/RoomThumbnailCameraWidgetHandler.as::onThumbnailStatus()
    private onThumbnailStatus = (event: IMessageEvent): void =>
    {
        const parser = event.parser as ThumbnailStatusMessageParser;

        this._widget?.destroy();

        if(parser.isOk())
        {
            this._container?.windowManager?.alert(
                '${navigator.thumbnail.camera.title}',
                '${navigator.thumbnail.camera.success}',
                16,
                null
            );
        }
        else if(parser.isRenderLimitHit())
        {
            this._container?.windowManager?.alert(
                '${generic.alert.title}',
                '${camera.render.count.info}',
                0,
                null
            );
        }
    };
}
