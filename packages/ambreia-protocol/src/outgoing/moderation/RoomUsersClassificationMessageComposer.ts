import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Requests user classification data for users in a room.
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/userclassification/RoomUsersClassificationMessageComposer.as
 */
export class RoomUsersClassificationMessageComposer extends MessageComposer<ConstructorParameters<typeof RoomUsersClassificationMessageComposer>>
{
    private _data: ConstructorParameters<typeof RoomUsersClassificationMessageComposer>;

    constructor(roomName: string)
    {
        super();
        this._data = [roomName];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/userclassification/RoomUsersClassificationMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
