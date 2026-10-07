/**
 * FurnitureVoteMajorityLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureVoteMajorityLogic.as
 *
 * Logic for vote majority furniture (stores vote result).
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';
import type {RoomObjectDataUpdateMessage} from '../../scene/messages/RoomObjectDataUpdateMessage';
import type {VoteResultStuffData} from '../../scene/object/data/VoteResultStuffData';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureVoteMajorityLogic extends FurnitureMultiStateLogic
{
    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        const dataMessage = message as unknown as RoomObjectDataUpdateMessage;

        if('state' in message && 'data' in message && dataMessage.data !== null)
        {
            const voteData = dataMessage.data as unknown as VoteResultStuffData;

            if(typeof voteData.result === 'number')
            {
                this.object?.getModelController()?.setNumber(
                    RoomObjectVariableEnum.FURNITURE_VOTE_MAJORITY_RESULT,
                    voteData.result
                );
            }
        }
    }
}
