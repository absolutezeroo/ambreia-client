/**
 * FurnitureIceStormLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureIceStormLogic.as
 *
 * Logic for ice storm furniture (delayed state transitions).
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';
import {RoomObjectDataUpdateMessage} from '../../scene/messages/RoomObjectDataUpdateMessage';
import {LegacyStuffData} from '../../scene/object/data/LegacyStuffData';

export class FurnitureIceStormLogic extends FurnitureMultiStateLogic
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureIceStormLogic.as::_nextState
    private _nextState: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureIceStormLogic.as::_nextStateExtra
    private _nextStateExtra: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureIceStormLogic.as::_nextStateTimeStamp
    private _nextStateTimeStamp: number = 0;

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        if(message === null)
        {
            return;
        }

        const dataMessage = message as unknown as RoomObjectDataUpdateMessage;

        if('state' in message && 'data' in message && typeof dataMessage.state === 'number')
        {
            this.handleDelayedStateUpdate(dataMessage);
            return;
        }

        super.processUpdateMessage(message);
    }

    override update(time: number): void
    {
        if(this._nextStateTimeStamp > 0 && time >= this._nextStateTimeStamp)
        {
            this._nextStateTimeStamp = 0;

            const stuffData = new LegacyStuffData();
            stuffData.setString(String(this._nextState));

            const newMessage = new RoomObjectDataUpdateMessage(this._nextState, stuffData, this._nextStateExtra);
            super.processUpdateMessage(newMessage as unknown as RoomObjectUpdateMessage);
        }

        super.update(time);
    }

    private handleDelayedStateUpdate(message: RoomObjectDataUpdateMessage): void
    {
        const actualState = Math.trunc(message.state / 1000);
        const delay = message.state % 1000;

        if(delay === 0)
        {
            this._nextStateTimeStamp = 0;

            const stuffData = new LegacyStuffData();
            stuffData.setString(String(actualState));

            const newMessage = new RoomObjectDataUpdateMessage(actualState, stuffData, message.extra);
            super.processUpdateMessage(newMessage as unknown as RoomObjectUpdateMessage);
        }
        else
        {
            this._nextState = actualState;
            this._nextStateExtra = message.extra;
            this._nextStateTimeStamp = this.lastUpdateTime + delay;
        }
    }
}
