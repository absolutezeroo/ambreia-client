import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IBitmapWrapperWindow} from '@ambreia/ui/components/IBitmapWrapperWindow';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import type {IAvatarEffect} from '../IAvatarEffect';
import type {ICategoryModelOwner} from '../common/ICategoryModelOwner';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';

/**
 * The strip under the effects grid: the selected effect's name, how long it has left, and the
 * button that sells you more.
 *
 * It ticks once a second while an active effect is shown, counting a **local** copy of the
 * remaining seconds down rather than re-reading the effect — so the bar keeps moving even though
 * `Effect.secondsLeft` is itself computed from a timestamp.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/effects/EffectsParamView.as
 */
export class EffectsParamView implements IDisposable
{
    // AS3: .../avatar/effects/EffectsParamView.as::TICK_MS
    // Name DERIVED: the 1000ms `Timer` interval.
    private static readonly TICK_MS: number = 1000;

    // AS3: .../avatar/effects/EffectsParamView.as::SECONDS_PER_DAY
    // Name DERIVED: the 86400 above which the label switches to whole days.
    private static readonly SECONDS_PER_DAY: number = 86400;

    // AS3: .../avatar/effects/EffectsParamView.as::PROGRESS_COLOUR
    // Name DERIVED: the same 2146080 (0x20BF20) the grid item's bar uses.
    private static readonly PROGRESS_COLOUR: string = '#20bf20';

    // AS3: .../avatar/effects/EffectsParamView.as::CATALOG_PAGE_KEY
    // Name DERIVED: the configuration key holding the effects catalogue page.
    private static readonly CATALOG_PAGE_KEY: string = 'avatareditor.effects.buy.button.catalog.page.name';

    // AS3: .../avatar/effects/EffectsParamView.as::_model
    // Name DERIVED (`_SafeStr_4570`).
    private _model: {readonly controller: ICategoryModelOwner | null} | null;

    // AS3: .../avatar/effects/EffectsParamView.as::_container
    private _container: IWindowContainer | null;

    // AS3: .../avatar/effects/EffectsParamView.as::_catalogPageName
    private _catalogPageName: string;

    // AS3: .../avatar/effects/EffectsParamView.as::_windowManager
    // Held and nulled on dispose, never otherwise read. AS3's; kept.
    private _windowManager: IHabboWindowManager | null;

    // AS3: .../avatar/effects/EffectsParamView.as::_timer
    // Name DERIVED (`_SafeStr_5717`): AS3 uses a repeating `Timer`; an interval handle here.
    private _timer: ReturnType<typeof setInterval> | null = null;

    // AS3: .../avatar/effects/EffectsParamView.as::_secondsLeft
    // Name DERIVED (`_SafeStr_8093`): the local countdown, seeded from the effect and decremented
    // by the tick rather than re-read.
    private _secondsLeft: number = 0;

    // AS3: .../avatar/effects/EffectsParamView.as::_effect
    // Name DERIVED (`_SafeStr_7438`).
    private _effect: IAvatarEffect | null = null;

    // AS3: .../avatar/effects/EffectsParamView.as::EffectsParamView()
    // AS3's third parameter is the asset library; unused there and not carried here.
    constructor(model: {readonly controller: ICategoryModelOwner | null} | null, windowManager: IHabboWindowManager | null)
    {
        this._model = model;
        this._windowManager = windowManager;
        this._container = model?.controller?.view?.effectsParamViewContainer ?? null;
        this._catalogPageName = model?.controller?.getProperty(EffectsParamView.CATALOG_PAGE_KEY) ?? '';

        this._container?.findChildByName('get_more_button')?.addEventListener(WindowMouseEvent.CLICK, this.onBuyButtonClick);

        this.updateView(null);
    }

    // AS3: .../avatar/effects/EffectsParamView.as::get disposed()
    // Reports on the *model* reference, not on a flag of its own.
    public get disposed(): boolean
    {
        return this._model === null;
    }

    /**
     * AS3: .../avatar/effects/EffectsParamView.as::updateView()
     *
     * Three states. No effect hides everything but leaves the container itself visible. An effect
     * that is neither running nor permanent shows "save to activate" and stops the clock. A running
     * or permanent one shows the bar and starts it.
     *
     * The name is a localisation key built from the type — `${fx_<type>}` — so an unmapped effect
     * shows the key rather than an empty label.
     */
    // AS3: .../avatar/effects/EffectsParamView.as::updateView()
    public updateView(effect: IAvatarEffect | null): void
    {
        this._effect = effect;

        if(this._container === null) return;

        this._container.visible = true;

        const timeLeft = this._container.findChildByName('time_left_bg');
        const saveToActivate = this._container.findChildByName('save_to_activate');
        const name = this._container.findChildByName('effect_name');

        if(effect === null)
        {
            if(timeLeft !== null) timeLeft.visible = false;
            if(saveToActivate !== null) saveToActivate.visible = false;
            if(name !== null) name.visible = false;

            return;
        }

        if(name !== null) name.visible = true;

        if(!effect.isActive && !effect.isPermanent)
        {
            if(timeLeft !== null) timeLeft.visible = false;
            if(saveToActivate !== null) saveToActivate.visible = true;

            this.stopTimer();
        }
        else
        {
            this._secondsLeft = effect.secondsLeft;

            this.setSecondsLeft(effect.secondsLeft, effect.duration, effect.isPermanent);

            if(timeLeft !== null) timeLeft.visible = true;
            if(saveToActivate !== null) saveToActivate.visible = false;

            this.startTimer();
        }

        if(name !== null) name.caption = `\${fx_${effect.type}}`;
    }

    // AS3: .../avatar/effects/EffectsParamView.as::dispose()
    // Does **not** null the container or clear the click listener — the container belongs to the
    // editor's window and outlives this view. Kept.
    public dispose(): void
    {
        this.stopTimer();

        this._windowManager = null;
        this._model = null;
    }

    /**
     * AS3: .../avatar/effects/EffectsParamView.as::setSecondsLeft()
     *
     * The bar's fraction is `permanent ? 1 : secondsLeft / duration` — a permanent effect reads
     * full because AS3 substitutes the duration for the remaining time.
     *
     * The label is one of three localisation keys, each with a placeholder the caption's *resolved*
     * text is then string-replaced in. Under an hour the hours segment is dropped entirely, so the
     * clock reads `MM:SS` rather than `00:MM:SS`.
     */
    // AS3: .../avatar/effects/EffectsParamView.as::setSecondsLeft()
    private setSecondsLeft(secondsLeft: number, duration: number, permanent: boolean): void
    {
        const timeLeft = this._container?.findChildByName('time_left_bg') as IWindowContainer | null;

        if(timeLeft === null || timeLeft === undefined) return;

        const bar = timeLeft.findChildByName('progress_bar_bitmap') as IBitmapWrapperWindow | null;

        if(bar !== null && bar !== undefined)
        {
            const canvas = new OffscreenCanvas(bar.width, bar.height);
            const context = canvas.getContext('2d');

            if(context !== null)
            {
                const elapsed = permanent ? duration : secondsLeft;

                context.fillStyle = '#000000';
                context.fillRect(0, 0, bar.width, bar.height);
                context.fillStyle = EffectsParamView.PROGRESS_COLOUR;
                context.fillRect(0, 0, Math.trunc(bar.width * (elapsed / duration)), bar.height);

                bar.bitmap = canvas.transferToImageBitmap();
            }
        }

        const label = timeLeft.findChildByName('effect_time_left') as ITextWindow | null;

        if(label === null || label === undefined) return;

        // Each branch sets the caption, reads back the *resolved* text and edits it; the write-back
        // happens once at the end, as in AS3 — which is why the permanent branch, having nothing to
        // substitute, still round-trips the string.
        let resolved: string;

        if(permanent)
        {
            label.caption = '${avatareditor.effects.active.permanent}';
            resolved = label.text;
        }
        else if(secondsLeft > EffectsParamView.SECONDS_PER_DAY)
        {
            label.caption = '${avatareditor.effects.active.daysleft}';
            resolved = label.text.replace(
                '%days_left%', String(Math.floor(secondsLeft / EffectsParamView.SECONDS_PER_DAY))
            );
        }
        else
        {
            label.caption = '${avatareditor.effects.active.timeleft}';

            const hours = Math.floor(secondsLeft / 3600);
            const minutes = Math.floor(secondsLeft / 60) % 60;
            const seconds = secondsLeft % 60;
            const pad = (value: number): string => (value < 10 ? '0' : '') + value;

            resolved = label.text.replace(
                '%time_left%',
                hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
            );
        }

        label.text = resolved;
    }

    // AS3: .../avatar/effects/EffectsParamView.as::onBuyButtonClick()
    private onBuyButtonClick = (): void =>
    {
        this._model?.controller?.openCatalogPage(this._catalogPageName);
    };

    /**
     * AS3: .../avatar/effects/EffectsParamView.as::onSecondsTimer()
     *
     * Post-decrement: the *current* value is drawn and the counter then steps. Nothing stops the
     * clock at zero, so a lapsed effect keeps ticking into negative seconds until the view is
     * updated with something else. Kept.
     */
    // AS3: .../avatar/effects/EffectsParamView.as::onSecondsTimer()
    private onSecondsTimer = (): void =>
    {
        if(this._effect === null || !this._effect.isActive) return;

        this.setSecondsLeft(this._secondsLeft--, this._effect.duration, this._effect.isPermanent);
    };

    // TS-only: AS3 calls `Timer.start()`, which is a no-op on an already-running timer.
    private startTimer(): void
    {
        if(this._timer !== null) return;

        this._timer = setInterval(this.onSecondsTimer, EffectsParamView.TICK_MS);
    }

    // TS-only: the `Timer.stop()` half.
    private stopTimer(): void
    {
        if(this._timer === null) return;

        clearInterval(this._timer);
        this._timer = null;
    }

    // TS-only: keeps the held-but-unread AS3 field referenced.
    private get unused(): unknown
    {
        return this._windowManager;
    }
}
