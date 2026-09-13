import type {IWindow} from '@core/window/IWindow';
import type {VariableFxFrame} from '@habbo/room/object/visualization/variablefx/VariableFxFrame';
import type {IVariableFxAssetProvider} from '@habbo/room/object/visualization/variablefx/IVariableFxAssetProvider';
import type {VariableFxRendererRegistry} from '@habbo/room/object/visualization/variablefx/VariableFxRendererRegistry';
import {VariableFxVisualizer} from '@habbo/room/object/visualization/variablefx/VariableFxVisualizer';
import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';
import type {PresetManager} from '../../../uibuilder/PresetManager';
import type {BitmapViewPreset} from '../../../uibuilder/presets/BitmapViewPreset';
import {WiredUIPreset} from '../../../uibuilder/presets/WiredUIPreset';
import type {WiredStyle} from '../../../uibuilder/styles/WiredStyle';
import {VariableFxPreviewStatus} from '../model/VariableFxPreviewStatus';
import type {VariableFxEditorState} from '../model/VariableFxEditorState';

/**
 * The live effect in the editor — an actual renderer, drawing actual frames, at 60fps.
 *
 * Not a screenshot and not a mock: it builds a real {@link VariableFxVisualizer} from the state
 * being edited and ticks it on a timer, so what the user sees while choosing a colour is what the
 * room will draw. `refresh()` rebuilds it when the configuration changes, `randomize()` keeps it and
 * only moves the value — which is the difference between "you changed the effect" and "the value
 * moved", and the two should not look the same.
 *
 * The surface zooms to 2x when the frame is small enough to fit doubled, because most effects are
 * 13px tall and unreadable at 1:1 next to the form.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/presets/VariableFxPreviewPreset.as
 */
export class VariableFxPreviewPreset extends WiredUIPreset
{
    // AS3: .../presets/VariableFxPreviewPreset.as::PREVIEW_WIDTH
    private static readonly PREVIEW_WIDTH: number = 280;

    // AS3: .../presets/VariableFxPreviewPreset.as::PREVIEW_HEIGHT
    private static readonly PREVIEW_HEIGHT: number = 96;

    // AS3: .../presets/VariableFxPreviewPreset.as::PREVIEW_ANIMATION_INTERVAL_MS
    private static readonly PREVIEW_ANIMATION_INTERVAL_MS: number = 16;

    // AS3: .../presets/VariableFxPreviewPreset.as::PREVIEW_ZOOM
    private static readonly PREVIEW_ZOOM: number = 2;

    // AS3: .../presets/VariableFxPreviewPreset.as::_bitmapView (name derived)
    private _bitmapView: BitmapViewPreset | null;

    // AS3: .../presets/VariableFxPreviewPreset.as::_status
    private _status: VariableFxPreviewStatus | null = new VariableFxPreviewStatus();

    // AS3: .../presets/VariableFxPreviewPreset.as::_visualizer (name derived)
    private _visualizer: VariableFxVisualizer | null = null;

    // AS3: .../presets/VariableFxPreviewPreset.as::_assetProvider (name derived)
    private _assetProvider: IVariableFxAssetProvider | null = null;

    // AS3: .../presets/VariableFxPreviewPreset.as::_rendererRegistry
    private _rendererRegistry: VariableFxRendererRegistry | null = null;

    // AS3: .../presets/VariableFxPreviewPreset.as::_animationTimer (name derived)
    private _animationTimer: ReturnType<typeof setInterval> | null = null;

    // AS3: .../presets/VariableFxPreviewPreset.as::_zoom (name derived)
    private _zoom: number = 1;

    /**
     * DEVIATION: AS3 assigns the visualizer's own `BitmapData` straight to the window and sets
     *   `disposesBitmap = false`, because the visualizer owns it. This port's bitmap windows take an
     *   `ImageBitmap` where the renderer produces an `OffscreenCanvas`, so each frame is copied into
     *   this surface and handed over as a snapshot — and `disposesBitmap` is left TRUE, because the
     *   window now owns each copy and must free it rather than leak one per frame at 60fps.
     *
     *   The alternative, widening the window's bitmap type to accept a canvas, was tried and
     *   reverted: `bitmapData` is `ImageBitmap` across `IBitmapDataContainer` and eight call sites
     *   call `.close()` on it, including working habbicon, catalog and snowwar code.
     * AS3: .../presets/VariableFxPreviewPreset.as::renderCurrentFrame()
     */
    private _snapshot: OffscreenCanvas | null = null;

    // AS3: .../presets/VariableFxPreviewPreset.as::VariableFxPreviewPreset()
    constructor(roomEvents: HabboUserDefinedRoomEvents, presetManager: PresetManager, wiredStyle: WiredStyle)
    {
        super(roomEvents, presetManager, wiredStyle);

        this._bitmapView = presetManager.createBitmapViewPreset(true);

        this._bitmapView.setBitmapSize(VariableFxPreviewPreset.PREVIEW_WIDTH, VariableFxPreviewPreset.PREVIEW_HEIGHT);
        this._bitmapView.bitmapWindow.fitSizeToContents = false;
    }

    // AS3: .../presets/VariableFxPreviewPreset.as::get zoom()
    get zoom(): number
    {
        return this._zoom;
    }

    // AS3: .../presets/VariableFxPreviewPreset.as::init()
    init(state: VariableFxEditorState): void
    {
        this.ensureVisualizerDependencies();
        this.refresh(state);
    }

    /** Keeps the visualizer so the value ANIMATES to its new target instead of snapping. */
    // AS3: .../presets/VariableFxPreviewPreset.as::randomize()
    randomize(state: VariableFxEditorState): void
    {
        const time = performance.now();

        this._status?.randomize(state);
        this.ensureVisualizerDependencies();

        if(this._visualizer === null)
        {
            this._visualizer = this.createVisualizer(state, time);

            this.renderCurrentFrame(time, true);
        }
        else
        {
            this._visualizer.updateData(this.statusData(state), time);
            this.renderCurrentFrame(time);
        }

        this.startAnimation();
    }

    /** Rebuilds from scratch — the configuration, not just the value, has changed. */
    // AS3: .../presets/VariableFxPreviewPreset.as::refresh()
    refresh(state: VariableFxEditorState): void
    {
        const time = performance.now();

        this.ensureVisualizerDependencies();
        this.disposeVisualizer();

        this._visualizer = this.createVisualizer(state, time);

        this.renderCurrentFrame(time, true);
        this.startAnimation();
    }

    // AS3: .../presets/VariableFxPreviewPreset.as::get window()
    override get window(): IWindow
    {
        return this._bitmapView!.window;
    }

    // AS3: .../presets/VariableFxPreviewPreset.as::resizeToWidth()
    override resizeToWidth(width: number): void
    {
        super.resizeToWidth(width);

        this._bitmapView?.resizeToWidth(width);
    }

    // AS3: .../presets/VariableFxPreviewPreset.as::hasStaticWidth()
    override hasStaticWidth(): boolean
    {
        return true;
    }

    // AS3: .../presets/VariableFxPreviewPreset.as::get staticWidth()
    override get staticWidth(): number
    {
        return VariableFxPreviewPreset.PREVIEW_WIDTH;
    }

    // AS3: .../presets/VariableFxPreviewPreset.as::get childPresets()
    protected override get childPresets(): WiredUIPreset[]
    {
        return this._bitmapView === null ? [] : [this._bitmapView];
    }

    // AS3: .../presets/VariableFxPreviewPreset.as::renderCurrentFrame()
    private renderCurrentFrame(time: number, rescale: boolean = false): boolean
    {
        const view = this._bitmapView;

        if(view === null) return false;

        if(this._visualizer === null)
        {
            this.updatePreviewScale(null);

            view.bitmapWindow.bitmap = null;

            return false;
        }

        const changed = this._visualizer.update(time);
        const frame = this._visualizer.frame;

        if(rescale) this.updatePreviewScale(frame);

        // AS3 compares the window's bitmap against the frame's BitmapData by identity, which is
        // free because they ARE the same object there. Here every frame is a fresh copy, so the
        // cheap test is the visualizer's own "did anything change" — and a rescale forces a redraw
        // regardless, since the zoom may have moved.
        if(!changed && !rescale) return false;

        view.bitmapWindow.bitmap = this.snapshotOf(frame);

        return changed;
    }

    /** Doubles the surface when the frame fits doubled — most effects are 13px tall. */
    // AS3: .../presets/VariableFxPreviewPreset.as::updatePreviewScale()
    private updatePreviewScale(frame: VariableFxFrame | null): void
    {
        const zoom = frame !== null
            && frame.bitmapData !== null
            && frame.width * VariableFxPreviewPreset.PREVIEW_ZOOM <= VariableFxPreviewPreset.PREVIEW_WIDTH
            && frame.height * VariableFxPreviewPreset.PREVIEW_ZOOM <= VariableFxPreviewPreset.PREVIEW_HEIGHT
            ? VariableFxPreviewPreset.PREVIEW_ZOOM
            : 1;

        if(this._bitmapView !== null)
        {
            this._bitmapView.bitmapWindow.zoomX = zoom;
            this._bitmapView.bitmapWindow.zoomY = zoom;
        }

        this._zoom = zoom;
    }

    /** See the `_snapshot` note: a copy, because the window wants an ImageBitmap. */
    // AS3: .../presets/VariableFxPreviewPreset.as::renderCurrentFrame()
    private snapshotOf(frame: VariableFxFrame): ImageBitmap | null
    {
        const source = frame.bitmapData;

        if(source === null) return null;

        if(this._snapshot === null || this._snapshot.width !== source.width || this._snapshot.height !== source.height)
        {
            this._snapshot = new OffscreenCanvas(Math.max(1, source.width), Math.max(1, source.height));
        }

        const context = this._snapshot.getContext('2d');

        if(context === null) return null;

        context.clearRect(0, 0, this._snapshot.width, this._snapshot.height);
        context.drawImage(source, 0, 0);

        // Detaches the surface's contents, which is fine: it is re-filled from scratch next frame.
        return this._snapshot.transferToImageBitmap();
    }

    // AS3: .../presets/VariableFxPreviewPreset.as::startAnimation()
    private startAnimation(): void
    {
        if(this._animationTimer !== null) return;

        this._animationTimer = setInterval(
            () => this.onAnimationTimer(),
            VariableFxPreviewPreset.PREVIEW_ANIMATION_INTERVAL_MS
        );
    }

    // AS3: .../presets/VariableFxPreviewPreset.as::stopAnimation()
    private stopAnimation(): void
    {
        if(this._animationTimer === null) return;

        clearInterval(this._animationTimer);

        this._animationTimer = null;
    }

    // AS3: .../presets/VariableFxPreviewPreset.as::onAnimationTimer()
    private onAnimationTimer(): void
    {
        if(this._visualizer === null)
        {
            this.stopAnimation();

            return;
        }

        this.renderCurrentFrame(performance.now());
    }

    // AS3: .../presets/VariableFxPreviewPreset.as::ensureVisualizerDependencies()
    private ensureVisualizerDependencies(): void
    {
        this._assetProvider ??= this._roomEvents.variableFxAssetProvider;
        this._rendererRegistry ??= this._roomEvents.variableFxRendererRegistry;
    }

    // AS3: .../presets/VariableFxPreviewPreset.as::refresh()
    private createVisualizer(state: VariableFxEditorState, time: number): VariableFxVisualizer | null
    {
        if(this._assetProvider === null || this._rendererRegistry === null) return null;

        return new VariableFxVisualizer(
            state.toRuntimeConfig(), this.statusData(state), time, this._assetProvider, this._rendererRegistry
        );
    }

    // AS3: .../presets/VariableFxPreviewPreset.as::refresh()
    private statusData(state: VariableFxEditorState)
    {
        return this._status!.toStatusData(state);
    }

    // AS3: .../presets/VariableFxPreviewPreset.as::disposeVisualizer()
    private disposeVisualizer(): void
    {
        if(this._visualizer === null) return;

        this._visualizer.dispose();
        this._visualizer = null;
    }

    // AS3: .../presets/VariableFxPreviewPreset.as::dispose()
    override dispose(): void
    {
        if(this.disposed) return;

        if(this._bitmapView !== null) this._bitmapView.bitmapWindow.bitmap = null;

        this.disposeVisualizer();
        this.stopAnimation();

        super.dispose();

        this._bitmapView = null;
        this._status = null;
        this._assetProvider = null;
        this._rendererRegistry = null;
        this._snapshot = null;
    }
}
