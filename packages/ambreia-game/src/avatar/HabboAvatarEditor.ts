import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IAvatarImage} from '@ambreia/avatar/IAvatarImage';
import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
import type {IAvatarImageListener} from '@ambreia/avatar/IAvatarImageListener';
import type {IFigurePartSet} from '@ambreia/avatar/structure/figure/IFigurePartSet';
import type {IPalette} from '@ambreia/avatar/structure/figure/IPalette';
import type {ISetType} from '@ambreia/avatar/structure/figure/ISetType';
import type {IAvatarEditorSaveListener} from './IAvatarEditorSaveListener';
import type {IAvatarEditorView} from './view/IAvatarEditorView';
import type {IAvatarEditorViewHost} from './view/IAvatarEditorViewHost';
import type {IFigureDataOwner} from './figuredata/IFigureDataOwner';
import type {ICategoryModel} from './common/ICategoryModel';
import type {IAvatarEditorGridModel} from './common/IAvatarEditorGridModel';
import type {ICategoryModelOwner} from './common/ICategoryModelOwner';
import type {IAvatarEditorGridColorItem, IAvatarEditorGridPartItem} from './common/IAvatarEditorGridItem';
import type {IFigureSetOwnership} from './common/IFigureSetOwnership';
import type {IHabboAvatarEditorHost} from './IHabboAvatarEditorHost';
import {OrderedMap} from '@ambreia/common/utils/OrderedMap';
import {AvatarEditorIdEnum} from './enum/AvatarEditorIdEnum';
import {AvatarEditorView} from './AvatarEditorView';
import {AvatarUpdateEvent} from './events/AvatarUpdateEvent';
import {CategoryData} from './common/CategoryData';
import {FigureData} from './figuredata/FigureData';
import {BodyModel} from './generic/BodyModel';
import {HeadModel} from './head/HeadModel';
import {LegsModel} from './legs/LegsModel';
import {MiscModel} from './misc/MiscModel';
import {TorsoModel} from './torso/TorsoModel';
import {
    UpdateFigureDataMessageComposer
} from '@ambreia/protocol/outgoing/avatar/UpdateFigureDataMessageComposer';

/**
 * One editor instance: two figures (one per gender) and the avatar appearance category pages.
 *
 * `generateDataContent()` is the heart of it — every page's grid comes from there, filtered by gender and ownership, and sorted. Everything else is bookkeeping around it.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditor.as
 */
export class HabboAvatarEditor implements ICategoryModelOwner, IFigureDataOwner, IAvatarEditorViewHost
{
    // AS3: .../avatar/HabboAvatarEditor.as::DEFAULT_MALE_FIGURE
    public static readonly DEFAULT_MALE_FIGURE: string =
        'hr-100.hd-180-7.ch-215-66.lg-270-79.sh-305-62.ha-1002-70.wa-2007';

    // AS3: .../avatar/HabboAvatarEditor.as::DEFAULT_FEMALE_FIGURE
    public static readonly DEFAULT_FEMALE_FIGURE: string =
        'hr-515-33.hd-600-1.ch-635-70.lg-716-66-62.sh-735-68';

    // AS3: .../avatar/HabboAvatarEditor.as::MAX_COLOR_LAYERS
    // Two dye layers — the reason every palette is built twice. See `CategoryData`.
    private static readonly MAX_COLOR_LAYERS: number = 2;

    /** Historical figure data still carries a `club` access tier; RPG characters can use all authored parts. */
    private static readonly FIGURE_ACCESS_LEVEL: number = Number.MAX_SAFE_INTEGER;

    // AS3: .../avatar/HabboAvatarEditor.as::HEAD_PART_TYPE
    // Name DERIVED: the "hd" AS3 compares against twice in `generateDataContent()` — the head is
    // the one part whose colour is not mirrored into the selection and which never shows the
    // second palette.
    private static readonly HEAD_PART_TYPE: string = 'hd';

    // AS3: .../avatar/HabboAvatarEditor.as::UNISEX_GENDER
    private static readonly UNISEX_GENDER: string = 'U';

    // AS3: .../avatar/HabboAvatarEditor.as::_instanceId
    // Name DERIVED (`_SafeStr_8786`): the field behind `get instanceId()`.
    private _instanceId: number;

    // AS3: .../avatar/HabboAvatarEditor.as::_manager
    // Name DERIVED (`_SafeStr_4571`): the field behind `get manager()`.
    private _manager: IHabboAvatarEditorHost | null;

    // AS3: .../avatar/HabboAvatarEditor.as::_figureStructure
    // Name DERIVED (`_SafeStr_6361`): the *renderer's* figure data, taken once in the constructor.
    private _figureStructure: {
        getSetType(type: string): ISetType | null;
        getPalette(id: number): IPalette | null;
    } | null;

    // AS3: .../avatar/HabboAvatarEditor.as::_view
    private _view: IAvatarEditorView | null = null;

    // AS3: .../avatar/HabboAvatarEditor.as::_initialised
    // Name DERIVED (`_SafeStr_4755`).
    private _initialised: boolean = false;

    // AS3: .../avatar/HabboAvatarEditor.as::_categories
    private _categories: OrderedMap<string, ICategoryModel> | null = null;

    // AS3: .../avatar/HabboAvatarEditor.as::_figures
    // **One figure per gender**, so switching sex restores what you last built for it rather than
    // converting the current outfit.
    private _figures: Map<string, FigureData> | null = null;

    // AS3: .../avatar/HabboAvatarEditor.as::_gender
    // Name DERIVED (`_SafeStr_4645`).
    private _gender: string = FigureData.MALE;

    // AS3: .../avatar/HabboAvatarEditor.as::_figureString
    private _figureString: string = '';

    // AS3: .../avatar/HabboAvatarEditor.as::_saveListener
    // Name DERIVED (`_SafeStr_6308`): non-null diverts the save away from the server.
    private _saveListener: IAvatarEditorSaveListener | null = null;

    // AS3: .../avatar/HabboAvatarEditor.as::_isDevelopmentEditor
    // Name DERIVED (`_SafeStr_9131`): the constructor flag, distinct from `isDevelopmentEditor()`
    // which tests the *id*. Only `generateDataContent()` reads it, to force the "get more" tile on.
    private _isDevelopmentEditor: boolean = false;

    // AS3: .../avatar/HabboAvatarEditor.as::HabboAvatarEditor()
    constructor(instanceId: number, manager: IHabboAvatarEditorHost, isDevelopmentEditor: boolean = false)
    {
        this._instanceId = instanceId;
        this._manager = manager;
        this._figureStructure = manager.avatarRenderManager?.getFigureData() ?? null;
        this._isDevelopmentEditor = isDevelopmentEditor;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::get instanceId()
    public get instanceId(): number
    {
        return this._instanceId;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::get manager()
    public get manager(): IHabboAvatarEditorHost | null
    {
        return this._manager;
    }

    public get windowManager(): IHabboAvatarEditorHost['windowManager']
    {
        return this._manager?.windowManager ?? null;
    }

    public get connection(): IHabboAvatarEditorHost['connection']
    {
        return this._manager?.connection ?? null;
    }

    public get sessionData(): IHabboAvatarEditorHost['sessionData']
    {
        return this._manager?.sessionData ?? null;
    }

    public getProperty(key: string): string
    {
        return this._manager?.getProperty(key) ?? '';
    }

    public getBoolean(key: string): boolean
    {
        return this._manager?.getBoolean(key) ?? false;
    }

    public openCatalogPage(pageName: string): void
    {
        this._manager?.openCatalogPage(pageName);
    }

    // AS3: .../avatar/HabboAvatarEditor.as::get view()
    public get view(): IAvatarEditorView | null
    {
        return this._view;
    }

    public getFigureContainer()
    {
        return this._view?.getFigureContainer() ?? null;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::get figureData()
    // Which of the two figures this returns follows `_gender`, so the whole editor swaps model
    // when the user switches sex.
    public get figureData(): FigureData | null
    {
        return this._figures?.get(this._gender) ?? null;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::get handler()
    public get handler(): IHabboAvatarEditorHost['handler'] | null
    {
        return this._manager?.handler ?? null;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::get inventory()
    // TS-only shape: `ICategoryModelOwner` wants this flat, AS3 reaches it as `manager.inventory`.
    public get inventory(): IFigureSetOwnership | null
    {
        return this._manager?.inventory ?? null;
    }

    // AS3: .../avatar/HabboAvatarEditorManager.as::get avatarRenderManager()
    // TS-only shape: `ICategoryModelOwner` wants this flat; AS3's grid items reach it as
    // `controller.manager.avatarRenderManager`.
    public get avatarRenderManager(): IAvatarRenderManager | null
    {
        return this._manager?.avatarRenderManager ?? null;
    }

    // TS-only: flattens AS3's `manager.windowManager.assets.getAssetByName(name).content`.
    public getAssetBitmap(name: string): ImageBitmap | null
    {
        return this._manager?.getAssetBitmap(name) ?? null;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::get gender()
    public get gender(): string
    {
        return this._gender;
    }

    /**
     * Resets every category so each re-filters its grid for the new gender, then redraws. A
     * no-change assignment returns early, so this is safe to call unconditionally.
     */
    // AS3: .../avatar/HabboAvatarEditor.as::set gender()
    public set gender(value: string)
    {
        if(this._gender === value) return;

        this._gender = value;

        for(const category of this._categories?.getValues() ?? []) category?.reset();

        this._view?.update();
    }

    // AS3: .../avatar/HabboAvatarEditor.as::openWindow()
    public openWindow(
        saveListener: IAvatarEditorSaveListener | null,
        categories: string[] | null = null,
        sideContentEnabled: boolean = false,
        title: string | null = null,
        defaultCategory: string = 'generic'
    ): IWindowContainer | null
    {
        this._saveListener = saveListener;
        void sideContentEnabled;

        this.init(categories);
        this.selectDefaultCategory(categories, defaultCategory);

        return this._view?.getFrame(categories, title) ?? null;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::embedToContext()
    public embedToContext(
        context: IWindowContainer | null = null,
        saveListener: IAvatarEditorSaveListener | null = null,
        categories: string[] | null = null,
        sideContentEnabled: boolean = false
    ): boolean
    {
        this._saveListener = saveListener;
        void sideContentEnabled;

        this.init(categories);
        this._view?.embedToContext(context, categories);
        this.selectDefaultCategory(categories);

        return true;
    }

    /**
     * Normalises the gender to `M`/`F` — anything unrecognised becomes male — then loads the
     * figure into *that gender's* model. The categories are reset only when the gender or the
     * figure actually changed.
     */
    // AS3: .../avatar/HabboAvatarEditor.as::loadAvatarInEditor()
    public loadAvatarInEditor(figure: string, gender: string): void
    {
        const normalised = gender === 'F' || gender === 'f' ? FigureData.FEMALE : FigureData.MALE;

        const figureData = this._figures?.get(normalised) ?? null;

        if(figureData === null) return;

        figureData.loadAvatarData(figure, normalised);

        let changed = false;

        if(normalised !== this.gender)
        {
            this.gender = normalised;
            changed = true;
        }

        if(this._figureString !== figure)
        {
            this._figureString = figure;
            changed = true;
        }

        if(this._categories !== null && changed)
        {
            for(const category of this._categories.getValues()) category?.reset();
        }

        this._view?.update();
    }

    /**
     * TS-only shape: `ICategoryModelOwner` wants this flat; AS3's `BodyModel` reaches it as
     * `controller.manager.avatarRenderManager.createAvatarImage(...)`.
     */
    // AS3: .../avatar/_SafeCls_581.as::createAvatarImage()
    public createAvatarImage(
        figureString: string,
        scale: string,
        gender: string | null,
        listener: IAvatarImageListener | null,
        effectListener?: unknown
    ): IAvatarImage | null
    {
        return this._manager?.avatarRenderManager?.createAvatarImage(
            figureString, scale, gender, listener, (effectListener ?? null) as never
        ) ?? null;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::getFigureSetType()
    public getFigureSetType(partType: string): ISetType | null
    {
        return this._figureStructure?.getSetType(partType) ?? null;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::getPalette()
    public getPalette(paletteId: number): IPalette | null
    {
        return this._figureStructure?.getPalette(paletteId) ?? null;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::hide()
    public hide(): void
    {
        this._view?.hide();
    }

    // AS3: .../avatar/HabboAvatarEditor.as::getCategoryWindowContainer()
    public getCategoryWindowContainer(categoryId: string): IWindow | null
    {
        return this._categories?.getValue(categoryId)?.getWindowContainer() ?? null;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::activateCategory()
    public activateCategory(categoryId: string): void
    {
        this._categories?.getValue(categoryId)?.switchCategory();
    }

    // AS3: .../avatar/HabboAvatarEditor.as::toggleAvatarEditorPage()
    public toggleAvatarEditorPage(categoryId: string): void
    {
        this._view?.toggleCategoryView(categoryId, false);
    }

    // AS3: .../avatar/HabboAvatarEditor.as::update()
    public update(): void
    {
        for(const category of this._categories?.getValues() ?? []) category?.reset();
        this._view?.update();
    }

    /**
     * Two destinations, in order of precedence. A save listener takes the figure and **nothing
     * else happens** — no server message, no event, no effect change. Otherwise the figure goes to
     * the server, the update event is raised, and a changed effect is pushed into the inventory.
     */
    // DEVIATION: AS3 saves a staged NFT outfit by token id instead of the figure, and takes a worn
    //   NFT off on a plain save; the RPG fork removed NFT, so the figure is always what is sent.
    // AS3: .../avatar/HabboAvatarEditor.as::saveCurrentSelection()
    public saveCurrentSelection(): void
    {
        const figureData = this.figureData;

        if(figureData === null) return;

        const figure = figureData.getFigureString();
        const gender = figureData.gender;

        if(this._saveListener !== null)
        {
            this._saveListener.saveFigure(figure, gender);

            return;
        }

        this._manager?.connection?.send(new UpdateFigureDataMessageComposer(figure, gender));

        this._manager?.events?.emit(AvatarUpdateEvent.AVATAR_FIGURE_UPDATED, new AvatarUpdateEvent(figure));
    }

    /**
     * Builds one part type's appearance grid.
     *
     * - colours must be selectable;
     * - mandatory parts omit the synthetic remove tile;
     * - part sets must be selectable and match the character gender (or be unisex);
     * - sellable appearance parts are kept only when owned, except in the development editor.
     *
     * Historical figure assets still expose an access-tier integer. Ambreia passes an unrestricted
     * value to the renderer so that metadata no longer gates RPG appearance choices.
     */
    // AS3: .../avatar/HabboAvatarEditor.as::generateDataContent()
    public generateDataContent(model: IAvatarEditorGridModel, partType: string): CategoryData | null
    {
        if(model === null || partType === '') return null;

        const setType = this.getFigureSetType(partType);

        if(setType === null) return null;

        const palette = this.getPalette(setType.paletteID);

        if(palette === null) return null;

        const parts: unknown[] = [];
        const palettes: unknown[][] = [];

        for(let layer = 0; layer < HabboAvatarEditor.MAX_COLOR_LAYERS; layer++) palettes.push([]);

        const figureColourIds = this.figureData?.getColourIds(partType) ?? [];
        const selectedColours = new Array<unknown>(figureColourIds.length);

        for(const colour of palette.colors.values())
        {
            if(!colour.isSelectable) continue;

            for(let layer = 0; layer < HabboAvatarEditor.MAX_COLOR_LAYERS; layer++)
            {
                palettes[layer].push(this.createColorItem(model, colour, false));
            }

            if(partType !== HabboAvatarEditor.HEAD_PART_TYPE)
            {
                for(let index = 0; index < figureColourIds.length; index++)
                {
                    if(colour.id === figureColourIds[index]) selectedColours[index] = colour;
                }
            }
        }

        const mandatory = this._manager?.getMandatoryAvatarPartSetIds(
            this.gender, HabboAvatarEditor.FIGURE_ACCESS_LEVEL
        ) ?? [];

        if(mandatory.indexOf(partType) === -1)
        {
            const remove = this.createPartItem(model, null, null, false, false);

            if(remove !== null)
            {
                remove.iconImage = this._manager?.getAssetBitmap('avatar_editor_generic_remove_selection') ?? null;
                parts.push(remove);
            }
        }

        const colourable = partType !== HabboAvatarEditor.HEAD_PART_TYPE;

        // AS3 walks the part sets **backwards** by index over an ordered map, so the newest come
        // first before sorting. A JS `Map` preserves insertion order, so reversing its values is
        // the same traversal.
        for(const partSet of [...setType.partSets.values()].reverse())
        {
            if(partSet === null) continue;

            const genderMatches = partSet.gender === HabboAvatarEditor.UNISEX_GENDER || partSet.gender === this.gender;

            if(!partSet.isSelectable || !genderMatches) continue;

            let owned = true;

            if(partSet.isSellable)
            {
                owned = (this.inventory?.hasFigureSetIdInInventory(partSet.id) ?? false) || this.isDevelopmentEditor();
            }

            if(!owned) continue;

            const item = this.createPartItem(
                model, partSet, selectedColours, colourable, false
            );

            if(item !== null) parts.push(item);
        }

        this.sortParts(parts);

        if(this._isDevelopmentEditor || (this._manager?.getBoolean('avatareditor.support.sellablefurni') ?? false))
        {
            const more = this.createPartItem(model, null, null, false, false);

            if(more !== null)
            {
                more.iconImage = this._manager?.getAssetBitmap('camera_zoom_in') ?? null;
                parts.push(more);
            }
        }

        for(const layer of palettes) this.sortPalette(layer);

        return new CategoryData(parts as never[], palettes as never[][]);
    }

    // AS3: .../avatar/HabboAvatarEditor.as::hasInvalidSellableItems()
    public hasInvalidSellableItems(): boolean
    {
        for(const category of this._categories?.getValues() ?? [])
        {
            if(category !== null && category.hasInvalidSellableItems(this.inventory)) return true;
        }

        return false;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::stripInvalidSellableItems()
    public stripInvalidSellableItems(): void
    {
        for(const category of this._categories?.getValues() ?? []) category?.stripInvalidSellableItems();

        this.figureData?.updateView();
    }

    /**
     * The first selectable colour in the part's palette.
     */
    // AS3: .../avatar/HabboAvatarEditor.as::getDefaultColour()
    public getDefaultColour(partType: string): number
    {
        const setType = this.getFigureSetType(partType);

        if(setType === null) return -1;

        const palette = this.getPalette(setType.paletteID);

        for(const colour of palette?.colors.values() ?? [])
        {
            if(colour.isSelectable) return colour.id;
        }

        return -1;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::isDevelopmentEditor()
    // Tests the **id**, not the constructor flag — the two are different things. See `_isDevelopmentEditor`.
    public isDevelopmentEditor(): boolean
    {
        return this._instanceId === AvatarEditorIdEnum.DEV_TOOL_EDITOR;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::dispose()
    public dispose(): void
    {
        for(const category of this._categories?.getValues() ?? []) category?.dispose();

        this._categories = null;

        this._view?.dispose();
        this._view = null;
        this._figureStructure = null;
        this._figures = null;
        this._saveListener = null;
        this._manager = null;
    }

    /**
     * Runs once. Builds the view, both gender figures pre-loaded with defaults, then the remaining
     * RPG appearance categories.
     *
     * The view is built before the category models because each category view resolves its
     * container through the shared editor view.
     */
    // DEVIATION: AS3 also asks for the selected NFT outfit, subscribes to its answer, and adds the
    //   `nfts` page; the RPG fork removed NFT.
    // AS3: .../avatar/HabboAvatarEditor.as::init()
    private init(categories: string[] | null = null): void
    {
        if(this._initialised) return;

        this._categories = new OrderedMap<string, ICategoryModel>();
        // Built **before** the figures and the pages, as in AS3 — its constructor calls `update()`,
        // which walks an empty category map and returns on an empty `currentViewId`, so nothing it
        // touches exists yet on purpose.
        this._view = new AvatarEditorView(this, categories);

        this._figures = new Map<string, FigureData>();
        this._figures.set(FigureData.MALE, new FigureData(this, null));
        this._figures.set(FigureData.FEMALE, new FigureData(this, null));
        this._figures.get(FigureData.MALE)?.loadAvatarData(HabboAvatarEditor.DEFAULT_MALE_FIGURE, FigureData.MALE);
        this._figures.get(FigureData.FEMALE)?.loadAvatarData(HabboAvatarEditor.DEFAULT_FEMALE_FIGURE, FigureData.FEMALE);

        this._categories.add('generic', new BodyModel(this));
        this._categories.add('head', new HeadModel(this));
        this._categories.add('torso', new TorsoModel(this));
        this._categories.add('legs', new LegsModel(this));
        this._categories.add('misc', new MiscModel(this));

        // Added unconditionally, as in AS3 — the *tab* is what `AvatarEditorView` prunes when the
        // configuration is off, not the model.

        this._initialised = true;
    }

    /**
     * Opens the requested page if it is allowed, otherwise the first allowed one, otherwise
     * `generic`.
     */
    // AS3: .../avatar/HabboAvatarEditor.as::selectDefaultCategory()
    private selectDefaultCategory(categories: string[] | null, defaultCategory: string = 'generic'): void
    {
        const restricted = categories !== null && categories.length > 0;

        if(defaultCategory !== '' && (!restricted || categories.indexOf(defaultCategory) >= 0))
        {
            this.toggleAvatarEditorPage(defaultCategory);
        }
        else if(restricted)
        {
            this.toggleAvatarEditorPage(categories[0]);
        }
        else
        {
            this.toggleAvatarEditorPage('generic');
        }
    }

    /**
     * TS-only: stands in for AS3's inline grid-part construction while keeping the
     * editor core independent from the concrete window layer.
     */
    private createPartItem(
        model: IAvatarEditorGridModel,
        partSet: IFigurePartSet | null,
        colours: unknown[] | null,
        colourable: boolean,
        disabled: boolean
    ): IAvatarEditorGridPartItem | null
    {
        return this._manager?.createGridPartItem(model, partSet, colours, colourable, disabled) ?? null;
    }

    // TS-only: the colour half of `createPartItem()` — same reasoning.
    private createColorItem(
        model: IAvatarEditorGridModel,
        colour: unknown,
        disabled: boolean
    ): IAvatarEditorGridColorItem | null
    {
        return this._manager?.createGridColorItem(model, colour, disabled) ?? null;
    }

    /**
     * Keep sellable catalogue-backed appearance items after normal appearance pieces, then use the
     * figure-set id as a deterministic order. Legacy HC/Club metadata no longer influences the UI.
     */
    private sortParts(parts: unknown[]): void
    {
        parts.sort((a, b) =>
        {
            const left = (a as {partSet: IFigurePartSet | null}).partSet;
            const right = (b as {partSet: IFigurePartSet | null}).partSet;

            // Synthetic tiles (remove/more) keep their insertion position.
            if(left === null || right === null) return 0;

            if(left.isSellable === true && right.isSellable !== true) return 1;
            if(right.isSellable === true && left.isSellable !== true) return -1;

            return left.id - right.id;
        });
    }

    /**
     * Palette order follows the asset index only. The historical Club access tier remains readable
     * in figure assets for format compatibility, but has no product behaviour in Ambreia.
     */
    private sortPalette(palette: unknown[]): void
    {
        palette.sort((a, b) =>
        {
            const left = (a as {partColor: {index: number} | null}).partColor;
            const right = (b as {partColor: {index: number} | null}).partColor;

            return (left?.index ?? -1) - (right?.index ?? -1);
        });
    }

    // TS-only: keeps the unused-but-declared AS3 members referenced.
    private get unused(): unknown
    {
        void this._figureString;

        return null;
    }
}

// TS-only: `IAvatarImage` and `IAvatarImageListener` are re-exported nowhere; referenced here so
// the ICategoryModelOwner contract stays checkable.
export type {IAvatarImage, IAvatarImageListener};
