/**
 * SelectionArrowLogic
 *
 * Based on AS3: com.sulake.habbo.room.object.logic.room.SelectionArrowLogic
 *
 * Logic for the selection arrow cursor.
 *
 * @see sources/win63_version/habbo/room/object/logic/room/SelectionArrowLogic.as
 */
import {ObjectLogicBase} from '../../../../object/logic/ObjectLogicBase';
import type {RoomObjectUpdateMessage} from '../../../../messages/RoomObjectUpdateMessage';
import {RoomObjectVisibilityUpdateMessage} from '../../../messages/RoomObjectVisibilityUpdateMessage';

// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/room/SelectionArrowLogic.as::SelectionArrowLogic()
export class SelectionArrowLogic extends ObjectLogicBase
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/room/SelectionArrowLogic.as::initialize()
    override initialize(_data: unknown): void
    {
        if(this.object !== null)
        {
            const model = this.object.getModelController();

            if(model !== null)
            {
                model.setNumber('furniture_alpha_multiplier', 1);
                this.object.setState(1, 0);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/room/SelectionArrowLogic.as::processUpdateMessage()
    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        const visibilityMessage = message instanceof RoomObjectVisibilityUpdateMessage ? message : null;

        if(visibilityMessage !== null)
        {
            if(visibilityMessage.type === RoomObjectVisibilityUpdateMessage.ENABLED)
            {
                if(this.object !== null)
                {
                    this.object.setState(0, 0);
                }
            }
            else if(visibilityMessage.type === RoomObjectVisibilityUpdateMessage.DISABLED)
            {
                if(this.object !== null)
                {
                    this.object.setState(1, 0);
                }
            }
        }
    }
}
