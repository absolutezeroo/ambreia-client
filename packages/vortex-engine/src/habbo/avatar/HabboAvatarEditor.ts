import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IAvatarImage} from './IAvatarImage';
import type {IAvatarRenderManager} from './IAvatarRenderManager';
import type {IAvatarImageListener} from './IAvatarImageListener';
import type {IFigurePartSet} from './structure/figure/IFigurePartSet';
import type {IPalette} from './structure/figure/IPalette';
import type {ISetType} from './structure/figure/ISetType';
import type {IAvatarEditorSaveListener} from './IAvatarEditorSaveListener';
import type {IAvatarEditorView} from './view/IAvatarEditorView';
import type {ICategoryModel} from './common/ICategoryModel';
import type {ICategoryModelOwner} from './common/ICategoryModelOwner';
import type {IAvatarEditorGridColorItem, IAvatarEditorGridPartItem} from './common/IAvatarEditorGridItem';
import type {IFigureSetOwnership} from './common/IFigureSetOwnership';
import type {ISideContentModel} from './common/ISideContent';
import type {IHabboAvatarEditorHost} from './IHabboAvatarEditorHost';
import {OrderedMap} from '@core/utils/OrderedMap';
import {AvatarEditorIdEnum} from './enum/AvatarEditorIdEnum';
import {AvatarEditorView} from './AvatarEditorView';
import {AvatarUpdateEvent} from './events/AvatarUpdateEvent';
import {CategoryData} from './common/CategoryData';
import {EffectsModel} from './effects/EffectsModel';
import {HotLooksModel} from './hotlooks/HotLooksModel';
import {FigureData} from './figuredata/FigureData';
import {BodyModel} from './generic/BodyModel';
import {HeadModel} from './head/HeadModel';
import {LegsModel} from './legs/LegsModel';
import {MiscModel} from './misc/MiscModel';
import {TorsoModel} from './torso/TorsoModel';
import {WardrobeModel} from './wardrobe/WardrobeModel';
import {
    UpdateFigureDataMessageComposer
} from '@habbo/communication/messages/outgoing/avatar/UpdateFigureDataMessageComposer';

/**
 * One editor instance: two figures (one per gender), the eight category pages, the wardrobe, and
 * the rules deciding what the user may wear.
 *
 * `generateDataContent()` is the heart of it — every page's grid comes from there, filtered by
 * gender, club level and ownership, and sorted. Everything else is bookkeeping around it.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditor.as
 */
export class HabboAvatarEditor implements ICategoryModelOwner
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

    // AS3: .../avatar/HabboAvatarEditor.as::DIMMED_CLUB_LEVEL
    // Name DERIVED: the 2 AS3 substitutes for the real club level when club items are shown
    // dimmed — so the *mandatory-parts* query is answered as if the user were a subscriber.
    private static readonly DIMMED_CLUB_LEVEL: number = 2;

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

    // AS3: .../avatar/HabboAvatarEditor.as::_sideContent
    // Name DERIVED (`_SafeStr_5830`): holds only the wardrobe.
    private _sideContent: OrderedMap<string, ISideContentModel> | null = null;

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

    // AS3: .../avatar/HabboAvatarEditor.as::_sideContentEnabled
    // Name DERIVED (`_SafeStr_8050`): the field behind `isSideContentEnabled()`.
    private _sideContentEnabled: boolean = false;

    // AS3: .../avatar/HabboAvatarEditor.as::_effectChanged
    // Name DERIVED (`_SafeStr_7954`): set by `setAvatarEffectType()`, consumed and cleared by the
    // save — so an effect is only pushed to the inventory when the user actually changed it.
    private _effectChanged: boolean = false;

    // AS3: .../avatar/HabboAvatarEditor.as::_clubMemberLevel
    // Name DERIVED (`_SafeStr_6218`). Zero means "ask the session", not "no club" — see the getter.
    private _clubMemberLevel: number = 0;

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

    // AS3: .../avatar/HabboAvatarEditor.as::get view()
    public get view(): IAvatarEditorView | null
    {
        return this._view;
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

    // AS3: .../avatar/HabboAvatarEditor.as::set clubMemberLevel()
    public set clubMemberLevel(value: number)
    {
        this._clubMemberLevel = value;
    }

    /**
     * A **falsy** stored level defers to the session — so level 0 is indistinguishable from "never
     * set", and setting 0 explicitly does not pin the user to no-club. AS3's; kept.
     */
    // AS3: .../avatar/HabboAvatarEditor.as::get clubMemberLevel()
    public get clubMemberLevel(): number
    {
        if(!this._clubMemberLevel) return this._manager?.sessionData?.clubLevel ?? 0;

        return this._clubMemberLevel;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::get wardrobe()
    // Null until `init()` has run, which is what the `_initialised` guard is for. Typed to the
    // concrete model, as in AS3 — `AvatarEditorMessageHandler` calls `updateSlots()` on it, which
    // `ISideContentModel` does not declare.
    public get wardrobe(): WardrobeModel | null
    {
        if(!this._initialised) return null;

        return (this._sideContent?.getValue('wardrobe') as WardrobeModel | null) ?? null;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::get effects()
    public get effects(): ICategoryModel | null
    {
        if(!this._initialised) return null;

        return this._categories?.getValue('effects') ?? null;
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
        this._sideContentEnabled = sideContentEnabled;

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
        this._sideContentEnabled = sideContentEnabled;

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
    public loadAvatarInEditor(figure: string, gender: string, clubLevel: number = 0): void
    {
        const normalised = gender === 'F' || gender === 'f' ? FigureData.FEMALE : FigureData.MALE;

        this.clubMemberLevel = clubLevel;

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

    // AS3: .../avatar/HabboAvatarEditor.as::getSideContentWindowContainer()
    public getSideContentWindowContainer(name: string): IWindowContainer | null
    {
        return this._sideContent?.getValue(name)?.getWindowContainer() ?? null;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::toggleAvatarEditorPage()
    public toggleAvatarEditorPage(categoryId: string): void
    {
        this._view?.toggleCategoryView(categoryId, false);
    }

    // AS3: .../avatar/HabboAvatarEditor.as::useClubClothing()
    // Both of these are the same call with different names, in AS3 too — neither enables or
    // disables anything, they just redraw.
    public useClubClothing(): void
    {
        if(this._categories === null) return;

        this.update();
    }

    // AS3: .../avatar/HabboAvatarEditor.as::disableClubClothing()
    public disableClubClothing(): void
    {
        if(this._categories === null) return;

        this.update();
    }

    // AS3: .../avatar/HabboAvatarEditor.as::update()
    public update(): void
    {
        for(const category of this._categories?.getValues() ?? []) category?.reset();
        for(const side of this._sideContent?.getValues() ?? []) side?.reset();

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

        if(this._effectChanged)
        {
            const inventory = this._manager?.effectInventory ?? null;

            if(figureData.avatarEffectType !== -1) inventory?.setEffectSelected(figureData.avatarEffectType);
            else inventory?.deselectAllEffects(true);
        }

        this._effectChanged = false;
    }

    /**
     * Builds one part type's whole grid: every wearable thumbnail and **two** identical colour
     * palettes, filtered and sorted.
     *
     * The filters, in the order AS3 applies them:
     *  - a colour must be selectable, and affordable *unless* club items are shown dimmed;
     *  - the "remove item" tile is added only when the part is **not** mandatory for this gender
     *    and club level — you cannot take off something you must wear;
     *  - a part set must be selectable, match the gender (or be unisex), be affordable on the same
     *    dimmed rule, and — if sellable — be owned, unless this is a development editor;
     *  - part sets are walked **backwards**, so the newest come first before sorting.
     *
     * Note the head exception: `hd` neither mirrors its colours into the selection array nor gets
     * the second palette treatment.
     */
    // AS3: .../avatar/HabboAvatarEditor.as::generateDataContent()
    public generateDataContent(model: ICategoryModel, partType: string): CategoryData | null
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
        const showDimmed = this.showClubItemsDimmedConfiguration();

        for(const colour of palette.colors.values())
        {
            if(!colour.isSelectable) continue;
            if(!showDimmed && this.clubMemberLevel < colour.clubLevel) continue;

            for(let layer = 0; layer < HabboAvatarEditor.MAX_COLOR_LAYERS; layer++)
            {
                palettes[layer].push(this.createColorItem(model, colour, this.clubMemberLevel < colour.clubLevel));
            }

            if(partType !== HabboAvatarEditor.HEAD_PART_TYPE)
            {
                for(let index = 0; index < figureColourIds.length; index++)
                {
                    if(colour.id === figureColourIds[index]) selectedColours[index] = colour;
                }
            }
        }

        // With club items dimmed, the mandatory-parts query is answered as if the user were a
        // subscriber — otherwise a dimmed club part could also be un-removable.
        const mandatory = this._manager?.getMandatoryAvatarPartSetIds(
            this.gender, showDimmed ? HabboAvatarEditor.DIMMED_CLUB_LEVEL : this.clubMemberLevel
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
            if(!showDimmed && this.clubMemberLevel < partSet.clubLevel) continue;

            let owned = true;

            if(partSet.isSellable)
            {
                owned = (this.inventory?.hasFigureSetIdInInventory(partSet.id) ?? false) || this.isDevelopmentEditor();
            }

            if(!owned) continue;

            const item = this.createPartItem(
                model, partSet, selectedColours, colourable, this.clubMemberLevel < partSet.clubLevel
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

    // AS3: .../avatar/HabboAvatarEditor.as::isSideContentEnabled()
    public isSideContentEnabled(): boolean
    {
        return this._sideContentEnabled;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::hasInvalidClubItems()
    public hasInvalidClubItems(): boolean
    {
        for(const category of this._categories?.getValues() ?? [])
        {
            if(category !== null && category.hasClubItemsOverLevel(this.clubMemberLevel)) return true;
        }

        return false;
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

    // AS3: .../avatar/HabboAvatarEditor.as::stripClubItems()
    public stripClubItems(): void
    {
        for(const category of this._categories?.getValues() ?? [])
        {
            category?.stripClubItemsOverLevel(this.clubMemberLevel);
        }

        this.figureData?.updateView();
    }

    // AS3: .../avatar/HabboAvatarEditor.as::stripInvalidSellableItems()
    public stripInvalidSellableItems(): void
    {
        for(const category of this._categories?.getValues() ?? []) category?.stripInvalidSellableItems();

        this.figureData?.updateView();
    }

    /**
     * The first selectable colour in the part's palette the user can afford. Note this one respects
     * the club level strictly — the "show dimmed" allowance does not apply here, so a default is
     * always something wearable.
     */
    // AS3: .../avatar/HabboAvatarEditor.as::getDefaultColour()
    public getDefaultColour(partType: string): number
    {
        const setType = this.getFigureSetType(partType);

        if(setType === null) return -1;

        const palette = this.getPalette(setType.paletteID);

        for(const colour of palette?.colors.values() ?? [])
        {
            if(colour.isSelectable && this.clubMemberLevel >= colour.clubLevel) return colour.id;
        }

        return -1;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::verifyClubLevel()
    public verifyClubLevel(): boolean
    {
        return this._manager?.verifyClubLevel() ?? false;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::openHabboClubAdWindow()
    public openHabboClubAdWindow(): void
    {
        this._manager?.openClubCenter();
    }

    // AS3: .../avatar/HabboAvatarEditor.as::setAvatarEffectType()
    // Flags the change so `saveCurrentSelection()` pushes it into the inventory.
    public setAvatarEffectType(effectType: number): void
    {
        const figureData = this.figureData;

        if(figureData === null) return;

        figureData.avatarEffectType = effectType;
        figureData.updateView();
        this._effectChanged = true;
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

        for(const side of this._sideContent?.getValues() ?? []) side?.dispose();

        this._sideContent = null;

        this._view?.dispose();
        this._view = null;
        this._figureStructure = null;
        this._figures = null;
        this._saveListener = null;
        this._manager = null;
    }

    /**
     * Runs once. Builds the wardrobe, then the view, then both gender figures pre-loaded with the
     * defaults, then the seven pages — hot looks only when it is in the requested list, or when
     * there is no list at all.
     *
     * The order matters twice. The view is built **before** the pages, because every page's own
     * view fetches its container from it. And the wardrobe goes in before the view, because the
     * view's constructor calls `update()`, which asks for the side panel.
     */
    // DEVIATION: AS3 also asks for the selected NFT outfit, subscribes to its answer, and adds the
    //   `nfts` page; the RPG fork removed NFT.
    // AS3: .../avatar/HabboAvatarEditor.as::init()
    private init(categories: string[] | null = null): void
    {
        if(this._initialised) return;

        this._categories = new OrderedMap<string, ICategoryModel>();
        this._sideContent = new OrderedMap<string, ISideContentModel>();
        this._sideContent.add('wardrobe', new WardrobeModel(this));

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

        // The one page built conditionally, because its constructor fires a request at the server
        // — an editor restricted to other pages should not ask for hot looks it will never show.
        if(categories === null || categories.indexOf('hotlooks') > -1)
        {
            this._categories.add('hotlooks', new HotLooksModel(this));
        }

        // Added unconditionally, as in AS3 — the *tab* is what `AvatarEditorView` prunes when the
        // configuration is off, not the model.
        this._categories.add('effects', new EffectsModel(this));

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

    // AS3: .../avatar/HabboAvatarEditor.as::showClubItemsFirst
    private get showClubItemsFirst(): boolean
    {
        return this._manager?.getBoolean('avatareditor.show.clubitems.first') ?? false;
    }

    // AS3: .../avatar/HabboAvatarEditor.as::showClubItemsDimmedConfiguration()
    private showClubItemsDimmedConfiguration(): boolean
    {
        return this._manager?.getBoolean('avatareditor.show.clubitems.dimmed') ?? false;
    }

    /**
     * TS-only: stands in for AS3's inline
     * `new AvatarEditorGridPartItem(AvatarEditorView.THUMB_WINDOW.clone(), …)`.
     *
     * Delegated to the manager so this class does not have to import the window layer for the sake
     * of one `clone()`; the manager builds the real, window-backed item.
     */
    private createPartItem(
        model: ICategoryModel,
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
        model: ICategoryModel,
        colour: unknown,
        disabled: boolean
    ): IAvatarEditorGridColorItem | null
    {
        return this._manager?.createGridColorItem(model, colour, disabled) ?? null;
    }

    /**
     * Sellable items always sink to the bottom, whichever direction the club sort runs — that
     * check comes before the club comparison in both comparators. Then club level, then id.
     */
    // AS3: .../avatar/HabboAvatarEditor.as::orderByClubAsc() / orderByClubDesc()
    private sortParts(parts: unknown[]): void
    {
        const descending = this.showClubItemsFirst;

        parts.sort((a, b) =>
        {
            const left = (a as {partSet: IFigurePartSet | null}).partSet;
            const right = (b as {partSet: IFigurePartSet | null}).partSet;

            // A synthetic tile — "remove item" — has no part set, and AS3 reads every field it
            // compares through `?.`: `clubLevel` comes back NaN, so both `<` and `>` are false and
            // the item keeps its inserted position, which for the remove tile is first. (The
            // decompiler shows `?.` on the clubLevel/isSellable reads but a bare `.` on the id
            // read, which would dereference null; the guarded reading is the one that matches the
            // shipped client, where the cross is first.)
            //
            // Treating it as clubLevel 0 / id 0 instead put it *last* whenever
            // `avatareditor.show.clubitems.first` is on and the sort runs descending. Returning 0
            // reproduces AS3: `Array.prototype.sort` is stable, so insertion order survives.
            if(left === null || right === null) return 0;

            if(left?.isSellable === true && right?.isSellable !== true)
            {
                return 1;
            }

            if(right?.isSellable === true && left?.isSellable !== true)
            {
                return -1;
            }

            const leftClub = left?.clubLevel ?? 0;
            const rightClub = right?.clubLevel ?? 0;

            if(leftClub !== rightClub)
            {
                return descending ? rightClub - leftClub : leftClub - rightClub;
            }

            const leftId = left?.id ?? 0;
            const rightId = right?.id ?? 0;

            return descending ? rightId - leftId : leftId - rightId;
        });
    }

    /**
     * Club level then palette index. A colour item with no `partColor` sorts as level −1, i.e.
     * before everything — AS3's null branch, kept.
     */
    // AS3: .../avatar/HabboAvatarEditor.as::orderPaletteByClub()
    private sortPalette(palette: unknown[]): void
    {
        palette.sort((a, b) =>
        {
            const left = (a as {partColor: {clubLevel: number; index: number} | null}).partColor;
            const right = (b as {partColor: {clubLevel: number; index: number} | null}).partColor;

            const leftClub = left === null ? -1 : left.clubLevel;
            const rightClub = right === null ? -1 : right.clubLevel;

            if(leftClub !== rightClub)
            {
                return leftClub - rightClub;
            }

            return (left?.index ?? 0) - (right?.index ?? 0);
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
