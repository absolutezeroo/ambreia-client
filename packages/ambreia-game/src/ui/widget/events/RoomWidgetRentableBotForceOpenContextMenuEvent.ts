/**
 * RoomWidgetRentableBotForceOpenContextMenuEvent
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetRentableBotForceOpenContextMenuEvent.as
 */
import {RoomWidgetUpdateEvent} from './RoomWidgetUpdateEvent';

export class RoomWidgetRentableBotForceOpenContextMenuEvent extends RoomWidgetUpdateEvent
{
    // AS3: .../RoomWidgetRentableBotForceOpenContextMenuEvent.as::OPEN
    public static readonly OPEN: string = 'RWRBFOCME_OPEN';

    // AS3: .../RoomWidgetRentableBotForceOpenContextMenuEvent.as::_SafeStr_6226
    private _botId: number;

    // AS3: .../RoomWidgetRentableBotForceOpenContextMenuEvent.as::RoomWidgetRentableBotForceOpenContextMenuEvent()
    constructor(botId: number)
    {
        super(RoomWidgetRentableBotForceOpenContextMenuEvent.OPEN);
        this._botId = botId;
    }

    // AS3: .../RoomWidgetRentableBotForceOpenContextMenuEvent.as::get botId()
    public get botId(): number
    {
        return this._botId;
    }
}
