/**
 * PetLogic
 *
 * Based on AS3: com.sulake.habbo.room.object.logic.PetLogic
 *
 * Logic for pet room objects.
 */
import type {RoomObjectUpdateMessage} from '@room/messages/RoomObjectUpdateMessage';
import type {IRoomObjectModelController} from '@room/object/IRoomObjectModelController';
import {Vector3d} from '@room/utils/Vector3d';
import type {IRoomGeometry} from '@room/utils/IRoomGeometry';
import {RoomObjectMouseEvent} from '@room/events/RoomObjectMouseEvent';
import {MovingObjectLogic} from './MovingObjectLogic';
import {RoomObjectMoveEvent} from '../../events/RoomObjectMoveEvent';
import {RoomObjectAvatarUpdateMessage} from '../../messages/RoomObjectAvatarUpdateMessage';
import {RoomObjectAvatarPostureUpdateMessage} from '../../messages/RoomObjectAvatarPostureUpdateMessage';
import {RoomObjectAvatarChatUpdateMessage} from '../../messages/RoomObjectAvatarChatUpdateMessage';
import {RoomObjectAvatarDirectionUpdateMessage} from '../../messages/RoomObjectAvatarDirectionUpdateMessage';
import {RoomObjectAvatarSleepUpdateMessage} from '../../messages/RoomObjectAvatarSleepUpdateMessage';
import {RoomObjectAvatarSelectedMessage} from '../../messages/RoomObjectAvatarSelectedMessage';
import {RoomObjectAvatarFigureUpdateMessage} from '../../messages/RoomObjectAvatarFigureUpdateMessage';
import {RoomObjectAvatarPetGestureUpdateMessage} from '../../messages/RoomObjectAvatarPetGestureUpdateMessage';
import {RoomObjectAvatarExperienceUpdateMessage} from '../../messages/RoomObjectAvatarExperienceUpdateMessage';
import {PetFigureData} from '@habbo/avatar/pets/PetFigureData';

export class PetLogic extends MovingObjectLogic
{
    // Timed actions
    private _talkEndTime = 0;
    private _gestureEndTime = 0;
    private _expressionEndTime = 0;

    // Selection state
    // AS3: .../src/com/sulake/habbo/room/object/logic/PetLogic.as::_selected
    private _selected = false;
    private _lastLocation: Vector3d | null = null;

    // Debug mode
    // AS3: .../src/com/sulake/habbo/room/object/logic/PetLogic.as::_debugMode
    private _debugMode = false;
    private _debugPostureIndex = 0;
    private _debugGestureIndex = 0;
    // AS3: .../src/com/sulake/habbo/room/object/logic/PetLogic.as::_headDirectionDelta
    private _headDirectionDelta = 0;
    private _directionIndex = 0;

    // Allowed directions for this pet type
    // AS3: .../src/com/sulake/habbo/room/object/logic/PetLogic.as::_directions
    private _directions: number[] = [];

    constructor()
    {
        super();
    }

    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectMouseEvent.ROE_MOUSE_CLICK,
            RoomObjectMoveEvent.ROME_POSITION_CHANGED
        ];

        return this.getAllEventTypes(super.getEventTypes(), types);
    }

    override dispose(): void
    {
        if(this._selected && this.object !== null)
        {
            if(this.eventDispatcher !== null)
            {
                const event = new RoomObjectMoveEvent(RoomObjectMoveEvent.ROME_OBJECT_REMOVED, this.object);
                this.eventDispatcher.emit(event.type, event);
            }
        }

        this._directions = [];
        super.dispose();
        this._lastLocation = null;
    }

    override initialize(data: unknown): void
    {
        super.initialize(data);

        this._directions = [];

        // Parse allowed directions from pet data
        const config = data as {
            model?: {
                directions?: {
                    direction?: Array<{ id: number }>;
                };
            };
        };

        if(config?.model?.directions?.direction)
        {
            for(const dir of config.model.directions.direction)
            {
                if(typeof dir.id === 'number')
                {
                    this._directions.push(dir.id);
                }
            }
        }

        // Sort directions numerically
        this._directions.sort((a, b) => a - b);

        // Store in model
        const model = this.object?.getModelController();
        if(model)
        {
            model.setNumberArray('pet_allowed_directions', this._directions, true);
        }
    }

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

        // When not in debug mode, process movement messages
        if(!this._debugMode)
        {
            super.processUpdateMessage(message);

            // Posture
            if(message instanceof RoomObjectAvatarPostureUpdateMessage)
            {
                model.setString('figure_posture', message.postureType);
                return;
            }

            // Head direction from avatar update
            if(message instanceof RoomObjectAvatarUpdateMessage)
            {
                model.setNumber('head_direction', message.dirHead);
                return;
            }

            // Head direction only
            if(message instanceof RoomObjectAvatarDirectionUpdateMessage)
            {
                model.setNumber('head_direction', message.dirHead);
                return;
            }

            // Chat (bark animation)
            if(message instanceof RoomObjectAvatarChatUpdateMessage)
            {
                model.setNumber('figure_talk', 1);
                this._talkEndTime = Date.now() + message.numberOfWords * 1000;
                return;
            }

            // Pet gesture
            if(message instanceof RoomObjectAvatarPetGestureUpdateMessage)
            {
                model.setString('figure_gesture', message.gesture);
                this._gestureEndTime = Date.now() + 3000;
                return;
            }

            // Sleep
            if(message instanceof RoomObjectAvatarSleepUpdateMessage)
            {
                model.setNumber('figure_sleep', message.isSleeping ? 1 : 0);
                return;
            }
        }

        // Selection state (always processed)
        if(message instanceof RoomObjectAvatarSelectedMessage)
        {
            this._selected = message.selected;
            this._lastLocation = null;
            return;
        }

        // Experience gain
        if(message instanceof RoomObjectAvatarExperienceUpdateMessage)
        {
            // AS3 stamps `getTimer()` here - milliseconds since the player started - and
            // AnimatedPetVisualization.updateExperienceBubble() subtracts it from the `time` the
            // room renderer passes down, which is `performance.now()`: the same monotonic clock.
            // `Date.now()` is epoch milliseconds, so the difference came out around -1.75e12. That
            // is still under the 2000ms window, so the bubble took the visible branch, computed
            // sin() of an astronomically large angle for its alpha, and never reset the stamp.
            model.setNumber('figure_experience_timestamp', performance.now());
            model.setNumber('figure_gained_experience', message.gainedExperience);
            return;
        }

        // Figure update
        if(message instanceof RoomObjectAvatarFigureUpdateMessage)
        {
            model.setString('figure', message.figure);
            model.setString('race', message.race);

            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/PetLogic.as::processUpdateMessage()
            const petData = new PetFigureData(message.figure);

            model.setNumber('pet_palette_index', petData.paletteId);
            model.setNumber('pet_color', petData.color);
            model.setNumber('pet_type', petData.typeId);
            model.setNumberArray('pet_custom_layer_ids', petData.customLayerIds);
            model.setNumberArray('pet_custom_part_ids', petData.customPartIds);
            model.setNumberArray('pet_custom_palette_ids', petData.customPaletteIds);

            model.setNumber('pet_is_riding', message.isRiding ? 1 : 0);
            return;
        }
    }

    override mouseEvent(event: {
        type: string;
        eventId?: string;
        altKey?: boolean;
        ctrlKey?: boolean;
        shiftKey?: boolean;
        buttonDown?: boolean
    }, _geometry: IRoomGeometry | null): void
    {
        if(this.object === null || event === null)
        {
            return;
        }

        const model = this.object.getModelController();
        let eventType: string | null = null;

        switch(event.type)
        {
            case 'click':
                eventType = RoomObjectMouseEvent.ROE_MOUSE_CLICK;
                if(this._debugMode)
                {
                    this.debugMouseEvent(event);
                }
                break;

            case 'doubleClick':
                // No action
                break;

            case 'mouseDown':
                if(!this._debugMode)
                {
                    // Pet type 16 (horse?) has special mouse down handling
                    const petType = model?.getNumber('pet_type') ?? 0;
                    if(petType === 16)
                    {
                        if(this.eventDispatcher !== null)
                        {
                            const mouseEvent = new RoomObjectMouseEvent(
                                RoomObjectMouseEvent.ROE_MOUSE_DOWN,
                                this.object,
                                event.eventId ?? '',
                                event.altKey ?? false,
                                event.ctrlKey ?? false,
                                event.shiftKey ?? false,
                                event.buttonDown ?? false
                            );
                            this.eventDispatcher.emit(mouseEvent.type, mouseEvent);
                        }
                    }
                }
                break;
        }

        if(eventType !== null && this.eventDispatcher !== null)
        {
            const mouseEvent = new RoomObjectMouseEvent(
                eventType,
                this.object,
                event.eventId ?? '',
                event.altKey ?? false,
                event.ctrlKey ?? false,
                event.shiftKey ?? false,
                event.buttonDown ?? false
            );
            this.eventDispatcher.emit(mouseEvent.type, mouseEvent);
        }
    }

    override update(time: number): void
    {
        super.update(time);

        // Track position changes when selected
        if(this._selected && this.object !== null)
        {
            if(this.eventDispatcher !== null)
            {
                const location = this.object.getLocation();

                if(this._lastLocation === null ||
					this._lastLocation.x !== location.x ||
					this._lastLocation.y !== location.y ||
					this._lastLocation.z !== location.z)
                {
                    if(this._lastLocation === null)
                    {
                        this._lastLocation = new Vector3d();
                    }

                    this._lastLocation.assign(location);

                    const event = new RoomObjectMoveEvent(RoomObjectMoveEvent.ROME_POSITION_CHANGED, this.object);
                    this.eventDispatcher.emit(event.type, event);
                }
            }
        }

        // Update timed actions
        if(this.object !== null)
        {
            const model = this.object.getModelController();
            if(model !== null)
            {
                this.updateActions(time, model);
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/PetLogic.as::updateActions()
    private updateActions(time: number, model: IRoomObjectModelController): void
    {
        const now = Date.now();

        // Gesture timeout
        if(this._gestureEndTime > 0 && now > this._gestureEndTime)
        {
            model.setString('figure_gesture', '');
            this._gestureEndTime = 0;
        }

        // Talk timeout
        if(this._talkEndTime > 0)
        {
            if(now > this._talkEndTime)
            {
                model.setNumber('figure_talk', 0);
                this._talkEndTime = 0;
            }
        }

        // Expression timeout
        if(this._expressionEndTime > 0 && now > this._expressionEndTime)
        {
            model.setNumber('figure_expression', 0);
            this._expressionEndTime = 0;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/PetLogic.as::debugMouseEvent()
    private debugMouseEvent(event: { altKey?: boolean; ctrlKey?: boolean }): void
    {
        const model = this.object?.getModelController();
        if(!model)
        {
            return;
        }

        if(!event.altKey && !event.ctrlKey)
        {
            // Cycle through directions
            const direction = this._directions[this._directionIndex] ?? 0;
            this.object?.setDirection(new Vector3d(direction));
            model.setNumber('head_direction', direction + this._headDirectionDelta);

            this._directionIndex++;
            if(this._directionIndex >= this._directions.length)
            {
                this._directionIndex = 0;
            }
        }
        else if(event.altKey && !event.ctrlKey)
        {
            // Cycle postures
            this._debugPostureIndex++;
            model.setNumber('figure_posture', this._debugPostureIndex);
            model.setNumber('figure_gesture', NaN);
        }
        else if(event.ctrlKey && !event.altKey)
        {
            // Cycle gestures
            this._debugGestureIndex++;
            model.setNumber('figure_gesture', this._debugGestureIndex);
        }
        else
        {
            // Adjust head direction delta
            this._headDirectionDelta += 45;
            if(this._headDirectionDelta > 45)
            {
                this._headDirectionDelta = -45;
            }

            const currentDir = this.object?.getDirection().x ?? 0;
            model.setNumber('head_direction', currentDir + this._headDirectionDelta);
        }
    }
}
