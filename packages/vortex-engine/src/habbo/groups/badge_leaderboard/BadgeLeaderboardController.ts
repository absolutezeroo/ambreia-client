/**
 * BadgeLeaderboardController — the badge leaderboard: who owns the most badges, the most of a
 * given rarity, or the highest achievement level.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/groups/badge_leaderboard/BadgeLeaderboardController.as
 *
 * Reached by link only — `badge_leaderboard/<type>/<rarity>/<page>` — which is what
 * `FurnitureBadgeDisplayWidgetHandler` and `InfoStandUserView` build through
 * `BadgeLeaderboardUtils.getLink()`.
 *
 * There are three boards, distinguished by `type`: total badges (0), badges of one rarity (1, and
 * only then does `rarity` mean anything), and achievement level (2). `normalizeType()` is what
 * stops a link asking for a rarity board with an unsupported rarity — it falls back to total
 * badges rather than showing an empty list.
 *
 * Faces are rendered per row through the avatar render manager, which answers asynchronously:
 * `avatarImageReady()` is the callback, and it re-renders only the rows whose figure matches, so a
 * page that has moved on is not repainted.
 */
import {Component, ComponentDependency, type IContext} from '@core/runtime';
import type {IAssetLibrary} from '@core/assets';
import type {IMessageComposer} from '@core/communication/messages/IMessageComposer';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {ILinkEventTracker} from '@core/runtime/events/ILinkEventTracker';
import type {IWindow} from '@core/window/IWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import {Logger} from '@core/utils/Logger';

import {IID_HabboCommunicationManager} from '@iid/IIDHabboCommunicationManager';
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {IID_AvatarRenderManager} from '@iid/IIDAvatarRenderManager';

import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IAvatarRenderManager} from '@habbo/avatar/IAvatarRenderManager';
import type {IAvatarImageListener} from '@habbo/avatar/IAvatarImageListener';
import {HabboFaceFocuser} from '@habbo/utils/HabboFaceFocuser';
import {BadgeRarityEnum} from '@habbo/communication/enum/BadgeRarityEnum';
import {
    BadgeLeaderboardMessageEvent
} from '@habbo/communication/messages/incoming/users/BadgeLeaderboardMessageEvent';
import type {
    BadgeLeaderboardEntryData
} from '@habbo/communication/messages/parser/users/BadgeLeaderboardEntryData';

import type {HabboGroupsManager} from '../HabboGroupsManager';
import {BadgeLeaderboardUtils} from '../BadgeLeaderboardUtils';
import type {IBadgeLeaderboardController} from './IBadgeLeaderboardController';
import type {BadgeLeaderboardPageData} from './BadgeLeaderboardPageData';
import {BadgeLeaderboardView} from './BadgeLeaderboardView';
import type {BadgeLeaderboardEntryView} from './BadgeLeaderboardEntryView';
import {BadgeLeaderboardDataServer} from './server/BadgeLeaderboardDataServer';

const log = Logger.getLogger('habbo.groups.badge_leaderboard.BadgeLeaderboardController');

export class BadgeLeaderboardController extends Component
    implements IBadgeLeaderboardController, IAvatarImageListener, ILinkEventTracker
{
    // AS3: BadgeLeaderboardController.as::PAGE_SIZE
    public static readonly PAGE_SIZE: number = 10;

    // AS3: BadgeLeaderboardController.as::DEFAULT_RANK_BORDER_COLOR
    private static readonly DEFAULT_RANK_BORDER_COLOR: number = 0x6382AA;

    // AS3: BadgeLeaderboardController.as::FIRST_PLACE_RANK_BORDER_COLOR
    private static readonly FIRST_PLACE_RANK_BORDER_COLOR: number = 0xD4AF37;

    /** Derived name — `_SafeStr_10624`: silver, and the only one AS3 leaves unnamed. */
    // AS3: BadgeLeaderboardController.as::_SafeStr_10624
    private static readonly SECOND_PLACE_RANK_BORDER_COLOR: number = 0xC0C0C0;

    // AS3: BadgeLeaderboardController.as::THIRD_PLACE_RANK_BORDER_COLOR
    private static readonly THIRD_PLACE_RANK_BORDER_COLOR: number = 0xCD7F32;

    // AS3: BadgeLeaderboardController.as::BASE_SUPPORTED_RARITIES
    private static readonly BASE_SUPPORTED_RARITIES: ReadonlyArray<number> = [2, 3, 4, 5, 6];

    // AS3: BadgeLeaderboardController.as::_communicationManager
    private _communicationManager: IHabboCommunicationManager | null = null;

    // AS3: BadgeLeaderboardController.as::_localizationManager
    private _localizationManager: IHabboLocalizationManager | null = null;

    // AS3: BadgeLeaderboardController.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;

    // AS3: BadgeLeaderboardController.as::_avatarRenderManager
    private _avatarRenderManager: IAvatarRenderManager | null = null;

    /** Derived name — `_SafeStr_6331`: the groups manager that owns this controller. */
    // AS3: BadgeLeaderboardController.as::_SafeStr_6331
    private _groupsManager: HabboGroupsManager | null = null;

    // AS3: BadgeLeaderboardController.as::_messageEvents
    private _messageEvents: IMessageEvent[] = [];

    /** Derived name — `_SafeStr_4550`: the window. */
    // AS3: BadgeLeaderboardController.as::_SafeStr_4550
    private _view: BadgeLeaderboardView | null = null;

    /** Derived name — `_SafeStr_6287`: the chunk cache in front of the wire. */
    // AS3: BadgeLeaderboardController.as::_SafeStr_6287
    private _dataServer: BadgeLeaderboardDataServer | null = null;

    /** Derived name — `_SafeStr_5271`: the board on screen (0 total / 1 rarity / 2 achievement). */
    // AS3: BadgeLeaderboardController.as::_SafeStr_5271
    private _currentType: number = 0;

    /** Derived name — `_SafeStr_5386`: the rarity, meaningful only when type is 1. */
    // AS3: BadgeLeaderboardController.as::_SafeStr_5386
    private _currentRarity: number = -1;

    /** Derived name — `_SafeStr_4846`: the 10-row page on screen. */
    // AS3: BadgeLeaderboardController.as::_SafeStr_4846
    private _currentPage: number = 0;

    /** Derived name — `_SafeStr_4655`: the page data last delivered. */
    // AS3: BadgeLeaderboardController.as::_SafeStr_4655
    private _pageData: BadgeLeaderboardPageData | null = null;

    // AS3: BadgeLeaderboardController.as::BadgeLeaderboardController()
    constructor(
        groupsManager: HabboGroupsManager,
        context: IContext,
        flags: number = 0,
        assetLibrary: IAssetLibrary | null = null
    )
    {
        super(context, flags, assetLibrary);

        this._groupsManager = groupsManager;
        this._messageEvents = [];
        this._dataServer = new BadgeLeaderboardDataServer(this.send);
    }

    // AS3: BadgeLeaderboardController.as::showBadgeLeaderboard()
    public showBadgeLeaderboard(type: number, rarity: number = -1, page: number = 0): void
    {
        if(this._view === null && this._windowManager !== null)
        {
            this._view = new BadgeLeaderboardView(this, this._windowManager);
        }

        if(this._view === null) return;

        this._currentType = this.normalizeType(type, rarity);
        this._currentRarity = BadgeLeaderboardController.normalizeRarity(this._currentType, rarity);
        this._currentPage = Math.max(0, page);

        this.clearVisibleData();
        this.updateChrome();

        this._dataServer?.requestPage(
            this._currentType, this._currentRarity, this._currentPage, this.onPageData
        );

        this._view.show();
    }

    // AS3: BadgeLeaderboardController.as::get linkPattern()
    public get linkPattern(): string
    {
        return BadgeLeaderboardUtils.LINK_PATTERN;
    }

    // AS3: BadgeLeaderboardController.as::linkReceived()
    public linkReceived(link: string): void
    {
        const parts = link == null ? [] : link.split('/');

        if(parts.length === 0 || parts[0] !== BadgeLeaderboardUtils.LINK_ID)
        {
            return;
        }

        this.showBadgeLeaderboard(
            BadgeLeaderboardController.getLinkIntValue(parts, 1, 0),
            BadgeLeaderboardController.getLinkIntValue(parts, 2, -1),
            BadgeLeaderboardController.getLinkIntValue(parts, 3, 0)
        );
    }

    // AS3: BadgeLeaderboardController.as::hide()
    public hide(): void
    {
        this._view?.hide();
    }

    // AS3: BadgeLeaderboardController.as::onDropdownOpenClicked()
    public onDropdownOpenClicked(): void
    {
        this._view?.openDropdownMenu();
    }

    // AS3: BadgeLeaderboardController.as::onDropdownSelectionChanged()
    public onDropdownSelectionChanged(index: number): void
    {
        this.showBadgeLeaderboard(
            BadgeLeaderboardController.getTypeByDropdownIndex(index), this.getRarityByDropdownIndex(index), 0
        );
    }

    // AS3: BadgeLeaderboardController.as::onPreviousPageClicked()
    public onPreviousPageClicked(): void
    {
        if(this._currentPage > 0)
        {
            this.showBadgeLeaderboard(this._currentType, this._currentRarity, this._currentPage - 1);
        }
    }

    // AS3: BadgeLeaderboardController.as::onNextPageClicked()
    public onNextPageClicked(): void
    {
        if(this._pageData !== null
            && (this._currentPage + 1) * BadgeLeaderboardController.PAGE_SIZE < this._pageData.totalEntries)
        {
            this.showBadgeLeaderboard(this._currentType, this._currentRarity, this._currentPage + 1);
        }
    }

    /** `index === -1` is the pinned own-rank row; anything else indexes the page. */
    // AS3: BadgeLeaderboardController.as::onProfileRegionClicked()
    public onProfileRegionClicked(index: number): void
    {
        if(this._pageData === null) return;

        let entry: BadgeLeaderboardEntryData | null = null;

        if(index === -1)
        {
            entry = this._pageData.ownEntry;
        }
        else if(index >= 0 && index < this._pageData.entries.length)
        {
            entry = this._pageData.entries[index];
        }

        if(entry !== null)
        {
            this._groupsManager?.showExtendedProfile(entry.userId);
        }
    }

    // AS3: BadgeLeaderboardController.as::send()
    public send = (composer: IMessageComposer<unknown[]>): void =>
    {
        if(this._communicationManager !== null && this._communicationManager.connection !== null)
        {
            this._communicationManager.connection.send(composer);
        }
    };

    // AS3: BadgeLeaderboardController.as::avatarImageReady()
    public avatarImageReady(figureString: string): void
    {
        if(this._disposed || this._pageData === null || !this.currentPageContainsFigure(figureString))
        {
            return;
        }

        this.renderEntryFacesForFigure(figureString);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- variance: typed ComponentDependency<T> is contravariant in T
    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) => this.setCommunicationManager(manager),
                true
            ),
            new ComponentDependency(IID_HabboWindowManager, (manager: IHabboWindowManager | null) =>
            {
                this._windowManager = manager;
            }),
            new ComponentDependency(IID_HabboLocalizationManager, (manager: IHabboLocalizationManager | null) =>
            {
                this._localizationManager = manager;
            }),
            new ComponentDependency(IID_AvatarRenderManager, (manager: IAvatarRenderManager | null) =>
            {
                this._avatarRenderManager = manager;
            }, false)
        ];
    }

    // AS3: BadgeLeaderboardController.as::setCommunicationManager()
    private setCommunicationManager(manager: IHabboCommunicationManager | null): void
    {
        this._communicationManager = manager;
        this.registerMessageEvents();
    }

    /** Registered once: AS3 returns early the moment the vector is non-empty. */
    // AS3: BadgeLeaderboardController.as::registerMessageEvents()
    private registerMessageEvents(): void
    {
        if(this._disposed || this._communicationManager === null) return;

        if(this._messageEvents.length > 0) return;

        this._messageEvents.push(
            this._communicationManager.addMessageEvent(
                new BadgeLeaderboardMessageEvent(this.onBadgeLeaderboardResult)
            )
        );
    }

    // AS3: BadgeLeaderboardController.as::onBadgeLeaderboardResult()
    private onBadgeLeaderboardResult = (event: IMessageEvent): void =>
    {
        this._dataServer?.onBadgeLeaderboardResult(
            (event as BadgeLeaderboardMessageEvent).leaderboardParser
        );
    };

    // AS3: BadgeLeaderboardController.as::onPageData()
    private onPageData = (data: BadgeLeaderboardPageData): void =>
    {
        if(this._disposed) return;

        this._pageData = data;

        this.updateChrome();
        this.renderEntries();
    };

    // AS3: BadgeLeaderboardController.as::updateChrome()
    private updateChrome(): void
    {
        if(this._view === null) return;

        this._view.setFrameStyle(this.getFrameStyle(this._currentType, this._currentRarity));
        this._view.setDropdownOptions(
            this.getDropdownOptions(), this.getDropdownSelectionIndex(this._currentType, this._currentRarity)
        );
        this._view.setTitle(this.getTitleText(this._currentType, this._currentRarity));
        this._view.setInfo(
            BadgeLeaderboardController.getHeaderAssetUri(this._currentType, this._currentRarity),
            this.getInfoText(this._currentType, this._currentRarity)
        );
        this._view.setRankTypeExtendedImageYOffset(
            BadgeLeaderboardController.getHeaderAssetYOffset(this._currentType, this._currentRarity)
        );
        this._view.setPagerEnabled(this.canGoPrevious(), this.canGoNext());
    }

    /**
     * Row striping runs across pages, not within one: the parity is computed from the absolute row
     * index, so page 2 starts on the colour page 1 left off with.
     */
    // AS3: BadgeLeaderboardController.as::renderEntries()
    private renderEntries(): void
    {
        if(this._view === null) return;

        const rowAssetUri = BadgeLeaderboardController.getRowAssetUri(this._currentType, this._currentRarity);
        const entries = this._pageData?.entries ?? [];

        for(let index = 0; index < this._view.entryViews.length; index++)
        {
            const view = this._view.entryViews[index];
            const entry = index < entries.length ? entries[index] : null;

            if(entry === null)
            {
                this._view.setEntryVisible(index, false);
                BadgeLeaderboardController.clearFaceBitmap(view.profileCanvas);
            }
            else
            {
                const even = (this._currentPage * BadgeLeaderboardController.PAGE_SIZE + index) % 2 === 0;

                this._view.setEntryVisible(index, true);

                const evenBackground = view.evenBackground as unknown as IWindow | null;
                const unevenBackground = view.unevenBackground as unknown as IWindow | null;

                if(evenBackground) evenBackground.visible = even;
                if(unevenBackground) unevenBackground.visible = !even;

                const rankText = view.rankText;
                const usernameText = view.usernameText;
                const scoreText = view.scoreText;

                if(rankText) rankText.text = BadgeLeaderboardController.getRankText(entry.rank);
                if(usernameText) usernameText.text = entry.userName;
                if(scoreText) scoreText.text = entry.score.toString();

                BadgeLeaderboardController.applyRankBorderColor(view, entry.rank);

                const rankTypeImage = view.rankTypeImage;

                if(rankTypeImage) rankTypeImage.assetUri = rowAssetUri;
            }
        }

        const ownEntry = this._pageData?.ownEntry ?? null;
        const ownEntryView = this._view.ownEntryView;

        this._view.setOwnEntryVisible(ownEntry !== null);

        if(ownEntry !== null && ownEntryView !== null)
        {
            const rankText = ownEntryView.rankText;
            const usernameText = ownEntryView.usernameText;
            const scoreText = ownEntryView.scoreText;

            if(rankText) rankText.text = BadgeLeaderboardController.getRankText(ownEntry.rank);
            if(usernameText) usernameText.text = ownEntry.userName;
            if(scoreText) scoreText.text = ownEntry.score.toString();

            BadgeLeaderboardController.applyRankBorderColor(ownEntryView, ownEntry.rank);

            const rankTypeImage = ownEntryView.rankTypeImage;

            if(rankTypeImage) rankTypeImage.assetUri = rowAssetUri;
        }
        else
        {
            BadgeLeaderboardController.clearFaceBitmap(ownEntryView?.profileCanvas ?? null);
        }

        this.renderEntryFaces();
        this._view.setPagerEnabled(this.canGoPrevious(), this.canGoNext());
    }

    // AS3: BadgeLeaderboardController.as::renderEntryFaces()
    private renderEntryFaces(): void
    {
        if(this._view === null) return;

        const entries = this._pageData?.entries ?? [];

        for(let index = 0; index < this._view.entryViews.length; index++)
        {
            const entry = index < entries.length ? entries[index] : null;

            this.renderEntryFace(this._view.entryViews[index], entry);
        }

        this.renderEntryFace(this._view.ownEntryView, this._pageData?.ownEntry ?? null);
    }

    // AS3: BadgeLeaderboardController.as::renderEntryFacesForFigure()
    private renderEntryFacesForFigure(figureString: string): void
    {
        if(this._view === null || figureString == null) return;

        const entries = this._pageData?.entries ?? [];

        for(let index = 0; index < this._view.entryViews.length; index++)
        {
            const entry = index < entries.length ? entries[index] : null;

            if(entry !== null && entry.figureString === figureString)
            {
                this.renderEntryFace(this._view.entryViews[index], entry);
            }
        }

        const ownEntry = this._pageData?.ownEntry ?? null;

        if(ownEntry !== null && ownEntry.figureString === figureString)
        {
            this.renderEntryFace(this._view.ownEntryView, ownEntry);
        }
    }

    /**
     * The avatar image is built, cropped to the head, and thrown away — only the cropped bitmap is
     * kept. A figure whose assets are still downloading returns nothing here and comes back through
     * `avatarImageReady()`.
     */
    // AS3: BadgeLeaderboardController.as::renderEntryFace()
    private renderEntryFace(view: BadgeLeaderboardEntryView | null, entry: BadgeLeaderboardEntryData | null): void
    {
        if(view === null) return;

        BadgeLeaderboardController.clearFaceBitmap(view.profileCanvas);

        if(entry === null || this._avatarRenderManager === null
            || entry.figureString == null || entry.figureString.length === 0)
        {
            return;
        }

        const avatarImage = this._avatarRenderManager.createAvatarImage(entry.figureString, 'h', null, this, null);

        if(avatarImage === null) return;

        const face = HabboFaceFocuser.focusUserFace(avatarImage, 'head', 2, 1);

        avatarImage.dispose();

        if(face !== null)
        {
            BadgeLeaderboardController.setFaceBitmap(view.profileCanvas, face);
        }
    }

    // AS3: BadgeLeaderboardController.as::setFaceBitmap()
    private static setFaceBitmap(canvas: IBitmapWrapperWindow | null, bitmap: ImageBitmap): void
    {
        if(canvas === null) return;

        BadgeLeaderboardController.clearFaceBitmap(canvas);

        canvas.bitmap = bitmap;

        const window = canvas as unknown as IWindow;

        window.width = bitmap.width;
        window.height = bitmap.height;
        window.invalidate();
    }

    /**
     * AS3 calls `bitmap.dispose()`; the bitmap here is one this class made through
     * `focusUserFace()` and nothing else holds it, so closing it is right — unlike a tile drawn
     * from a shared asset cache.
     */
    // AS3: BadgeLeaderboardController.as::clearFaceBitmap()
    private static clearFaceBitmap(canvas: IBitmapWrapperWindow | null): void
    {
        if(canvas === null) return;

        if(canvas.bitmap !== null)
        {
            canvas.bitmap.close();
            canvas.bitmap = null;
        }

        (canvas as unknown as IWindow).invalidate();
    }

    // AS3: BadgeLeaderboardController.as::clearVisibleData()
    private clearVisibleData(): void
    {
        this._pageData = null;

        if(this._view === null) return;

        for(let index = 0; index < this._view.entryViews.length; index++)
        {
            this._view.setEntryVisible(index, false);
            BadgeLeaderboardController.clearFaceBitmap(this._view.entryViews[index].profileCanvas);
        }

        this._view.setOwnEntryVisible(false);
        BadgeLeaderboardController.clearFaceBitmap(this._view.ownEntryView?.profileCanvas ?? null);
        this._view.setPagerEnabled(this.canGoPrevious(), false);
    }

    // AS3: BadgeLeaderboardController.as::currentPageContainsFigure()
    private currentPageContainsFigure(figureString: string): boolean
    {
        if(this._pageData === null || figureString == null) return false;

        for(const entry of this._pageData.entries)
        {
            if(entry != null && entry.figureString === figureString)
            {
                return true;
            }
        }

        return this._pageData.ownEntry !== null && this._pageData.ownEntry.figureString === figureString;
    }

    // AS3: BadgeLeaderboardController.as::getLinkIntValue()
    private static getLinkIntValue(parts: string[], index: number, fallback: number): number
    {
        if(parts == null || index < 0 || index >= parts.length)
        {
            return fallback;
        }

        const raw = parts[index];

        if(raw == null || raw.length === 0)
        {
            return fallback;
        }

        const value = Number(raw);

        return isNaN(value) ? fallback : Math.trunc(value);
    }

    // AS3: BadgeLeaderboardController.as::canGoPrevious()
    private canGoPrevious(): boolean
    {
        return this._currentPage > 0;
    }

    // AS3: BadgeLeaderboardController.as::canGoNext()
    private canGoNext(): boolean
    {
        return this._pageData !== null
            && (this._currentPage + 1) * BadgeLeaderboardController.PAGE_SIZE < this._pageData.totalEntries;
    }

    /** A rarity board with a rarity this hotel does not run falls back to total badges. */
    // AS3: BadgeLeaderboardController.as::normalizeType()
    private normalizeType(type: number, rarity: number): number
    {
        if(type === BadgeLeaderboardUtils.ACHIEVEMENT_LEVEL)
        {
            return type;
        }

        if(type === BadgeLeaderboardUtils.BADGES_BY_RARITY && this.isSupportedRarity(rarity))
        {
            return type;
        }

        return BadgeLeaderboardUtils.TOTAL_BADGES;
    }

    // AS3: BadgeLeaderboardController.as::normalizeRarity()
    private static normalizeRarity(type: number, rarity: number): number
    {
        if(type === BadgeLeaderboardUtils.BADGES_BY_RARITY)
        {
            return rarity;
        }

        return BadgeLeaderboardUtils.DEFAULT_RARITY;
    }

    // AS3: BadgeLeaderboardController.as::isSupportedRarity()
    private isSupportedRarity(rarity: number): boolean
    {
        return this.getSupportedRarities().indexOf(rarity) >= 0;
    }

    // AS3: BadgeLeaderboardController.as::getDropdownOptions()
    private getDropdownOptions(): string[]
    {
        const options = [
            this._localizationManager?.getLocalizationWithParams('badge_leaderboard.option.total_badges') ?? '',
            this._localizationManager?.getLocalizationWithParams('badge_leaderboard.option.achievement_level') ?? ''
        ];

        for(const rarity of this.getSupportedRarities())
        {
            options.push(
                this._localizationManager?.getLocalizationWithParamMap(
                    'badge_leaderboard.option.rarity',
                    '',
                    new Map([['rarity', this.getRarityText(rarity)]])
                ) ?? ''
            );
        }

        return options;
    }

    /** Index 0 is total badges, 1 achievement level, and 2+ the supported rarities in order. */
    // AS3: BadgeLeaderboardController.as::getDropdownSelectionIndex()
    private getDropdownSelectionIndex(type: number, rarity: number): number
    {
        if(type === BadgeLeaderboardUtils.TOTAL_BADGES)
        {
            return 0;
        }

        if(type === BadgeLeaderboardUtils.ACHIEVEMENT_LEVEL)
        {
            return 1;
        }

        const index = this.getSupportedRarities().indexOf(rarity);

        return index < 0 ? 0 : index + 2;
    }

    // AS3: BadgeLeaderboardController.as::getTypeByDropdownIndex()
    private static getTypeByDropdownIndex(index: number): number
    {
        if(index <= 0)
        {
            return BadgeLeaderboardUtils.TOTAL_BADGES;
        }

        if(index === 1)
        {
            return BadgeLeaderboardUtils.ACHIEVEMENT_LEVEL;
        }

        return BadgeLeaderboardUtils.BADGES_BY_RARITY;
    }

    // AS3: BadgeLeaderboardController.as::getRarityByDropdownIndex()
    private getRarityByDropdownIndex(index: number): number
    {
        const rarities = this.getSupportedRarities();

        if(index <= 1 || index > rarities.length + 1)
        {
            return BadgeLeaderboardUtils.DEFAULT_RARITY;
        }

        return rarities[index - 2];
    }

    // AS3: BadgeLeaderboardController.as::getTitleText()
    private getTitleText(type: number, rarity: number): string
    {
        if(type === BadgeLeaderboardUtils.BADGES_BY_RARITY)
        {
            return this._localizationManager?.getLocalizationWithParamMap(
                'badge_leaderboard.title.rarity', '', new Map([['rarity', this.getRarityText(rarity)]])
            ) ?? '';
        }

        if(type === BadgeLeaderboardUtils.ACHIEVEMENT_LEVEL)
        {
            return this._localizationManager?.getLocalizationWithParams(
                'badge_leaderboard.title.achievement_level'
            ) ?? '';
        }

        return this._localizationManager?.getLocalizationWithParams('badge_leaderboard.title.total_badges') ?? '';
    }

    // AS3: BadgeLeaderboardController.as::getInfoText()
    private getInfoText(type: number, rarity: number): string
    {
        if(type === BadgeLeaderboardUtils.BADGES_BY_RARITY)
        {
            return this._localizationManager?.getLocalizationWithParams(
                BadgeLeaderboardController.getInfoLocalizationKey(rarity)
            ) ?? '';
        }

        if(type === BadgeLeaderboardUtils.ACHIEVEMENT_LEVEL)
        {
            return this._localizationManager?.getLocalizationWithParams(
                'badge_leaderboard.info.achievement_level'
            ) ?? '';
        }

        return this._localizationManager?.getLocalizationWithParams('badge_leaderboard.info.total_badges') ?? '';
    }

    // AS3: BadgeLeaderboardController.as::getInfoLocalizationKey()
    private static getInfoLocalizationKey(rarity: number): string
    {
        switch(rarity)
        {
            case 1: return 'badge_leaderboard.info.rarity.uncommon';
            case 2: return 'badge_leaderboard.info.rarity.rare';
            case 3: return 'badge_leaderboard.info.rarity.epic';
            case 4: return 'badge_leaderboard.info.rarity.mythical';
            case 5: return 'badge_leaderboard.info.rarity.legendary';
            case 6: return 'badge_leaderboard.info.rarity.unique';
            default: return 'badge_leaderboard.info.total_badges';
        }
    }

    // AS3: BadgeLeaderboardController.as::getRarityText()
    private getRarityText(rarity: number): string
    {
        return this._localizationManager?.getLocalizationWithParams(
            BadgeRarityEnum.getLocalizationKey(rarity, this.isUncommonBadgeRarityEnabled())
        ) ?? '';
    }

    // AS3: BadgeLeaderboardController.as::getHeaderAssetUri()
    private static getHeaderAssetUri(type: number, rarity: number): string
    {
        if(type === BadgeLeaderboardUtils.BADGES_BY_RARITY)
        {
            return `${BadgeLeaderboardController.getRarityAssetBase(rarity)}_extended`;
        }

        if(type === BadgeLeaderboardUtils.ACHIEVEMENT_LEVEL)
        {
            return 'badges_emblem_achievement_extended';
        }

        return 'badge_rarity_badges_emblem';
    }

    /** The frame style is what recolours the whole window per board. */
    // AS3: BadgeLeaderboardController.as::getFrameStyle()
    private getFrameStyle(type: number, rarity: number): number
    {
        if(type === BadgeLeaderboardUtils.BADGES_BY_RARITY)
        {
            switch(rarity)
            {
                case 1: return BadgeLeaderboardUtils.FRAME_STYLE_UNCOMMON;
                case 2: return BadgeLeaderboardUtils.FRAME_STYLE_RARE;
                case 3: return BadgeLeaderboardUtils.FRAME_STYLE_VERY_RARE;
                case 4: return BadgeLeaderboardUtils.FRAME_STYLE_MYTHICAL;
                case 5: return BadgeLeaderboardUtils.FRAME_STYLE_LEGENDARY;
                case 6: return BadgeLeaderboardUtils.FRAME_STYLE_UNIQUE;
            }
        }

        if(type === BadgeLeaderboardUtils.ACHIEVEMENT_LEVEL)
        {
            return BadgeLeaderboardUtils.FRAME_STYLE_ACHIEVEMENT_LEVEL;
        }

        return BadgeLeaderboardUtils.FRAME_STYLE_TOTAL_BADGES;
    }

    // AS3: BadgeLeaderboardController.as::getHeaderAssetYOffset()
    private static getHeaderAssetYOffset(type: number, rarity: number): number
    {
        if(type === BadgeLeaderboardUtils.TOTAL_BADGES
            || (type === BadgeLeaderboardUtils.BADGES_BY_RARITY && rarity === 1))
        {
            return -9;
        }

        if(type === BadgeLeaderboardUtils.ACHIEVEMENT_LEVEL)
        {
            return -7;
        }

        return 0;
    }

    // AS3: BadgeLeaderboardController.as::getRowAssetUri()
    private static getRowAssetUri(type: number, rarity: number): string
    {
        if(type === BadgeLeaderboardUtils.BADGES_BY_RARITY)
        {
            return BadgeLeaderboardController.getRarityAssetBase(rarity);
        }

        if(type === BadgeLeaderboardUtils.ACHIEVEMENT_LEVEL)
        {
            return 'badges_emblem_achievement';
        }

        return 'badge_rarity_badges_emblem';
    }

    // AS3: BadgeLeaderboardController.as::getRarityAssetBase()
    private static getRarityAssetBase(rarity: number): string
    {
        switch(rarity)
        {
            case 1: return 'badge_rarity_badges_emblem_uncommon';
            case 2: return 'badge_rarity_badges_emblem_rare';
            case 3: return 'badge_rarity_badges_emblem_very_rare';
            case 4: return 'badge_rarity_badges_emblem_mythical';
            case 5: return 'badge_rarity_badges_emblem_legendary';
            case 6: return 'badge_rarity_badges_emblem_unique';
            default: return 'badge_rarity_badges_emblem';
        }
    }

    /** Uncommon is a per-hotel switch and, when on, sorts before the fixed five. */
    // AS3: BadgeLeaderboardController.as::getSupportedRarities()
    private getSupportedRarities(): number[]
    {
        const rarities = BadgeLeaderboardController.BASE_SUPPORTED_RARITIES.concat();

        if(this.isUncommonBadgeRarityEnabled())
        {
            rarities.unshift(1);
        }

        return rarities;
    }

    // AS3: BadgeLeaderboardController.as::isUncommonBadgeRarityEnabled()
    private isUncommonBadgeRarityEnabled(): boolean
    {
        return this._groupsManager !== null && this._groupsManager.getBoolean('badge_rarity.uncommon');
    }

    // AS3: BadgeLeaderboardController.as::getRankText()
    private static getRankText(rank: number): string
    {
        return rank < 0 ? '--' : rank.toString();
    }

    // AS3: BadgeLeaderboardController.as::applyRankBorderColor()
    private static applyRankBorderColor(view: BadgeLeaderboardEntryView | null, rank: number): void
    {
        const border = view?.rankBorder as unknown as IWindow | null;

        if(view === null || border == null) return;

        border.color = BadgeLeaderboardController.getRankBorderColor(rank);
    }

    // AS3: BadgeLeaderboardController.as::getRankBorderColor()
    private static getRankBorderColor(rank: number): number
    {
        switch(rank)
        {
            case 1: return BadgeLeaderboardController.FIRST_PLACE_RANK_BORDER_COLOR;
            case 2: return BadgeLeaderboardController.SECOND_PLACE_RANK_BORDER_COLOR;
            case 3: return BadgeLeaderboardController.THIRD_PLACE_RANK_BORDER_COLOR;
            default: return BadgeLeaderboardController.DEFAULT_RANK_BORDER_COLOR;
        }
    }

    // AS3: BadgeLeaderboardController.as::get localizationManager()
    public get localizationManager(): IHabboLocalizationManager | null
    {
        return this._localizationManager;
    }

    // AS3: BadgeLeaderboardController.as::get groupsManager()
    public get groupsManager(): HabboGroupsManager | null
    {
        return this._groupsManager;
    }

    // AS3: BadgeLeaderboardController.as::get view()
    public get view(): BadgeLeaderboardView | null
    {
        return this._view;
    }

    // AS3: BadgeLeaderboardController.as::dispose()
    public override dispose(): void
    {
        if(this._disposed) return;

        this.clearVisibleData();

        if(this._view !== null)
        {
            this._view.dispose();
            this._view = null;
        }

        if(this._dataServer !== null)
        {
            this._dataServer.dispose();
            this._dataServer = null;
        }

        if(this._communicationManager !== null)
        {
            for(const event of this._messageEvents)
            {
                this._communicationManager.removeMessageEvent(event);
            }
        }

        this._messageEvents = [];
        this._communicationManager = null;
        this._localizationManager = null;
        this._windowManager = null;
        this._avatarRenderManager = null;
        this._groupsManager = null;
        this._pageData = null;

        log.debug('Badge leaderboard controller disposed');

        super.dispose();
    }
}
