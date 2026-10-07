import type {IAvatarImage} from '@ambreia/avatar/IAvatarImage';
import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
import type {IAvatarImageListener} from '@ambreia/avatar/IAvatarImageListener';
import type {FigureData} from '../figuredata/FigureData';
import type {IAvatarEditorView} from '../view/IAvatarEditorView';
import type {IHabboAvatarEditorHost} from '../IHabboAvatarEditorHost';
import type {CategoryData} from './CategoryData';
import type {ICategoryModel} from './ICategoryModel';
import type {IFigureSetOwnership} from './IFigureSetOwnership';

/**
 * The editor surface a category page uses.
 *
 * TS-only: AS3's `CategoryBaseModel` holds a whole `HabboAvatarEditor` and reaches through it for
 * six things — the figure being edited, the grid content for a part type, the club advert, the
 * inventory and (from `BodyModel` alone) the avatar renderer. Narrowed to exactly those, the same
 * technique slices 2 and 3 used, so the eight category models port and verify before
 * `HabboAvatarEditor` exists. It will satisfy this interface as written, apart from the two
 * members reached via `manager` — see `inventory` and `createAvatarImage` below.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditor.as
 */
export interface ICategoryModelOwner
{
    /**
     * The figure currently being edited. Read for the part/colour selection a category restores
     * itself from, and written when the user picks something.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditor.as::get figureData()
    readonly figureData: FigureData | null;

    /**
     * The editor's window. Every `CategoryBaseView` reaches through it twice — for its own page
     * container (`getCategoryContainer()`) and for the one shared grid (`gridView`).
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditor.as::get view()
    readonly view: IAvatarEditorView | null;

    /**
     * The manager, for the two things a page's view asks of it: the clothes catalogue page id and
     * the call that opens it. Reached as `controller.manager.…` in AS3.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditor.as::get manager()
    readonly manager: IHabboAvatarEditorHost | null;

    /**
     * Read *and written* — `BodyView`'s two gender tabs assign it, which resets every page and
     * swaps the figure model underneath the whole editor.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditor.as::get gender()
    gender: string;

    /**
     * Builds a part type's whole grid — every wearable thumbnail and both colour palettes,
     * filtered by gender, club level and ownership, and sorted.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditor.as::generateDataContent()
    generateDataContent(model: ICategoryModel, partType: string): CategoryData | null;

    /**
     * Opens the club advert. A category calls this instead of applying the choice when the user
     * clicks a dimmed club item.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditor.as::openHabboClubAdWindow()
    openHabboClubAdWindow(): void;

    /**
     * Applies an effect to the edited figure and flags it so the save pushes it into the
     * inventory. `EffectsModel` is the only caller; −1 means "wear nothing".
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditor.as::setAvatarEffectType()
    setAvatarEffectType(effectType: number): void;

    /**
     * The club level the *editor* is working with, which is not always the session's — see
     * `HabboAvatarEditor.get clubMemberLevel()`. The two outfit pages pass it straight back into
     * `loadAvatarInEditor()`.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditor.as::get clubMemberLevel()
    readonly clubMemberLevel: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditor.as::loadAvatarInEditor()
    // How the hot-looks page actually wears what you clicked.
    loadAvatarInEditor(figure: string, gender: string, clubLevel?: number): void;

    /**
     * Whether the user owns a given sellable figure set.
     *
     * AS3 reaches this as `controller.manager.inventory`; flattened here because the manager is
     * not otherwise needed. See `IFigureSetOwnership` for why it may be null in this port.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditorManager.as::get inventory()
    readonly inventory: IFigureSetOwnership | null;

    /**
     * Renders a figure so a thumbnail can show it. Only `BodyModel` uses this, to draw each
     * candidate face on the user's own colours.
     *
     * AS3 reaches it as `controller.manager.avatarRenderManager.createAvatarImage(...)`; flattened
     * for the same reason as `inventory`.
     */
    /**
     * The renderer, for the grid items — `AvatarEditorGridPartItem` composites a thumbnail out of
     * its sprites. AS3 reaches it as `controller.manager.avatarRenderManager`.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditorManager.as::get avatarRenderManager()
    readonly avatarRenderManager: IAvatarRenderManager | null;

    /**
     * A named bitmap from the window manager's library — the colour chip, the download icon.
     * AS3 reaches it as `controller.manager.windowManager.assets.getAssetByName(...)`.
     */
    // TS-only: flattens that two-level reach; see `IHabboAvatarEditorHost.getAssetBitmap()`.
    getAssetBitmap(name: string): ImageBitmap | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/_SafeCls_581.as::createAvatarImage()
    // The port's IAvatarRenderManager takes a fifth `effectListener` argument that AS3's
    // four-argument call site leaves off; kept optional here so `HabboAvatarEditorManager` can
    // forward straight through.
    createAvatarImage(
        figureString: string,
        scale: string,
        gender: string | null,
        listener: IAvatarImageListener | null,
        effectListener?: unknown
    ): IAvatarImage | null;
}
