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
import type {IRoomObjectEventHandler} from '@room/object/logic/IRoomObjectEventHandler';
import type {IRoomObjectModelController} from '@room/object/IRoomObjectModelController';
import {OrderedMap} from '@core/utils/OrderedMap';
import {RoomObjectVariableEnum} from '../RoomObjectVariableEnum';
import {RoomObjectVariableFxStatusUpdateMessage} from '../../messages/RoomObjectVariableFxStatusUpdateMessage';
import {RoomObjectVariableFxStatusRemoveMessage} from '../../messages/RoomObjectVariableFxStatusRemoveMessage';
import {VariableFxStatusModelData} from '../variablefx/VariableFxStatusModelData';
import {VariableFxStatusModelEntry} from '../variablefx/VariableFxStatusModelEntry';
import {VariableFxLogicStatus} from './VariableFxLogicStatus';
import type {VariableFxLogicConfig} from './VariableFxLogicConfig';
import type {VariableFxLogicConfigManager} from './VariableFxLogicConfigManager';

export class MovingObjectLogic extends ObjectLogicBase
{
    // AS3: .../src/com/sulake/habbo/room/object/logic/MovingObjectLogic.as::DEFAULT_UPDATE_INTERVAL
    public static readonly DEFAULT_UPDATE_INTERVAL = 500;

    /**
     * `showMode`'s two values, and the four bits of a config's `visibilityMask`.
     *
     * All six are bare literals in AS3. They are named here because the same `1` means "windowed"
     * in one comparison and "the status was created" in another, three methods apart.
     */
    // AS3: .../room/object/logic/MovingObjectLogic.as::isVariableFxStatusVisible()
    //   Names derived: every one of these is an unnamed literal in the AS3.
    private static readonly VARIABLE_FX_SHOW_MODE_ALWAYS = 0;
    private static readonly VARIABLE_FX_SHOW_MODE_WINDOWED = 1;

    // AS3: .../room/object/logic/MovingObjectLogic.as::getVariableFxChangeMask()
    private static readonly VARIABLE_FX_CHANGE_CREATED = 1;
    private static readonly VARIABLE_FX_CHANGE_INCREASED = 2;
    private static readonly VARIABLE_FX_CHANGE_DECREASED = 4;
    private static readonly VARIABLE_FX_CHANGE_UNCHANGED = 8;

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

    // ---------------------------------------------------------------------------------------
    // VariableFx
    //
    // This logic owns the live values for its object and republishes them, as one
    // `VariableFxStatusModelData`, into the object model under
    // `RoomObjectVariableEnum.VARIABLE_FX_STATUSES`. That model entry is the ONLY channel between
    // the feature's logic half and its visualization half.
    //
    // Only `AIR-1.0.31` has any of this. Every field below is obfuscated there and named from what
    // it does; the methods are readable and keep their names.
    // ---------------------------------------------------------------------------------------

    /**
     * Statuses by config id, then by variable id. Null until the first one arrives — most objects
     * in a room never carry an effect and should not pay for a map.
     */
    // AS3: .../room/object/logic/MovingObjectLogic.as::_variableFxStatuses
    private _variableFxStatuses: OrderedMap<number, OrderedMap<string, VariableFxLogicStatus>> | null = null;

    // AS3: .../room/object/logic/MovingObjectLogic.as::_variableFxStatusUpdateId (name derived)
    private _variableFxStatusUpdateId: number = 0;

    // AS3: .../room/object/logic/MovingObjectLogic.as::_variableFxModelUpdateId (name derived)
    private _variableFxModelUpdateId: number = 0;

    /**
     * The room config store's `updateId` as of the last publication. Starts at -1 so the first
     * comparison always differs, even against a store that has never been touched.
     */
    // AS3: .../room/object/logic/MovingObjectLogic.as::_lastSeenConfigUpdateId (name derived)
    private _lastSeenConfigUpdateId: number = -1;

    /**
     * The earliest moment a currently-visible status stops being visible, or 0 when none will.
     * `update()` skips all the work below until then.
     */
    // AS3: .../room/object/logic/MovingObjectLogic.as::_variableFxNextDeadline (name derived)
    private _variableFxNextDeadline: number = 0;

    // AS3: .../room/object/logic/MovingObjectLogic.as::_variableFxDirty (name derived)
    private _variableFxDirty: boolean = false;

    // AS3: .../room/object/logic/MovingObjectLogic.as::_variableFxHolderHovered (name derived)
    private _variableFxHolderHovered: boolean = false;

    // AS3: .../room/object/logic/MovingObjectLogic.as::_publishedVariableFx (name derived)
    private _publishedVariableFx: VariableFxStatusModelData | null = null;

    /**
     * The room's config store for this object's half. Null here and overridden by the logics that
     * have one — AvatarLogic, PetLogic and the furniture logic each reach their own room data.
     */
    // AS3: .../room/object/logic/MovingObjectLogic.as::get variableFxLogicManager()
    protected get variableFxLogicManager(): VariableFxLogicConfigManager | null
    {
        return null;
    }

    // AS3: .../room/object/logic/MovingObjectLogic.as::setVariableFxHolderHovered()
    protected setVariableFxHolderHovered(hovered: boolean): void
    {
        if(this._variableFxHolderHovered !== hovered)
        {
            this._variableFxHolderHovered = hovered;
            this._variableFxDirty = true;
        }
    }

    /**
     * Handles the two VariableFx update messages, and returns whether it did — the caller uses
     * that to stop looking.
     */
    // AS3: .../room/object/logic/MovingObjectLogic.as::processVariableFxStatusMessage()
    protected processVariableFxStatusMessage(message: RoomObjectUpdateMessage): boolean
    {
        if(message instanceof RoomObjectVariableFxStatusUpdateMessage)
        {
            const now = Date.now();

            this.upsertVariableFxStatus(new VariableFxLogicStatus(
                message.configId,
                message.variableId,
                message.value,
                message.overrideMinValue,
                message.overrideMaxValue,
                message.extra,
                message.initialize,
                now
            ), now);

            this.updateVariableFxPublication(now, this.getVariableFxModelController());

            return true;
        }

        if(message instanceof RoomObjectVariableFxStatusRemoveMessage)
        {
            this.removeVariableFxStatus(message.configId, message.variableId);
            this.updateVariableFxPublication(Date.now(), this.getVariableFxModelController());

            return true;
        }

        return false;
    }

    /**
     * Moves the VariableFx state to a logic that is replacing this one, without republishing.
     *
     * The room engine rebuilds an object's logic when its type changes, and an avatar that puts on
     * an effect goes through exactly that. Without this the effect silently resets. The donor's
     * references are nulled rather than copied: both would otherwise dispose the same maps.
     */
    // AS3: .../room/object/logic/MovingObjectLogic.as::transferStateFrom()
    transferStateFrom(other: IRoomObjectEventHandler): void
    {
        const donor = other as MovingObjectLogic;

        if(!(donor instanceof MovingObjectLogic) || donor === this) return;

        this._variableFxStatuses = donor._variableFxStatuses;
        this._variableFxStatusUpdateId = donor._variableFxStatusUpdateId;
        this._variableFxModelUpdateId = donor._variableFxModelUpdateId;
        this._lastSeenConfigUpdateId = donor._lastSeenConfigUpdateId;
        this._variableFxNextDeadline = donor._variableFxNextDeadline;
        this._variableFxDirty = donor._variableFxDirty;
        this._variableFxHolderHovered = donor._variableFxHolderHovered;
        this._publishedVariableFx = donor._publishedVariableFx;

        donor._variableFxStatuses = null;
        donor._publishedVariableFx = null;
    }

    /**
     * An existing status keeps its `createdAt` and its open window; only the value and the stamps
     * move. An initialize never opens a window — a whole-room sync is not a change the user made.
     */
    // AS3: .../room/object/logic/MovingObjectLogic.as::upsertVariableFxStatus()
    private upsertVariableFxStatus(status: VariableFxLogicStatus, time: number): void
    {
        this._variableFxStatuses ??= new OrderedMap();

        let byVariable = this._variableFxStatuses.getValue(status.configId);
        let changeMask = MovingObjectLogic.VARIABLE_FX_CHANGE_CREATED;

        if(byVariable === null)
        {
            byVariable = new OrderedMap<string, VariableFxLogicStatus>();
            this._variableFxStatuses.add(status.configId, byVariable);
        }

        const previous = byVariable.getValue(status.variableId);

        if(previous !== null)
        {
            changeMask = MovingObjectLogic.getVariableFxChangeMask(previous.value, status.value);
            status.createdAt = previous.createdAt;
            status.showUntil = previous.showUntil;
            previous.dispose();
            byVariable.replace(status.variableId, status);
        }
        else
        {
            byVariable.add(status.variableId, status);
        }

        status.updatedAt = time;
        this._variableFxStatusUpdateId += 1;
        status.updateId = this._variableFxStatusUpdateId;

        if(!status.isInitialize) this.updateVariableFxVisibilityWindow(status, changeMask, time);

        this._variableFxDirty = true;
    }

    // AS3: .../room/object/logic/MovingObjectLogic.as::removeVariableFxStatus()
    private removeVariableFxStatus(configId: number, variableId: string): void
    {
        if(this._variableFxStatuses === null) return;

        const byVariable = this._variableFxStatuses.getValue(configId);

        if(byVariable === null) return;

        const removed = byVariable.remove(variableId);

        if(removed !== null)
        {
            removed.dispose();
            this._variableFxDirty = true;
        }

        if(byVariable.length === 0)
        {
            this._variableFxStatuses.remove(configId);
            byVariable.dispose();
        }
    }

    // AS3: .../room/object/logic/MovingObjectLogic.as::clearVariableFxStatuses()
    private clearVariableFxStatuses(): void
    {
        if(this._variableFxStatuses === null) return;

        for(let i = 0; i < this._variableFxStatuses.length; i += 1)
        {
            const byVariable = this._variableFxStatuses.getWithIndex(i);

            if(byVariable === null) continue;

            for(let j = 0; j < byVariable.length; j += 1)
            {
                byVariable.getWithIndex(j)?.dispose();
            }

            byVariable.dispose();
        }

        this._variableFxStatuses.reset();
        this._variableFxDirty = true;
    }

    /**
     * Which bit of a config's `visibilityMask` this change corresponds to. These four values are
     * the whole vocabulary of that mask, and the reason the wired editor clamps it to 0..15.
     */
    // AS3: .../room/object/logic/MovingObjectLogic.as::getVariableFxChangeMask()
    private static getVariableFxChangeMask(previous: number, next: number): number
    {
        if(next > previous) return MovingObjectLogic.VARIABLE_FX_CHANGE_INCREASED;

        if(next < previous) return MovingObjectLogic.VARIABLE_FX_CHANGE_DECREASED;

        return MovingObjectLogic.VARIABLE_FX_CHANGE_UNCHANGED;
    }

    // AS3: .../room/object/logic/MovingObjectLogic.as::updateVariableFxVisibilityWindow()
    private updateVariableFxVisibilityWindow(status: VariableFxLogicStatus, changeMask: number, time: number): void
    {
        const config = this.getVariableFxConfig(status.configId);

        if(config === null || config.showMode !== MovingObjectLogic.VARIABLE_FX_SHOW_MODE_WINDOWED) return;

        if((config.visibilityMask & changeMask) !== 0) status.showUntil = time + config.showDuration;
    }

    /**
     * The early-out that keeps this off the frame budget. Nothing republishes unless something
     * changed, the room's configs changed under it, or a visibility window has since closed.
     */
    // AS3: .../room/object/logic/MovingObjectLogic.as::updateVariableFxPublication()
    private updateVariableFxPublication(time: number, model: IRoomObjectModelController | null): void
    {
        if(model === null) return;

        const hasStatuses = this._variableFxStatuses !== null && this._variableFxStatuses.length > 0;

        if(!hasStatuses && this._publishedVariableFx === null)
        {
            this._variableFxDirty = false;
            this._variableFxNextDeadline = 0;

            return;
        }

        const configUpdateId = this.variableFxLogicManager?.updateId ?? 0;

        if(this._lastSeenConfigUpdateId !== configUpdateId)
        {
            this._lastSeenConfigUpdateId = configUpdateId;
            this._variableFxDirty = true;
        }

        if(!this._variableFxDirty && (this._variableFxNextDeadline <= 0 || time < this._variableFxNextDeadline)) return;

        this.publishVariableFxStatuses(time, model);
    }

    /**
     * Builds the model the visualization reads. A status that is currently invisible is still
     * published — flagged `invisible`, and forced to `isInitialize` so the renderer does not
     * animate it back in — because the renderer needs the value to be there when the window
     * reopens.
     */
    // AS3: .../room/object/logic/MovingObjectLogic.as::publishVariableFxStatuses()
    private publishVariableFxStatuses(time: number, model: IRoomObjectModelController): void
    {
        const published = new OrderedMap<number, OrderedMap<string, VariableFxStatusModelEntry>>();
        let nextDeadline = 0;

        for(let i = 0; this._variableFxStatuses !== null && i < this._variableFxStatuses.length; i += 1)
        {
            const configId = this._variableFxStatuses.getKey(i);
            const byVariable = this._variableFxStatuses.getWithIndex(i);

            if(configId === null || byVariable === null) continue;

            const config = this.getVariableFxConfig(configId);

            if(config === null) continue;

            for(let j = 0; j < byVariable.length; j += 1)
            {
                const variableId = byVariable.getKey(j);
                const status = byVariable.getWithIndex(j);

                if(variableId === null || status === null) continue;

                const visible = this.isVariableFxStatusVisible(status, config, time);

                let entries = published.getValue(configId);

                if(entries === null)
                {
                    entries = new OrderedMap<string, VariableFxStatusModelEntry>();
                    published.add(configId, entries);
                }

                entries.add(variableId, new VariableFxStatusModelEntry(
                    status.configId,
                    status.variableId,
                    status.createdAt,
                    status.updateId,
                    status.value,
                    status.overrideMinValue,
                    status.overrideMaxValue,
                    status.extra?.clone() ?? null,
                    status.isInitialize || !visible,
                    !visible
                ));

                // The soonest window that will close on its own. A hover-driven one is excluded:
                // it closes when the pointer leaves, which is an event, not a deadline.
                const closesOnItsOwn = visible
                    && config.showMode === MovingObjectLogic.VARIABLE_FX_SHOW_MODE_WINDOWED
                    && (!this._variableFxHolderHovered || !config.showOnMouseHover)
                    && status.showUntil > time;

                if(closesOnItsOwn && (nextDeadline <= 0 || status.showUntil < nextDeadline))
                {
                    nextDeadline = status.showUntil;
                }
            }
        }

        let model_: VariableFxStatusModelData | null = null;

        if(published.length > 0)
        {
            this._variableFxModelUpdateId += 1;
            model_ = new VariableFxStatusModelData(this._variableFxModelUpdateId, published);
        }
        else
        {
            published.dispose();
        }

        if(this._publishedVariableFx === null && model_ === null)
        {
            this._variableFxDirty = false;
            this._variableFxNextDeadline = nextDeadline;

            return;
        }

        const previous = this._publishedVariableFx;

        this._publishedVariableFx = model_;
        model.setObject(RoomObjectVariableEnum.VARIABLE_FX_STATUSES, model_);

        // Disposed only after the new one is in the model: the visualization reads synchronously,
        // and freeing the old entries first would hand it disposed maps.
        previous?.dispose();

        this._variableFxDirty = false;
        this._variableFxNextDeadline = nextDeadline;
    }

    // AS3: .../room/object/logic/MovingObjectLogic.as::isVariableFxStatusVisible()
    private isVariableFxStatusVisible(status: VariableFxLogicStatus, config: VariableFxLogicConfig, time: number): boolean
    {
        if(config.showMode === MovingObjectLogic.VARIABLE_FX_SHOW_MODE_ALWAYS) return true;

        if(config.showOnMouseHover && this._variableFxHolderHovered) return true;

        return config.showMode === MovingObjectLogic.VARIABLE_FX_SHOW_MODE_WINDOWED && status.showUntil > time;
    }

    // AS3: .../room/object/logic/MovingObjectLogic.as::getVariableFxConfig()
    private getVariableFxConfig(configId: number): VariableFxLogicConfig | null
    {
        return this.variableFxLogicManager?.getConfig(configId) ?? null;
    }

    // AS3: .../room/object/logic/MovingObjectLogic.as::clearPublishedVariableFxStatusData()
    private clearPublishedVariableFxStatusData(): void
    {
        const model = this.getVariableFxModelController();

        if(model !== null && this._publishedVariableFx !== null)
        {
            model.setObject(RoomObjectVariableEnum.VARIABLE_FX_STATUSES, null);
        }
    }

    // AS3: .../room/object/logic/MovingObjectLogic.as::getVariableFxModelController()
    private getVariableFxModelController(): IRoomObjectModelController | null
    {
        return this.object?.getModelController() ?? null;
    }

    override dispose(): void
    {
        // Before the maps go: the model outlives this logic when the object is being re-typed, and
        // a stale VariableFx entry there would be read against disposed data.
        this.clearPublishedVariableFxStatusData();

        if(this._publishedVariableFx !== null)
        {
            this._publishedVariableFx.dispose();
            this._publishedVariableFx = null;
        }

        this.clearVariableFxStatuses();

        if(this._variableFxStatuses !== null)
        {
            this._variableFxStatuses.dispose();
            this._variableFxStatuses = null;
        }

        super.dispose();
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        if(message === null)
        {
            return;
        }

        // Handled and done: a VariableFx status changes neither location nor direction, so none of
        // the movement work below applies to it.
        if(this.processVariableFxStatusMessage(message)) return;

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

            // Inside the model block, as AS3 has it: republishing needs a model to publish into,
            // and the early-out in updateVariableFxPublication() is what keeps this cheap on the
            // overwhelming majority of frames, where nothing has changed and no window has closed.
            this.updateVariableFxPublication(time, model);
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
