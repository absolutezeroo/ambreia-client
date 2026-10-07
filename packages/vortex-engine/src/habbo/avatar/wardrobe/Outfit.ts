import type {IAvatarImageListener} from '@ambreia/avatar/IAvatarImageListener';
import type {ICategoryModelOwner} from '../common/ICategoryModelOwner';
import type {IOutfit} from '../IOutfit';
import {FigureData} from '../figuredata/FigureData';
import {OutfitView} from './OutfitView';

/**
 * A saved figure with a tile to show it — the hot-looks page is a grid of these.
 *
 * The render is asynchronous by nature: `createAvatarImage()` is asked for the picture immediately,
 * and if the parts are not downloaded yet the renderer calls back through `avatarImageReady()`,
 * which simply runs the whole of `update()` again. There is no partial repaint.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/wardrobe/Outfit.as
 */
export class Outfit implements IOutfit, IAvatarImageListener
{
    // AS3: .../avatar/wardrobe/Outfit.as::RENDER_SET_TYPE
    // Name DERIVED: the "full" AS3 passes to both `setDirection()` and `getImage()`.
    private static readonly RENDER_SET_TYPE: string = 'full';

    // AS3: .../avatar/wardrobe/Outfit.as::RENDER_DIRECTION
    // Name DERIVED: the 4 the tile always faces.
    private static readonly RENDER_DIRECTION: number = 4;

    // AS3: .../avatar/wardrobe/Outfit.as::_controller
    // Name DERIVED (`_SafeStr_4593`). AS3 types it `HabboAvatarEditor`; narrowed here to the three
    // members this class touches — the window manager, `zoom.enabled`, and the renderer.
    private _controller: ICategoryModelOwner | null;

    // AS3: .../avatar/wardrobe/Outfit.as::_figure
    // Name DERIVED (`_SafeStr_5551`).
    private _figure: string | null;

    // AS3: .../avatar/wardrobe/Outfit.as::_gender
    // Name DERIVED (`_SafeStr_4645`).
    private _gender: string | null;

    // AS3: .../avatar/wardrobe/Outfit.as::_view
    // Name DERIVED (`_SafeStr_4550`).
    private _view: OutfitView | null;

    // AS3: .../avatar/wardrobe/Outfit.as::_disposed
    // Name DERIVED (`_SafeStr_5769`).
    private _disposed: boolean = false;

    /**
     * AS3: .../avatar/wardrobe/Outfit.as::Outfit()
     *
     * The view is built **before** the gender is normalised and before the figure is stored, so its
     * "enabled" flag is decided on the raw argument — an empty figure gives a disabled tile.
     */
    constructor(controller: ICategoryModelOwner | null, figure: string, gender: string)
    {
        this._controller = controller;
        this._view = new OutfitView(controller?.manager?.windowManager ?? null, figure !== '');
        this._figure = figure;
        this._gender = Outfit.normaliseGender(gender);

        this.update();
    }

    // AS3: .../avatar/wardrobe/Outfit.as::get figure()
    public get figure(): string
    {
        return this._figure ?? '';
    }

    // AS3: .../avatar/wardrobe/Outfit.as::get gender()
    public get gender(): string
    {
        return this._gender ?? '';
    }

    // AS3: .../avatar/wardrobe/Outfit.as::get view()
    public get view(): OutfitView | null
    {
        return this._view;
    }

    // AS3: .../avatar/wardrobe/Outfit.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    /**
     * Renders the figure and hands the picture to the tile.
     *
     * `zoom.enabled` picks the *large* body scale and then halves the finished image, rather than
     * asking for the small one — the same trick `vortex-imager` documents. The result is a
     * higher-quality thumbnail at the same size.
     */
    // AS3: .../avatar/wardrobe/Outfit.as::update()
    public update(): void
    {
        const zoom = this._controller?.manager?.getBoolean('zoom.enabled') ?? false;

        const image = this._controller?.createAvatarImage(
            this.figure, zoom ? FigureData.SCALE : Outfit.SMALL_SCALE, this._gender, this
        ) ?? null;

        if(image === null) return;

        image.setDirection(Outfit.RENDER_SET_TYPE, Outfit.RENDER_DIRECTION);

        const texture = image.getImage(Outfit.RENDER_SET_TYPE, true, zoom ? 0.5 : 1);

        if(this._view !== null && texture != null) this._view.update(texture);

        image.dispose?.();
    }

    // AS3: .../avatar/wardrobe/Outfit.as::avatarImageReady()
    // Repaints wholesale — the figure string it is handed is ignored.
    public avatarImageReady(_figureString: string): void
    {
        this.update();
    }

    // AS3: .../avatar/wardrobe/Outfit.as::dispose()
    public dispose(): void
    {
        if(this._view !== null)
        {
            this._view.dispose();
            this._view = null;
        }

        this._figure = null;
        this._gender = null;
        this._disposed = true;
        this._controller = null;
    }

    // AS3: .../avatar/wardrobe/Outfit.as::SMALL_SCALE
    // Name DERIVED: the "sh" used when zoom is off. `FigureData.SCALE` is the "h" used when it is on.
    private static readonly SMALL_SCALE: string = 'sh';

    /**
     * AS3: .../avatar/wardrobe/Outfit.as::Outfit()
     *
     * The gender switch, hoisted — `WardrobeSlot.update()` has the identical one. Both list `"M"`
     * **twice** and `"F"` twice, a decompiler artefact of duplicate case labels; the behaviour is
     * simply case-insensitive M/F, and anything else is left untouched rather than defaulted.
     */
    // AS3: .../avatar/wardrobe/Outfit.as::Outfit()
    private static normaliseGender(gender: string): string
    {
        if(gender === 'M' || gender === 'm') return 'M';
        if(gender === 'F' || gender === 'f') return 'F';

        return gender;
    }
}
