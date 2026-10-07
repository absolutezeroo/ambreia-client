import type {IRoomWidgetHandler} from '../IRoomWidgetHandler';
import type {IRoomWidgetHandlerContainer} from '../IRoomWidgetHandlerContainer';
import type {RoomWidgetMessage} from '../widget/messages/RoomWidgetMessage';
import type {RoomWidgetUpdateEvent} from '../widget/events/RoomWidgetUpdateEvent';
import type {IRoomEngineRectangle} from '../../room/RoomEngine';
import {RoomObjectCategoryEnum} from '@ambreia/iso/scene/object/RoomObjectCategoryEnum';
import {RoomWidgetGetObjectLocationMessage} from '../widget/messages/RoomWidgetGetObjectLocationMessage';
import {RoomWidgetUserLocationUpdateEvent} from '../widget/events/RoomWidgetUserLocationUpdateEvent';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.ui.handler.ObjectLocationRequestHandler');

/**
 * Answers "where is this object on screen?" — the one handler whose whole job is a synchronous
 * return value rather than a dispatch.
 *
 * It is also the only handler whose `type` is **null**: it is created for `RWE_LOCATION_WIDGET`
 * but never identifies itself, so it can never be the target of an open/close-widget event. It
 * has no widget either — the factory has no case for that type in AS3 — which is why the handler
 * has to survive `createWidget()` returning null.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ObjectLocationRequestHandler.as
 */
export class ObjectLocationRequestHandler implements IRoomWidgetHandler
{
    // AS3: .../handler/ObjectLocationRequestHandler.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../handler/ObjectLocationRequestHandler.as::_container
    private _container: IRoomWidgetHandlerContainer | null = null;

    // AS3: .../handler/ObjectLocationRequestHandler.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../handler/ObjectLocationRequestHandler.as::get type()
    // Null in AS3, and kept null here — see the class note.
    get type(): string
    {
        return null as unknown as string;
    }

    // AS3: .../handler/ObjectLocationRequestHandler.as::set container()
    set container(value: IRoomWidgetHandlerContainer | null)
    {
        this._container = value;
    }

    // AS3: .../handler/ObjectLocationRequestHandler.as::getWidgetMessages()
    getWidgetMessages(): string[]
    {
        return [
            RoomWidgetGetObjectLocationMessage.GET_OBJECT_LOCATION,
            RoomWidgetGetObjectLocationMessage.GET_GAME_OBJECT_LOCATION
        ];
    }

    /**
     * The two cases differ only in how the room object is identified: a user is looked up by
     * (webId, type) through the user-data manager to get its room index, while a game object is
     * addressed by room index directly.
     *
     * Both offset the results by the room view's origin, so the caller gets coordinates it can
     * place a window at. AS3 builds the event even when the user is not in the room, leaving both
     * fields null — the caller reads the rectangle to tell that apart, not the event.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ObjectLocationRequestHandler.as::processWidgetMessage()
    processWidgetMessage(message: RoomWidgetMessage): RoomWidgetUpdateEvent | null
    {
        if(this._container === null) return null;

        if(!(message instanceof RoomWidgetGetObjectLocationMessage)) return null;

        const session = this._container.roomSession;

        let rectangle: IRoomEngineRectangle | null = null;
        let screenLocation: {x: number; y: number} | null = null;

        switch(message.type)
        {
            case RoomWidgetGetObjectLocationMessage.GET_OBJECT_LOCATION:
            {
                if(session === null || session.userDataManager === null) return null;

                const userData = session.userDataManager.getUserDataByType(message.objectId, message.objectType);

                if(userData !== null)
                {
                    [rectangle, screenLocation] = this.locate(session.roomId, userData.roomObjectId);
                }

                this.reportMiss(message, userData, screenLocation, session.roomId);

                break;
            }

            case RoomWidgetGetObjectLocationMessage.GET_GAME_OBJECT_LOCATION:
                // AS3 does not null-check the session on this branch; the port does, because the
                // room id read would throw rather than return an empty answer.
                if(session === null) return null;

                [rectangle, screenLocation] = this.locate(session.roomId, message.objectId);

                break;

            default:
                return null;
        }

        return new RoomWidgetUserLocationUpdateEvent(message.objectId, rectangle, screenLocation);
    }

    // AS3: .../handler/ObjectLocationRequestHandler.as::processWidgetMessage()
    // The two branches' shared tail, which AS3 writes out twice. The offset is applied only when
    // all three parts are present, as there.
    private locate(roomId: number, roomIndex: number): [IRoomEngineRectangle | null, {x: number; y: number} | null]
    {
        const engine = this._container?.roomEngine ?? null;

        if(engine === null) return [null, null];

        const canvasId = this._container?.getFirstCanvasId() ?? 1;
        const category = RoomObjectCategoryEnum.OBJECT_CATEGORY_USER;

        const rectangle = engine.getRoomObjectBoundingRectangle(roomId, roomIndex, category, canvasId);
        const screenLocation = engine.getRoomObjectScreenLocation(roomId, roomIndex, category, canvasId);
        const viewRect = this._container?.getRoomViewRect() ?? null;

        if(rectangle === null || viewRect === null || screenLocation === null)
        {
            return [rectangle, screenLocation];
        }

        // AS3 mutates the Rectangle and Point in place with offset(); these are plain objects
        // here, so the shifted copies are built instead.
        return [
            {
                left: rectangle.left + viewRect.x,
                top: rectangle.top + viewRect.y,
                right: rectangle.right + viewRect.x,
                bottom: rectangle.bottom + viewRect.y,
                width: rectangle.width,
                height: rectangle.height
            },
            {x: screenLocation.x + viewRect.x, y: screenLocation.y + viewRect.y}
        ];
    }

    // TS-only: rate limit for reportMiss() below — one line per (type, id, cause), not per frame.
    private static readonly REPORTED_MISSES: Set<string> = new Set();

    /**
     * Says which half of the lookup came back empty, once per object.
     *
     * `AvatarInfoWidget.reportUnlocatable()` can only say "no screenLocation", because that is all
     * the event carries — and the two causes need opposite fixes. Either the web id is not (or no
     * longer) in this room's `userDataManager`, which means the view outlived the user data that
     * created it, or the user *is* known and the engine has nothing on screen for its room object,
     * which points at the object id or the canvas. AS3 has no counterpart; it never reports either.
     */
    // TS-only: diagnostic; the AS3 handler is silent on both cases.
    private reportMiss(
        message: RoomWidgetGetObjectLocationMessage,
        userData: {name: string; roomObjectId: number} | null,
        screenLocation: {x: number; y: number} | null,
        roomId: number
    ): void
    {
        if(screenLocation !== null) return;

        const key = `${message.objectType}:${message.objectId}:${userData === null ? 'nodata' : 'noscreen'}`;

        if(ObjectLocationRequestHandler.REPORTED_MISSES.has(key)) return;

        ObjectLocationRequestHandler.REPORTED_MISSES.add(key);

        if(userData === null)
        {
            log.warn(
                `No user data for webId ${message.objectId} (type ${message.objectType}) in room ${roomId}: `
				+ 'the view asking for this location outlived the user it was made for.'
            );

            return;
        }

        log.warn(
            `"${userData.name}" (webId ${message.objectId}) is in userDataManager with roomObjectId `
			+ `${userData.roomObjectId}, but room ${roomId} has no screen location for it on canvas `
			+ `${this._container?.getFirstCanvasId() ?? -1}.`
        );
    }

    // AS3: .../handler/ObjectLocationRequestHandler.as::getProcessedEvents()
    // Empty: it answers messages and listens to nothing.
    getProcessedEvents(): string[]
    {
        return [];
    }

    // AS3: .../handler/ObjectLocationRequestHandler.as::processEvent()
    // Empty in AS3 too.
    processEvent(_event: unknown): void
    {
    }

    // AS3: .../handler/ObjectLocationRequestHandler.as::update()
    // Empty in AS3 too.
    update(): void
    {
    }

    // AS3: .../handler/ObjectLocationRequestHandler.as::dispose()
    dispose(): void
    {
        this._disposed = true;
        this._container = null;
    }
}
