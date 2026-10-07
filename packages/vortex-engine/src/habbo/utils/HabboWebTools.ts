import {EventEmitter} from 'eventemitter3';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.utils.HabboWebTools');

/**
 * Events emitted by HabboWebTools
 */
export interface IHabboWebToolsEvents
{
    'roomVisited': (roomId: number) => void;
    'logout': () => void;
    'disconnect': (reason: number, message: string) => void;
    'figureUpdated': (figure: string) => void;
    'subscriptionUpdated': (isActive: boolean) => void;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/HabboWebTools.as::closeWebPageAndRestoreClient()
    'closeWebPageAndRestoreClient': () => void;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/HabboWebTools.as::openExternalLinkWarning()
    'openExternalLink': (url: string) => void;
}

/**
 * Habbo Web Tools
 *
 * Static utility class for browser/web interaction.
 * In AS3 this used Flash ExternalInterface to communicate with the hosting page.
 * In Vortex we use standard browser APIs (window.open, etc.) and emit events
 * for features that need to notify other parts of the application.
 *
 * @see source_as_win63/habbo/utils/HabboWebTools.as
 */
export class HabboWebTools
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/utils/HabboWebTools.as::ADVERTISEMENT
    public static readonly ADVERTISEMENT: string = 'advertisement';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/HabboWebTools.as::_SafeStr_11147
    // AS3 name unrecoverable (obfuscated in WIN63 and win63_version, absent entirely from
    // PRODUCTION which predates it) - derived from its value. Unused anywhere in the AS3 tree
    // (dead field, same as ADVERTISEMENT above); kept for interface completeness.
    public static readonly TARGET_SELF: string = '_self';
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::WINDOW_HABBO_MAIN
    public static readonly WINDOW_HABBO_MAIN: string = 'habboMain';
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::OPEN_INTERNAL_LINK_FROM_WEB_CALLBACK
    public static readonly OPEN_INTERNAL_LINK_FROM_WEB_CALLBACK: string = 'openlink';
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::GOTO_ROOM_FROM_WEB_CALLBACK
    public static readonly GOTO_ROOM_FROM_WEB_CALLBACK: string = 'openroom';
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::HABBLET_AVATARS
    public static readonly HABBLET_AVATARS: string = 'avatars';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/HabboWebTools.as::HABBLET_PRIVACY
    public static readonly HABBLET_PRIVACY: string = 'privacy';
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::HABBLET_MINI_MAIL
    public static readonly HABBLET_MINI_MAIL: string = 'minimail';
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::HABBLET_ROOM_ENTER_AD
    public static readonly HABBLET_ROOM_ENTER_AD: string = 'roomenterad';
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::HABBLET_NEWS
    public static readonly HABBLET_NEWS: string = 'news';
    private static readonly _toolEvents = new EventEmitter<IHabboWebToolsEvents>();

    private static _baseUrl: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/HabboWebTools.as::_SafeStr_5915
    private static _isSpaWeb: boolean = false;

    /**
	 * Marks whether the hosting page is a SPA-style web habblet host.
	 *
	 * AS3 only reads this flag inside `if(ExternalInterface.available)` branches; this port has no
	 * Flash ExternalInterface, so every one of those branches is already dead here (every other
	 * method in this class ports the "ExternalInterface not available" fallback instead). The
	 * setter is kept for API completeness in case a future host bridge wires it up.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/HabboWebTools.as::set isSpaWeb()
    static set isSpaWeb(value: boolean)
    {
        HabboWebTools._isSpaWeb = value;
    }

    static get baseUrl(): string
    {
        return HabboWebTools._baseUrl;
    }

    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::set baseUrl()
    static set baseUrl(value: string)
    {
        HabboWebTools._baseUrl = value;
    }

    /**
	 * Event emitter for web tool events.
	 * Named `toolEvents` to avoid conflict with Component.events (see MEMORY.md).
	 */
    static get toolEvents(): EventEmitter<IHabboWebToolsEvents>
    {
        return HabboWebTools._toolEvents;
    }

    /**
	 * Open a web page in a named window/tab
	 *
	 * @param url The URL to open
	 * @param target The window target name (defaults to WINDOW_HABBO_MAIN)
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::openWebPage()
    static openWebPage(url: string, target: string = ''): void
    {
        if(!url) return;

        if(!target)
        {
            target = HabboWebTools.WINDOW_HABBO_MAIN;
        }

        const resolvedUrl = HabboWebTools.resolveUrl(url);
        window.open(resolvedUrl, target);
    }

    /**
	 * Open a page in the main habbo window
	 *
	 * @param url The URL to open
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::openPage()
    static openPage(url: string): void
    {
        if(!url) return;

        const resolvedUrl = HabboWebTools.resolveUrl(url);
        window.open(resolvedUrl, HabboWebTools.WINDOW_HABBO_MAIN);
    }

    /**
	 * Open a web page and minimize the client
	 *
	 * @param url The URL to open
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::openWebPageAndMinimizeClient()
    static openWebPageAndMinimizeClient(url: string): void
    {
        if(!url) return;

        const resolvedUrl = HabboWebTools.resolveUrl(url);
        window.open(resolvedUrl, HabboWebTools.WINDOW_HABBO_MAIN);
    }

    /**
	 * Navigate to a raw URL in the given target window.
	 *
	 * Unlike openWebPage(), AS3 does not resolve this against the base URL — it navigates to the
	 * string as given.
	 *
	 * @param url The URL to navigate to
	 * @param target The window target name; AS3 passes null to use the current window
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/HabboWebTools.as::navigateToURL()
    static navigateToURL(url: string, target: string | null = null): void
    {
        if(!url || url.length === 0)
        {
            log.warn('Can not navigate to empty url');

            return;
        }

        window.open(url, target ?? HabboWebTools.TARGET_SELF);
    }

    /**
	 * Notify the host page that an external link was requested, so it can show its own
	 * confirmation warning before navigating.
	 *
	 * AS3's primary path is `ExternalInterface.call("FlashExternalInterface.openExternalLink", ...)`,
	 * letting the hosting page own the warning UI; `navigateToURL()` is only its
	 * ExternalInterface-unavailable fallback. This port has no host page listening yet, so this
	 * mirrors the other host-notification methods below (roomVisited, logout, etc.) by emitting on
	 * `toolEvents` rather than navigating directly.
	 *
	 * @param url The external URL to open
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/HabboWebTools.as::openExternalLinkWarning()
    static openExternalLinkWarning(url: string): void
    {
        if(!url) return;

        HabboWebTools._toolEvents.emit('openExternalLink', url);

        log.debug('Open external link warning: ' + url);
    }

    /**
	 * Notify the host page to close the web page it opened and restore the client view
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/HabboWebTools.as::closeWebPageAndRestoreClient()
    static closeWebPageAndRestoreClient(): void
    {
        HabboWebTools._toolEvents.emit('closeWebPageAndRestoreClient');

        log.debug('Close web page and restore client');
    }

    /**
	 * Log an event to the web page
	 *
	 * @param message The event message to log
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::logEventLog()
    static logEventLog(message: string): void
    {
        log.debug('EventLog: ' + message);
    }

    /**
	 * Send a heartbeat signal (no-op in browser context)
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::sendHeartBeat()
    static sendHeartBeat(): void
    {
        // No-op: Flash ExternalInterface heartbeat not needed in browser
    }

    /**
	 * Notify that a room was visited
	 *
	 * @param roomId The visited room ID
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::roomVisited()
    static roomVisited(roomId: number): void
    {
        HabboWebTools._toolEvents.emit('roomVisited', roomId);

        log.debug('Room visited: ' + roomId);
    }

    /**
	 * Trigger a logout
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::logOut()
    static logOut(): void
    {
        HabboWebTools._toolEvents.emit('logout');

        log.debug('Logout requested');
    }

    /**
	 * Send a disconnect notification to the web layer
	 *
	 * @param reason The disconnect reason code
	 * @param message The disconnect message
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::sendDisconnectToWeb()
    static sendDisconnectToWeb(reason: number, message: string): void
    {
        HabboWebTools._toolEvents.emit('disconnect', reason, message);

        log.debug('Disconnect: reason=' + reason + ', message=' + message);
    }

    /**
	 * Notify that the user's figure was updated
	 *
	 * @param figure The new figure string
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::updateFigure()
    static updateFigure(figure: string): void
    {
        HabboWebTools._toolEvents.emit('figureUpdated', figure);

        log.debug('Figure updated: ' + figure);
    }

    /**
	 * Notify that the user's club subscription status changed
	 *
	 * @param isActive Whether the club subscription is currently active
	 * @see sources/win63_version/habbo/catalog/HabboCatalog.as::onSubscriptionInfo() (ExternalInterface.call("FlashExternalInterface.subscriptionUpdated", ...))
	 */
    static subscriptionUpdated(isActive: boolean): void
    {
        HabboWebTools._toolEvents.emit('subscriptionUpdated', isActive);

        log.debug('Subscription updated: ' + isActive);
    }

    /**
	 * Open a web habblet
	 *
	 * @param habblet The habblet type to open
	 * @param params Optional parameters
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::openWebHabblet()
    static openWebHabblet(habblet: string, params?: string): void
    {
        log.debug('openWebHabblet: ' + habblet + (params ? ', params=' + params : ''));
    }

    /**
	 * Close a web habblet
	 *
	 * @param habblet The habblet type to close
	 * @param params Optional parameters
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::closeWebHabblet()
    static closeWebHabblet(habblet: string, params?: string): void
    {
        log.debug('closeWebHabblet: ' + habblet + (params ? ', params=' + params : ''));
    }

    /**
	 * Open the minimail habblet
	 *
	 * @param params Optional parameters
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::openMinimail()
    static openMinimail(params?: string): void
    {
        HabboWebTools.openWebHabblet(HabboWebTools.HABBLET_MINI_MAIL, params);
    }

    /**
	 * Open the news habblet
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::openNews()
    static openNews(): void
    {
        HabboWebTools.openWebHabblet(HabboWebTools.HABBLET_NEWS);
    }

    /**
	 * Close the news habblet
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::closeNews()
    static closeNews(): void
    {
        HabboWebTools.closeWebHabblet(HabboWebTools.HABBLET_NEWS);
    }

    /**
	 * Open the avatars page
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::openAvatars()
    static openAvatars(): void
    {
        HabboWebTools.openWebHabblet(HabboWebTools.HABBLET_AVATARS);
    }

    /**
	 * Open the privacy settings habblet
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/HabboWebTools.as::openPrivacy()
    static openPrivacy(): void
    {
        HabboWebTools.openWebHabblet(HabboWebTools.HABBLET_PRIVACY);
    }

    /**
	 * Open the room enter ad
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::openRoomEnterAd()
    static openRoomEnterAd(): void
    {
        HabboWebTools.openWebHabblet(HabboWebTools.HABBLET_ROOM_ENTER_AD, '');
    }

    /**
	 * Show an external game
	 *
	 * @param gameId The game identifier
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::showGame()
    static showGame(gameId: string): void
    {
        log.debug('showGame: ' + gameId);
    }

    /**
	 * Hide the external game
	 */
    // AS3: .../src/com/sulake/habbo/utils/HabboWebTools.as::hideGame()
    static hideGame(): void
    {
        log.debug('hideGame');
    }

    /**
	 * Resolve a URL: if it starts with "http", use as-is; otherwise prepend baseUrl
	 */
    private static resolveUrl(url: string): string
    {
        if(url.indexOf('http') === 0)
        {
            return url;
        }

        return HabboWebTools._baseUrl + '/' + url;
    }
}
