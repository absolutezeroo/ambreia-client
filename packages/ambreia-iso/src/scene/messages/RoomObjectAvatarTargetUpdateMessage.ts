import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

/** Whether this avatar is the player's target (RPG F3b §7.3): AvatarLogic writes it to the model. */
// TS-only: the RPG's target; Habbo has no target.
export class RoomObjectAvatarTargetUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(readonly targeted: boolean)
    {
        super(null, null);
    }
}
