import {RoomObjectSprite} from '@room/object/visualization/RoomObjectSprite';
import {AnimatedScalar} from './AnimatedScalar';
import type {IStackedAddition} from './IStackedAddition';

/**
 * One member of a stack: the addition, the sprite it draws into, and its animated y.
 *
 * The y is animated rather than assigned because the stack SHUFFLES — when a bar below this one
 * disappears, everything above it slides down instead of jumping. `setTarget()` returns whether
 * anything actually moved, which is what keeps a settled stack off the frame budget.
 *
 * `freezePosition()` is the other half of that: an addition that stops contributing to the layout
 * (a bar fading out) must stay exactly where it is rather than snapping to wherever the layout
 * would now put it, so its animation is landed and pinned.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/stacked/StackedAdditionEntry.as
 */
export class StackedAdditionEntry
{
    // AS3: .../visualization/stacked/StackedAdditionEntry.as::addition (name recovered)
    //   `_SafeStr_4948`; the stack's own `get(id)` reads `entry.addition.id`.
    addition: IStackedAddition | null;

    // AS3: .../visualization/stacked/StackedAdditionEntry.as::sprite
    sprite: RoomObjectSprite | null = new RoomObjectSprite();

    // AS3: .../visualization/stacked/StackedAdditionEntry.as::y
    y: AnimatedScalar = new AnimatedScalar(0.003, 0.35, 0.01, 0.004);

    // AS3: .../visualization/stacked/StackedAdditionEntry.as::layer
    layer: number;

    // AS3: .../visualization/stacked/StackedAdditionEntry.as::createdAt
    createdAt: number;

    // AS3: .../visualization/stacked/StackedAdditionEntry.as::configId
    configId: number;

    // AS3: .../visualization/stacked/StackedAdditionEntry.as::variableId
    variableId: string;

    // AS3: .../visualization/stacked/StackedAdditionEntry.as::contributesToLayout
    contributesToLayout: boolean = true;

    // AS3: .../visualization/stacked/StackedAdditionEntry.as::_initialized (name derived)
    private _initialized: boolean = false;

    // AS3: .../visualization/stacked/StackedAdditionEntry.as::_targetY (name derived)
    //   `_SafeStr_6097`: the last y asked for, so an unchanged request costs nothing.
    private _targetY: number = 0;

    // AS3: .../visualization/stacked/StackedAdditionEntry.as::StackedAdditionEntry()
    constructor(
        addition: IStackedAddition,
        layer: number,
        createdAt: number = 0,
        configId: number = 0,
        variableId: string = ''
    )
    {
        this.addition = addition;
        this.layer = layer;
        this.createdAt = createdAt;
        this.configId = configId;
        this.variableId = variableId;
    }

    /** The first target SNAPS — a bar that has just appeared does not slide in from 0. */
    // AS3: .../visualization/stacked/StackedAdditionEntry.as::setTarget()
    setTarget(y: number, time: number): boolean
    {
        if(!this._initialized)
        {
            this.y.snapTo(y, time);
            this._targetY = y;
            this._initialized = true;

            return true;
        }

        if(this._targetY === y) return false;

        const before = this.y.value;

        this._targetY = y;

        this.y.setTarget(y, time);

        return this.y.value !== before;
    }

    // AS3: .../visualization/stacked/StackedAdditionEntry.as::needsAnimationTick()
    needsAnimationTick(time: number): boolean
    {
        return this._initialized && this.y.needsUpdate(time, 1);
    }

    /** Lands the animation and pins it there, for a member that has left the layout. */
    // AS3: .../visualization/stacked/StackedAdditionEntry.as::freezePosition()
    freezePosition(time: number): boolean
    {
        const moved = this.y.update(time);

        this.y.snapTo(this.y.value, time);
        this._targetY = this.y.value;

        return moved;
    }

    // AS3: .../visualization/stacked/StackedAdditionEntry.as::dispose()
    dispose(): void
    {
        if(this.addition !== null)
        {
            this.addition.dispose();
            this.addition = null;
        }

        if(this.sprite !== null)
        {
            this.sprite.dispose();
            this.sprite = null;
        }
    }
}
