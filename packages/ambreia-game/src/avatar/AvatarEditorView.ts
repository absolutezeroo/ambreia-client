import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IFrameWindow} from '@ambreia/ui/components/IFrameWindow';
import type {ITabButtonWindow} from '@ambreia/ui/components/ITabButtonWindow';
import type {ITabContextWindow} from '@ambreia/ui/components/ITabContextWindow';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IAvatarEditorViewHost} from './view/IAvatarEditorViewHost';
import type {IAvatarEditorGridView} from './common/ICategoryView';
import type {IAvatarEditorView} from './view/IAvatarEditorView';
import {Logger} from '@ambreia/common/utils/Logger';
import {AvatarEditorGridView} from './common/AvatarEditorGridView';
import {AvatarEditorGridViewEffects} from './effects/AvatarEditorGridViewEffects';
import {AvatarEditorNameChangeView} from './view/AvatarEditorNameChangeView';

const log = Logger.getLogger('habbo.avatar.AvatarEditorView');

/**
 * The editor's window: the tab strip, the page area, the shared grid, the side panel and the save
 * bar.
 *
 * It comes in two shapes from one layout. `AvatarEditorContent` is the whole editor body and is
 * built in the constructor; `getFrame()` additionally wraps it in `AvatarEditorFrame` for the
 * standalone window, while `embedToContext()` drops the same body into somebody else's container —
 * that is how the clothing-change furni shows the editor without a frame of its own.
 *
 * Two statics matter beyond this class: `THUMB_WINDOW` and `COLOUR_WINDOW` are lifted out of the
 * layout here and **removed from it**, then cloned per grid item by `HabboAvatarEditor`. They are
 * class-level and assigned only when still null, so the first editor built in a session decides
 * what every later one's thumbnails look like.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarEditorView.as
 */
/* eslint-disable @typescript-eslint/naming-convention -- the three statics below are AS3 `public
   static var`s, not constants; the lint rule reserves UPPER_SNAKE_CASE for readonly members and
   renaming them would break the AS3 trace. */
export class AvatarEditorView implements IAvatarEditorView
{
    /**
     * The thumbnail template, detached from the layout and cloned per part.
     *
     * Static and never cleared — see the class note.
     */
    // AS3: .../avatar/AvatarEditorView.as::THUMB_WINDOW
    public static THUMB_WINDOW: IWindowContainer | null = null;

    // AS3: .../avatar/AvatarEditorView.as::COLOUR_WINDOW
    // The colour-swatch template, same treatment.
    public static COLOUR_WINDOW: IWindowContainer | null = null;

    // AS3: .../avatar/AvatarEditorView.as::TAB_BACKGROUND_COLOUR
    // Declared and assigned in AS3, read by nothing. Kept so the value is not lost.
    public static TAB_BACKGROUND_COLOUR: number = 6710886;

    /* eslint-enable @typescript-eslint/naming-convention */

    // AS3: .../avatar/AvatarEditorView.as::SAVE_TIMEOUT_MS
    // How long the save button stays disabled after a click — a crude double-submit guard.
    private static readonly SAVE_TIMEOUT_MS: number = 1500;

    // AS3: .../avatar/AvatarEditorView.as::DEFAULT_LOCATION
    private static readonly DEFAULT_LOCATION: {x: number; y: number} = {x: 100, y: 30};

    // AS3: .../avatar/AvatarEditorView.as::MAX_DIRECTION
    // Name DERIVED: the 7 the rotate button wraps at.
    private static readonly MAX_DIRECTION: number = 7;

    // AS3: .../avatar/AvatarEditorView.as::SIDE_CONTENT_NONE
    // Name DERIVED: the "nothing" AS3 uses as the empty side-panel id.
    private static readonly SIDE_CONTENT_NONE: string = 'nothing';

    // AS3: .../avatar/AvatarEditorView.as::SIDE_CONTENT_WARDROBE
    private static readonly SIDE_CONTENT_WARDROBE: string = 'wardrobe';

    // AS3: .../avatar/AvatarEditorView.as::_editor
    // Name DERIVED (`_SafeStr_4578`): the field behind `get editor()`.
    private _editor: IAvatarEditorViewHost | null;

    // AS3: .../avatar/AvatarEditorView.as::_window
    // Name DERIVED (`_SafeStr_4585`): the `AvatarEditorContent` body, with or without a frame.
    private _window: IWindowContainer | null = null;

    // AS3: .../avatar/AvatarEditorView.as::_currentViewId
    // Name DERIVED (`_SafeStr_7805`): the field behind `get currentViewId()`.
    private _currentViewId: string = '';

    // AS3: .../avatar/AvatarEditorView.as::_tabs
    // Name DERIVED (`_SafeStr_5019`).
    private _tabs: ITabContextWindow | null = null;

    // AS3: .../avatar/AvatarEditorView.as::_frame
    // Name DERIVED (`_SafeStr_4665`): non-null only for the standalone window.
    private _frame: IFrameWindow | null = null;

    // AS3: .../avatar/AvatarEditorView.as::_standaloneContainer
    // Name DERIVED (`_SafeStr_5852`): the bare container `embedToContext(null, …)` parks the body
    // in when there is no host context. See that method for the branch AS3 gets wrong.
    private _standaloneContainer: IWindowContainer | null = null;

    // AS3: .../avatar/AvatarEditorView.as::_saveTimeout
    // Name DERIVED (`_SafeStr_5391`): AS3 uses a one-shot `Timer(1500, 1)`; a timeout handle here.
    private _saveTimeout: ReturnType<typeof setTimeout> | null = null;

    // AS3: .../avatar/AvatarEditorView.as::_direction
    // Name DERIVED (`_SafeStr_6772`): the preview's facing, stepped by the rotate button.
    private _direction: number = 4;

    // AS3: .../avatar/AvatarEditorView.as::_sideContentId
    // Name DERIVED (`_SafeStr_7931`): `wardrobe` or `nothing`; starts undefined so the first
    // `setSideContent()` always runs.
    private _sideContentId: string = '';

    // AS3: .../avatar/AvatarEditorView.as::_showWardrobeOnUpdate
    // Cleared for good the first time the user closes the wardrobe.
    private _showWardrobeOnUpdate: boolean = true;

    // AS3: .../avatar/AvatarEditorView.as::_availableCategories
    private _availableCategories: string[] = [];

    /**
     * Every page the editor can show, in tab order.
     *
     * `wardrobe` is in this list even though it is a side panel rather than a page — the layout has
     * no `wardrobe` tab, so it only ever affects `validateAvailableCategories()`. AS3's; kept.
     */
    // DEVIATION: AS3 also lists `nfts`; the RPG fork removed NFT, so `createWindow()` drops the
    //   layout's `nfts` tab like any other unavailable one.
    // AS3: .../avatar/AvatarEditorView.as::_allCategories
    private _allCategories: string[] = ['generic', 'head', 'torso', 'legs', 'wardrobe'];

    // AS3: .../avatar/AvatarEditorView.as::_categoryContainers
    // Page id → the `<id>_content` container detached from `contentArea` at build time.
    private _categoryContainers: Map<string, IWindow> | null = null;

    // AS3: .../avatar/AvatarEditorView.as::_gridView
    // Name DERIVED (`_SafeStr_4604`).
    private _gridView: IAvatarEditorGridView | null = null;

    // AS3: .../avatar/AvatarEditorView.as::_effectsGridView
    // Name DERIVED (`_SafeStr_9017`): wraps the **same** `grid_container` as `_gridView`.
    private _effectsGridView: IAvatarEditorGridView | null = null;

    // AS3: .../avatar/AvatarEditorView.as::_avatarEditorNameChangeView
    // Name DERIVED (`_SafeStr_8336`): built on the first rename click and never disposed.
    private _avatarEditorNameChangeView: AvatarEditorNameChangeView | null = null;

    /**
     * AS3: .../avatar/AvatarEditorView.as::AvatarEditorView()
     *
     * The two optional pages are appended to `_allCategories` from configuration *before* the
     * requested list is validated against it, so an editor asking for `effects` on a hotel that
     * disables them fails validation rather than silently dropping the tab.
     */
    constructor(editor: IAvatarEditorViewHost, categories: string[] | null)
    {
        this._editor = editor;

        if(editor.manager?.getBoolean('effects.in.avatar.editor') === true) this._allCategories.push('effects');
        if(editor.manager?.getBoolean('clothing.misc.tab.enabled') === true) this._allCategories.push('misc');

        for(const category of categories ?? this._allCategories) this._availableCategories.push(category);

        this.createWindow();
    }

    // AS3: .../avatar/AvatarEditorView.as::get currentViewId()
    public get currentViewId(): string
    {
        return this._currentViewId;
    }

    // AS3: .../avatar/AvatarEditorView.as::get editor()
    public get editor(): IAvatarEditorViewHost | null
    {
        return this._editor;
    }

    // AS3: .../avatar/AvatarEditorView.as::get gridView()
    public get gridView(): IAvatarEditorGridView | null
    {
        return this._gridView;
    }

    // AS3: .../avatar/AvatarEditorView.as::get effectsGridView()
    public get effectsGridView(): IAvatarEditorGridView | null
    {
        return this._effectsGridView;
    }

    // AS3: .../avatar/AvatarEditorView.as::get avatarEditorNameChangeView()
    // Null until the rename button is clicked once; `AvatarEditorMessageHandler` null-checks it.
    public get avatarEditorNameChangeView(): AvatarEditorNameChangeView | null
    {
        return this._avatarEditorNameChangeView;
    }

    // AS3: .../avatar/AvatarEditorView.as::get effectsParamViewContainer()
    public get effectsParamViewContainer(): IWindowContainer | null
    {
        return (this._window?.findChildByName('effectParamsContainer') as IWindowContainer | null) ?? null;
    }

    /**
     * Builds — or re-shows — the standalone window.
     *
     * The first `if` returns early on an existing frame; AS3 then tests the *same* condition again
     * to dispose it, which is unreachable. Kept: it is the only record that the author meant to
     * rebuild rather than reuse.
     */
    // AS3: .../avatar/AvatarEditorView.as::getFrame()
    public getFrame(categories: string[] | null, title: string | null = null): IFrameWindow | null
    {
        if(this._frame !== null)
        {
            this._frame.visible = true;
            this._frame.activate();

            return this._frame;
        }

        // Unreachable — see the method note.
        if(this._frame !== null)
        {
            (this._frame as IFrameWindow).dispose();
            this._frame = null;
        }

        // AS3: `manager.assets.getAssetByName("AvatarEditorFrame")` + `windowManager.buildFromXML()`.
        // This port keeps the layouts in the window manager's own registry instead.
        this._frame = (this._editor?.manager?.windowManager?.buildWidgetLayout('AvatarEditorFrame') as IFrameWindow | null) ?? null;

        if(this._frame === null) return null;

        const content = this._frame.findChildByName('maincontent') as IWindowContainer | null;

        if(!this.embedToContext(content, categories))
        {
            this._frame.dispose();
            this._frame = null;

            return null;
        }

        if(title !== null && title !== '' && this._frame.header !== null)
        {
            this._frame.header.title.text = title;
        }

        this._frame.position = AvatarEditorView.DEFAULT_LOCATION;

        const close = this._frame.findChildByName('header_button_close');

        if(close !== null) close.procedure = this.windowEventProc;

        return this._frame;
    }

    /**
     * Parents the editor body into `context`, or into a container of its own when there is none.
     *
     * The removal guards are `if(index)`, not `if(index >= 0)` — index **0 is skipped**, so a body
     * already sitting at the front of the context is re-added rather than moved. And in the
     * no-context branch AS3 calls `param1.removeChildAt(...)` on the argument it just established
     * is null; that line is only reached when the index is non-zero, which cannot happen right
     * after `addChild()`, so the throw is latent. Both kept — the second as a no-op here, since
     * this port cannot dereference null.
     */
    // AS3: .../avatar/AvatarEditorView.as::embedToContext()
    public embedToContext(context: IWindowContainer | null, categories: string[] | null): boolean
    {
        if(!this.validateAvailableCategories(categories)) return false;

        if(this._window === null) return true;

        if(context !== null)
        {
            const index = context.getChildIndex(this._window);

            if(index) context.removeChildAt(index);

            context.addChild(this._window);

            return true;
        }

        if(this._standaloneContainer === null)
        {
            this._standaloneContainer = this._editor?.manager?.windowManager?.createWindow(
                'avatarEditorContainer', '', 4, 3, 0x020000 | 1, {x: 0, y: 0, width: 2, height: 2}, null, 0
            ) as IWindowContainer | null ?? null;

            this._standaloneContainer?.addChild(this._window);
        }

        const index = this._standaloneContainer?.getChildIndex(this._window) ?? 0;

        // AS3 dereferences the null `context` here — see the method note. Routed through a
        // nullable local because TypeScript has narrowed `context` to `never` by this point.
        const nullContext = context as unknown as IWindowContainer | null;

        if(index) nullContext?.removeChildAt(index);

        if(this._standaloneContainer !== null) this._standaloneContainer.visible = true;

        return true;
    }

    /**
     * Compares the requested pages against the ones this view was built for — **by length and
     * membership**, so a list with the right pages in a different order passes and a subset fails.
     * A null list re-runs the check against every category, which succeeds only for an editor that
     * was itself built with no restriction.
     */
    // AS3: .../avatar/AvatarEditorView.as::validateAvailableCategories()
    public validateAvailableCategories(categories: string[] | null): boolean
    {
        if(categories === null) return this.validateAvailableCategories(this._allCategories);

        if(categories.length !== this._availableCategories.length) return false;

        for(const category of categories)
        {
            if(this._availableCategories.indexOf(category) < 0) return false;
        }

        return true;
    }

    // AS3: .../avatar/AvatarEditorView.as::show()
    // The frame wins when there is one: hiding the body underneath a visible frame would leave an
    // empty window on screen.
    public show(): void
    {
        if(this._frame !== null) this._frame.visible = true;
        else if(this._window !== null) this._window.visible = true;
    }

    // AS3: .../avatar/AvatarEditorView.as::hide()
    public hide(): void
    {
        if(this._frame !== null) this._frame.visible = false;
        else if(this._window !== null) this._window.visible = false;
    }

    /**
     * Re-reads everything the editor's state decides: whether the wardrobe button shows, which side
     * panel is up, and whether the current outfit still contains items the user may not wear.
     *
     * The wardrobe button's visibility is assigned **twice** — first including the club test, then
     * again without it. The second assignment wins, so a non-subscriber sees the button. AS3's;
     * kept, because removing the dead line would also remove the evidence that the club rule was
     * meant to apply.
     */
    // AS3: .../avatar/AvatarEditorView.as::update()
    public update(): void
    {
        const editor = this._editor;

        if(editor === null || this._window === null) return;

        const wardrobeButton = this._window.findChildByName('wardrobeButtonContainer');

        if(wardrobeButton !== null && editor.manager?.sessionData != null)
        {
            wardrobeButton.visible = (editor.manager.sessionData.hasClub ?? false) && editor.isSideContentEnabled();
            wardrobeButton.visible = editor.isSideContentEnabled();
        }

        let sideContent = AvatarEditorView.SIDE_CONTENT_NONE;

        if(this._sideContentId === AvatarEditorView.SIDE_CONTENT_WARDROBE || this._showWardrobeOnUpdate)
        {
            sideContent = AvatarEditorView.SIDE_CONTENT_WARDROBE;
        }

        if(!editor.isSideContentEnabled()) sideContent = AvatarEditorView.SIDE_CONTENT_NONE;

        if(editor.hasInvalidClubItems())
        {
            editor.stripClubItems();
            editor.disableClubClothing();
        }

        if(editor.hasInvalidSellableItems()) editor.stripInvalidSellableItems();

        this.setSideContent(sideContent);
        this.setViewToCategory(this._currentViewId);
    }

    // AS3: .../avatar/AvatarEditorView.as::toggleCategoryView()
    // `force` is accepted and tested by an **empty** `if` in AS3 — it changes nothing. Kept so the
    // signature `HabboAvatarEditor.toggleAvatarEditorPage()` calls stays honest.
    public toggleCategoryView(categoryId: string, force: boolean = false): void
    {
        // AS3's `if(param2) {}` — an empty block, kept as a void so the parameter stays live and
        // the fact that it does nothing stays visible.
        void force;

        this.setViewToCategory(categoryId);
    }

    // AS3: .../avatar/AvatarEditorView.as::getCategoryContainer()
    // What every `CategoryBaseView` subclass fills its `_window` from.
    public getCategoryContainer(categoryId: string): IWindow | null
    {
        return this._categoryContainers?.get(categoryId) ?? null;
    }

    // AS3: .../avatar/AvatarEditorView.as::getFigureContainer()
    // The preview slot. Named `avatarWidget` in the layout, not `figureContainer` — see `dispose()`.
    public getFigureContainer(): IWidgetWindow | null
    {
        return (this._window?.findChildByName('avatarWidget') as IWidgetWindow | null) ?? null;
    }

    /**
     * The window procedure for the body, the frame's close button and the tab strip.
     */
    // AS3: .../avatar/AvatarEditorView.as::windowEventProc()
    public windowEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WE_SELECTED')
        {
            this.onTabSelected((window as ITabContextWindow).selector?.getSelected()?.name ?? '');

            return;
        }

        if(event.type !== 'WME_CLICK') return;

        const editor = this._editor;

        if(editor === null) return;

        switch(window.name)
        {
            case 'save':
                this.onSaveClicked(editor);
                break;

            case 'cancel':
            case 'header_button_close':
                if(editor.hasInvalidClubItems())
                {
                    editor.stripClubItems();
                    editor.disableClubClothing();
                }

                editor.manager?.close(editor.instanceId);
                break;

            case 'rotate_avatar':
                this._direction = this._direction + 1;

                if(this._direction > AvatarEditorView.MAX_DIRECTION) this._direction = 0;

                if(editor.figureData !== null) editor.figureData.direction = this._direction;
                break;

            case 'wardrobe':
                this.toggleWardrobe();
                break;

            case 'avatar_name_change':
                // Built once and kept — a second click focuses the dialog rather than replacing it.
                // Placed at the editor body's right-hand edge; the dialog itself slides back on
                // screen if that would overflow the desktop.
                if(this._avatarEditorNameChangeView !== null)
                {
                    this._avatarEditorNameChangeView.focus();
                    break;
                }

                this._avatarEditorNameChangeView = new AvatarEditorNameChangeView(
                    this._editor?.manager ?? null,
                    (this._window?.x ?? 0) + (this._window?.width ?? 0),
                    this._window?.y ?? 0
                );
                break;
        }
    };

    /**
     * AS3: .../avatar/AvatarEditorView.as::dispose()
     *
     * Everything after the window is disposed is **dead**: `_window` has just been set to null and
     * the tail is guarded on it being non-null, so the three child-clearing loops never run and
     * `_editor` is never cleared. Kept verbatim — the leak is AS3's, and writing the cleanup as if
     * it ran would misrepresent what the client does.
     */
    // AS3: .../avatar/AvatarEditorView.as::dispose()
    public dispose(): void
    {
        if(this._saveTimeout !== null)
        {
            clearTimeout(this._saveTimeout);
            this._saveTimeout = null;
        }

        if(this._tabs !== null)
        {
            this._tabs.dispose();
            this._tabs = null;
        }

        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
        }

        if(this._standaloneContainer !== null)
        {
            this._standaloneContainer.dispose();
            this._standaloneContainer = null;
        }

        if(this._frame !== null)
        {
            this._frame.dispose();
            this._frame = null;
        }

        // Dead from here down — see the method note. `figureContainer` is not even a name in the
        // layout (the preview is `avatarWidget`), so this branch could never have found it.
        if(this._window !== null)
        {
            for(const name of ['figureContainer', 'contentArea', 'sideContainer'])
            {
                const container = (this._window as IWindowContainer).findChildByName(name) as IWindowContainer | null;

                if(container === null) continue;

                while(container.numChildren > 0) container.removeChildAt(0);
            }

            this._editor = null;
        }
    }

    /**
     * Builds the body once, lifts the two grid-item templates out of it, drops the tabs this editor
     * was not asked for, and detaches every page container.
     *
     * Two details decide how the rest of the class behaves. The tab strip is walked **backwards**
     * so removing an item cannot skip the next one, and the tabs after a removed one are shifted
     * left by its width by hand — the strip does not re-flow itself. And the name list is filled
     * *before* the removal test, so `_categoryContainers` ends up holding the page containers of
     * removed tabs too; they simply never get shown.
     */
    // AS3: .../avatar/AvatarEditorView.as::createWindow()
    private createWindow(): void
    {
        const manager = this._editor?.manager ?? null;

        if(this._window === null)
        {
            this._window = (manager?.windowManager?.buildWidgetLayout('AvatarEditorContent') as IWindowContainer | null) ?? null;
        }

        if(this._window === null)
        {
            log.error('AvatarEditorContent layout is missing — the editor cannot be built');

            return;
        }

        if(AvatarEditorView.THUMB_WINDOW === null)
        {
            AvatarEditorView.THUMB_WINDOW = this._window.findChildByName('thumb_template') as IWindowContainer | null;

            if(AvatarEditorView.THUMB_WINDOW !== null) this._window.removeChild(AvatarEditorView.THUMB_WINDOW);
        }

        if(AvatarEditorView.COLOUR_WINDOW === null)
        {
            AvatarEditorView.COLOUR_WINDOW = this._window.findChildByName('palette_template') as IWindowContainer | null;

            if(AvatarEditorView.COLOUR_WINDOW !== null) this._window.removeChild(AvatarEditorView.COLOUR_WINDOW);
        }

        if(manager !== null && manager.sessionData !== null)
        {
            const name = this._window.findChildByName('avatar_name');

            if(name !== null) name.caption = manager.sessionData.userName ?? '';

            if(manager.getBoolean('premium.name.change.enabled'))
            {
                const change = this._window.findChildByName('avatar_name_change');

                if(change !== null) change.visible = true;
            }
        }

        this._window.procedure = this.windowEventProc;
        this._tabs = this._window.findChildByName('mainTabs') as ITabContextWindow | null;

        const tabNames: string[] = [];

        if(this._tabs !== null)
        {
            for(let index = this._tabs.numTabItems - 1; index >= 0; index--)
            {
                const tab: ITabButtonWindow | null = this._tabs.getTabItemAt(index);

                if(tab === null) continue;

                tabNames.push(tab.name);

                if(this._availableCategories.indexOf(tab.name) >= 0) continue;

                this._tabs.removeTabItem(tab);

                for(let next = index + 1; next < this._tabs.numTabItems; next++)
                {
                    const following = this._tabs.getTabItemAt(next);

                    if(following !== null) following.x = following.x - tab.width;
                }
            }
        }

        this._categoryContainers = new Map<string, IWindow>();

        const contentArea = this._window.findChildByName('contentArea') as IWindowContainer | null;

        for(const name of tabNames)
        {
            const container = contentArea?.findChildByName(`${name}_content`) ?? null;

            if(container === null) continue;

            const removed = contentArea?.removeChild(container) ?? null;

            if(removed !== null) this._categoryContainers.set(name, removed);
        }

        const gridContainer = this._window.findChildByName('grid_container') as IWindowContainer | null;

        this._gridView = new AvatarEditorGridView(gridContainer);

        // The **same** `grid_container`, wrapped a second time. The two grids coexist over one
        // window and neither knows about the other; whichever page is showing refills it.
        this._effectsGridView = new AvatarEditorGridViewEffects(gridContainer);

        if(this._tabs !== null)
        {
            const first = this._tabs.getTabItemAt(0);

            if(first !== null) this._tabs.selector?.setSelected(first);
        }

        this.update();
    }

    // AS3: .../avatar/AvatarEditorView.as::onUpdate()
    // The save button's re-enable, fired once `SAVE_TIMEOUT_MS` after a click.
    private onUpdate = (): void =>
    {
        this._saveTimeout = null;
        this._window?.findChildByName('save')?.enable();
    };

    // TS-only: AS3 restarts a one-shot `Timer`; `setTimeout` needs the pending handle cleared first.
    private startSaveTimeout(): void
    {
        if(this._saveTimeout !== null) clearTimeout(this._saveTimeout);

        this._saveTimeout = setTimeout(this.onUpdate, AvatarEditorView.SAVE_TIMEOUT_MS);
    }

    /**
     * The save button, which does not always save.
     *
     * An outfit containing unowned sellable parts opens the catalogue instead; one containing
     * unaffordable club parts opens the club advert instead. Both still disable the button for the
     * timeout, so the user cannot hammer it. A development editor skips both checks.
     */
    // AS3: .../avatar/AvatarEditorView.as::windowEventProc() — the "save" case
    private onSaveClicked(editor: IAvatarEditorViewHost): void
    {
        if(!editor.isDevelopmentEditor() && editor.hasInvalidSellableItems())
        {
            this.startSellablePurchase();
            this.startSaveTimeout();
            this._window?.findChildByName('save')?.disable();

            return;
        }

        if(!editor.isDevelopmentEditor() && editor.hasInvalidClubItems())
        {
            editor.openHabboClubAdWindow();
            this.startSaveTimeout();
            this._window?.findChildByName('save')?.disable();

            return;
        }

        this.startSaveTimeout();
        this._window?.findChildByName('save')?.disable();
        editor.saveCurrentSelection();
        editor.manager?.close(editor.instanceId);
    }

    // DEVIATION: AS3 also loads the NFT, fallback or rollback figure around the page switch; the
    //   RPG fork removed NFT, so only the switch is left.
    // AS3: .../avatar/AvatarEditorView.as::windowEventProc() — the "WE_SELECTED" branch
    private onTabSelected(categoryId: string): void
    {
        const editor = this._editor;

        if(editor === null || categoryId === this._currentViewId) return;

        editor.toggleAvatarEditorPage(categoryId);
    }

    // AS3: .../avatar/AvatarEditorView.as::toggleWardrobe()
    // Closing the wardrobe also clears `_showWardrobeOnUpdate`, so it stays closed across updates;
    // opening it does not set the flag back, so the choice is one-way for the session.
    private toggleWardrobe(): void
    {
        if(this._sideContentId === AvatarEditorView.SIDE_CONTENT_WARDROBE)
        {
            this._showWardrobeOnUpdate = false;
            this.setSideContent(AvatarEditorView.SIDE_CONTENT_NONE);

            return;
        }

        this.setSideContent(AvatarEditorView.SIDE_CONTENT_WARDROBE);
    }

    /**
     * Swaps the side panel and resizes the editor around it.
     *
     * The body shrinks by whatever was removed but is **not** grown back by what is added — only
     * the side container's own width follows the new panel. The frame's content is then resized to
     * the body, so the standalone window tracks the change and an embedded one does not.
     */
    // AS3: .../avatar/AvatarEditorView.as::setSideContent()
    private setSideContent(sideContentId: string): void
    {
        if(this._sideContentId === sideContentId) return;

        const container = this._window?.findChildByName('sideContainer') as IWindowContainer | null;

        if(container == null) return;

        let panel: IWindow | null = null;

        if(sideContentId === AvatarEditorView.SIDE_CONTENT_WARDROBE)
        {
            panel = (this._editor?.getSideContentWindowContainer('wardrobe') as IWindow | null) ?? null;
        }

        const removed = container.removeChildAt(0);

        if(removed !== null && this._window !== null) this._window.width -= removed.width;

        if(panel !== null)
        {
            container.addChild(panel);
            panel.visible = true;
            container.width = panel.width;
        }
        else
        {
            container.width = 1;
        }

        this._sideContentId = sideContentId;

        if(this._frame !== null && this._window !== null) this._frame.content.width = this._window.width;
    }

    /**
     * Shows one page in `contentArea`.
     *
     * The outgoing page is removed **before** the incoming one is fetched, so a page whose view is
     * not built leaves the area empty rather than unchanged. That is the visible symptom of an
     * unported category: the tab lights up and the panel goes blank.
     */
    // DEVIATION: AS3 also disables the wardrobe button and closes the side panel on the `nfts`
    //   page; the RPG fork removed NFT. The layout's `collectible_avatar_info` panel, which only that
    //   page showed, is still hidden here until Task 10 removes it from the XML.
    // AS3: .../avatar/AvatarEditorView.as::setViewToCategory()
    private setViewToCategory(categoryId: string): void
    {
        if(categoryId === '' || this._window === null) return;

        const contentArea = this._window.findChildByName('contentArea') as IWindowContainer | null;

        if(contentArea === null) return;

        const effectsParams = this.effectsParamViewContainer;

        if(effectsParams !== null) effectsParams.visible = categoryId === 'effects';

        const collectibleInfo = this._window.findChildByName('collectible_avatar_info');

        if(collectibleInfo !== null) collectibleInfo.visible = false;

        this._window.findChildByName('wardrobe')?.enable();

        const outgoing = contentArea.getChildAt(0);

        if(outgoing !== null) contentArea.removeChild(outgoing);

        contentArea.invalidate();

        const incoming = (this._editor?.getCategoryWindowContainer(categoryId) as IWindow | null) ?? null;

        if(incoming === null) return;

        if(this._gridView?.window != null) this._gridView.window.visible = false;

        incoming.visible = true;
        contentArea.addChild(incoming);
        this._editor?.activateCategory(categoryId);
        this._currentViewId = categoryId;

        const tab = this._tabs?.getTabItemByName(categoryId) ?? null;

        if(tab !== null) this._tabs?.selector?.setSelected(tab);
    }

    // AS3: .../avatar/AvatarEditorView.as::startSellablePurchase()
    private startSellablePurchase(): void
    {
        const manager = this._editor?.manager ?? null;

        if(manager === null) return;

        manager.openCatalogPage(manager.getProperty('catalog.clothes.page'));
    }
}
