/**
 * RoomLogic
 *
 * @see source_as_win63/habbo/room/object/logic/room/RoomLogic.as
 *
 * Logic for the room object itself. Handles room update messages that change
 * floor/wall types, masks, visibility, colors, and floor holes.
 * Also dispatches mouse events for tile and wall interaction.
 */
import {ObjectLogicBase} from '../../../../object/logic/ObjectLogicBase';
import type {RoomObjectUpdateMessage} from '../../../../messages/RoomObjectUpdateMessage';
import type {IRoomObjectModelController} from '../../../../object/IRoomObjectModelController';
import type {RoomSpriteMouseEvent} from '../../../../events/RoomSpriteMouseEvent';
import type {IRoomGeometry} from '../../../../utils/IRoomGeometry';
import {RoomObjectMouseEvent} from '../../../../events/RoomObjectMouseEvent';
import {RoomObjectRoomUpdateMessage} from '../../../messages/RoomObjectRoomUpdateMessage';
import {RoomObjectRoomMaskUpdateMessage} from '../../../messages/RoomObjectRoomMaskUpdateMessage';
import {
    RoomObjectRoomPlaneVisibilityUpdateMessage
} from '../../../messages/RoomObjectRoomPlaneVisibilityUpdateMessage';
import {RoomObjectRoomPlanePropertyUpdateMessage} from '../../../messages/RoomObjectRoomPlanePropertyUpdateMessage';
import {RoomObjectRoomFloorHoleUpdateMessage} from '../../../messages/RoomObjectRoomFloorHoleUpdateMessage';
import {RoomObjectRoomColorUpdateMessage} from '../../../messages/RoomObjectRoomColorUpdateMessage';
import {RoomPlaneBitmapMaskParser} from '../../RoomPlaneBitmapMaskParser';
import {RoomPlaneParser} from '../../RoomPlaneParser';
import {RoomPlaneData} from '../../RoomPlaneData';
import {RoomObjectVariableEnum} from '../../RoomObjectVariableEnum';
import {RoomObjectTileMouseEvent} from '../../../events/RoomObjectTileMouseEvent';
import {RoomObjectWallMouseEvent} from '../../../events/RoomObjectWallMouseEvent';
import {ColorTransitioner} from '../../../../utils/ColorTransitioner';

export class RoomLogic extends ObjectLogicBase
{
    private _planeParser: RoomPlaneParser | null;
    private _planeMaskParser: RoomPlaneBitmapMaskParser | null;
    private _colorTransitioner: ColorTransitioner | null;
    private _needsFloorHoleUpdate: boolean = false;

    /**
	 * @see sources/win63_version/habbo/room/object/logic/room/RoomLogic.as lines 28-33
	 */
    constructor()
    {
        super();
        this._planeParser = new RoomPlaneParser();
        this._planeMaskParser = new RoomPlaneBitmapMaskParser();
        this._colorTransitioner = new ColorTransitioner();
    }

    override getEventTypes(): string[]
    {
        const types = ['ROE_MOUSE_MOVE', 'ROE_MOUSE_CLICK'];
        return this.getAllEventTypes(super.getEventTypes(), types);
    }

    /**
	 * Initialize room logic.
	 * AS3: initialize(xml) calls _planeParser.initializeFromXML(xml)
	 * and sets default model values.
	 *
	 * @param data - RoomPlaneParser with plane data (equivalent of AS3 XML param)
	 * @see sources/win63_version/habbo/room/object/logic/room/RoomLogic.as lines 57-72
	 */
    override initialize(data: unknown): void
    {
        // AS3: if(param1 == null || object == null) return;
        // AS3: if(!_planeParser.initializeFromXML(param1)) return;
        // TS is handed an already-parsed RoomPlaneParser instead of raw XML
        // (see RoomEngine.ts model.setObject(ROOM_PLANE_PARSER, ...)), so the
        // equivalent guard is simply requiring a valid parser instance.
        if(this.object === null || !(data instanceof RoomPlaneParser))
        {
            return;
        }

        this._planeParser = data;

        const model = this.object.getModelController();

        if(model)
        {
            // AS3 also does `model.setString("room_plane_xml", param1.toString())` here.
            // That string is only ever read back by RoomVisualization.as, which then
            // re-parses it with its own RoomPlaneParser. TS skips the XML round-trip
            // entirely: RoomEngine.ts stores this same RoomPlaneParser instance under
            // ROOM_PLANE_PARSER, and RoomVisualization.ts reads that object directly
            // (see RoomVisualization.ts::initializeRoomPlanes()). No TS code reads
            // ROOM_PLANE_XML, and RoomPlaneParser has no XML serializer — this is an
            // intentional architectural substitution, not a missing port.
            model.setNumber(RoomObjectVariableEnum.ROOM_BACKGROUND_COLOR, 0xFFFFFF);
            model.setNumber(RoomObjectVariableEnum.ROOM_FLOOR_VISIBILITY, 1);
            model.setNumber(RoomObjectVariableEnum.ROOM_WALL_VISIBILITY, 1);
            model.setNumber(RoomObjectVariableEnum.ROOM_LANDSCAPE_VISIBILITY, 1);
        }
    }

    /**
	 * Periodic update. Handles background color transitions and floor hole updates.
	 * Based on AS3 RoomLogic.update()
	 */
    override update(time: number): void
    {
        super.update(time);
        this.updateBackgroundColor(time);

        // Floor hole update: regenerate plane XML when holes change
        if(this._needsFloorHoleUpdate)
        {
            if(this.object !== null && this._planeParser !== null)
            {
                const model = this.object.getModelController();

                if(model)
                {
                    model.setNumber(RoomObjectVariableEnum.ROOM_FLOOR_HOLE_UPDATE_TIME, time);
                }
            }

            this._needsFloorHoleUpdate = false;
        }
    }

    /**
	 * Process room-specific update messages.
	 * Routes to specific handlers based on message type.
	 * Based on AS3 RoomLogic.processUpdateMessage() lines 93-130
	 */
    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        if(message === null || this.object === null)
        {
            return;
        }

        const model = this.object.getModelController();

        if(model === null)
        {
            return;
        }

        // Room type updates (floor/wall/landscape textures)
        if(message instanceof RoomObjectRoomUpdateMessage)
        {
            this.updatePlaneTypes(message, model);
            return;
        }

        // Mask updates (door/window masks)
        if(message instanceof RoomObjectRoomMaskUpdateMessage)
        {
            this.updatePlaneMasks(message, model);
            return;
        }

        // Plane visibility updates
        if(message instanceof RoomObjectRoomPlaneVisibilityUpdateMessage)
        {
            this.updatePlaneVisibilities(message, model);
            return;
        }

        // Plane property updates (thickness)
        if(message instanceof RoomObjectRoomPlanePropertyUpdateMessage)
        {
            this.updatePlaneProperties(message, model);
            return;
        }

        // Floor hole updates
        if(message instanceof RoomObjectRoomFloorHoleUpdateMessage)
        {
            this.updateFloorHoles(message);
        }

        // Color/lighting updates
        if(message instanceof RoomObjectRoomColorUpdateMessage)
        {
            this.updateColors(message, model);
        }

        // Fall through to base class for location/direction updates
        super.processUpdateMessage(message);
    }

    /**
	 * Handle mouse events on the room object.
	 * Parses sprite tag for plane index, computes tile coordinates,
	 * and dispatches RoomObjectTileMouseEvent or RoomObjectWallMouseEvent.
	 * Based on AS3 RoomLogic.mouseEvent()
	 */
    override mouseEvent(event: RoomSpriteMouseEvent, geometry: IRoomGeometry): void
    {
        if(!event || !this.object)
        {
            return;
        }

        const roomModel = this.object.getModel();
        const modelPlaneParser = roomModel.getObject(RoomObjectVariableEnum.ROOM_PLANE_PARSER) as RoomPlaneParser | null;
        const planeParser = (modelPlaneParser !== null && modelPlaneParser.planeCount > 0) ? modelPlaneParser : this._planeParser;

        if(planeParser === null || planeParser.planeCount <= 0)
        {
            return;
        }

        // Extract plane index from sprite tag (format: "<name>@<planeIndex>")
        const spriteTag = event.spriteTag;
        let planeIndex = -1;

        if(spriteTag && spriteTag.indexOf('@') >= 0)
        {
            planeIndex = parseInt(spriteTag.substring(spriteTag.indexOf('@') + 1));
        }

        if(planeIndex < 1 || planeIndex > planeParser.planeCount)
        {
            // Handle rollOut: clear selected plane
            if(event.type === 'rollOut')
            {
                const model = this.object.getModelController();

                if(model)
                {
                    model.setNumber(RoomObjectVariableEnum.ROOM_SELECTED_PLANE, 0);
                }
            }

            return;
        }

        // Convert to 0-based
        planeIndex--;

        const planeLoc = planeParser.getPlaneLocation(planeIndex);
        const planeLeftSide = planeParser.getPlaneLeftSide(planeIndex);
        const planeRightSide = planeParser.getPlaneRightSide(planeIndex);
        const planeType = planeParser.getPlaneType(planeIndex);

        if(!planeLoc || !planeLeftSide || !planeRightSide)
        {
            return;
        }

        const leftLength = planeLeftSide.length;
        const rightLength = planeRightSide.length;

        if(leftLength === 0 || rightLength === 0)
        {
            return;
        }

        // DEVIATION: a floor plane standing up is the side of a raised floor (RoomPlaneParser
        // addFloorSides), solid down to the floor in front. AS3 sides were a quarter of a level
        // thick and nobody pointed at one; now they are walls, and the point found on one sits on
        // the edge between two tiles, so the cursor jumped to the foot of the wall. A side picks no
        // tile, like a wall: the cursor stays where it was.
        if(planeType === RoomPlaneData.PLANE_FLOOR && planeParser.getPlaneNormal(planeIndex)?.z === 0)
        {
            this.object.getModelController()?.setNumber(RoomObjectVariableEnum.ROOM_SELECTED_PLANE, 0);

            return;
        }

        // Convert screen coordinates to plane-local coordinates
        const screenPoint = {x: event.screenX, y: event.screenY};
        const planePoint = geometry.getPlanePosition(screenPoint, planeLoc, planeLeftSide, planeRightSide);

        if(!planePoint)
        {
            const model = this.object.getModelController();

            if(model)
            {
                model.setNumber(RoomObjectVariableEnum.ROOM_SELECTED_PLANE, 0);
            }

            return;
        }

        const tileX = planeLoc.x + (planeLeftSide.x * planePoint.x / leftLength) + (planeRightSide.x * planePoint.y / rightLength);
        const tileY = planeLoc.y + (planeLeftSide.y * planePoint.x / leftLength) + (planeRightSide.y * planePoint.y / rightLength);
        const tileZ = planeLoc.z + (planeLeftSide.z * planePoint.x / leftLength) + (planeRightSide.z * planePoint.y / rightLength);

        if(planePoint.x < 0 || planePoint.x >= leftLength || planePoint.y < 0 || planePoint.y >= rightLength)
        {
            const model = this.object.getModelController();

            if(model)
            {
                model.setNumber(RoomObjectVariableEnum.ROOM_SELECTED_PLANE, 0);
            }

            return;
        }

        // AS3 sets room_selected_x/y/z/plane unconditionally once in-bounds,
        // *before* the event-type switch — so a "rollOut" that's still
        // geometrically over the plane (no matching case below) still commits
        // the selection instead of leaving it stale.
        const model = this.object.getModelController();

        if(model)
        {
            model.setNumber(RoomObjectVariableEnum.ROOM_SELECTED_X, tileX);
            model.setNumber(RoomObjectVariableEnum.ROOM_SELECTED_Y, tileY);
            model.setNumber(RoomObjectVariableEnum.ROOM_SELECTED_Z, tileZ);
            model.setNumber(RoomObjectVariableEnum.ROOM_SELECTED_PLANE, planeIndex + 1);
        }

        // Determine event type
        let eventType: string;

        if(event.type === 'mouseMove' || event.type === 'rollOver')
        {
            eventType = RoomObjectMouseEvent.ROE_MOUSE_MOVE;
        }
        else if(event.type === 'click')
        {
            eventType = RoomObjectMouseEvent.ROE_MOUSE_CLICK;
        }
        else if(event.type === 'mouseDown')
        {
            eventType = RoomObjectMouseEvent.ROE_MOUSE_DOWN;
        }
        else
        {
            return;
        }

        if(!this.eventDispatcher)
        {
            return;
        }

        // Dispatch appropriate event based on plane type
        if(planeType === RoomPlaneData.PLANE_FLOOR)
        {
            const tileEvent = new RoomObjectTileMouseEvent(
                eventType, this.object, event.eventId,
                tileX, tileY, tileZ,
                event.altKey, event.ctrlKey, event.shiftKey, event.buttonDown
            );

            this.eventDispatcher.emit(eventType, tileEvent);
        }
        else if(planeType === RoomPlaneData.PLANE_WALL || planeType === RoomPlaneData.PLANE_LANDSCAPE)
        {
            // AS3: direction = planeNormalDirection.x + 90, normalized into (0, 360]
            const planeNormalDirection = planeParser.getPlaneNormalDirection(planeIndex);
            let direction = 90;

            if(planeNormalDirection !== null)
            {
                direction = planeNormalDirection.x + 90;

                while(direction > 360)
                {
                    direction -= 360;
                }
            }

            const wallEvent = new RoomObjectWallMouseEvent(
                eventType, this.object, event.eventId,
                planeLoc, planeLeftSide, planeRightSide,
                planeLeftSide.length * planePoint.x / leftLength,
                planeRightSide.length * planePoint.y / rightLength,
                direction,
                event.altKey, event.ctrlKey, event.shiftKey, event.buttonDown
            );

            this.eventDispatcher.emit(eventType, wallEvent);
        }
    }

    /**
	 * @see sources/win63_version/habbo/room/object/logic/room/RoomLogic.as lines 44-55
	 */
    override dispose(): void
    {
        super.dispose();

        if(this._planeParser)
        {
            this._planeParser.dispose();
            this._planeParser = null;
        }

        if(this._planeMaskParser)
        {
            this._planeMaskParser.dispose();
            this._planeMaskParser = null;
        }

        this._colorTransitioner = null;
    }

    /**
	 * Handle background color smooth transitions.
	 * Based on AS3 RoomLogic.updateBackgroundColor()
	 */
    // AS3: .../src/com/sulake/habbo/room/object/logic/room/RoomLogic.as::updateBackgroundColor()
    private updateBackgroundColor(time: number): void
    {
        if(this.object === null || this._colorTransitioner === null || !this._colorTransitioner.updateColor(time))
        {
            return;
        }

        const model = this.object.getModelController();

        if(model)
        {
            model.setNumber(RoomObjectVariableEnum.ROOM_BACKGROUND_COLOR, this._colorTransitioner.color);
        }
    }

    /**
	 * Update floor/wall/landscape texture types.
	 * Based on AS3 RoomLogic.updatePlaneTypes() lines 251-262
	 */
    // AS3: .../src/com/sulake/habbo/room/object/logic/room/RoomLogic.as::updatePlaneTypes()
    private updatePlaneTypes(message: RoomObjectRoomUpdateMessage, model: IRoomObjectModelController): void
    {
        switch(message.type)
        {
            case RoomObjectRoomUpdateMessage.ROOM_FLOOR_UPDATE:
                model.setString(RoomObjectVariableEnum.ROOM_FLOOR_TYPE, message.value);
                break;
            case RoomObjectRoomUpdateMessage.ROOM_WALL_UPDATE:
                model.setString(RoomObjectVariableEnum.ROOM_WALL_TYPE, message.value);
                break;
            case RoomObjectRoomUpdateMessage.ROOM_LANDSCAPE_UPDATE:
                model.setString(RoomObjectVariableEnum.ROOM_LANDSCAPE_TYPE, message.value);
                break;
        }
    }

    /**
	 * Update plane masks (add/remove doors, windows).
	 * Based on AS3 RoomLogic.updatePlaneMasks() lines 264-286
	 */
    // AS3: .../src/com/sulake/habbo/room/object/logic/room/RoomLogic.as::updatePlaneMasks()
    private updatePlaneMasks(message: RoomObjectRoomMaskUpdateMessage, model: IRoomObjectModelController): void
    {
        if(this._planeMaskParser === null)
        {
            return;
        }

        let changed = false;

        switch(message.type)
        {
            case RoomObjectRoomMaskUpdateMessage.ADD_MASK:
            {
                const category = message.maskCategory === 'hole' ? 'hole' : 'window';

                if(message.maskType !== null && message.maskLocation !== null)
                {
                    this._planeMaskParser.addMask(message.maskId, message.maskType, message.maskLocation, category);
                    changed = true;
                }
                break;
            }
            case RoomObjectRoomMaskUpdateMessage.REMOVE_MASK:
                changed = this._planeMaskParser.removeMask(message.maskId);
                break;
        }

        if(changed)
        {
            const xml = this._planeMaskParser.getXML();
            model.setString(RoomObjectVariableEnum.ROOM_PLANE_MASK_XML, xml);
        }
    }

    /**
	 * Update floor/wall/landscape visibility.
	 * Based on AS3 RoomLogic.updatePlaneVisibilities() lines 288-301
	 */
    // AS3: .../src/com/sulake/habbo/room/object/logic/room/RoomLogic.as::updatePlaneVisibilities()
    private updatePlaneVisibilities(message: RoomObjectRoomPlaneVisibilityUpdateMessage, model: IRoomObjectModelController): void
    {
        const value = message.visible ? 1 : 0;

        switch(message.type)
        {
            case RoomObjectRoomPlaneVisibilityUpdateMessage.FLOOR_VISIBILITY:
                model.setNumber(RoomObjectVariableEnum.ROOM_FLOOR_VISIBILITY, value);
                break;
            case RoomObjectRoomPlaneVisibilityUpdateMessage.WALL_VISIBILITY:
                model.setNumber(RoomObjectVariableEnum.ROOM_WALL_VISIBILITY, value);
                model.setNumber(RoomObjectVariableEnum.ROOM_LANDSCAPE_VISIBILITY, value);
                break;
        }
    }

    /**
	 * Update plane properties (thickness).
	 * Based on AS3 RoomLogic.updatePlaneProperties() lines 303-311
	 */
    // AS3: .../src/com/sulake/habbo/room/object/logic/room/RoomLogic.as::updatePlaneProperties()
    private updatePlaneProperties(message: RoomObjectRoomPlanePropertyUpdateMessage, model: IRoomObjectModelController): void
    {
        switch(message.type)
        {
            case RoomObjectRoomPlanePropertyUpdateMessage.FLOOR_THICKNESS:
                model.setNumber(RoomObjectVariableEnum.ROOM_FLOOR_THICKNESS_MULTIPLIER, message.value);
                break;
            case RoomObjectRoomPlanePropertyUpdateMessage.WALL_THICKNESS:
                model.setNumber(RoomObjectVariableEnum.ROOM_WALL_THICKNESS_MULTIPLIER, message.value);
                break;
        }
    }

    /**
	 * Update floor holes (add/remove).
	 * Based on AS3 RoomLogic.updateFloorHoles() lines 313-323
	 */
    // AS3: .../src/com/sulake/habbo/room/object/logic/room/RoomLogic.as::updateFloorHoles()
    private updateFloorHoles(message: RoomObjectRoomFloorHoleUpdateMessage): void
    {
        if(this._planeParser === null) return;

        switch(message.type)
        {
            case RoomObjectRoomFloorHoleUpdateMessage.ADD_HOLE:
                this._planeParser.addFloorHole(message.id, message.x, message.y, message.width, message.height, message.invert);
                this._needsFloorHoleUpdate = true;
                break;
            case RoomObjectRoomFloorHoleUpdateMessage.REMOVE_HOLE:
                this._planeParser.removeFloorHole(message.id);
                this._needsFloorHoleUpdate = true;
                break;
        }
    }

    /**
	 * Update room colors/lighting.
	 * Based on AS3 RoomLogic.updateColors() lines 325-341
	 */
    // AS3: .../src/com/sulake/habbo/room/object/logic/room/RoomLogic.as::updateColors()
    private updateColors(message: RoomObjectRoomColorUpdateMessage, model: IRoomObjectModelController): void
    {
        let targetColor: number;
        let targetLight: number;

        model.setNumber('room_colorize_bg_only', message.bgOnly ? 1 : 0);

        if(message.bgOnly)
        {
            targetColor = message.color;
            targetLight = message.light;
        }
        else
        {
            targetColor = 0xFFFFFF;
            targetLight = 255;
        }

        // AS3: var_1485.startTransition(target, light, getTimer()) — no explicit
        // duration is passed, so ColorTransitioner uses its default (1500ms), and
        // blends color/light independently via HSL lightness substitution rather
        // than pre-multiplying light into the RGB channels.
        this._colorTransitioner?.startTransition(targetColor, targetLight, performance.now());
    }
}
