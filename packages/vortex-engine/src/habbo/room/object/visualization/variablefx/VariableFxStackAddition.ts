import type {IRoomObjectSprite} from '@room/object/visualization/IRoomObjectSprite';
import type {VariableFxStatusModelEntry} from '../../variablefx/VariableFxStatusModelEntry';
import type {IStackedAddition} from '../stacked/IStackedAddition';
import type {VariableFxConfigStore} from '../VariableFxConfigStore';
import type {IVariableFxAssetProvider} from './IVariableFxAssetProvider';
import {VariableFxStatusData} from './VariableFxStatusData';
import type {VariableFxRendererRegistry} from './VariableFxRendererRegistry';
import {VariableFxVisualizer} from './VariableFxVisualizer';

/**
 * One wired variable's effect, as a member of an avatar's or furniture's addition stack.
 *
 * This is the bridge the whole feature has been building toward: it owns a
 * {@link VariableFxVisualizer} (which owns a renderer, which owns a frame) and presents it to the
 * stack as something with a picture, a position and a lifetime.
 *
 * The lifetime is the part that is not obvious. A status that goes away does NOT remove the
 * addition — it fades it out over {@link FADE_OUT_DURATION_MS} and only then reports `isFinished`,
 * so the stack drops it on the next animate. Until that moment it still draws but stops
 * contributing to the layout, which is what lets the bars above it close the gap while it fades
 * rather than after.
 *
 * Two update ids are tracked, and they mean different things. The CONFIG's id changing means the
 * baked artwork is stale and the visualizer must be rebuilt from scratch; the STATUS's id changing
 * means only the value moved, and the existing visualizer is retargeted.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/VariableFxStackAddition.as
 */
export class VariableFxStackAddition implements IStackedAddition
{
    // AS3: .../variablefx/VariableFxStackAddition.as::FADE_IN_DURATION_MS
    private static readonly FADE_IN_DURATION_MS: number = 150;

    /** Longer than the fade in: an effect that ends should not blink out. */
    // AS3: .../variablefx/VariableFxStackAddition.as::FADE_OUT_DURATION_MS
    private static readonly FADE_OUT_DURATION_MS: number = 350;

    /** In front of the avatar, by a fixed amount — these never sort against each other by depth. */
    // AS3: .../variablefx/VariableFxStackAddition.as::DEFAULT_RELATIVE_DEPTH
    private static readonly DEFAULT_RELATIVE_DEPTH: number = -0.2;

    /**
     * Ids start well above the addition ids the avatar visualization hands out, so a stacked
     * addition can never collide with an ordinary one in the same id space.
     */
    // AS3: .../variablefx/VariableFxStackAddition.as::_nextId (name derived)
    private static _nextId: number = 10000;

    // AS3: .../variablefx/VariableFxStackAddition.as::_id (name derived)
    private _id: number;

    // AS3: .../variablefx/VariableFxStackAddition.as::_configId (name derived)
    private _configId: number;

    // AS3: .../variablefx/VariableFxStackAddition.as::_variableId (name derived)
    private _variableId: string;

    // AS3: .../variablefx/VariableFxStackAddition.as::_createdAt (name derived)
    private _createdAt: number = 0;

    // AS3: .../variablefx/VariableFxStackAddition.as::_configs (name derived)
    private _configs: VariableFxConfigStore | null;

    // AS3: .../variablefx/VariableFxStackAddition.as::_assetProvider (name derived)
    private _assetProvider: IVariableFxAssetProvider | null;

    // AS3: .../variablefx/VariableFxStackAddition.as::_rendererRegistry
    private _rendererRegistry: VariableFxRendererRegistry | null;

    // AS3: .../variablefx/VariableFxStackAddition.as::_visualizer (name derived)
    private _visualizer: VariableFxVisualizer | null = null;

    // AS3: .../variablefx/VariableFxStackAddition.as::_renderedStatusUpdateId (name derived)
    //   `_SafeStr_7001`: the status update the visualizer was last fed.
    private _renderedStatusUpdateId: number = -1;

    // AS3: .../variablefx/VariableFxStackAddition.as::_renderedConfigUpdateId (name derived)
    //   `_SafeStr_8072`: the config generation the visualizer was BUILT for.
    private _renderedConfigUpdateId: number = -1;

    // AS3: .../variablefx/VariableFxStackAddition.as::_isPartOfStack (name derived)
    private _isPartOfStack: boolean = false;

    // AS3: .../variablefx/VariableFxStackAddition.as::_shown (name derived)
    //   `_SafeStr_5516`: the status wants this on screen.
    private _shown: boolean = false;

    // AS3: .../variablefx/VariableFxStackAddition.as::_invisible (name derived)
    //   `_SafeStr_5495`: the status explicitly asked for it to be hidden, as opposed to removed.
    private _invisible: boolean = false;

    // AS3: .../variablefx/VariableFxStackAddition.as::_finished (name derived)
    private _finished: boolean = false;

    // AS3: .../variablefx/VariableFxStackAddition.as::_alpha
    private _alpha: number = 0;

    // AS3: .../variablefx/VariableFxStackAddition.as::_fadeStartedAt (name derived)
    private _fadeStartedAt: number = 0;

    // AS3: .../variablefx/VariableFxStackAddition.as::_fadeStartAlpha
    private _fadeStartAlpha: number = 0;

    // AS3: .../variablefx/VariableFxStackAddition.as::_fadeTargetAlpha
    private _fadeTargetAlpha: number = 0;

    // AS3: .../variablefx/VariableFxStackAddition.as::_fadeDurationMs (name derived)
    private _fadeDurationMs: number = 0;

    // AS3: .../variablefx/VariableFxStackAddition.as::_spriteApplied (name derived)
    //   `_SafeStr_5311`: the sprite already reflects the current state, so `animate()` can skip it.
    private _spriteApplied: boolean = false;

    // AS3: .../variablefx/VariableFxStackAddition.as::VariableFxStackAddition()
    constructor(
        configId: number,
        variableId: string,
        configs: VariableFxConfigStore,
        assetProvider: IVariableFxAssetProvider,
        rendererRegistry: VariableFxRendererRegistry
    )
    {
        this._id = VariableFxStackAddition._nextId++;
        this._configId = configId;
        this._variableId = variableId;
        this._configs = configs;
        this._assetProvider = assetProvider;
        this._rendererRegistry = rendererRegistry;
    }

    // AS3: .../variablefx/VariableFxStackAddition.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: .../variablefx/VariableFxStackAddition.as::get configId()
    get configId(): number
    {
        return this._configId;
    }

    // AS3: .../variablefx/VariableFxStackAddition.as::get variableId()
    get variableId(): string
    {
        return this._variableId;
    }

    /** The status's own creation time, which is how the stack orders effects by age. */
    // AS3: .../variablefx/VariableFxStackAddition.as::get createdAt()
    get createdAt(): number
    {
        return this._createdAt;
    }

    // AS3: .../variablefx/VariableFxStackAddition.as::get isFinished()
    get isFinished(): boolean
    {
        return this._finished;
    }

    // AS3: .../variablefx/VariableFxStackAddition.as::get requiresAnimationTick()
    get requiresAnimationTick(): boolean
    {
        return !this._spriteApplied
            || this._alpha !== this._fadeTargetAlpha
            || (this._visualizer !== null && this._visualizer.requiresAnimationTick);
    }

    // AS3: .../variablefx/VariableFxStackAddition.as::get disposed()
    get disposed(): boolean
    {
        return this._configs === null;
    }

    // AS3: .../variablefx/VariableFxStackAddition.as::get isPartOfStack()
    get isPartOfStack(): boolean
    {
        return this._isPartOfStack;
    }

    /** Joining or leaving a stack changes where the sprite's origin is, so the sprite is re-applied. */
    // AS3: .../variablefx/VariableFxStackAddition.as::set isPartOfStack()
    set isPartOfStack(value: boolean)
    {
        if(this._isPartOfStack === value) return;

        this._isPartOfStack = value;
        this._spriteApplied = false;
    }

    /** Drawing and pushing are separate: a fading-out effect still draws but no longer pushes. */
    // AS3: .../variablefx/VariableFxStackAddition.as::get contributesToStackLayout()
    get contributesToStackLayout(): boolean
    {
        return this._shown && !this._invisible;
    }

    // AS3: .../variablefx/VariableFxStackAddition.as::get invisible()
    get invisible(): boolean
    {
        return this._invisible;
    }

    /**
     * The canvas the stack composites — see the deviation note on {@link IStackedAddition}.
     */
    // AS3: .../variablefx/VariableFxStackAddition.as::applyToSprite()
    get stackSourceBitmap(): OffscreenCanvas | null
    {
        if(this._visualizer === null || this._alpha <= 0) return null;

        return this._visualizer.frame.bitmapData;
    }

    /**
     * Brings the effect up to date with one status entry, building or retargeting as needed.
     *
     * A config that has gone away is not an error: the effect hides instead, because the config
     * store and the status stream are updated by different messages and can arrive out of order.
     */
    // AS3: .../variablefx/VariableFxStackAddition.as::show()
    show(entry: VariableFxStatusModelEntry, time: number): boolean
    {
        if(this._configs === null || this._assetProvider === null || this._rendererRegistry === null) return false;

        const config = this._configs.getConfig(this._configId);

        if(config === null) return this.hide(time);

        this._createdAt = entry.createdAt;

        const configUpdateId = this._configs.getConfigUpdateId(this._configId);

        // An initialize is a room sync and an invisible entry has nothing to animate toward, so
        // both snap rather than tween.
        const status = new VariableFxStatusData(
            entry.value, entry.overrideMinValue, entry.overrideMaxValue,
            entry.extra === null ? null : entry.extra.clone(),
            entry.isInitialize || entry.invisible
        );

        let changed = false;

        if(this._visualizer === null || this._renderedConfigUpdateId !== configUpdateId)
        {
            this.disposeVisualizer();

            this._visualizer = new VariableFxVisualizer(
                config, status, time, this._assetProvider, this._rendererRegistry
            );
            this._renderedConfigUpdateId = configUpdateId;
            this._renderedStatusUpdateId = entry.updateId;
            changed = true;
        }
        else if(this._renderedStatusUpdateId !== entry.updateId)
        {
            this._visualizer.updateData(status, time);
            this._renderedStatusUpdateId = entry.updateId;
            changed = true;
        }

        // Coming back from finished is a change even when nothing else moved.
        if(this._finished) changed = true;

        this._finished = false;

        if(entry.invisible) return this.startInvisibleFade(time) || changed;

        if(this._invisible || !this._shown) changed = true;

        this._invisible = false;
        this._shown = true;

        return this.startFade(255, VariableFxStackAddition.FADE_IN_DURATION_MS, time) || changed;
    }

    /** Starts the fade out — or finishes immediately if there was nothing on screen. */
    // AS3: .../variablefx/VariableFxStackAddition.as::hide()
    hide(time: number): boolean
    {
        let changed = this._invisible;

        this._invisible = false;

        if(!this._shown && this._fadeTargetAlpha === 0)
        {
            if(this._alpha === 0)
            {
                changed = changed || !this._finished;

                this.finishHidden();
            }

            return changed;
        }

        changed = true;
        this._shown = false;
        changed = this.startFade(0, VariableFxStackAddition.FADE_OUT_DURATION_MS, time) || changed;

        if(this._alpha === 0)
        {
            changed = changed || !this._finished;

            this.finishHidden();
        }

        return changed;
    }

    // AS3: .../variablefx/VariableFxStackAddition.as::update()
    update(sprite: IRoomObjectSprite | null, _scale: number): void
    {
        const time = performance.now();

        this.updateFade(time);
        this.updateVisualizer(time);
        this.applyToSprite(sprite);
    }

    /** Skips the sprite entirely when nothing moved and it is already up to date. */
    // AS3: .../variablefx/VariableFxStackAddition.as::animate()
    animate(sprite: IRoomObjectSprite | null): boolean
    {
        const time = performance.now();
        let changed = this.updateFade(time);

        if(this.updateVisualizer(time)) changed = true;

        if(!changed && this._spriteApplied) return false;

        this.applyToSprite(sprite);

        return true;
    }

    // AS3: .../variablefx/VariableFxStackAddition.as::startFade()
    private startFade(targetAlpha: number, durationMs: number, time: number): boolean
    {
        const changed = this.updateFade(time);

        if(this._fadeTargetAlpha === targetAlpha) return changed;

        this._fadeStartedAt = time;
        this._fadeStartAlpha = this._alpha;
        this._fadeTargetAlpha = targetAlpha;
        this._fadeDurationMs = durationMs;

        return true;
    }

    /** Reports a change only when the ROUNDED alpha moved — a sub-byte step is not a repaint. */
    // AS3: .../variablefx/VariableFxStackAddition.as::updateFade()
    private updateFade(time: number): boolean
    {
        if(this._alpha === this._fadeTargetAlpha) return false;

        const t = this._fadeDurationMs <= 0
            ? 1
            : Math.max(0, Math.min(1, (time - this._fadeStartedAt) / this._fadeDurationMs));
        const alpha = Math.round(this._fadeStartAlpha + (this._fadeTargetAlpha - this._fadeStartAlpha) * t);

        if(alpha === this._alpha) return false;

        this._alpha = alpha;

        if(this._alpha === 0 && !this._shown && !this._invisible) this.finishHidden();

        return true;
    }

    // AS3: .../variablefx/VariableFxStackAddition.as::finishHidden()
    private finishHidden(): void
    {
        this._finished = true;

        this.disposeVisualizer();
    }

    /** A fully faded-out invisible effect stops rendering entirely rather than drawing at alpha 0. */
    // AS3: .../variablefx/VariableFxStackAddition.as::updateVisualizer()
    private updateVisualizer(time: number): boolean
    {
        if(this._visualizer === null) return false;

        if(this._invisible && !this._shown && this._alpha <= 0) return false;

        if(this._visualizer.needsUpdate(time)) return this._visualizer.update(time);

        return false;
    }

    /**
     * The frame is anchored differently depending on whether it is in a stack.
     *
     * Standalone, the frame hangs ABOVE the anchor point, so its own height is subtracted. In a
     * stack the stack does that arithmetic itself when it lays the members out, so the sprite's
     * offset is just the frame's own.
     */
    // AS3: .../variablefx/VariableFxStackAddition.as::applyToSprite()
    private applyToSprite(sprite: IRoomObjectSprite | null): void
    {
        if(sprite === null)
        {
            this._spriteApplied = false;

            return;
        }

        const frame = this._visualizer === null ? null : this._visualizer.frame;
        const bitmap = frame === null ? null : frame.bitmapData;

        if(this._visualizer === null || this._alpha <= 0 || frame === null || bitmap === null)
        {
            sprite.alpha = 0;
            sprite.visible = false;
            this._spriteApplied = true;

            return;
        }

        // DEVIATION: AS3 assigns `sprite.asset = frame.bitmapData` here. This port's sprites carry
        //   a PixiJS Texture and the stack composites from `stackSourceBitmap` instead — see the
        //   note on IStackedAddition. The offsets, depth, alpha and visibility below are the AS3's
        //   unchanged, because the stack reads all four.
        sprite.offsetX = -((bitmap.width / 2) | 0) + frame.offsetX;
        sprite.offsetY = this._isPartOfStack ? frame.offsetY : -bitmap.height + frame.offsetY;
        sprite.relativeDepth = VariableFxStackAddition.DEFAULT_RELATIVE_DEPTH;
        sprite.alpha = this._alpha;
        sprite.visible = true;
        this._spriteApplied = true;
    }

    // AS3: .../variablefx/VariableFxStackAddition.as::disposeVisualizer()
    private disposeVisualizer(): void
    {
        if(this._visualizer !== null)
        {
            this._visualizer.dispose();
            this._visualizer = null;
        }

        this._renderedConfigUpdateId = -1;
        this._renderedStatusUpdateId = -1;
        this._spriteApplied = false;
    }

    /**
     * Hidden but not gone: the effect fades out and stops pushing the stack, but is NOT finished,
     * so it stays in the list ready to come back when the status says so.
     */
    // AS3: .../variablefx/VariableFxStackAddition.as::startInvisibleFade()
    private startInvisibleFade(time: number): boolean
    {
        const changed = !this._invisible || this._shown;

        this._invisible = true;
        this._shown = false;

        return this.startFade(0, VariableFxStackAddition.FADE_OUT_DURATION_MS, time) || changed;
    }

    // AS3: .../variablefx/VariableFxStackAddition.as::dispose()
    dispose(): void
    {
        this.disposeVisualizer();

        this._configs = null;
        this._assetProvider = null;
        this._rendererRegistry = null;
    }
}
