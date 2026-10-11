import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IBitmapWrapperWindow} from '@ambreia/ui/components/IBitmapWrapperWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IPartColor} from '@ambreia/avatar/structure/figure/IPartColor';
import type {IAvatarEditorGridColorItem} from './IAvatarEditorGridItem';
import type {IAvatarEditorGridModel} from './IAvatarEditorGridModel';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';

/**
 * One colour swatch: a tinted 13×21 chip with selection, hover and optional disabled state.
 *
 * The chip is **not** a coloured rectangle — it is a shared greyscale bitmap
 * (`..._clr_13x21_2`) tinted per swatch by the part colour's own multipliers, so every colour in
 * the palette shares one piece of artwork.
 *
 * The border has three states drawn from **two** assets: `_3` for both selected *and* hovered,
 * `_1` for neither. There is no separate hover-while-selected look, which is why the hover-out
 * handler has to consult `isSelected` to decide what to restore.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/common/AvatarEditorGridColorItem.as
 */
export class AvatarEditorGridColorItem implements IAvatarEditorGridColorItem
{
    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::SELECTED_ASSET
    // Also the hover artwork — see the class note.
    private static readonly SELECTED_ASSET: string = 'avatar_editor_editor_clr_13x21_3';

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::UNSELECTED_ASSET
    private static readonly UNSELECTED_ASSET: string = 'avatar_editor_editor_clr_13x21_1';

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::COLORIZATION_ASSET
    // The greyscale chip every swatch tints.
    private static readonly COLORIZATION_ASSET: string = 'avatar_editor_editor_clr_13x21_2';

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::_model
    // Name DERIVED (`_SafeStr_4570`): the page this swatch belongs to; used only to reach the
    // asset library.
    private _model: IAvatarEditorGridModel | null;

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::_window
    private _window: IWindowContainer | null;

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::_partColor
    private _partColor: IPartColor | null;

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::_isSelected
    // Name DERIVED (`_SafeStr_7496`).
    private _isSelected: boolean = false;

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::_border
    // Name DERIVED (`_SafeStr_4558`): found by the **tag** "BORDER", not by name.
    private _border: IStaticBitmapWrapperWindow | null;

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::_isDisabledForWearing
    private _isDisabledForWearing: boolean;

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::AvatarEditorGridColorItem()
    constructor(
        window: IWindowContainer | null,
        model: IAvatarEditorGridModel | null,
        partColor: IPartColor | null,
        isDisabledForWearing: boolean = false
    )
    {
        this._model = model;
        this._window = window;
        this._partColor = partColor;
        this._isDisabledForWearing = isDisabledForWearing;
        this._border = (window?.findChildByTag('BORDER') as IStaticBitmapWrapperWindow | null) ?? null;

        this.setupColor();
        this.updateThumbData();

        window?.addEventListener(WindowMouseEvent.OVER, this.onMouseOver);
        window?.addEventListener(WindowMouseEvent.OUT, this.onMouseOut);
    }

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::get view()
    public get view(): IWindowContainer | null
    {
        return this._window;
    }

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::get partColor()
    public get partColor(): IPartColor | null
    {
        return this._partColor;
    }

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::get isDisabledForWearing()
    public get isDisabledForWearing(): boolean
    {
        return this._isDisabledForWearing;
    }

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::get isSelected()
    public get isSelected(): boolean
    {
        return this._isSelected;
    }

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::set isSelected()
    public set isSelected(value: boolean)
    {
        this._isSelected = value;

        if(this._border !== null)
        {
            this._border.assetUri = value
                ? AvatarEditorGridColorItem.SELECTED_ASSET
                : AvatarEditorGridColorItem.UNSELECTED_ASSET;
        }
    }

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::dispose()
    // Guards on the window's own `disposed` flag before disposing — the grid may have torn the
    // window down already.
    public dispose(): void
    {
        this._model = null;

        if(this._window !== null && !this._window.disposed) this._window.dispose();

        this._window = null;
        this._partColor = null;
        this._border = null;
    }

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::onMouseOver()
    private onMouseOver = (): void =>
    {
        if(this._border !== null) this._border.assetUri = AvatarEditorGridColorItem.SELECTED_ASSET;
    };

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::onMouseOut()
    // Restores selected or unselected, which is why a selected swatch stays lit under the cursor.
    private onMouseOut = (): void =>
    {
        if(this._border === null) return;

        this._border.assetUri = this._isSelected
            ? AvatarEditorGridColorItem.SELECTED_ASSET
            : AvatarEditorGridColorItem.UNSELECTED_ASSET;
    };

    /**
     * Tints the shared greyscale chip with the part colour's multipliers.
     *
     * AS3 clones the asset, applies a `ColorTransform` in place and blits it into a fresh
     * BitmapData. This port composes the same thing on an `OffscreenCanvas` with a
     * `multiply` fill — mathematically the same operation as a multiplier-only ColorTransform,
     * and the only one the 2D context offers without reading pixels back.
     */
    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::setupColor()
    private setupColor(): void
    {
        const target = (this._window?.findChildByTag('COLOR_IMAGE') as IBitmapWrapperWindow | null) ?? null;

        if(target === null || this._partColor === null) return;

        const source = this.getAsset(AvatarEditorGridColorItem.COLORIZATION_ASSET);

        if(source === null) return;

        const canvas = new OffscreenCanvas(source.width, source.height);
        const context = canvas.getContext('2d');

        if(context === null) return;

        const {redMultiplier, greenMultiplier, blueMultiplier} = this._partColor.colorTransform;

        context.drawImage(source, 0, 0);
        context.globalCompositeOperation = 'multiply';
        context.fillStyle = `rgb(${Math.round(redMultiplier * 255)}, `
            + `${Math.round(greenMultiplier * 255)}, ${Math.round(blueMultiplier * 255)})`;
        context.fillRect(0, 0, source.width, source.height);

        // Keep the chip's own transparency — `multiply` would otherwise tint the empty corners.
        context.globalCompositeOperation = 'destination-in';
        context.drawImage(source, 0, 0);

        target.bitmap = canvas.transferToImageBitmap();
    }

    /**
     * Starts every swatch on the **selected** artwork whatever its state — `isSelected` has not
     * been assigned yet at construction, so the grid's first `selectColorIds()` is what corrects
     * the unselected ones. Kept.
     */
    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::updateThumbData()
    private updateThumbData(): void
    {
        if(this._window === null || this._window.disposed) return;

        if(this._border !== null) this._border.assetUri = AvatarEditorGridColorItem.SELECTED_ASSET;

        const legacyAccessIcon: IWindow | null = this._window.findChildByTag('CLUB_ICON');

        if(legacyAccessIcon === null) return;

        legacyAccessIcon.visible = false;
    }

    // TS-only: the grid model exposes the asset lookup directly instead of walking the editor owner chain.
    private getAsset(name: string): ImageBitmap | null
    {
        return this._model?.getAssetBitmap(name) ?? null;
    }
}
