/**
 * RoomWidgetCreditFurniUpdateEvent
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetCreditFurniUpdateEvent.as
 *
 * Carries an exchangeable furni's credit value to the redeem dialog. AS3 also carries an
 * `isNftCredit` flag, which the RPG fork removed with NFT.
 */
import {RoomWidgetUpdateEvent} from './RoomWidgetUpdateEvent';

export class RoomWidgetCreditFurniUpdateEvent extends RoomWidgetUpdateEvent
{
    // AS3: RoomWidgetCreditFurniUpdateEvent.as::UPDATE_CREDIT_FURNI
    public static readonly UPDATE_CREDIT_FURNI: string = 'RWCFUE_CREDIT_FURNI_UPDATE';

    // AS3: RoomWidgetCreditFurniUpdateEvent.as::_SafeStr_4841
    private _objectId: number;

    // AS3: RoomWidgetCreditFurniUpdateEvent.as::_SafeStr_9198
    private _creditValue: number;

    // DEVIATION: AS3 takes a fourth `isNftCredit` argument; the RPG fork removed NFT.
    // AS3: RoomWidgetCreditFurniUpdateEvent.as::RoomWidgetCreditFurniUpdateEvent()
    constructor(type: string, objectId: number, creditValue: number)
    {
        super(type);

        this._creditValue = creditValue;
        this._objectId = objectId;
    }

    // AS3: RoomWidgetCreditFurniUpdateEvent.as::get creditValue()
    public get creditValue(): number
    {
        return this._creditValue;
    }

    // AS3: RoomWidgetCreditFurniUpdateEvent.as::get objectId()
    public get objectId(): number
    {
        return this._objectId;
    }
}
