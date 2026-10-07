/**
 * FurnitureVoteCounterLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureVoteCounterLogic.as
 *
 * Logic for vote counter furniture (animated vote counter).
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';
import type {RoomObjectDataUpdateMessage} from '../../scene/messages/RoomObjectDataUpdateMessage';
import type {VoteResultStuffData} from '../../scene/object/data/VoteResultStuffData';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureVoteCounterLogic extends FurnitureMultiStateLogic
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureVoteCounterLogic.as::UPDATE_INTERVAL
    private static readonly UPDATE_INTERVAL = 33;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureVoteCounterLogic.as::MAX_UPDATE_TIME
    private static readonly MAX_UPDATE_TIME = 1000;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureVoteCounterLogic.as::_total
    private _total: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureVoteCounterLogic.as::_lastUpdate
    private _lastUpdate: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureVoteCounterLogic.as::_updateInterval
    private _updateInterval: number = 33;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureVoteCounterLogic.as::get currentTotal()
    private get currentTotal(): number
    {
        return Math.trunc(this.object?.getModelController()?.getNumber(RoomObjectVariableEnum.FURNITURE_VOTE_COUNTER_COUNT) ?? 0);
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        const dataMessage = message as unknown as RoomObjectDataUpdateMessage;

        if('state' in message && 'data' in message && dataMessage.data !== null)
        {
            const voteData = dataMessage.data as unknown as VoteResultStuffData;

            if(typeof voteData.result === 'number')
            {
                this.updateTotal(voteData.result);
            }
        }
    }

    override update(time: number): void
    {
        super.update(time);

        if(this.object !== null)
        {
            const current = this.currentTotal;

            if(current !== this._total && time >= (this._lastUpdate + this._updateInterval))
            {
                const elapsed = time - this._lastUpdate;
                let steps = Math.trunc(elapsed / this._updateInterval);

                const direction = (this._total > current) ? 1 : -1;

                if(steps > (direction * (this._total - current)))
                {
                    steps = direction * (this._total - current);
                }

                this.object.getModelController()?.setNumber(
                    RoomObjectVariableEnum.FURNITURE_VOTE_COUNTER_COUNT,
                    current + (direction * steps)
                );

                this._lastUpdate = time - (elapsed - (steps * this._updateInterval));
            }
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureVoteCounterLogic.as::updateTotal()
    private updateTotal(value: number): void
    {
        this._total = value;

        if(this._lastUpdate === 0)
        {
            this.object?.getModelController()?.setNumber(RoomObjectVariableEnum.FURNITURE_VOTE_COUNTER_COUNT, value);
            this._lastUpdate = performance.now();
            return;
        }

        if(this._total !== this.currentTotal)
        {
            const diff = Math.abs(this._total - this.currentTotal);

            if((diff * FurnitureVoteCounterLogic.UPDATE_INTERVAL) > FurnitureVoteCounterLogic.MAX_UPDATE_TIME)
            {
                this._updateInterval = FurnitureVoteCounterLogic.MAX_UPDATE_TIME / diff;
            }
            else
            {
                this._updateInterval = FurnitureVoteCounterLogic.UPDATE_INTERVAL;
            }

            this._lastUpdate = performance.now();
        }
    }
}
