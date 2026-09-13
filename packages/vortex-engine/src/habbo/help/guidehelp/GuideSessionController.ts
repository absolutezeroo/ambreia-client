import type {IDisposable} from '@core/runtime/IDisposable';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {IRegionWindow} from '@core/window/components/IRegionWindow';
import type {ISelectableWindow} from '@core/window/components/ISelectableWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {Logger} from '@core/utils/Logger';
import {GuideSessionCreateMessageComposer} from '@habbo/communication/messages/outgoing/help/GuideSessionCreateMessageComposer';
import {GuideSessionOnDutyUpdateMessageComposer} from '@habbo/communication/messages/outgoing/help/GuideSessionOnDutyUpdateMessageComposer';
import {PerkAllowancesMessageEvent} from '@habbo/communication/messages/incoming/perk/PerkAllowancesMessageEvent';
import {GuideSessionGuideDecidesMessageComposer} from '@habbo/communication/messages/outgoing/help/GuideSessionGuideDecidesMessageComposer';
import {GuideSessionGetRequesterRoomMessageComposer} from '@habbo/communication/messages/outgoing/help/GuideSessionGetRequesterRoomMessageComposer';
import {GuideSessionInviteRequesterMessageComposer} from '@habbo/communication/messages/outgoing/help/GuideSessionInviteRequesterMessageComposer';
import {GuideSessionResolvedMessageComposer} from '@habbo/communication/messages/outgoing/help/GuideSessionResolvedMessageComposer';
import {GuideSessionFeedbackMessageComposer} from '@habbo/communication/messages/outgoing/help/GuideSessionFeedbackMessageComposer';
import {GuideSessionRequesterCancelsMessageComposer} from '@habbo/communication/messages/outgoing/help/GuideSessionRequesterCancelsMessageComposer';
import {GuideSessionMessageMessageComposer} from '@habbo/communication/messages/outgoing/help/GuideSessionMessageMessageComposer';
import {GuideSessionIsTypingMessageComposer} from '@habbo/communication/messages/outgoing/help/GuideSessionIsTypingMessageComposer';
import {ChatReviewSessionCreateMessageComposer} from '@habbo/communication/messages/outgoing/help/ChatReviewSessionCreateMessageComposer';
import {ChatReviewGuideDecidesOnOfferMessageComposer} from '@habbo/communication/messages/outgoing/help/ChatReviewGuideDecidesOnOfferMessageComposer';
import {ChatReviewGuideDetachedMessageComposer} from '@habbo/communication/messages/outgoing/help/ChatReviewGuideDetachedMessageComposer';
import {ChatReviewGuideVoteMessageComposer} from '@habbo/communication/messages/outgoing/help/ChatReviewGuideVoteMessageComposer';
import {GuideSessionAttachedMessageEvent} from '@habbo/communication/messages/incoming/help/GuideSessionAttachedMessageEvent';
import {GuideSessionDetachedMessageEvent} from '@habbo/communication/messages/incoming/help/GuideSessionDetachedMessageEvent';
import {GuideSessionStartedMessageEvent} from '@habbo/communication/messages/incoming/help/GuideSessionStartedMessageEvent';
import {GuideSessionEndedMessageEvent} from '@habbo/communication/messages/incoming/help/GuideSessionEndedMessageEvent';
import {GuideSessionErrorMessageEvent} from '@habbo/communication/messages/incoming/help/GuideSessionErrorMessageEvent';
import {GuideSessionMessageMessageEvent} from '@habbo/communication/messages/incoming/help/GuideSessionMessageMessageEvent';
import {GuideSessionRequesterRoomMessageEvent} from '@habbo/communication/messages/incoming/help/GuideSessionRequesterRoomMessageEvent';
import {GuideSessionInvitedToGuideRoomMessageEvent} from '@habbo/communication/messages/incoming/help/GuideSessionInvitedToGuideRoomMessageEvent';
import {GuideSessionPartnerIsTypingMessageEvent} from '@habbo/communication/messages/incoming/help/GuideSessionPartnerIsTypingMessageEvent';
import {GuideOnDutyStatusMessageEvent} from '@habbo/communication/messages/incoming/help/GuideOnDutyStatusMessageEvent';
import {ChatReviewSessionOfferedToGuideMessageEvent} from '@habbo/communication/messages/incoming/help/ChatReviewSessionOfferedToGuideMessageEvent';
import {ChatReviewSessionStartedMessageEvent} from '@habbo/communication/messages/incoming/help/ChatReviewSessionStartedMessageEvent';
import {ChatReviewSessionVotingStatusMessageEvent} from '@habbo/communication/messages/incoming/help/ChatReviewSessionVotingStatusMessageEvent';
import {ChatReviewSessionResultsMessageEvent} from '@habbo/communication/messages/incoming/help/ChatReviewSessionResultsMessageEvent';
import {ChatReviewSessionDetachedMessageEvent} from '@habbo/communication/messages/incoming/help/ChatReviewSessionDetachedMessageEvent';
import type {GuideSessionAttachedMessageParser} from '@habbo/communication/messages/parser/help/GuideSessionAttachedMessageParser';
import type {GuideSessionStartedMessageParser} from '@habbo/communication/messages/parser/help/GuideSessionStartedMessageParser';
import type {GuideSessionEndedMessageParser} from '@habbo/communication/messages/parser/help/GuideSessionEndedMessageParser';
import type {GuideSessionErrorMessageParser} from '@habbo/communication/messages/parser/help/GuideSessionErrorMessageParser';
import type {GuideSessionMessageMessageParser} from '@habbo/communication/messages/parser/help/GuideSessionMessageMessageParser';
import type {GuideSessionRequesterRoomMessageParser} from '@habbo/communication/messages/parser/help/GuideSessionRequesterRoomMessageParser';
import type {GuideSessionInvitedToGuideRoomMessageParser} from '@habbo/communication/messages/parser/help/GuideSessionInvitedToGuideRoomMessageParser';
import type {GuideSessionPartnerIsTypingMessageParser} from '@habbo/communication/messages/parser/help/GuideSessionPartnerIsTypingMessageParser';
import type {GuideOnDutyStatusMessageParser} from '@habbo/communication/messages/parser/help/GuideOnDutyStatusMessageParser';
import type {ChatReviewSessionOfferedToGuideMessageParser} from '@habbo/communication/messages/parser/help/ChatReviewSessionOfferedToGuideMessageParser';
import type {ChatReviewSessionStartedMessageParser} from '@habbo/communication/messages/parser/help/ChatReviewSessionStartedMessageParser';
import type {ChatReviewSessionVotingStatusMessageParser} from '@habbo/communication/messages/parser/help/ChatReviewSessionVotingStatusMessageParser';
import type {ChatReviewSessionResultsMessageParser} from '@habbo/communication/messages/parser/help/ChatReviewSessionResultsMessageParser';
import {GetHabboGroupDetailsMessageComposer} from '@habbo/communication/messages/outgoing/users/GetHabboGroupDetailsMessageComposer';
import {GetExtendedProfileMessageComposer} from '@habbo/communication/messages/outgoing/users/GetExtendedProfileMessageComposer';
import {GetTalentTrackMessageComposer} from '@habbo/communication/messages/outgoing/talent/GetTalentTrackMessageComposer';
import {FriendlyTime} from '@habbo/utils/FriendlyTime';
import {HabboWebTools} from '@habbo/utils/HabboWebTools';
import type {IIlluminaChatBubbleWidget} from '@habbo/window/widgets/IIlluminaChatBubbleWidget';
import type {IIlluminaInputHandler} from '@habbo/window/widgets/IIlluminaInputHandler';
import type {IIlluminaInputWidget} from '@habbo/window/widgets/IIlluminaInputWidget';
import type {CountdownWidget} from '@habbo/window/widgets/CountdownWidget';
import type {IAvatarImageWidget} from '@habbo/window/widgets/IAvatarImageWidget';
import type {GuideHelpManager} from '../GuideHelpManager';
import type {HabboHelp} from '../HabboHelp';
import {GuideSessionData} from '../GuideSessionData';
import {AnimationData} from './AnimationData';
import {PerkType} from '../../communication/enum/PerkType';

const log = Logger.getLogger('habbo.help.guidehelp.GuideSessionController');

/**
 * Every window of the guide/helper/guardian flow, and the one session behind them.
 *
 * The class is a state machine with a single window slot: each `setStateX()` closes whatever is
 * open, builds its own layout, and installs its own procedure. That is why the event handlers all
 * begin by re-checking `_window.name` — a reply can arrive for a state the player has already left,
 * and the check is what stops it painting into the wrong window.
 *
 * Three roles run through it. A **user** creates a help request and waits; a **guide** on duty is
 * offered requests and chats them through; a **guardian** votes on reported chat. Which one is
 * live is `GuideSessionData.role`, and `_onDuty` gates everything on the guide side.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/guidehelp/GuideSessionController.as
 */
export class GuideSessionController implements IDisposable, IIlluminaInputHandler
{
    // AS3: .../guidehelp/GuideSessionController.as::SYSTEM_MSG_CHAT
    private static readonly SYSTEM_MSG_CHAT: number = 0;

    // AS3: .../guidehelp/GuideSessionController.as::SYSTEM_MSG_NOTIFICATION
    private static readonly SYSTEM_MSG_NOTIFICATION: number = 1;

    // AS3: .../guidehelp/GuideSessionController.as::SYSTEM_MSG_REMINDER
    private static readonly SYSTEM_MSG_REMINDER: number = 2;

    // AS3: .../guidehelp/GuideSessionController.as::CHAT_MSG_DEFAULT
    private static readonly CHAT_MSG_DEFAULT: number = 0;

    // AS3: .../guidehelp/GuideSessionController.as::CHAT_MSG_INVITE
    private static readonly CHAT_MSG_INVITE: number = 1;

    // AS3: .../guidehelp/GuideSessionController.as::CHAT_MSG_SYSTEM
    private static readonly CHAT_MSG_SYSTEM: number = 2;

    // AS3: .../guidehelp/GuideSessionController.as::CHAT_REVIEW_VOTE_OK
    private static readonly CHAT_REVIEW_VOTE_OK: number = 0;

    // AS3: .../guidehelp/GuideSessionController.as::CHAT_REVIEW_VOTE_BAD
    private static readonly CHAT_REVIEW_VOTE_BAD: number = 1;

    // AS3: .../guidehelp/GuideSessionController.as::CHAT_REVIEW_VOTE_VERY_BAD
    private static readonly CHAT_REVIEW_VOTE_VERY_BAD: number = 2;

    /**
     * Name DERIVED: obfuscated in every tree. How long the typing indicator waits before deciding
     * the partner has stopped.
     */
    // AS3: .../guidehelp/GuideSessionController.as::_SafeStr_11618
    private static readonly TYPING_TIMER_MS: number = 3000;

    /**
     * Name DERIVED: obfuscated in every tree. The waiting-animation frame interval, and the same
     * timer's `currentCount` is what picks the frame.
     */
    // AS3: .../guidehelp/GuideSessionController.as::_SafeStr_10958
    private static readonly ANIMATION_INTERVAL_MS: number = 500;

    // AS3: .../guidehelp/GuideSessionController.as::STATUS_ICON_PREFIX
    private static readonly STATUS_ICON_PREFIX: string = 'help_chat_review_decision_';

    // AS3: .../guidehelp/GuideSessionController.as::STATUS_KEY_PREFIX
    private static readonly STATUS_KEY_PREFIX: string = '${guide.bully.request.guide.results.outcome.';

    // AS3: .../guidehelp/GuideSessionController.as::STATUS_KEYS
    private static readonly STATUS_KEYS: string[] = ['waiting', 'ok', 'bad', 'very_bad', 'refused', 'searching'];

    // AS3: .../guidehelp/GuideSessionController.as::RESULT_KEYS
    private static readonly RESULT_KEYS: string[] = ['waiting', 'ok', 'bad', 'very_bad', 'inconclusive', 'searching'];

    // AS3: .../guidehelp/GuideSessionController.as::_habboHelp
    private _habboHelp: HabboHelp | null;

    // AS3: .../guidehelp/GuideSessionController.as::_guideHelp
    private _guideHelp: GuideHelpManager | null;

    // AS3: .../guidehelp/GuideSessionController.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: .../guidehelp/GuideSessionController.as::_SafeStr_4923 (the report window)
    private _reportWindow: IWindowContainer | null = null;

    // AS3: .../guidehelp/GuideSessionController.as::_sessionData
    private _sessionData: GuideSessionData | null;

    /**
     * Name DERIVED: obfuscated in every tree. Where the last window sat, so the next state opens
     * in the same place instead of jumping back to the default corner.
     */
    // AS3: .../guidehelp/GuideSessionController.as::_SafeStr_6492
    private _windowPosition: {x: number; y: number} | null = {x: 120, y: 80};

    // AS3: .../guidehelp/GuideSessionController.as::_onDuty
    private _onDuty: boolean = false;

    // AS3: .../guidehelp/GuideSessionController.as::_SafeStr_5966 (handle helper tickets)
    private _handleHelperTickets: boolean = false;

    // AS3: .../guidehelp/GuideSessionController.as::_SafeStr_5900 (handle chat reviews)
    private _handleChatReviews: boolean = false;

    // AS3: .../guidehelp/GuideSessionController.as::_SafeStr_5914 (handle tour requests)
    private _handleTourRequests: boolean = false;

    /**
     * Name DERIVED: obfuscated in every tree. Set by the "try again" button so the *next*
     * detach reopens the create form with the old text instead of closing the flow.
     */
    // AS3: .../guidehelp/GuideSessionController.as::_SafeStr_9428
    private _resubmitPending: boolean = false;

    // AS3: .../guidehelp/GuideSessionController.as::_chatMsg
    private _chatMsg: IWidgetWindow | null = null;

    // AS3: .../guidehelp/GuideSessionController.as::_SafeStr_6937 (the notification row template)
    private _chatMsgNotification: IWindowContainer | null = null;

    // AS3: .../guidehelp/GuideSessionController.as::_SafeStr_9069 (the reminder row template)
    private _chatMsgReminder: IWindowContainer | null = null;

    // AS3: .../guidehelp/GuideSessionController.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../guidehelp/GuideSessionController.as::_SafeStr_5034 (the typing timer)
    private _typingTimer: ReturnType<typeof setInterval> | null = null;

    // AS3: .../guidehelp/GuideSessionController.as::_lastMessageTypedLength
    private _lastMessageTypedLength: number = 0;

    // AS3: .../guidehelp/GuideSessionController.as::_lastTypingInfo
    private _lastTypingInfo: boolean = false;

    // AS3: .../guidehelp/GuideSessionController.as::_SafeStr_5708 (the animation timer)
    private _animationTimer: ReturnType<typeof setInterval> | null = null;

    /**
     * The animation timer's tick count. AS3 reads `Timer.currentCount` to pick the frame; a JS
     * interval has no such counter, so it is kept here and incremented on the same tick.
     */
    // AS3: .../guidehelp/GuideSessionController.as::setAnimationFrame() (`_SafeStr_5708.currentCount`)
    private _animationTickCount: number = 0;

    // AS3: .../guidehelp/GuideSessionController.as::_SafeStr_5402 (the running animations)
    private _animations: AnimationData[] = [];

    // AS3: .../guidehelp/GuideSessionController.as::_SafeStr_5917 (the idle-check timer)
    private _idleCheckTimer: ReturnType<typeof setInterval> | null = null;

    /**
     * Name DERIVED: obfuscated in every tree. When the mouse last moved, so an idle guide can be
     * taken off duty rather than sitting in the queue.
     */
    // AS3: .../guidehelp/GuideSessionController.as::_SafeStr_7687
    private _lastActivityTime: number = 0;

    // AS3: .../guidehelp/GuideSessionController.as::GuideSessionController()
    constructor(guideHelp: GuideHelpManager)
    {
        this._habboHelp = guideHelp.habboHelp;
        this._guideHelp = guideHelp;
        this._sessionData = new GuideSessionData();

        const help = this._habboHelp!;

        this._chatMsg = help.getXmlWindow('chat_msg') as unknown as IWidgetWindow | null;
        this._chatMsgNotification = help.getXmlWindow('chat_msg_notification') as IWindowContainer | null;
        this._chatMsgReminder = help.getXmlWindow('chat_msg_reminder') as IWindowContainer | null;

        this._handleHelperTickets = help.getBoolean('guidetool.handle.help_requests');
        this._handleChatReviews = help.getBoolean('guidetool.handle.chat_reviews');
        this._handleTourRequests = help.getBoolean('guidetool.handle.tour_requests');

        // AS3 listens on the Flash stage; the browser equivalent is the document, and the check
        // it feeds only cares that *something* moved.
        if(typeof document !== 'undefined') document.addEventListener('mousemove', this.onStageMouseMove);

        this._animationTimer = setInterval(this.onWaitingAnimationTimer, GuideSessionController.ANIMATION_INTERVAL_MS);
        this._lastActivityTime = performance.now();
        this._idleCheckTimer = setInterval(this.onIdleCheckTimer, 5000);

        const communication = help.communicationManager;

        communication?.addHabboConnectionMessageEvent(new ChatReviewSessionVotingStatusMessageEvent(this.onChatReviewSessionVotingStatus));
        communication?.addHabboConnectionMessageEvent(new ChatReviewSessionStartedMessageEvent(this.onChatReviewSessionStarted));
        communication?.addHabboConnectionMessageEvent(new GuideSessionMessageMessageEvent(this.onGuideSessionMessage));
        communication?.addHabboConnectionMessageEvent(new ChatReviewSessionResultsMessageEvent(this.onChatReviewSessionResults));
        communication?.addHabboConnectionMessageEvent(new GuideSessionErrorMessageEvent(this.onGuideSessionError));
        communication?.addHabboConnectionMessageEvent(new ChatReviewSessionDetachedMessageEvent(this.onChatReviewSessionDetached));
        communication?.addHabboConnectionMessageEvent(new ChatReviewSessionOfferedToGuideMessageEvent(this.onChatReviewSessionOfferedToGuide));
        communication?.addHabboConnectionMessageEvent(new GuideSessionAttachedMessageEvent(this.onGuideSessionAttached));
        communication?.addHabboConnectionMessageEvent(new GuideSessionEndedMessageEvent(this.onGuideSessionEnded));
        communication?.addHabboConnectionMessageEvent(new GuideSessionDetachedMessageEvent(this.onGuideSessionDetached));
        communication?.addHabboConnectionMessageEvent(new GuideSessionPartnerIsTypingMessageEvent(this.onGuideSessionPartnerIsTyping));
        communication?.addHabboConnectionMessageEvent(new GuideOnDutyStatusMessageEvent(this.onGuideOnDutyStatus));
        communication?.addHabboConnectionMessageEvent(new GuideSessionRequesterRoomMessageEvent(this.onGuideSessionRequesterRoom));
        communication?.addHabboConnectionMessageEvent(new GuideSessionInvitedToGuideRoomMessageEvent(this.onGuideSessionInvitedToGuideRoom));
        communication?.addHabboConnectionMessageEvent(new GuideSessionStartedMessageEvent(this.onGuideSessionStarted));

        // Registered last here, first in AS3; order does not matter, and the perk push is
        // already listened to elsewhere — `MessageRegistry` shares one parser between every
        // subscriber of a header, so a second subscription costs nothing and parses nothing twice.
        communication?.addHabboConnectionMessageEvent(new PerkAllowancesMessageEvent(this.onPerkAllowances));
    }

    /**
     * The server withdrew a perk. Only one matters here: losing USE_GUIDE_TOOL while the guide
     * tool is open takes the guide off duty and closes the window under them.
     *
     * The off-duty message is sent with all four flags false rather than the current ones — AS3
     * hard-codes them, and it is the same "you are not a guide any more" statement.
     */
    // AS3: .../guidehelp/GuideSessionController.as::onPerkAllowances()
    private onPerkAllowances = (event: IMessageEvent): void =>
    {
        if(this._sessionData?.activeWindow !== 'guide_tool') return;

        const parser = (event as PerkAllowancesMessageEvent).getParser?.() ?? null;

        if(parser === null || parser.isPerkAllowed(PerkType.USE_GUIDE_TOOL)) return;

        if(this._onDuty)
        {
            this.setOnDuty(false);
            this._habboHelp?.sendMessage(new GuideSessionOnDutyUpdateMessageComposer(false, false, false, false));
        }

        this.setStateClosed(false);
    };

    /**
     * Maps a vote code onto an index into `STATUS_KEYS`/`RESULT_KEYS`.
     *
     * AS3 writes it as `switch(vote - -1)`, which is the decompiler's way of showing a jump table
     * offset by the sentinel `-1` ("no vote"). Kept as an explicit mapping rather than arithmetic
     * so the sentinel's answer — index 4, "refused"/"inconclusive" — stays visible.
     */
    // AS3: .../guidehelp/GuideSessionController.as::statusFromVote()
    private static statusFromVote(vote: number): number
    {
        switch(vote)
        {
            case -1: return 4;
            case GuideSessionController.CHAT_REVIEW_VOTE_OK: return 1;
            case GuideSessionController.CHAT_REVIEW_VOTE_BAD: return 2;
            case GuideSessionController.CHAT_REVIEW_VOTE_VERY_BAD: return 3;
            default: return 0;
        }
    }

    // AS3: .../guidehelp/GuideSessionController.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../guidehelp/GuideSessionController.as::createHelpRequest()
    createHelpRequest(requestType: number): void
    {
        if(this._sessionData!.isActiveSession())
        {
            log.warn("Can't create a new help request while another help request is ongoing");

            return;
        }

        // Tour requests skip the description form entirely: the text is a fixed localization and
        // the request goes straight out.
        if(requestType === 0 || requestType === 2)
        {
            this._sessionData!.role = 2;
            this._sessionData!.activeWindow = 'user_create';
            this._sessionData!.requestType = requestType;

            this._habboHelp?.sendMessage(new GuideSessionCreateMessageComposer(
                requestType,
                this._habboHelp.localization?.getLocalization('guide.help.request.tour.description') ?? ''
            ));
        }
        else
        {
            this.setStateUserCreateRequest(requestType);
        }
    }

    // AS3: .../guidehelp/GuideSessionController.as::showGuideTool()
    showGuideTool(): void
    {
        this._habboHelp?.sendMessage(new GuideSessionOnDutyUpdateMessageComposer(
            this._onDuty, this._handleTourRequests, this._handleHelperTickets, this._handleChatReviews
        ));
    }

    // AS3: .../guidehelp/GuideSessionController.as::onGuideOnDutyStatus()
    private onGuideOnDutyStatus = (event: IMessageEvent): void =>
    {
        const parser = event.parser as GuideOnDutyStatusMessageParser | null;

        if(parser == null) return;

        this._onDuty = parser.onDuty;

        const localization = this._habboHelp?.localization ?? null;

        localization?.registerParameter('guide.help.guide.tool.guidesonduty', 'amount', parser.guidesOnDuty.toString());
        localization?.registerParameter('guide.help.guide.tool.helpersonduty', 'amount', parser.helpersOnDuty.toString());
        localization?.registerParameter('guide.help.guide.tool.guardiansonduty', 'amount', parser.guardiansOnDuty.toString());

        this.setStateGuideTool();
    };

    // AS3: .../guidehelp/GuideSessionController.as::onGuideSessionAttached()
    private onGuideSessionAttached = (event: IMessageEvent): void =>
    {
        if(this._disposed || !this._sessionData) return;

        const parser = event.parser as GuideSessionAttachedMessageParser | null;

        if(parser == null) return;

        if(parser.asGuide)
        {
            if(this._sessionData.isActiveGuideSession())
            {
                this.setStateError();

                return;
            }

            this.setStateGuideAccept(parser.helpRequestType, parser.helpRequestDescription, parser.roleSpecificWaitTime);
        }
        else
        {
            if(!this._sessionData.isActiveUserSession())
            {
                this.setStateError();

                return;
            }

            this.setStateUserPendingRequest(parser.helpRequestType, parser.helpRequestDescription, parser.roleSpecificWaitTime);
        }
    };

    // AS3: .../guidehelp/GuideSessionController.as::onGuideSessionDetached()
    private onGuideSessionDetached = (_event: IMessageEvent): void =>
    {
        if(this._disposed) return;

        if(this._resubmitPending)
        {
            const requestType = this._sessionData!.requestType;
            const description = this._sessionData!.requestDescription;

            this.resetSessionData();
            this.setStateUserCreateRequest(requestType, description);
        }
        else if(this._sessionData!.isActiveUserSession() && this._sessionData!.activeWindow === 'user_feedback')
        {
            this.setStateUserThanks();
        }
        else
        {
            this.setStateClosed(true);
        }
    };

    // AS3: .../guidehelp/GuideSessionController.as::onGuideSessionStarted()
    private onGuideSessionStarted = (event: IMessageEvent): void =>
    {
        if(this._disposed) return;

        const parser = event.parser as GuideSessionStartedMessageParser | null;

        if(parser == null) return;

        this._sessionData!.userId = parser.requesterUserId;
        this._sessionData!.userName = parser.requesterName;
        this._sessionData!.userFigure = parser.requesterFigure;
        this._sessionData!.guideId = parser.guideUserId;
        this._sessionData!.guideName = parser.guideName;
        this._sessionData!.guideFigure = parser.guideFigure;

        this._lastTypingInfo = false;

        if(this._sessionData!.isActiveGuideSession()) this.setStateGuideOngoing();
        else this.setStateUserOngoingRequest();
    };

    // AS3: .../guidehelp/GuideSessionController.as::onGuideSessionEnded()
    private onGuideSessionEnded = (event: IMessageEvent): void =>
    {
        if(this._disposed) return;

        const parser = event.parser as GuideSessionEndedMessageParser | null;

        if(parser == null) return;

        if(this._sessionData!.isActiveGuideSession()) this.setStateGuideClosed(parser.endReason);
        else if(parser.endReason === 0) this.setStateUserGuideDisconnected();
        else this.setStateUserFeedback();
    };

    // AS3: .../guidehelp/GuideSessionController.as::onGuideSessionError()
    private onGuideSessionError = (event: IMessageEvent): void =>
    {
        if(this._disposed) return;

        const parser = event.parser as GuideSessionErrorMessageParser | null;

        if(parser == null) return;

        switch(parser.errorCode)
        {
            case 1:
                this.setStateRejected();
                break;
            case 2:
            case 3:
                this.setStateClosedWithNotification('guide.bully.request.error.not_enough_guardians');
                break;
            default:
                this.setStateError();
        }
    };

    /**
     * A chat line from the other side.
     *
     * `flipped` is what puts the bubble on the correct edge: false for your own messages, true for
     * the partner's — and which is which depends on whether you are the guide or the requester.
     */
    // AS3: .../guidehelp/GuideSessionController.as::onGuideSessionMessage()
    private onGuideSessionMessage = (event: IMessageEvent): void =>
    {
        if(this._disposed || !this._sessionData!.isOnGoingSession() || this._window == null) return;

        const parser = event.parser as GuideSessionMessageMessageParser | null;

        if(parser == null) return;

        const senderId = parser.senderId;

        let senderName: string;
        let senderFigure: string;

        if(senderId === this._sessionData!.guideId)
        {
            senderName = this._sessionData!.guideName;
            senderFigure = this._sessionData!.guideFigure;
        }
        else
        {
            senderName = this._sessionData!.userName;
            senderFigure = this._sessionData!.userFigure;
        }

        let flipped = true;

        if(this._sessionData!.isActiveGuideSession() && this._sessionData!.guideId === senderId) flipped = false;
        else if(!this._sessionData!.isActiveGuideSession() && this._sessionData!.userId === senderId) flipped = false;

        this.addChatMessage(senderId, senderName, senderFigure, parser.chatMessage, flipped);
    };

    // AS3: .../guidehelp/GuideSessionController.as::onGuideSessionRequesterRoom()
    private onGuideSessionRequesterRoom = (event: IMessageEvent): void =>
    {
        if(this._disposed || !this._sessionData!.isOnGoingSession()) return;

        const parser = event.parser as GuideSessionRequesterRoomMessageParser | null;

        if(parser == null) return;

        if(parser.roomId > 0)
        {
            this._habboHelp?.roomSessionManager?.gotoRoom(parser.roomId);
        }
        else
        {
            this.addChatMessage(
                this._sessionData!.guideId,
                this._sessionData!.guideName,
                this._sessionData!.guideFigure,
                this._habboHelp?.localization?.getLocalization('guide.help.request.guide.ongoing.user.not.in.room.error', '') ?? '',
                false,
                GuideSessionController.CHAT_MSG_SYSTEM
            );
        }
    };

    /**
     * The two halves of the room invite: the guide gets a plain confirmation line, the requester
     * gets a *clickable* one carrying the room id — that is what `CHAT_MSG_INVITE` is for.
     */
    // AS3: .../guidehelp/GuideSessionController.as::onGuideSessionInvitedToGuideRoom()
    private onGuideSessionInvitedToGuideRoom = (event: IMessageEvent): void =>
    {
        if(this._disposed || this._window == null || !this._sessionData!.isOnGoingSession()) return;

        const parser = event.parser as GuideSessionInvitedToGuideRoomMessageParser | null;

        if(parser == null) return;

        const localization = this._habboHelp?.localization ?? null;

        if(this._sessionData!.isActiveGuideSession())
        {
            if(parser.roomId > 0)
            {
                this.addSystemMessage(
                    GuideSessionController.SYSTEM_MSG_CHAT,
                    localization?.getLocalizationWithParams('guide.help.request.guide.ongoing.error.invite.success', '', 'name', this._sessionData!.userName) ?? ''
                );
            }
            else
            {
                this.addSystemMessage(
                    GuideSessionController.SYSTEM_MSG_CHAT,
                    localization?.getLocalization('guide.help.request.guide.ongoing.error.invite.failed', '') ?? ''
                );
            }
        }
        else if(parser.roomId > 0)
        {
            this.addChatMessage(
                this._sessionData!.guideId,
                this._sessionData!.guideName,
                this._sessionData!.guideFigure,
                localization?.getLocalizationWithParams(
                    'guide.help.request.user.ongoing.visit.guide.request.message', '',
                    'name', this._sessionData!.guideName, 'roomname', parser.roomName
                ) ?? '',
                true,
                GuideSessionController.CHAT_MSG_INVITE,
                parser.roomId
            );
        }
    };

    // AS3: .../guidehelp/GuideSessionController.as::onGuideSessionPartnerIsTyping()
    private onGuideSessionPartnerIsTyping = (event: IMessageEvent): void =>
    {
        const parser = event.parser as GuideSessionPartnerIsTypingMessageParser | null;

        if(parser == null) return;

        this.displayPartnerIsTypingMessage(parser.isTyping);
    };

    // AS3: .../guidehelp/GuideSessionController.as::onChatReviewSessionOfferedToGuide()
    private onChatReviewSessionOfferedToGuide = (event: IMessageEvent): void =>
    {
        const parser = event.parser as ChatReviewSessionOfferedToGuideMessageParser | null;

        if(parser == null) return;

        this.setStateGuardianChatReviewAccept(parser.acceptanceTimeout);
    };

    // AS3: .../guidehelp/GuideSessionController.as::onChatReviewSessionStarted()
    private onChatReviewSessionStarted = (event: IMessageEvent): void =>
    {
        const parser = event.parser as ChatReviewSessionStartedMessageParser | null;

        if(parser == null) return;

        this.setStateGuardianChatReviewVote(parser.votingTimeout, parser.chatRecord);
    };

    // AS3: .../guidehelp/GuideSessionController.as::onChatReviewSessionVotingStatus()
    private onChatReviewSessionVotingStatus = (event: IMessageEvent): void =>
    {
        if(this._sessionData!.activeWindow !== 'guardian_chat_review_wait_for_results') return;

        const parser = event.parser as ChatReviewSessionVotingStatusMessageParser | null;

        if(parser == null) return;

        this.showStatus(this._window?.findChildByName('results') as unknown as IItemListWindow | null, parser.status);
    };

    // AS3: .../guidehelp/GuideSessionController.as::onChatReviewSessionResults()
    private onChatReviewSessionResults = (event: IMessageEvent): void =>
    {
        const parser = event.parser as ChatReviewSessionResultsMessageParser | null;

        if(parser == null) return;

        this.setStateGuardianChatReviewResults(parser.winningVoteCode, parser.ownVoteCode, parser.finalStatus);
    };

    // AS3: .../guidehelp/GuideSessionController.as::onChatReviewSessionDetached()
    private onChatReviewSessionDetached = (_event: IMessageEvent): void =>
    {
        this.setStateClosed(true);
    };

    /**
     * The guide tool: duty toggle and the three ticket-queue checkboxes.
     *
     * The `JUDGE_CHAT_REVIEWS` branch does surgery on the layout rather than hiding a row — the
     * guardian checkbox is disposed and everything below it moved up 17px, because the container
     * has no layout pass that would close the gap on its own.
     */
    // AS3: .../guidehelp/GuideSessionController.as::setStateGuideTool()
    private setStateGuideTool(): void
    {
        if(this._sessionData!.isActiveSession())
        {
            log.warn('Trying to set state to guide tool, but an active session exists');

            return;
        }

        this._sessionData!.activeWindow = 'guide_tool';

        this.openWindow(this.onGuideToolEvent, true);

        if(this._window == null) return;

        this.setOnDutyStatus(this._onDuty);

        this._window.procedure = this.onGuideToolEvent;

        this.setCheckBoxValue('handle_guardian_tickets', this._handleChatReviews);
        this.setCheckBoxValue('handle_helper_tickets', this._handleHelperTickets);
        this.setCheckBoxValue('handle_guide_tickets', this._handleTourRequests);

        if(!this._habboHelp?.sessionDataManager?.isPerkAllowed(PerkType.JUDGE_CHAT_REVIEWS))
        {
            const list = this._window.findChildByName('list') as unknown as IItemListWindow | null;
            const container = list?.getListItemByName('handle_selection_container') as IWindowContainer | null;

            if(container == null) return;

            container.findChildByName('handle_guardian_tickets')?.dispose();

            const separator = container.findChildByName('selection_separator');

            if(separator) separator.y = separator.y - 17;

            container.height -= 17;
        }
    }

    // AS3: .../guidehelp/GuideSessionController.as::onGuideToolEvent()
    private onGuideToolEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null || this._window.name !== 'guide_tool') return;

        switch(target?.name)
        {
            case 'header_button_close':
                if(event.type === WindowMouseEvent.CLICK) this.setStateClosed(false);
                break;
            case 'helper_group_link':
            {
                if(event.type !== WindowMouseEvent.CLICK) break;

                const groupId = this._habboHelp?.getInteger('guide.help.alpha.groupid', 0) ?? 0;

                if(groupId > 0)
                {
                    this._habboHelp?.sendMessage(new GetHabboGroupDetailsMessageComposer(groupId, true));
                    this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_groupProfile`);
                }

                break;
            }
            case 'guide_forum_link':
            {
                if(event.type !== WindowMouseEvent.CLICK) break;

                const groupId = this._habboHelp?.getInteger('guide.help.alpha.groupid', 0) ?? 0;

                if(groupId > 0)
                {
                    const url = (this._habboHelp?.getProperty('group.homepage.url') ?? '').replace('%groupid%', String(groupId));

                    HabboWebTools.openWebPage(url, 'habboMain');
                    this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_groupForum`);
                }

                break;
            }
            case 'guide_tool_duty':
                switch(event.type)
                {
                    case WindowEvent.WE_SELECTED:
                    {
                        this.setOnDutyStatus(true);

                        this._handleHelperTickets = (this._window.findChildByName('handle_helper_tickets') as unknown as ISelectableWindow | null)?.isSelected ?? false;
                        this._handleChatReviews = (this._window.findChildByName('handle_guardian_tickets') as unknown as ISelectableWindow | null)?.isSelected ?? false;
                        this._handleTourRequests = (this._window.findChildByName('handle_guide_tickets') as unknown as ISelectableWindow | null)?.isSelected ?? false;

                        if(!this._handleHelperTickets && !this._handleChatReviews && !this._handleTourRequests)
                        {
                            this._habboHelp?.windowManager?.simpleAlert(
                                '${guide.help.guide.tool.noqueueselected.caption}',
                                '${guide.help.guide.tool.noqueueselected.subtitle}',
                                '${guide.help.guide.tool.noqueueselected.message}'
                            );
                            this.setOnDutyStatus(false);

                            return;
                        }

                        this._habboHelp?.sendMessage(new GuideSessionOnDutyUpdateMessageComposer(
                            true, this._handleTourRequests, this._handleHelperTickets, this._handleChatReviews
                        ));
                        this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_onDuty`);

                        break;
                    }
                    case WindowEvent.WE_UNSELECTED:
                        this.setOnDutyStatus(false);
                        this._habboHelp?.sendMessage(new GuideSessionOnDutyUpdateMessageComposer(false, false, false, false));
                        this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_offDuty`);
                }

                break;
            case 'guide_tool_talent':
                if(event.type !== WindowMouseEvent.CLICK) break;

                if(this._habboHelp?.getBoolean('talent.track.enabled'))
                {
                    this._habboHelp.tracking?.trackTalentTrackOpen('helper', 'guidetool');
                    this._habboHelp.sendMessage(new GetTalentTrackMessageComposer('helper'));
                    this._habboHelp.trackGoogle('guideHelp', `${this._window.name}_talent`);
                }
        }
    };

    /**
     * A request offered to an on-duty guide, with a countdown to accept it.
     *
     * A tour request gets a different shape: the type line is thrown away and the description is
     * lifted out of its wrapper into the list directly, then the window grows by exactly the
     * difference. That resize is why the branch cannot simply hide the wrapper.
     */
    // AS3: .../guidehelp/GuideSessionController.as::setStateGuideAccept()
    private setStateGuideAccept(requestType: number, description: string, waitTime: number): void
    {
        if(!this._onDuty || this._sessionData!.isActiveSession())
        {
            log.warn('Trying to set state to guide accept, but not on duty or active session exists');

            return;
        }

        this._sessionData!.activeWindow = 'guide_accept';
        this._sessionData!.role = 1;
        this._sessionData!.requestDescription = description;
        this._sessionData!.requestType = requestType;

        this.openWindow(this.onGuideAcceptEvent, false);

        if(this._window == null) return;

        this._habboHelp?.soundManager?.playSound('HBST_guide_request');

        if(requestType === 2 || requestType === 0)
        {
            const greeting = this._window.findChildByName('frank_greeting');

            if(greeting) greeting.visible = true;

            const title = this._window.findChildByName('request_title');

            if(title) title.caption = '${guide.help.request.guide.accept.tour_request.title}';

            this._window.findChildByName('request_type')?.dispose();

            const wrapper = this._window.findChildByName('request_description_wrapper');
            const descriptionField = this._window.findChildByName('request_description') as unknown as ITextWindow | null;
            const itemList = this._window.findChildByName('itemlist') as unknown as IItemListWindow | null;

            if(wrapper && descriptionField && itemList && title)
            {
                itemList.addListItemAt(descriptionField as unknown as IWindow, itemList.getListItemIndex(wrapper));
                itemList.removeListItem(wrapper);

                (descriptionField as unknown as IWindow).x = title.x;

                descriptionField.margins.top = 10;
                descriptionField.caption = description;

                const oldHeight = itemList.height;
                const newHeight = this._window.findChildByName('skip_link')?.bottom ?? oldHeight;

                itemList.height = newHeight;

                const border = this._window.findChildByName('border');

                if(border) border.height = border.height + (newHeight - oldHeight);

                this._window.height += newHeight - oldHeight + 40;
            }
        }
        else
        {
            const typeField = this._window.findChildByName('request_type');

            if(typeField) typeField.caption = this.getRequestTypeCaption(requestType);

            const descriptionField = this._window.findChildByName('request_description');

            if(descriptionField) descriptionField.caption = description;
        }

        const countdown = (this._window.findChildByName('countdown') as unknown as IWidgetWindow | null)?.widget as CountdownWidget | null;

        if(countdown)
        {
            countdown.seconds = waitTime;
            countdown.running = true;
        }
    }

    // AS3: .../guidehelp/GuideSessionController.as::onGuideAcceptEvent()
    private onGuideAcceptEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null || this._window.name !== 'guide_accept' || event.type !== WindowMouseEvent.CLICK) return;

        switch(target?.name)
        {
            case 'accept_button':
                this._habboHelp?.sendMessage(new GuideSessionGuideDecidesMessageComposer(true));
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickAccept`);
                this.closeWindow();
                break;
            case 'skip_link':
                this._habboHelp?.sendMessage(new GuideSessionGuideDecidesMessageComposer(false));
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickSkip`);
                this.closeWindow();
        }
    };

    /**
     * The guide's side of a live session.
     *
     * A tour request opens with a confirm dialog offering to jump straight into the requester's
     * room, which is why the guide never has to press "visit" for that type.
     */
    // AS3: .../guidehelp/GuideSessionController.as::setStateGuideOngoing()
    private setStateGuideOngoing(): void
    {
        if(!this._onDuty || !this._sessionData!.isActiveGuideSession())
        {
            log.warn('Trying to set state to guide ongoing, but not on duty or no active guide session');

            return;
        }

        this._sessionData!.activeWindow = 'guide_ongoing';

        this.openWindow(this.onGuideOngoingEvent, false);

        if(this._window == null) return;

        this.addChatMessage(
            this._sessionData!.userId, this._sessionData!.userName, this._sessionData!.userFigure,
            this._sessionData!.requestDescription, true, GuideSessionController.CHAT_MSG_SYSTEM
        );

        const localization = this._habboHelp?.localization ?? null;

        this._window.caption = localization?.getLocalizationWithParams('guide.help.request.guide.ongoing.title', '', 'name', this._sessionData!.userName) ?? '';

        const inputWidget = (this._window.findChildByName('input_widget') as unknown as IWidgetWindow | null)?.widget as IIlluminaInputWidget | null;

        if(inputWidget)
        {
            inputWidget.submitHandler = this;
            inputWidget.emptyMessage = localization?.getLocalizationWithParams('guide.help.request.guide.ongoing.input.empty', '', 'name', this._sessionData!.userName) ?? '';
            inputWidget.maxChars = this._habboHelp?.getInteger('guide.help.request.max.chat.message.length', 150) ?? 150;
        }

        if(this._sessionData!.requestType === 2 || this._sessionData!.requestType === 0)
        {
            const title = '${guide.help.request.join.room.title}';
            const summary = localization?.getLocalizationWithParams('guide.help.request.join.room.summary', '', 'name', this._sessionData!.userName) ?? '';

            this._habboHelp?.windowManager?.confirm(title, summary, 0, (dialog, dialogEvent) =>
            {
                dialog.dispose();

                if(dialogEvent?.type === 'WE_OK') this._habboHelp?.sendMessage(new GuideSessionGetRequesterRoomMessageComposer());
            });
        }
    }

    // AS3: .../guidehelp/GuideSessionController.as::onGuideOngoingEvent()
    private onGuideOngoingEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null || this._window.name !== 'guide_ongoing' || event.type !== WindowMouseEvent.CLICK) return;

        switch(target?.name)
        {
            case 'visit_button':
                this._habboHelp?.sendMessage(new GuideSessionGetRequesterRoomMessageComposer());
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickVisit`);
                break;
            case 'invite_button':
                this._habboHelp?.sendMessage(new GuideSessionInviteRequesterMessageComposer());
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickInvite`);
                break;
            case 'report_link':
                this.tryOpeningReportWindow();
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickReport`);
                break;
            case 'close_link':
                this._habboHelp?.sendMessage(new GuideSessionResolvedMessageComposer());
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickClose`);
                this.closeWindow();
        }
    };

    // AS3: .../guidehelp/GuideSessionController.as::setStateGuideClosed()
    private setStateGuideClosed(endReason: number): void
    {
        if(!this._onDuty || !this._sessionData!.isActiveGuideSession())
        {
            log.warn('Trying to set state to guide closed, but not on duty or no active guide session');

            return;
        }

        this._sessionData!.activeWindow = 'guide_closed';

        this.openWindow(this.onGuideClosedEvent, true);

        if(this._window == null) return;

        const localization = this._habboHelp?.localization ?? null;
        const closeReason = this._window.findChildByName('close_reason');

        if(closeReason)
        {
            closeReason.caption = endReason === 0 || endReason === 1
                ? localization?.getLocalizationWithParams('guide.help.request.guide.closed.reason.other', '', 'name', this._sessionData!.userName) ?? ''
                : localization?.getLocalization('guide.help.request.guide.closed.reason.you', '') ?? '';
        }

        const reportLink = this._window.findChildByName('report_link');

        if(reportLink)
        {
            reportLink.caption = localization?.getLocalizationWithParams('guide.help.request.guide.closed.report.link', '', 'name', this._sessionData!.userName) ?? '';
        }

        const avatar = (this._window.findChildByName('requester_avatar') as unknown as IWidgetWindow | null)?.widget as IAvatarImageWidget | null;

        if(avatar) avatar.figure = this._sessionData!.userFigure;
    }

    // AS3: .../guidehelp/GuideSessionController.as::onGuideClosedEvent()
    private onGuideClosedEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null || this._window.name !== 'guide_closed' || event.type !== WindowMouseEvent.CLICK) return;

        switch(target?.name)
        {
            case 'close_button':
            case 'header_button_close':
                this._habboHelp?.sendMessage(new GuideSessionFeedbackMessageComposer(true));
                this.closeWindow();
                break;
            case 'report_link':
                this.tryOpeningReportWindow();
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickReport`);
        }
    };

    // AS3: .../guidehelp/GuideSessionController.as::setStateUserCreateRequest()
    private setStateUserCreateRequest(requestType: number, description: string | null = null): void
    {
        if(this._sessionData!.isActiveSession())
        {
            log.warn('Trying to set state to user create, but active session exists');

            return;
        }

        this._sessionData!.role = 2;
        this._sessionData!.activeWindow = 'user_create';
        this._sessionData!.requestType = requestType;

        this.openWindow(this.onUserCreateEvent, true);

        if(this._window == null) return;

        const inputWidget = (this._window.findChildByName('input_widget') as unknown as IWidgetWindow | null)?.widget as IIlluminaInputWidget | null;

        if(inputWidget == null) return;

        inputWidget.maxChars = this._habboHelp?.getInteger('guide.help.request.max.description.length', 255) ?? 255;

        if(description) inputWidget.message = description;
    }

    // AS3: .../guidehelp/GuideSessionController.as::onUserCreateEvent()
    private onUserCreateEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null || this._window.name !== 'user_create' || event.type !== WindowMouseEvent.CLICK) return;

        switch(target?.name)
        {
            case 'create_button':
            {
                const inputWidget = (this._window.findChildByName('input_widget') as unknown as IWidgetWindow | null)?.widget as IIlluminaInputWidget | null;
                const description = (inputWidget?.message ?? '').trim();

                if(description.length < (this._habboHelp?.getInteger('guide.help.request.min.description.length', 15) ?? 15))
                {
                    const error = this._window.findChildByName('create_error');

                    if(error) error.visible = true;

                    (this._window.findChildByName('list') as unknown as IItemListWindow | null)?.arrangeListItems();

                    break;
                }

                this._habboHelp?.sendMessage(new GuideSessionCreateMessageComposer(this._sessionData!.requestType, description));
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickCreate`);
                this.closeWindow();

                break;
            }
            case 'header_button_close':
            case 'cancel_link':
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickCancel`);
                this.setStateClosed(true);
        }
    };

    // AS3: .../guidehelp/GuideSessionController.as::setStateUserPendingRequest()
    private setStateUserPendingRequest(requestType: number, description: string, waitTime: number): void
    {
        if(!this._sessionData!.isActiveUserSession())
        {
            log.warn('Trying to set state to user pending request, but no active user session');

            return;
        }

        this._sessionData!.activeWindow = 'user_pending';
        this._sessionData!.requestType = requestType;
        this._sessionData!.requestDescription = description;

        this.openWindow(this.onUserPendingEvent, false);

        if(this._window == null) return;

        const typeField = this._window.findChildByName('request_type');

        if(typeField) typeField.caption = this.getRequestTypeCaption(requestType);

        const descriptionField = this._window.findChildByName('request_description');

        if(descriptionField) descriptionField.caption = description;

        const waitingField = this._window.findChildByName('waiting_time');

        if(waitingField)
        {
            waitingField.caption = this._habboHelp?.localization?.getLocalizationWithParams(
                'guide.help.request.user.pending.info.waiting', '',
                'waitingtime', FriendlyTime.getFriendlyTime(this._habboHelp.localization, waitTime)
            ) ?? '';
        }
    }

    // AS3: .../guidehelp/GuideSessionController.as::onUserPendingEvent()
    private onUserPendingEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null || this._window.name !== 'user_pending' || event.type !== WindowMouseEvent.CLICK) return;

        if(target?.name === 'cancel_button')
        {
            this._habboHelp?.sendMessage(new GuideSessionRequesterCancelsMessageComposer());
            this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickCancel`);
            this.closeWindow();
        }
    };

    /**
     * The requester's side of a live session.
     *
     * A tour request opens with a *reminder* row instead of echoing the description, because a
     * tour's description is a fixed localization the requester never typed.
     */
    // AS3: .../guidehelp/GuideSessionController.as::setStateUserOngoingRequest()
    private setStateUserOngoingRequest(): void
    {
        if(!this._sessionData!.isActiveUserSession())
        {
            log.warn('Trying to set state to user ongoing request, but no active user session');

            return;
        }

        this._sessionData!.activeWindow = 'user_ongoing';

        this.openWindow(this.onUserOngoingEvent, false);

        if(this._window == null) return;

        const localization = this._habboHelp?.localization ?? null;

        this.addSystemMessage(GuideSessionController.SYSTEM_MSG_NOTIFICATION, localization?.getLocalization('guide.help.requester.disclaimer') ?? '');

        if(this._sessionData!.requestType === 0 || this._sessionData!.requestType === 2)
        {
            this.addSystemMessage(GuideSessionController.SYSTEM_MSG_REMINDER, localization?.getLocalization('guide.help.request.tour.reminder') ?? '');
        }
        else
        {
            this.addChatMessage(
                this._sessionData!.userId, this._sessionData!.userName, this._sessionData!.userFigure,
                this._sessionData!.requestDescription, false, GuideSessionController.CHAT_MSG_SYSTEM
            );
        }

        this._window.caption = localization?.getLocalizationWithParams('guide.help.request.user.ongoing.title', '', 'name', this._sessionData!.guideName) ?? '';

        const guideNameLink = this._window.findChildByName('guide_name_link');

        if(guideNameLink) guideNameLink.caption = this._sessionData!.guideName;

        const inputWidget = (this._window.findChildByName('input_widget') as unknown as IWidgetWindow | null)?.widget as IIlluminaInputWidget | null;

        if(inputWidget == null) return;

        inputWidget.submitHandler = this;
        inputWidget.emptyMessage = localization?.getLocalizationWithParams('guide.help.request.user.ongoing.input.help', '', 'name', this._sessionData!.guideName) ?? '';
        inputWidget.maxChars = this._habboHelp?.getInteger('guide.help.request.max.chat.message.length', 150) ?? 150;
    }

    // AS3: .../guidehelp/GuideSessionController.as::onUserOngoingEvent()
    private onUserOngoingEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null || this._window.name !== 'user_ongoing' || event.type !== WindowMouseEvent.CLICK) return;

        switch(target?.name)
        {
            case 'guide_name_link':
                this._habboHelp?.sendMessage(new GetExtendedProfileMessageComposer(this._sessionData!.guideId));
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickProfile`);
                break;
            case 'report_guide_link':
                this.tryOpeningReportWindow();
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickReport`);
                break;
            case 'close_link':
                this._habboHelp?.sendMessage(new GuideSessionResolvedMessageComposer());
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickClose`);
                this.closeWindow();
        }
    };

    // AS3: .../guidehelp/GuideSessionController.as::setStateUserGuideDisconnected()
    private setStateUserGuideDisconnected(): void
    {
        if(!this._sessionData!.isActiveUserSession())
        {
            log.warn('Trying to set state to user guide disconnected, but no active user session');

            return;
        }

        this._sessionData!.activeWindow = 'user_guide_disconnected';

        this.openWindow(this.onUserGuideDisconnected, true);

        const guideNameLink = this._window?.findChildByName('guide_name_link');

        if(guideNameLink) guideNameLink.caption = this._sessionData!.guideName;
    }

    // AS3: .../guidehelp/GuideSessionController.as::onUserGuideDisconnected()
    private onUserGuideDisconnected = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null || this._window.name !== 'user_guide_disconnected' || event.type !== WindowMouseEvent.CLICK) return;

        switch(target?.name)
        {
            case 'header_button_close':
                this._habboHelp?.sendMessage(new GuideSessionFeedbackMessageComposer(false));
                this.closeWindow();
                break;
            case 'guide_name_link':
                this._habboHelp?.sendMessage(new GetExtendedProfileMessageComposer(this._sessionData!.guideId));
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickProfile`);
                break;
            case 'report_guide_link':
                this.tryOpeningReportWindow();
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickReport`);
                break;
            case 'resubmit_button':
                // Arms the detach handler: the feedback we are about to send tears the session
                // down, and this is what turns that teardown into a fresh create form.
                this._resubmitPending = true;
                this._habboHelp?.sendMessage(new GuideSessionFeedbackMessageComposer(false));
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickResubmit`);
                this.closeWindow();
        }
    };

    // AS3: .../guidehelp/GuideSessionController.as::setStateUserFeedback()
    private setStateUserFeedback(): void
    {
        if(!this._sessionData!.isActiveUserSession())
        {
            log.warn('Trying to set state to user feedback, but no active user session');

            return;
        }

        this._sessionData!.activeWindow = 'user_feedback';

        this.openWindow(this.onUserFeedbackEvent, false);

        const guideNameLink = this._window?.findChildByName('guide_name_link');

        if(guideNameLink) guideNameLink.caption = this._sessionData!.guideName;
    }

    // AS3: .../guidehelp/GuideSessionController.as::onUserFeedbackEvent()
    private onUserFeedbackEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null || this._window.name !== 'user_feedback' || event.type !== WindowMouseEvent.CLICK) return;

        switch(target?.name)
        {
            case 'guide_name_link':
                this._habboHelp?.sendMessage(new GetExtendedProfileMessageComposer(this._sessionData!.guideId));
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickProfile`);
                break;
            case 'report_guide_link':
                this.tryOpeningReportWindow();
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickReport`);
                break;
            case 'positive_button':
                this._habboHelp?.sendMessage(new GuideSessionFeedbackMessageComposer(true));
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickPositiveFeedback`);
                this.closeWindow();
                break;
            case 'negative_button':
                this._habboHelp?.sendMessage(new GuideSessionFeedbackMessageComposer(false));
                this._habboHelp?.trackGoogle('guideHelp', `${this._window.name}_clickNegativeFeedback`);
                this.closeWindow();
        }
    };

    // AS3: .../guidehelp/GuideSessionController.as::setStateUserThanks()
    private setStateUserThanks(): void
    {
        if(!this._sessionData!.isActiveUserSession())
        {
            log.warn('Trying to set state to user thanks, but no active user session');

            return;
        }

        this._sessionData!.activeWindow = 'user_thanks';

        this.openWindow(this.onUserThanksEvent, true);
    }

    // AS3: .../guidehelp/GuideSessionController.as::onUserThanksEvent()
    private onUserThanksEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null || this._window.name !== 'user_thanks' || event.type !== WindowMouseEvent.CLICK) return;

        switch(target?.name)
        {
            case 'header_button_close':
            case 'close_button':
                this.setStateClosed(false);
        }
    };

    // AS3: .../guidehelp/GuideSessionController.as::setStateGuardianChatReviewAccept()
    private setStateGuardianChatReviewAccept(acceptanceTimeout: number): void
    {
        this._sessionData!.activeWindow = 'guardian_chat_review_accept';

        this.openWindow(this.onGuardianChatReviewAcceptEvent, false);

        if(this._window == null) return;

        this._habboHelp?.soundManager?.playSound('HBST_guide_request');

        const countdown = (this._window.findChildByName('countdown') as unknown as IWidgetWindow | null)?.widget as CountdownWidget | null;

        if(countdown)
        {
            countdown.seconds = acceptanceTimeout;
            countdown.running = true;
        }
    }

    // AS3: .../guidehelp/GuideSessionController.as::onGuardianChatReviewAcceptEvent()
    private onGuardianChatReviewAcceptEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null || event.type !== WindowMouseEvent.CLICK) return;

        switch(target?.name)
        {
            case 'skip_link':
                this._habboHelp?.sendMessage(new ChatReviewGuideDecidesOnOfferMessageComposer(false));
                this.setStateClosed(true);
                break;
            case 'accept_button':
                this._habboHelp?.sendMessage(new ChatReviewGuideDecidesOnOfferMessageComposer(true));
                this.setStateGuardianChatReviewWaitForOtherVoters();
        }
    };

    // AS3: .../guidehelp/GuideSessionController.as::setStateGuardianChatReviewWaitForOtherVoters()
    private setStateGuardianChatReviewWaitForOtherVoters(): void
    {
        this._sessionData!.activeWindow = 'guardian_chat_review_wait_for_voters';

        this.openWindow(this.onGuardianChatReviewWaitForOtherVotersEvent, false);

        this.startWaitingAnimation(
            this._window?.findChildByName('waiting_animation') as unknown as IStaticBitmapWrapperWindow | null,
            'help_chat_review_progress_big', 4
        );
    }

    // AS3: .../guidehelp/GuideSessionController.as::onGuardianChatReviewWaitForOtherVotersEvent()
    private onGuardianChatReviewWaitForOtherVotersEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null || event.type !== WindowMouseEvent.CLICK) return;

        if(target?.name === 'close_link')
        {
            this._habboHelp?.sendMessage(new ChatReviewGuideDetachedMessageComposer());
            this.setStateClosed(true);
        }
    };

    /**
     * The reported chat, rebuilt from the server's flat record.
     *
     * The record is one line per message, `timestamp;speakerIndex;text`, with a leading timestamp
     * block the first `match(/\d+/g)` pulls the incident time out of. Speaker 0 is the reported
     * user; everyone else is anonymised to "%ID%". Consecutive lines from the same speaker are
     * appended to the previous bubble rather than starting a new one.
     */
    // AS3: .../guidehelp/GuideSessionController.as::setStateGuardianChatReviewVote()
    private setStateGuardianChatReviewVote(votingTimeout: number, chatRecord: string): void
    {
        this._sessionData!.activeWindow = 'guardian_chat_review_vote';

        this.openWindow(this.onGuardianChatReviewVoteEvent, false);

        if(this._window == null) return;

        const countdown = (this._window.findChildByName('countdown') as unknown as IWidgetWindow | null)?.widget as CountdownWidget | null;

        if(countdown)
        {
            countdown.seconds = votingTimeout;
            countdown.running = true;
        }

        const headParts = chatRecord.substring(0, chatRecord.indexOf(';')).match(/\d+/g) ?? [];
        const incidentDate = headParts.length > 5
            ? new Date(Number(headParts[0]), Number(headParts[1]) - 1, Number(headParts[2]), Number(headParts[3]), Number(headParts[4]), Number(headParts[5]))
            : new Date();

        const secondsAgo = (new Date().getTime() - incidentDate.getTime()) / 1000;
        const incidentTime = this._window.findChildByName('incident_time');

        if(incidentTime)
        {
            incidentTime.caption = `(${FriendlyTime.getFriendlyTime(this._habboHelp?.localization ?? null, secondsAgo, '.ago')})`;
        }

        const chatlog = this._window.findChildByName('chatlog') as unknown as IItemListWindow | null;
        const reportedTemplate = this._window.findChildByName('reported_user_template');
        const otherTemplate = this._window.findChildByName('other_user_template');

        if(chatlog == null || reportedTemplate == null || otherTemplate == null) return;

        chatlog.removeListItems();

        let lastSpeaker = -1;
        let lastRow: IWindowContainer | null = null;

        for(const line of chatRecord.split('\r'))
        {
            if(line === '') continue;

            const parts = line.split(';', 3);

            if(parts.length < 3) continue;

            const speaker = Number(parts[1]);
            const text = String(parts[2]).replace('<', '&lt;').replace('>', '&gt;');

            if(speaker === lastSpeaker && lastRow != null)
            {
                const message = lastRow.findChildByName('message');

                if(message) message.caption = `${message.caption}\n${text}`;

                continue;
            }

            const isReported = speaker === 0;

            lastRow = (isReported ? reportedTemplate.clone() : otherTemplate.clone()) as unknown as IWindowContainer;

            const speakerLabel = isReported
                ? this._habboHelp?.localization?.getLocalization('guide.bully.request.guide.vote.perpetrator', '') ?? ''
                : this._habboHelp?.localization?.getLocalizationWithParams('guide.bully.request.guide.vote.anonymous', '%ID%', 'id', speaker.toString()) ?? '';

            const message = lastRow.findChildByName('message');

            if(message) message.caption = `<b>${speakerLabel}:</b> ${text}`;

            chatlog.addListItem(lastRow as unknown as IWindow);
            lastSpeaker = speaker;
        }
    }

    /**
     * The vote buttons, plus their own hover/press artwork.
     *
     * The second branch is a hand-rolled button state machine: the layout gives each vote a region
     * with a bitmap child, and the over/down bits are packed into that bitmap's `id` so the asset
     * name can be recomputed from it. AS3 tests `param2.type == 5`, the region window type.
     */
    // AS3: .../guidehelp/GuideSessionController.as::onGuardianChatReviewVoteEvent()
    private onGuardianChatReviewVoteEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null) return;

        if(event.type === WindowMouseEvent.CLICK)
        {
            switch(target?.name)
            {
                case 'close_link':
                    this._habboHelp?.sendMessage(new ChatReviewGuideDetachedMessageComposer());
                    this.setStateClosed(true);
                    break;
                case 'vote_ok':
                    this._habboHelp?.sendMessage(new ChatReviewGuideVoteMessageComposer(GuideSessionController.CHAT_REVIEW_VOTE_OK));
                    this.setStateGuardianChatReviewWaitForResults(GuideSessionController.CHAT_REVIEW_VOTE_OK);
                    break;
                case 'vote_bad':
                    this._habboHelp?.sendMessage(new ChatReviewGuideVoteMessageComposer(GuideSessionController.CHAT_REVIEW_VOTE_BAD));
                    this.setStateGuardianChatReviewWaitForResults(GuideSessionController.CHAT_REVIEW_VOTE_BAD);
                    break;
                case 'vote_very_bad':
                    this._habboHelp?.sendMessage(new ChatReviewGuideVoteMessageComposer(GuideSessionController.CHAT_REVIEW_VOTE_VERY_BAD));
                    this.setStateGuardianChatReviewWaitForResults(GuideSessionController.CHAT_REVIEW_VOTE_VERY_BAD);
            }

            return;
        }

        if(target == null || target.type !== 5 || target.name.substring(0, 5) !== 'vote_') return;

        const asset = `help_chat_review_vote_${target.name.substring(5)}`;
        const bitmap = (target as unknown as IRegionWindow).getChildAt(0) as unknown as IStaticBitmapWrapperWindow | null;

        if(bitmap == null) return;

        switch(event.type)
        {
            case WindowMouseEvent.OVER:
                bitmap.id |= 1;
                break;
            case WindowMouseEvent.OUT:
                bitmap.id &= -2;
                break;
            case WindowMouseEvent.DOWN:
                bitmap.id |= 2;
                break;
            case WindowMouseEvent.UP:
            case WindowMouseEvent.UP_OUTSIDE:
                bitmap.id &= -3;
        }

        switch(bitmap.id)
        {
            case 1:
                bitmap.assetUri = `${asset}_over`;
                break;
            case 3:
                bitmap.assetUri = `${asset}_down`;
                break;
            default:
                bitmap.assetUri = asset;
        }
    };

    // AS3: .../guidehelp/GuideSessionController.as::setStateGuardianChatReviewWaitForResults()
    private setStateGuardianChatReviewWaitForResults(vote: number): void
    {
        this._sessionData!.activeWindow = 'guardian_chat_review_wait_for_results';

        this.openWindow(this.onGuardianChatReviewWaitForResultsEvent, true);
        this.showOwnVote(vote);
    }

    // AS3: .../guidehelp/GuideSessionController.as::onGuardianChatReviewWaitForResultsEvent()
    private onGuardianChatReviewWaitForResultsEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null || event.type !== WindowMouseEvent.CLICK) return;

        switch(target?.name)
        {
            case 'header_button_close':
            case 'close_button':
                this._habboHelp?.sendMessage(new ChatReviewGuideDetachedMessageComposer());
                this.setStateClosed(true);
        }
    };

    // AS3: .../guidehelp/GuideSessionController.as::setStateGuardianChatReviewResults()
    private setStateGuardianChatReviewResults(winningVote: number, ownVote: number, finalStatus: number[]): void
    {
        this._sessionData!.activeWindow = 'guardian_chat_review_results';

        this.openWindow(this.onGuardianChatReviewResultsEvent, true);

        if(this._window == null) return;

        const index = GuideSessionController.statusFromVote(winningVote);
        const resultText = this._window.findChildByName('result_text');

        if(resultText) resultText.caption = `${GuideSessionController.STATUS_KEY_PREFIX}${GuideSessionController.RESULT_KEYS[index]}}`;

        const resultImage = this._window.findChildByName('result_image') as unknown as IStaticBitmapWrapperWindow | null;

        if(resultImage) resultImage.assetUri = GuideSessionController.STATUS_ICON_PREFIX + GuideSessionController.STATUS_KEYS[index];

        this.showOwnVote(ownVote);
        this.showStatus(this._window.findChildByName('results') as unknown as IItemListWindow | null, finalStatus);
    }

    // AS3: .../guidehelp/GuideSessionController.as::onGuardianChatReviewResultsEvent()
    private onGuardianChatReviewResultsEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null || event.type !== WindowMouseEvent.CLICK) return;

        switch(target?.name)
        {
            case 'header_button_close':
            case 'close_button':
                this._habboHelp?.sendMessage(new ChatReviewGuideDetachedMessageComposer());
                this.setStateClosed(true);
        }
    };

    // AS3: .../guidehelp/GuideSessionController.as::showOwnVote()
    private showOwnVote(vote: number): void
    {
        if(this._window == null) return;

        const index = GuideSessionController.statusFromVote(vote);
        const voteText = this._window.findChildByName('vote_text');

        if(voteText) voteText.caption = `${GuideSessionController.STATUS_KEY_PREFIX}${GuideSessionController.STATUS_KEYS[index]}}`;

        const voteImage = this._window.findChildByName('vote_image') as unknown as IStaticBitmapWrapperWindow | null;
        const voteAsset = GuideSessionController.STATUS_ICON_PREFIX + GuideSessionController.STATUS_KEYS[index];

        if(voteImage) voteImage.assetUri = voteAsset;
    }

    /**
     * One row per voter, cloned from the list's first item.
     *
     * Rows are only ever added, never removed, and the count check compares against `length + 1`
     * because item 0 is the template itself. Statuses 0 and 5 (waiting, searching) animate; the
     * rest are a single frame.
     */
    // AS3: .../guidehelp/GuideSessionController.as::showStatus()
    private showStatus(list: IItemListWindow | null, statuses: number[]): void
    {
        if(list == null) return;

        if(list.numListItems < statuses.length + 1)
        {
            const template = list.getListItemAt(0) as IWindowContainer | null;

            if(template == null) return;

            let lastAdded: IWindowContainer | null = null;

            for(let i = 0; i < statuses.length; i++)
            {
                lastAdded = template.clone() as unknown as IWindowContainer;
                list.addListItem(lastAdded as unknown as IWindow);
            }

            lastAdded?.findChildByName('vote_separator')?.dispose();
        }

        for(let i = 0; i < statuses.length; i++)
        {
            const row = list.getListItemAt(i + 1) as IWindowContainer | null;

            if(row == null) continue;

            const status = statuses[i];
            const image = row.findChildByName('vote_image') as unknown as IStaticBitmapWrapperWindow | null;
            const text = row.findChildByName('vote_text');

            if(text) text.caption = `${GuideSessionController.STATUS_KEY_PREFIX}${GuideSessionController.STATUS_KEYS[status]}}`;

            if(image == null) continue;

            this.stopWaitingAnimation(image);

            if(status === 0 || status === 5)
            {
                this.startWaitingAnimation(image, GuideSessionController.STATUS_ICON_PREFIX + GuideSessionController.STATUS_KEYS[status], 2);
            }
            else
            {
                image.assetUri = GuideSessionController.STATUS_ICON_PREFIX + GuideSessionController.STATUS_KEYS[status];
            }
        }
    }

    // AS3: .../guidehelp/GuideSessionController.as::setStateClosedWithNotification()
    private setStateClosedWithNotification(key: string): void
    {
        this._habboHelp?.windowManager?.simpleAlert(`\${${key}.title}`, `\${${key}.heading}`, `\${${key}.message}`);
        this.setStateClosed(true);
    }

    // AS3: .../guidehelp/GuideSessionController.as::setStateError()
    private setStateError(): void
    {
        this.setOnDuty(false);
        this._sessionData!.activeWindow = 'error_window';
        this.openWindow(this.onErrorWindowEvent, true);
    }

    // AS3: .../guidehelp/GuideSessionController.as::onErrorWindowEvent()
    private onErrorWindowEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null || this._window.name !== 'error_window' || event.type !== WindowMouseEvent.CLICK) return;

        switch(target?.name)
        {
            case 'header_button_close':
            case 'close_button':
                this.setStateClosed(true);
        }
    };

    // AS3: .../guidehelp/GuideSessionController.as::setStateRejected()
    private setStateRejected(): void
    {
        this.setOnDuty(false);
        this._sessionData!.activeWindow = 'rejected_window';

        this.openWindow(this.onRejectedWindowEvent, true);

        if(this._window == null) return;

        if(this._sessionData!.requestType === 0 || this._sessionData!.requestType === 2)
        {
            this._window.caption = '${guide.help.request.no_tour_guides.title}';

            const heading = this._window.findChildByName('heading');

            if(heading) heading.caption = '${guide.help.request.no_tour_guides.heading}';

            const message = this._window.findChildByName('message');

            if(message) message.caption = '${guide.help.request.no_tour_guides.message}';
        }
    }

    // AS3: .../guidehelp/GuideSessionController.as::onRejectedWindowEvent()
    private onRejectedWindowEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null || this._window.name !== 'rejected_window' || event.type !== WindowMouseEvent.CLICK) return;

        switch(target?.name)
        {
            case 'header_button_close':
            case 'close_button':
                this.setStateClosed(true);
        }
    };

    /**
     * Ends whatever was running. `returnToGuideTool` decides whether an on-duty guide drops back to
     * the tool or to nothing at all — and the perk re-check before it is what takes a guide off
     * duty the moment the server has withdrawn the right.
     */
    // AS3: .../guidehelp/GuideSessionController.as::setStateClosed()
    private setStateClosed(returnToGuideTool: boolean): void
    {
        this.resetSessionData();
        this.closeWindow();

        if(this._onDuty && !this._habboHelp?.sessionDataManager?.isPerkAllowed(PerkType.USE_GUIDE_TOOL)) this.setOnDuty(false);

        if(returnToGuideTool && this._onDuty) this.setStateGuideTool();
    }

    // AS3: .../guidehelp/GuideSessionController.as::openWindow()
    private openWindow(procedure: (event: WindowEvent, target: IWindow) => void, closable: boolean): void
    {
        if(this._disposed) return;

        if(this._window != null) this.closeWindow();

        this._window = this._guideHelp?.habboHelp?.getXmlWindow(this._sessionData!.activeWindow) as IWindowContainer | null;

        if(this._window == null)
        {
            log.warn(`No layout for guide window "${this._sessionData!.activeWindow}" - the state has nothing to show`);

            return;
        }

        if(this._windowPosition) this._window.position = this._windowPosition;

        this._window.procedure = procedure;

        const closeButton = this._window.findChildByName('header_button_close');

        if(closeButton) closeButton.visible = closable;
    }

    // AS3: .../guidehelp/GuideSessionController.as::closeWindow()
    private closeWindow(): void
    {
        if(this._window == null) return;

        if(this._windowPosition)
        {
            this._windowPosition.x = Math.max(0, this._window.position.x);
            this._windowPosition.y = Math.max(0, this._window.position.y);
        }

        this._window.dispose();
        this._window = null;
    }

    /**
     * Asks for the pending-CFH list rather than opening the form directly: the server's answer is
     * what decides whether the player may file another report, and `HabboHelp` calls
     * `openReportWindow()` back once it does.
     */
    // AS3: .../guidehelp/GuideSessionController.as::tryOpeningReportWindow()
    private tryOpeningReportWindow(): void
    {
        this._habboHelp?.queryForPendingCallsForHelp(2);
    }

    // AS3: .../guidehelp/GuideSessionController.as::openReportWindow()
    openReportWindow(): void
    {
        if(this._reportWindow || this._window == null) return;

        const desktop = this._habboHelp?.windowManager?.getDesktop(0) ?? null;

        this._reportWindow = this._habboHelp?.getXmlWindow('report_window') as IWindowContainer | null;

        if(this._reportWindow == null) return;

        this._reportWindow.procedure = this.onReportWindowEvent;

        // Docked to the right of the session window, and clamped so it cannot open off-screen.
        this._reportWindow.x = Math.max(0, Math.min((desktop?.width ?? 0) - this._reportWindow.width, this._window.x + this._window.width + 10));
        this._reportWindow.y = Math.max(0, this._window.y);
    }

    // AS3: .../guidehelp/GuideSessionController.as::closeReportWindow()
    private closeReportWindow(): void
    {
        if(!this._reportWindow) return;

        this._reportWindow.dispose();
        this._reportWindow = null;
    }

    // AS3: .../guidehelp/GuideSessionController.as::onReportWindowEvent()
    private onReportWindowEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || !this._reportWindow || this._reportWindow.disposed || event.type !== WindowMouseEvent.CLICK) return;

        switch(target?.name)
        {
            case 'header_button_close':
            case 'cancel_link':
                this._habboHelp?.trackGoogle('guideHelp', `${this._reportWindow.name}_clickClose`);
                this.closeReportWindow();
                break;
            case 'submit_button':
            {
                const inputWidget = (this._reportWindow.findChildByName('input_widget') as unknown as IWidgetWindow | null)?.widget as IIlluminaInputWidget | null;
                const message = inputWidget?.message ?? '';

                if(message.length === 0)
                {
                    const error = this._reportWindow.findChildByName('report_error');

                    if(error) error.visible = true;

                    (this._reportWindow.findChildByName('list') as unknown as IItemListWindow | null)?.arrangeListItems();

                    break;
                }

                this._habboHelp?.sendMessage(new ChatReviewSessionCreateMessageComposer(message));
                this._habboHelp?.trackGoogle('guideHelp', `${this._reportWindow.name}_clickReport`);
                this.closeReportWindow();
                this.closeWindow();

                break;
            }
            // AS3 lists `urgent_help_link` with an empty body — the link is inert by design, not
            // an omission here.
            case 'urgent_help_link':
        }
    };

    // AS3: .../guidehelp/GuideSessionController.as::resetSessionData()
    private resetSessionData(): void
    {
        this._sessionData = new GuideSessionData();
    }

    // AS3: .../guidehelp/GuideSessionController.as::setOnDutyStatus()
    private setOnDutyStatus(onDuty: boolean): void
    {
        if(this._window == null) return;

        const toggle = this._window.findChildByName('guide_tool_duty') as unknown as ISelectableWindow | null;

        this.setOnDuty(onDuty);

        if(toggle)
        {
            toggle.isSelected = onDuty;
            (toggle as unknown as IWindow).caption = this._habboHelp?.localization?.getLocalization(
                onDuty ? 'guide.help.guide.tool.duty.on' : 'guide.help.guide.tool.duty.off', ''
            ) ?? '';
        }

        const disabledScreen = this._window.findChildByName('disabled_screen');

        if(disabledScreen) disabledScreen.visible = onDuty;
    }

    // AS3: .../guidehelp/GuideSessionController.as::setCheckBoxValue()
    private setCheckBoxValue(name: string, value: boolean): void
    {
        const checkbox = this._window?.findChildByName(name) as unknown as ISelectableWindow | null;

        if(checkbox != null) checkbox.isSelected = value;
    }

    /**
     * Type 2 (bully) and type 0 (tour) share one caption; AS3 folds 2 onto 0 before the lookup
     * rather than giving them separate keys.
     */
    // AS3: .../guidehelp/GuideSessionController.as::getRequestTypeCaption()
    private getRequestTypeCaption(requestType: number): string
    {
        const key = requestType === 2 ? 0 : requestType;

        return this._habboHelp?.localization?.getLocalization(`guide.help.request.type.${key}`, '') ?? '';
    }

    /**
     * Adds a chat bubble, or extends the last one.
     *
     * Consecutive default-type messages from the same speaker append into the existing bubble —
     * an invite or a system line always starts a new one, which is what the `messageType` check
     * on top of the speaker check is for.
     */
    // AS3: .../guidehelp/GuideSessionController.as::addChatMessage()
    private addChatMessage(
        userId: number, userName: string, figure: string, message: string, flipped: boolean,
        messageType: number = GuideSessionController.CHAT_MSG_DEFAULT, roomId: number | null = null
    ): void
    {
        let row = this.getLastChatListItem();
        let bubble: IIlluminaChatBubbleWidget | null = null;

        if(row != null && row.widget != null && row.name === 'chat_msg_0')
        {
            bubble = row.widget as unknown as IIlluminaChatBubbleWidget;
        }

        if(bubble && bubble.userId === userId && messageType === GuideSessionController.CHAT_MSG_DEFAULT)
        {
            bubble.appendMessage(message);
            this.addItemAndUpdateChatList(null);

            return;
        }

        if(this._chatMsg == null) return;

        row = this._chatMsg.clone() as unknown as IWidgetWindow;
        (row as unknown as IWindow).name = `chat_msg_${messageType}`;

        bubble = row.widget as unknown as IIlluminaChatBubbleWidget;
        bubble.figure = figure;
        bubble.flipped = flipped;
        bubble.appendMessage(message);
        bubble.userName = userName;
        bubble.userId = userId;

        if(messageType === GuideSessionController.CHAT_MSG_INVITE)
        {
            const region = (row.rootWindow as unknown as IWindowContainer | null)?.findChildByName('message_region') as IWindowContainer | null;

            if(region)
            {
                region.procedure = this.onChatMessageEvent;
                region.setParamFlag(1, true);
                region.id = roomId ?? 0;

                const messageField = region.findChildByName('message') as unknown as ITextWindow | null;

                if(messageField) messageField.underline = true;
            }
        }

        this.addItemAndUpdateChatList(row as unknown as IWindow);
    }

    // AS3: .../guidehelp/GuideSessionController.as::onChatMessageEvent()
    private onChatMessageEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(this.disposed || this._window == null || event.type !== WindowMouseEvent.CLICK) return;

        this._habboHelp?.navigator?.goToPrivateRoom(target.id);
    };

    /**
     * The insert index is `numListItems - 1`, not the end: the last row is the "partner is typing"
     * placeholder, which has to stay at the bottom.
     */
    // AS3: .../guidehelp/GuideSessionController.as::addItemAndUpdateChatList()
    private addItemAndUpdateChatList(item: IWindow | null): void
    {
        const list = this._window?.findChildByName('chat_list') as unknown as IItemListWindow | null;

        if(list == null) return;

        if(item) list.addListItemAt(item, list.numListItems - 1);

        list.scrollV = 1;
        list.arrangeListItems();

        this.resetTypingTimer();
    }

    // AS3: .../guidehelp/GuideSessionController.as::addSystemMessage()
    private addSystemMessage(messageType: number, message: string): void
    {
        if(!this._sessionData!.isOnGoingSession() || message === '') return;

        switch(messageType)
        {
            case GuideSessionController.SYSTEM_MSG_NOTIFICATION:
            {
                const row = this._chatMsgNotification?.clone() as unknown as IWindowContainer | null;
                const content = row?.findChildByName('content');

                if(content) content.caption = message;
                if(row) this.addItemAndUpdateChatList(row as unknown as IWindow);

                break;
            }
            case GuideSessionController.SYSTEM_MSG_REMINDER:
            {
                const row = this._chatMsgReminder?.clone() as unknown as IWindowContainer | null;
                const content = row?.findChildByName('content');

                if(content) content.caption = message;
                if(row) this.addItemAndUpdateChatList(row as unknown as IWindow);

                break;
            }
            default:
                // SYSTEM_MSG_CHAT: attributed to whichever side is *not* the local player, so a
                // system line reads as if the partner said it.
                if(this._sessionData!.isActiveUserSession())
                {
                    this.addChatMessage(
                        this._sessionData!.userId, this._sessionData!.userName, this._sessionData!.userFigure,
                        message, true, GuideSessionController.CHAT_MSG_SYSTEM
                    );

                    break;
                }

                this.addChatMessage(
                    this._sessionData!.guideId, this._sessionData!.guideName, this._sessionData!.guideFigure,
                    message, true, GuideSessionController.CHAT_MSG_SYSTEM
                );
        }
    }

    // AS3: .../guidehelp/GuideSessionController.as::getLastChatListItem()
    private getLastChatListItem(): IWidgetWindow | null
    {
        if(this._window == null || this._window.disposed) return null;

        const list = this._window.findChildByName('chat_list') as unknown as IItemListWindow | null;

        if(list == null || list.numListItems <= 1) return null;

        return list.getListItemAt(list.numListItems - 2) as unknown as IWidgetWindow | null;
    }

    // AS3: .../guidehelp/GuideSessionController.as::onInput()
    onInput(widget: IWidgetWindow, message: string): void
    {
        if(message.length === 0) return;

        this._habboHelp?.sendMessage(new GuideSessionMessageMessageComposer(message));

        const input = widget.widget as IIlluminaInputWidget | null;

        if(input) input.message = '';

        this.resetTypingTimer();
    }

    // AS3: .../guidehelp/GuideSessionController.as::setOnDuty()
    private setOnDuty(onDuty: boolean): void
    {
        this._onDuty = onDuty;

        if(this._habboHelp?.toolbar) this._habboHelp.toolbar.onDuty = onDuty;
    }

    /**
     * Restarts the "am I typing" clock. Only the two chat windows have one, and the reset also
     * clears the partner's indicator — a message of your own means theirs is stale.
     */
    // AS3: .../guidehelp/GuideSessionController.as::resetTypingTimer()
    private resetTypingTimer(): void
    {
        if(this._typingTimer !== null)
        {
            clearInterval(this._typingTimer);
            this._typingTimer = null;
        }

        if(!this.isChatWindowOpen()) return;

        this._typingTimer = setInterval(this.onTypingTimer, GuideSessionController.TYPING_TIMER_MS);
        this._lastMessageTypedLength = this.messageLength;

        this.displayPartnerIsTypingMessage(false);
    }

    // TS-only: the `_window.name` guard AS3 repeats inline in four members.
    private isChatWindowOpen(): boolean
    {
        if(this._window == null || this._window.disposed) return false;

        return this._window.name === 'user_ongoing' || this._window.name === 'guide_ongoing';
    }

    // AS3: .../guidehelp/GuideSessionController.as::get messageLength()
    private get messageLength(): number
    {
        if(!this.isChatWindowOpen()) return 0;

        const widget = this._window?.findChildByName('input_widget') as unknown as IWidgetWindow | null;

        return widget != null ? ((widget.widget as IIlluminaInputWidget | null)?.message.length ?? 0) : 0;
    }

    /**
     * Reports the typing state, but only when it changed — the server is told once per transition,
     * not once per tick.
     */
    // AS3: .../guidehelp/GuideSessionController.as::onTypingTimer()
    private onTypingTimer = (): void =>
    {
        if(!this.isChatWindowOpen()) return;

        const isTyping = this._lastMessageTypedLength !== 0;

        if(this._lastTypingInfo !== isTyping)
        {
            this._habboHelp?.sendMessage(new GuideSessionIsTypingMessageComposer(isTyping));
            this._lastTypingInfo = isTyping;
        }

        this._lastMessageTypedLength = 0;
    };

    // AS3: .../guidehelp/GuideSessionController.as::displayPartnerIsTypingMessage()
    private displayPartnerIsTypingMessage(isTyping: boolean): void
    {
        if(!this.isChatWindowOpen()) return;

        const list = this._window?.findChildByName('chat_list') as unknown as IItemListWindow | null;

        if(list == null || list.numListItems === 0) return;

        const row = list.getListItemAt(list.numListItems - 1);

        if(row) row.blend = isTyping ? 1 : 0;
    }

    // AS3: .../guidehelp/GuideSessionController.as::onWaitingAnimationTimer()
    private onWaitingAnimationTimer = (): void =>
    {
        this._animationTickCount++;
        this._animations = this._animations.filter((data) => data.window != null && !data.window.disposed);

        for(const data of this._animations) this.setAnimationFrame(data);
    };

    // AS3: .../guidehelp/GuideSessionController.as::startWaitingAnimation()
    private startWaitingAnimation(window: IStaticBitmapWrapperWindow | null, asset: string, frameCount: number): void
    {
        if(this._window == null || window == null) return;

        const data = new AnimationData(window, asset, frameCount);

        this.setAnimationFrame(data);
        this._animations.push(data);
    }

    // AS3: .../guidehelp/GuideSessionController.as::setAnimationFrame()
    private setAnimationFrame(data: AnimationData): void
    {
        const frame = this._animationTickCount % data.frameCount;

        data.window.assetUri = `${data.asset}_${frame + 1}`;
    }

    // AS3: .../guidehelp/GuideSessionController.as::stopWaitingAnimation()
    private stopWaitingAnimation(window: IStaticBitmapWrapperWindow): void
    {
        this._animations = this._animations.filter((data) => data.window !== window);
    }

    // AS3: .../guidehelp/GuideSessionController.as::onStageMouseMove()
    private onStageMouseMove = (): void =>
    {
        this._lastActivityTime = performance.now();
    };

    /**
     * Takes an idle guide off duty. The message is sent with `onDuty = false` but the three queue
     * flags unchanged, so the server remembers what they had selected when they come back.
     */
    // AS3: .../guidehelp/GuideSessionController.as::onIdleCheckTimer()
    private onIdleCheckTimer = (): void =>
    {
        if(!this._onDuty) return;

        const timeout = (this._habboHelp?.getInteger('guidetool.idle.timeout', 300) ?? 300) * 1000;

        if(performance.now() - this._lastActivityTime > timeout)
        {
            this._habboHelp?.sendMessage(new GuideSessionOnDutyUpdateMessageComposer(
                false, this._handleTourRequests, this._handleHelperTickets, this._handleChatReviews
            ));
        }
    };

    /**
     * Note what AS3 does *not* dispose: `_chatMsgReminder`. `_chatMsg` and `_chatMsgNotification`
     * are both released, the reminder template is not. Left as-is — it is a one-per-session window
     * and "fixing" it here would be a guess about why the third was skipped.
     */
    // AS3: .../guidehelp/GuideSessionController.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        if(this._idleCheckTimer !== null)
        {
            clearInterval(this._idleCheckTimer);
            this._idleCheckTimer = null;
        }

        if(this._animationTimer !== null)
        {
            clearInterval(this._animationTimer);
            this._animationTimer = null;
        }

        if(this._typingTimer !== null)
        {
            clearInterval(this._typingTimer);
            this._typingTimer = null;
        }

        this._animations = [];

        if(this._chatMsg)
        {
            (this._chatMsg as unknown as IWindow).dispose();
            this._chatMsg = null;
        }

        if(this._chatMsgNotification)
        {
            this._chatMsgNotification.dispose();
            this._chatMsgNotification = null;
        }

        this.closeReportWindow();
        this.closeWindow();

        this._sessionData = null;
        this._windowPosition = null;
        this._guideHelp = null;

        if(typeof document !== 'undefined') document.removeEventListener('mousemove', this.onStageMouseMove);

        this._habboHelp = null;
        this._disposed = true;
    }
}
