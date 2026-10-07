import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Change avatar posture (stand, sit, lay)
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.room.avatar.ChangePostureMessageComposer
 */
export class ChangePostureMessageComposer extends MessageComposer<[number]>
{
    private _data: [number];

    constructor(posture: number)
    {
        super();
        this._data = [posture];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/avatar/ChangePostureMessageComposer.as::getMessageArray()
    getMessageArray(): [number]
    {
        return this._data;
    }
}
