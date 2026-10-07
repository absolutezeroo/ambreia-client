import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IBitmapWrapperWindow} from '@ambreia/ui/components/IBitmapWrapperWindow';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IAvatarEffect} from '../IAvatarEffect';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';

/**
 * One tile in the effects grid: the effect's icon, a stack badge, and a duration bar.
 *
 * A **null** effect means the "wear nothing" tile, which is always first in the grid and shows the
 * generic remove-selection icon at a stack count of 1.
 *
 * Unlike `AvatarEditorGridPartItem` this composes nothing — the icon comes ready-made from the
 * inventory, so the only drawing here is the progress bar.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/effects/AvatarEditorGridItemEffect.as
 */
export class AvatarEditorGridItemEffect
{
    // AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::LAYOUT_ASSET
    // Name DERIVED: the asset name AS3 passes to `getAssetByName()`.
    private static readonly LAYOUT_ASSET: string = 'avatar_editor_effect_griditem_xml';

    // AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::REMOVE_ASSET
    // Name DERIVED: the icon the null tile shows — the same one the clothing grids use.
    private static readonly REMOVE_ASSET: string = 'avatar_editor_generic_remove_selection';

    // AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::PROGRESS_COLOUR
    // Name DERIVED: the 2146080 AS3 fills the bar with — 0x20BF20, a bright green.
    private static readonly PROGRESS_COLOUR: string = '#20bf20';

    // AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::NO_EFFECT_TYPE
    // Name DERIVED: the −1 `effectType` reports for the "wear nothing" tile.
    private static readonly NO_EFFECT_TYPE: number = -1;

    // AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::_window
    private _window: IWindowContainer | null;

    // AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::_background
    // Name DERIVED (`_SafeStr_5584`): the highlight behind the icon, found by the `BG_COLOR` tag.
    private _background: IWindow | null = null;

    // AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::_isSelected
    // Name DERIVED (`_SafeStr_7496`).
    private _isSelected: boolean = false;

    // AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::_effect
    // Name DERIVED (`_SafeStr_8373`): null for the "wear nothing" tile.
    private _effect: IAvatarEffect | null;

    /**
     * AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::AvatarEditorGridItemEffect()
     *
     * The duration bar is drawn for a **permanent** effect too — at full width, since it is passed
     * `(duration, duration)`. An owned-but-inactive effect gets no bar at all, which is how the
     * grid distinguishes "running" from "in the backpack".
     *
     * AS3's third parameter is the editor's asset library, used for the layout; this port keeps
     * layouts in the window manager's registry, so it carries only the bitmap lookup — which AS3
     * takes off the *window manager's* library, not the editor's.
     */
    constructor(
        effect: IAvatarEffect | null,
        windowManager: IHabboWindowManager | null,
        assets: {getAssetBitmap(name: string): ImageBitmap | null} | null
    )
    {
        this._window = (windowManager?.buildWidgetLayout(AvatarEditorGridItemEffect.LAYOUT_ASSET) as IWindowContainer | null) ?? null;
        this._background = this._window?.findChildByTag('BG_COLOR') ?? null;
        this._effect = effect;

        if(effect !== null)
        {
            this.bitmap = effect.icon;
            this.amount = effect.amountInInventory;

            if(effect.isPermanent) this.setSecondsLeft(effect.duration, effect.duration);
            else if(effect.isActive) this.setSecondsLeft(effect.secondsLeft, effect.duration);
        }
        else
        {
            this.bitmap = assets?.getAssetBitmap(AvatarEditorGridItemEffect.REMOVE_ASSET) ?? null;
            this.amount = 1;
        }

        this.selected = false;

        this._window?.addEventListener(WindowMouseEvent.OVER, this.onMouseOver);
        this._window?.addEventListener(WindowMouseEvent.OUT, this.onMouseOut);
    }

    // AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::get window()
    public get window(): IWindowContainer | null
    {
        return this._window;
    }

    // AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::get effectType()
    public get effectType(): number
    {
        return this._effect !== null ? this._effect.type : AvatarEditorGridItemEffect.NO_EFFECT_TYPE;
    }

    // AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::set selected()
    // Write-only in AS3 — there is no getter, and the field is read only by the two hover handlers.
    public set selected(value: boolean)
    {
        this._isSelected = value;

        if(this._background === null) return;

        this._background.visible = this._isSelected;
        this._background.blend = 1;
    }

    /**
     * AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::onMouseOver()
     *
     * Hover lights the highlight at half opacity — but only when the tile is not already selected,
     * so a selected tile does not dim under the cursor.
     */
    // AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::onMouseOver()
    private onMouseOver = (): void =>
    {
        if(this._background === null) return;
        if(this._isSelected) return;

        this._background.visible = true;
        this._background.blend = 0.5;
    };

    /**
     * AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::onMousetOut()
     *
     * The AS3 method name is misspelled (`onMousetOut`); the trace above keeps it, the TS name does
     * not. Note the opacity reset is **outside** the selected check, so leaving a selected tile
     * restores it to full even though nothing dimmed it.
     */
    // AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::onMousetOut()
    private onMouseOut = (): void =>
    {
        if(this._background === null) return;

        if(!this._isSelected) this._background.visible = false;

        this._background.blend = 1;
    };

    // AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::set bitmap()
    private set bitmap(value: ImageBitmap | null)
    {
        const target = this._window?.findChildByName('bitmap') as IBitmapWrapperWindow | null;

        if(target !== null && target !== undefined) target.bitmap = value;
    }

    // AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::set amount()
    // The badge shows only for a stack of more than one, but its text is written either way.
    private set amount(value: number)
    {
        const badge = this._window?.findChildByName('effect_amount_bg1') ?? null;
        const text = this._window?.findChildByName('effect_amount') as ITextWindow | null;

        if(badge !== null) badge.visible = value > 1;
        if(text !== null && text !== undefined) text.text = value.toString();
    }

    /**
     * AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::setSecondsLeft()
     *
     * Fills the bar's background opaque black, then paints the elapsed fraction green. AS3 builds a
     * non-transparent `BitmapData` initialised to 0 and fills a sub-rectangle; this composes the
     * same two rectangles on a canvas.
     */
    // AS3: .../avatar/effects/AvatarEditorGridItemEffect.as::setSecondsLeft()
    private setSecondsLeft(secondsLeft: number, duration: number): void
    {
        const container = this._window?.findChildByName('duration_container') ?? null;

        if(container !== null) container.visible = true;

        const bar = this._window?.findChildByName('progress_bar') as IBitmapWrapperWindow | null;

        if(bar === null || bar === undefined) return;

        const canvas = new OffscreenCanvas(bar.width, bar.height);
        const context = canvas.getContext('2d');

        if(context === null) return;

        context.fillStyle = '#000000';
        context.fillRect(0, 0, bar.width, bar.height);
        context.fillStyle = AvatarEditorGridItemEffect.PROGRESS_COLOUR;
        context.fillRect(0, 0, Math.trunc(bar.width * (secondsLeft / duration)), bar.height);

        bar.bitmap = canvas.transferToImageBitmap();
    }
}
