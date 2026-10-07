/**
 * FurniturePushableLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurniturePushableLogic.as
 *
 * Logic for pushable furniture (e.g. footballs, pucks).
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {IVector3d} from '../../utils/IVector3d';
import {Vector3d} from '../../utils/Vector3d';
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';
import {RoomObjectMoveUpdateMessage} from '../../scene/messages/RoomObjectMoveUpdateMessage';
import type {RoomObjectDataUpdateMessage} from '../../scene/messages/RoomObjectDataUpdateMessage';

export class FurniturePushableLogic extends FurnitureMultiStateLogic
{
    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurniturePushableLogic.as::ANIMATION_NOT_MOVING
    private static readonly ANIMATION_NOT_MOVING = 0;
    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurniturePushableLogic.as::ANIMATION_MOVING
    private static readonly ANIMATION_MOVING = 1;
    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurniturePushableLogic.as::MAX_ANIMATION_COUNT
    private static readonly MAX_ANIMATION_COUNT = 10;

    private _lastLocation: Vector3d = new Vector3d();

    constructor()
    {
        super();
        this.setMoveUpdateInterval(500);
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        if(message === null)
        {
            return;
        }

        let moveMessage = message as unknown as RoomObjectMoveUpdateMessage;
        const isMoveUpdate = 'targetLoc' in message;

        if(this.object !== null && !isMoveUpdate)
        {
            if(message.loc !== null)
            {
                const currentLoc = this.object.getLocation();
                const diff = Vector3d.dif(message.loc, currentLoc);

                if(diff !== null && Math.abs(diff.x) < 2 && Math.abs(diff.y) < 2)
                {
                    let startLoc: IVector3d = currentLoc;

                    if(Math.abs(diff.x) > 1 || Math.abs(diff.y) > 1)
                    {
                        const halfDiff = Vector3d.product(diff, 0.5);

                        if(halfDiff !== null)
                        {
                            startLoc = Vector3d.sum(currentLoc, halfDiff)!;
                        }
                    }

                    moveMessage = new RoomObjectMoveUpdateMessage(startLoc, message.loc, message.dir);
                    super.processUpdateMessage(moveMessage);
                    return;
                }
            }
        }

        if(message.loc !== null && !isMoveUpdate)
        {
            moveMessage = new RoomObjectMoveUpdateMessage(message.loc, message.loc, message.dir);
            super.processUpdateMessage(moveMessage);
        }

        const dataMessage = message as unknown as RoomObjectDataUpdateMessage;

        if('state' in message && 'data' in message && typeof dataMessage.state === 'number')
        {
            const animTime = isMoveUpdate && !isNaN((moveMessage as RoomObjectMoveUpdateMessage).animationTime)
                ? (moveMessage as RoomObjectMoveUpdateMessage).animationTime
                : 500;

            if(dataMessage.state > 0)
            {
                this.setMoveUpdateInterval(animTime / this.getUpdateIntervalValue(dataMessage.state));
            }
            else
            {
                this.setMoveUpdateInterval(1);
            }

            this.handlePushableDataUpdate(dataMessage);
            return;
        }

        super.processUpdateMessage(message);
    }

    override update(time: number): void
    {
        if(this.object !== null)
        {
            this._lastLocation.assign(this.object.getLocation());
            super.update(time);

            const diff = Vector3d.dif(this.object.getLocation(), this._lastLocation);

            if(diff !== null && diff.length === 0)
            {
                if(this.object.getState(0) !== 0)
                {
                    this.object.setState(0, 0);
                }
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurniturePushableLogic.as::getUpdateIntervalValue()
    protected getUpdateIntervalValue(state: number): number
    {
        return state / 10;
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurniturePushableLogic.as::getAnimationValue()
    protected getAnimationValue(state: number): number
    {
        return state % 10;
    }

    private handlePushableDataUpdate(message: RoomObjectDataUpdateMessage): void
    {
        const animValue = this.getAnimationValue(message.state);

        if(animValue !== message.state)
        {
            const newMessage = {
                state: animValue,
                data: message.data,
                extra: message.extra,
                loc: null,
                dir: null
            } as unknown as RoomObjectUpdateMessage;
            super.processUpdateMessage(newMessage);
        }
        else
        {
            super.processUpdateMessage(message as unknown as RoomObjectUpdateMessage);
        }
    }
}
