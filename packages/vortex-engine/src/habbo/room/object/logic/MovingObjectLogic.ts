/**
 * MovingObjectLogic
 *
 * Based on AS3: com.sulake.habbo.room.object.logic.MovingObjectLogic
 *
 * Base class for moving room objects with position interpolation.
 */
import type {RoomObjectUpdateMessage} from '@room/messages/RoomObjectUpdateMessage';
import type {IRoomObjectController} from '@room/object/IRoomObjectController';
import {ObjectLogicBase} from '@room/object/logic/ObjectLogicBase';
import type {IVector3d} from '@room/utils/IVector3d';
import {Vector3d} from '@room/utils/Vector3d';
import type {RoomObjectMoveUpdateMessage} from '../../messages/RoomObjectMoveUpdateMessage';
import {RoomObjectMoveEvent} from '../../events/RoomObjectMoveEvent';

export class MovingObjectLogic extends ObjectLogicBase
{
    // AS3: .../src/com/sulake/habbo/room/object/logic/MovingObjectLogic.as::DEFAULT_UPDATE_INTERVAL
    public static readonly DEFAULT_UPDATE_INTERVAL = 500;

    private static readonly _helperVector: Vector3d = new Vector3d();

    private _delta: Vector3d = new Vector3d();
    private _location: Vector3d = new Vector3d();
    // AS3: .../src/com/sulake/habbo/room/object/logic/MovingObjectLogic.as::_liftAmount
    private _liftAmount: number = 0;
    // AS3: .../src/com/sulake/habbo/room/object/logic/MovingObjectLogic.as::_changeTime
    private _changeTime: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/MovingObjectLogic.as::_overshootTime
    private _overshootTime: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/MovingObjectLogic.as::_curveStrength
    private _curveStrength: number = 0;

    override get object(): IRoomObjectController | null
    {
        return super.object;
    }

    override set object(value: IRoomObjectController | null)
    {
        super.object = value;

        if(value !== null)
        {
            this._location.assign(value.getLocation());
        }
    }

    private _moveUpdateInterval: number = 500;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/MovingObjectLogic.as::setMoveUpdateInterval()
    // AS3 stores 0 as NaN for overshoot and curve so the guards in update(),
    // fixDeltaAndIntervalForOvershooting() and calculateCurveOffset() short-circuit
    // when the caller passes no overshoot/curve. (The 2026 decompile writes a dead
    // `_curveStrength = NaN` before re-assigning param3 — the intent, mirrored on the
    // overshoot branch above it, is "0 means unset"; the downstream reads guard on
    // `isNaN(x) || x === 0` either way, so both forms behave identically.)
    protected setMoveUpdateInterval(interval: number, overshoot: number = 0, curve: number = 0): void
    {
        if(interval <= 0)
        {
            interval = 1;
        }

        this._moveUpdateInterval = interval;

        if(!isNaN(overshoot) && overshoot === 0)
        {
            overshoot = NaN;
        }

        this._overshootTime = overshoot;

        if(!isNaN(curve) && curve === 0)
        {
            curve = NaN;
        }

        this._curveStrength = curve;
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/MovingObjectLogic.as::_lastUpdateTime
    private _lastUpdateTime: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/logic/MovingObjectLogic.as::get lastUpdateTime()
    protected get lastUpdateTime(): number
    {
        return this._lastUpdateTime;
    }

    override dispose(): void
    {
        super.dispose();
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        if(message === null)
        {
            return;
        }

        super.processUpdateMessage(message);

        const moveMessage = message as RoomObjectMoveUpdateMessage;

        if(moveMessage && moveMessage.skipPositionUpdate)
        {
            return;
        }

        if(message.loc !== null)
        {
            this._location.assign(message.loc);
        }

        if(message.loc !== null)
        {
            this._delta.x = 0;
            this._delta.y = 0;
            this._delta.z = 0;
        }

        if(!moveMessage || !('targetLoc' in moveMessage))
        {
            return;
        }

        if(this.object !== null)
        {
            if(message.loc !== null)
            {
                const targetLoc = moveMessage.targetLoc;

                const interval = isNaN(moveMessage.animationTime) ? 500 : moveMessage.animationTime;
                this.setMoveUpdateInterval(interval, moveMessage.overshootAnimationTime, this.getCurveStrength(moveMessage));
                // AS3 falls back to getTimer() when no update() has run yet: without it,
                // _lastUpdateTime === 0 makes the first update()'s elapsed enormous, so
                // the object clamps to the interval end and teleports instead of sliding.
                // RoomInstance.update() ticks logic with performance.now(), the same clock.
                this._changeTime = this._lastUpdateTime > 0 ? this._lastUpdateTime : performance.now();

                this._delta.assign(targetLoc);
                this._delta.sub(this._location);
                this.fixDeltaAndIntervalForOvershooting();
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/MovingObjectLogic.as::getCurveStrength()
    protected getCurveStrength(message: RoomObjectMoveUpdateMessage): number
    {
        return message.curveStrength;
    }

    override getEventTypes(): string[]
    {
        const types = [RoomObjectMoveEvent.ROME_SLIDE_ANIMATION];

        return this.getAllEventTypes(super.getEventTypes(), types);
    }

    override update(time: number): void
    {
        const offset = this.getLocationOffset();
        const model = this.object?.getModelController();

        if(model !== null && model !== undefined)
        {
            if(offset !== null)
            {
                if(this._liftAmount !== offset.z)
                {
                    this._liftAmount = offset.z;
                    model.setNumber('furniture_lift_amount', this._liftAmount);
                }
            }
            else if(this._liftAmount !== 0)
            {
                this._liftAmount = 0;
                model.setNumber('furniture_lift_amount', this._liftAmount);
            }
        }

        if(this._delta.length > 0 || offset !== null)
        {
            let elapsed = time - this._changeTime;

            if(elapsed === this._moveUpdateInterval >> 1)
            {
                elapsed++;
            }

            if(elapsed > this._moveUpdateInterval)
            {
                elapsed = this._moveUpdateInterval;
            }

            if(this._delta.length > 0)
            {
                MovingObjectLogic._helperVector.assign(this._delta);
                MovingObjectLogic._helperVector.mul(elapsed / this._moveUpdateInterval);
                MovingObjectLogic._helperVector.add(this._location);
            }
            else
            {
                MovingObjectLogic._helperVector.assign(this._location);
            }

            if(offset !== null)
            {
                MovingObjectLogic._helperVector.add(offset);
            }

            // AS3 adds the jump/curve arc to z before committing the location.
            if(!isNaN(this._curveStrength) && this._curveStrength !== 0)
            {
                MovingObjectLogic._helperVector.z += this.calculateCurveOffset(elapsed, this._moveUpdateInterval);
            }

            if(this.object !== null)
            {
                this.object.setLocation(MovingObjectLogic._helperVector);
            }

            if(elapsed === this._moveUpdateInterval)
            {
                this._delta.x = 0;
                this._delta.y = 0;
                this._delta.z = 0;
            }

            if(this.eventDispatcher)
            {
                this.eventDispatcher.emit(RoomObjectMoveEvent.ROME_SLIDE_ANIMATION, new RoomObjectMoveEvent(RoomObjectMoveEvent.ROME_SLIDE_ANIMATION, this.object));
            }
        }

        this._lastUpdateTime = time;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/MovingObjectLogic.as::calculateCurveOffset()
    private calculateCurveOffset(elapsed: number, interval: number): number
    {
        if(isNaN(this._curveStrength) || this._curveStrength === 0)
        {
            return 0;
        }

        return 4 * (this._curveStrength / 100 * (this._delta.length / 4) / (interval * interval)) * elapsed * (interval - elapsed);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/MovingObjectLogic.as::fixDeltaAndIntervalForOvershooting()
    private fixDeltaAndIntervalForOvershooting(): void
    {
        if(!isNaN(this._overshootTime) && this._overshootTime !== 0 && this._moveUpdateInterval !== 0)
        {
            const z = this._delta.z;
            this._delta.mul((this._moveUpdateInterval + this._overshootTime) / this._moveUpdateInterval);
            this._delta.z = z;
            this._moveUpdateInterval += this._overshootTime;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/MovingObjectLogic.as::getLocationOffset()
    protected getLocationOffset(): IVector3d | null
    {
        return null;
    }
}
