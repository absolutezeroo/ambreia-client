/* eslint-disable @typescript-eslint/no-explicit-any -- Component.dependencies is declared Array<ComponentDependency<any>>; matching it keeps the typed IID setters. */
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {IContext} from '@core/runtime';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {ILinkEventTracker} from '@core/runtime/events/ILinkEventTracker';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
import type {IAvatarEditorSaveListener} from './IAvatarEditorSaveListener';
import type {IFigurePartSet} from '@ambreia/avatar/structure/figure/IFigurePartSet';
import type {IPartColor} from '@ambreia/avatar/structure/figure/IPartColor';
import type {ICategoryModel} from './common/ICategoryModel';
import type {IFigureSetOwnership} from './common/IFigureSetOwnership';
import type {IHabboAvatarEditor} from './IHabboAvatarEditor';
import type {IHabboAvatarEditorHost} from './IHabboAvatarEditorHost';
import type {IAvatarEditorMessageHandler} from './IAvatarEditorMessageHandler';
import {Component, ComponentDependency} from '@core/runtime';
import {Logger} from '@ambreia/common/utils/Logger';
import {OrderedMap} from '@ambreia/common/utils/OrderedMap';
import {IID_AvatarRenderManager} from '@iid/IIDAvatarRenderManager';
import {IID_HabboCommunicationManager} from '@iid/IIDHabboCommunicationManager';
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_SessionDataManager} from '@iid/IIDSessionDataManager';
import {IID_RoomSessionManager} from '@iid/IIDRoomSessionManager';
import type {IRoomSessionManager} from '@habbo/session/IRoomSessionManager';
import {IID_RoomEngine} from '@iid/IIDRoomEngine';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import {AvatarEditorIdEnum} from './enum/AvatarEditorIdEnum';
import {AvatarEditorEvent} from './enum/AvatarEditorEvent';
import {AvatarEditorMessageHandler} from './AvatarEditorMessageHandler';
import {AvatarEditorView} from './AvatarEditorView';
import {HabboAvatarEditor} from './HabboAvatarEditor';
import {AvatarEditorGridPartItem} from './common/AvatarEditorGridPartItem';
import {AvatarEditorGridColorItem} from './common/AvatarEditorGridColorItem';

const log = Logger.getLogger('habbo.avatar.HabboAvatarEditorManager');

/**
 * The avatar editor as a DI component: one `HabboAvatarEditor` per id, the shared network handler,
 * and the `avatareditor/` link route.
 *
 * This is what `IID_HabboAvatarEditor` resolves to.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/HabboAvatarEditorManager.as
 */
export class HabboAvatarEditorManager extends Component
    implements IHabboAvatarEditor, IHabboAvatarEditorHost, ILinkEventTracker
{
    // AS3: .../avatar/HabboAvatarEditorManager.as::AVATAR_EDITOR_READY
    // Name DERIVED: the event type AS3 raises once the renderer reports ready.
    public static readonly AVATAR_EDITOR_READY: string = AvatarEditorEvent.AVATAR_EDITOR_READY;

    // AS3: .../avatar/HabboAvatarEditorManager.as::LINK_PATTERN
    private static readonly LINK_PATTERN: string = 'avatareditor/';

    // AS3: .../avatar/HabboAvatarEditorManager.as::GENERIC
    private static readonly GENERIC: string = 'generic';

    // AS3: .../avatar/HabboAvatarEditorManager.as::_avatarRenderManager
    private _avatarRenderManager: IAvatarRenderManager | null = null;

    // AS3: .../avatar/HabboAvatarEditorManager.as::get roomDesktop()
    // The two together stand in for AS3's `_roomUI.desktop` — see the dependency's own note.
    private _roomSessionManager: IRoomSessionManager | null = null;
    private _roomEngine: IRoomEngine | null = null;

    // AS3: .../avatar/HabboAvatarEditorManager.as::_communication
    private _communication: IHabboCommunicationManager | null = null;

    // AS3: .../avatar/HabboAvatarEditorManager.as::_sessionData
    private _sessionData: ISessionDataManager | null = null;

    // AS3: .../avatar/HabboAvatarEditorManager.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;

    // AS3: .../avatar/HabboAvatarEditorManager.as::_handler
    // Name DERIVED (`_SafeStr_4574`).
    private _handler: IAvatarEditorMessageHandler | null = null;

    // AS3: .../avatar/HabboAvatarEditorManager.as::_editors
    private _editors: OrderedMap<number, HabboAvatarEditor> | null =
        new OrderedMap<number, HabboAvatarEditor>();

    // AS3: .../avatar/HabboAvatarEditorManager.as::HabboAvatarEditorManager()
    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null)
    {
        super(context, flags, assetLibrary);
    }

    // AS3: .../avatar/HabboAvatarEditorManager.as::get avatarRenderManager()
    public get avatarRenderManager(): IAvatarRenderManager | null
    {
        return this._avatarRenderManager;
    }

    // AS3: .../avatar/HabboAvatarEditorManager.as::get sessionData()
    public get sessionData(): ISessionDataManager | null
    {
        return this._sessionData;
    }

    // AS3: .../avatar/HabboAvatarEditorManager.as::get windowManager()
    public get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    // DEVIATION: AS3 opens the catalog page; the catalog left with the core cut (2026-10-07), so
    //   the editor's "buy" links do nothing until a shop exists again.
    // AS3: .../src/com/sulake/habbo/catalog/IHabboCatalog.as::openCatalogPage()
    public openCatalogPage(_pageName: string): void
    {
    }

    // AS3: .../src/com/sulake/habbo/localization/IHabboLocalizationManager.as::getLocalization()
    // Reached through the window manager rather than through a dependency of its own — it is the
    // only localisation the editor needs, and the window manager already holds one.
    public getLocalization(key: string): string
    {
        return this._windowManager?.localization?.getLocalization(key, key) ?? key;
    }

    // AS3: .../src/com/sulake/habbo/localization/IHabboLocalizationManager.as::registerParameter()
    public registerLocalizationParameter(key: string, parameter: string, value: string): void
    {
        this._windowManager?.registerLocalizationParameter(key, parameter, value);
    }

    // AS3: .../src/com/sulake/core/window/ICoreWindowManager.as::getDesktop()
    // AS3 reads `windowManager.getDesktop(1).width` inline; flattened because the editor wants the
    // number and nothing else from the desktop.
    public get desktopWidth(): number
    {
        return this._windowManager?.getDesktop(1)?.width ?? 0;
    }

    // AS3: .../avatar/HabboAvatarEditorManager.as::get handler()
    public get handler(): IAvatarEditorMessageHandler | null
    {
        return this._handler;
    }

    // AS3: .../avatar/HabboAvatarEditorManager.as::get communication()
    // Flattened to the connection — see `IHabboAvatarEditorHost`.
    public get connection(): IConnection | null
    {
        return this._communication?.connection ?? null;
    }

    // AS3: .../avatar/HabboAvatarEditorManager.as::get inventory()
    public get inventory(): IFigureSetOwnership | null
    {
        // DEVIATION: AS3 answers from the inventory, which left with the core cut (2026-10-07). With
        //   no answer every sellable clothing item counts as unowned and is hidden, as it was before
        //   2026-08-15; it comes back with the character/item system (F2).
        return null;
    }

    // AS3: .../avatar/HabboAvatarEditorManager.as::get inventory()
    // The effect half of the same manager; separate because the two surfaces are unrelated.
    public get effectInventory(): IHabboAvatarEditorHost['effectInventory']
    {
        return null;
    }

    // AS3: .../avatar/HabboAvatarEditorManager.as::get linkPattern()
    public get linkPattern(): string
    {
        return HabboAvatarEditorManager.LINK_PATTERN;
    }

    /**
     * AS3: .../avatar/HabboAvatarEditorManager.as::openEditor()
     *
     * **Reuses** an editor already at that id rather than replacing it — the opposite of
     * `embedEditorToContext()`.
     */
    public openEditor(
        editorId: number,
        saveListener: IAvatarEditorSaveListener | null,
        categories: string[] | null = null,
        sideContentEnabled: boolean = false,
        title: string | null = null,
        defaultCategory: string = HabboAvatarEditorManager.GENERIC
    ): IWindowContainer | null
    {
        let editor = this._editors?.getValue(editorId) ?? null;

        if(editor === null)
        {
            editor = new HabboAvatarEditor(editorId, this);
            this._editors?.add(editorId, editor);
        }

        return editor.openWindow(saveListener, categories, sideContentEnabled, title, defaultCategory);
    }

    // AS3: .../avatar/HabboAvatarEditorManager.as::embedEditorToContext()
    // Always **replaces**: an existing editor at that id is disposed first.
    public embedEditorToContext(
        editorId: number,
        context: IWindowContainer | null,
        saveListener: IAvatarEditorSaveListener | null = null,
        categories: string[] | null = null,
        sideContentEnabled: boolean = false,
        isDevelopmentEditor: boolean = false
    ): boolean
    {
        this._editors?.getValue(editorId)?.dispose();

        const editor = new HabboAvatarEditor(editorId, this, isDevelopmentEditor);

        // AS3 calls `add()` here, which **refuses** a key already present — and the disposed editor
        // was never removed from the map, so the replacement is never stored and every later
        // `getEditor()` returns the disposed one. Kept: `setValue()` would silently change which
        // editor the message handler talks to.
        this._editors?.add(editorId, editor);
        editor.embedToContext(context, saveListener, categories, sideContentEnabled);

        return true;
    }

    // AS3: .../avatar/HabboAvatarEditorManager.as::loadAvatarInEditor()
    public loadAvatarInEditor(editorId: number, figure: string, gender: string, clubLevel: number = 0): void
    {
        this._editors?.getValue(editorId)?.loadAvatarInEditor(figure, gender, clubLevel);
    }

    // DEVIATION: AS3 loads the NFT fallback figure instead when an NFT outfit is worn; the RPG fork
    //   removed NFT.
    // AS3: .../avatar/HabboAvatarEditorManager.as::loadOwnAvatarInEditor()
    public loadOwnAvatarInEditor(editorId: number): void
    {
        const editor = this._editors?.getValue(editorId) ?? null;

        if(editor === null) return;

        editor.loadAvatarInEditor(
            this._sessionData?.figure ?? '',
            this._sessionData?.gender ?? 'M',
            this._sessionData?.clubLevel ?? 0
        );
    }

    /**
     * AS3: .../avatar/HabboAvatarEditorManager.as::close()
     *
     * What "close" means depends on the id, and the switch is written with its `case 2` **after**
     * the default — so id 2 falls through to nothing and the bot editor is never disposed. Kept.
     *
     *  - 0 hides the window and keeps the editor;
     *  - 1 hides, disposes and forgets it;
     *  - 2 does nothing at all;
     *  - anything else disposes and forgets without hiding.
     *
     * Before any of that, a non-development editor has the user's last activated effect written
     * back into its figure.
     */
    public close(editorId: number): void
    {
        if(this._editors === null) return;

        const editor = this._editors.getValue(editorId);

        if(editor === null) return;

        // Closing the editor drops whatever effect was being *previewed* and puts back the one
        // the player actually has on. The development editors are exempt because they preview
        // effects on purpose.
        if(!AvatarEditorIdEnum.isDevelopmentEditor(editorId))
        {
            const figureData = editor.figureData;

            if(figureData !== null) figureData.avatarEffectType = -1;
        }

        switch(editorId)
        {
            case AvatarEditorIdEnum.MAIN_EDITOR:
                editor.hide();
                break;

            case AvatarEditorIdEnum.FURNITURE_EDITOR:
                editor.hide();
                editor.dispose();
                this._editors.remove(editorId);
                break;

            case AvatarEditorIdEnum.BOT_EDITOR:
                break;

            default:
                editor.dispose();
                this._editors.remove(editorId);
                break;
        }
    }

    // AS3: .../avatar/HabboAvatarEditorManager.as::getEditor()
    public getEditor(editorId: number): HabboAvatarEditor | null
    {
        return this._editors?.getValue(editorId) ?? null;
    }

    // AS3: .../avatar/HabboAvatarEditorManager.as::linkReceived()
    // `avatareditor/open` opens the main editor on the user's own figure — the route the
    // navigator and the web pages use.
    public linkReceived(link: string): void
    {
        const parts = link.split('/');

        if(parts.length < 2) return;

        if(parts[1] !== 'open') return;

        this.openEditor(AvatarEditorIdEnum.MAIN_EDITOR, null, null, true);
        this.loadOwnAvatarInEditor(AvatarEditorIdEnum.MAIN_EDITOR);
    }

    // DEVIATION: AS3 asks the catalog; with no catalog since the core cut (2026-10-07) nobody has club.
    // AS3: .../src/com/sulake/habbo/catalog/IHabboCatalog.as::verifyClubLevel()
    public verifyClubLevel(): boolean
    {
        return false;
    }

    // DEVIATION: AS3 opens the club center, which left with the catalog in the core cut (2026-10-07).
    // AS3: .../src/com/sulake/habbo/catalog/IHabboCatalog.as::openClubCenter()
    public openClubCenter(): void
    {
    }

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::getMandatoryAvatarPartSetIds()
    public getMandatoryAvatarPartSetIds(gender: string, clubLevel: number): string[]
    {
        return this._avatarRenderManager?.getMandatoryAvatarPartSetIds(gender, clubLevel) ?? [];
    }

    // TS-only: AS3 reads `windowManager.assets.getAssetByName(name).content` inline — see
    // `IHabboAvatarEditorHost`.
    /**
     * AS3 reads `windowManager.assets.getAssetByName(name).content` — one flat Flash library
     * holding both the layouts and the images. This port splits them: layouts live in the window
     * manager's widget-layout registry, **images in its `ResourceManager`**, and a DI component's
     * own `assets` library holds neither.
     *
     * Reading `this.assets` therefore returned null for every image — which is why every colour
     * swatch stayed white: `AvatarEditorGridColorItem.setupColor()` could not fetch the greyscale
     * chip to tint, and returned before touching it. The component library is still tried as a
     * fallback, since nothing guarantees it is empty.
     */
    public getAssetBitmap(name: string): ImageBitmap | null
    {
        return this._windowManager?.getAsset(name)
            ?? ((this.assets?.getAssetByName(name)?.content ?? null) as ImageBitmap | null);
    }

    /**
     * TS-only: stands in for AS3's inline
     * `new AvatarEditorGridPartItem(AvatarEditorView.THUMB_WINDOW.clone(), ...)`.
     *
     * The template is lifted out of the `AvatarEditorContent` layout by the first
     * `AvatarEditorView` built in the session and kept on that class, so it exists from the moment
     * any editor has a window. Before that — and it can happen, since `generateDataContent()` is
     * reachable from a page built without one — the clone is null and the item simply draws
     * nothing.
     */
    public createGridPartItem(
        model: ICategoryModel,
        partSet: IFigurePartSet | null,
        colours: unknown[] | null,
        colourable: boolean,
        disabled: boolean
    ): AvatarEditorGridPartItem | null
    {
        return new AvatarEditorGridPartItem(
            (AvatarEditorView.THUMB_WINDOW?.clone() as IWindowContainer | null) ?? null,
            model,
            partSet,
            (colours ?? []) as (IPartColor | null)[],
            colourable,
            disabled
        );
    }

    // TS-only: the colour equivalent, standing in for
    // `new AvatarEditorGridColorItem(AvatarEditorView.COLOUR_WINDOW.clone(), ...)`.
    public createGridColorItem(
        model: ICategoryModel,
        colour: unknown,
        disabled: boolean
    ): AvatarEditorGridColorItem | null
    {
        return new AvatarEditorGridColorItem(
            (AvatarEditorView.COLOUR_WINDOW?.clone() as IWindowContainer | null) ?? null,
            model,
            colour as IPartColor | null,
            disabled
        );
    }

    // AS3: .../avatar/HabboAvatarEditorManager.as::dispose()
    public override dispose(): void
    {
        if(this._editors !== null)
        {
            for(const editor of this._editors.getValues()) editor?.dispose();

            this._editors = null;
        }

        this._handler?.dispose();
        this._handler = null;

        this.context?.removeLinkEventTracker(this);

        super.dispose();
    }

    /**
     * AS3: .../avatar/HabboAvatarEditorManager.as::get dependencies()
     *
     * All five are **optional** here where AS3 makes several required. A required dependency that
     * never resolves locks the component forever with no log — the hole that once kept the friend
     * bar from ever building — and this manager must come up whether or not the catalogue,
     * inventory or session are present. AS3 itself already gates three of them on constructor
     * flags, so "required" was never unconditional there either.
     */
    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            new ComponentDependency(
                IID_AvatarRenderManager,
                (manager: IAvatarRenderManager | null) => { this._avatarRenderManager = manager; },
                false,
                // AS3 raises AVATAR_EDITOR_READY from this listener, so anything waiting on the
                // editor learns the renderer is up.
                [{type: 'AVATAR_RENDER_READY', callback: () => this.onAvatarRendererReady()}]
            ),
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) => { this._communication = manager; },
                false
            ),
            new ComponentDependency(
                IID_SessionDataManager,
                (session: ISessionDataManager | null) => { this._sessionData = session; },
                false
            ),
            // AS3 reaches the active session through `roomDesktop.roomSession`, and its
            // `roomDesktop` is `_roomUI.desktop`. There is no RoomUI dependency to take in the
            // engine layer, so the same session is reached through its own manager plus the
            // engine's active room id. Both optional, like every other dependency in this list:
            // the editor has to open in the hotel view too, where there is no room at all.
            new ComponentDependency(
                IID_RoomSessionManager,
                (manager: IRoomSessionManager | null) => { this._roomSessionManager = manager; },
                false
            ),
            new ComponentDependency(
                IID_RoomEngine,
                (engine: IRoomEngine | null) => { this._roomEngine = engine; },
                false
            ),
            // Without this the editor has no way to build `AvatarEditorContent` and comes up as a
            // working model with no window at all — the failure mode this port keeps producing.
            new ComponentDependency(
                IID_HabboWindowManager,
                (manager: IHabboWindowManager | null) => { this._windowManager = manager; },
                false
            )
        ];
    }

    /**
     * The room object id the local user has in the room currently on screen, or -1.
     *
     * AS3 gets there as `roomDesktop.roomSession.ownUserRoomId`; the session manager answers the
     * same question without a RoomUI dependency in the engine layer.
     */
    // AS3: .../avatar/HabboAvatarEditorManager.as::get roomDesktop()
    public get ownUserRoomId(): number
    {
        const manager = this._roomSessionManager;
        const engine = this._roomEngine;

        if(manager === null || engine === null) return -1;

        return manager.getSession(engine.activeRoomId)?.ownUserRoomId ?? -1;
    }

    // AS3: .../avatar/HabboAvatarEditorManager.as::initComponent()
    protected override initComponent(): void
    {
        this.context?.addLinkEventTracker(this);

        if(this.connection !== null)
        {
            this._handler = new AvatarEditorMessageHandler(this, this.connection);
        }

        log.debug('HabboAvatarEditorManager initialized');
    }

    // AS3: .../avatar/HabboAvatarEditorManager.as::onAvatarRendererReady()
    private onAvatarRendererReady(): void
    {
        this.events.emit(HabboAvatarEditorManager.AVATAR_EDITOR_READY, {
            type: HabboAvatarEditorManager.AVATAR_EDITOR_READY
        });
    }
}
