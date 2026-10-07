/**
 * FurnitureChangeStateWhenStepOnLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureChangeStateWhenStepOnLogic.as
 *
 * Logic for furniture that changes state when the user steps on it.
 */
import type {IVector3d} from '../../utils/IVector3d';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomToObjectOwnAvatarMoveEvent} from '../../scene/events/RoomToObjectOwnAvatarMoveEvent';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureChangeStateWhenStepOnLogic extends FurnitureLogic
{
    override initialize(data: unknown): void
    {
        super.initialize(data);

        this.eventDispatcher?.on(
            RoomToObjectOwnAvatarMoveEvent.MOVE_TO,
            this.onOwnAvatarMove.bind(this)
        );
    }

    override tearDown(): void
    {
        this.eventDispatcher?.off(
            RoomToObjectOwnAvatarMoveEvent.MOVE_TO,
            this.onOwnAvatarMove.bind(this)
        );

        super.tearDown();
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureChangeStateWhenStepOnLogic.as::onOwnAvatarMove()
    private onOwnAvatarMove(event: RoomToObjectOwnAvatarMoveEvent): void
    {
        if(this.object === null)
        {
            return;
        }

        const location: IVector3d = this.object.getLocation();

        if(event.targetLoc)
        {
            let sizeX = this.object.getModel().getNumber(RoomObjectVariableEnum.FURNITURE_SIZE_X);
            let sizeY = this.object.getModel().getNumber(RoomObjectVariableEnum.FURNITURE_SIZE_Y);
            const direction = this.object.getDirection();

            const dirIndex = (Math.trunc(direction.x + 45) % 360) / 90;

            if(dirIndex === 1 || dirIndex === 3)
            {
                const temp = sizeX;
                sizeX = sizeY;
                sizeY = temp;
            }

            if(event.targetLoc.x >= location.x &&
				event.targetLoc.x < (location.x + sizeX) &&
				event.targetLoc.y >= location.y &&
				event.targetLoc.y < (location.y + sizeY))
            {
                this.object.setState(1, 0);
            }
            else
            {
                this.object.setState(0, 0);
            }
        }
    }
}
