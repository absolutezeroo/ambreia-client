/**
 * FurnitureLogic
 *
 * Based on AS3: com.sulake.habbo.room.object.logic.furniture.FurnitureLogic
 *
 * Base logic class for furniture objects.
 */
import type {RoomObjectUpdateMessage} from '@room/messages/RoomObjectUpdateMessage';
import {RoomObjectVariableEnum} from '@habbo/room/object/RoomObjectVariableEnum';
import type {IRoomObjectController} from '@room/object/IRoomObjectController';
import type {IRoomGeometry} from '@room/utils/IRoomGeometry';
import type {IVector3d} from '@room/utils/IVector3d';
import {Vector3d} from '@room/utils/Vector3d';
import type {RoomSpriteMouseEvent} from '@room/events/RoomSpriteMouseEvent';
import {RoomObjectMouseEvent} from '@room/events/RoomObjectMouseEvent';
import {MovingObjectLogic} from '../MovingObjectLogic';
import {RoomObjectStateChangeEvent} from '@habbo/room/events/RoomObjectStateChangeEvent';
import {RoomObjectWidgetRequestEvent} from '@habbo/room/events/RoomObjectWidgetRequestEvent';
import {RoomObjectRoomAdEvent} from '@habbo/room/events/RoomObjectRoomAdEvent';
import type {RoomObjectDataUpdateMessage} from '@habbo/room/messages/RoomObjectDataUpdateMessage';
import type {RoomObjectHeightUpdateMessage} from '@habbo/room/messages/RoomObjectHeightUpdateMessage';
import type {RoomObjectSelectedMessage} from '@habbo/room/messages/RoomObjectSelectedMessage';

export class FurnitureLogic extends MovingObjectLogic
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureLogic.as::BOUNCE_STEPS
    private static readonly BOUNCE_STEPS = 8;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureLogic.as::BOUNCE_STEP_HEIGHT
    private static readonly BOUNCE_STEP_HEIGHT = 0.0625;
    // AS3's update(k) advances _bouncingStep once per call with no internal throttle - real
    // AS3's engine tick itself ran at a fixed, much lower rate than this port's raw
    // requestAnimationFrame-driven ticker. FurnitureVisualization.ts already self-throttles to
    // 41ms (~24fps) to reproduce the original sprite-update cadence; the bounce step advance
    // needs the same compensating throttle or it completes ~2-3x too fast on a 60fps+ display.
    private static readonly BOUNCE_UPDATE_INTERVAL = 41;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureLogic.as::_mouseOver
    private _mouseOver: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureLogic.as::_sizeX
    private _sizeX: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureLogic.as::_sizeY
    private _sizeY: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureLogic.as::_sizeZ
    private _sizeZ: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureLogic.as::_centerX
    private _centerX: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureLogic.as::_centerY
    private _centerY: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureLogic.as::_centerZ
    private _centerZ: number = 0;
    private _hasLocation: boolean = false;
    private _bounceStep: number = 0;
    private _lastBounceUpdateTime: number = -Infinity;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureLogic.as::_storedRotateMessage
    private _storedRotateMessage: RoomObjectUpdateMessage | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureLogic.as::_locationOffset
    private _locationOffset: Vector3d = new Vector3d();
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureLogic.as::_directions
    private _directions: number[] = [];
    private _widget: string | null = null;

    override get widget(): string | null
    {
        return this._widget;
    }

    private _contextMenu: string | null = null;

    override get contextMenu(): string | null
    {
        return this._contextMenu;
    }

    override get object(): IRoomObjectController | null
    {
        return super.object;
    }

    override set object(value: IRoomObjectController | null)
    {
        super.object = value;

        if(value !== null && value.getLocation().length > 0)
        {
            this._hasLocation = true;
        }
    }

    protected set widgetType(value: string | null)
    {
        this._widget = value;
    }

    protected set contextMenuType(value: string | null)
    {
        this._contextMenu = value;
    }

    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectRoomAdEvent.ROOM_AD_TOOLTIP_SHOW,
            RoomObjectRoomAdEvent.ROOM_AD_TOOLTIP_HIDE,
            RoomObjectRoomAdEvent.ROOM_AD_FURNI_DOUBLE_CLICK,
            RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE,
            RoomObjectMouseEvent.ROE_MOUSE_CLICK,
            RoomObjectRoomAdEvent.ROOM_AD_FURNI_CLICK,
            RoomObjectMouseEvent.ROE_MOUSE_DOWN
        ];

        // AS3 reads the `widget`/`contextMenu` **getters**, not the backing fields. Subclasses
        // that override the getter (FurnitureMysterboxLogic returns "MYSTERY_BOX", and every other
        // context-menu logic does the same) never touch `contextMenuType`, so reading the field
        // here silently dropped their two event types — and with them the whole context menu.
        if(this.widget !== null)
        {
            types.push(RoomObjectWidgetRequestEvent.ROWRE_OPEN_WIDGET);
            types.push(RoomObjectWidgetRequestEvent.ROWRE_CLOSE_WIDGET);
        }

        if(this.contextMenu !== null)
        {
            types.push(RoomObjectWidgetRequestEvent.ROWRE_OPEN_FURNI_CONTEXT_MENU);
            types.push(RoomObjectWidgetRequestEvent.ROWRE_CLOSE_FURNI_CONTEXT_MENU);
        }

        return this.getAllEventTypes(super.getEventTypes(), types);
    }

    override dispose(): void
    {
        super.dispose();
        this._storedRotateMessage = null;
        this._directions = [];
    }

    override initialize(data: unknown): void
    {
        if(data === null)
        {
            return;
        }

        this._sizeX = 0;
        this._sizeY = 0;
        this._sizeZ = 0;
        this._directions = [];

        // Parse dimensions from JSON data. The compiled bundle nests the furniture's
        // logic config (matching AS3's `param1` in this method) under a `logic` key,
        // alongside sibling `assets`/`spritesheet`/`visualizations` keys - not at the
        // data root.
        type DirectionEntry = number | { id: number };

        const config = data as {
            logic?: {
                model?: {
                    dimensions?: { x?: number; y?: number; z?: number; centerZ?: number };
                    directions?: DirectionEntry[] | DirectionEntry;
                };
                customvars?: { variable?: Array<{ name: string }> } | Array<{ name: string }>;
            };
        };

        const logicData = config.logic;

        if(logicData?.model?.dimensions)
        {
            const dims = logicData.model.dimensions;
            this._sizeX = dims.x ?? 0;
            this._sizeY = dims.y ?? 0;
            this._sizeZ = dims.z ?? 0;
            this._centerX = this._sizeX / 2;
            this._centerY = this._sizeY / 2;
            this._centerZ = dims.centerZ ?? (this._sizeZ / 2);
        }

        const rawDirections = logicData?.model?.directions;

        if(rawDirections !== undefined)
        {
            // Entries are plain direction-index numbers (e.g. [0, 2, 4, 6]); some
            // bundles may still wrap them as {id} objects (XML->JSON conversion
            // quirk also handled elsewhere in RoomContentLoader.ts).
            const directionList = Array.isArray(rawDirections) ? rawDirections : [rawDirections];

            for(const dir of directionList)
            {
                this._directions.push(typeof dir === 'number' ? dir : dir.id);
            }

            this._directions.sort((a, b) => a - b);
        }

        const model = this.object?.getModelController();
        if(model === null || model === undefined)
        {
            return;
        }

        // Set custom variables
        const customVarsSource = logicData?.customvars;
        const customVarsList = Array.isArray(customVarsSource) ? customVarsSource : customVarsSource?.variable;

        if(customVarsList)
        {
            const customVars: string[] = [];
            for(const v of customVarsList)
            {
                customVars.push(v.name);
            }
            model.setStringArray('furniture_custom_variables', customVars, true);
        }

        model.setNumber('furniture_size_x', this._sizeX, true);
        model.setNumber('furniture_size_y', this._sizeY, true);

        if(!model.hasNumber('furniture_size_z'))
        {
            model.setNumber('furniture_size_z', this._sizeZ);
        }

        model.setNumber('furniture_center_x', this._centerX, true);
        model.setNumber('furniture_center_y', this._centerY, true);
        model.setNumber('furniture_center_z', this._centerZ, true);
        model.setNumberArray('furniture_allowed_directions', this._directions, true);
        model.setNumber('furniture_alpha_multiplier', 1);
    }

    override mouseEvent(event: RoomSpriteMouseEvent, geometry: IRoomGeometry): void
    {
        if(event === null || geometry === null)
        {
            return;
        }

        if(this.object === null)
        {
            return;
        }

        const model = this.object.getModelController();
        if(model === null)
        {
            return;
        }

        const adUrl = this.getAdClickUrl(model);

        switch(event.type)
        {
            case 'mouseMove':
                if(this.eventDispatcher !== null)
                {
                    const moveEvent = new RoomObjectMouseEvent(
                        RoomObjectMouseEvent.ROE_MOUSE_MOVE,
                        this.object,
                        event.eventId,
                        event.altKey,
                        event.ctrlKey,
                        event.shiftKey,
                        event.buttonDown
                    );
                    moveEvent.localX = event.localX;
                    moveEvent.localY = event.localY;
                    moveEvent.spriteOffsetX = event.spriteOffsetX;
                    moveEvent.spriteOffsetY = event.spriteOffsetY;
                    this.eventDispatcher.emit(moveEvent.type, moveEvent);
                }
                break;

            case 'rollOver':
                if(!this._mouseOver)
                {
                    if(this.eventDispatcher !== null && adUrl !== null && adUrl.indexOf('http') === 0)
                    {
                        this.eventDispatcher.emit(
                            RoomObjectRoomAdEvent.ROOM_AD_TOOLTIP_SHOW,
                            new RoomObjectRoomAdEvent(RoomObjectRoomAdEvent.ROOM_AD_TOOLTIP_SHOW, this.object)
                        );
                    }

                    if(this.eventDispatcher !== null)
                    {
                        const enterEvent = new RoomObjectMouseEvent(
                            RoomObjectMouseEvent.ROE_MOUSE_ENTER,
                            this.object,
                            event.eventId,
                            event.altKey,
                            event.ctrlKey,
                            event.shiftKey,
                            event.buttonDown
                        );
                        enterEvent.localX = event.localX;
                        enterEvent.localY = event.localY;
                        enterEvent.spriteOffsetX = event.spriteOffsetX;
                        enterEvent.spriteOffsetY = event.spriteOffsetY;
                        this.eventDispatcher.emit(enterEvent.type, enterEvent);
                    }

                    this._mouseOver = true;
                }
                break;

            case 'rollOut':
                if(this._mouseOver)
                {
                    if(this.eventDispatcher !== null && adUrl !== null && adUrl.indexOf('http') === 0)
                    {
                        this.eventDispatcher.emit(
                            RoomObjectRoomAdEvent.ROOM_AD_TOOLTIP_HIDE,
                            new RoomObjectRoomAdEvent(RoomObjectRoomAdEvent.ROOM_AD_TOOLTIP_HIDE, this.object)
                        );
                    }

                    if(this.eventDispatcher !== null)
                    {
                        const leaveEvent = new RoomObjectMouseEvent(
                            RoomObjectMouseEvent.ROE_MOUSE_LEAVE,
                            this.object,
                            event.eventId,
                            event.altKey,
                            event.ctrlKey,
                            event.shiftKey,
                            event.buttonDown
                        );
                        leaveEvent.localX = event.localX;
                        leaveEvent.localY = event.localY;
                        leaveEvent.spriteOffsetX = event.spriteOffsetX;
                        leaveEvent.spriteOffsetY = event.spriteOffsetY;
                        this.eventDispatcher.emit(leaveEvent.type, leaveEvent);
                    }

                    this._mouseOver = false;
                }
                break;

            case 'doubleClick':
                this.useObject();
                break;

            case 'click':
                if(this.eventDispatcher !== null)
                {
                    const clickEvent = new RoomObjectMouseEvent(
                        RoomObjectMouseEvent.ROE_MOUSE_CLICK,
                        this.object,
                        event.eventId,
                        event.altKey,
                        event.ctrlKey,
                        event.shiftKey,
                        event.buttonDown
                    );
                    clickEvent.localX = event.localX;
                    clickEvent.localY = event.localY;
                    clickEvent.spriteOffsetX = event.spriteOffsetX;
                    clickEvent.spriteOffsetY = event.spriteOffsetY;
                    this.eventDispatcher.emit(clickEvent.type, clickEvent);
                }

                // `this.object` is re-checked from here on, even though mouseEvent() already
                // guarded it on entry: `object` is a getter over the logic's live reference, and the
                // click emitted just above runs its listeners synchronously. One of them can detach
                // or dispose the room object — a click that removes the furni, or a server remove
                // arriving for it — after which these branches would dereference null. The
                // context-menu branch below already guards for exactly this reason; these two were
                // missed, and `this.object.getId()` was the crash.
                if(this.eventDispatcher !== null && this.object !== null && adUrl !== null && adUrl.indexOf('http') === 0)
                {
                    this.eventDispatcher.emit(
                        RoomObjectRoomAdEvent.ROOM_AD_TOOLTIP_HIDE,
                        new RoomObjectRoomAdEvent(RoomObjectRoomAdEvent.ROOM_AD_TOOLTIP_HIDE, this.object)
                    );
                }

                if(this.eventDispatcher !== null && this.object !== null && adUrl !== null)
                {
                    this.handleAdClick(this.object.getId(), this.object.getType(), adUrl);
                }

                // AS3 reads the getter here too — see getEventTypes() above.
                if(this.eventDispatcher !== null && this.object !== null && this.contextMenu !== null)
                {
                    this.eventDispatcher.emit(
                        RoomObjectWidgetRequestEvent.ROWRE_OPEN_FURNI_CONTEXT_MENU,
                        new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_OPEN_FURNI_CONTEXT_MENU, this.object)
                    );
                }
                break;

            case 'mouseDown':
                if(this.eventDispatcher !== null)
                {
                    const downEvent = new RoomObjectMouseEvent(
                        RoomObjectMouseEvent.ROE_MOUSE_DOWN,
                        this.object,
                        event.eventId,
                        event.altKey,
                        event.ctrlKey,
                        event.shiftKey,
                        event.buttonDown
                    );
                    this.eventDispatcher.emit(downEvent.type, downEvent);
                }
                break;
        }
    }

    override useObject(): void
    {
        if(this.object === null)
        {
            return;
        }

        const model = this.object.getModelController();

        if(model !== null)
        {
            const adUrl = this.getAdClickUrl(model);

            if(this.eventDispatcher !== null && adUrl !== null && adUrl.length > 0)
            {
                this.eventDispatcher.emit(
                    RoomObjectRoomAdEvent.ROOM_AD_FURNI_DOUBLE_CLICK,
                    new RoomObjectRoomAdEvent(RoomObjectRoomAdEvent.ROOM_AD_FURNI_DOUBLE_CLICK, this.object, null, adUrl)
                );
            }
        }

        if(this.eventDispatcher !== null)
        {
            // The **getter**, not the backing field — `_SafeCls_1722.as:306` reads `widget`, and so
            // does the `getEventTypes()` test above. Every logic that names a widget does it by
            // overriding the getter and never assigns `widgetType`, so reading the field here left
            // `_widget` null and the click emitted nothing: the crafting table, the rentable space
            // and the fishing spot were all silently inert. The same mistake was found and fixed in
            // `getEventTypes()` and left standing at the two emit sites.
            if(this.widget !== null)
            {
                this.eventDispatcher.emit(
                    RoomObjectWidgetRequestEvent.ROWRE_OPEN_WIDGET,
                    new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_OPEN_WIDGET, this.object)
                );
            }

            this.eventDispatcher.emit(
                RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE,
                new RoomObjectStateChangeEvent(RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE, this.object)
            );
        }
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        if(message === null)
        {
            return;
        }

        // Check for data update message
        const dataMessage = message as unknown as RoomObjectDataUpdateMessage;
        if('state' in message && 'data' in message && typeof (message as RoomObjectDataUpdateMessage).state === 'number')
        {
            this.handleDataUpdateMessage(dataMessage);
            return;
        }

        // Check for height update message
        const heightMessage = message as unknown as RoomObjectHeightUpdateMessage;
        if('height' in message && typeof (message as RoomObjectHeightUpdateMessage).height === 'number')
        {
            this.handleHeightUpdateMessage(heightMessage);
            return;
        }

        this._mouseOver = false;

        // Handle rotation bounce
        if(message.dir !== null && message.loc !== null)
        {
            const currentDir = this.object?.getDirection();
            const currentLoc = this.object?.getLocation();

            if(currentDir !== null && currentDir !== undefined &&
				currentDir.x !== message.dir.x &&
				this._hasLocation &&
				currentLoc !== null && currentLoc !== undefined &&
				currentLoc.x === message.loc.x &&
				currentLoc.y === message.loc.y &&
				currentLoc.z === message.loc.z)
            {
                this._bounceStep = 1;
                this._lastBounceUpdateTime = -Infinity;
                this._storedRotateMessage = message;
                return;
            }
            else if(message.dir !== null)
            {
                this.object?.setDirection(message.dir);
            }

            this._hasLocation = true;
        }

        /**
         * AS3: _SafeCls_1722.as::processUpdateMessage() — a RoomObjectSelectedMessage opens or
         * closes the context menu according to `selected`.
         *
         * Inert today: nothing in this port constructs a RoomObjectSelectedMessage yet, so the
         * live path is the mouseClick case above. Ported anyway so the menu closes on deselect the
         * moment selection messages are wired, the same way FurnitureGuildCustomizedLogic already
         * handles its half of this.
         */
        const selectedMessage = message as unknown as RoomObjectSelectedMessage;

        if('selected' in message && this.contextMenu !== null && this.eventDispatcher !== null && this.object !== null)
        {
            const type = selectedMessage.selected
                ? RoomObjectWidgetRequestEvent.ROWRE_OPEN_FURNI_CONTEXT_MENU
                : RoomObjectWidgetRequestEvent.ROWRE_CLOSE_FURNI_CONTEXT_MENU;

            this.eventDispatcher.emit(type, new RoomObjectWidgetRequestEvent(type, this.object));
        }

        super.processUpdateMessage(message);
    }

    override update(time: number): void
    {
        super.update(time);

        if(this._bounceStep > 0 && time >= this._lastBounceUpdateTime + FurnitureLogic.BOUNCE_UPDATE_INTERVAL)
        {
            this._lastBounceUpdateTime = time;
            this._bounceStep++;

            if(this._bounceStep > FurnitureLogic.BOUNCE_STEPS)
            {
                this._bounceStep = 0;
            }
        }
    }

    override tearDown(): void
    {
        const model = this.object?.getModelController();

        // The getter, for the same reason as the open above — `_SafeCls_1722.as:443`.
        if(this.widget !== null && model?.getNumber('furniture_real_room_object') === 1)
        {
            this.eventDispatcher?.emit(
                RoomObjectWidgetRequestEvent.ROWRE_CLOSE_WIDGET,
                new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_CLOSE_WIDGET, this.object)
            );
        }

        super.tearDown();
    }

    protected override getLocationOffset(): IVector3d | null
    {
        if(this._bounceStep > 0)
        {
            this._locationOffset.x = 0;
            this._locationOffset.y = 0;

            if(this._bounceStep <= FurnitureLogic.BOUNCE_STEPS / 2)
            {
                this._locationOffset.z = FurnitureLogic.BOUNCE_STEP_HEIGHT * this._bounceStep;
            }
            else if(this._bounceStep <= FurnitureLogic.BOUNCE_STEPS)
            {
                if(this._storedRotateMessage !== null)
                {
                    super.processUpdateMessage(this._storedRotateMessage);
                    this._storedRotateMessage = null;
                }
                this._locationOffset.z = FurnitureLogic.BOUNCE_STEP_HEIGHT * (FurnitureLogic.BOUNCE_STEPS - this._bounceStep);
            }

            return this._locationOffset;
        }

        return null;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureLogic.as::getAdClickUrl()
    protected getAdClickUrl(model: { getString(key: string): string | null }): string | null
    {
        return model.getString('furniture_ad_url');
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureLogic.as::handleAdClick()
    protected handleAdClick(_id: number, _type: string, _url: string): void
    {
        if(this.eventDispatcher !== null)
        {
            this.eventDispatcher.emit(
                RoomObjectRoomAdEvent.ROOM_AD_FURNI_CLICK,
                new RoomObjectRoomAdEvent(RoomObjectRoomAdEvent.ROOM_AD_FURNI_CLICK, this.object)
            );
        }
    }

    private handleDataUpdateMessage(message: RoomObjectDataUpdateMessage): void
    {
        const model = this.object?.getModelController();

        this.object?.setState(message.state, 0);

        if(model !== null && model !== undefined)
        {
            if(message.data !== null)
            {
                message.data.writeRoomObjectModel(model);
            }

            // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureLogic.as:327-328
            // AS3 writes both: the string furniture_extras and the numeric furniture_extra. Only
            // the first was ported, so the numeric one was never set anywhere — see
            // RoomObjectVariableEnum.FURNITURE_EXTRA.
            if(!isNaN(message.extra))
            {
                model.setString(RoomObjectVariableEnum.FURNITURE_EXTRAS, String(message.extra));
                model.setNumber(RoomObjectVariableEnum.FURNITURE_EXTRA, message.extra);
            }

            model.setNumber('furniture_state_update_time', this.lastUpdateTime);
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureLogic.as::handleHeightUpdateMessage()
    private handleHeightUpdateMessage(message: RoomObjectHeightUpdateMessage): void
    {
        const model = this.object?.getModelController();

        if(model !== null && model !== undefined)
        {
            model.setNumber('furniture_size_z', message.height);
        }
    }
}
