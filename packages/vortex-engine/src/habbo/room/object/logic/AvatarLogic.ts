/**
 * AvatarLogic
 *
 * Based on AS3: com.sulake.habbo.room.object.logic.AvatarLogic
 *
 * Logic for avatar room objects (users, bots).
 */
import type {RoomObjectUpdateMessage} from '@room/messages/RoomObjectUpdateMessage';
import type {IRoomObjectModelController} from '@room/object/IRoomObjectModelController';
import {Vector3d} from '@room/utils/Vector3d';
import type {IRoomGeometry} from '@room/utils/IRoomGeometry';
import {RoomObjectMouseEvent} from '@room/events/RoomObjectMouseEvent';
import {MovingObjectLogic} from './MovingObjectLogic';
import {RoomObjectMoveEvent} from '../../events/RoomObjectMoveEvent';
import {RoomObjectFurnitureActionEvent} from '../../events/RoomObjectFurnitureActionEvent';
import type {RoomObjectMoveUpdateMessage} from '../../messages/RoomObjectMoveUpdateMessage';
import {RoomObjectAvatarUpdateMessage} from '../../messages/RoomObjectAvatarUpdateMessage';
import {RoomObjectAvatarPostureUpdateMessage} from '../../messages/RoomObjectAvatarPostureUpdateMessage';
import {RoomObjectAvatarChatUpdateMessage} from '../../messages/RoomObjectAvatarChatUpdateMessage';
import {RoomObjectAvatarTypingUpdateMessage} from '../../messages/RoomObjectAvatarTypingUpdateMessage';
import {RoomObjectAvatarGestureUpdateMessage} from '../../messages/RoomObjectAvatarGestureUpdateMessage';
import {RoomObjectAvatarExpressionUpdateMessage} from '../../messages/RoomObjectAvatarExpressionUpdateMessage';
import {RoomObjectAvatarDanceUpdateMessage} from '../../messages/RoomObjectAvatarDanceUpdateMessage';
import {AvatarAction} from '@habbo/avatar/enum/AvatarAction';
import {RoomObjectAvatarSleepUpdateMessage} from '../../messages/RoomObjectAvatarSleepUpdateMessage';
import {RoomObjectAvatarEffectUpdateMessage} from '../../messages/RoomObjectAvatarEffectUpdateMessage';
import {RoomObjectAvatarCarryObjectUpdateMessage} from '../../messages/RoomObjectAvatarCarryObjectUpdateMessage';
import {RoomObjectAvatarHabbiconUpdateMessage} from '../../messages/RoomObjectAvatarHabbiconUpdateMessage';
import {HabbiconAssetManager} from '@habbo/habbicons/assets/HabbiconAssetManager';
import {RoomObjectAvatarUseObjectUpdateMessage} from '../../messages/RoomObjectAvatarUseObjectUpdateMessage';
import {RoomObjectAvatarSignUpdateMessage} from '../../messages/RoomObjectAvatarSignUpdateMessage';
import {RoomObjectAvatarFigureUpdateMessage} from '../../messages/RoomObjectAvatarFigureUpdateMessage';
import {RoomObjectAvatarSelectedMessage} from '../../messages/RoomObjectAvatarSelectedMessage';
import {RoomObjectAvatarDirectionUpdateMessage} from '../../messages/RoomObjectAvatarDirectionUpdateMessage';
import {RoomObjectAvatarMutedUpdateMessage} from '../../messages/RoomObjectAvatarMutedUpdateMessage';
import {RoomObjectAvatarPlayingGameMessage} from '../../messages/RoomObjectAvatarPlayingGameMessage';
import {RoomObjectAvatarPlayerValueUpdateMessage} from '../../messages/RoomObjectAvatarPlayerValueUpdateMessage';
import {RoomObjectAvatarBlockedUpdateMessage} from '../../messages/RoomObjectAvatarBlockedUpdateMessage';
import {RoomObjectAvatarFlatControlUpdateMessage} from '../../messages/RoomObjectAvatarFlatControlUpdateMessage';
import {RoomObjectAvatarGuideStatusUpdateMessage} from '../../messages/RoomObjectAvatarGuideStatusUpdateMessage';
import {RoomObjectAvatarOwnMessage} from '../../messages/RoomObjectAvatarOwnMessage';

export class AvatarLogic extends MovingObjectLogic
{
    // Constants
    private static readonly WARP_DISTANCE = 1.5;
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::EFFECT_TYPE_SPLASH
    private static readonly EFFECT_TYPE_SPLASH = 28;
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::EFFECT_TYPE_SWIM
    private static readonly EFFECT_TYPE_SWIM = 29;
    private static readonly EFFECT_TYPE_SPLASH_DARK = 184;
    private static readonly EFFECT_TYPE_SWIM_DARK = 185;
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::EFFECT_SPLASH_LENGTH
    private static readonly EFFECT_SPLASH_LENGTH = 500;

    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::CARRY_ITEM_NULL
    private static readonly CARRY_ITEM_NULL = 0;
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::CARRY_ITEM_LAST_CONSUMABLE
    private static readonly CARRY_ITEM_LAST_CONSUMABLE = 999;
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::CARRY_ITEM_EMPTY_HAND
    private static readonly CARRY_ITEM_EMPTY_HAND = 999999999;
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::CARRY_ITEM_DELAY_BEFORE_USE
    private static readonly CARRY_ITEM_DELAY_BEFORE_USE = 5000;
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::CARRY_ITEM_EMPTY_HAND_ANIMATION_LENGTH
    private static readonly CARRY_ITEM_EMPTY_HAND_ANIMATION_LENGTH = 1500;

    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::SPINNING_DUCK_HABBICON_NAME
    private static readonly SPINNING_DUCK_HABBICON_NAME = 'duck_spinning';
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::HABBICON_SPIN_DURATION_MS
    private static readonly HABBICON_SPIN_DURATION_MS = 3200;
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::HABBICON_SPIN_STEP_MS
    private static readonly HABBICON_SPIN_STEP_MS = 100;
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::HABBICON_SPIN_STEP_DEGREES
    private static readonly HABBICON_SPIN_STEP_DEGREES = -45;

    /**
     * How long a triggered Habbicon stays on the avatar. AS3 spells the 6000 inline at its one use
     * and gives it no constant, so this one is DERIVED — the four above are real names.
     */
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::processUpdateMessage()
    private static readonly HABBICON_VISIBLE_MS = 6000;

    // Selection state
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::_selected
    private _selected = false;
    private _lastLocation: Vector3d | null = null;

    // Effect state
    private _effectChangeTime = 0;
    private _nextEffect = 0;

    // Timed actions
    private _talkEndTime = 0;
    private _talkPauseTime = 0;
    private _talkResumeTime = 0;
    private _gestureEndTime = 0;
    private _expressionEndTime = 0;
    private _signEndTime = 0;
    private _playerValueEndTime = 0;

    // Habbicon state. All four are obfuscated in AS3 (`_SafeStr_7460`, `_SafeStr_7797`,
    // `_SafeStr_7404`, `_SafeStr_7233`) and recovered in no tree, so the names are DERIVED from
    // what each one is compared against.
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::_SafeStr_7460
    private _habbiconEndTime = 0;
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::_SafeStr_7797
    private _habbiconSpinStartTime = 0;
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::_SafeStr_7404
    private _habbiconSpinEndTime = 0;
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::_SafeStr_7233
    private _habbiconSpinOffset = 0;

    // Carry object state
    private _carryObjectStartTime = 0;
    private _carryObjectEndTime = 0;
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::_allowUseCarryObject
    private _allowUseCarryObject = false;

    // Blink animation
    private _nextBlinkTime = 0;
    private _blinkEndTime = 0;

    constructor()
    {
        super();
        this._nextBlinkTime = Date.now() + this.getBlinkInterval();
    }

    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectMouseEvent.ROE_MOUSE_CLICK,
            RoomObjectMoveEvent.ROME_POSITION_CHANGED,
            RoomObjectMouseEvent.ROE_MOUSE_ENTER,
            RoomObjectMouseEvent.ROE_MOUSE_LEAVE,
            RoomObjectFurnitureActionEvent.ROFCAE_MOUSE_BUTTON,
            RoomObjectFurnitureActionEvent.ROFCAE_MOUSE_ARROW
        ];

        return this.getAllEventTypes(super.getEventTypes(), types);
    }

    override dispose(): void
    {
        if(this._selected && this.object !== null)
        {
            if(this.eventDispatcher !== null)
            {
                const event = new RoomObjectMoveEvent(RoomObjectMoveEvent.ROME_OBJECT_REMOVED, this.object);
                this.eventDispatcher.emit(event.type, event);
            }
        }

        super.dispose();
        this._lastLocation = null;
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        if(message === null || this.object === null)
        {
            return;
        }

        super.processUpdateMessage(message);

        const model = this.object.getModelController();
        if(model === null)
        {
            return;
        }

        // Avatar Update (head direction, vertical offset)
        if(message instanceof RoomObjectAvatarUpdateMessage)
        {
            model.setNumber('head_direction', message.dirHead);
            model.setNumber('figure_can_stand_up', message.canStandUp ? 1 : 0);
            model.setNumber('figure_vertical_offset', message.baseY);

            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/AvatarLogic.as::processUpdateMessage()
            // getCurveStrength() reads figure_jumping_power back to arc the jump.
            if(!isNaN(message.jumpingPower))
            {
                model.setNumber('figure_jumping_power', message.jumpingPower);
            }

            return;
        }

        // Posture (sit, lay, std)
        if(message instanceof RoomObjectAvatarPostureUpdateMessage)
        {
            model.setString('figure_posture', message.postureType);
            model.setString('figure_posture_parameter', message.parameter);
            return;
        }

        // Chat (talk animation)
        if(message instanceof RoomObjectAvatarChatUpdateMessage)
        {
            model.setNumber('figure_talk', 1);
            this._talkEndTime = Date.now() + message.numberOfWords * 1000;
            return;
        }

        // Typing indicator
        if(message instanceof RoomObjectAvatarTypingUpdateMessage)
        {
            model.setNumber('figure_is_typing', message.isTyping ? 1 : 0);
            return;
        }

        // Muted state
        if(message instanceof RoomObjectAvatarMutedUpdateMessage)
        {
            model.setNumber('figure_is_muted', message.isMuted ? 1 : 0);
            return;
        }

        // Playing game state
        if(message instanceof RoomObjectAvatarPlayingGameMessage)
        {
            model.setNumber('figure_is_playing_game', message.isPlayingGame ? 1 : 0);
            return;
        }

        // Head direction only
        if(message instanceof RoomObjectAvatarDirectionUpdateMessage)
        {
            model.setNumber('head_direction', message.dirHead);
            return;
        }

        // Gesture
        if(message instanceof RoomObjectAvatarGestureUpdateMessage)
        {
            model.setNumber('figure_gesture', message.gesture);
            this._gestureEndTime = Date.now() + 3000;
            return;
        }

        // Expression
        if(message instanceof RoomObjectAvatarExpressionUpdateMessage)
        {
            model.setNumber('figure_expression', message.expressionType);

            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/AvatarLogic.as::processUpdateMessage()
            this._expressionEndTime = AvatarAction.getExpressionTime(model.getNumber('figure_expression'));

            if(this._expressionEndTime > -1)
            {
                this._expressionEndTime += Date.now();
            }

            return;
        }

        // Dance
        if(message instanceof RoomObjectAvatarDanceUpdateMessage)
        {
            model.setNumber('figure_dance', message.danceStyle);
            return;
        }

        // Sleep
        if(message instanceof RoomObjectAvatarSleepUpdateMessage)
        {
            model.setNumber('figure_sleep', message.isSleeping ? 1 : 0);
            return;
        }

        // Player value (game score)
        if(message instanceof RoomObjectAvatarPlayerValueUpdateMessage)
        {
            model.setNumber('figure_number_value', message.value);
            this._playerValueEndTime = Date.now() + 3000;
            return;
        }

        // Habbicon
        if(message instanceof RoomObjectAvatarHabbiconUpdateMessage)
        {
            // One `now` for all four writes, exactly as AS3 takes one `getTimer()`: the trigger
            // sequence is what the visualization compares to decide a Habbicon is *new*, so it has
            // to be the same value the spin animation starts from.
            const triggeredAt = Date.now();

            model.setNumber('figure_habbicon', message.habbiconId);
            model.setNumber('figure_habbicon_trigger_sequence', triggeredAt);

            this._habbiconEndTime = triggeredAt + AvatarLogic.HABBICON_VISIBLE_MS;

            this.updateHabbiconSpinForHabbicon(message.habbiconId, triggeredAt, model);

            return;
        }

        // Effect
        if(message instanceof RoomObjectAvatarEffectUpdateMessage)
        {
            this.updateEffect(message.effect, message.delayMilliSeconds, model);
            return;
        }

        // Carry object
        if(message instanceof RoomObjectAvatarCarryObjectUpdateMessage)
        {
            model.setNumber('figure_carry_object', message.itemType);
            model.setNumber('figure_use_object', 0);
            this._carryObjectStartTime = Date.now();

            if(message.itemType < AvatarLogic.CARRY_ITEM_EMPTY_HAND)
            {
                this._carryObjectEndTime = 0;
                this._allowUseCarryObject = message.itemType <= AvatarLogic.CARRY_ITEM_LAST_CONSUMABLE;
            }
            else
            {
                this._carryObjectEndTime = this._carryObjectStartTime + AvatarLogic.CARRY_ITEM_EMPTY_HAND_ANIMATION_LENGTH;
                this._allowUseCarryObject = false;
            }
            return;
        }

        // Use object
        if(message instanceof RoomObjectAvatarUseObjectUpdateMessage)
        {
            model.setNumber('figure_use_object', message.itemType);
            return;
        }

        // Sign
        if(message instanceof RoomObjectAvatarSignUpdateMessage)
        {
            model.setNumber('figure_sign', message.signType);
            this._signEndTime = Date.now() + 5000;
            return;
        }

        // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::processUpdateMessage()
        // Blocked state — the visualization reads `blocked` off the model.
        if(message instanceof RoomObjectAvatarBlockedUpdateMessage)
        {
            // AS3 writes the literal here, not the RoomObjectVariableEnum constant of the
            // same value — same as the neighbouring branches in this file.
            model.setNumber('blocked', message.isBlocked ? 1 : 0);

            return;
        }

        // Flat control (room rights)
        if(message instanceof RoomObjectAvatarFlatControlUpdateMessage)
        {
            // `rawData` is null when `onUserUpdate()` resets flat control before walking the
            // actions; AS3's `parseInt(null)` is NaN and lands in the else below, clearing
            // the marker. `?? ''` reproduces that.
            const value = parseInt(message.rawData ?? '');
            if(!isNaN(value) && value >= 0 && value <= 5)
            {
                model.setNumber('figure_flat_control', value);
            }
            else
            {
                model.setNumber('figure_flat_control', 0);
            }
            return;
        }

        // Figure update
        if(message instanceof RoomObjectAvatarFigureUpdateMessage)
        {
            let figure = message.figure;
            const currentFigure = model.getString('figure');

            // Preserve BDS (body shadow?) portion from current figure
            if(currentFigure !== null && currentFigure.indexOf('.bds-') !== -1)
            {
                figure += currentFigure.substring(currentFigure.indexOf('.bds-'));
            }

            model.setString('figure', figure);
            model.setString('gender', message.gender);
            return;
        }

        // Selection state
        if(message instanceof RoomObjectAvatarSelectedMessage)
        {
            this._selected = message.selected;
            this._lastLocation = null;
            return;
        }

        // Guide status
        if(message instanceof RoomObjectAvatarGuideStatusUpdateMessage)
        {
            model.setNumber('figure_guide_status', message.guideStatus);
            return;
        }

        // Own avatar marker
        if(message instanceof RoomObjectAvatarOwnMessage)
        {
            model.setNumber('own_user', 1);
            return;
        }
    }

    override mouseEvent(event: {
        type: string;
        eventId?: string;
        altKey?: boolean;
        ctrlKey?: boolean;
        shiftKey?: boolean;
        buttonDown?: boolean
    }, _geometry: IRoomGeometry | null): void
    {
        if(this.object === null || event === null)
        {
            return;
        }

        const model = this.object.getModelController();
        let eventType: string | null = null;

        switch(event.type)
        {
            case 'click':
                eventType = RoomObjectMouseEvent.ROE_MOUSE_CLICK;
                break;

            case 'rollOver':
                eventType = RoomObjectMouseEvent.ROE_MOUSE_ENTER;
                if(model !== null)
                {
                    model.setNumber('figure_highlight', 1);
                }
                if(this.eventDispatcher)
                {
                    this.eventDispatcher.emit(RoomObjectFurnitureActionEvent.ROFCAE_MOUSE_BUTTON, new RoomObjectFurnitureActionEvent(RoomObjectFurnitureActionEvent.ROFCAE_MOUSE_BUTTON, this.object));
                }
                break;

            case 'rollOut':
                if(model !== null)
                {
                    model.setNumber('figure_highlight', 0);
                }
                eventType = RoomObjectMouseEvent.ROE_MOUSE_LEAVE;
                if(this.eventDispatcher)
                {
                    this.eventDispatcher.emit(RoomObjectFurnitureActionEvent.ROFCAE_MOUSE_ARROW, new RoomObjectFurnitureActionEvent(RoomObjectFurnitureActionEvent.ROFCAE_MOUSE_ARROW, this.object));
                }
                break;

            // AS3 AvatarLogic.as:435-441 — only a rentable bot reacts to mouse-down, with
            // its own ROE_MOUSE_DOWN (not routed through the shared eventType dispatch below).
            case 'mouseDown':
                if(this.object.getType() === 'rentable_bot' && this.eventDispatcher !== null)
                {
                    const downEvent = new RoomObjectMouseEvent(
                        RoomObjectMouseEvent.ROE_MOUSE_DOWN,
                        this.object,
                        event.eventId ?? '',
                        event.altKey ?? false,
                        event.ctrlKey ?? false,
                        event.shiftKey ?? false,
                        event.buttonDown ?? false
                    );
                    this.eventDispatcher.emit(downEvent.type, downEvent);
                }
                break;
        }

        if(eventType !== null && this.eventDispatcher !== null)
        {
            const mouseEvent = new RoomObjectMouseEvent(
                eventType,
                this.object,
                event.eventId ?? '',
                event.altKey ?? false,
                event.ctrlKey ?? false,
                event.shiftKey ?? false,
                event.buttonDown ?? false
            );
            this.eventDispatcher.emit(mouseEvent.type, mouseEvent);
        }
    }

    override update(time: number): void
    {
        super.update(time);

        // Track position changes when selected
        if(this._selected && this.object !== null)
        {
            if(this.eventDispatcher !== null)
            {
                const location = this.object.getLocation();

                if(this._lastLocation === null ||
					this._lastLocation.x !== location.x ||
					this._lastLocation.y !== location.y ||
					this._lastLocation.z !== location.z)
                {
                    if(this._lastLocation === null)
                    {
                        this._lastLocation = new Vector3d();
                    }

                    this._lastLocation.assign(location);

                    const event = new RoomObjectMoveEvent(RoomObjectMoveEvent.ROME_POSITION_CHANGED, this.object);
                    this.eventDispatcher.emit(event.type, event);
                }
            }
        }

        // Update timed actions
        if(this.object !== null)
        {
            const model = this.object.getModelController();
            if(model !== null)
            {
                this.updateActions(time, model);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/AvatarLogic.as::getCurveStrength()
    // The avatar jump arc: an avatar update carries jumpingPower directly; otherwise
    // read it back from the model where processUpdateMessage() stored it.
    protected override getCurveStrength(message: RoomObjectMoveUpdateMessage): number
    {
        if(message === null || this.object === null)
        {
            return super.getCurveStrength(message);
        }

        if(message instanceof RoomObjectAvatarUpdateMessage)
        {
            return message.jumpingPower;
        }

        const model = this.object.getModelController();

        if(model !== null && model.hasNumber('figure_jumping_power'))
        {
            return model.getNumber('figure_jumping_power');
        }

        return super.getCurveStrength(message);
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::updateEffect()
    private updateEffect(effect: number, delay: number, model: IRoomObjectModelController): void
    {
        const currentEffect = model.getNumber('figure_effect');

        // Handle splash/swim transitions
        if(effect === AvatarLogic.EFFECT_TYPE_SPLASH)
        {
            this._effectChangeTime = Date.now() + AvatarLogic.EFFECT_SPLASH_LENGTH;
            this._nextEffect = AvatarLogic.EFFECT_TYPE_SWIM;
        }
        else if(effect === AvatarLogic.EFFECT_TYPE_SPLASH_DARK)
        {
            this._effectChangeTime = Date.now() + AvatarLogic.EFFECT_SPLASH_LENGTH;
            this._nextEffect = AvatarLogic.EFFECT_TYPE_SWIM_DARK;
        }
        else if(currentEffect === AvatarLogic.EFFECT_TYPE_SWIM)
        {
            // Exit water: show splash first
            this._effectChangeTime = Date.now() + AvatarLogic.EFFECT_SPLASH_LENGTH;
            this._nextEffect = effect;
            effect = AvatarLogic.EFFECT_TYPE_SPLASH;
        }
        else if(currentEffect === AvatarLogic.EFFECT_TYPE_SWIM_DARK)
        {
            this._effectChangeTime = Date.now() + AvatarLogic.EFFECT_SPLASH_LENGTH;
            this._nextEffect = effect;
            effect = AvatarLogic.EFFECT_TYPE_SPLASH_DARK;
        }
        else if(delay !== 0)
        {
            this._effectChangeTime = Date.now() + delay;
            this._nextEffect = effect;
            return;
        }
        else
        {
            this._effectChangeTime = 0;
        }

        model.setNumber('figure_effect', effect);
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::updateActions()
    private updateActions(time: number, model: IRoomObjectModelController): void
    {
        const now = Date.now();

        // Talk animation with pauses
        if(this._talkEndTime > 0)
        {
            if(now > this._talkEndTime)
            {
                model.setNumber('figure_talk', 0);
                this._talkEndTime = 0;
                this._talkPauseTime = 0;
                this._talkResumeTime = 0;
            }
            else if(this._talkResumeTime === 0 && this._talkPauseTime === 0)
            {
                this._talkPauseTime = now + this.getTalkingPauseInterval();
                this._talkResumeTime = this._talkPauseTime + this.getTalkingPauseLength();
            }
            else if(this._talkPauseTime > 0 && now > this._talkPauseTime)
            {
                model.setNumber('figure_talk', 0);
                this._talkPauseTime = 0;
            }
            else if(this._talkResumeTime > 0 && now > this._talkResumeTime)
            {
                model.setNumber('figure_talk', 1);
                this._talkResumeTime = 0;
            }
        }

        // Expression timeout
        if(this._expressionEndTime > 0 && now > this._expressionEndTime)
        {
            model.setNumber('figure_expression', 0);
            this._expressionEndTime = 0;
        }

        // Gesture timeout
        if(this._gestureEndTime > 0 && now > this._gestureEndTime)
        {
            model.setNumber('figure_gesture', 0);
            this._gestureEndTime = 0;
        }

        // Sign timeout
        if(this._signEndTime > 0 && now > this._signEndTime)
        {
            model.setNumber('figure_sign', -1);
            this._signEndTime = 0;
        }

        // Carry object empty hand timeout
        if(this._carryObjectEndTime > 0)
        {
            if(now > this._carryObjectEndTime)
            {
                model.setNumber('figure_carry_object', 0);
                model.setNumber('figure_use_object', 0);
                this._carryObjectStartTime = 0;
                this._carryObjectEndTime = 0;
                this._allowUseCarryObject = false;
            }
        }

        // Auto-use carried consumable
        if(this._allowUseCarryObject)
        {
            const elapsed = now - this._carryObjectStartTime;
            if(elapsed > AvatarLogic.CARRY_ITEM_DELAY_BEFORE_USE)
            {
                // Use every 10 seconds for 1 second
                if(elapsed % 10000 < 1000)
                {
                    model.setNumber('figure_use_object', 1);
                }
                else
                {
                    model.setNumber('figure_use_object', 0);
                }
            }
        }

        // Blink animation
        if(now > this._nextBlinkTime)
        {
            model.setNumber('figure_blink', 1);
            this._nextBlinkTime = now + this.getBlinkInterval();
            this._blinkEndTime = now + this.getBlinkLength();
        }

        if(this._blinkEndTime > 0 && now > this._blinkEndTime)
        {
            model.setNumber('figure_blink', 0);
            this._blinkEndTime = 0;
        }

        // Delayed effect
        if(this._effectChangeTime > 0 && now > this._effectChangeTime)
        {
            model.setNumber('figure_effect', this._nextEffect);
            this._effectChangeTime = 0;
        }

        // Player value timeout
        if(this._playerValueEndTime > 0 && now > this._playerValueEndTime)
        {
            model.setNumber('figure_number_value', 0);
            this._playerValueEndTime = 0;
        }

        // Habbicon timeout
        if(this._habbiconEndTime > 0 && now > this._habbiconEndTime)
        {
            model.setNumber('figure_habbicon', 0);
            model.setNumber('figure_habbicon_trigger_sequence', 0);
            this.clearHabbiconSpin(model);
            this._habbiconEndTime = 0;
        }

        // Outside the branch above on purpose, as in AS3: the spin has its own, shorter window
        // (3200ms against the bubble's 6000), so it has to stop while the bubble is still up.
        this.updateHabbiconSpin(now, model);
    }

    /**
     * Starts the spin for the one Habbicon that spins, and stops any spin for every other.
     *
     * The test is on the Habbicon's *name*, not its id: the id is content the hotel numbers, and
     * `duck_spinning` is the code the client's own texts use.
     */
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::updateHabbiconSpinForHabbicon()
    private updateHabbiconSpinForHabbicon(
        habbiconId: number,
        triggeredAt: number,
        model: IRoomObjectModelController
    ): void
    {
        if(HabbiconAssetManager.getHabbiconNameKey(habbiconId) === AvatarLogic.SPINNING_DUCK_HABBICON_NAME)
        {
            this._habbiconSpinStartTime = triggeredAt;
            this._habbiconSpinEndTime = triggeredAt + AvatarLogic.HABBICON_SPIN_DURATION_MS;

            this.setHabbiconSpinOffset(0, model);

            return;
        }

        this.clearHabbiconSpin(model);
    }

    /** Advances the spin one -45° step per 100ms, wrapping at a full turn. */
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::updateHabbiconSpin()
    private updateHabbiconSpin(now: number, model: IRoomObjectModelController): void
    {
        if(this._habbiconSpinEndTime <= 0) return;

        if(now >= this._habbiconSpinEndTime)
        {
            this.clearHabbiconSpin(model);

            return;
        }

        // `int(...)` in AS3 truncates toward zero. The elapsed time is never negative here, so
        // `Math.floor` and truncation agree, but the step count is what must be integral before the
        // multiply - rounding after it would land between two frames.
        const steps = Math.floor((now - this._habbiconSpinStartTime) / AvatarLogic.HABBICON_SPIN_STEP_MS);

        this.setHabbiconSpinOffset((steps * AvatarLogic.HABBICON_SPIN_STEP_DEGREES) % 360, model);
    }

    /** Writes the angle only when it actually changed, so a still Habbicon costs no model writes. */
    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::setHabbiconSpinOffset()
    private setHabbiconSpinOffset(offset: number, model: IRoomObjectModelController): void
    {
        if(this._habbiconSpinOffset === offset) return;

        this._habbiconSpinOffset = offset;

        model.setNumber('figure_habbicon_spin_offset', offset);
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::clearHabbiconSpin()
    private clearHabbiconSpin(model: IRoomObjectModelController): void
    {
        this._habbiconSpinStartTime = 0;
        this._habbiconSpinEndTime = 0;

        this.setHabbiconSpinOffset(0, model);
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::getTalkingPauseInterval()
    private getTalkingPauseInterval(): number
    {
        return 100 + Math.random() * 200;
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::getTalkingPauseLength()
    private getTalkingPauseLength(): number
    {
        return 75 + Math.random() * 75;
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::getBlinkInterval()
    private getBlinkInterval(): number
    {
        return 4500 + Math.random() * 1000;
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/AvatarLogic.as::getBlinkLength()
    private getBlinkLength(): number
    {
        return 50 + Math.random() * 200;
    }
}
