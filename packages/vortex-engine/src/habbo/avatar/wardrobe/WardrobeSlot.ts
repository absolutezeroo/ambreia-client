import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {HabboAvatarEditor} from '../HabboAvatarEditor';
import type {IAvatarImageListener} from '@ambreia/avatar/IAvatarImageListener';
import type {IOutfit} from '../IOutfit';
import {Logger} from '@ambreia/common/utils/Logger';
import {AvatarTextureUtils} from '../AvatarTextureUtils';
import {FigureData} from '../figuredata/FigureData';

const log = Logger.getLogger('habbo.avatar.wardrobe.WardrobeSlot');

/**
 * One wardrobe slot: a saved outfit, a button to store the current figure into it, and a button to
 * wear it back.
 *
 * The window is a **clone of `slot_template`**, which `WardrobeView` detached from the layout — so
 * every slot is a copy of the same three regions (`set_button`, `get_button`, `get_figure`) around
 * one bitmap.
 *
 * A slot the user has not paid for is still built and still shown; only its two buttons are hidden
 * and its picture falls back to the empty-slot artwork. See `WardrobeModel.isSlotEnabled()`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/wardrobe/WardrobeSlot.as
 */
export class WardrobeSlot implements IOutfit, IAvatarImageListener
{
    // AS3: .../avatar/wardrobe/WardrobeSlot.as::RENDER_SET_TYPE
    // Name DERIVED: the "full" AS3 passes to `setDirection()` and `getCroppedImage()`.
    private static readonly RENDER_SET_TYPE: string = 'full';

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::RENDER_DIRECTION
    // Name DERIVED: the 4 every slot faces.
    private static readonly RENDER_DIRECTION: number = 4;

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::SMALL_SCALE
    // Name DERIVED: the "sh" used when zoom is off; `FigureData.SCALE` is the "h" used when it is.
    private static readonly SMALL_SCALE: string = 'sh';

    /**
     * AS3: .../avatar/wardrobe/WardrobeSlot.as::EMPTY_SLOT_ASSET
     *
     * Name DERIVED: the string AS3 passes to `getAssetByName()`.
     *
     * ⚠️ **This name matches no asset.** `HabboWindowManagerCom.as` declares the artwork as
     * `avatar_editor_wardrobe_wardrobe_empty_slot` — "wardrobe" twice — so the lookup returns null
     * in the real client too, `updateView()` returns early, and an empty slot draws nothing at all.
     * Kept as written: correcting it here would be inventing behaviour the Flash client never had.
     */
    // AS3: .../avatar/wardrobe/WardrobeSlot.as::updateView()
    private static readonly EMPTY_SLOT_ASSET: string = 'avatar_editor_wardrobe_empty_slot';

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::_controller
    // Name DERIVED (`_SafeStr_4593`).
    private _controller: HabboAvatarEditor | null;

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::_figure
    // Name DERIVED (`_SafeStr_5551`): null for a slot that has never been filled.
    private _figure: string | null = null;

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::_gender
    // Name DERIVED (`_SafeStr_4645`).
    private _gender: string | null = null;

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::_enabled
    // Name DERIVED (`_SafeStr_7700`): whether the user's subscription covers this slot.
    private _enabled: boolean = false;

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::_view
    // Name DERIVED (`_SafeStr_4550`).
    private _view: IWindowContainer | null = null;

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::_image
    // Name DERIVED (`_SafeStr_5302`): the `image` child the avatar is composed into.
    private _image: IBitmapWrapperWindow | null = null;

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::_id
    // Name DERIVED (`_SafeStr_8125`): the 1-based slot number, and what the save message carries.
    private _id: number;

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::_disposed
    // Name DERIVED (`_SafeStr_5769`).
    private _disposed: boolean = false;

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::WardrobeSlot()
    constructor(
        template: IWindow | null,
        controller: HabboAvatarEditor | null,
        id: number,
        enabled: boolean,
        figure: string | null = null,
        gender: string | null = null
    )
    {
        this._controller = controller;
        this._id = id;

        this.createView(template);
        this.update(figure, gender, enabled);
    }

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::get id()
    public get id(): number
    {
        return this._id;
    }

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::get figure()
    public get figure(): string
    {
        return this._figure ?? '';
    }

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::get gender()
    public get gender(): string
    {
        return this._gender ?? '';
    }

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::get view()
    public get view(): IWindowContainer | null
    {
        return this._view;
    }

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    /**
     * AS3: .../avatar/wardrobe/WardrobeSlot.as::update()
     *
     * The gender switch is the same case-insensitive M/F normalisation `Outfit` does, with the same
     * duplicated case labels; anything else is left untouched.
     */
    // AS3: .../avatar/wardrobe/WardrobeSlot.as::update()
    public update(figure: string | null, gender: string | null, enabled: boolean): void
    {
        let normalised = gender;

        if(gender === 'M' || gender === 'm') normalised = FigureData.MALE;
        else if(gender === 'F' || gender === 'f') normalised = FigureData.FEMALE;

        this._figure = figure;
        this._gender = normalised;
        this._enabled = enabled;

        this.updateView();
    }

    /**
     * Repaints the slot.
     *
     * A filled, paid-for slot renders its figure; anything else falls back to the empty-slot
     * artwork — which, in practice, never loads. See `EMPTY_SLOT_ASSET`.
     *
     * Both buttons follow the paid flag, and the "wear it" button additionally needs a figure. Note
     * the picture is composed into a **fresh bitmap the size of the slot** and centred on both
     * axes, unlike `OutfitView`, which bottom-aligns.
     */
    // AS3: .../avatar/wardrobe/WardrobeSlot.as::updateView()
    public updateView(): void
    {
        const zoom = this._controller?.manager?.getBoolean('zoom.enabled') ?? false;

        let source: {resource: CanvasImageSource; frame: {x: number; y: number; width: number; height: number}} | null = null;

        if(this._figure !== null && this._figure !== '' && this._enabled)
        {
            const image = this._controller?.createAvatarImage(
                this.figure, zoom ? FigureData.SCALE : WardrobeSlot.SMALL_SCALE, this._gender, this
            ) ?? null;

            if(image !== null)
            {
                image.setDirection(WardrobeSlot.RENDER_SET_TYPE, WardrobeSlot.RENDER_DIRECTION);
                source = AvatarTextureUtils.toCanvasSource(
                    image.getCroppedImage(WardrobeSlot.RENDER_SET_TYPE, zoom ? 0.5 : 1)
                );
                image.dispose?.();
            }
        }
        else
        {
            const empty = this._controller?.getAssetBitmap(WardrobeSlot.EMPTY_SLOT_ASSET) ?? null;

            if(empty === null) log.debug(`Empty-slot artwork "${WardrobeSlot.EMPTY_SLOT_ASSET}" not found`);
            else source = {resource: empty, frame: {x: 0, y: 0, width: empty.width, height: empty.height}};
        }

        // AS3 bails out here when neither branch produced a picture, so the slot keeps whatever it
        // was showing — including the two button visibilities below, which are then never updated.
        if(source === null) return;

        this.paint(source);

        const setButton = this._view?.findChildByName('set_button') ?? null;

        if(setButton !== null) setButton.visible = this._enabled;

        const getButton = this._view?.findChildByName('get_button') ?? null;

        if(getButton !== null) getButton.visible = this._enabled && this._figure !== null;
    }

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::avatarImageReady()
    // Repaints wholesale; the figure string is ignored.
    public avatarImageReady(_figureString: string): void
    {
        this.updateView();
    }

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::dispose()
    public dispose(): void
    {
        this._controller = null;
        this._figure = null;
        this._gender = null;
        this._image = null;

        if(this._view !== null)
        {
            this._view.dispose();
            this._view = null;
        }

        this._disposed = true;
    }

    // AS3: .../avatar/wardrobe/WardrobeSlot.as::createView()
    // Starts hidden — `WardrobeView.update()` is what makes each slot visible once it is in a column.
    private createView(template: IWindow | null): void
    {
        this._view = (template?.clone() as IWindowContainer | null) ?? null;

        if(this._view === null) return;

        this._view.procedure = this.eventHandler;
        this._view.visible = false;
        this._image = this._view.findChildByName('image') as IBitmapWrapperWindow | null;
    }

    // TS-only: the composition half of `updateView()`. AS3 does it inline with
    // `new BitmapData(w, h, true, 0)` + `bitmap.draw(source, new Matrix(1,0,0,1,dx,dy))`.
    private paint(source: {resource: CanvasImageSource; frame: {x: number; y: number; width: number; height: number}}): void
    {
        const target = this._image;

        if(target === null) return;

        const canvas = new OffscreenCanvas(target.width, target.height);
        const context = canvas.getContext('2d');

        if(context === null) return;

        const x = Math.trunc((target.width - source.frame.width) / 2);
        const y = Math.trunc((target.height - source.frame.height) / 2);

        context.drawImage(
            source.resource,
            source.frame.x, source.frame.y, source.frame.width, source.frame.height,
            x, y, source.frame.width, source.frame.height
        );

        target.bitmap = canvas.transferToImageBitmap();
    }

    /**
     * AS3: .../avatar/wardrobe/WardrobeSlot.as::eventHandler()
     *
     * Every click is gated on `verifyClubLevel()` first — which opens the club advert and returns
     * false for a non-subscriber, so a disabled slot advertises rather than acts.
     *
     * `set_button` saves the figure **and updates the slot immediately**, before the server has
     * acknowledged anything. `get_button` and `get_figure` both wear it.
     */
    // DEVIATION: AS3 clears any staged NFT outfit before wearing the slot; the RPG fork removed NFT.
    // AS3: .../avatar/wardrobe/WardrobeSlot.as::eventHandler()
    private eventHandler = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        const controller = this._controller;

        if(controller === null) return;

        if(!controller.verifyClubLevel()) return;

        switch(window.name)
        {
            case 'set_button':
                this._figure = controller.figureData?.getFigureString() ?? null;
                this._gender = controller.gender;
                controller.handler?.saveWardrobeOutfit(this._id, this);
                this.updateView();
                break;

            case 'get_button':
            case 'get_figure':
                if(this._figure === null || this._figure === '') break;

                controller.loadAvatarInEditor(this._figure, this.gender, controller.clubMemberLevel);
                break;
        }
    };
}
