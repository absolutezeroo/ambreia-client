import type {IDisposable} from '@core/runtime';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import {AnimatedScalar} from '@habbo/window/utils/AnimatedScalar';
import {AnimatedColor} from '@habbo/window/utils/AnimatedColor';

/**
 * The Fish-O-Pedia hub's progress bar. It finds `progress`, `fill` and `highlight` by name inside
 * the container it is handed.
 *
 * **Renamed in the RPG fork.** AS3's class is the habbicon album's bar (under every set, and under
 * the album header). The fork removed that album, and the fishing hub — whose layout was derived
 * from it and keeps its child names — is the bar's only remaining user, so the class moved here
 * under a neutral name. The member traces below still point at the AS3 file it ports.
 *
 * **It keeps its own clock.** `_elapsed` accumulates the frame deltas handed to `update()` rather
 * than reading a wall clock, so a bar that stops being updated freezes rather than jumping forward
 * when it resumes.
 *
 * **The fill overshoots its clip by four pixels.** `_progress` is the clipping container and takes
 * the true width; `_fill` inside it is drawn four wider, so the rounded cap stays out of sight until
 * the bar is nearly full — at which point the overshoot is dropped and the cap lands flush.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/habbicons/HabbiconProgressBarView.as
 */
export class ProgressBarView implements IDisposable
{
    // AS3: HabbiconProgressBarView.as::ACCELERATION_PER_MS
    private static readonly ACCELERATION_PER_MS: number = 0.00001;

    // AS3: HabbiconProgressBarView.as::MAX_SPEED_PER_MS
    private static readonly MAX_SPEED_PER_MS: number = 0.003;

    // AS3: HabbiconProgressBarView.as::_SafeStr_11080 (name derived: the snap threshold)
    private static readonly SNAP_EPSILON: number = 0.0001;

    // AS3: HabbiconProgressBarView.as::FILL_COLOR_TRANSITION_MS
    private static readonly FILL_COLOR_TRANSITION_MS: number = 250;

    // AS3: HabbiconProgressBarView.as::INCOMPLETE_COLOR
    private static readonly INCOMPLETE_COLOR: number = 5548264;

    // AS3: HabbiconProgressBarView.as::COMPLETE_COLOR
    private static readonly COMPLETE_COLOR: number = 7915868;

    // AS3: HabbiconProgressBarView.as::CAP_OVERSHOOT
    private static readonly CAP_OVERSHOOT: number = 4;

    // AS3: HabbiconProgressBarView.as::_container
    private _container: IWindowContainer | null;

    // AS3: HabbiconProgressBarView.as::_SafeStr_6031 (name derived: the clipping container)
    private _progress: IWindowContainer | null;

    // AS3: HabbiconProgressBarView.as::_fill
    private _fill: IWindow | null;

    // AS3: HabbiconProgressBarView.as::_highlight
    private _highlight: IWindow | null;

    // AS3: HabbiconProgressBarView.as::_SafeStr_5839 (name derived: the animated ratio)
    private _ratio: AnimatedScalar | null;

    // AS3: HabbiconProgressBarView.as::_fillColor
    private _fillColor: AnimatedColor | null;

    // AS3: HabbiconProgressBarView.as::_SafeStr_5426 (name derived: this bar's own clock)
    private _elapsed: number = 0;

    // AS3: HabbiconProgressBarView.as::_maxWidth
    private _maxWidth: number = 0;

    // AS3: HabbiconProgressBarView.as::_disposed
    private _disposed: boolean = false;

    // AS3: HabbiconProgressBarView.as::HabbiconProgressBarView()
    constructor(container: IWindowContainer | null)
    {
        this._container = container;
        this._progress = (container?.findChildByName('progress') as IWindowContainer | null) ?? null;
        this._fill = this._progress?.findChildByName('fill') ?? null;
        this._highlight = this._progress?.findChildByName('highlight') ?? null;
        this._maxWidth = container?.width ?? 0;

        this._ratio = new AnimatedScalar(
            ProgressBarView.ACCELERATION_PER_MS,
            ProgressBarView.MAX_SPEED_PER_MS,
            ProgressBarView.SNAP_EPSILON
        );

        this._fillColor = new AnimatedColor(ProgressBarView.FILL_COLOR_TRANSITION_MS);
        this._fillColor.snapTo(ProgressBarView.INCOMPLETE_COLOR, this._elapsed);

        this.render();
    }

    // AS3: HabbiconProgressBarView.as::setRatio()
    setRatio(ratio: number, animate: boolean): void
    {
        const clamped = Math.max(0, Math.min(1, ratio));

        if(animate)
        {
            this._ratio?.setTarget(clamped, this._elapsed);
        }
        else
        {
            this._ratio?.snapTo(clamped, this._elapsed);
        }

        this.syncCompletionColor(animate);
        this.render();
    }

    /**
	 * The colour is re-targeted every frame, not only on change: `setTarget` is idempotent when the
	 * target already matches, and this is what makes a bar crossing 100% mid-animation change colour
	 * without a second call from outside.
	 */
    // AS3: HabbiconProgressBarView.as::update()
    update(delta: number): void
    {
        this._elapsed += delta;

        let changed = this._ratio?.update(this._elapsed) ?? false;

        this.syncCompletionColor(true);

        changed = (this._fillColor?.update(this._elapsed) ?? false) || changed;

        if(changed) this.render();
    }

    // AS3: HabbiconProgressBarView.as::render()
    private render(): void
    {
        if(this._progress === null || this._fill === null || this._highlight === null) return;

        const width = Math.max(0, Math.min(this._maxWidth, Math.round(this._maxWidth * (this._ratio?.value ?? 0))));
        const overshoot = width >= this._maxWidth - ProgressBarView.CAP_OVERSHOOT
            ? this._maxWidth
            : width + ProgressBarView.CAP_OVERSHOOT;

        this._progress.width = width;
        (this._progress as unknown as IWindow).visible = width > 0;
        this._fill.width = Math.max(0, overshoot);
        this._fill.color = this._fillColor?.value ?? 0;
        this._highlight.width = Math.max(0, overshoot - 2);

        this._container?.invalidate();
    }

    // AS3: HabbiconProgressBarView.as::syncCompletionColor()
    private syncCompletionColor(animate: boolean): void
    {
        const color = (this._ratio?.value ?? 0) >= 1
            ? ProgressBarView.COMPLETE_COLOR
            : ProgressBarView.INCOMPLETE_COLOR;

        if(animate)
        {
            this._fillColor?.setTarget(color, this._elapsed);
        }
        else
        {
            this._fillColor?.snapTo(color, this._elapsed);
        }
    }

    // AS3: HabbiconProgressBarView.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: HabbiconProgressBarView.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._container = null;
        this._progress = null;
        this._fill = null;
        this._highlight = null;
        this._ratio = null;
        this._fillColor = null;
    }
}
