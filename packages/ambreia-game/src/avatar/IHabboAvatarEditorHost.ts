import type {EventEmitter} from 'eventemitter3';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {ISessionDataManager} from '../session/ISessionDataManager';
import type {IHabboWindowManager} from '../window/IHabboWindowManager';
import type {IAvatarEffect} from './IAvatarEffect';
import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
import type {IFigurePartSet} from '@ambreia/avatar/structure/figure/IFigurePartSet';
import type {IAvatarEditorGridModel} from './common/IAvatarEditorGridModel';
import type {
    IAvatarEditorGridColorItem,
    IAvatarEditorGridPartItem
} from './common/IAvatarEditorGridItem';
import type {IFigureSetOwnership} from './common/IFigureSetOwnership';
import type {IAvatarEditorMessageHandler} from './IAvatarEditorMessageHandler';

/**
 * Everything one `HabboAvatarEditor` needs from the manager that owns it.
 *
 * TS-only: AS3's editor holds `HabboAvatarEditorManager` directly and reaches through it — often
 * two levels, as in `manager.windowManager.assets.getAssetByName(...)`. Flattened to the members
 * actually used, so the editor can be constructed and tested against a stub;
 * `HabboAvatarEditorManager` implements it.
 *
 * The last two members have no AS3 counterpart as *methods*: AS3 constructs its grid items inline
 * from static window templates. They are delegated here so the view slice can supply real,
 * window-backed items without reopening `HabboAvatarEditor`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditorManager.as
 */
export interface IHabboAvatarEditorHost
{
    // AS3: .../avatar/HabboAvatarEditorManager.as::get events()
    readonly events: EventEmitter;

    // AS3: .../avatar/HabboAvatarEditorManager.as::get avatarRenderManager()
    readonly avatarRenderManager: IAvatarRenderManager | null;

    // AS3: .../avatar/HabboAvatarEditorManager.as::get sessionData()
    readonly sessionData: ISessionDataManager | null;

    /**
     * The window manager, for the two layouts the editor builds (`AvatarEditorContent`,
     * `AvatarEditorFrame`) and the bare container `embedToContext()` falls back on.
     */
    // AS3: .../avatar/HabboAvatarEditorManager.as::get windowManager()
    readonly windowManager: IHabboWindowManager | null;

    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::getProperty()
    // Only one key is read through it: `catalog.clothes.page`.
    getProperty(key: string): string;

    // AS3: .../src/com/sulake/habbo/localization/IHabboLocalizationManager.as::getLocalization()
    // Flattened from `manager.localization.getLocalization(...)`.
    getLocalization(key: string): string;

    // AS3: .../src/com/sulake/habbo/localization/IHabboLocalizationManager.as::registerParameter()
    // The `%name%` substitution the name-change dialog performs before reading a key back.
    registerLocalizationParameter(key: string, parameter: string, value: string): void;

    /**
     * The width of the window layer the editor lives on, so a dialog opened at the editor's right
     * edge can be pushed back on screen. AS3 reads `windowManager.getDesktop(1).width`.
     */
    // AS3: .../src/com/sulake/core/window/ICoreWindowManager.as::getDesktop()
    readonly desktopWidth: number;

    // AS3: .../src/com/sulake/habbo/catalog/IHabboCatalog.as::openCatalogPage()
    // Flattened from `manager.catalog.openCatalogPage(...)`, like `openClubCenter()` above.
    openCatalogPage(pageName: string): void;

    // AS3: .../avatar/HabboAvatarEditorManager.as::close()
    // The save and cancel buttons both end here; what "close" does depends on the editor id.
    close(editorId: number): void;

    // AS3: .../avatar/HabboAvatarEditorManager.as::get handler()
    readonly handler: IAvatarEditorMessageHandler | null;

    // AS3: .../avatar/HabboAvatarEditorManager.as::get communication()
    // Flattened to the connection, which is all the editor uses it for.
    readonly connection: IConnection | null;

    // AS3: .../avatar/HabboAvatarEditorManager.as::get inventory()
    // Narrowed — the editor asks the inventory exactly one question. See `IFigureSetOwnership`.
    readonly inventory: IFigureSetOwnership | null;

    /**
     * AS3: .../avatar/HabboAvatarEditorManager.as::get inventory()
     *
     * The same inventory, for the two effect calls `saveCurrentSelection()` makes. Separate from
     * `inventory` because the two surfaces are unrelated and this one may be absent independently.
     */
    // AS3: .../avatar/HabboAvatarEditorManager.as::get inventory()
    readonly effectInventory: {
        setEffectSelected(effectType: number): void;
        deselectAllEffects(force: boolean): void;
        // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::getAvatarEffects()
        // What the effects page's whole grid comes from — unfiltered and unsorted.
        getAvatarEffects(): IAvatarEffect[];
    } | null;

    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::getBoolean()
    getBoolean(key: string): boolean;

    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::getInteger()
    // One key: `avatareditor.wardrobe.slots`, defaulted to 10.
    getInteger(key: string, defaultValue: number): number;

    // AS3: .../src/com/sulake/habbo/catalog/IHabboCatalog.as::verifyClubLevel()
    verifyClubLevel(): boolean;

    // AS3: .../src/com/sulake/habbo/catalog/IHabboCatalog.as::openClubCenter()
    openClubCenter(): void;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::getMandatoryAvatarPartSetIds()
    getMandatoryAvatarPartSetIds(gender: string, clubLevel: number): string[];

    /**
     * TS-only: AS3 reads these straight off `windowManager.assets`. Flattened because the editor
     * needs exactly two named bitmaps and nothing else from the asset library.
     */
    // TS-only: flattens AS3's `windowManager.assets.getAssetByName(name).content`.
    getAssetBitmap(name: string): ImageBitmap | null;

    /**
     * TS-only: stands in for AS3's inline
     * `new AvatarEditorGridPartItem(AvatarEditorView.THUMB_WINDOW.clone(), …)`.
     *
     * Delegated to the manager rather than inlined in `HabboAvatarEditor` so the editor core does
     * not have to import the window layer for the sake of one `clone()`.
     */
    // TS-only: stands in for AS3's inline `new AvatarEditorGridPartItem(...)`.
    createGridPartItem(
        model: IAvatarEditorGridModel,
        partSet: IFigurePartSet | null,
        colours: unknown[] | null,
        colourable: boolean,
        disabled: boolean
    ): IAvatarEditorGridPartItem | null;

    // TS-only: the colour equivalent, standing in for
    // `new AvatarEditorGridColorItem(AvatarEditorView.COLOUR_WINDOW.clone(), …)`.
    createGridColorItem(
        model: IAvatarEditorGridModel,
        colour: unknown,
        disabled: boolean
    ): IAvatarEditorGridColorItem | null;
}
