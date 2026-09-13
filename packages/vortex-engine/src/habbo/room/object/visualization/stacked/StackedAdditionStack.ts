import {Texture} from 'pixi.js';
import type {IRoomObjectSprite} from '@room/object/visualization/IRoomObjectSprite';
import type {IStackedAddition} from './IStackedAddition';
import {StackedAdditionBounds} from './StackedAdditionBounds';
import {StackedAdditionEntry} from './StackedAdditionEntry';

/**
 * Several additions stacked vertically and composited into ONE sprite.
 *
 * The reason it exists is the sprite count: an avatar with four wired bars and a habbicon over its
 * head would otherwise be five extra room sprites, each depth-sorted and drawn separately. Here
 * they are one, with the members' pixels flattened into a single bitmap and the whole thing given
 * the bottom member's depth.
 *
 * Three pieces of state decide whether any of that has to happen again, and keeping them apart is
 * what keeps a settled stack free:
 *
 * - `_layoutDirty` — membership or content changed, so the bitmap must be recomposited.
 * - `_positionsAnimating` — some member's y is still sliding toward its target.
 * - `_requiresAnimationTick` — some member says it still needs ticking, whatever the layout does.
 *
 * Members stack UPWARD from the bottom: each contributing member sits
 * {@link STACK_SPACING} above the one below it, and a member that stops contributing (a bar fading
 * out) freezes where it is rather than letting the others slide through it.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/stacked/StackedAdditionStack.as
 */
export class StackedAdditionStack
{
    // AS3: .../visualization/stacked/StackedAdditionStack.as::STACK_SPACING
    private static readonly STACK_SPACING: number = 4;

    // AS3: .../visualization/stacked/StackedAdditionStack.as::_entries
    private _entries: StackedAdditionEntry[] = [];

    // AS3: .../visualization/stacked/StackedAdditionStack.as::_bitmap
    private _bitmap: OffscreenCanvas | null = null;

    /**
     * DEVIATION: AS3 assigns the composited `BitmapData` straight to `sprite.asset`. This port's
     *   sprites carry a PixiJS `Texture`, so the canvas is wrapped once and
     *   `texture.source.update()` re-uploads it after each composite — which is, as
     *   `ShoreMaskCreatorUtility` puts it, "what AS3 gets for free by mutating the BitmapData in
     *   place". Rebuilding the Texture per frame instead would churn a GPU upload object every
     *   time a bar moved a pixel.
     * AS3: .../visualization/stacked/StackedAdditionStack.as::layoutAndCompose()
     */
    private _bitmapTexture: Texture | null = null;

    // AS3: .../visualization/stacked/StackedAdditionStack.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../visualization/stacked/StackedAdditionStack.as::_positionsAnimating (name derived)
    //   `_SafeStr_6297`: some member's y has not landed yet.
    private _positionsAnimating: boolean = false;

    // AS3: .../visualization/stacked/StackedAdditionStack.as::_layoutDirty (name derived)
    //   `_SafeStr_5116`: membership or content changed since the last composite.
    private _layoutDirty: boolean = false;

    // AS3: .../visualization/stacked/StackedAdditionStack.as::_lastHadVisibleEntries
    private _lastHadVisibleEntries: boolean = false;

    // AS3: .../visualization/stacked/StackedAdditionStack.as::_requiresAnimationTick (name derived)
    //   `_SafeStr_5445`: some member reports it still needs ticking.
    private _requiresAnimationTick: boolean = false;

    // AS3: .../visualization/stacked/StackedAdditionStack.as::_sortDirty (name derived)
    //   `_SafeStr_6993`: the order is stale; re-sorted lazily, not on every add.
    private _sortDirty: boolean = false;

    // AS3: .../visualization/stacked/StackedAdditionStack.as::get isEmpty()
    get isEmpty(): boolean
    {
        return this._entries.length === 0;
    }

    // AS3: .../visualization/stacked/StackedAdditionStack.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    /** Nothing on screen and nothing that could put anything there — the sprite can stay hidden. */
    // AS3: .../visualization/stacked/StackedAdditionStack.as::get isIdleInvisible()
    get isIdleInvisible(): boolean
    {
        return !this._lastHadVisibleEntries
            && !this._layoutDirty
            && !this._positionsAnimating
            && !this.hasLayoutContributingAdditions();
    }

    // AS3: .../visualization/stacked/StackedAdditionStack.as::get isCachedIdle()
    get isCachedIdle(): boolean
    {
        return !this._layoutDirty && !this._positionsAnimating && !this._requiresAnimationTick;
    }

    /**
     * Adds a member, or re-keys one that is already in.
     *
     * Re-adding the SAME addition object is not a no-op: its sort key may have changed, and the
     * caller has no other way to say so. That is why this returns after updating rather than
     * inserting a duplicate.
     */
    // AS3: .../visualization/stacked/StackedAdditionStack.as::add()
    add(addition: IStackedAddition, layer: number, createdAt: number = 0, configId: number = 0, variableId: string = ''): void
    {
        for(const entry of this._entries)
        {
            if(entry.addition !== addition) continue;

            if(entry.layer !== layer
                || entry.createdAt !== createdAt
                || entry.configId !== configId
                || entry.variableId !== variableId)
            {
                entry.layer = layer;
                entry.createdAt = createdAt;
                entry.configId = configId;
                entry.variableId = variableId;

                this._sortDirty = true;
                this._layoutDirty = true;
                this._requiresAnimationTick = true;
            }

            return;
        }

        // By ID, not by object: a replacement addition for the same slot evicts the old one.
        this.remove(addition.id);

        addition.isPartOfStack = true;

        this._entries.push(new StackedAdditionEntry(addition, layer, createdAt, configId, variableId));

        this._layoutDirty = true;
        this._sortDirty = true;
        this._requiresAnimationTick = true;
    }

    // AS3: .../visualization/stacked/StackedAdditionStack.as::remove()
    remove(id: number): void
    {
        for(let index = this._entries.length - 1; index >= 0; index--)
        {
            const entry = this._entries[index];

            if(entry.addition === null || entry.addition.id !== id) continue;

            this._entries.splice(index, 1);
            entry.dispose();

            this._layoutDirty = true;
            this._requiresAnimationTick = true;
        }
    }

    // AS3: .../visualization/stacked/StackedAdditionStack.as::get()
    get(id: number): IStackedAddition | null
    {
        for(const entry of this._entries)
        {
            if(entry.addition !== null && entry.addition.id === id) return entry.addition;
        }

        return null;
    }

    // AS3: .../visualization/stacked/StackedAdditionStack.as::getAdditions()
    getAdditions(): IStackedAddition[]
    {
        const additions: IStackedAddition[] = [];

        for(const entry of this._entries)
        {
            if(entry.addition !== null) additions.push(entry.addition);
        }

        return additions;
    }

    /**
     * DEVIATION: AS3 takes a `Class` and compares `getQualifiedClassName()`. TypeScript erases
     *   types, so this takes a constructor and uses `instanceof` — which is stricter than AS3's
     *   exact-name match only in that it also accepts subclasses, and nothing in the feature
     *   subclasses a stacked addition.
     * AS3: .../visualization/stacked/StackedAdditionStack.as::getAdditionsByType()
     */
    getAdditionsByType<T extends IStackedAddition>(type: abstract new (...args: never[]) => T): T[]
    {
        const additions: T[] = [];

        for(const entry of this._entries)
        {
            if(entry.addition instanceof type) additions.push(entry.addition);
        }

        return additions;
    }

    // AS3: .../visualization/stacked/StackedAdditionStack.as::update()
    update(sprite: IRoomObjectSprite | null, scale: number, bottomY: number): boolean
    {
        for(const entry of this._entries)
        {
            if(entry.addition !== null) entry.addition.update(entry.sprite, scale);
        }

        const changed = this.layoutAndCompose(sprite, performance.now(), false, bottomY);

        this.refreshAnimationTickState();

        return changed;
    }

    /**
     * The per-frame path, and the early return is the point of the whole class.
     *
     * A stack whose members are all settled, whose layout is clean and whose sprite is already on
     * screen with a texture does no work at all — that is what `isCachedIdle` plus the sprite check
     * buys. The second, nearly identical check after the members have animated is for the case
     * where a member reported a change that turned out not to move anything.
     */
    // AS3: .../visualization/stacked/StackedAdditionStack.as::animate()
    animate(sprite: IRoomObjectSprite | null, bottomY: number): boolean
    {
        if(this.isCachedIdle && (!this._lastHadVisibleEntries || StackedAdditionStack.isSpriteShowing(sprite)))
        {
            return false;
        }

        let changed = false;

        for(const entry of this._entries)
        {
            if(entry.addition !== null && entry.addition.animate(entry.sprite)) changed = true;
        }

        if(this.removeFinishedAdditions()) changed = true;

        if(!changed && !this._layoutDirty && !this._positionsAnimating)
        {
            if(!this._lastHadVisibleEntries || StackedAdditionStack.isSpriteShowing(sprite))
            {
                this.refreshAnimationTickState();

                return false;
            }
        }

        const composed = this.layoutAndCompose(sprite, performance.now(), true, bottomY) || changed;

        this.refreshAnimationTickState();

        return composed;
    }

    /**
     * Lays the members out bottom-up and flattens them into one bitmap.
     *
     * Two ways out early, and both HIDE the sprite rather than leaving a stale picture: no entries
     * at all, and entries that are all invisible. That second one matters because a member fading
     * out stays in the list until it says it is finished.
     */
    // AS3: .../visualization/stacked/StackedAdditionStack.as::layoutAndCompose()
    private layoutAndCompose(sprite: IRoomObjectSprite | null, time: number, advance: boolean, bottomY: number): boolean
    {
        if(sprite === null) return false;

        if(this._entries.length === 0) return this.hideSprite(sprite);

        this.sortEntriesIfNeeded();

        const bounds = new StackedAdditionBounds();
        const visible: StackedAdditionEntry[] = [];
        let previousY = 0;
        let previous: StackedAdditionEntry | null = null;
        let changed = false;
        let animating = false;

        for(const entry of this._entries)
        {
            const source = entry.addition === null ? null : entry.addition.stackSourceBitmap;

            if(entry.sprite === null || !entry.sprite.visible || source === null || entry.sprite.alpha <= 0) continue;

            if(entry.addition !== null && entry.addition.contributesToStackLayout)
            {
                entry.contributesToLayout = true;

                // Each member sits a spacing above the previous one's TOP, so the stack grows up.
                const y = previous === null || previous.addition === null || previous.addition.stackSourceBitmap === null
                    ? 0
                    : previousY - previous.addition.stackSourceBitmap.height - StackedAdditionStack.STACK_SPACING;

                if(entry.setTarget(y, time)) changed = true;

                if(advance && entry.y.update(time)) changed = true;

                if(entry.needsAnimationTick(time)) animating = true;

                previousY = y;
                previous = entry;
            }
            else if(entry.contributesToLayout)
            {
                entry.contributesToLayout = false;

                if(entry.freezePosition(time)) changed = true;
            }

            visible.push(entry);
        }

        if(visible.length === 0) return this.hideSprite(sprite);

        for(const entry of visible)
        {
            const source = entry.addition === null ? null : entry.addition.stackSourceBitmap;

            if(entry.sprite === null || source === null) continue;

            bounds.add(
                entry.sprite.offsetX,
                entry.sprite.offsetY + Math.round(entry.y.value) - source.height,
                source.width,
                source.height
            );
        }

        const context = this.ensureBitmap(bounds.width, bounds.height);

        if(context === null) return this.hideSprite(sprite);

        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        for(const entry of visible) StackedAdditionStack.drawEntry(context, entry, bounds);

        if(this._bitmapTexture !== null) this._bitmapTexture.source.update();

        const last = visible[visible.length - 1];

        sprite.texture = this._bitmapTexture;
        sprite.offsetX = bounds.minX;
        sprite.offsetY = bottomY + bounds.minY;
        sprite.relativeDepth = last.sprite === null ? 0 : last.sprite.relativeDepth;
        sprite.alpha = 255;
        sprite.visible = true;

        this._layoutDirty = false;
        this._positionsAnimating = animating;
        this._lastHadVisibleEntries = true;

        return changed;
    }

    // AS3: .../visualization/stacked/StackedAdditionStack.as::layoutAndCompose()
    private hideSprite(sprite: IRoomObjectSprite): boolean
    {
        this._layoutDirty = false;
        this._positionsAnimating = false;
        this._lastHadVisibleEntries = false;

        if(!sprite.visible) return false;

        sprite.visible = false;

        return true;
    }

    /**
     * AS3 takes the fast `copyPixels()` path for an opaque member in normal blend mode and the
     * slower `draw()` with a ColorTransform otherwise. Canvas has one call for both, so the
     * distinction survives as the alpha and blend mode set on the context.
     */
    // AS3: .../visualization/stacked/StackedAdditionStack.as::drawEntry()
    private static drawEntry(
        context: OffscreenCanvasRenderingContext2D,
        entry: StackedAdditionEntry,
        bounds: StackedAdditionBounds
    ): void
    {
        const source = entry.addition === null ? null : entry.addition.stackSourceBitmap;

        if(entry.sprite === null || source === null) return;

        const x = entry.sprite.offsetX - bounds.minX;
        const y = entry.sprite.offsetY + Math.round(entry.y.value) - bounds.minY - source.height;

        context.save();
        context.globalAlpha = Math.max(0, Math.min(1, entry.sprite.alpha / 255));
        context.globalCompositeOperation = entry.sprite.blendMode === 'add' ? 'lighter' : 'source-over';
        context.drawImage(source, x, y);
        context.restore();
    }

    // AS3: .../visualization/stacked/StackedAdditionStack.as::removeFinishedAdditions()
    private removeFinishedAdditions(): boolean
    {
        let removed = false;

        for(let index = this._entries.length - 1; index >= 0; index--)
        {
            const entry = this._entries[index];

            if(entry.addition === null || !entry.addition.isFinished) continue;

            this._entries.splice(index, 1);
            entry.dispose();

            removed = true;
            this._layoutDirty = true;
        }

        return removed;
    }

    /** Reallocates only on a size change, so a stack that is merely moving keeps its bitmap. */
    // AS3: .../visualization/stacked/StackedAdditionStack.as::ensureBitmap()
    private ensureBitmap(width: number, height: number): OffscreenCanvasRenderingContext2D | null
    {
        const w = Math.max(1, width | 0);
        const h = Math.max(1, height | 0);

        if(this._bitmap === null || this._bitmap.width !== w || this._bitmap.height !== h)
        {
            this.disposeBitmap();

            this._bitmap = new OffscreenCanvas(w, h);
            this._bitmapTexture = Texture.from(this._bitmap as unknown as HTMLCanvasElement);
        }

        return this._bitmap.getContext('2d');
    }

    // AS3: .../visualization/stacked/StackedAdditionStack.as::disposeBitmap()
    private disposeBitmap(): void
    {
        if(this._bitmapTexture !== null)
        {
            this._bitmapTexture.destroy(true);
            this._bitmapTexture = null;
        }

        this._bitmap = null;
    }

    /**
     * Layer, then age, then config, then variable, then id — every tiebreak is deterministic on
     * purpose. Two bars added in the same frame must not swap places on the next sort.
     */
    // AS3: .../visualization/stacked/StackedAdditionStack.as::sortEntries()
    private sortEntries(): void
    {
        this._entries.sort((a, b) =>
        {
            if(a.layer !== b.layer) return a.layer - b.layer;

            if(a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;

            if(a.configId !== b.configId) return a.configId - b.configId;

            const byVariable = a.variableId.localeCompare(b.variableId);

            if(byVariable !== 0) return byVariable;

            return (a.addition === null ? 0 : a.addition.id) - (b.addition === null ? 0 : b.addition.id);
        });
    }

    // AS3: .../visualization/stacked/StackedAdditionStack.as::sortEntriesIfNeeded()
    private sortEntriesIfNeeded(): void
    {
        if(!this._sortDirty) return;

        if(this._entries.length > 1) this.sortEntries();

        this._sortDirty = false;
    }

    // AS3: .../visualization/stacked/StackedAdditionStack.as::hasLayoutContributingAdditions()
    private hasLayoutContributingAdditions(): boolean
    {
        for(const entry of this._entries)
        {
            if(entry.addition !== null && entry.addition.contributesToStackLayout) return true;
        }

        return false;
    }

    // AS3: .../visualization/stacked/StackedAdditionStack.as::refreshAnimationTickState()
    private refreshAnimationTickState(): void
    {
        this._requiresAnimationTick = false;

        for(const entry of this._entries)
        {
            if(entry.addition !== null && entry.addition.requiresAnimationTick)
            {
                this._requiresAnimationTick = true;

                return;
            }
        }
    }

    /** AS3 writes this test inline twice; `asset != null` is `texture != null` here. */
    // AS3: .../visualization/stacked/StackedAdditionStack.as::animate()
    private static isSpriteShowing(sprite: IRoomObjectSprite | null): boolean
    {
        return sprite !== null && sprite.visible && sprite.texture !== null;
    }

    // AS3: .../visualization/stacked/StackedAdditionStack.as::dispose()
    dispose(): void
    {
        for(const entry of this._entries) entry.dispose();

        this._entries.length = 0;

        this.disposeBitmap();

        this._disposed = true;
        this._requiresAnimationTick = false;
    }
}
