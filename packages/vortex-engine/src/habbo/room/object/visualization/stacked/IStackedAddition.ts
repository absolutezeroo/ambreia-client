import type {IRoomObjectSprite} from '@room/object/visualization/IRoomObjectSprite';

/**
 * An addition that is composited INTO a shared stack rather than drawn on a sprite of its own.
 *
 * The stack owns one sprite for all of its members and stacks them vertically, so a member has to
 * answer three things an ordinary addition does not: whether it takes part in the layout at all,
 * whether it has finished and can be dropped, and whether it still needs to be ticked.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/stacked/IStackedAddition.as
 */
export interface IStackedAddition
{
    // AS3: .../visualization/stacked/IStackedAddition.as::get id()
    readonly id: number;

    // AS3: .../visualization/stacked/IStackedAddition.as::get disposed()
    readonly disposed: boolean;

    /** Set by the stack when the addition joins or leaves it. */
    // AS3: .../visualization/stacked/IStackedAddition.as::get isPartOfStack()
    isPartOfStack: boolean;

    /**
     * Whether this addition PUSHES the ones above it up.
     *
     * False for a member that is on screen but should not displace anything — a fading-out bar
     * still draws, but the bars above it have already closed the gap.
     */
    // AS3: .../visualization/stacked/IStackedAddition.as::get contributesToStackLayout()
    readonly contributesToStackLayout: boolean;

    // AS3: .../visualization/stacked/IStackedAddition.as::get invisible()
    readonly invisible: boolean;

    /** Finished additions are removed by the stack on the next animate. */
    // AS3: .../visualization/stacked/IStackedAddition.as::get isFinished()
    readonly isFinished: boolean;

    // AS3: .../visualization/stacked/IStackedAddition.as::get requiresAnimationTick()
    readonly requiresAnimationTick: boolean;

    /**
     * DEVIATION: AS3 has no counterpart — the stack there reads `entry.sprite.asset`, which is a
     *   CPU-side `BitmapData` it can `copyPixels()` straight out of. This port's sprites carry a
     *   PixiJS `Texture` instead, and PixiJS does not guarantee a CPU resource survives the upload:
     *   `RoomEngine.pixiTextureToCanvas()` says so in as many words ("source.resource can
     *   legitimately be undefined for a fully valid, on-screen texture") and stopped reading it for
     *   exactly that reason. Compositing a stack out of its members' sprite textures would
     *   therefore work until the first GPU upload and then silently draw nothing. So the member
     *   hands the stack the canvas it just drew, which is what AS3's `sprite.asset` effectively was.
     * AS3: sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/stacked/StackedAdditionStack.as::drawEntry()
     */
    readonly stackSourceBitmap: OffscreenCanvas | null;

    // AS3: .../visualization/stacked/IStackedAddition.as::update()
    update(sprite: IRoomObjectSprite | null, scale: number): void;

    // AS3: .../visualization/stacked/IStackedAddition.as::animate()
    animate(sprite: IRoomObjectSprite | null): boolean;

    // AS3: .../visualization/stacked/IStackedAddition.as::dispose()
    dispose(): void;
}
