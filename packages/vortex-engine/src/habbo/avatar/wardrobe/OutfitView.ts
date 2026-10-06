import type {Texture} from 'pixi.js';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IInteractiveWindow} from '@core/window/components/IInteractiveWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import {AvatarTextureUtils} from '../AvatarTextureUtils';

/**
 * One outfit tile: a rendered avatar over a coloured button, with an optional gradient behind it.
 *
 * Used by the hot-looks page rather than by the wardrobe — the wardrobe's own slots are
 * `WardrobeSlot`, which builds its window from a template instead of from this layout. The two
 * classes do much the same job and share nothing.
 *
 * The four colours come in as a set: a background and a gradient, each with an "active" variant.
 * AS3's only caller was the NFT outfit, which the RPG fork removed; `setColors()` has no caller now.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/wardrobe/OutfitView.as
 */
export class OutfitView
{
    // AS3: .../avatar/wardrobe/OutfitView.as::HOVER_COLOUR
    // Name DERIVED: the 13421772 (0xCCCCCC) the dead hover handler assigns.
    private static readonly HOVER_COLOUR: number = 13421772;

    // AS3: .../avatar/wardrobe/OutfitView.as::IDLE_COLOUR
    // Name DERIVED: the 6710886 (0x666666) it restores — the same value as
    // `AvatarEditorView.TAB_BACKGROUND_COLOUR`.
    private static readonly IDLE_COLOUR: number = 6710886;

    // AS3: .../avatar/wardrobe/OutfitView.as::NO_GRADIENT
    // Name DERIVED: the −1 `setColors()` takes to mean "no gradient at all".
    private static readonly NO_GRADIENT: number = -1;

    // AS3: .../avatar/wardrobe/OutfitView.as::_windowManager
    private _windowManager: IHabboWindowManager | null;

    // AS3: .../avatar/wardrobe/OutfitView.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: .../avatar/wardrobe/OutfitView.as::_bitmap
    // Name DERIVED (`_SafeStr_4702`): the `bitmap` child the avatar is composed into.
    private _bitmap: IBitmapWrapperWindow | null = null;

    // AS3: .../avatar/wardrobe/OutfitView.as::_gradient
    private _gradient: IStaticBitmapWrapperWindow | null = null;

    // AS3: .../avatar/wardrobe/OutfitView.as::_button
    private _button: IInteractiveWindow | null = null;

    // AS3: .../avatar/wardrobe/OutfitView.as::_bgColor
    private _bgColor: number = 0;

    // AS3: .../avatar/wardrobe/OutfitView.as::_activeBgColor
    // Name DERIVED (`_SafeStr_9845`).
    private _activeBgColor: number = 0;

    // AS3: .../avatar/wardrobe/OutfitView.as::_gradientColor
    private _gradientColor: number = 0;

    // AS3: .../avatar/wardrobe/OutfitView.as::_activeGradientColor
    // Name DERIVED (`_SafeStr_9696`).
    private _activeGradientColor: number = 0;

    // AS3: .../avatar/wardrobe/OutfitView.as::_active
    private _active: boolean = false;

    /**
     * AS3: .../avatar/wardrobe/OutfitView.as::OutfitView()
     *
     * AS3's second parameter is the asset library the `Outfit` layout is read from; this port keeps
     * the layouts in the window manager's own registry, so it is not carried.
     *
     * `enabled` false only *disables* the button — the tile is still built and still shows its
     * avatar. That is how an empty hot-looks entry renders.
     */
    constructor(windowManager: IHabboWindowManager | null, enabled: boolean)
    {
        this._windowManager = windowManager;
        this._window = (windowManager?.buildWidgetLayout('Outfit') as IWindowContainer | null) ?? null;

        if(this._window === null) return;

        this._bitmap = this._window.findChildByName('bitmap') as IBitmapWrapperWindow | null;
        this._gradient = this._window.findChildByName('outfit_gradient') as IStaticBitmapWrapperWindow | null;

        if(this._gradient !== null) this._gradient.visible = false;

        this._button = this._window.findChildByName('button') as IInteractiveWindow | null;

        if(!enabled) this._button?.disable();
    }

    // AS3: .../avatar/wardrobe/OutfitView.as::get window()
    public get window(): IWindowContainer | null
    {
        return this._window;
    }

    /**
     * Composes the rendered avatar into the tile: centred horizontally, **flush with the bottom**
     * — so heads line up along the top edge only by accident and feet always line up.
     *
     * AS3 fills the destination with `0x00FFFFFF`, i.e. white at zero alpha, which is simply
     * transparent; the port leaves the fresh canvas transparent, which is the same thing.
     */
    // AS3: .../avatar/wardrobe/OutfitView.as::update()
    public update(texture: Texture | null): void
    {
        const target = this._bitmap;

        if(target === null) return;

        const source = AvatarTextureUtils.toCanvasSource(texture);

        if(source === null) return;

        const canvas = new OffscreenCanvas(target.width, target.height);
        const context = canvas.getContext('2d');

        if(context === null) return;

        const x = Math.trunc((target.width - source.frame.width) / 2);
        const y = target.height - source.frame.height;

        context.drawImage(
            source.resource,
            source.frame.x, source.frame.y, source.frame.width, source.frame.height,
            x, y, source.frame.width, source.frame.height
        );

        target.bitmap = canvas.transferToImageBitmap();
    }

    // AS3: .../avatar/wardrobe/OutfitView.as::setColors()
    // A gradient colour of −1 means the tile has no gradient; the active variant is then unused.
    public setColors(
        bgColor: number,
        activeBgColor: number,
        gradientColor: number,
        activeGradientColor: number
    ): void
    {
        this._bgColor = bgColor;
        this._activeBgColor = activeBgColor;
        this._gradientColor = gradientColor;
        this._activeGradientColor = activeGradientColor;

        this.updateBackgroundColors();
    }

    // AS3: .../avatar/wardrobe/OutfitView.as::toggleActive()
    public toggleActive(active: boolean): void
    {
        this._active = active;

        this.updateBackgroundColors();
    }

    // AS3: .../avatar/wardrobe/OutfitView.as::dispose()
    // Disposes the bitmap child **after** disposing the window that owns it — harmless, and kept.
    public dispose(): void
    {
        this._windowManager = null;

        if(this._window !== null) this._window.dispose();

        this._window = null;

        if(this._bitmap !== null) this._bitmap.dispose();

        this._bitmap = null;
    }

    /**
     * AS3: .../avatar/wardrobe/OutfitView.as::windowEventProc()
     *
     * **Never attached.** AS3 declares it private and assigns it to nothing — the tile's hover
     * colouring is dead code. Kept because it is the only record of what the two colour constants
     * were for.
     *
     * Note also its inverted shape: the whole body sits inside `if(type != "WME_CLICK")`, so a
     * click falls through to nothing rather than being handled.
     */
    // AS3: .../avatar/wardrobe/OutfitView.as::windowEventProc()
    private windowEventProc = (event: WindowEvent, _window: IWindow | null = null): void =>
    {
        if(event.type === 'WME_CLICK') return;

        if(this._window === null) return;

        if(event.type === 'WME_OVER') this._window.color = OutfitView.HOVER_COLOUR;
        else if(event.type === 'WME_OUT') this._window.color = OutfitView.IDLE_COLOUR;
    };

    // AS3: .../avatar/wardrobe/OutfitView.as::updateBackgroundColors()
    private updateBackgroundColors(): void
    {
        if(this._button !== null) this._button.color = this._active ? this._activeBgColor : this._bgColor;

        if(this._gradient === null) return;

        if(this._gradientColor === OutfitView.NO_GRADIENT)
        {
            this._gradient.visible = false;

            return;
        }

        this._gradient.color = this._active ? this._activeGradientColor : this._gradientColor;
        this._gradient.visible = true;
    }

    // TS-only: keeps the never-attached AS3 handler referenced so it is not dropped as dead code.
    private get unused(): unknown
    {
        return this.windowEventProc;
    }
}
