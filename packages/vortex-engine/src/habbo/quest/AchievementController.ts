import type {IDisposable} from '@core/runtime';
import type {IFrameWindow} from '@core/window/components/IFrameWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IWindow} from '@core/window/IWindow';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import type {IBadgeImageWidget} from '@habbo/window/widgets/IBadgeImageWidget';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {HabboQuestEngine} from './HabboQuestEngine';
import {AchievementCategories} from './AchievementCategories';
import type {AchievementCategory, AchievementData} from './AchievementCategory';
import {ProgressBar} from './ProgressBar';
import {UnseenAchievementsCountUpdateEvent} from './events/UnseenAchievementsCountUpdateEvent';
import {EventLogMessageComposer} from '@habbo/communication/messages/outgoing/tracking/EventLogMessageComposer';
import {GetAchievementsComposer} from '@habbo/communication/messages/outgoing/inventory/achievements/GetAchievementsComposer';
import {Logger} from '@core/utils/Logger';

const log = Logger.getLogger('habbo.quest.AchievementController');

/**
 * Achievement controller — data + the Achievements panel window.
 *
 * The click path is: toolbar/me-menu → HabboQuestEngine.showAchievements() →
 * this.show(). show() requests the achievement list; the window is built and shown
 * only once the server answers (onAchievements), matching AS3 exactly.
 *
 * The request/response wire path is registered (GetAchievements out = 2435,
 * Achievements in = 1969; see HabboMessages), so the panel populates and renders
 * against any server that implements achievements. The reference Arcturus-Community
 * server does not — it ships an empty stub (docs/CLIENT-SERVER-ARCHITECTURE.md §20) —
 * so no response arrives there and the window never opens, which is correct client
 * behaviour, not a bug in this file.
 *
 * Two AS3 mechanisms are intentionally not ported, both noted at their would-be call
 * sites: the `_badgeImages`/100ms-Timer/`onBadgeImageReady` badge-load coalescing (the
 * port's BadgeImageWidget already loads and caches its own asset via ResourceManager,
 * so no external coalescing is needed), and `_questEngine.wired` room-achievement
 * filtering in `achievementIsVisible` (the RPG fork removed wired, so the "wired_games"
 * category — the only one this filter applies to — shows nothing).
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/AchievementController.as
 */
export class AchievementController implements IDisposable
{
    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::CATEGORIES_COLUMN_COUNT
    private static readonly CATEGORIES_COLUMN_COUNT: number = 3;
    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::CATEGORY_SPACING_X
    private static readonly CATEGORY_SPACING_X: number = 8;
    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::CATEGORY_SPACING_Y
    private static readonly CATEGORY_SPACING_Y: number = 5;
    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::CATEGORY_SPACING_TOP
    private static readonly CATEGORY_SPACING_TOP: number = 6;
    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::CATEGORY_ROWS_MAX
    private static readonly CATEGORY_ROWS_MAX: number = 3;
    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::ACHIEVEMENT_ROWS_MIN
    private static readonly ACHIEVEMENT_ROWS_MIN: number = 2;
    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::ACHIEVEMENT_ROWS_MAX
    private static readonly ACHIEVEMENT_ROWS_MAX: number = 4;
    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::ACHIEVEMENT_COLUMNS
    private static readonly ACHIEVEMENT_COLUMNS: number = 6;
    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::IN_LEVEL_PROGRESS_BAR_WIDTH
    private static readonly IN_LEVEL_PROGRESS_BAR_WIDTH: number = 180;
    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::TOTAL_PROGRESS_BAR_WIDTH
    private static readonly TOTAL_PROGRESS_BAR_WIDTH: number = 246;
    private static readonly UNSEEN_HIGHLIGHT_COLOR: number = 12910463;
    private static readonly WINDOW_BOTTOM_MARGIN: number = 45;
    private static readonly WINDOW_TOP_Y: number = 20;
    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::ACHIEVEMENT_TOP_SPACING
    private static readonly ACHIEVEMENT_TOP_SPACING: number = 3;
    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::IN_LEVEL_PROGRESS_BAR_LOC
    private static readonly IN_LEVEL_PROGRESS_BAR_LOC = {x: 115, y: 93};
    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::TOTAL_PROGRESS_BAR_LOC
    private static readonly TOTAL_PROGRESS_BAR_LOC = {x: 72, y: 1};
    private static readonly PENDING_LEVEL_DELAY_MS: number = 2000;
    private static readonly COLUMN_LAYOUT_START_Y: number = 0;
    private static readonly COLUMN_LAYOUT_SPACING: number = 4;

    private _engine: HabboQuestEngine | null;
    private _unseenAchievements: Map<number, AchievementData> = new Map();
    private _initialized: boolean = false;

    constructor(engine: HabboQuestEngine)
    {
        this._engine = engine;
    }

    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::_categories
    private _categories: AchievementCategories | null = null;

    // AS3: _window — the Achievements panel, built lazily by prepareWindow(). Stays null
    // until the server sends achievements (see class note), so isVisible() is false and
    // onToolbarClick() keeps requesting.
    private _window: IFrameWindow | null = null;

    private _categoriesContainer: IWindowContainer | null = null;
    private _achievementsHeaderContainer: IWindowContainer | null = null;
    private _achievementsContainer: IWindowContainer | null = null;
    private _achievementDetailsContainer: IWindowContainer | null = null;
    private _categoriesFooterContainer: IWindowContainer | null = null;
    private _inLevelProgressBar: ProgressBar | null = null;
    private _totalProgressBar: ProgressBar | null = null;

    // AS3: _SafeStr_4689 — the category currently drilled into (null = grid view).
    private _selectedCategory: AchievementCategory | null = null;
    // AS3: _SafeStr_4628 — the achievement currently shown in the details panel.
    private _selectedAchievement: AchievementData | null = null;
    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::_pendingCategorySelect
    private _pendingCategorySelect: string | null = null;
    // AS3: _SafeStr_7067 — the just-arrived next-level data, held until the progress
    // bar's 2s "hold at max" pause finishes (switchIntoPendingLevel).
    private _pendingLevelAchievement: AchievementData | null = null;
    private _pendingLevelTimer: ReturnType<typeof setTimeout> | null = null;

    // AS3: _SafeStr_8325 — "show once the list arrives" flag set by show()/consumed by
    // onAchievements().
    private _showPending: boolean = false;

    /**
	 * Get the achievement categories
	 */
    get categories(): AchievementCategories | null
    {
        return this._categories;
    }

    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    /**
	 * Handle achievement list received from server
	 *
	 * @param achievements Array of achievement data
	 * @param defaultCategory The default category to select
	 */
    // AS3: AchievementController.as::onAchievements()
    onAchievements(achievements: AchievementData[], defaultCategory: string): void
    {
        if(this._categories === null)
        {
            this._categories = new AchievementCategories(achievements);
        }

        this._initialized = true;

        log.info(`Achievements loaded: ${achievements.length} achievements, default category: ${defaultCategory}`);

        // AS3: only surface the window if a show() is pending; otherwise this is just a
        // data refresh in the background.
        if(!this._showPending)
        {
            return;
        }

        this._showPending = false;
        this.refresh();

        if(this._window !== null)
        {
            this._window.visible = true;
            this._window.activate();
        }

        const code = this._pendingCategorySelect ?? defaultCategory;
        const category = this._categories.getCategoryByCode(code);

        if(category !== null)
        {
            this.pickCategory(category);
            this._pendingCategorySelect = null;
        }
    }

    /**
	 * Handle a single achievement update from the server
	 *
	 * @param data The updated achievement data
	 */
    // AS3: AchievementController.as::onAchievement()
    onAchievement(data: AchievementData): void
    {
        if(this._categories === null)
        {
            return;
        }

        const isSelected = this._selectedAchievement !== null
            && this._selectedAchievement.achievementId === data.achievementId;

        if(!isSelected && !this._unseenAchievements.has(data.achievementId))
        {
            this._unseenAchievements.set(data.achievementId, data);
            this.broadcastUnseenAchievementsCount();
        }

        if(isSelected && this._selectedAchievement !== null && data.level > this._selectedAchievement.level)
        {
            this._selectedAchievement.setMaxProgress();
            this._pendingLevelAchievement = data;

            // AS3: Timer(2000,1).start() is a no-op while already running; only arm if idle.
            if(this._pendingLevelTimer === null)
            {
                this._pendingLevelTimer = setTimeout(
                    () => this.switchIntoPendingLevel(),
                    AchievementController.PENDING_LEVEL_DELAY_MS
                );
            }
        }
        else
        {
            this._categories.update(data);

            if(isSelected)
            {
                this._selectedAchievement = data;
            }
        }

        if(this._window !== null && this._window.visible)
        {
            this.refresh();
        }
    }

    /**
	 * Ensure achievements have been requested from the server.
	 * If not yet loaded, sends the request.
	 */
    // AS3: AchievementController.as::ensureAchievementsInitialized()
    ensureAchievementsInitialized(): void
    {
        if(this._categories === null)
        {
            this.requestAchievements();
            this._initialized = true;
        }
    }

    /**
	 * Toggle the panel: open it if hidden, close it if shown.
	 */
    // AS3: AchievementController.as::onToolbarClick()
    onToolbarClick(): void
    {
        if(this.isVisible())
        {
            this.close();
        }
        else
        {
            this.show();
        }
    }

    /**
	 * Open the achievements panel.
	 *
	 * If the list has not been loaded yet, request it and defer showing the window until
	 * it arrives (onAchievements). Otherwise refresh the already-built window and show it.
	 */
    // AS3: AchievementController.as::show()
    show(): void
    {
        if(this._categories === null)
        {
            this.requestAchievements();
            this._showPending = true;
            return;
        }

        this.refresh();

        if(this._window !== null)
        {
            this._window.visible = true;
            this._window.activate();
        }
    }

    /**
	 * Close the achievements panel and clear unseen tracking.
	 */
    // AS3: AchievementController.as::close()
    close(): void
    {
        this._unseenAchievements.clear();
        this.broadcastUnseenAchievementsCount();

        if(this._window !== null)
        {
            this._window.visible = false;
        }
    }

    /**
	 * Whether the achievements panel is currently on screen.
	 */
    // AS3: AchievementController.as::isVisible()
    isVisible(): boolean
    {
        return this._window !== null && this._window.visible;
    }

    /**
	 * Jump straight to a category by code (used by deep links). If the category list
	 * hasn't loaded yet, remembers the code and applies it once onAchievements() arrives.
	 */
    // AS3: AchievementController.as::selectCategoryInternalLink()
    selectCategoryInternalLink(code: string): void
    {
        const category = this._categories !== null ? this._categories.getCategoryByCode(code) : null;

        if(category !== null)
        {
            this.pickCategory(category);
        }
        else
        {
            this._pendingCategorySelect = code;
        }
    }

    /**
	 * Get the user's achievement level for a given category and badge
	 *
	 * @param category The category code
	 * @param badge The badge identifier prefix
	 * @returns The user's level, or 0 if not found
	 */
    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::getAchievementLevel()
    getAchievementLevel(category: string, badge: string): number
    {
        if(this._categories === null)
        {
            return 0;
        }

        const cat = this._categories.getCategoryByCode(category);

        if(cat === null)
        {
            return 0;
        }

        for(const achievement of cat.achievements)
        {
            if(achievement.badgeId.indexOf(badge) === 0)
            {
                return achievement.finalLevel ? achievement.level : Math.max(0, achievement.level - 1);
            }
        }

        return 0;
    }

    /**
	 * Broadcast the count of unseen achievements via event
	 */
    // AS3: AchievementController.as::broadcastUnseenAchievementsCount()
    broadcastUnseenAchievementsCount(): void
    {
        if(!this._engine) return;

        let count = 0;

        for(const achievement of this._unseenAchievements.values())
        {
            if(!this.isSkippedForUnseenBroadcast(achievement.badgeId))
            {
                count++;
            }
        }

        this._engine.events.emit(
            UnseenAchievementsCountUpdateEvent.TYPE,
            new UnseenAchievementsCountUpdateEvent(count)
        );

        log.debug(`Unseen achievements count: ${count}`);
    }

    /**
	 * Handle room exit - close achievement panel
	 */
    // AS3: AchievementController.as::onRoomExit() → this.close()
    onRoomExit(): void
    {
        this.close();
    }

    /**
	 * Per-frame tick, forwarded from HabboQuestEngine.update(). Drives both progress
	 * bars' eased-fill animation.
	 */
    // AS3: AchievementController.as::update()
    update(deltaTime: number): void
    {
        this._inLevelProgressBar?.updateView(deltaTime);
        this._totalProgressBar?.updateView(deltaTime);
    }

    // AS3: AchievementController.as::isSkippedForUnseenBroadcast()
    private isSkippedForUnseenBroadcast(badgeId: string): boolean
    {
        const patterns = (this._engine?.getProperty('toolbar.unseen_notification.skipped_badge_ids') ?? '').split(',');

        for(const pattern of patterns)
        {
            if(badgeId.search(pattern) !== -1)
            {
                return true;
            }
        }

        return false;
    }

    /**
	 * Send the GetAchievements request to the server.
	 */
    // AS3: AchievementController.as::show()/ensureAchievementsInitialized() → send(new GetAchievements)
    private requestAchievements(): void
    {
        this._engine?.send(new GetAchievementsComposer());
    }

    /**
	 * Rebuild the panel from the current categories/selection.
	 */
    // AS3: AchievementController.as::refresh()
    private refresh(): void
    {
        this.prepareWindow();

        if(this._window === null) return;

        this.refreshCategoryList();
        this.refreshCategoryListFooter();
        this.refreshAchievementsHeader();
        this.refreshAchievementList();
        this.refreshAchievementDetails();

        AchievementController.moveAllChildrenToColumn(
            this._window.content, AchievementController.COLUMN_LAYOUT_START_Y, AchievementController.COLUMN_LAYOUT_SPACING
        );
        this._window.height = AchievementController.getLowestPoint(this._window.content) + AchievementController.WINDOW_BOTTOM_MARGIN;
    }

    // AS3: AchievementController.as::refreshCategoryList()
    private refreshCategoryList(): void
    {
        if(this._categoriesContainer === null || this._categories === null) return;

        if(this._selectedCategory !== null)
        {
            this._categoriesContainer.visible = false;
            return;
        }

        this._categoriesContainer.visible = true;

        const categoryList = this._categories.categoryList;
        let index = 0;

        while(true)
        {
            if(index < categoryList.length)
            {
                const category = categoryList[index];

                if(category.visibleInList())
                {
                    this.refreshCategoryEntry(index, category);
                }
            }
            else
            {
                if(this.refreshCategoryEntry(index, null))
                {
                    break;
                }
            }

            index++;
        }

        this._categoriesContainer.height = AchievementController.getLowestPoint(this._categoriesContainer);
    }

    // AS3: AchievementController.as::refreshCategoryListFooter()
    private refreshCategoryListFooter(): void
    {
        if(this._categoriesFooterContainer === null || this._categories === null || this._totalProgressBar === null) return;

        if(this._selectedCategory !== null)
        {
            this._categoriesFooterContainer.visible = false;
            return;
        }

        this._categoriesFooterContainer.visible = true;
        this._totalProgressBar.refresh(this._categories.getProgress(), this._categories.getMaxProgress(), 0, 0);
    }

    /**
     * Every achievement is visible except in one category.
     *
     * "wired_games" lists the achievements a *wired* creator can hand out, so it is filtered down
     * to the ones this room actually has a wired trigger for. The `WF_` prefix is what makes the
     * two namespaces line up: the wired subsystem reports bare codes, the achievement list carries
     * them prefixed, and an entry without the prefix belongs to no wired effect at all.
     */
    // DEVIATION: AS3 keeps the `WF_` achievements listed in `_questEngine.wired.achievementsInRoom`.
    //   The RPG fork removed wired, so nothing in "wired_games" is visible — AS3's own answer when
    //   the room has no wired achievement list.
    // AS3: AchievementController.as::achievementIsVisible()
    private achievementIsVisible(_achievement: AchievementData): boolean
    {
        return this._selectedCategory === null || this._selectedCategory.code !== 'wired_games';
    }

    // AS3: AchievementController.as::refreshAchievementList()
    private refreshAchievementList(): void
    {
        if(this._window === null || this._achievementsContainer === null) return;

        const achievementsList = this._window.findChildByName('achievements_list');

        if(achievementsList === null) return;

        if(this._selectedCategory === null)
        {
            achievementsList.visible = false;
            return;
        }

        achievementsList.visible = true;

        const achievements = this._selectedCategory.achievements;

        while(this._achievementsContainer.numChildren > 0)
        {
            this._achievementsContainer.removeChildAt(0);
        }

        let cellIndex = 0;
        let sourceIndex = 0;

        while(true)
        {
            if(sourceIndex < achievements.length)
            {
                const achievement = achievements[sourceIndex];

                if(this.achievementIsVisible(achievement))
                {
                    this.refreshAchievementEntry(cellIndex, achievement);
                    cellIndex += 1;
                }
            }
            else
            {
                const stop = this.refreshAchievementEntry(cellIndex, null);

                cellIndex += 1;

                if(stop)
                {
                    break;
                }
            }

            sourceIndex++;
        }

        this._achievementsContainer.height = AchievementController.getLowestPoint(this._achievementsContainer);
        achievementsList.height = this._achievementsContainer.height + 1;

        const scrollArea = this._window.findChildByName('achievements_scrollarea');

        if(scrollArea !== null)
        {
            scrollArea.height = achievementsList.height;
        }

        const scrollBar = this._window.findChildByName('achievements_scrollbar');

        if(scrollBar !== null)
        {
            scrollBar.visible = this.achievementsNeedScrolling;
            scrollBar.height = achievementsList.height;
        }
    }

    // AS3: AchievementController.as::refreshAchievementsHeader()
    private refreshAchievementsHeader(): void
    {
        if(this._achievementsHeaderContainer === null || this._engine === null) return;

        if(this._selectedCategory === null)
        {
            this._achievementsHeaderContainer.visible = false;
            return;
        }

        this._achievementsHeaderContainer.visible = true;

        const nameText = this._achievementsHeaderContainer.findChildByName('category_name_txt');

        if(nameText !== null)
        {
            nameText.caption = this._engine.getAchievementCategoryName(this._selectedCategory.code);
        }

        const progressText = this._achievementsHeaderContainer.findChildByName('category_progress_txt');

        if(progressText !== null)
        {
            progressText.caption = this._engine.localization?.getLocalizationWithParams(
                'achievements.details.categoryprogress', 'achievements.details.categoryprogress',
                'progress', this._selectedCategory.getProgress().toString(),
                'limit', this._selectedCategory.getMaxProgress().toString()
            ) ?? '';
        }

        this._engine.setupAchievementCategoryImage(this._achievementsHeaderContainer, this._selectedCategory, false);
    }

    // AS3: AchievementController.as::refreshAchievementDetails()
    private refreshAchievementDetails(): void
    {
        if(this._achievementDetailsContainer === null || this._engine === null || this._inLevelProgressBar === null) return;

        if(this._selectedAchievement === null)
        {
            this._achievementDetailsContainer.visible = false;
            return;
        }

        this._achievementDetailsContainer.visible = true;

        const localization = this._engine.localization;
        const badgeId = this.getAchievedBadgeId(this._selectedAchievement);

        const nameText = this._achievementDetailsContainer.findChildByName('achievement_name_txt');
        const descText = this._achievementDetailsContainer.findChildByName('achievement_desc_txt');

        if(nameText !== null)
        {
            nameText.caption = localization?.getBadgeName(badgeId) ?? '';
        }

        if(descText !== null)
        {
            descText.caption = localization?.getBadgeDesc(badgeId) ?? '';
        }

        const levelText = this._achievementDetailsContainer.findChildByName('level_txt');

        if(levelText !== null)
        {
            const level = this._selectedAchievement.finalLevel
                ? this._selectedAchievement.level
                : this._selectedAchievement.level - 1;

            levelText.caption = localization?.getLocalizationWithParams(
                'achievements.details.level', 'achievements.details.level',
                'level', String(level), 'limit', String(this._selectedAchievement.levelCount)
            ) ?? '';
        }

        this._engine.refreshReward(
            !this._selectedAchievement.finalLevel,
            this._achievementDetailsContainer,
            this._selectedAchievement.levelRewardPointType,
            this._selectedAchievement.levelRewardPoints
        );

        this.refreshBadgeImageLarge(this._achievementDetailsContainer, this._selectedAchievement);

        this._inLevelProgressBar.refresh(
            this._selectedAchievement.currentPoints,
            this._selectedAchievement.scoreLimit,
            this._selectedAchievement.achievementId * 10000 + this._selectedAchievement.level,
            this._selectedAchievement.scoreAtStartOfLevel
        );
        this._inLevelProgressBar.visible = this._selectedAchievement.displayMethod !== 1 && !this._selectedAchievement.finalLevel;
    }

    /**
	 * Build the Achievements window once (lazy).
	 */
    // AS3: AchievementController.as::prepareWindow()
    private prepareWindow(): void
    {
        if(this._window !== null)
        {
            return;
        }

        const windowManager = this._engine?.windowManager ?? null;

        if(windowManager === null)
        {
            return;
        }

        this._window = windowManager.buildWidgetLayout('Achievements') as IFrameWindow | null;

        if(this._window === null)
        {
            log.warn('Achievements layout could not be built');
            return;
        }

        const closeButton = this._window.findChildByTag('close');

        if(closeButton !== null)
        {
            closeButton.procedure = this.onWindowClose.bind(this);
        }

        const backButton = this._window.findChildByName('back_button');

        if(backButton !== null)
        {
            backButton.procedure = this.onBack.bind(this);
        }

        this._window.center();
        this._window.y = AchievementController.WINDOW_TOP_Y;

        this._categoriesContainer = this._window.findChildByName('categories_cont') as IWindowContainer | null;
        this._achievementsHeaderContainer = this._window.findChildByName('achievements_header_cont') as IWindowContainer | null;
        this._achievementsContainer = this._window.findChildByName('achievements_cont') as IWindowContainer | null;
        this._achievementDetailsContainer = this._window.findChildByName('achievement_cont') as IWindowContainer | null;
        this._categoriesFooterContainer = this._window.findChildByName('categories_footer_cont') as IWindowContainer | null;

        if(this._engine !== null && this._achievementDetailsContainer !== null)
        {
            this._inLevelProgressBar = new ProgressBar(
                this._engine, this._achievementDetailsContainer, AchievementController.IN_LEVEL_PROGRESS_BAR_WIDTH,
                'achievements.details.progress', true, AchievementController.IN_LEVEL_PROGRESS_BAR_LOC
            );
        }

        if(this._engine !== null && this._categoriesFooterContainer !== null)
        {
            this._totalProgressBar = new ProgressBar(
                this._engine, this._categoriesFooterContainer, AchievementController.TOTAL_PROGRESS_BAR_WIDTH,
                'achievements.categories.totalprogress', true, AchievementController.TOTAL_PROGRESS_BAR_LOC
            );
        }
    }

    // AS3: AchievementController.as::refreshCategoryEntry()
    private refreshCategoryEntry(index: number, category: AchievementCategory | null): boolean
    {
        if(this._categoriesContainer === null || this._engine === null) return true;

        let cell = this._categoriesContainer.getChildByName(index.toString()) as IWindowContainer | null;
        const row = Math.floor(index / AchievementController.CATEGORIES_COLUMN_COUNT);
        const withinMaxRows = row < AchievementController.CATEGORY_ROWS_MAX;

        if(cell === null)
        {
            if(category === null && !withinMaxRows)
            {
                return true;
            }

            cell = this._engine.windowManager?.buildWidgetLayout('AchievementCategory') as unknown as IWindowContainer ?? null;

            if(cell === null) return true;

            cell.name = index.toString();
            this._categoriesContainer.addChild(cell);

            const region = cell.findChildByName('category_region');

            if(region !== null)
            {
                region.procedure = this.onSelectCategory.bind(this);
            }

            cell.x = (cell.width + AchievementController.CATEGORY_SPACING_X) * (index % AchievementController.CATEGORIES_COLUMN_COUNT);
            cell.y = (cell.height + AchievementController.CATEGORY_SPACING_Y) * row + AchievementController.CATEGORY_SPACING_TOP;
        }

        const region = cell.findChildByName('category_region');

        if(region !== null)
        {
            region.id = index;
            region.visible = category !== null;
        }

        this.setChildVisible(cell, 'category_bg_inact', category === null);
        this.setChildVisible(cell, 'category_bg_act', category !== null);
        this.setChildVisible(cell, 'category_bg_act_hover', false);
        this.setChildVisible(cell, 'header_txt', category !== null);
        this.setChildVisible(cell, 'completion_txt', category !== null);
        this.setChildVisible(cell, 'category_pic_bitmap', category !== null);
        this.setChildVisible(cell, 'unseen_count_border', false);

        if(category !== null)
        {
            const headerText = cell.findChildByName('header_txt');
            const completionText = cell.findChildByName('completion_txt');

            if(headerText !== null)
            {
                headerText.caption = this._engine.getAchievementCategoryName(category.code);
            }

            if(completionText !== null)
            {
                completionText.caption = `${category.getProgress()}/${category.getMaxProgress()}`;
            }

            this._engine.setupAchievementCategoryImage(cell, category, true);

            const unseenCount = this.getCategoryUnseenCount(category.code);

            if(unseenCount > 0)
            {
                this.setChildVisible(cell, 'unseen_count_border', true);

                const unseenCaption = cell.findChildByName('unseen_count');

                if(unseenCaption !== null)
                {
                    unseenCaption.caption = unseenCount.toString();
                }
            }

            cell.visible = true;
        }
        else
        {
            cell.visible = withinMaxRows;
        }

        return false;
    }

    // AS3: AchievementController.as::refreshAchievementEntry()
    private refreshAchievementEntry(index: number, achievement: AchievementData | null): boolean
    {
        if(this._achievementsContainer === null || this._engine === null) return true;

        const row = Math.floor(index / this.achievementsColumnCount);
        const withinMinRows = row < AchievementController.ACHIEVEMENT_ROWS_MIN;

        if(achievement === null && !withinMinRows)
        {
            return true;
        }

        const cell = this._engine.windowManager?.buildWidgetLayout('Achievement') as unknown as IWindowContainer ?? null;

        if(cell === null) return true;

        this._achievementsContainer.addChild(cell);
        cell.x = (cell.width + (this.achievementsNeedScrolling ? 5 : 0)) * (index % this.achievementsColumnCount);
        cell.y = cell.height * row + AchievementController.ACHIEVEMENT_TOP_SPACING;

        const bgRegion = cell.findChildByName('bg_region');

        if(bgRegion !== null)
        {
            bgRegion.procedure = this.onSelectAchievement.bind(this);
            bgRegion.id = index;
            bgRegion.visible = achievement !== null;
        }

        const unselectedBitmap = cell.findChildByName('bg_unselected_bitmap');
        const selectedBitmap = cell.findChildByName('bg_selected_bitmap');

        this.refreshBadgeImage(cell, achievement);

        if(unselectedBitmap !== null)
        {
            unselectedBitmap.color = achievement !== null && this._unseenAchievements.has(achievement.achievementId)
                ? AchievementController.UNSEEN_HIGHLIGHT_COLOR
                : 0xFFFFFF;
        }

        if(achievement !== null)
        {
            if(unselectedBitmap !== null) unselectedBitmap.visible = achievement !== this._selectedAchievement;
            if(selectedBitmap !== null) selectedBitmap.visible = achievement === this._selectedAchievement;
            cell.visible = true;
        }
        else if(withinMinRows)
        {
            if(selectedBitmap !== null) selectedBitmap.visible = false;
            if(unselectedBitmap !== null) unselectedBitmap.visible = true;
            cell.visible = true;
        }
        else
        {
            cell.visible = false;
        }

        return false;
    }

    // AS3: AchievementController.as::onWindowClose()
    private onWindowClose(event: WindowEvent, _window: IWindow): void
    {
        if(event.type === WindowMouseEvent.CLICK)
        {
            this.close();
        }
    }

    // AS3: AchievementController.as::onSelectCategory()
    private onSelectCategory(event: WindowEvent, window: IWindow): void
    {
        const index = window.id;

        if(event.type === WindowMouseEvent.CLICK)
        {
            const category = this._categories?.categoryList[index] ?? null;

            if(category !== null)
            {
                this.pickCategory(category);
            }
        }
        else if(event.type === WindowMouseEvent.OUT)
        {
            this.refreshMouseOver(-999);
        }
        else if(event.type === WindowMouseEvent.OVER)
        {
            this.refreshMouseOver(index);
        }
    }

    // AS3: AchievementController.as::pickCategory()
    private pickCategory(category: AchievementCategory): void
    {
        this._selectedCategory = category;
        this._selectedAchievement = category.achievements[0] ?? null;

        this.refresh();

        // `_SafeCls_2175` is EventLogMessageComposer: same five fields, same order, and the
        // composer registry maps both to header 3809.
        this._engine?.send(new EventLogMessageComposer('Achievements', category.code, 'Category selected'));
    }

    // AS3: AchievementController.as::refreshMouseOver()
    private refreshMouseOver(hoveredIndex: number): void
    {
        if(this._categoriesContainer === null || this._categories === null) return;

        for(let i = 0; i < this._categoriesContainer.numChildren; i++)
        {
            const isHovered = i === hoveredIndex;
            const cell = this._categoriesContainer.getChildAt(i) as IWindowContainer | null;

            if(cell === null) continue;

            this.setChildVisible(cell, 'category_bg_act', !isHovered && i < this._categories.categoryList.length);
            this.setChildVisible(cell, 'category_bg_act_hover', isHovered);

            const hoverContainer = cell.findChildByName('hover_container');

            if(hoverContainer !== null)
            {
                hoverContainer.x = isHovered ? 0 : 1;
                hoverContainer.y = isHovered ? 0 : 1;
            }
        }
    }

    // AS3: AchievementController.as::onSelectAchievement()
    private onSelectAchievement(event: WindowEvent, window: IWindow): void
    {
        if(event.type !== WindowMouseEvent.CLICK) return;

        if(this._selectedCategory === null) return;

        this._selectedAchievement = this._selectedCategory.achievements[window.id] ?? null;
        this.refresh();

        // AS3 reads the id off the *newly* selected achievement, after the assignment above.
        this._engine?.send(new EventLogMessageComposer(
            'Achievements',
            String(this._selectedAchievement?.achievementId ?? 0),
            'Achievement selected'
        ));
    }

    // AS3: AchievementController.as::onBack()
    private onBack(event: WindowEvent, _window: IWindow): void
    {
        if(event.type !== WindowMouseEvent.CLICK) return;

        if(this._selectedCategory !== null)
        {
            const code = this._selectedCategory.code;

            for(const [id, achievement] of this._unseenAchievements)
            {
                if(achievement.category === code)
                {
                    this._unseenAchievements.delete(id);
                }
            }

            this.broadcastUnseenAchievementsCount();
        }

        this._selectedCategory = null;
        this._selectedAchievement = null;
        this.refresh();
    }

    // AS3: AchievementController.as::refreshBadgeImage()
    private refreshBadgeImage(container: IWindowContainer, achievement: AchievementData | null): void
    {
        const widgetWindow = container.findChildByName('achievement_pic_bitmap') as unknown as IWidgetWindow | null;

        if(widgetWindow === null) return;

        if(achievement === null)
        {
            widgetWindow.visible = false;
            return;
        }

        const widget = widgetWindow.widget as IBadgeImageWidget;

        AchievementController.showLoadingIcon(widgetWindow);
        widget.badgeId = this.getAchievedBadgeId(achievement);
        widget.greyscale = !achievement.firstLevelAchieved;
        widgetWindow.visible = true;
    }

    // AS3: AchievementController.as::refreshBadgeImageLarge()
    private refreshBadgeImageLarge(container: IWindowContainer, achievement: AchievementData): void
    {
        const widgetWindow = container.findChildByName('achievement_pic_bitmap') as unknown as IWidgetWindow | null;

        if(widgetWindow === null) return;

        const widget = widgetWindow.widget as IBadgeImageWidget;

        AchievementController.showLoadingIcon(widgetWindow);
        widget.badgeId = this.getAchievedBadgeId(achievement);
        widget.greyscale = !achievement.firstLevelAchieved;
        widgetWindow.visible = true;
    }

    /**
     * Both AS3 refresh helpers park the loading icon on the widget's own bitmap before handing it a
     * new badge id. Without it a badge that never loads (a missing album1584 gif, or the empty badge
     * code an ill-behaved server sends) leaves the *previous* badge on screen — the detail panel then
     * shows one achievement's artwork under another's name.
     */
    // AS3: AchievementController.as::refreshBadgeImage()
    private static showLoadingIcon(widgetWindow: IWidgetWindow): void
    {
        const root = widgetWindow.rootWindow as unknown as IWindowContainer | null;
        const bitmap = (root?.findChildByName('bitmap') ?? null) as IStaticBitmapWrapperWindow | null;

        if(bitmap !== null) bitmap.assetUri = 'common_loading_icon';
    }

    // AS3: AchievementController.as::switchIntoPendingLevel()
    private switchIntoPendingLevel(): void
    {
        this._pendingLevelTimer = null;

        if(this._pendingLevelAchievement === null || this._categories === null) return;

        this._selectedAchievement = this._pendingLevelAchievement;
        this._categories.update(this._pendingLevelAchievement);
        this._pendingLevelAchievement = null;
        this.refresh();
    }

    // AS3: AchievementController.as::getAchievedBadgeId()
    private getAchievedBadgeId(achievement: AchievementData): string
    {
        if(achievement.levelCount === 1)
        {
            return achievement.badgeId;
        }

        return achievement.finalLevel
            ? achievement.badgeId
            : this._engine?.localization?.getPreviousLevelBadgeId(achievement.badgeId) ?? achievement.badgeId;
    }

    // AS3: AchievementController.as::getCategoryUnseenCount()
    private getCategoryUnseenCount(code: string): number
    {
        let count = 0;

        for(const achievement of this._unseenAchievements.values())
        {
            if(achievement.category === code)
            {
                count++;
            }
        }

        return count;
    }

    // AS3: AchievementController.as::get achievementsColumnCount()
    private get achievementsColumnCount(): number
    {
        return this.achievementsNeedScrolling
            ? AchievementController.ACHIEVEMENT_COLUMNS - 1
            : AchievementController.ACHIEVEMENT_COLUMNS;
    }

    // AS3: AchievementController.as::get achievementsNeedScrolling()
    private get achievementsNeedScrolling(): boolean
    {
        return this._selectedCategory !== null
            && this._selectedCategory.achievements.length > AchievementController.ACHIEVEMENT_ROWS_MAX * AchievementController.ACHIEVEMENT_COLUMNS;
    }

    private setChildVisible(container: IWindowContainer, name: string, visible: boolean): void
    {
        const child = container.findChildByName(name);

        if(child !== null)
        {
            child.visible = visible;
        }
    }

    // AS3: AchievementController.as::moveAllChildrenToColumn()
    private static moveAllChildrenToColumn(container: IWindowContainer, startY: number, spacing: number): void
    {
        let y = startY;

        for(let i = 0; i < container.numChildren; i++)
        {
            const child = container.getChildAt(i);

            if(child !== null && child.visible && child.height > 0)
            {
                child.y = y;
                y += child.height + spacing;
            }
        }
    }

    // AS3: AchievementController.as::getLowestPoint()
    private static getLowestPoint(container: IWindowContainer): number
    {
        let lowest = 0;

        for(let i = 0; i < container.numChildren; i++)
        {
            const child = container.getChildAt(i);

            if(child !== null && child.visible)
            {
                lowest = Math.max(lowest, child.y + child.height);
            }
        }

        return lowest;
    }

    /**
	 * Dispose of this controller and release resources
	 */
    // AS3: .../src/com/sulake/habbo/quest/AchievementController.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        if(this._pendingLevelTimer !== null)
        {
            clearTimeout(this._pendingLevelTimer);
            this._pendingLevelTimer = null;
        }

        this._inLevelProgressBar?.dispose();
        this._inLevelProgressBar = null;
        this._totalProgressBar?.dispose();
        this._totalProgressBar = null;

        // AS3: dispose() disposes the window before releasing data.
        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
        }

        this._categoriesContainer = null;
        this._achievementsHeaderContainer = null;
        this._achievementsContainer = null;
        this._achievementDetailsContainer = null;
        this._categoriesFooterContainer = null;

        this._categories = null;
        this._unseenAchievements.clear();
        this._engine = null;
        this._disposed = true;
    }
}
