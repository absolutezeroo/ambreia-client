import type {HabboToolbar} from './HabboToolbar';
import {MeMenuNewController} from './memenu/MeMenuNewController';
import {ProgMenuController} from './progmenu/ProgMenuController';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import {WindowEvent} from '@core/window/events/WindowEvent';
import type {ILinkEventTracker} from '@core/runtime/events/ILinkEventTracker';
import {PerkType} from '@habbo/communication/enum/PerkType';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IAssetReceiver} from '@core/window/IAssetReceiver';
import type {XmlAsset} from '@core/assets/XmlAsset';
import {CatalogEvent} from '@habbo/catalog/event/CatalogEvent';
import {HabboToolbarIconEnum} from './HabboToolbarIconEnum';
import type {Motion} from '@core/window/motion/Motion';
import {Motions} from '@core/window/motion/Motions';
import {Queue} from '@core/window/motion/Queue';
import {Wait} from '@core/window/motion/Wait';
import {EaseOut} from '@core/window/motion/EaseOut';
import {JumpBy} from '@core/window/motion/JumpBy';
import {DropBounce} from '@core/window/motion/DropBounce';
import {Dispose} from '@core/window/motion/Dispose';
import {Logger} from '@core/utils/Logger';

const log = Logger.getLogger('habbo.toolbar.BottomBarLeft');

/**
 * Horizontal bottom bar with icon click handlers, unseen counters, and collapse
 *
 * Builds a horizontal toolbar from the registered 'bottom_bar_left_xml' layout,
 * manages icon visibility by toolbar state tags, handles collapse/expand, and
 * routes icon clicks to toggleWindowVisibility.
 *
 * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as
 */
export class BottomBarLeft implements ILinkEventTracker
{
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::DEFAULT_LOCATION
    private static readonly DEFAULT_LOCATION = {x: 0, y: 500};
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::LANDING_VIEW_LOCATION
    private static readonly LANDING_VIEW_LOCATION = {x: 0, y: 500};
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::ICON_BG_COLOR_OVER
    private static readonly ICON_BG_COLOR_OVER: number = 7433577;
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::ICON_BG_COLOR_OUT
    private static readonly ICON_BG_COLOR_OUT: number = 5723213;
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::ICON_MOUSE_OVER
    private static readonly ICON_MOUSE_OVER: string = '_hover';
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::ICON_MOUSE_OUT
    private static readonly ICON_MOUSE_OUT: string = '_normal';
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::COUNTER_MARGIN
    private static readonly COUNTER_MARGIN: number = 0;
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::ME_MENU_ICON_NAME
    private static readonly ME_MENU_ICON_NAME: string = 'icon_me_menu';
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::ICON_REGION_WIDTH
    private static readonly ICON_REGION_WIDTH: number = 45;
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::ICON_LABEL_HEIGHT
    private static readonly ICON_LABEL_HEIGHT: number = 20;
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::WINDOW_RIGHT_PADDING
    private static readonly WINDOW_RIGHT_PADDING: number = 10;
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::COLLAPSED_MARGIN
    private static readonly COLLAPSED_MARGIN: number = 185;
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::_toolbar
    private _toolbar: HabboToolbar | null;
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::_windowManager
    private _windowManager: IHabboWindowManager | null;
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::_buttonContainer
    private _buttonContainer: IWindow | null = null;
    private _leftArrow: IWindow | null = null;
    private _rightArrow: IWindow | null = null;
    private _lineSeparator: IWindow | null = null;
    private _newItemsLabel: IWindowContainer | null = null;
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::_unseenItemCounters
    private _unseenItemCounters: Map<string, unknown> = new Map();
    private _newItemsNotificationEnabled: boolean = false;
    private _newItemsLabelVisible: boolean = false;
    private _lastState: string = '';
    private _meMenuController: MeMenuNewController | null = null;
    private _progMenuController: ProgMenuController | null = null;
    private _meMenuIcon: IBitmapWrapperWindow | null = null;

    /**
     * Constructs the toolbar window from the registered layout and wires up
     * click handlers on TOGGLE-tagged regions and collapse arrows.
     *
     * @param toolbar - The parent HabboToolbar component
     * @param windowManager - The window manager for building layouts
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as constructor
     */
    constructor(toolbar: HabboToolbar, windowManager: IHabboWindowManager) 
    {
        this._toolbar = toolbar;
        this._windowManager = windowManager;
        this._meMenuController = new MeMenuNewController(toolbar, this);
        this._progMenuController = new ProgMenuController(toolbar, this);

        // Build the toolbar window from registered layout
        const built = windowManager.buildWidgetLayout('bottom_bar_left_xml');
        this._window = built as IWindowContainer;

        if(!this._window) 
        {
            throw new Error('Failed to construct toolbar window from layout');
        }

        this._window.addEventListener(WindowEvent.WE_PARENT_RESIZED, this.onParentResized);

        // Find key children
        this._buttonContainer = this._window.getChildByName('toolbar_items');

        const leftContainer = this._window.getChildByName('arrow_container_left') as IWindowContainer | null;
        const rightContainer = this._window.getChildByName('arrow_container_right') as IWindowContainer | null;

        this._leftArrow = leftContainer?.getChildByName?.('collapse_left') ?? null;
        this._rightArrow = rightContainer?.getChildByName?.('collapse_right') ?? null;
        this._lineSeparator = (this._buttonContainer as IWindowContainer)?.findChildByName?.('line') ?? null;

        // Register click listeners on collapse arrows
        if(this._leftArrow) 
        {
            this._leftArrow.addEventListener(WindowMouseEvent.CLICK, this.onCollapseToolbar);
        }

        if(this._rightArrow) 
        {
            this._rightArrow.addEventListener(WindowMouseEvent.CLICK, this.onCollapseToolbar);
        }

        // Register click listeners on all TOGGLE-tagged regions
        // AS3 win63 BottomBarLeft only registers CLICK — hover visual comes
        // from the lifted_hover dynamic style on each TOGGLE region.
        const toggleChildren: IWindow[] = [];
        (this._window as IWindowContainer).groupChildrenWithTag('TOGGLE', toggleChildren, -1);

        for(const child of toggleChildren) 
        {
            if(child) 
            {
                child.addEventListener(WindowMouseEvent.CLICK, this.onIconClick);
                child.addEventListener(WindowMouseEvent.OVER, this.onIconHoverMouseEvent);
                child.addEventListener(WindowMouseEvent.OUT, this.onIconHoverMouseEvent);
            }
        }

        // Find the MEMENU bitmap icon and load placeholder
        const meMenuIcon = (this._window as IWindowContainer).findChildByName('icon_me_menu');

        if(meMenuIcon) 
        {
            this._meMenuIcon = meMenuIcon as unknown as IBitmapWrapperWindow;
            this.loadMeMenuPlaceholder();
        }

        // Set initial icon visibility
        this.iconVisibility(HabboToolbarIconEnum.getIconName('HTIE_ICON_MEMENU') ?? '', false);
        this.iconVisibility(HabboToolbarIconEnum.getIconName('HTIE_ICON_INVENTORY') ?? '', false);
        // The wired-menu icon: its enum entry is gone with wired (RPG fork), the layout child is not yet.
        this.iconVisibility('WIRED_MENU', false);

        const gamesEnabled = toolbar.getBoolean('games_icon_enabled');

        if(gamesEnabled) 
        {
            this.iconVisibility(HabboToolbarIconEnum.getIconName('HTIE_ICON_GAMES') ?? '', true);
        }
        else 
        {
            this.iconVisibility(HabboToolbarIconEnum.getIconName('HTIE_ICON_GAMES') ?? '', false);
        }

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as
        // (constructor) - the "new items" badge overlaid on the catalog icon, shown/hidden by
        // onCatalogEvent() below in response to CATALOG_NEW_ITEMS_SHOW/HIDE.
        const catalogIcon = (this._window as IWindowContainer)
            .findChildByName(HabboToolbarIconEnum.getIconName('HTIE_ICON_CATALOGUE') ?? '');

        if(catalogIcon)
        {
            const labelAsset = toolbar.assets?.getAssetByName('new_items_label_xml') as XmlAsset | null;

            if(!labelAsset)
            {
                log.warn('Missing layout "new_items_label_xml" - the catalog new-items badge cannot be built');
            }
            else
            {
                const label = windowManager.buildFromXML(labelAsset.content as unknown as string, 2) as IWindowContainer | null;

                if(!label)
                {
                    throw new Error('Failed to construct toolbar label from XML!');
                }

                this._newItemsLabel = label;
                (catalogIcon as unknown as IWindowContainer).addChild(label);

                const labelText = label.findChildByName('new_textfield') as ITextWindow | null;
                const localizedText = toolbar.localization?.getLocalization('toolbar.new_additions.notification', '') ?? '';

                if(labelText && localizedText.length > 0) labelText.text = localizedText;

                label.visible = false;
                label.x = catalogIcon.width - label.width;
                label.y = 0;
            }
        }

        this._newItemsNotificationEnabled = this.isNewItemsNotificationEnabled();
        this.checkSize();

        // Last thing the AS3 constructor does, and the port had dropped it while keeping
        // `linkPattern` and `linkReceived` — so every `toolbar/...` link was handed to nobody.
        // `createLinkEvent()` only reaches trackers that registered, and it logs nothing when none
        // match, so the symptom is a link that silently does nothing.
        toolbar.context.addLinkEventTracker(this);

        log.debug('BottomBarLeft constructed with IWindow tree');
    }

    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::_disposed
    private _disposed: boolean = false;

    /**
     * Whether the view is disposed
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::get disposed()
    get disposed(): boolean 
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::_window
    private _window: IWindowContainer | null = null;

    /**
     * The root window of the toolbar
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::get window()
    get window(): IWindow | null 
    {
        return this._window;
    }

    private _collapsed: boolean = false;

    /**
     * Whether the bar is collapsed
     */
    get collapsed(): boolean 
    {
        return this._collapsed;
    }

    private _unseenAchievementCount: number = 0;

    /**
     * Set the unseen achievement count
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::set unseenAchievementCount()
    set unseenAchievementCount(value: number) 
    {
        this._unseenAchievementCount = value;
    }

    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::_SafeStr_10024
    private _unseenDailyTasksCount: number = 0;

    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::set unseenDailyTasksCount()
    set unseenDailyTasksCount(value: number)
    {
        this._unseenDailyTasksCount = value;
    }

    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::_SafeStr_9944
    private _unseenRewardTrackRewardsCount: number = 0;

    /**
     * Raised by `qe_urtrcue`, which `RewardTrackController` dispatches whenever the number of
     * unclaimed rewards changes. `unseenProgMenuCount` below sums this with achievements and daily
     * tasks into the single badge the progression icon carries.
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::set unseenRewardTrackRewardsCount()
    set unseenRewardTrackRewardsCount(value: number)
    {
        this._unseenRewardTrackRewardsCount = value;
    }

    private _unseenMiniMailMessageCount: number = 0;

    /**
     * Set the unseen mini mail message count
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::set unseenMiniMailMessageCount()
    set unseenMiniMailMessageCount(value: number) 
    {
        this._unseenMiniMailMessageCount = value;
    }

    private _unseenForumsCount: number = 0;

    /**
     * Set the unseen forums count
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::set unseenForumsCount()
    set unseenForumsCount(value: number) 
    {
        this._unseenForumsCount = value;
    }

    /**
     * Set the on duty state
     *
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as set onDuty()
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::set onDuty()
    set onDuty(value: boolean) 
    {
        if(!this._window) return;

        const guideIcon = (this._window as IWindowContainer).findChildByName('guide_icon');

        if(guideIcon) 
        {
            guideIcon.visible = value;
        }
    }

    /**
     * Total unseen count across me-menu categories
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::get unseenMeMenuCount()
    get unseenMeMenuCount(): number 
    {
        return this._unseenMiniMailMessageCount + this._unseenAchievementCount + this._unseenForumsCount;
    }

    /**
     * The progression icon's badge: achievements + daily tasks + reward track.
     *
     * The achievement count is summed into **both** this and `unseenMeMenuCount` above, so a new
     * achievement badges two icons at once. That is AS3's, not a duplication slip.
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::get unseenProgMenuCount()
    get unseenProgMenuCount(): number
    {
        return this._unseenAchievementCount + this._unseenDailyTasksCount + this._unseenRewardTrackRewardsCount;
    }

    /**
     * Get the me menu controller
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::get memenu()
    get memenu(): MeMenuNewController | null
    {
        return this._meMenuController;
    }

    /**
     * Get the progression menu controller
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::get progmenu()
    get progmenu(): ProgMenuController | null
    {
        return this._progMenuController;
    }

    /**
     * The link pattern for toolbar links
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::get linkPattern()
    get linkPattern(): string 
    {
        return 'toolbar/';
    }

    /**
     * Set the toolbar state and update icon visibility by tags
     *
     * In AS3, this groups all TOGGLE-tagged children and sets their visibility
     * based on the state's visibility tag (VISIBLE_ROOM, VISIBLE_HOTEL, etc.)
     * with additional rules for specific icons (QUESTS, STORIES, BUILDER, etc.)
     *
     * @param state Toolbar state identifier
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as setToolbarState()
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::setToolbarState()
    public setToolbarState(state: string): void 
    {
        if(!this._window) 
        {
            return;
        }

        if(state === 'HTE_STATE_HIDDEN') 
        {
            this._window.visible = false;
            return;
        }

        this._window.visible = true;

        if(state !== 'HTE_STATE_COLLAPSED') 
        {
            this._lastState = state;
        }

        // Collect all TOGGLE-tagged children
        const toggleChildren: IWindow[] = [];
        (this._window as IWindowContainer).groupChildrenWithTag('TOGGLE', toggleChildren, -1);

        // Determine the visibility tag for this state
        let visibilityTag: string | null = null;

        switch(state) 
        {
            case 'HTE_STATE_GAME_CENTER_VIEW':
                visibilityTag = 'VISIBLE_GAME_CENTER';
                this._window.position = {...BottomBarLeft.DEFAULT_LOCATION};
                break;
            case 'HTE_STATE_HOTEL_VIEW':
                visibilityTag = 'VISIBLE_HOTEL';
                this._window.position = {...BottomBarLeft.LANDING_VIEW_LOCATION};
                break;
            case 'HTE_STATE_NOOB_NOT_HOME':
                visibilityTag = 'VISIBLE_NOOB';
                this._window.position = {...BottomBarLeft.DEFAULT_LOCATION};
                break;
            case 'HETE_STATE_NOOB_HOME':
                visibilityTag = 'VISIBLE_ROOM';
                this._window.position = {...BottomBarLeft.DEFAULT_LOCATION};
                break;
            case 'HTE_STATE_ROOM_VIEW':
                visibilityTag = 'VISIBLE_ROOM';
                this._window.position = {...BottomBarLeft.DEFAULT_LOCATION};
                break;
            case 'HTE_STATE_COLLAPSED':
                visibilityTag = 'VISIBLE_COLLAPSED';
                this._window.position = {...BottomBarLeft.DEFAULT_LOCATION};
                break;
        }

        // Determine if we're in a room-like state (for CAMERA / WIRED_MENU)
        const isRoomState = state === 'HTE_STATE_ROOM_VIEW'
            || state === 'HETE_STATE_NOOB_HOME'
            || state === 'HTE_STATE_NOOB_NOT_HOME'
            || (this._collapsed && (
                this._lastState === 'HTE_STATE_ROOM_VIEW'
                || this._lastState === 'HETE_STATE_NOOB_HOME'
                || this._lastState === 'HTE_STATE_NOOB_NOT_HOME'
            ));

        // Set visibility of each TOGGLE child based on its tags
        for(const child of toggleChildren) 
        {
            if(!child) continue;

            child.visible = visibilityTag !== null && child.tags.indexOf(visibilityTag) >= 0;

            // Apply specific per-icon rules
            if(child.name === 'STORIES' && !this._collapsed)
            {
                child.visible = child.visible && this._toolbar!.getBoolean('toolbar.stories.enabled');
            }
            else if(child.name === 'BUILDER' && !this._collapsed) 
            {
                child.visible = child.visible && this._toolbar!.getBoolean('builders.club.enabled');
            }
            else if(child.name === 'GAMES') 
            {
                child.visible = child.visible && this._toolbar!.getBoolean('games_icon_enabled');
            }
            else if(child.name === 'CAMERA')
            {
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::setToolbarState()
                // `_loc2_.visible &&= _loc4_ && _loc5_ == "bottom-icons" && _loc6_` - a compound AND,
                // preserving the by-tag visibility set above. A plain `=` overwrites it instead,
                // which happens to coincide with AS3 for every current tag on CAMERA
                // (TOGGLE/VISIBLE_ROOM/VISIBLE_COLLAPSED/VISIBLE_NOOB) but would diverge the moment
                // a tag changes.
                const cameraPosition = this._toolbar!.getProperty('camera.launch.ui.position');
                const cameraAllowed = this._toolbar!.sessionDataManager?.isPerkAllowed?.(PerkType.CAMERA) ?? false;
                child.visible = child.visible && isRoomState && cameraPosition === 'bottom-icons' && cameraAllowed;
            }
            else if(child.name === 'WIRED_MENU')
            {
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::setToolbarState()
                // `_loc2_.visible &&= _loc4_ && _toolbar.roomEvents != null && _toolbar.roomEvents.showToolbarMenuButton();`
                // The RPG fork removed wired, so `roomEvents` is always null and AS3's own guard
                // makes this false. The icon is still in the shipped layout until it is cleaned.
                child.visible = false;
            }
        }

        this.checkSize();
    }

    /**
     * Set the visibility of a toolbar icon by name
     *
     * Finds the child window by name and sets its visible property.
     *
     * @param iconName Icon name string
     * @param visible Whether the icon should be visible
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as iconVisibility()
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::iconVisibility()
    public iconVisibility(iconName: string, visible: boolean): void 
    {
        if(!this._window || !iconName) return;

        const child = (this._window as IWindowContainer).findChildByName(iconName);

        if(child) 
        {
            child.visible = visible;
        }

        this.checkSize();
    }

    /**
     * Calculate the number of visible toolbar icons
     *
     * Collects all TOGGLE-tagged children and counts the visible ones.
     *
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as calculateNewWidth()
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::calculateNewWidth()
    public calculateNewWidth(): number 
    {
        if(!this._window) return 1;

        const toggleChildren: IWindow[] = [];
        (this._window as IWindowContainer).groupChildrenWithTag('TOGGLE', toggleChildren, -1);

        let count = 1;

        for(const child of toggleChildren) 
        {
            if(child && child.visible) 
            {
                count++;
            }
        }

        return count;
    }

    /**
     * Get the icon location rectangle for a given icon id
     *
     * Maps the icon ID to a child name, finds the child, and returns
     * its global rectangle.
     *
     * @param iconId Icon identifier
     * @returns Rectangle or null if not found
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as getIconLocation()
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::getIconLocation()
    public getIconLocation(iconId: string): { x: number; y: number; width: number; height: number } | null 
    {
        if(!this._window) return null;

        const iconName = this.getIconChildName(iconId);

        if(!iconName) return null;

        const child = (this._window as IWindowContainer).findChildByName(iconName);

        if(child && child.visible) 
        {
            const rect = {x: 0, y: 0, width: 0, height: 0};
            child.getGlobalRectangle(rect);
            return rect;
        }

        return null;
    }

    /**
     * Set the unseen item count for a toolbar icon
     *
     * Finds (or lazily creates via windowManager.createUnseenItemCounter()) the
     * counter window, attaches it to the icon, positions it flush to the icon's
     * right edge, and sets its visibility/caption.
     *
     * @param iconId Icon identifier
     * @param count The count to display
     * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::setUnseenItemCount()
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::setUnseenItemCount()
    public setUnseenItemCount(iconId: string, count: number): void
    {
        const counter = this.getUnseenItemCounter(iconId);

        if(!counter) return;

        if(count < 0)
        {
            counter.visible = true;
            (counter.findChildByName('count') as IWindow | null)!.caption = ' ';
        }
        else if(count > 0)
        {
            counter.visible = true;
            (counter.findChildByName('count') as IWindow | null)!.caption = count.toString();
        }
        else
        {
            counter.visible = false;
        }
    }

    /**
     * Get (creating on first use) the unseen-item counter window for an icon.
     *
     * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::getUnseenItemCounter()
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::getUnseenItemCounter()
    public getUnseenItemCounter(iconId: string): IWindowContainer | null
    {
        const iconName = HabboToolbarIconEnum.getIconName(iconId);

        if(!iconName)
        {
            log.warn(`Unknown icon type for unseen item counter for iconId: ${iconId}`);
        }

        let counter = (this._unseenItemCounters.get(iconId) ?? null) as IWindowContainer | null;

        if(!counter && iconName && this._window && this._windowManager)
        {
            const created = this._windowManager.createUnseenItemCounter();

            if(created && iconName)
            {
                const iconWindow = (this._window as IWindowContainer).findChildByName(iconName) as IWindowContainer | null;

                if(iconWindow)
                {
                    if(iconId === 'HTIE_ICON_MEMENU')
                    {
                        created.setParamFlag(16, false);
                    }

                    iconWindow.addChild(created as unknown as IWindow);
                    (created as unknown as IWindow).x = iconWindow.width - (created as unknown as IWindow).width - BottomBarLeft.COUNTER_MARGIN;
                    (created as unknown as IWindow).y = 0;
                    this._unseenItemCounters.set(iconId, created);
                    counter = created;
                }
            }
        }

        return counter ?? null;
    }

    /**
     * Get the toolbar state most recently applied by setToolbarState()
     * (HTE_STATE_COLLAPSED does not overwrite it - see setToolbarState()).
     *
     * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::getToolbarState()
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::getToolbarState()
    public getToolbarState(): string
    {
        return this._lastState;
    }

    /**
     * Get the toolbar icon window for an icon identifier.
     *
     * AS3's own name for this method ("geIcon", not "getIcon") is kept in the
     * trace comment only - the TS method is spelled correctly.
     *
     * Half the toolbar's icons live in the two sub-menus rather than on the bar itself, so a miss
     * on the bar is not an answer — it is a reason to ask the me-menu and then the prog-menu.
     * Their own `getIcon()` reveals the sub-menu window when it holds the icon, which is what
     * makes an icon that has never been shown measurable by a caller positioning against it.
     *
     * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::geIcon()
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::geIcon()
    public getIcon(iconId: string): IWindow | null
    {
        const iconName = this.getIconChildName(iconId);

        if(!iconName) return null;

        // AS3 passes the *raw* id to the sub-menus and the mapped child name only to the bar:
        // a sub-menu names its children by the icon id itself.
        const onBar = this._window === null
            ? null
            : (this._window as IWindowContainer).findChildByName(iconName);

        return onBar ?? this._meMenuController?.getIcon(iconId) ?? this._progMenuController?.getIcon(iconId) ?? null;
    }

    /**
	 * Enable/disable the catalog toolbar icon and its "new items" badge as the catalog's
	 * readiness and unseen-item state changes, and auto-open a deep-linked catalog page
	 * once the catalog becomes ready.
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::onCatalogEvent()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::onCatalogEvent()
    public onCatalogEvent(event: CatalogEvent): void
    {
        switch(event.type)
        {
            case CatalogEvent.CATALOG_INITIALIZED:
            {
                const icon = this.getCatalogIcon();

                if(icon)
                {
                    icon.blend = 1;
                    icon.enable();
                }

                const pageToOpen = this._toolbar?.getProperty('open.catalog.page') ?? '';

                if(pageToOpen.length > 0 && this._toolbar?.catalog)
                {
                    this._toolbar.catalog.openCatalogPage('hc_membership');
                    this._toolbar.setProperty('open.catalog.page', '');
                }

                break;
            }
            case CatalogEvent.CATALOG_NOT_READY:
                this.disableCatalogIcon();
                break;
            case CatalogEvent.CATALOG_NEW_ITEMS_SHOW:
                if(this._newItemsLabel && this._newItemsNotificationEnabled)
                {
                    this._newItemsLabel.visible = true;
                }

                break;
            case CatalogEvent.CATALOG_NEW_ITEMS_HIDE:
                if(this._newItemsLabel)
                {
                    this._newItemsLabel.visible = false;
                }

                break;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::disableCatalogIcon()
    private disableCatalogIcon(): void
    {
        const icon = this.getCatalogIcon();

        if(!icon) return;

        icon.blend = 0.5;
        icon.disable();
    }

    // TS-only: shared lookup for the CATALOGUE icon, used by both onCatalogEvent() and
    // disableCatalogIcon() (AS3 repeats the same findChildByName() call in each).
    private getCatalogIcon(): IWindow | null
    {
        if(!this._window) return null;

        const iconName = HabboToolbarIconEnum.getIconName('HTIE_ICON_CATALOGUE');

        return iconName ? (this._window as IWindowContainer).findChildByName(iconName) : null;
    }

    /**
     * Check if new items notification is enabled
     *
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as isNewItemsNotificationEnabled()
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::isNewItemsNotificationEnabled()
    public isNewItemsNotificationEnabled(): boolean 
    {
        if(!this._toolbar) return false;
        return this._toolbar.getBoolean('toolbar.new_additions.notification.enabled');
    }

    /**
     * Handle a received link event
     *
     * @param link The link string
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as linkReceived()
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::linkReceived()
    public linkReceived(link: string): void 
    {
        const parts = link.split('/');

        if(parts.length < 2) return;

        switch(parts[1]) 
        {
            case 'memenu':
                this._meMenuController?.toggleVisibility();
                break;
            case 'highlight':
                if(parts.length <= 2) return;
                // Highlight handling is delegated to the UI layer
                break;
            default:
                log.warn(`Toolbar unknown link-type received: ${parts[1]}`);
        }
    }

    /**
     * Get the toolbar area width
     *
     * In AS3, returns the line separator position when not collapsed,
     * or the COLLAPSED_MARGIN when collapsed.
     *
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as getToolbarAreaWidth()
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::getToolbarAreaWidth()
    public getToolbarAreaWidth(): number 
    {
        if(!this._lineSeparator || !this._lineSeparator.parent) 
        {
            return 0;
        }

        return this._collapsed
            ? BottomBarLeft.COLLAPSED_MARGIN
            : this._lineSeparator.x + this._lineSeparator.parent.x;
    }

    /**
     * Toggle collapse state
     *
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as onCollapseToolsBar()
     */
    public toggleCollapse(): void 
    {
        this._collapsed = !this._collapsed;

        if(this._collapsed) 
        {
            this.setToolbarState('HTE_STATE_COLLAPSED');
        }
        else 
        {
            this.setToolbarState(this._lastState);
        }

        this.checkSize();
        this._toolbar?.roomUI?.triggerbottomBarResize();
    }

    /**
     * Animate a bitmap from a source position to a toolbar icon.
     *
     * Creates a temporary BitmapWrapper window at the source position,
     * adds it to the overlay desktop layer, then animates it toward the
     * target icon with a JumpBy + EaseOut motion. When the animation
     * arrives, the target icon plays a DropBounce.
     *
     * @param iconId The target icon identifier (e.g. 'HTIE_ICON_INVENTORY')
     * @param bitmap The bitmap to animate (ownership is transferred)
     * @param startX Source X position in global coordinates
     * @param startY Source Y position in global coordinates
     * @returns The fly motion, or null if the icon was not found
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as animateToIcon()
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::animateToIcon()
    public animateToIcon(iconId: string, bitmap: ImageBitmap | null, startX: number, startY: number): Motion | null 
    {
        if(!this._windowManager || !this._window) return null;

        const defaultSize = 20;
        const bitmapWidth = bitmap ? bitmap.width : defaultSize;
        const bitmapHeight = bitmap ? bitmap.height : defaultSize;

        // Create a temporary BitmapWrapper window at the source position
        const transitionWindow = this._windowManager.create(
            'ToolBarTransition',
            21, // BITMAP_WRAPPER type
            0,
            0,
            {x: startX, y: startY, width: bitmapWidth, height: bitmapHeight}
        ) as unknown as IBitmapWrapperWindow;

        if(bitmap) 
        {
            transitionWindow.bitmap = bitmap;
            transitionWindow.disposesBitmap = true;
        }

        // Add to the overlay desktop layer (layer 2)
        const overlayDesktop = this._windowManager.getDesktop(2);

        if(overlayDesktop) 
        {
            (overlayDesktop as unknown as IWindowContainer).addChild(transitionWindow as unknown as IWindow);
        }

        // Find the target icon child window
        const iconChildName = this.getIconChildName(iconId);
        let targetWindow: IWindow | null = null;

        if(iconChildName) 
        {
            targetWindow = (this._window as IWindowContainer).findChildByName(iconChildName);
        }

        if(!targetWindow) 
        {
            (transitionWindow as unknown as IWindow).dispose();
            return null;
        }

        // Calculate positions
        const sourceRect = {x: 0, y: 0, width: 0, height: 0};
        (transitionWindow as unknown as IWindow).getGlobalRectangle(sourceRect);

        const targetRect = {x: 0, y: 0, width: 0, height: 0};
        targetWindow.getGlobalRectangle(targetRect);

        const dx = sourceRect.x - targetRect.x;
        const dy = sourceRect.y - targetRect.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Duration decreases with distance (max ~500ms)
        const duration = 500 - Math.abs(1 / distance * 100 * 500 * 0.5);
        const bounceOffset = 20;

        // DropBounce on the target icon when the fly animation arrives
        const bounceTag = 'ToolBarBouncing[ ' + iconChildName + ' ]';

        if(!Motions.getMotionByTag(bounceTag)) 
        {
            Motions.runMotion(
                new Queue(new Wait(duration + 8), new DropBounce(targetWindow, 400, 12))
            ).tag = bounceTag;
        }

        // JumpBy fly animation from source to target, then dispose the temp window
        const transitionIWindow = transitionWindow as unknown as IWindow;
        const flyMotion: Motion = new Queue(
            new EaseOut(
                new JumpBy(
                    transitionIWindow,
                    duration,
                    targetRect.x - sourceRect.x + bounceOffset,
                    targetRect.y - sourceRect.y,
                    100,
                    1
                ),
                1
            ),
            new Dispose(transitionIWindow)
        );

        return Motions.runMotion(flyMotion);
    }

    /**
     * Set bitmap data for a toolbar icon.
     *
     * In AS3, this sets BitmapData on the MEMENU's icon_me_menu child,
     * caching the previous bitmap for hover state restoration.
     *
     * @param iconId - The icon identifier (e.g. 'HTIE_ICON_MEMENU')
     * @param bitmap - The ImageBitmap to set
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as setIconBitmap()
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::setIconBitmap()
    public setIconBitmap(iconId: string, bitmap: ImageBitmap | null): void 
    {
        if(iconId !== 'HTIE_ICON_MEMENU') return;

        if(this._meMenuIcon) 
        {
            this._meMenuIcon.bitmapData = bitmap;
            (this._meMenuIcon as unknown as IWindow).invalidate();
        }
    }

    /**
     * Dispose of this view and all its resources
     *
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as dispose()
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::dispose()
    public dispose(): void 
    {
        if(this._disposed) return;

        this._toolbar?.context.removeLinkEventTracker(this);

        if(this._meMenuController)
        {
            this._meMenuController.dispose();
            this._meMenuController = null;
        }

        if(this._progMenuController)
        {
            this._progMenuController.dispose();
            this._progMenuController = null;
        }

        if(this._window)
        {
            this._window.removeEventListener(WindowEvent.WE_PARENT_RESIZED, this.onParentResized);
            this._window.dispose();
            this._window = null;
        }

        if(this._newItemsLabel) 
        {
            this._newItemsLabel.dispose();
            this._newItemsLabel = null;
        }

        this._unseenItemCounters.clear();
        this._buttonContainer = null;
        this._leftArrow = null;
        this._rightArrow = null;
        this._meMenuIcon = null;
        this._lineSeparator = null;
        this._toolbar = null;
        this._windowManager = null;
        this._disposed = true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::getIconName()
    // This is BottomBarLeft's own private bitmap-child-name switch, distinct from
    // HabboToolbarIconEnum.getIconName() (which returns short labels like "CATALOGUE" for a
    // different purpose). Delegating to the enum's version here returned the wrong string:
    // findChildByName() still resolved *something* (the layout ships both name families), but to
    // the icon's clickable container, not the icon bitmap itself - shifting the rect
    // getIconLocation() returns (used by createTransitionToIcon()'s fly-to-toolbar animation and
    // the welcome screen) off the actual icon.
    private getIconChildName(iconId: string): string | null
    {
        switch(iconId)
        {
            case 'HTIE_ICON_CATALOGUE': return 'icons_toolbar_catalogue';
            case 'HTIE_ICON_INVENTORY': return 'icons_toolbar_inventory';
            case 'HTIE_ICON_MEMENU': return 'MEMENU';
            case 'HTIE_ICON_NAVIGATOR': return 'icons_toolbar_navigator';
            case 'HTIE_ICON_PROGRESSION': return 'icons_toolbar_progression';
            case 'HTIE_ICON_GAMES': return 'icons_toolbar_games';
            case 'HTIE_ICON_STORIES': return 'icons_toolbar_stories';
            case 'HTIE_ICON_RECEPTION': return 'icons_toolbar_reception';
            case 'HTIE_ICON_BUILDER': return 'icons_toolbar_builder';
            case 'HTIE_ICON_CAMERA': return 'icons_toolbar_camera';
            default: return null;
        }
    }

    /**
     * Recalculate the toolbar size and position
     *
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as checkSize()
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::checkSize()
    private checkSize(): void 
    {
        if(!this._window || !this._windowManager) 
        {
            return;
        }

        if(this._leftArrow) 
        {
            this._leftArrow.visible = !this._collapsed;
        }

        if(this._rightArrow) 
        {
            this._rightArrow.visible = this._collapsed;
        }

        // Position at the bottom of the desktop
        const desktop = this._window.desktop;

        if(desktop) 
        {
            this._window.y = desktop.height - this._window.height;
        }

        // Width = ICON_REGION_WIDTH * visibleCount + WINDOW_RIGHT_PADDING + COLLAPSED_MARGIN_BASE
        this._window.width = BottomBarLeft.ICON_REGION_WIDTH * this.calculateNewWidth()
            + BottomBarLeft.WINDOW_RIGHT_PADDING + 150;

        if(!this._collapsed && this._meMenuController)
        {
            this._meMenuController.reposition();
        }

        if(!this._collapsed && this._progMenuController)
        {
            this._progMenuController.reposition();
        }

        this._window.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::onParentResized()
    private onParentResized = (): void => 
    {
        this.checkSize();
    };

    /**
     * Handle icon click events
     *
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as onIconClick()
     */
    private onIconClick = (event: WindowEvent): void => 
    {
        if(!this._toolbar) return;

        const window = event.window;

        if(!window) return;

        const iconName = window.name;

        log.debug(`Icon clicked: ${iconName}`);

        this._toolbar.toggleWindowVisibility(iconName);

        if(this._windowManager) 
        {
            this._windowManager.hideMatchingHint(iconName);
        }
    };

    /**
     * Handle icon hover mouse events (OVER / OUT).
     *
     * Finds the ICON_BMP and ICON_BORDER children of the target region,
     * then swaps the bitmap asset and background color.
     *
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as onIconHoverMouseEvent()
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::onIconHoverMouseEvent()
    private onIconHoverMouseEvent = (event: WindowEvent): void =>
    {
        const target = event.window as unknown as IWindowContainer;

        if(!target) return;

        const iconBorder = target.findChildByTag?.('ICON_BORDER') as IWindowContainer | null;
        const iconBmp = target.findChildByTag?.('ICON_BMP') ?? null;

        switch(event.type)
        {
            case WindowMouseEvent.OVER:
                this.setIconHoverState(iconBmp, BottomBarLeft.ICON_MOUSE_OVER);
                this.setIconBgHoverState(iconBorder, BottomBarLeft.ICON_MOUSE_OVER);

                if((event.window as unknown as IWindow)?.name === 'NAVIGATOR')
                {
                    this.onNaviHover(event);
                }
                break;
            case WindowMouseEvent.OUT:
                this.setIconHoverState(iconBmp, BottomBarLeft.ICON_MOUSE_OUT);
                this.setIconBgHoverState(iconBorder, BottomBarLeft.ICON_MOUSE_OUT);

                if((event.window as unknown as IWindow)?.name === 'NAVIGATOR')
                {
                    this.onNaviHover(event);
                }
                break;
        }
    };

    /**
     * Show/hide the navigator's toolbar hover preview when the NAVIGATOR icon
     * is hovered.
     *
     * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::onNaviHover()
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/BottomBarLeft.as::onNaviHover()
    private onNaviHover(event: WindowEvent): void
    {
        const navigator = this._toolbar!.newNavigator;

        if(!navigator) return;

        switch(event.type)
        {
            case WindowMouseEvent.OVER:
            {
                const rect = this.getIconLocation('HTIE_ICON_NAVIGATOR');

                if(rect)
                {
                    navigator.showToolbarHover({x: rect.x + rect.width + 15, y: rect.y});
                }

                break;
            }
            case WindowMouseEvent.OUT:
                navigator.hideToolbarHover(true);
                break;
        }
    }

    /**
     * Swap the icon bitmap asset between _normal and _hover.
     *
     * If the child is IStaticBitmapWrapperWindow, sets assetUri = name + suffix.
     * If it's IBitmapWrapperWindow named "icon_me_menu", restores the cached bitmap.
     *
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as setIconHoverState()
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::setIconHoverState()
    private setIconHoverState(iconBmp: IWindow | null, suffix: string): void 
    {
        if(!iconBmp) return;

        // IStaticBitmapWrapperWindow — swap between _normal and _hover variants
        const sbmp = iconBmp as unknown as IStaticBitmapWrapperWindow;

        if(typeof sbmp.assetUri === 'string') 
        {
            // Only swap if the current assetUri already has a _normal/_hover suffix.
            // Assets loaded from the XML variable (e.g. "bottom_bar_home") have no
            // suffix and no hover variants — skip the swap for those.
            if(sbmp.assetUri.endsWith('_normal') || sbmp.assetUri.endsWith('_hover')) 
            {
                const base = sbmp.assetUri.replace(/_(?:normal|hover)$/, '');
                sbmp.assetUri = base + suffix;
            }

            return;
        }

        // IBitmapWrapperWindow (me menu icon) — restore cached bitmap
        const bbmp = iconBmp as unknown as IBitmapWrapperWindow;

        if(bbmp.bitmapData !== undefined && iconBmp.name === BottomBarLeft.ME_MENU_ICON_NAME) 
        {
            // In AS3, restores var_2595 (_meMenuNormalBitmap)
            // For now, we don't swap — the me menu always shows its current bitmap
        }
    }

    /**
     * Change the ICON_BORDER background color on hover.
     *
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as setIconBgHoverState()
     */
    // AS3: .../src/com/sulake/habbo/toolbar/BottomBarLeft.as::setIconBgHoverState()
    private setIconBgHoverState(border: IWindowContainer | null, suffix: string): void 
    {
        if(!border) return;

        if(suffix === BottomBarLeft.ICON_MOUSE_OVER) 
        {
            (border as unknown as IWindow).color = BottomBarLeft.ICON_BG_COLOR_OVER;
        }
        else 
        {
            (border as unknown as IWindow).color = BottomBarLeft.ICON_BG_COLOR_OUT;
        }
    }

    /**
     * Handle collapse/expand toolbar click
     *
     * @see sources/win63_version/habbo/toolbar/BottomBarLeft.as onCollapseToolsBar()
     */
    private onCollapseToolbar = (): void => 
    {
        this.toggleCollapse();
    };

    /**
     * Load the placeholder image for the MEMENU icon.
     *
     * Requests the 'icons_toolbar_me_menu_placeholder' asset from the
     * ResourceManager and sets it as the bitmapData on the icon_me_menu
     * BitmapWrapper window.
     */
    private loadMeMenuPlaceholder(): void 
    {
        if(!this._meMenuIcon || !this._window) return;

        const context = (this._window as unknown as IWindow).context;

        if(!context) return;

        const resourceManager = context.getResourceManager();

        if(!resourceManager) return;

        const iconWindow = this._meMenuIcon;
        const receiver: IAssetReceiver =
            {
                disposed: false,
                receiveAsset(bitmap: ImageBitmap): void 
                {
                    if(iconWindow) 
                    {
                        iconWindow.bitmapData = bitmap;
                        (iconWindow as unknown as IWindow).invalidate();
                    }
                },
                dispose(): void 
                {
                    (this as { disposed: boolean }).disposed = true;
                }
            };

        resourceManager.retrieveAsset('icons_toolbar_me_menu_placeholder', receiver);
    }
}
