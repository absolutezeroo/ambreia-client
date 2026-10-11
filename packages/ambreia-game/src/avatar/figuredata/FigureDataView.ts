import type {IRoomPreviewerWidget} from '../../window/widgets/IRoomPreviewerWidget';
import type {RoomPreviewer} from '../../room/preview/RoomPreviewer';
import type {IAvatarImageListener} from '@ambreia/avatar/IAvatarImageListener';
import type {IFigureDataView} from './IFigureDataView';
import type {IFigureDataOwner} from './IFigureDataOwner';
import {Logger} from '@ambreia/common/utils/Logger';
import {AvatarTextureUtils} from '../AvatarTextureUtils';

const log = Logger.getLogger('habbo.avatar.figuredata.FigureDataView');

/**
 * The editor's avatar preview — the little room in the middle of the window.
 *
 * It has **two** completely different ways of drawing the same thing, chosen per update. When the
 * room engine is up it puts a real avatar into a real preview room, which is what makes the figure
 * turn when you press the rotate button. When it is not, it falls back to a flat rendered image,
 * and re-renders it from `avatarImageReady()` once the sprites arrive.
 *
 * The room's walls and floor are hidden once, in the constructor, so the preview shows the avatar
 * against the window's own background rather than against a tile.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/figuredata/FigureDataView.as
 */
export class FigureDataView implements IFigureDataView, IAvatarImageListener
{
    // AS3: .../avatar/figuredata/FigureDataView.as::PREVIEW_AVATAR_DIRECTION
    public static readonly PREVIEW_AVATAR_DIRECTION: number = 4;

    // AS3: .../avatar/figuredata/FigureDataView.as::RENDER_SCALE
    // Name DERIVED: the "h" the fallback renders at — the large body scale.
    private static readonly RENDER_SCALE: string = 'h';

    // AS3: .../avatar/figuredata/FigureDataView.as::RENDER_SET_TYPE
    // Name DERIVED: the "full" the fallback crops to.
    private static readonly RENDER_SET_TYPE: string = 'full';

    // AS3: .../avatar/figuredata/FigureDataView.as::_widget
    // Name DERIVED (`_SafeStr_4549`): the previewer behind the layout's `avatarWidget`.
    private _widget: IRoomPreviewerWidget | null = null;

    // AS3: .../avatar/figuredata/FigureDataView.as::_roomPreviewer
    // Name DERIVED (`_SafeStr_4816`).
    private _roomPreviewer: RoomPreviewer | null = null;

    // AS3: .../avatar/figuredata/FigureDataView.as::_figureData
    // Name DERIVED (`_SafeStr_4570`).
    private _owner: IFigureDataOwner | null;

    // AS3: .../avatar/figuredata/FigureDataView.as::_figureString
    // The figure the last `update()` asked for; `avatarImageReady()` only repaints for a match.
    private _figureString: string = '';

    // AS3: .../avatar/figuredata/FigureDataView.as::_disposed
    // Name DERIVED (`_SafeStr_5769`).
    private _disposed: boolean = false;

    /**
     * AS3: .../avatar/figuredata/FigureDataView.as::FigureDataView()
     *
     * AS3 dereferences the widget chain unguarded. Guarded here: the editor's window may not have a
     * previewer at all, and a throw in this constructor would abort `HabboAvatarEditor.init()`
     * rather than merely leave the preview blank.
     */
    constructor(owner: IFigureDataOwner | null)
    {
        this._owner = owner;

        const container = owner?.getFigureContainer() ?? null;

        this._widget = (container?.widget as IRoomPreviewerWidget | null) ?? null;

        if(this._widget === null)
        {
            log.warn('No room previewer behind `avatarWidget` — the editor preview will stay empty');

            return;
        }

        this._roomPreviewer = this._widget.roomPreviewer;
        this._roomPreviewer?.updateRoomWallsAndFloorVisibility(false, false);
    }

    // AS3: .../avatar/figuredata/FigureDataView.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    /**
     * AS3: .../avatar/figuredata/FigureDataView.as::update()
     *
     * The direction is used **twice** — as both body and head rotation — so the preview avatar
     * never looks over its shoulder.
     */
    // AS3: .../avatar/figuredata/FigureDataView.as::update()
    public update(
        figureString: string,
        effectType: number = 0,
        direction: number = FigureDataView.PREVIEW_AVATAR_DIRECTION
    ): void
    {
        this._figureString = figureString;

        const previewer = this._roomPreviewer;

        if(previewer !== null && previewer.isRoomEngineReady)
        {
            previewer.addAvatarIntoRoom(figureString, effectType);
            previewer.updateAvatarDirectionAndLocation(direction, direction);
            previewer.updatePreviewRoomView(true);
            previewer.updateRoomEngine();

            return;
        }

        this.showRenderedFigure(figureString);
    }

    /**
     * AS3: .../avatar/figuredata/FigureDataView.as::avatarImageReady()
     *
     * Repaints only when the finished figure is the one currently shown — a late render for a
     * figure the user has already changed away from is dropped.
     */
    // AS3: .../avatar/figuredata/FigureDataView.as::avatarImageReady()
    public avatarImageReady(figureString: string): void
    {
        if(figureString !== this._figureString) return;

        this.showRenderedFigure(figureString);
    }

    // AS3: .../avatar/figuredata/FigureDataView.as::dispose()
    // Sets the flag and nothing else: the widget and the previewer belong to the editor's window.
    public dispose(): void
    {
        this._disposed = true;
    }

    /**
     * The fallback: render the figure flat and hand it to the widget.
     *
     * TS-only as a method — AS3 writes these three lines out twice, in `update()` and in
     * `avatarImageReady()`. `this` is passed as the listener, which is what brings the second call
     * back here once the sprites have downloaded.
     */
    // AS3: .../avatar/figuredata/FigureDataView.as::update()
    private showRenderedFigure(figureString: string): void
    {
        const image = this._owner?.avatarRenderManager?.createAvatarImage(
            figureString, FigureDataView.RENDER_SCALE, null, this, null
        ) ?? null;

        if(image === null) return;

        const canvas = AvatarTextureUtils.toCanvas(image.getCroppedImage(FigureDataView.RENDER_SET_TYPE));

        if(canvas !== null) this._widget?.showPreview(canvas);
    }
}
