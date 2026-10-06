import type {IUpdateReceiver} from '@core/runtime/IContext';
import type {XmlAsset} from '@core/assets/XmlAsset';
import {OrderedMap} from '@core/utils/OrderedMap';
import {XMLVariableParser} from '@core/utils/XMLVariableParser';
import type {BadgeImageReadyEvent} from '@habbo/session/events/BadgeImageReadyEvent';
import {BadgeImageReadyEvent as BadgeImageReadyEventClass} from '@habbo/session/events/BadgeImageReadyEvent';
import type {HabboNotifications} from '../HabboNotifications';
import {ClubGiftNotification} from './ClubGiftNotification';
import {NewFeatureNotification} from './NewFeatureNotification';
import {SafetyLockedNotification} from './SafetyLockedNotification';
import {HabboNotificationItem} from './HabboNotificationItem';
import {HabboNotificationItemStyle} from './HabboNotificationItemStyle';
import {HabboNotificationViewManager} from './HabboNotificationViewManager';
import {HabboAlertDialogManager} from './HabboAlertDialogManager';
import {RoomEnterEffect} from '@room/utils/RoomEnterEffect';
import {Logger} from '@core/utils/Logger';

const log = Logger.getLogger('habbo.notifications.singular.SingularNotificationController');

/**
 * Manages the notification item queue and display.
 * Implements IUpdateReceiver to process the queue each frame.
 *
 * The queue is drained one item per frame, and only while the view manager reports room on
 * screen — a burst of notifications therefore appears as a stack that fills up and drains, not
 * as one frame's worth of overlapping bubbles.
 *
 * Its second job is the style config: `habbo_notifications_config_xml` maps each notification
 * *type* to its icon, internal link and — for the four that have their own artwork — its layout
 * and timings. A type absent from that map is refused outright, which is AS3's own behaviour and
 * the reason an unknown type shows nothing at all rather than an unstyled bubble.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/SingularNotificationController.as
 */
export class SingularNotificationController implements IUpdateReceiver
{
    // AS3: .../src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::MODERATION_DISCLAIMER_DELAY_MS
    private static readonly MODERATION_DISCLAIMER_DELAY_MS: number = 5000;

    // AS3: .../notifications/singular/SingularNotificationController.as::NEW_FEATURE_CONDITION_RETRY_DELAY_MS
    private static readonly NEW_FEATURE_CONDITION_RETRY_DELAY_MS: number = 2000;

    // AS3: .../notifications/singular/SingularNotificationController.as::NEW_FEATURE_CONDITION_MAX_RETRIES
    private static readonly NEW_FEATURE_CONDITION_MAX_RETRIES: number = 3;

    // AS3: .../notifications/singular/SingularNotificationController.as::NEW_FEATURE_CONDITION_REWARD_TRACK_INCOMPLETE
    private static readonly NEW_FEATURE_CONDITION_REWARD_TRACK_INCOMPLETE: string = 'reward_track_incomplete';

    // AS3: .../notifications/singular/SingularNotificationController.as::NEW_FEATURE_CONDITION_STATE_UNAVAILABLE
    private static readonly NEW_FEATURE_CONDITION_STATE_UNAVAILABLE: number = -1;

    // AS3: .../notifications/singular/SingularNotificationController.as::NEW_FEATURE_CONDITION_STATE_HIDDEN
    private static readonly NEW_FEATURE_CONDITION_STATE_HIDDEN: number = 0;

    // AS3: .../notifications/singular/SingularNotificationController.as::NEW_FEATURE_CONDITION_STATE_VISIBLE
    private static readonly NEW_FEATURE_CONDITION_STATE_VISIBLE: number = 1;

    /**
     * The asset holding the per-type styles and the per-view timings.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::SingularNotificationController() (literal)
    private static readonly CONFIG_ASSET: string = 'habbo_notifications_config_xml';

    // AS3: .../src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::_notifications
    private _notifications: HabboNotifications | null;
    private _queue: HabboNotificationItem[] = [];
    private _moderationDisclaimerShown: boolean = false;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::_SafeStr_5464
    private _moderationDisclaimerTimer: ReturnType<typeof setTimeout> | null = null;

    // Name DERIVED (`_SafeStr_6817`): obfuscated in every tree; the parsed
    // `habbo_notifications_config_xml`, holding `styles` plus one entry per view variant.
    // AS3: .../src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::_SafeStr_6817
    private _config: OrderedMap<string, unknown> = new OrderedMap<string, unknown>();

    // AS3: .../src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::_viewManager
    private _viewManager: HabboNotificationViewManager | null = null;

    // AS3: .../src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::_clubGiftNotification
    private _clubGiftNotification: ClubGiftNotification | null = null;

    // AS3: .../src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::_safetyLockedNotification
    private _safetyLockedNotification: SafetyLockedNotification | null = null;

    // AS3: .../src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::_newFeatureNotifications
    private _newFeatureNotifications: NewFeatureNotification[] = [];

    // TS-only: AS3 passes the method itself; a bound reference is needed to remove the listener.
    private readonly _onBadgeImageBound = (event: BadgeImageReadyEvent): void => this.onBadgeImage(event);

    constructor(notifications: HabboNotifications)
    {
        this._notifications = notifications;
        this._alertDialogManager = new HabboAlertDialogManager(
            notifications.windowManager, notifications.localizationManager, notifications.habboHelp
        );

        this.parseConfig();

        this._viewManager = new HabboNotificationViewManager(
            notifications,
            notifications.assetLibrary,
            notifications.windowManager,
            notifications.toolBar,
            this.styles,
            this._config
        );

        notifications.sessionDataManager?.events.on(
            BadgeImageReadyEventClass.BADGE_IMAGE_READY, this._onBadgeImageBound
        );

        // Register for frame updates
        this._notifications.registerUpdateReceiver(this, 2);

        // AS3 defers the first sweep by the same 2s it uses between condition retries: the reward
        // track data these conditions read has not arrived at construction time.
        setTimeout(
            () => this.maybeShowNewFeatureNotification(),
            SingularNotificationController.NEW_FEATURE_CONDITION_RETRY_DELAY_MS
        );
    }

    private _alertDialogManager: HabboAlertDialogManager;

    // AS3: .../src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::get alertDialogManager()
    get alertDialogManager(): HabboAlertDialogManager
    {
        return this._alertDialogManager;
    }

    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    /**
	 * Frame update callback. Hands the queue's head to the view manager, one per frame and only
	 * while there is room for it on screen.
	 *
	 * An item the manager refuses is disposed rather than put back: it lost the race for the last
	 * slot, and re-queueing it would let a full screen hold the queue indefinitely.
	 *
	 * @param _deltaTime Time since last frame in ms
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::update()
    update(_deltaTime: number): void
    {
        if(this._queue.length > 0 && this._viewManager?.isSpaceAvailable() === true)
        {
            const item = this.getNextItemFromQueue();

            if(item !== null && !this._viewManager.showItem(item))
            {
                item.dispose();
            }
        }
    }

    /**
	 * Add a notification item to the queue.
	 *
	 * `type` is resolved against the styles map, and an unknown one is refused — the hotel's
	 * config decides which notification types exist, and a bubble with no style has no icon, no
	 * link and no layout to build from. Rejections are logged rather than swallowed: they render
	 * nothing and throw nothing, which is otherwise indistinguishable from a delivery failure.
	 *
	 * @param content The notification text
	 * @param type The notification style type key
	 * @param iconBitmap Optional explicit icon bitmap (overrides any icon a
	 * styles map would have resolved, had one existed)
	 * @param iconAssetUri Optional icon asset URI
	 * @param iconSrc Optional icon source
	 * @param internalLink Optional internal link to execute on click
	 * @param extraData Optional per-notification data (e.g. "id" for dedup)
	 * @returns The current queue length, or 0 if rejected/disabled
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::addItem()
    addItem(
        content: string,
        type: string,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::addItem() param3
        iconBitmap: ImageBitmap | null = null,
        iconAssetUri: string | null = null,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::addItem() param5
        iconSrc: string | null = null,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::addItem() param6
        internalLink: string | null = null,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::addItem() param7
        extraData: Record<string, unknown> | null = null
    ): number
    {
        if(this._notifications?.disabled)
        {
            return 0;
        }

        const styles = this.styles;

        if(styles === null)
        {
            return 0;
        }

        const styleMap = styles.getValue(type) as OrderedMap<string, unknown> | null;

        if(styleMap === null)
        {
            log.warn(`No "${type}" entry in ${SingularNotificationController.CONFIG_ASSET} — notification dropped: "${content}"`);

            return 0;
        }

        const notificationId = (extraData?.['id'] as string | null) ?? null;

        if(notificationId != null && this.hasNotificationById(notificationId))
        {
            return this._queue.length;
        }

        const style = new HabboNotificationItemStyle(styleMap, iconBitmap, iconAssetUri, true, iconSrc, extraData ?? {}, type);

        if(internalLink)
        {
            style.internalLink = internalLink;
        }

        const item = new HabboNotificationItem(content, style, this);
        this._queue.push(item);

        log.debug(`Notification queued: "${content}" [${type}]`);

        return this._queue.length;
    }

    /**
	 * Remove all notifications matching the given id — both the ones still queued and the bubble
	 * already on screen, which fades out rather than vanishing.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::removeNotificationById()
    removeNotificationById(notificationId: string | null): void
    {
        if(notificationId == null) return;

        for(let i = 0; i < this._queue.length; i++)
        {
            const item = this._queue[i];

            if(item != null && item.notificationId === notificationId)
            {
                item.dispose();
                this._queue.splice(i, 1);
                i--;
            }
        }

        this._viewManager?.removeNotificationById(notificationId);
    }

    /**
	 * Whether a notification with the given id is currently queued or on screen.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::hasNotificationById()
    hasNotificationById(notificationId: string | null): boolean
    {
        if(notificationId == null) return false;

        for(const item of this._queue)
        {
            if(item.notificationId === notificationId)
            {
                return true;
            }
        }

        return this._viewManager !== null && this._viewManager.hasNotificationId(notificationId);
    }

    /**
	 * Add a song playing notification
	 *
	 * @param songName The name of the song
	 * @param songAuthor The author of the song
	 */
    // AS3: .../src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::addSongPlayingNotification()
    addSongPlayingNotification(songName: string, songAuthor: string): void
    {
        // AS3 registers the two parameters and then reads the raw entry back, skipping the
        // notification entirely when the key is missing. `getLocalizationWithParams()` is this
        // port's one-call equivalent; the empty default reproduces that skip, since an unknown key
        // yields nothing to show.
        const content = this._notifications?.localizationManager?.getLocalizationWithParams(
            'soundmachine.notification.playing', '', 'songname', songName, 'songauthor', songAuthor
        ) ?? '';

        if(content.length === 0) return;

        this.addItem(content, 'soundmachine');
    }

    /**
	 * Handle an internal link click from a notification
	 *
	 * @param link The internal link string
	 */
    // AS3: .../src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::onInternalLink()
    onInternalLink(link: string): void
    {
        this._notifications?.createLinkEvent(link);
    }

    /**
	 * Show the moderation disclaimer notification. Deferred (via a delayed timer)
	 * while the new-user room-enter effect is running, so it doesn't overlap it;
	 * only shown once per session.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::showModerationDisclaimer()
    showModerationDisclaimer(): void
    {
        if(RoomEnterEffect.isRunning())
        {
            if(this._moderationDisclaimerTimer == null)
            {
                this._moderationDisclaimerTimer = setTimeout(
                    () =>
                    {
                        this._moderationDisclaimerTimer = null;
                        this.showModerationDisclaimer();
                    },
                    RoomEnterEffect.totalRunningTime + SingularNotificationController.MODERATION_DISCLAIMER_DELAY_MS
                );
            }
        }
        else if(!this._moderationDisclaimerShown)
        {
            // AS3's own default is the literal "NA", which is what shows if the hotel never
            // defined the text — kept rather than substituting something friendlier.
            const content = this._notifications?.localizationManager?.getLocalizationWithParams(
                'mod.chatdisclaimer', 'NA'
            ) ?? 'NA';

            this.addItem(content, 'info');
            this._moderationDisclaimerShown = true;
            log.debug('Moderation disclaimer shown');
        }
    }

    /**
	 * Show club gift notification
	 *
	 * @param numGifts Number of available club gifts
	 */
    // AS3: .../src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::showClubGiftNotification()
    showClubGiftNotification(numGifts: number): void
    {
        // A bubble the member dismissed stays dismissed: `isCancelled` outlives the window, which
        // `visible` alone cannot express once dispose() has cleared it.
        if(this._clubGiftNotification !== null && (this._clubGiftNotification.visible || this._clubGiftNotification.isCancelled))
        {
            return;
        }

        this._clubGiftNotification = new ClubGiftNotification(
            numGifts,
            this._notifications?.windowManager ?? null,
            this._notifications?.catalog ?? null,
            this._notifications?.toolBar ?? null
        );
    }

    /**
	 * Show safety locked notification
	 *
	 * @param userId The user ID
	 */
    // AS3: .../src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::showSafetyLockedNotification()
    showSafetyLockedNotification(userId: number): void
    {
        if(this._safetyLockedNotification !== null && this._safetyLockedNotification.visible) return;

        this._safetyLockedNotification = new SafetyLockedNotification(
            userId,
            this._notifications?.windowManager ?? null,
            this._notifications?.catalog ?? null,
            this._notifications?.toolBar ?? null
        );
    }

    /**
	 * Hide the safety locked notification
	 */
    // AS3: .../src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::hideSafetyLockedNotification()
    hideSafetyLockedNotification(): void
    {
        // AS3 disposes without clearing the field, so a later show() still sees the old instance
        // — harmless, because `visible` is false once the window is gone. Kept as written.
        this._safetyLockedNotification?.dispose();
    }

    /**
	 * Shows every new-feature promo whose configured condition is currently met
	 *
	 * The active features are a comma-separated hotel property, so which promos exist is a
	 * server-side decision. Each is filtered by its own condition before a view is built.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::maybeShowNewFeatureNotification()
    maybeShowNewFeatureNotification(retryCount: number = 0): void
    {
        if(this._disposed) return;

        // AS3 replaces the vector wholesale here, abandoning whatever the previous sweep built.
        // Disposing them first is the port's own correction: this method can be re-entered by a
        // retry, and a leaked view keeps its toolbar extension slot for the session.
        this.disposeNewFeatureNotifications();

        const active = this._notifications?.getProperty('notifications.new_feature.active') ?? '';

        for(const key of active.split(','))
        {
            if(key.length !== 0) this.maybeShowNewFeatureNotificationByKey(key, retryCount);
        }
    }

    /**
	 * Builds one promo, or waits for the data its condition needs
	 *
	 * A condition can be unanswerable rather than false — the reward track it names may simply not
	 * have arrived yet — which is what the retry is for.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::maybeShowNewFeatureNotificationByKey()
    private maybeShowNewFeatureNotificationByKey(key: string, retryCount: number): void
    {
        if(this._disposed) return;

        const state = this.getNewFeatureConditionState(key);

        if(state === SingularNotificationController.NEW_FEATURE_CONDITION_STATE_HIDDEN) return;

        if(state === SingularNotificationController.NEW_FEATURE_CONDITION_STATE_UNAVAILABLE)
        {
            if(retryCount < SingularNotificationController.NEW_FEATURE_CONDITION_MAX_RETRIES)
            {
                setTimeout(
                    () => this.maybeShowNewFeatureNotificationByKey(key, retryCount + 1),
                    SingularNotificationController.NEW_FEATURE_CONDITION_RETRY_DELAY_MS
                );
            }

            return;
        }

        this._newFeatureNotifications.push(new NewFeatureNotification(
            this._notifications?.windowManager ?? null,
            this._notifications?.toolBar ?? null,
            this._notifications?.localizationManager ?? null,
            this._notifications,
            key
        ));
    }

    /**
	 * Resolves one feature's condition to visible, hidden, or not-yet-known
	 *
	 * An unconfigured or malformed condition is visible — the active-list property is the opt-in,
	 * the condition only narrows it. `reward_track_incomplete` is the only kind AS3 implements.
	 */
    // DEVIATION: AS3 answers `reward_track_incomplete` from the reward-track controller (UNAVAILABLE
    //   while the track is unknown, which retries, then HIDDEN or VISIBLE). The RPG fork removed the
    //   Reward track, so no track can ever arrive and the condition answers HIDDEN at once — the same
    //   end result as AS3 exhausting its retries, without the timers.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::getNewFeatureConditionState()
    private getNewFeatureConditionState(key: string): number
    {
        const condition = this._notifications?.getProperty('notifications.new_feature.condition.' + key) ?? '';

        if(condition.length === 0) return SingularNotificationController.NEW_FEATURE_CONDITION_STATE_VISIBLE;

        const parts = condition.split(':');

        if(parts.length < 2) return SingularNotificationController.NEW_FEATURE_CONDITION_STATE_VISIBLE;

        if(parts[0] === SingularNotificationController.NEW_FEATURE_CONDITION_REWARD_TRACK_INCOMPLETE)
        {
            return SingularNotificationController.NEW_FEATURE_CONDITION_STATE_HIDDEN;
        }

        return SingularNotificationController.NEW_FEATURE_CONDITION_STATE_VISIBLE;
    }

    // TS-only: AS3 drops the vector and lets the views leak; see maybeShowNewFeatureNotification().
    private disposeNewFeatureNotifications(): void
    {
        for(const notification of this._newFeatureNotifications) notification.dispose();

        this._newFeatureNotifications = [];
    }

    /**
	 * Replaces a displayed notification's icon once the badge image it asked for arrives.
	 *
	 * The achievement and badge notifications are built before their artwork exists —
	 * `requestBadgeImage()` returns null on a cold cache — so the bubble goes up iconless and is
	 * patched here rather than being held back.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::onBadgeImage()
    private onBadgeImage(event: BadgeImageReadyEvent): void
    {
        if(event != null && this._viewManager !== null)
        {
            this._viewManager.replaceIcon(event);
        }
    }

    /**
	 * Reads `habbo_notifications_config_xml` into `_config`, then swaps each style's `icon` from
	 * the asset *name* the XML carries to the bitmap itself, exactly as AS3 does — the item style
	 * downstream expects a bitmap there, not a name.
	 *
	 * The names in the config carry AS3's `_png` linkage suffix (`if_icon_temp_png`), which this
	 * port's asset build strips when it writes the file (`if_icon_temp.png` → `if_icon_temp`).
	 * Looking the name up verbatim returns null and the notification silently loses its icon, so
	 * the suffix comes off here.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::SingularNotificationController()
    private parseConfig(): void
    {
        const asset = this._notifications?.assetLibrary?.getAssetByName(
            SingularNotificationController.CONFIG_ASSET
        ) as XmlAsset | null;
        const document = asset?.content ?? null;

        if(document?.documentElement == null)
        {
            log.warn(
                `Missing "${SingularNotificationController.CONFIG_ASSET}" — every notification will be dropped`
            );

            return;
        }

        XMLVariableParser.parseVariableList(document.documentElement.children, this._config);

        const styles = this.styles;

        if(styles === null) return;

        for(let i = 0; i < styles.length; i++)
        {
            const style = styles.getWithIndex(i) as OrderedMap<string, unknown> | null;
            const iconName = style?.getValue('icon') ?? null;

            if(style === null || typeof iconName !== 'string') continue;

            const icon = this._notifications?.assetLibrary?.getAssetByName(
                iconName.replace(/_png$/, '')
            )?.content ?? null;

            if(icon === null)
            {
                log.warn(`Notification style icon "${iconName}" is not in the asset library`);
            }

            style.setValue('icon', icon);
        }
    }

    /**
	 * The `styles` sub-map: one entry per notification type.
	 */
    // TS-only: AS3 reads `_SafeStr_6817["styles"]` inline at each of its three use sites.
    private get styles(): OrderedMap<string, unknown> | null
    {
        return (this._config.getValue('styles') as OrderedMap<string, unknown> | null) ?? null;
    }

    // AS3: .../src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        if(this._moderationDisclaimerTimer != null)
        {
            clearTimeout(this._moderationDisclaimerTimer);
            this._moderationDisclaimerTimer = null;
        }

        this._notifications?.sessionDataManager?.events.off(
            BadgeImageReadyEventClass.BADGE_IMAGE_READY, this._onBadgeImageBound
        );

        if(this._viewManager != null)
        {
            this._viewManager.dispose();
            this._viewManager = null;
        }

        if(this._clubGiftNotification != null)
        {
            this._clubGiftNotification.dispose();
            this._clubGiftNotification = null;
        }

        if(this._safetyLockedNotification != null)
        {
            this._safetyLockedNotification.dispose();
            this._safetyLockedNotification = null;
        }

        this.disposeNewFeatureNotifications();

        if(this._alertDialogManager != null)
        {
            this._alertDialogManager.dispose();
        }

        // Dispose all queued items
        for(const item of this._queue)
        {
            item.dispose();
        }
        this._queue = [];

        if(this._notifications != null)
        {
            this._notifications.removeUpdateReceiver(this);
            this._notifications = null;
        }

        this._disposed = true;
    }

    /**
	 * Get the next item from the front of the queue
	 */
    // AS3: .../src/com/sulake/habbo/notifications/singular/SingularNotificationController.as::getNextItemFromQueue()
    private getNextItemFromQueue(): HabboNotificationItem | null
    {
        const items = this._queue.splice(0, 1);
        return items[0] ?? null;
    }
}
