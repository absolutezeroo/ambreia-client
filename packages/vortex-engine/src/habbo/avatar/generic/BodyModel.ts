import type {CategoryData} from '../common/CategoryData';
import type {IAvatarImageListener} from '@ambreia/avatar/IAvatarImageListener';
import type {ICategoryModel} from '../common/ICategoryModel';
import type {ICategoryModelOwner} from '../common/ICategoryModelOwner';
import {AvatarTextureUtils} from '../AvatarTextureUtils';
import {BodyView} from './BodyView';
import {CategoryBaseModel} from '../common/CategoryBaseModel';

/**
 * The face page — one part type, `hd`, and the only page whose thumbnails are **rendered rather
 * than iconified**: each shows the user's own head wearing that face, redrawn whenever the skin
 * colour changes.
 *
 * That is why it overrides three members. `updateSelectionsFromFigure()` repaints instead of
 * syncing the grid (the sync happens inside `getFaceCategoryData()`), `selectColor()` repaints
 * after applying, and `avatarImageReady()` repaints the one thumbnail whose render just finished.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/generic/BodyModel.as
 */
export class BodyModel extends CategoryBaseModel implements ICategoryModel, IAvatarImageListener
{
    // AS3: .../avatar/generic/BodyModel.as::HEAD_PART_TYPE
    // Name DERIVED: the "hd" AS3 writes inline in all four places.
    private static readonly HEAD_PART_TYPE: string = 'hd';

    // AS3: .../avatar/generic/BodyModel.as::RENDER_SCALE
    // Name DERIVED: the "h" AS3 passes to createAvatarImage — the same scale `FigureData.SCALE`
    // declares.
    private static readonly RENDER_SCALE: string = 'h';

    // AS3: .../avatar/generic/BodyModel.as::CROP_HEAD
    // Name DERIVED: the crop AS3 asks for, so the thumbnail is a head and not a whole avatar.
    private static readonly CROP_HEAD: string = 'head';

    // AS3: .../avatar/generic/BodyModel.as::BodyModel()
    constructor(controller: ICategoryModelOwner | null)
    {
        super(controller);
    }

    /**
     * AS3: .../avatar/generic/BodyModel.as::init()
     *
     * The `_initialised` flag is set **before** the view is built, as in AS3 — `BodyView.init()`
     * calls back into this page through `updateGridView()`, and the flag is what stops that
     * re-entering here.
     */
    protected override init(): void
    {
        super.init();

        this.initCategory(BodyModel.HEAD_PART_TYPE);

        this._initialised = true;

        if(this._view === null)
        {
            this._view = new BodyView(this);
            this._view.init();
        }
    }

    /**
     * AS3: .../avatar/generic/BodyModel.as::switchCategory()
     *
     * Does **not** call `init()` first, unlike the base — it goes straight to the view. A page
     * switched to before anything built it therefore dereferences a null view in AS3; kept as an
     * optional call here, which is the same no-op the base's null-guards give everywhere else.
     */
    public override switchCategory(partType: string = ''): void
    {
        this._view?.switchCategory(partType);
    }

    /**
     * AS3: .../avatar/generic/BodyModel.as::selectColor()
     *
     * Two differences from the base. It does **not** revert the selection when the colour is a
     * dimmed club one — it opens the advert and leaves the grid showing the unaffordable choice.
     * And it repaints every face thumbnail afterwards, because changing skin colour changes all
     * of them.
     *
     * It also dereferences the selected colour unguarded where the base null-checks it.
     */
    public override selectColor(partType: string, index: number, layer: number): void
    {
        const category = this._categories?.getValue(partType) ?? null;

        if(category === null) return;

        category.selectColorIndex(index, layer);

        const colour = category.getSelectedColor(layer);

        if(colour?.isDisabledForWearing === true)
        {
            this._controller?.openHabboClubAdWindow();

            return;
        }

        this._controller?.figureData?.savePartSetColourId(partType, category.getSelectedColorIds() ?? [], true);

        this.updateSelectionsFromFigure(BodyModel.HEAD_PART_TYPE);
    }

    /**
     * Repaints only the thumbnail whose figure string matches the one that finished — the filter
     * argument `updateIconImage()` takes. Without it, one late render would redraw the whole grid.
     */
    // AS3: .../avatar/generic/BodyModel.as::avatarImageReady()
    public avatarImageReady(figureString: string): void
    {
        const category = this.getFaceCategoryData();

        if(category === null) return;

        this.updateIconImage(category, figureString);
    }

    /**
     * AS3: .../avatar/generic/BodyModel.as::updateSelectionsFromFigure()
     *
     * Ignores the part type it is handed and always works on the head — and repaints rather than
     * syncing, because `getFaceCategoryData()` has already done the syncing.
     */
    protected override updateSelectionsFromFigure(_partType: string): void
    {
        const category = this.getFaceCategoryData();

        if(category === null) return;

        this.updateIconImage(category);
    }

    // AS3: .../avatar/generic/BodyModel.as::getFaceCategoryData()
    // Points the head grid at the figure's current face and skin colour, then hands it back.
    private getFaceCategoryData(): CategoryData | null
    {
        if(this._categories === null) return null;

        const category = this._categories.getValue(BodyModel.HEAD_PART_TYPE);

        if(category === null) return null;

        const figureData = this._controller?.figureData ?? null;

        if(figureData === null) return null;

        category.selectPartId(figureData.getPartSetId(BodyModel.HEAD_PART_TYPE));
        category.selectColorIds(figureData.getColourIds(BodyModel.HEAD_PART_TYPE));

        return category;
    }

    /**
     * Renders one head per candidate face, on the figure's *current* colours — that is what
     * `getFigureStringWithFace()` builds. The synthetic thumbnails are skipped by the `partSet`
     * null-check.
     *
     * `filter` non-null repaints only the thumbnail whose figure string equals it; that is the
     * late-render path from `avatarImageReady()`.
     *
     * The render has to be converted: `getCroppedImage()` hands back a PixiJS `Texture` where AS3
     * returns a `BitmapData`, and `iconImage` is composited with `drawImage()`, which rejects a
     * texture outright. See `AvatarTextureUtils`.
     */
    // AS3: .../avatar/generic/BodyModel.as::updateIconImage()
    private updateIconImage(category: CategoryData, filter: string | null = null): void
    {
        const figureData = this._controller?.figureData ?? null;

        if(figureData === null) return;

        for(const part of category.parts ?? [])
        {
            if(part.partSet === null) continue;

            const figureString = figureData.getFigureStringWithFace(part.id);

            if(filter !== null && filter !== figureString) continue;

            const image = this._controller?.createAvatarImage(
                figureString, BodyModel.RENDER_SCALE, null, this
            ) ?? null;

            if(image === null) continue;

            part.iconImage = AvatarTextureUtils.toImageBitmap(image.getCroppedImage(BodyModel.CROP_HEAD));
            image.dispose?.();
        }
    }
}
