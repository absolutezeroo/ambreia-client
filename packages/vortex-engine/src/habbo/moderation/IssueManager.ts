import {IssueInfoData} from '@habbo/communication/messages/parser/moderation/IssueInfoData';
import type {
    ICfhCategory
} from '@habbo/communication/messages/parser/help/CfhTopicsInitMessageParser';
import type {IIssueHandler} from './IIssueHandler';
import {IssueHandler} from './IssueHandler';
import type {ModActionCtrl} from './ModActionCtrl';
import {IssueBrowser} from './IssueBrowser';
import {IssueBundle} from './IssueBundle';
import type {ModerationManager} from './ModerationManager';
import {PickIssuesMessageComposer} from '@habbo/communication/messages/outgoing/moderation/PickIssuesMessageComposer';
import {
    ReleaseIssuesMessageComposer
} from '@habbo/communication/messages/outgoing/moderation/ReleaseIssuesMessageComposer';
import {CloseIssuesMessageComposer} from '@habbo/communication/messages/outgoing/moderation/CloseIssuesMessageComposer';
import {
    CloseIssueDefaultActionMessageComposer
} from '@habbo/communication/messages/outgoing/moderation/CloseIssueDefaultActionMessageComposer';
import {ModToolSanctionComposer} from '@habbo/communication/messages/outgoing/moderation/ModToolSanctionComposer';
import type {SanctionTypeData} from '@habbo/communication/messages/parser/moderation/CfhSanctionMessageParser';

/**
 * Core issue/report management.
 *
 * Maintains issue state, bundles related reports by grouping ID and
 * reported user, and handles pick/release/close operations.
 *
 * @see source_as_win63/habbo/moderation/IssueManager.as
 */
export class IssueManager
{
    /** AS3's `getInteger('max.call_for_help.results', 200)` fallback. */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::IssueManager()
    /** AS3 sends this as the issue id when asking about an account rather than a report. */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::requestSanctionDataForAccount()
    private static readonly NO_ISSUE_ID: number = -1;

    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::playSound()
    private static readonly NEW_ISSUE_SOUND: string = 'HBST_call_for_help';

    /** AS3's `getInteger('max.call_for_help.results', 200)` fallback. */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::IssueManager()
    private static readonly DEFAULT_ISSUE_LIST_LIMIT: number = 200;

    /** AS3 builds `new Timer(15000, 0)` — repeating forever. */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::IssueManager()
    private static readonly BROWSER_REFRESH_INTERVAL_MS: number = 15000;

    public static readonly BUNDLE_OPEN: string = 'issue_bundle_open';
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::BUNDLE_MY
    public static readonly BUNDLE_MY: string = 'issue_bundle_my';
    public static readonly BUNDLE_PICKED: string = 'issue_bundle_picked';
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::PRIORITY_UPDATE_INTERVAL_MS
    public static readonly PRIORITY_UPDATE_INTERVAL_MS: number = 15000;
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::RESOLUTION_USELESS
    public static readonly RESOLUTION_USELESS: number = 1;
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::RESOLUTION_RESOLVED
    public static readonly RESOLUTION_RESOLVED: number = 3;

    private _manager: ModerationManager;
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::_issues
    private _issues: Map<number, IssueInfoData> = new Map();
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::_bundles
    private _bundles: Map<number, IssueBundle> = new Map();
    private _issueToBundleMap: Map<number, number> = new Map();
    private _pendingPickIssueIds: number[] = [];
    private _pendingReleaseIssueIds: number[] = [];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/moderation/IssueManager.as::_nextBundleId
    private _nextBundleId: number = 1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/moderation/IssueManager.as::_windowX
    private _windowX: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/moderation/IssueManager.as::_windowY
    private _windowY: number = 0;
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::_windowWidth
    private _windowWidth: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/moderation/IssueManager.as::_windowHeight
    private _windowHeight: number = 0;

    /** Derived name — `_issueHandlers`: one open issue-handler window per bundle id. */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::_issueHandlers
    private _issueHandlers: Map<number, IIssueHandler> = new Map();

    /** Derived name — `_SafeStr_9094`: the CFH topic tree, straight off the wire. */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::_SafeStr_9094
    private _cfhTopics: ICfhCategory[] = [];

    /** Derived name — `_SafeStr_8195`: open mod-action windows, keyed by target user id. */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::_SafeStr_8195
    private _modActionViews: Map<number, ModActionCtrl> = new Map();

    /** Derived name — `_SafeStr_6139`. */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::_SafeStr_6139
    private _issueBrowser: IssueBrowser | null = null;

    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::_issueListLimit
    private _issueListLimit: number = IssueManager.DEFAULT_ISSUE_LIST_LIMIT;

    /** Derived name — `_SafeStr_8562`: AS3's repeating 15 s browser-refresh `Timer`. */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::_SafeStr_8562
    private _browserRefreshTimer: ReturnType<typeof setInterval> | null = null;

    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::IssueManager()
    constructor(manager: ModerationManager)
    {
        this._manager = manager;

        this._issueBrowser = new IssueBrowser(this, manager.windowManager, manager.assets);
        this._issueListLimit = manager.getInteger(
            'max.call_for_help.results', IssueManager.DEFAULT_ISSUE_LIST_LIMIT
        );

        this._browserRefreshTimer = setInterval(
            () => this.updateIssueBrowser(), IssueManager.BROWSER_REFRESH_INTERVAL_MS
        );
    }

    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::get issueListLimit()
    get issueListLimit(): number
    {
        return this._issueListLimit;
    }

    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::init()
    init(): void
    {
        this._issueBrowser?.show();
    }

    private _autoPickEnabled: boolean = false;

    /**
	 * Whether auto-pick mode is enabled.
	 */
    get autoPickEnabled(): boolean
    {
        return this._autoPickEnabled;
    }

    set autoPickEnabled(value: boolean)
    {
        this._autoPickEnabled = value;
    }

    /**
	 * Update or add an issue. If the issue is closed (state 3), it is removed.
	 * Automatically groups issues into bundles by groupingId + reportedUserId.
	 *
	 * @param issue - The issue data to process
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::updateIssue()
    updateIssue(issue: IssueInfoData): void
    {
        if(issue === null)
        {
            return;
        }

        // Update the master issue map
        this._issues.delete(issue.issueId);
        this._issues.set(issue.issueId, issue);

        // Check if the issue already belongs to a bundle
        let bundle: IssueBundle | null = null;
        const existingBundleId = this._issueToBundleMap.get(issue.issueId);

        if(existingBundleId !== undefined && existingBundleId !== 0)
        {
            const existingBundle = this._bundles.get(existingBundleId) ?? null;

            if(existingBundle !== null)
            {
                if(existingBundle.matches(issue))
                {
                    existingBundle.updateIssue(issue);
                    bundle = existingBundle;
                }
                else
                {
                    existingBundle.removeIssue(issue.issueId);

                    if(existingBundle.getIssueCount() === 0)
                    {
                        this._bundles.delete(existingBundle.id);
                    }

                    this._issueToBundleMap.delete(issue.issueId);
                }
            }
        }

        // If the issue is closed, remove it entirely
        if(issue.state === IssueInfoData.STATE_CLOSED)
        {
            this._issues.delete(issue.issueId);
            return;
        }

        // Try to find a matching bundle if not yet assigned
        if(bundle === null)
        {
            for(const candidateBundle of this._bundles.values())
            {
                if(candidateBundle.matches(issue))
                {
                    bundle = candidateBundle;
                    bundle.updateIssue(issue);
                    this._issueToBundleMap.set(issue.issueId, bundle.id);
                    break;
                }
            }
        }

        // Create a new bundle if no match found
        if(bundle === null)
        {
            const bundleId = this._nextBundleId++;
            bundle = new IssueBundle(bundleId, issue);
            this._issueToBundleMap.set(issue.issueId, bundleId);
            this._bundles.set(bundleId, bundle);
        }

        if(bundle === null)
        {
            return;
        }

        // Handle pending pick confirmations
        if(this._pendingPickIssueIds.indexOf(issue.issueId) !== -1)
        {
            this.handleBundle(bundle.id);

            const userId = this._manager.sessionDataManager?.userId ?? 0;

            if(userId !== issue.pickerUserId)
            {
                if(issue.state === IssueInfoData.STATE_PICKED)
                {
                    this.unhandleBundle(bundle.id);
                }
            }
        }

        // Auto-pick matching open issues
        if(issue.state === IssueInfoData.STATE_OPEN)
        {
            const myBundles = this.getBundles(IssueManager.BUNDLE_MY);
            let matchesMyBundle = false;

            for(const myBundle of myBundles)
            {
                if(myBundle.matches(issue, true))
                {
                    matchesMyBundle = true;
                    break;
                }
            }

            const releaseIdx = this._pendingReleaseIssueIds.indexOf(issue.issueId);

            if(releaseIdx === -1 && matchesMyBundle)
            {
                this.sendPick([issue.issueId], false, 0, 'matches bundle with issue');
            }
            else if(releaseIdx !== -1)
            {
                this._pendingReleaseIssueIds.splice(releaseIdx, 1);
            }
        }

        this.updateIssueBrowser();
    }

    /**
	 * Remove an issue from tracking entirely.
	 *
	 * @param issueId - The ID of the issue to remove
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::removeIssue()
    removeIssue(issueId: number): void
    {
        if(this._issues === null)
        {
            return;
        }

        const bundleId = this._issueToBundleMap.get(issueId);

        if(bundleId !== undefined && bundleId !== 0)
        {
            const bundle = this._bundles.get(bundleId) ?? null;

            if(bundle !== null)
            {
                bundle.removeIssue(issueId);

                if(bundle.getIssueCount() === 0)
                {
                    this._bundles.delete(bundle.id);
                }
            }
        }

        this._issues.delete(issueId);
        this.updateIssueBrowser();
    }

    /**
	 * Trigger an update of the issue browser display.
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::updateIssueBrowser()
    updateIssueBrowser(): void
    {
        if(this._manager === null) return;

        this._issueBrowser?.update();
    }

    /**
	 * Pick all issues in a bundle for handling.
	 *
	 * @param bundleId - The bundle to pick
	 * @param reason - Reason for picking
	 * @param autoRetry - Whether to auto-retry on failure
	 * @param retryCount - Current retry count
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::pickBundle()
    pickBundle(bundleId: number, reason: string, autoRetry: boolean = false, retryCount: number = 0): void
    {
        const bundle = this._bundles.get(bundleId) ?? null;

        if(bundle === null)
        {
            return;
        }

        const issueIds = bundle.getIssueIds();
        this.sendPick(issueIds, autoRetry, retryCount, reason);
        this._pendingPickIssueIds.push(...issueIds);
    }

    /**
	 * Auto-pick the highest priority open bundle.
	 *
	 * @param reason - Reason for picking
	 * @param retry - Whether this is a retry attempt
	 * @param retryCount - Current retry count
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::autoPick()
    autoPick(reason: string, retry: boolean = false, retryCount: number = 0): void
    {
        let bestBundle: IssueBundle | null = null;

        for(const bundle of this._bundles.values())
        {
            if(bundle.state === IssueBundle.STATE_OPEN)
            {
                if(bestBundle === null || this.isBundleHigherPriorityOrOlder(bundle, bestBundle))
                {
                    bestBundle = bundle;
                }
            }
        }

        if(bestBundle === null)
        {
            return;
        }

        this.pickBundle(bestBundle.id, reason, retry, retryCount);
    }

    /**
	 * Release all issues picked by the current user.
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::releaseAll()
    releaseAll(): void
    {
        if(this._bundles === null)
        {
            return;
        }

        const userId = this._manager.sessionDataManager?.userId ?? 0;
        const issueIds: number[] = [];

        for(const bundle of this._bundles.values())
        {
            if(bundle.state === IssueBundle.STATE_PICKED && bundle.pickerUserId === userId)
            {
                issueIds.push(...bundle.getIssueIds());
            }
        }

        this.sendRelease(issueIds);
    }

    /**
	 * Release all issues in a specific bundle.
	 *
	 * @param bundleId - The bundle to release
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::releaseBundle()
    releaseBundle(bundleId: number): void
    {
        if(this._bundles === null)
        {
            return;
        }

        const bundle = this._bundles.get(bundleId) ?? null;

        if(bundle === null)
        {
            return;
        }

        this.sendRelease(bundle.getIssueIds());
    }

    /**
	 * Close all issues in a bundle with a given resolution.
	 *
	 * @param bundleId - The bundle to close
	 * @param resolution - Resolution type (RESOLUTION_USELESS or RESOLUTION_RESOLVED)
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::closeBundle()
    closeBundle(bundleId: number, resolution: number): void
    {
        const bundle = this._bundles.get(bundleId) ?? null;

        if(bundle === null)
        {
            return;
        }

        this.sendClose(bundle.getIssueIds(), resolution);
    }

    /**
	 * Close a bundle using the default action (sanction) for the highest priority issue.
	 *
	 * @param bundleId - The bundle to close
	 * @param resolution - Resolution type
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::closeDefaultAction()
    closeDefaultAction(bundleId: number, resolution: number): void
    {
        const bundle = this._bundles.get(bundleId) ?? null;

        if(bundle === null)
        {
            return;
        }

        const highestPriorityIssue = bundle.getHighestPriorityIssue();

        if(highestPriorityIssue === null)
        {
            return;
        }

        const mainIssueId = highestPriorityIssue.issueId;
        const otherIssueIds: number[] = [];

        for(const id of bundle.getIssueIds())
        {
            if(id !== mainIssueId)
            {
                otherIssueIds.push(id);
            }
        }

        this.sendCloseDefaultAction(mainIssueId, otherIssueIds, resolution);
    }

    /**
	 * Open a handler for the given bundle (for UI display).
	 *
	 * @param bundleId - The bundle to handle
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::handleBundle()
    handleBundle(bundleId: number): void
    {
        const bundle = this._bundles.get(bundleId) ?? null;

        if(bundle === null || this._manager === null)
        {
            return;
        }

        const handler = new IssueHandler(
            this._manager,
            bundle,
            this._cfhTopics,
            this._windowX,
            this._windowY,
            this._windowWidth,
            this._windowHeight
        );

        // AS3 passes the stored geometry explicitly (`usePos`), so the window opens exactly where
        // the moderator left the last one rather than being placed relative to a caller frame.
        this._manager.windowTracker?.show(
            handler,
            null,
            false,
            false,
            false,
            true,
            this._windowX,
            this._windowY,
            this._windowWidth,
            this._windowHeight
        );

        this.removeHandler(bundleId);
        this._issueHandlers.set(bundleId, handler);

        // Clean up pending pick IDs
        const newPending: number[] = [];

        for(const id of this._pendingPickIssueIds)
        {
            if(!bundle.contains(id))
            {
                newPending.push(id);
            }
        }

        this._pendingPickIssueIds = newPending;
    }

    /** Disposes an open handler window without touching the bundle behind it. */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::removeHandler()
    removeHandler(bundleId: number): void
    {
        const handler = this._issueHandlers.get(bundleId) ?? null;

        if(handler === null) return;

        this._issueHandlers.delete(bundleId);

        handler.dispose();
    }

    /**
	 * Close a handler for the given bundle.
	 *
	 * @param bundleId - The bundle to unhandle
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::unhandleBundle()
    unhandleBundle(bundleId: number): void
    {
        const bundle = this._bundles.get(bundleId) ?? null;

        if(bundle === null)
        {
            return;
        }

        this.removeHandler(bundleId);
    }

    /**
	 * Request sanction data for a bundle's highest priority issue.
	 *
	 * @param bundleId - The bundle to request sanction data for
	 * @param modActionId - The moderation action ID
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::requestSanctionData()
    requestSanctionData(bundleId: number, modActionId: number): void
    {
        const bundle = this._bundles.get(bundleId) ?? null;

        if(bundle === null)
        {
            return;
        }

        const highestPriorityIssue = bundle.getHighestPriorityIssue();

        if(highestPriorityIssue !== null)
        {
            this._manager.connection?.send(new ModToolSanctionComposer(highestPriorityIssue.issueId, -1, modActionId));
        }
    }

    /**
	 * Update sanction data for an issue.
	 *
	 * @param issueId - The issue ID
	 * @param accountId - The account ID
	 * @param sanctionData - The sanction data object
	 */
    /**
	 * The sanction the server proposes for an account, turned into the one line a moderator
	 * reads: the sanction's name, `(avatar)` when it touches the avatar only, its length — in
	 * DAYS past twenty-four hours, in hours below — and any trade lock or machine ban appended
	 * with `&`.
	 *
	 * This was a `log.debug` and nothing else, so the "default sanction" the moderation tool
	 * waits for never arrived and its button stayed disabled. Where it goes depends on how the
	 * request was made: from an issue, to the handler of whichever bundle holds that issue; from
	 * an account lookup with no issue, straight to that account's own mod-action view.
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::updateSanctionData()
    updateSanctionData(issueId: number, accountId: number, sanctionData: SanctionTypeData | null): void
    {
        if(sanctionData === null) return;

        let label = sanctionData.name + (sanctionData.avatarOnly ? ' (avatar) ' : ' ');

        label += sanctionData.sanctionLengthInHours > 24
            ? `${sanctionData.sanctionLengthInHours / 24} days`
            : `${sanctionData.sanctionLengthInHours}h`;

        if(sanctionData.tradeLockInfo !== '') label += ` & ${sanctionData.tradeLockInfo}`;
        if(sanctionData.machineBanInfo !== '') label += ` & ${sanctionData.machineBanInfo}`;

        if(issueId > 0)
        {
            for(const bundle of this._bundles.values())
            {
                if(!bundle.contains(issueId)) continue;

                this._issueHandlers.get(bundle.id)?.showDefaultSanction(accountId, label);
            }

            return;
        }

        this._modActionViews.get(accountId)?.showDefaultSanction(accountId, label);
    }

    /**
	 * Handle pick failure for a set of issues.
	 *
	 * @param issues - Array of issue info data that failed to pick
	 * @returns True if any issue was already picked by another moderator
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::issuePickFailed()
    issuePickFailed(issues: IssueInfoData[]): boolean
    {
        if(!issues)
        {
            return false;
        }

        let pickedByOther = false;
        const myUserId = this._manager.sessionDataManager?.userId ?? 0;

        for(const issue of issues)
        {
            const issueId = issue.issueId;
            const pickerUserId = issue.pickerUserId;

            if(pickerUserId !== -1 && pickerUserId !== myUserId)
            {
                pickedByOther = true;
            }

            // Find the bundle containing this issue and release it
            let matchingBundle: IssueBundle | null = null;

            for(const bundle of this._bundles.values())
            {
                const bundleIssueIds = bundle.getIssueIds();

                for(const bundleIssueId of bundleIssueIds)
                {
                    if(issueId === bundleIssueId)
                    {
                        matchingBundle = bundle;
                        break;
                    }
                }

                if(matchingBundle !== null)
                {
                    break;
                }
            }

            if(matchingBundle !== null)
            {
                this.releaseBundle(matchingBundle.id);
            }
        }

        return pickedByOther;
    }

    /**
	 * Save tool window preferences.
	 *
	 * @param x - Window X position
	 * @param y - Window Y position
	 * @param h - Window height
	 * @param w - Window width
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::setToolPreferences()
    setToolPreferences(x: number, y: number, h: number, w: number): void
    {
        this._windowX = x;
        this._windowY = y;
        this._windowHeight = h;
        this._windowWidth = w;
    }

    /**
	 * Set CFH topics data.
	 *
	 * @param topics - Array of CFH topic data
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::setCfhTopics()
    setCfhTopics(topics: ICfhCategory[]): void
    {
        this._cfhTopics = topics;
    }

    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::getCfhTopics()
    getCfhTopics(): ICfhCategory[]
    {
        return this._cfhTopics;
    }

    /** Keyed by the *target user* id, so one mod-action window exists per user at a time. */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::addModActionView()
    addModActionView(userId: number, view: ModActionCtrl): void
    {
        this._modActionViews.set(userId, view);
    }

    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::removeModActionView()
    removeModActionView(userId: number): void
    {
        this._modActionViews.delete(userId);
    }

    /** AS3 sends `-1` for the issue id: this asks about an account, not about one report. */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::requestSanctionDataForAccount()
    requestSanctionDataForAccount(accountId: number, cfhTopicId: number): void
    {
        this._manager?.connection?.send(new ModToolSanctionComposer(
            IssueManager.NO_ISSUE_ID, accountId, cfhTopicId
        ));
    }

    /**
	 * Get bundles filtered by type.
	 *
	 * @param type - One of BUNDLE_OPEN, BUNDLE_MY, or BUNDLE_PICKED
	 * @returns Array of matching bundles
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::getBundles()
    getBundles(type: string): IssueBundle[]
    {
        if(this._bundles === null)
        {
            return [];
        }

        const result: IssueBundle[] = [];
        const userId = this._manager.sessionDataManager?.userId ?? 0;

        for(const bundle of this._bundles.values())
        {
            switch(type)
            {
                case IssueManager.BUNDLE_OPEN:
                    if(bundle.state === IssueBundle.STATE_OPEN)
                    {
                        result.push(bundle);
                    }
                    break;
                case IssueManager.BUNDLE_MY:
                    if(bundle.state === IssueBundle.STATE_PICKED && bundle.pickerUserId === userId)
                    {
                        result.push(bundle);
                    }
                    break;
                case IssueManager.BUNDLE_PICKED:
                    if(bundle.state === IssueBundle.STATE_PICKED && bundle.pickerUserId !== userId)
                    {
                        result.push(bundle);
                    }
                    break;
            }
        }

        return result;
    }

    /**
	 * Play the issue notification sound (if browser is not visible).
	 *
	 * @param issue - The issue that triggered the sound
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::playSound()
    playSound(issue: IssueInfoData): void
    {
        if(this._issues.has(issue.issueId)) return;

        // Only when the browser is closed: a moderator already looking at the queue does not need
        // to be told a new report arrived.
        if(this._issueBrowser !== null && this._issueBrowser.isOpen()) return;

        this._manager?.soundManager?.playSound(IssueManager.NEW_ISSUE_SOUND);
    }

    /**
	 * Dispose of the issue manager and clean up resources.
	 */
    dispose(): void
    {
        if(this._browserRefreshTimer !== null)
        {
            clearInterval(this._browserRefreshTimer);
            this._browserRefreshTimer = null;
        }

        this._issueBrowser = null;
        this._issues.clear();
        this._bundles.clear();
        this._issueToBundleMap.clear();
        this._pendingPickIssueIds = [];
        this._pendingReleaseIssueIds = [];
    }

    /**
	 * Check if a bundle has higher priority or is older than another.
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::isBundleHigherPriorityOrOlder()
    private isBundleHigherPriorityOrOlder(a: IssueBundle, b: IssueBundle): boolean
    {
        if(a.highestPriority < b.highestPriority)
        {
            return true;
        }

        return a.highestPriority === b.highestPriority && a.issueAgeInMilliseconds < b.issueAgeInMilliseconds;
    }

    /**
	 * Send a pick request to the server.
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::sendPick()
    private sendPick(issueIds: number[], autoRetry: boolean, retryCount: number, reason: string): void
    {
        if(issueIds === null || issueIds.length === 0 || this._manager === null || this._manager.connection === null)
        {
            return;
        }

        this._manager.connection.send(new PickIssuesMessageComposer(issueIds, autoRetry, retryCount, reason));
    }

    /**
	 * Send a release request to the server.
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::sendRelease()
    private sendRelease(issueIds: number[]): void
    {
        if(issueIds === null || issueIds.length === 0 || this._manager === null || this._manager.connection === null)
        {
            return;
        }

        this._manager.connection.send(new ReleaseIssuesMessageComposer(issueIds));
        this._pendingReleaseIssueIds.push(...issueIds);
    }

    /**
	 * Send a close request to the server.
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::sendClose()
    private sendClose(issueIds: number[], resolution: number): void
    {
        if(issueIds === null || this._manager === null || this._manager.connection === null)
        {
            return;
        }

        this._manager.connection.send(new CloseIssuesMessageComposer(issueIds, resolution));
    }

    /**
	 * Send a close with default action request to the server.
	 */
    // AS3: .../src/com/sulake/habbo/moderation/IssueManager.as::sendCloseDefaultAction()
    private sendCloseDefaultAction(mainIssueId: number, otherIssueIds: number[], resolution: number): void
    {
        if(this._manager === null || this._manager.connection === null)
        {
            return;
        }

        this._manager.connection.send(new CloseIssueDefaultActionMessageComposer(mainIssueId, otherIssueIds, resolution));
    }
}
