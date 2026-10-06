import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import type {IAvatarRenderManager} from '@habbo/avatar/IAvatarRenderManager';
import type {IAvatarImageListener} from '@habbo/avatar/IAvatarImageListener';
import type {IRoomPreviewerWidget} from '@habbo/window/widgets/IRoomPreviewerWidget';
import type {RoomPreviewer} from '@habbo/room/preview/RoomPreviewer';
import {AvatarTextureUtils} from '@habbo/avatar/AvatarTextureUtils';

/**
 * Shows an avatar wearing one effect, for the catalog's pixel-effect products.
 *
 * Two rendering paths, and which one runs is decided per call: if the room previewer's engine is
 * up, the avatar is put *into* the little room and animated; if it is not, a flat avatar image is
 * rendered and pushed in as a still. The second path is also the one `avatarImageReady()` serves,
 * so a figure that was not cached lands there a moment later.
 *
 * AS3 has this class twice; the other copy belonged to the collectibles hub, which the RPG fork
 * removed. This one differs from it by one line: it also hides the preview room's walls and floor
 * in its constructor.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/EffectPreviewer.as
 */
export class EffectPreviewer implements IAvatarImageListener
{
    /**
     * Both the direction and the location the avatar is placed at — AS3 passes the same constant
     * twice to `updateAvatarDirectionAndLocation()`.
     */
    // AS3: EffectPreviewer.as::_SafeStr_10225
    private static readonly AVATAR_DIRECTION: number = 2;

    // AS3: EffectPreviewer.as::_SafeStr_4649 (the widget window)
    private _widgetWindow: IWidgetWindow;
    // AS3: EffectPreviewer.as::_avatarRenderManager
    private _avatarRenderManager: IAvatarRenderManager;
    // AS3: EffectPreviewer.as::_SafeStr_5769 (the disposed flag)
    private _disposed: boolean = false;

    // AS3: EffectPreviewer.as::EffectPreviewer()
    constructor(widgetWindow: IWidgetWindow, avatarRenderManager: IAvatarRenderManager)
    {
        this._widgetWindow = widgetWindow;
        this._avatarRenderManager = avatarRenderManager;

        this.roomPreviewer?.updateRoomWallsAndFloorVisibility(false, false);
    }

    // AS3: EffectPreviewer.as::update()
    update(figure: string, effectId: number): void
    {
        const previewer = this.roomPreviewer;

        // AS3 repeats the constructor's call here, and it matters: the widget's room previewer is
        // resolved lazily through the widget, so the constructor may well have found none.
        previewer?.updateRoomWallsAndFloorVisibility(false, false);

        if(previewer !== null && previewer.isRoomEngineReady)
        {
            previewer.addAvatarIntoRoom(figure, effectId);
            previewer.updateAvatarDirectionAndLocation(
                EffectPreviewer.AVATAR_DIRECTION,
                EffectPreviewer.AVATAR_DIRECTION
            );
            previewer.updatePreviewRoomView(true);
            previewer.updateRoomEngine();

            return;
        }

        this.showFlatAvatar(figure);
    }

    /**
     * AS3 does not guard `_SafeStr_5769` on the `update()` path, only here — a disposed previewer
     * asked to update would still draw. Kept.
     */
    // AS3: EffectPreviewer.as::avatarImageReady()
    avatarImageReady(figureString: string): void
    {
        if(this._disposed) return;

        this.showFlatAvatar(figureString);
    }

    /**
     * TS-only: the two AS3 call sites are byte-identical
     * (`createAvatarImage(figure, "h", null, this)` then `widget.showPreview(getCroppedImage("full"))`),
     * so they are one method here. The `toCanvas()` step is the port's — AS3 hands `showPreview()`
     * raw BitmapData, and this port's widget takes a canvas.
     */
    // TS-only: see the note above; AS3 inlines this twice.
    private showFlatAvatar(figure: string): void
    {
        // AS3 calls this with four arguments; its fifth (`effectListener`) defaults to null and the
        // port made it required, so the null is explicit here rather than different.
        const image = this._avatarRenderManager.createAvatarImage(figure, 'h', null, this, null);

        if(image === null) return;

        const canvas = AvatarTextureUtils.toCanvas(image.getCroppedImage('full'));

        if(canvas === null) return;

        this.widget?.showPreview(canvas);
    }

    // AS3: EffectPreviewer.as::get widget()
    private get widget(): IRoomPreviewerWidget | null
    {
        return (this._widgetWindow.widget ?? null) as IRoomPreviewerWidget | null;
    }

    // AS3: EffectPreviewer.as::get roomPreviewer()
    private get roomPreviewer(): RoomPreviewer | null
    {
        return this.widget?.roomPreviewer ?? null;
    }

    // AS3: EffectPreviewer.as::set visible()
    set visible(value: boolean)
    {
        this._widgetWindow.visible = value;
    }

    // AS3: EffectPreviewer.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: EffectPreviewer.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this.roomPreviewer?.reset(true);
    }
}
