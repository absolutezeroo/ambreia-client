/**
 * ChatInputWidgetHandler
 *
 * Everything typed into the chat box passes through here. Most of it is said out loud; about fifty
 * words starting with `:` are commands instead, and this is where they are recognised.
 *
 * Three details of AS3's dispatch are easy to get wrong and are load-bearing:
 *
 * - **Not every command swallows the message.** AS3 alternates `return null` (consumed) with
 *   `break` (falls through and is *also* spoken). `:d` is the clearest case — it plays the laugh
 *   and then says ":D" — and the group from `:crashme` to `:q` exists only to be spoken, since the
 *   server handles those. `handleSlashCommand()` mirrors that with its boolean return.
 * - **`:kick` and `:mute` test `!hasSecurity(4)`.** The negation is deliberate: staff fall
 *   *through* so their text reaches the server's own command parser instead of the client one.
 * - **A bare `x` as the argument means "the avatar I have selected".** Resolved before the switch,
 *   and substituted into the text too, so `:ejectall x` sends the resolved name.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as
 */
import {ColorMatrixFilter} from 'pixi.js';
import {MouseCursorControl} from '@core/window/utils/MouseCursorControl';
import type {IRoomWidgetHandler} from '@habbo/ui/IRoomWidgetHandler';
import type {RoomWidgetChatSelectAvatarMessage} from '@habbo/ui/widget/messages/RoomWidgetChatSelectAvatarMessage';
import type {IRoomWidgetHandlerContainer} from '@habbo/ui/IRoomWidgetHandlerContainer';
import type {RoomWidgetMessage} from '@habbo/ui/widget/messages/RoomWidgetMessage';
import type {RoomWidgetUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetUpdateEvent';
import {RoomWidgetChatMessage} from '@habbo/ui/widget/messages/RoomWidgetChatMessage';
import type {RoomWidgetChatTypingMessage} from '@habbo/ui/widget/messages/RoomWidgetChatTypingMessage';
import {RoomWidgetFloodControlEvent} from '@habbo/ui/widget/events/RoomWidgetFloodControlEvent';
import {RoomWidgetRequestWidgetMessage} from '@habbo/ui/widget/messages/RoomWidgetRequestWidgetMessage';
import type {RoomChatInputWidget} from '@habbo/ui/widget/chatinput/RoomChatInputWidget';
import {RoomSessionChatEvent} from '@habbo/session/events/RoomSessionChatEvent';
import {AvatarExpressionEnum} from '@habbo/ui/widget/enums/AvatarExpressionEnum';
import {RoomEngineZoomEvent} from '@habbo/room/events/RoomEngineZoomEvent';
import {HabboToolbarEvent} from '@habbo/toolbar/events/HabboToolbarEvent';
import {HabboWebTools} from '@habbo/utils/HabboWebTools';
import {RoomShakingEffect} from '@room/utils/RoomShakingEffect';
import type {IRoomObjectSpriteVisualization} from '@room/object/visualization/IRoomObjectSpriteVisualization';
import type {IRoomObject} from '@room/object/IRoomObject';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import {Logger} from '@core/utils/Logger';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import {RoomStressTest} from '@habbo/room/utils/RoomStressTest';
import {PerfMonitorWindow} from '@habbo/perf/PerfMonitorWindow';
import {AvatarRenderMode} from '@habbo/avatar/AvatarRenderMode';
import {RoomCullingMode} from '@habbo/room/renderer/RoomCullingMode';
import {FriendBarResizeEvent} from '@habbo/friendbar/events/FriendBarResizeEvent';
import {HideRoomWidgetEvent} from '@habbo/ui/widget/events/HideRoomWidgetEvent';
import {SessionDataToWidgetEvent} from '@habbo/session/events/SessionDataToWidgetEvent';
import {PerkType} from '../../communication/enum/PerkType';

const log = Logger.getLogger('habbo.ui.handler.ChatInputWidgetHandler');

/**
 * The Origins windows `:fishwindow` can open, by their source name in
 * `docs/vortex-original/origins/*.window.txt`. A closed set rather than a free string, so a typo
 * says so instead of quietly building a layout that does not exist.
 */
const FISHING_WINDOWS = new Set([
    'fishing_store_a',
    'fishing_store_c',
    'derby_ui',
    'derby_standard',
    'derby_frenzy',
    'derby_leader_b',
]);

export class ChatInputWidgetHandler implements IRoomWidgetHandler
{
    /**
     * The room-object category the demonic-triggers command walks. AS3 passes a bare 10.
     */
    // AS3: .../src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::processWidgetMessage()
    private static readonly FURNITURE_CATEGORY: number = 10;

    /** Security level 4 is staff; several commands defer to the server for them. */
    // AS3: .../src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::processWidgetMessage()
    private static readonly SECURITY_STAFF: number = 4;

    /**
     * Ceiling on a `:stresstest` object count. See `parseStressCount()` for why one exists.
     *
     * Raised from 500 once 500 avatars measured 96 fps and an accidental double run — roughly a
     * thousand, from a cleanup the engine had refused — still held 49. The old ceiling predated the
     * sprite-parts path, when a hundred avatars cost twelve.
     */
    // TS-only: no AS3 counterpart. See habbo/room/utils/RoomStressTest.
    private static readonly STRESS_TEST_MAX_COUNT: number = 2000;

    /**
     * Ceiling on the `:stresstest` duration argument, in seconds.
     *
     * Separate from the object ceiling because they shared one before, which tied how long a run may
     * last to how big it may be — raising the second would have let a mistyped duration hold the room
     * for half an hour.
     */
    // TS-only: no AS3 counterpart. See habbo/room/utils/RoomStressTest.
    private static readonly STRESS_TEST_MAX_SECONDS: number = 600;

    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::_container
    private _container: IRoomWidgetHandlerContainer | null = null;

    // AS3: .../src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::_SafeStr_4549 (from `set widget()`)
    private _widget: RoomChatInputWidget | null = null;

    /**
     * Whether the `:showstats` FPS overlay is currently on.
     *
     * AS3 has no such field — it calls `setFpsCounterEnabled(true)` unconditionally, so the overlay
     * can never be dismissed once shown. Kept as a toggle deliberately.
     */
    // TS-only: AS3 only ever enables the counter; this makes `:showstats` reversible.
    private _statsShown: boolean = false;

    // AS3: .../src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::_demonicTriggers
    private _demonicTriggers: boolean = false;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::_mouseHidden
    // Derived name: obfuscated in the primary tree; toggled by `:hidemouse`.
    private _mouseHidden: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::get container()
    public get container(): IRoomWidgetHandlerContainer | null
    {
        return this._container;
    }

    // AS3: .../src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::set container()
    public set container(value: IRoomWidgetHandlerContainer | null)
    {
        this._container = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::set widget()
    public set widget(value: RoomChatInputWidget | null)
    {
        this._widget = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::get type()
    public get type(): string
    {
        return 'RWE_CHAT_INPUT_WIDGET';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::dispose()
    public dispose(): void
    {
        this._disposed = true;
        this._container = null;
        this._widget = null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::getWidgetMessages()
    public getWidgetMessages(): string[]
    {
        return ['RWCTM_TYPING_STATUS', 'RWCM_MESSAGE_CHAT', 'RWCSAM_MESSAGE_SELECT_AVATAR'];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::processWidgetMessage()
    public processWidgetMessage(message: RoomWidgetMessage): RoomWidgetUpdateEvent | null
    {
        switch(message.type)
        {
            case 'RWCTM_TYPING_STATUS':
            {
                const typingMessage = message as RoomWidgetChatTypingMessage;

                this._container?.roomSession?.sendChatTypingMessage(typingMessage.isTyping);
                break;
            }

            case 'RWCM_MESSAGE_CHAT':
            {
                if(!this._container?.roomSession) break;

                const chatMessage = message as RoomWidgetChatMessage;

                if(chatMessage.text === '') return null;

                const parts = chatMessage.text.split(' ');
                let text = chatMessage.text;

                if(parts.length > 0)
                {
                    const command = parts[0];
                    let argument = parts.length > 1 ? parts[1] : '';

                    // `x` stands in for the selected avatar, in the argument *and* in the text that
                    // is ultimately sent — `:ejectall x` has to reach the server with a real name.
                    if(command.charAt(0) === ':' && argument === 'x')
                    {
                        const selectedId = this._container.roomEngine?.getSelectedAvatarId() ?? -1;

                        if(selectedId > -1)
                        {
                            const selected = this._container.roomSession.userDataManager?.getUserDataByIndex(selectedId) ?? null;

                            if(selected != null)
                            {
                                argument = selected.name;
                                text = chatMessage.text.replace(' x', ` ${selected.name}`);
                            }
                        }
                    }

                    if(this.handleSlashCommand(command.toLowerCase(), argument, text, parts)) return null;
                }

                // Resolve against the stored chat-style preference: a style change gets remembered
                // (unless the message asks for -1, the "use my preference" sentinel), then the
                // styleId actually sent is re-read from the preference, not the raw message value.
                let styleId = chatMessage.styleId;
                const freeFlowChat = this._container.freeFlowChat;

                if(freeFlowChat)
                {
                    if(freeFlowChat.preferedChatStyle !== chatMessage.styleId && chatMessage.styleId !== -1)
                    {
                        freeFlowChat.preferedChatStyle = chatMessage.styleId;
                    }

                    styleId = freeFlowChat.preferedChatStyle;
                }

                switch(chatMessage.chatType)
                {
                    case RoomWidgetChatMessage.CHAT_TYPE_WHISPER:
                        this._container.roomSession.sendWhisperMessage(chatMessage.recipientName, text, styleId);
                        break;
                    case RoomWidgetChatMessage.CHAT_TYPE_SHOUT:
                        this._container.roomSession.sendShoutMessage(text, styleId);
                        break;
                    default:
                        this._container.roomSession.sendChatMessage(text, styleId);
                        break;
                }

                this._container.habboTracking?.trackEventLog('Tutorial', 'interaction', 'avatar.chat');

                break;
            }

            case 'RWCSAM_MESSAGE_SELECT_AVATAR':
            {
                const selectMessage = message as RoomWidgetChatSelectAvatarMessage;

                if(selectMessage)
                {
                    this._container?.roomEngine?.selectAvatar(selectMessage.roomId, selectMessage.objectId);

                    const userData = this._container?.roomSession?.userDataManager?.getUserDataByIndex(selectMessage.objectId);

                    if(userData)
                    {
                        this._container?.moderation?.userSelected(userData.webID, selectMessage.userName);
                    }
                }

                break;
            }
        }

        return null;
    }

    /**
     * Returns `true` when the command consumed the message — AS3's `return null` — and `false` when
     * it should still be spoken, which is AS3's `break`. The distinction is per-command and
     * sometimes per-branch: `:kiss` swallows the message for a VIP and speaks it for everyone else.
     *
     * `text` is the whole line after the `x` substitution; `parts` is the raw split, needed by the
     * one command (`:uc hotel`) that reads a third word.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::processWidgetMessage()
    private handleSlashCommand(command: string, argument: string, text: string, parts: string[]): boolean
    {
        const container = this._container;

        if(container == null || container.roomSession == null) return false;

        const session = container.roomSession;
        const sessionData = container.sessionDataManager;
        const roomEngine = container.roomEngine;
        const tracking = container.habboTracking;

        switch(command)
        {
            case ':shake':
                RoomShakingEffect.init(250, 5000);
                RoomShakingEffect.turnVisualizationOn();

                return true;

            // Falls through on purpose: the laugh plays *and* ":D" is said.
            case ':d':
            case ';d':
                if(sessionData?.hasVip)
                {
                    session.sendAvatarExpressionMessage(AvatarExpressionEnum.LAUGH.ordinal);
                    tracking?.trackEventLog('OwnAvatarMenu', 'chat', 'laugh');
                }

                return false;

            case ':kiss':
                if(sessionData?.hasVip)
                {
                    session.sendAvatarExpressionMessage(AvatarExpressionEnum.BLOW.ordinal);
                    tracking?.trackEventLog('OwnAvatarMenu', 'chat', 'blow');

                    return true;
                }

                return false;

            case ':67':
                if(container.config?.getBoolean('avatar.expression.67.enabled') && sessionData?.hasVip)
                {
                    session.sendAvatarExpressionMessage(AvatarExpressionEnum.EXPRESSION_67.ordinal);
                    tracking?.trackEventLog('OwnAvatarMenu', 'chat', '67');

                    return true;
                }

                return false;

            case ':jump':
                if(sessionData?.hasVip)
                {
                    session.sendAvatarExpressionMessage(AvatarExpressionEnum.JUMP.ordinal);
                    tracking?.trackEventLog('OwnAvatarMenu', 'chat', 'jump');

                    return true;
                }

                return false;

            case ':news':
                if(container.config?.getBoolean('client.news.embed.enabled'))
                {
                    HabboWebTools.openNews();

                    return true;
                }

                return false;

            case ':mail':
                if(container.config?.getBoolean('client.minimail.embed.enabled'))
                {
                    HabboWebTools.openMinimail('#mail/inbox/');

                    return true;
                }

                return false;

            // Note the negation, here and in the mute pair below: a staff member falls through so
            // the line reaches the server's own command parser instead of being handled locally.
            case ':kick':
                if(!sessionData?.hasSecurity(ChatInputWidgetHandler.SECURITY_STAFF))
                {
                    if(session.roomControllerLevel >= 1)
                    {
                        const target = session.userDataManager?.getUserDataByName(argument) ?? null;

                        if(target) session.kickUser(target.webID);
                    }

                    return true;
                }

                return false;

            case ':shutup':
            case ':mute':
                if(!sessionData?.hasSecurity(ChatInputWidgetHandler.SECURITY_STAFF))
                {
                    if(session.roomControllerLevel >= 1)
                    {
                        const target = session.userDataManager?.getUserDataByName(argument) ?? null;

                        if(target) session.muteUser(target.webID, 2);
                    }

                    return true;
                }

                return false;

            // Listed so they are visibly *not* client commands: AS3 breaks on all of them, which
            // sends the text to the server, where they are handled.
            case ':crashme':
            case ':resethunt':
            case ':ss':
            case ':qss':
            case ':gd':
            case ':tgl':
            case ':li':
            case ':link':
            case ':rewardtrack':
            case ':q':
                return false;

            case 'o/':
            case '_o/':
                session.sendAvatarExpressionMessage(AvatarExpressionEnum.WAVE.ordinal);

                return true;

            case ':idle':
                session.sendAvatarExpressionMessage(AvatarExpressionEnum.IDLE.ordinal);
                tracking?.trackEventLog('OwnAvatarMenu', 'chat', 'idle');

                return true;

            case '_b':
                session.sendAvatarExpressionMessage(AvatarExpressionEnum.RESPECT.ordinal);
                tracking?.trackEventLog('OwnAvatarMenu', 'chat', 'respect');

                return true;

            case ':showstats':
                this._statsShown = !this._statsShown;
                roomEngine?.setFpsCounterEnabled(this._statsShown);

                return true;

            // TS-only: no AS3 counterpart. Synthetic render load for reading the `:showstats`
            // budget at a controlled avatar count — `:stresstest <seconds> <avatars> [furniture]`.
            // See habbo/room/utils/RoomStressTest.
            // TS-only: no AS3 counterpart. Opens the live frame-budget monitor as a real window of
            // the client's own window system. See habbo/perf/PerfMonitorWindow.
            case ':perfmon':
            {
                const manager = container.windowManager ?? null;

                if(manager !== null)
                {
                    PerfMonitorWindow.toggle(
                        manager,
                        container.roomEngine ?? null,
                        session.roomId,
                        session.ownUserRoomId
                    );
                }

                return true;
            }

            // TS-only: no AS3 counterpart. Switches the room between compositing each avatar into one
            // texture and drawing its parts as batched sprites — `:spriteparts [on|off]`, toggling
            // when told neither. Both paths stay live precisely so a `:stresstest` run can be taken
            // with each; every conclusion reached here by reading code rather than measuring was
            // wrong. See habbo/avatar/AvatarRenderMode.
            case ':spriteparts':
            {
                // The setter bumps a generation, and each avatar's cache flushes itself on its next
                // lookup — nothing owns those caches collectively, so there is no reset to call here.
                AvatarRenderMode.spriteParts = argument === 'on'
                    ? true
                    : (argument === 'off' ? false : !AvatarRenderMode.spriteParts);

                log.info(`:spriteparts — avatars now render as ${AvatarRenderMode.spriteParts ? 'batched sprite parts' : 'one composed image'}.`);

                return true;
            }

            // TS-only: no AS3 counterpart. Skips the visualization update for avatars far outside the
            // viewport — `:roomculling [on|off]`, toggling when told neither. See
            // habbo/room/renderer/RoomCullingMode, which is explicit that AS3 does no such thing.
            case ':roomculling':
            {
                RoomCullingMode.avatars = argument === 'on'
                    ? true
                    : (argument === 'off' ? false : !RoomCullingMode.avatars);

                log.info(`:roomculling — off-screen avatar updates are now ${RoomCullingMode.avatars ? 'skipped' : 'running'}.`);

                return true;
            }

            // TS-only: no AS3 counterpart. Opens Origins' own Fish-O-Pedia — the book rebuilt on
            // `hh_fishing.cct`'s plates — beside the panel the inventory tab still shows, so the two
            // can be compared before one replaces the other. See docs/vortex-original/fishing.md §19.
            case ':fishpedia':
            {
                const fishing = container.fishing;

                if(fishing === null)
                {
                    log.warn(':fishpedia — HabboFishing has not resolved; nothing to open.');
                }
                else
                {
                    fishing.openPedia();
                }

                return true;
            }

            // TS-only: no AS3 counterpart. The six windows converted from Origins' own element lists
            // by scripts/origins/convert-window.py. **Artwork only** — layout, sprites and text are
            // finished, the behaviour is not, and §23 of docs/vortex-original/fishing.md lists what
            // each still needs. They are reachable rather than left as XML nothing opens, which is
            // how a finished-looking thing goes unnoticed for months in this port.
            case ':fishwindow':
            {
                const fishing = container.fishing;

                if(fishing === null)
                {
                    log.warn(':fishwindow — HabboFishing has not resolved; nothing to open.');
                }
                else if(FISHING_WINDOWS.has(argument))
                {
                    fishing.openStaticWindow(`vortex_${argument}_xml`);
                }
                else
                {
                    log.warn(`:fishwindow — unknown window "${argument}". One of: ${[...FISHING_WINDOWS].join(', ')}`);
                }

                return true;
            }

            case ':stresstest':
                this.handleStressTest(
                    argument,
                    parts.length > 2 ? parts[2] : '',
                    parts.length > 3 ? parts[3] : ''
                );

                return true;

            case ':ping':
                container.roomSessionManager?.sessionEvents.emit(
                    'RSCE_CHAT_EVENT',
                    new RoomSessionChatEvent(
                        'RSCE_CHAT_EVENT', session, session.ownUserRoomId, '', 11, 1, null,
                        container.habboTracking?.latencyPingMs ?? -1
                    )
                );

                return true;

            // `:fps` sets `stage.frameRate` in AS3. There is no equivalent reachable from
            // here — the PixiJS ticker lives in the client package and the engine must not import
            // from it. Consumed rather than spoken, which is what AS3 does.
            case ':fps':
                return true;

            case ':sign':
                session.sendSignMessage(parseInt(argument, 10));
                tracking?.trackEventLog('OwnAvatarMenu', 'chat', 'sign', undefined, parseInt(argument, 10));

                return true;

            case ':drop':
            case ':dropitem':
                container.processWidgetMessage(new RoomWidgetRequestWidgetMessage('RWUAM_DROP_CARRY_ITEM'));

                return true;

            case ':chooser':
                if(!roomEngine?.activeRoomHasChooserDisabled || session.roomControllerLevel >= 1)
                {
                    container.processWidgetMessage(
                        new RoomWidgetRequestWidgetMessage(RoomWidgetRequestWidgetMessage.REQUEST_USER_CHOOSER)
                    );
                }

                return true;

            case ':furni':
                if(session.roomControllerLevel >= 1 || sessionData?.hasSecurity(2) || sessionData?.isAmbassador)
                {
                    container.processWidgetMessage(
                        new RoomWidgetRequestWidgetMessage(RoomWidgetRequestWidgetMessage.REQUEST_FURNI_CHOOSER)
                    );
                }

                return true;

            case ':pickall':
                sessionData?.pickAllFurniture(session.roomId);

                return true;

            case ':resetscores':
                sessionData?.resetScores(session.roomId);

                return true;

            // The whole line, not the argument: AS3 passes `text` so a trailing filter reaches the
            // server intact.
            case ':ejectall':
                sessionData?.ejectAllFurniture(session.roomId, text);

                return true;

            case ':ejectpets':
                sessionData?.ejectPets(session.roomId);

                return true;

            case ':moonwalk':
            case ':habnam':
            case ':yyxxabxa':
            case ':mutepets':
                sessionData?.sendSpecialCommandMessage(command);

                return true;

            // The one special command that forwards the whole line rather than just its name.
            case ':mpgame':
                sessionData?.sendSpecialCommandMessage(text);

                return true;

            case ':ignore':
                if(argument)
                {
                    const target = session.userDataManager?.getUserDataByName(argument) ?? null;

                    if(target) sessionData?.ignoreUser(target.webID);
                }

                return true;

            case ':unignore':
                if(argument)
                {
                    const target = session.userDataManager?.getUserDataByName(argument) ?? null;

                    if(target) sessionData?.unignoreUser(target.webID);
                }

                return true;

            // Opens the real editor since `window/utils/floorplaneditor/` was ported. Note the
            // server drops the save (`UpdateFloorProperties` is accept-and-drop on the emulator),
            // so the plan loads and draws but does not persist.
            case ':floor':
                if(session.roomControllerLevel >= 3) container.windowManager?.displayFloorPlanEditor();

                return true;

            case ':lang':
                container.localization?.activateLocalizationDefinition(argument);

                return true;

            case ':uc':
                if(sessionData?.hasSecurity(ChatInputWidgetHandler.SECURITY_STAFF))
                {
                    // `hotel` widens the scope and takes the classification from the *third* word.
                    if(argument === 'hotel') session.sendPeerUsersClassificationMessage(parts[2]);
                    else session.sendRoomUsersClassificationMessage(argument);
                }

                return true;

            case ':anew':
                if(sessionData?.isAmbassador || sessionData?.hasSecurity(ChatInputWidgetHandler.SECURITY_STAFF))
                {
                    session.sendRoomUsersClassificationMessage('new');
                }

                return true;

            case ':avisit':
                if(sessionData?.isAmbassador || sessionData?.hasSecurity(ChatInputWidgetHandler.SECURITY_STAFF))
                {
                    roomEngine?.createLinkEvent(
                        argument === 'group'
                            ? 'navigator/goto/predefined_group_lobby'
                            : 'navigator/goto/predefined_noob_lobby'
                    );
                }

                return true;

            case ':aalert':
                if(sessionData?.isAmbassador || sessionData?.hasSecurity(ChatInputWidgetHandler.SECURITY_STAFF))
                {
                    const target = session.userDataManager?.getUserDataByName(argument) ?? null;

                    if(target) session.ambassadorAlert(target.webID);
                }

                return true;

            case ':visit':
                session.sendVisitUserMessage(argument);

                return true;

            case ':roomid':
                session.sendVisitFlatMessage(parseInt(argument, 10));

                return true;

            case ':zoom':
                if(roomEngine != null)
                {
                    roomEngine.events.emit(
                        RoomEngineZoomEvent.ROOM_ZOOM,
                        new RoomEngineZoomEvent(roomEngine.activeRoomId, Number(argument))
                    );
                }

                return true;

            case ':iddqd':
                if(roomEngine != null)
                {
                    roomEngine.events.emit(
                        RoomEngineZoomEvent.ROOM_ZOOM,
                        new RoomEngineZoomEvent(roomEngine.activeRoomId, -1, true)
                    );
                }

                return true;

            case ':cam':
            case ':camera':
                if(sessionData?.isPerkAllowed(PerkType.CAMERA))
                {
                    const event = new HabboToolbarEvent(HabboToolbarEvent.CAMERA_TOGGLE);

                    event.iconName = 'chatCameraCommand';
                    container.toolbar?.toolbarEvents.emit(HabboToolbarEvent.CAMERA_TOGGLE, event);
                }

                return true;

            case ':fs':
            case ':fullscreen':
                container.windowManager?.toggleFullScreen();

                return true;

            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as:460-472
            case ':screenshot':
            {
                const container = this.container;
                const engine = container?.roomEngine ?? null;
                const roomName = container?.navigator?.enteredGuestRoomData?.roomName ?? '';

                if(engine && container)
                {
                    engine.createScreenShot(container.roomSession?.roomId ?? engine.activeRoomId,
                        container.getFirstCanvasId(), roomName);
                }

                return true;
            }

            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as:477-490 — Flash's Mouse.hide()/show() is MouseCursorControl.visible here,
            // which is the same one-line CSS toggle the window system already uses.
            case ':hidemouse':
            {
                const engine = this.container?.roomEngine ?? null;

                this._mouseHidden = !this._mouseHidden;
                MouseCursorControl.visible = !this._mouseHidden;

                if(engine)
                {
                    engine.setTileCursorState(engine.activeRoomId, this._mouseHidden ? 0 : 1);
                    engine.toggleTileCursorVisibility(engine.activeRoomId, !this._mouseHidden);
                }

                return true;
            }

            // DEVIATION: AS3 also consumes the staff-only `:csmm` snow-war debug command (it forces a
            //   checksum mismatch in the games manager); the RPG fork removed Snow War and the games
            //   manager, so `:csmm` is ordinary chat.
            // AS3: .../src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::processChatMessage()

            case ':demonictriggers':
                this.toggleDemonicTriggers();

                return true;

            default:
                return false;
        }
    }

    /**
     * Inverts every wired-trigger sprite in the room, and un-inverts them on the second call.
     *
     * The matrix is AS3's, with its offsets rescaled: Flash writes them in 0-255 and PixiJS in 0-1,
     * so 255 becomes 1. Sprites in `add` blend mode are skipped — AS3 leaves them alone because
     * inverting an additive sprite turns it into a black hole rather than a highlight.
     */
    /**
     * `:stresstest <seconds> <avatars> [furniture]` — fills the room with synthetic wandering
     * avatars so the `:showstats` budget can be read at a known load.
     *
     * `<seconds>` decides whether the run records itself. Above zero it samples the frame budget
     * once a second, stops at the deadline and writes the series to `perf/` via the dev server;
     * zero means run until told otherwise and write nothing, which is the mode for watching the
     * overlay while poking at the client by hand. `:stresstest 0 0` therefore still clears.
     *
     * Centred on the caller's own avatar rather than the room's origin, so the load lands where the
     * camera already is: objects the viewport never covers still cost sorting and sprite updates,
     * but not draw submission, and a figure that silently excludes `pixi` is worse than no figure.
     */
    // TS-only: no AS3 counterpart. See habbo/room/utils/RoomStressTest.
    private handleStressTest(secondsArgument: string, avatarArgument: string, furnitureArgument: string): void
    {
        const container = this._container;
        const roomEngine = container?.roomEngine ?? null;
        const session = container?.roomSession ?? null;

        if(roomEngine == null || session == null) return;

        const durationSeconds = ChatInputWidgetHandler.parseStressCount(secondsArgument, ChatInputWidgetHandler.STRESS_TEST_MAX_SECONDS);
        const avatarCount = ChatInputWidgetHandler.parseStressCount(avatarArgument, ChatInputWidgetHandler.STRESS_TEST_MAX_COUNT);
        const furnitureCount = ChatInputWidgetHandler.parseStressCount(furnitureArgument, ChatInputWidgetHandler.STRESS_TEST_MAX_COUNT);

        if(avatarCount <= 0 && furnitureCount <= 0)
        {
            RoomStressTest.stop();

            return;
        }

        // `roomSession.roomId`, not `roomEngine.getActiveRoomId()`: every existing caller that pairs
        // a room id with `ownUserRoomId` reads it off the session (the wired handlers all do), and
        // the two are not interchangeable — the engine's active room is set by the camera/rendering
        // path and can lag or differ from the session the chat box belongs to.
        const roomId = session.roomId;
        const own = roomEngine.getRoomObject(
            roomId, session.ownUserRoomId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER
        );

        // Falling back rather than refusing, because the centre only decides *where* the load goes.
        // Any occupied tile keeps it inside the viewport, which is the property that matters — a
        // load placed off-camera would quietly exclude `pixi` from the measurement.
        const centre = own ?? ChatInputWidgetHandler.anyRoomObject(roomEngine);

        if(centre === null)
        {
            log.warn(
                ':stresstest — nothing found to centre on.'
                + ` roomId=${roomId} (engine active=${roomEngine.getActiveRoomId()}),`
                + ` ownUserRoomId=${session.ownUserRoomId}.`
                + ' An ownUserRoomId of -1 means setOwnUserId() never ran for this session'
            );

            return;
        }

        if(own === null)
        {
            log.warn(
                ':stresstest — own avatar not found'
                + ` (roomId=${roomId}, ownUserRoomId=${session.ownUserRoomId});`
                + ' centring on another room object instead'
            );
        }

        RoomStressTest.start(
            roomEngine, roomId, centre.getLocation(), avatarCount, furnitureCount, durationSeconds
        );
    }

    /**
     * Any object standing in the active room, users first, or null in a genuinely empty one.
     *
     * Only a position is wanted, so the category it comes from does not matter — a user is
     * preferred purely because a user is necessarily on a walkable tile.
     */
    // TS-only: no AS3 counterpart. See habbo/room/utils/RoomStressTest.
    private static anyRoomObject(roomEngine: IRoomEngine): IRoomObject | null
    {
        const users = roomEngine.getObjectsByCategory(RoomObjectCategoryEnum.OBJECT_CATEGORY_USER);

        if(users.length > 0) return users[0];

        const furniture = roomEngine.getObjectsByCategory(RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE);

        if(furniture.length > 0) return furniture[0];

        return null;
    }

    /**
     * Reads one `:stresstest` argument, clamped to `ceiling` and saying so when it clamps.
     *
     * Capped because this is reachable from the chat box: a mistyped `:stresstest 100000` would fill
     * the room before the first frame and hang the tab with no way back to the input that would undo
     * it.
     *
     * Announced because it did not used to be. A clamped run is a measurement of a smaller room than
     * the one that was asked for, and silence about that is how a number ends up trusted for a load
     * it never carried. The label is built from the clamped value, so the *file* was never wrong —
     * only the person reading their own command.
     */
    // TS-only: no AS3 counterpart. See habbo/room/utils/RoomStressTest.
    private static parseStressCount(argument: string, ceiling: number): number
    {
        const value = parseInt(argument, 10);

        if(Number.isNaN(value) || value <= 0) return 0;

        if(value > ceiling)
        {
            log.warn(`:stresstest — ${value} exceeds the ceiling of ${ceiling}; running ${ceiling} instead.`);

            return ceiling;
        }

        return value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::processWidgetMessage()
    private toggleDemonicTriggers(): void
    {
        const container = this._container;
        const roomEngine = container?.roomEngine ?? null;
        const sessionData = container?.sessionDataManager ?? null;

        if(roomEngine == null || sessionData == null) return;

        const objects = roomEngine.getObjectsByCategory(ChatInputWidgetHandler.FURNITURE_CATEGORY) ?? [];

        this._demonicTriggers = !this._demonicTriggers;

        let filters: unknown[] = [];

        if(this._demonicTriggers)
        {
            const invert = new ColorMatrixFilter();

            invert.matrix = [
                -1, 0, 0, 0, 1,
                0, -1, 0, 0, 1,
                0, 0, -1, 0, 1,
                0, 0, 0, 1, 0
            ];

            filters = [invert];
        }

        for(const object of objects)
        {
            const typeId = object.getModel()?.getNumber('furniture_type_id') ?? -1;
            const itemData = sessionData.getFloorItemData(typeId);

            if(itemData == null || itemData.className.indexOf('wf_trg_') !== 0) continue;

            const visualization = object.getVisualization() as IRoomObjectSpriteVisualization | null;

            if(visualization == null) continue;

            for(let i = 0; i < visualization.spriteCount; i++)
            {
                const sprite = visualization.getSprite(i);

                if(sprite != null && sprite.blendMode !== 'add') sprite.filters = filters;
            }
        }
    }

    /**
	 * All four AS3 events, in its order. The marker here used to hold two back as unraisable —
	 * re-checked 2026-09-01, both blockers are gone: `HideRoomWidgetEvent` is ported, and
	 * `RoomChatInputWidget.refreshChatStyles()` exists.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::getProcessedEvents()
    public getProcessedEvents(): string[]
    {
        return [
            'RSCE_FLOOD_EVENT',
            HideRoomWidgetEvent.HIDE_ROOM_WIDGET,
            FriendBarResizeEvent.FRIENDBAR_RESIZE_EVENT,
            SessionDataToWidgetEvent.PURCHASABLE_STYLES_UPDATED
        ];
    }

    // AS3: .../src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::update()
    public update(): void
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::processEvent()
    public processEvent(event: unknown): void
    {
        if(!this._container?.desktopEvents) return;

        const typedEvent = event as {type?: string};

        if(typedEvent.type === 'RSCE_FLOOD_EVENT')
        {
            const seconds = parseInt((event as RoomSessionChatEvent).text, 10);

            this._container.desktopEvents.emit(
                RoomWidgetFloodControlEvent.FLOOD_CONTROL,
                new RoomWidgetFloodControlEvent(Number.isNaN(seconds) ? 0 : seconds)
            );

            return;
        }

        // The friend bar sits above the chat input; when it grows or shrinks, the input has to move
        // with it. AS3 casts the event and then ignores the cast — only the fact that it arrived
        // matters.
        if(typedEvent.type === FriendBarResizeEvent.FRIENDBAR_RESIZE_EVENT)
        {
            this._widget?.checkChatInputPosition();
        }

        if(typedEvent.type === SessionDataToWidgetEvent.PURCHASABLE_STYLES_UPDATED)
        {
            this._widget?.refreshChatStyles();
        }

        // AS3 returns from this case instead of falling through to the dispatch below; there is
        // nothing after it here either, but the shape is kept.
        if(typedEvent.type === HideRoomWidgetEvent.HIDE_ROOM_WIDGET)
        {
            this.handleHideWidgetEvent(event as HideRoomWidgetEvent);
            return;
        }
    }

    /** Only the widget the event names hides — every handler sees the event. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::handleHideWidgetEvent()
    private handleHideWidgetEvent(event: HideRoomWidgetEvent): void
    {
        if(event && event.widgetType === this.type) this._widget?.hide();
    }
}
