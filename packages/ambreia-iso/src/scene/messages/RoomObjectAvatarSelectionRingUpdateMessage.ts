import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

/** Whether the host points this avatar out (a ring at its feet): AvatarLogic writes it to the model. */
// TS-only: Habbo points out no avatar.
export class RoomObjectAvatarSelectionRingUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(readonly shown: boolean)
    {
        super(null, null);
    }
}
