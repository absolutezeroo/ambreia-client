import type {IWindow} from '@ambreia/ui/IWindow';
import type {CategoryData} from './CategoryData';
import type {ICategoryModel} from './ICategoryModel';
import type {ICategoryModelOwner} from './ICategoryModelOwner';
import type {ICategoryView} from './ICategoryView';
import type {IFigureSetOwnership} from './IFigureSetOwnership';
import {OrderedMap} from '@ambreia/common/utils/OrderedMap';

/**
 * What every editor page has in common: a lazily-built `CategoryData` per part type it owns, the
 * plumbing that keeps those selections in step with the figure, and the two "strip what you may
 * not wear" sweeps.
 *
 * Subclasses supply only `init()` — which part types this page owns and which view draws it. The
 * five simple pages are nothing but that; `BodyModel` is the one that overrides behaviour.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/common/CategoryBaseModel.as
 */
export class CategoryBaseModel implements ICategoryModel
{
    // AS3: .../avatar/common/CategoryBaseModel.as::_categories
    // Part type → its grid. Keyed by part type, not by page — see `ICategoryModel`.
    protected _categories: OrderedMap<string, CategoryData> | null = null;

    // AS3: .../avatar/common/CategoryBaseModel.as::_controller
    // Name DERIVED (`_SafeStr_4593`): the field behind `get controller()`.
    protected _controller: ICategoryModelOwner | null;

    // AS3: .../avatar/common/CategoryBaseModel.as::_initialised
    // Name DERIVED (`_SafeStr_4755`): set by each subclass at the *end* of its `init()`.
    protected _initialised: boolean = false;

    // AS3: .../avatar/common/CategoryBaseModel.as::_view
    // Name DERIVED (`_SafeStr_4550`): built by the subclass's `init()`, not by this class.
    protected _view: ICategoryView | null = null;

    // AS3: .../avatar/common/CategoryBaseModel.as::_disposed
    // Name DERIVED (`_SafeStr_5769`).
    private _disposed: boolean = false;

    // AS3: .../avatar/common/CategoryBaseModel.as::CategoryBaseModel()
    constructor(controller: ICategoryModelOwner | null)
    {
        this._controller = controller;
    }

    // AS3: .../avatar/common/CategoryBaseModel.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../avatar/common/CategoryBaseModel.as::get controller()
    public get controller(): ICategoryModelOwner | null
    {
        return this._controller;
    }

    public get avatarRenderManager()
    {
        return this._controller?.avatarRenderManager ?? null;
    }

    public get windowManager()
    {
        return this._controller?.windowManager ?? null;
    }

    public getAssetBitmap(name: string): ImageBitmap | null
    {
        return this._controller?.getAssetBitmap(name) ?? null;
    }

    public getProperty(key: string): string
    {
        return this._controller?.getProperty(key) ?? '';
    }

    public openCatalogPage(pageName: string): void
    {
        this._controller?.openCatalogPage(pageName);
    }

    /**
     * Throws the grids away and clears the initialised flag, so the next `switchCategory()` or
     * `getWindowContainer()` rebuilds them — that is how a gender change or a club-level change
     * re-filters every page.
     *
     * The **view is not disposed**, only reset: the windows survive and are re-populated.
     */
    // AS3: .../avatar/common/CategoryBaseModel.as::reset()
    public reset(): void
    {
        this._initialised = false;

        for(const category of this._categories?.getValues() ?? [])
        {
            if(category !== null && category !== undefined) category.dispose();
        }

        this._categories = new OrderedMap<string, CategoryData>();

        this._view?.reset();
    }

    // AS3: .../avatar/common/CategoryBaseModel.as::switchCategory()
    // Builds the page on first use — `init()` is protected and this is one of its two triggers.
    public switchCategory(partType: string = ''): void
    {
        if(!this._initialised) this.init();

        this._view?.switchCategory(partType);
    }

    // AS3: .../avatar/common/CategoryBaseModel.as::getWindowContainer()
    // The other trigger for `init()`.
    public getWindowContainer(): IWindow | null
    {
        if(!this._initialised) this.init();

        if(this._view === null) return null;

        return this._view.getWindowContainer();
    }

    // AS3: .../avatar/common/CategoryBaseModel.as::getCategoryData()
    public getCategoryData(partType: string): CategoryData | null
    {
        if(!this._initialised) this.init();

        if(this._categories === null) return null;

        return this._categories.getValue(partType);
    }

    // AS3: .../avatar/common/CategoryBaseModel.as::hasClubItemsOverLevel()
    // Any part type of this page having an over-level selection is enough.
    public hasClubItemsOverLevel(clubLevel: number): boolean
    {
        if(this._categories === null) return false;

        for(const category of this._categories.getValues())
        {
            if(category !== null && category.hasClubSelectionsOverLevel(clubLevel)) return true;
        }

        return false;
    }

    // AS3: .../avatar/common/CategoryBaseModel.as::hasInvalidSellableItems()
    public hasInvalidSellableItems(inventory: IFigureSetOwnership | null): boolean
    {
        if(this._categories === null) return false;

        for(const category of this._categories.getValues())
        {
            if(category !== null && category.hasInvalidSellableItems(inventory)) return true;
        }

        return false;
    }

    /**
     * Strips the part *and* the colours of every part type on the page, and writes the result back
     * into the figure. Both strips run — the second is not skipped when the first already
     * succeeded, so a part that was over-level and dyed over-level is fixed in one pass.
     */
    // AS3: .../avatar/common/CategoryBaseModel.as::stripClubItemsOverLevel()
    public stripClubItemsOverLevel(clubLevel: number): boolean
    {
        if(this._categories === null) return false;

        let strippedAny = false;

        for(const partType of this._categories.getKeys())
        {
            const category = this._categories.getValue(partType);

            if(category === null) continue;

            let stripped = false;

            if(category.stripClubItemsOverLevel(clubLevel)) stripped = true;
            if(category.stripClubColorsOverLevel(clubLevel)) stripped = true;

            if(!stripped) continue;

            const part = category.getCurrentPart();

            if(part !== null && this._controller?.figureData != null)
            {
                this._controller.figureData.savePartData(partType, part.id, category.getSelectedColorIds() ?? [], true);
            }

            strippedAny = true;
        }

        return strippedAny;
    }

    // AS3: .../avatar/common/CategoryBaseModel.as::stripInvalidSellableItems()
    // The same sweep for unowned sellable parts. Colours have no ownership, so there is no second
    // strip here.
    public stripInvalidSellableItems(): boolean
    {
        if(this._categories === null) return false;

        let strippedAny = false;

        for(const partType of this._categories.getKeys())
        {
            const category = this._categories.getValue(partType);

            if(category === null) continue;

            if(!category.stripInvalidSellableItems(this._controller?.inventory ?? null)) continue;

            const part = category.getCurrentPart();

            if(part !== null && this._controller?.figureData != null)
            {
                this._controller.figureData.savePartData(partType, part.id, category.getSelectedColorIds() ?? [], true);
            }

            strippedAny = true;
        }

        return strippedAny;
    }

    /**
     * Clicking a dimmed club item **reverts** to the previous selection and opens the club advert
     * instead of applying — which is why the old index is captured before the new one is set.
     */
    // AS3: .../avatar/common/CategoryBaseModel.as::selectPart()
    public selectPart(partType: string, index: number): void
    {
        const category = this._categories?.getValue(partType) ?? null;

        if(category === null) return;

        const previousIndex = category.selectedPartIndex;

        category.selectPartIndex(index);

        const part = category.getCurrentPart();

        if(part === null) return;

        if(part.isDisabledForWearing)
        {
            category.selectPartIndex(previousIndex);
            this._controller?.openHabboClubAdWindow();

            return;
        }

        // The number of palettes shown follows the *part*, not the page — a two-layer garment
        // reveals a second palette that a one-layer one hides.
        this._view?.showPalettes(partType, part.colorLayerCount);

        if(this._controller?.figureData != null)
        {
            this._controller.figureData.savePartData(partType, part.id, category.getSelectedColorIds() ?? [], true);
        }
    }

    /**
     * The club revert is the same idea as `selectPart()`, but the whole check sits **inside** the
     * `figureData` guard — so with no figure loaded a dimmed colour is silently applied to the
     * grid and neither reverted nor advertised. AS3's; kept.
     */
    // AS3: .../avatar/common/CategoryBaseModel.as::selectColor()
    public selectColor(partType: string, index: number, layer: number): void
    {
        const category = this._categories?.getValue(partType) ?? null;

        if(category === null) return;

        const previousIndex = category.getCurrentColorIndex(layer);

        category.selectColorIndex(index, layer);

        if(this._controller?.figureData == null) return;

        const colour = category.getSelectedColor(layer);

        if(colour === null) return;

        if(colour.isDisabledForWearing)
        {
            category.selectColorIndex(previousIndex, layer);
            this._controller.openHabboClubAdWindow();

            return;
        }

        this._controller.figureData.savePartSetColourId(partType, category.getSelectedColorIds() ?? [], true);
    }

    // AS3: .../avatar/common/CategoryBaseModel.as::dispose()
    // Disposes the view but **not** the grids — `reset()` is what disposes those, and `dispose()`
    // simply drops the map. AS3's asymmetry, kept.
    public dispose(): void
    {
        this._view?.dispose();
        this._view = null;
        this._categories = null;
        this._controller = null;
        this._disposed = true;
    }

    // AS3: .../avatar/common/CategoryBaseModel.as::init()
    // Subclasses override this to declare their part types and build their view, then call up.
    protected init(): void
    {
        if(this._categories === null) this._categories = new OrderedMap<string, CategoryData>();
    }

    // AS3: .../avatar/common/CategoryBaseModel.as::initCategory()
    // Builds one part type's grid, once. An already-built type is left alone, so `init()` is
    // cheap to re-enter.
    protected initCategory(partType: string): void
    {
        if(this._categories === null) return;

        if(this._categories.getValue(partType) !== null) return;

        const data = this._controller?.generateDataContent(this, partType) ?? null;

        if(data === null) return;

        this._categories.setValue(partType, data);
        this.updateSelectionsFromFigure(partType);
    }

    /**
     * Points the grid at whatever the figure currently wears. The palette count shown comes from
     * the **number of colours the figure records**, not from the part's layer count — which is
     * why a freshly-parsed figure can show a different number of palettes than clicking the same
     * part would.
     */
    // AS3: .../avatar/common/CategoryBaseModel.as::updateSelectionsFromFigure()
    protected updateSelectionsFromFigure(partType: string): void
    {
        const figureData = this._controller?.figureData ?? null;

        if(this._categories === null || figureData === null) return;

        const category = this._categories.getValue(partType);

        if(category === null) return;

        const setId = figureData.getPartSetId(partType);
        const colourIds = figureData.getColourIds(partType) ?? [];

        category.selectPartId(setId);
        category.selectColorIds(colourIds);

        this._view?.showPalettes(partType, colourIds.length);
    }
}
