import type {IRoomObjectSprite} from '@room/object/visualization/IRoomObjectSprite';
import {StackedAdditionStack} from '../../stacked/StackedAdditionStack';
import {VariableFxStackAddition} from '../../variablefx/VariableFxStackAddition';
import type {IAvatarAddition} from './IAvatarAddition';
import type {IStackedAvatarAddition} from './IStackedAvatarAddition';
import type {HabbiconBubble} from './HabbiconBubble';

/** What the avatar visualization holds while this addition drives it. */
export interface IStackedAdditionsHost
{
    readonly posture: string;
}

/**
 * The avatar's stack, as a single ordinary addition.
 *
 * This is the shim that lets one sprite carry several things. From the visualization's side it is
 * just another `IAvatarAddition` with an id; inside, it owns a {@link StackedAdditionStack} whose
 * members are composited together. The habbicon and every Variable FX effect live in here rather
 * than each holding a room sprite of their own.
 *
 * The layers are fixed and far apart: Variable FX at 0, the habbicon at 100, so bars always stack
 * below the bubble whatever order they arrived in.
 *
 * `resolveStackBottomY()` is the only interesting method. The stack hangs off a point above the
 * avatar, and where that point is depends on both the render scale and what the avatar is DOING —
 * a sitting avatar's head is half a tile lower and a lying one's a whole tile, so the anchor
 * follows it. Get this wrong and the bars float.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/avatar/additions/StackedAdditions.as
 */
export class StackedAdditions implements IAvatarAddition
{
    // AS3: .../additions/StackedAdditions.as::LAYER_VARIABLE_FX
    static readonly LAYER_VARIABLE_FX: number = 0;

    // AS3: .../additions/StackedAdditions.as::LAYER_HABBICON
    static readonly LAYER_HABBICON: number = 100;

    // AS3: .../additions/StackedAdditions.as::ROOM_LARGE_STACK_BOTTOM_Y
    private static readonly ROOM_LARGE_STACK_BOTTOM_Y: number = -86;

    // AS3: .../additions/StackedAdditions.as::ROOM_SMALL_STACK_BOTTOM_Y
    private static readonly ROOM_SMALL_STACK_BOTTOM_Y: number = -45;

    /** Below this scale the room is drawn at half size and the small anchor applies. */
    // AS3: .../additions/StackedAdditions.as::resolveStackBottomY() (name derived)
    private static readonly SMALL_SCALE_THRESHOLD: number = 48;

    // AS3: .../additions/StackedAdditions.as::_id (name derived)
    private _id: number;

    // AS3: .../additions/StackedAdditions.as::_visualization (name derived)
    private _visualization: IStackedAdditionsHost | null;

    // AS3: .../additions/StackedAdditions.as::_stack (name derived)
    private _stack: StackedAdditionStack = new StackedAdditionStack();

    // AS3: .../additions/StackedAdditions.as::_habbicon (name derived)
    private _habbicon: HabbiconBubble | null = null;

    // AS3: .../additions/StackedAdditions.as::_scale (name derived)
    //   `_SafeStr_5214`: the last scale `update()` was given, remembered because `animate()` is
    //   not given one and still has to resolve the anchor.
    private _scale: number = 64;

    // AS3: .../additions/StackedAdditions.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../additions/StackedAdditions.as::StackedAdditions()
    constructor(id: number, visualization: IStackedAdditionsHost)
    {
        this._id = id;
        this._visualization = visualization;
    }

    // AS3: .../additions/StackedAdditions.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: .../additions/StackedAdditions.as::get habbicon()
    get habbicon(): HabbiconBubble | null
    {
        return this._habbicon;
    }

    /** The visualization drops the whole addition when this goes true. */
    // AS3: .../additions/StackedAdditions.as::get isEmpty()
    get isEmpty(): boolean
    {
        return this._stack.isEmpty;
    }

    // AS3: .../additions/StackedAdditions.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../additions/StackedAdditions.as::get stack()
    get stack(): StackedAdditionStack
    {
        return this._stack;
    }

    // AS3: .../additions/StackedAdditions.as::setHabbicon()
    setHabbicon(habbicon: HabbiconBubble): void
    {
        this.clearHabbicon();

        this._habbicon = habbicon;

        this.addStackedAddition(habbicon, StackedAdditions.LAYER_HABBICON);
    }

    // AS3: .../additions/StackedAdditions.as::clearHabbicon()
    clearHabbicon(): void
    {
        if(this._habbicon === null) return;

        this.removeStackedAddition(this._habbicon.id);

        this._habbicon = null;
    }

    // AS3: .../additions/StackedAdditions.as::addStackedAddition()
    addStackedAddition(
        addition: IStackedAvatarAddition,
        layer: number,
        createdAt: number = 0,
        configId: number = 0,
        variableId: string = ''
    ): void
    {
        this._stack.add(addition, layer, createdAt, configId, variableId);
    }

    // AS3: .../additions/StackedAdditions.as::removeStackedAddition()
    removeStackedAddition(id: number): void
    {
        if(this._habbicon !== null && this._habbicon.id === id) this._habbicon = null;

        this._stack.remove(id);
    }

    // AS3: .../additions/StackedAdditions.as::getStackedAddition()
    getStackedAddition(id: number): IStackedAvatarAddition | null
    {
        return this._stack.get(id);
    }

    // AS3: .../additions/StackedAdditions.as::getVariableFxAddition()
    getVariableFxAddition(configId: number, variableId: string): VariableFxStackAddition | null
    {
        for(const addition of this.getVariableFxAdditions())
        {
            if(addition.configId === configId && addition.variableId === variableId) return addition;
        }

        return null;
    }

    // AS3: .../additions/StackedAdditions.as::getVariableFxAdditions()
    getVariableFxAdditions(): VariableFxStackAddition[]
    {
        return this._stack.getAdditionsByType(VariableFxStackAddition);
    }

    // AS3: .../additions/StackedAdditions.as::update()
    update(sprite: IRoomObjectSprite | null, scale: number): void
    {
        this._scale = scale;

        this._stack.update(sprite, scale, this.resolveStackBottomY());
    }

    /**
     * Also notices a habbicon the stack dropped on its own — it can finish and be removed without
     * anybody calling `clearHabbicon()`, and the reference here would otherwise outlive it.
     */
    // AS3: .../additions/StackedAdditions.as::animate()
    animate(sprite: IRoomObjectSprite | null): boolean
    {
        const changed = this._stack.animate(sprite, this.resolveStackBottomY());

        if(this._habbicon !== null && this._stack.get(this._habbicon.id) === null) this._habbicon = null;

        return changed;
    }

    /**
     * Where the bottom of the stack sits above the avatar's origin.
     *
     * Two anchors, one per render scale, then shifted down by the posture: half a head for sitting,
     * a whole one for lying. The head height is the scale's own, which is why it is recomputed here
     * rather than being a constant.
     */
    // AS3: .../additions/StackedAdditions.as::resolveStackBottomY()
    private resolveStackBottomY(): number
    {
        const small = this._scale < StackedAdditions.SMALL_SCALE_THRESHOLD;
        const headHeight = small ? 32 : 64;
        let bottomY = small ? StackedAdditions.ROOM_SMALL_STACK_BOTTOM_Y : StackedAdditions.ROOM_LARGE_STACK_BOTTOM_Y;

        const posture = this._visualization === null ? '' : this._visualization.posture;

        if(posture === 'sit') bottomY += headHeight / 2;
        else if(posture === 'lay') bottomY += headHeight;

        return bottomY;
    }

    // AS3: .../additions/StackedAdditions.as::dispose()
    dispose(): void
    {
        this._stack.dispose();

        this._habbicon = null;
        this._visualization = null;
        this._disposed = true;
    }
}
