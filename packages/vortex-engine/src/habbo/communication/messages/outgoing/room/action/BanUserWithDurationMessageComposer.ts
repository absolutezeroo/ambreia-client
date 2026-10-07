import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Ban a user from the room with a duration.
 *
 * `banType` is the AS3 string constant (`BanDuration.HOUR`/`DAY`/`PERMANENT`), sent
 * as-is on the wire — not a numeric code.
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/room/action/BanUserWithDurationMessageComposer.as
 */
export class BanUserWithDurationMessageComposer extends MessageComposer<[number, number, string]>
{
    private _data: [number, number, string];

    constructor(userId: number, banType: string, roomId: number = 0)
    {
        super();
        this._data = [userId, roomId, banType];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/action/BanUserWithDurationMessageComposer.as::getMessageArray()
    getMessageArray(): [number, number, string]
    {
        return this._data;
    }
}
