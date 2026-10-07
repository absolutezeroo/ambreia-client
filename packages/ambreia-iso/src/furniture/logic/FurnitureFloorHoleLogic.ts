/**
 * FurnitureFloorHoleLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureFloorHoleLogic.as
 *
 * Logic for floor hole furniture (dispatches floor hole add/remove events).
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import {Vector3d} from '../../utils/Vector3d';
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';
import {RoomObjectFloorHoleEvent} from '../../scene/events/RoomObjectFloorHoleEvent';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureFloorHoleLogic extends FurnitureMultiStateLogic
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureFloorHoleLogic.as::STATE_HOLE
    private static readonly STATE_HOLE = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureFloorHoleLogic.as::_currentState
    private _currentState: number = -1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureFloorHoleLogic.as::_currentLoc
    private _currentLoc: Vector3d | null = null;

    override dispose(): void
    {
        if(this._currentState === FurnitureFloorHoleLogic.STATE_HOLE && this.object !== null)
        {
            this.eventDispatcher?.emit(
                RoomObjectFloorHoleEvent.REMOVE_HOLE,
                new RoomObjectFloorHoleEvent(RoomObjectFloorHoleEvent.REMOVE_HOLE, this.object)
            );
        }

        super.dispose();
    }

    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectFloorHoleEvent.ADD_HOLE,
            RoomObjectFloorHoleEvent.REMOVE_HOLE
        ];

        return this.getAllEventTypes(super.getEventTypes(), types);
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        if(this.object !== null)
        {
            if('state' in message && 'data' in message)
            {
                const state = this.object.getState(0);
                this.handleStateUpdate(state);
            }

            const location = this.object.getLocation();

            if(this._currentLoc === null)
            {
                this._currentLoc = new Vector3d();
            }
            else
            {
                if(location.x !== this._currentLoc.x || location.y !== this._currentLoc.y)
                {
                    if(this._currentState === FurnitureFloorHoleLogic.STATE_HOLE)
                    {
                        if(this.eventDispatcher !== null)
                        {
                            this.eventDispatcher.emit(
                                RoomObjectFloorHoleEvent.ADD_HOLE,
                                new RoomObjectFloorHoleEvent(RoomObjectFloorHoleEvent.ADD_HOLE, this.object)
                            );
                        }
                    }
                }
            }

            this._currentLoc.assign(location);
        }
    }

    override update(time: number): void
    {
        super.update(time);
        this.handleAutomaticStateUpdate();
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureFloorHoleLogic.as::handleStateUpdate()
    private handleStateUpdate(state: number): void
    {
        if(state !== this._currentState)
        {
            if(this.eventDispatcher !== null && this.object !== null)
            {
                if(state === FurnitureFloorHoleLogic.STATE_HOLE)
                {
                    this.eventDispatcher.emit(
                        RoomObjectFloorHoleEvent.ADD_HOLE,
                        new RoomObjectFloorHoleEvent(RoomObjectFloorHoleEvent.ADD_HOLE, this.object)
                    );
                }
                else if(this._currentState === FurnitureFloorHoleLogic.STATE_HOLE)
                {
                    this.eventDispatcher.emit(
                        RoomObjectFloorHoleEvent.REMOVE_HOLE,
                        new RoomObjectFloorHoleEvent(RoomObjectFloorHoleEvent.REMOVE_HOLE, this.object)
                    );
                }
            }

            this._currentState = state;
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureFloorHoleLogic.as::handleAutomaticStateUpdate()
    private handleAutomaticStateUpdate(): void
    {
        if(this.object !== null)
        {
            const model = this.object.getModel();

            if(model !== null)
            {
                const autoState = model.getNumber(RoomObjectVariableEnum.FURNITURE_AUTOMATIC_STATE_INDEX);

                if(!isNaN(autoState))
                {
                    this.handleStateUpdate(Math.trunc(autoState) % 2);
                }
            }
        }
    }
}
