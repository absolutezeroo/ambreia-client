/**
 * FurnitureScoreLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureScoreLogic.as
 *
 * Logic for score furniture (animated score counter).
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import {FurnitureLogic} from './FurnitureLogic';
import type {RoomObjectDataUpdateMessage} from '../../scene/messages/RoomObjectDataUpdateMessage';

export class FurnitureScoreLogic extends FurnitureLogic
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureScoreLogic.as::UPDATE_INTERVAL
    private static readonly UPDATE_INTERVAL = 50;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureScoreLogic.as::MAX_UPDATE_TIME
    private static readonly MAX_UPDATE_TIME = 3000;

    private _targetScore: number = 0;
    private _lastScoreUpdate: number = 0;
    private _updateInterval: number = 50;

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        const dataMessage = message as unknown as RoomObjectDataUpdateMessage;

        if('state' in message && 'data' in message && typeof dataMessage.state === 'number')
        {
            this.updateTargetScore(dataMessage.state);
            return;
        }

        super.processUpdateMessage(message);
    }

    override update(time: number): void
    {
        super.update(time);

        if(this.object !== null)
        {
            const currentScore = this.object.getState(0);

            if(currentScore !== this._targetScore && time >= (this._lastScoreUpdate + this._updateInterval))
            {
                const elapsed = time - this._lastScoreUpdate;
                let steps = Math.trunc(elapsed / this._updateInterval);

                const direction = (this._targetScore > currentScore) ? 1 : -1;

                if(steps > (direction * (this._targetScore - currentScore)))
                {
                    steps = direction * (this._targetScore - currentScore);
                }

                this.object.setState(currentScore + (direction * steps), 0);
                this._lastScoreUpdate = time - (elapsed - (steps * this._updateInterval));
            }
        }
    }

    private updateTargetScore(score: number): void
    {
        this._targetScore = score;

        if(this.object === null)
        {
            return;
        }

        const currentScore = this.object.getState(0);

        if(this._targetScore !== currentScore)
        {
            let diff = this._targetScore - currentScore;

            if(diff < 0)
            {
                diff = -diff;
            }

            if((diff * FurnitureScoreLogic.UPDATE_INTERVAL) > FurnitureScoreLogic.MAX_UPDATE_TIME)
            {
                this._updateInterval = FurnitureScoreLogic.MAX_UPDATE_TIME / diff;
            }
            else
            {
                this._updateInterval = FurnitureScoreLogic.UPDATE_INTERVAL;
            }

            this._lastScoreUpdate = performance.now();
        }
    }
}
