import type {IDisposable} from '@core/runtime';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {HabboQuestEngine} from './HabboQuestEngine';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {AchievementData} from './AchievementCategory';
import {QuestCompletedEvent} from './events/QuestCompletedEvent';
import {QuestsListEvent} from './events/QuestsListEvent';
import {Logger} from '@core/utils/Logger';

// Existing message events
import {RoomEntryInfoMessageEvent} from '@habbo/communication/messages/incoming/room/engine/RoomEntryInfoMessageEvent';
import type {
    RoomEntryInfoMessageParser
} from '@habbo/communication/messages/parser/room/engine/RoomEntryInfoMessageParser';
import {
    CloseConnectionMessageEvent
} from '@habbo/communication/messages/incoming/room/session/CloseConnectionMessageEvent';
import {
    HabboAchievementNotificationMessageEvent
} from '@habbo/communication/messages/incoming/notifications/HabboAchievementNotificationMessageEvent';
import {
    HabboActivityPointNotificationMessageEvent
} from '@habbo/communication/messages/incoming/notifications/HabboActivityPointNotificationMessageEvent';

// Quest message events (may be created concurrently by another agent)
import {QuestMessageEvent} from '@habbo/communication/messages/incoming/quest/QuestMessageEvent';
import {QuestsMessageEvent} from '@habbo/communication/messages/incoming/quest/QuestsMessageEvent';
import {SeasonalQuestsMessageEvent} from '@habbo/communication/messages/incoming/quest/SeasonalQuestsMessageEvent';
import {QuestCompletedMessageEvent} from '@habbo/communication/messages/incoming/quest/QuestCompletedMessageEvent';
import {QuestCancelledMessageEvent} from '@habbo/communication/messages/incoming/quest/QuestCancelledMessageEvent';

// Achievement message events (may be created concurrently by another agent)
import {
    AchievementsMessageEvent
} from '@habbo/communication/messages/incoming/inventory/achievements/AchievementsMessageEvent';
import {
    AchievementMessageEvent
} from '@habbo/communication/messages/incoming/inventory/achievements/AchievementMessageEvent';

// Resolution message events (may be created concurrently by another agent)
import {
    AchievementResolutionsMessageEvent
} from '@habbo/communication/messages/incoming/game/lobby/AchievementResolutionsMessageEvent';
import {
    AchievementResolutionProgressMessageEvent
} from '@habbo/communication/messages/incoming/game/lobby/AchievementResolutionProgressMessageEvent';
import {
    AchievementResolutionCompletedMessageEvent
} from '@habbo/communication/messages/incoming/game/lobby/AchievementResolutionCompletedMessageEvent';

// Competition message events (may be created concurrently by another agent)
import {
    CompetitionVotingInfoMessageEvent
} from '@habbo/communication/messages/incoming/competition/CompetitionVotingInfoMessageEvent';
import {
    CompetitionEntrySubmitResultMessageEvent
} from '@habbo/communication/messages/incoming/competition/CompetitionEntrySubmitResultMessageEvent';

// Room-context events: AS3 subscribes all three object mutations plus the settings save, and
// routes every one of them to roomCompetitionController.onContextChanged().
import {ObjectAddMessageEvent} from '@habbo/communication/messages/incoming/room/engine/ObjectAddMessageEvent';
import {
    ObjectRemoveMessageEvent
} from '@habbo/communication/messages/incoming/room/engine/ObjectRemoveMessageEvent';
import {
    ObjectRemoveMultipleMessageEvent
} from '@habbo/communication/messages/incoming/room/engine/ObjectRemoveMultipleMessageEvent';
import {RoomSettingsSavedEvent} from '@habbo/communication/messages/incoming/roomsettings/RoomSettingsSavedEvent';

// Score / subscription / session events
import {
    AchievementsScoreMessageEvent
} from '@habbo/communication/messages/incoming/inventory/AchievementsScoreMessageEvent';
import {ScrSendUserInfoEvent} from '@habbo/communication/messages/incoming/users/ScrSendUserInfoEvent';
import {
    IsFirstLoginOfDayMessageEvent
} from '@habbo/communication/messages/incoming/handshake/IsFirstLoginOfDayMessageEvent';
import {
    ActivityPointsMessageEvent
} from '@habbo/communication/messages/incoming/notifications/ActivityPointsMessageEvent';

import {ActivityPointTypeEnum} from '@habbo/catalog/purse/ActivityPointTypeEnum';

// Parsers
import type {QuestMessageEventParser} from '@habbo/communication/messages/parser/quest/QuestMessageEventParser';
import type {QuestsMessageEventParser} from '@habbo/communication/messages/parser/quest/QuestsMessageEventParser';
import type {
    SeasonalQuestsMessageEventParser
} from '@habbo/communication/messages/parser/quest/SeasonalQuestsMessageEventParser';
import type {
    QuestCompletedMessageEventParser
} from '@habbo/communication/messages/parser/quest/QuestCompletedMessageEventParser';
import type {
    QuestCancelledMessageEventParser
} from '@habbo/communication/messages/parser/quest/QuestCancelledMessageEventParser';
import type {
    AchievementsEventParser
} from '@habbo/communication/messages/parser/inventory/achievements/AchievementsEventParser';
import type {
    AchievementEventParser
} from '@habbo/communication/messages/parser/inventory/achievements/AchievementEventParser';
import type {
    AchievementResolutionsMessageEventParser
} from '@habbo/communication/messages/parser/game/lobby/AchievementResolutionsMessageEventParser';
import type {
    AchievementResolutionProgressMessageEventParser
} from '@habbo/communication/messages/parser/game/lobby/AchievementResolutionProgressMessageEventParser';
import type {
    AchievementResolutionCompletedMessageEventParser
} from '@habbo/communication/messages/parser/game/lobby/AchievementResolutionCompletedMessageEventParser';
import type {
    HabboAchievementNotificationMessageEventParser
} from '@habbo/communication/messages/parser/notifications/HabboAchievementNotificationMessageEventParser';
import type {
    CompetitionVotingInfoMessageEventParser
} from '@habbo/communication/messages/parser/competition/CompetitionVotingInfoMessageEventParser';
import type {
    CompetitionEntrySubmitResultMessageEventParser
} from '@habbo/communication/messages/parser/competition/CompetitionEntrySubmitResultMessageEventParser';
import type {
    AchievementsScoreMessageParser
} from '@habbo/communication/messages/parser/inventory/AchievementsScoreMessageParser';
import type {
    IsFirstLoginOfDayMessageParser
} from '@habbo/communication/messages/parser/handshake/IsFirstLoginOfDayMessageParser';
import type {
    ScrSendUserInfoMessageParser
} from '@habbo/communication/messages/parser/users/ScrSendUserInfoMessageParser';
import type {
    ActivityPointsMessageParser
} from '@habbo/communication/messages/parser/notifications/ActivityPointsMessageParser';
import {EventLogMessageComposer} from '@habbo/communication/messages/outgoing/tracking/EventLogMessageComposer';

const log = Logger.getLogger('habbo.quest.QuestMessageHandler');

/**
 * Central message handler/router for all quest, achievement, and competition
 * server messages. Routes parsed data to the appropriate controllers.
 *
 * @see source_as_win63/habbo/quest/class_3353.as
 */
export class QuestMessageHandler implements IDisposable
{
    private _engine: HabboQuestEngine | null;
    private _messageEvents: IMessageEvent[] = [];

    constructor(engine: HabboQuestEngine)
    {
        this._engine = engine;

        this.registerMessageEvents();
    }

    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/habbo/quest/_SafeCls_1951.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    /**
	 * Dispose of this handler and remove all message events
	 */
    // AS3: .../src/com/sulake/habbo/quest/_SafeCls_1951.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        if(this._engine)
        {
            const communication = this._engine.communicationManager;

            if(communication)
            {
                for(const event of this._messageEvents)
                {
                    communication.removeMessageEvent(event);
                }
            }
        }

        this._messageEvents = [];
        this._engine = null;
        this._disposed = true;
    }

    /**
	 * Register all message event handlers with the communication manager
	 */
    private registerMessageEvents(): void
    {
        if(!this._engine) return;

        const communication = this._engine.communicationManager;

        if(!communication) return;

        // Quest events
        this.addMessageEvent(communication, new QuestMessageEvent(this.onQuest.bind(this)));
        this.addMessageEvent(communication, new QuestsMessageEvent(this.onQuests.bind(this)));
        this.addMessageEvent(communication, new SeasonalQuestsMessageEvent(this.onSeasonalQuests.bind(this)));
        this.addMessageEvent(communication, new QuestCompletedMessageEvent(this.onQuestCompleted.bind(this)));
        this.addMessageEvent(communication, new QuestCancelledMessageEvent(this.onQuestCancelled.bind(this)));

        // Achievement events
        this.addMessageEvent(communication, new AchievementsMessageEvent(this.onAchievements.bind(this)));
        this.addMessageEvent(communication, new AchievementMessageEvent(this.onAchievement.bind(this)));

        // Resolution events
        this.addMessageEvent(communication, new AchievementResolutionsMessageEvent(this.onAchievementResolutions.bind(this)));
        this.addMessageEvent(communication, new AchievementResolutionProgressMessageEvent(this.onAchievementResolutionProgress.bind(this)));
        this.addMessageEvent(communication, new AchievementResolutionCompletedMessageEvent(this.onAchievementResolutionCompleted.bind(this)));

        // Competition events
        this.addMessageEvent(communication, new CompetitionVotingInfoMessageEvent(this.onCompetitionVotingInfo.bind(this)));
        this.addMessageEvent(communication, new CompetitionEntrySubmitResultMessageEvent(this.onCompetitionEntrySubmitResult.bind(this)));

        // Room events
        this.addMessageEvent(communication, new RoomEntryInfoMessageEvent(this.onRoomEnter.bind(this)));
        this.addMessageEvent(communication, new CloseConnectionMessageEvent(this.onRoomExit.bind(this)));

        // Notification events
        this.addMessageEvent(communication, new HabboAchievementNotificationMessageEvent(this.onLevelUp.bind(this)));
        this.addMessageEvent(communication, new HabboActivityPointNotificationMessageEvent(this.onActivityPointsNotification.bind(this)));
        this.addMessageEvent(communication, new ActivityPointsMessageEvent(this.onActivityPoints.bind(this)));

        // Room-competition context. The competition controller has to re-evaluate whether the
        // current room still qualifies whenever its furniture or its settings change, so all
        // three object mutations and the settings save land on the same handler.
        this.addMessageEvent(communication, new ObjectAddMessageEvent(this.onFurnisChanged.bind(this)));
        this.addMessageEvent(communication, new ObjectRemoveMessageEvent(this.onFurnisChanged.bind(this)));
        this.addMessageEvent(communication, new ObjectRemoveMultipleMessageEvent(this.onFurnisChanged.bind(this)));
        this.addMessageEvent(communication, new RoomSettingsSavedEvent(this.onRoomSettingsSaved.bind(this)));

        // Score, subscription and session events
        this.addMessageEvent(communication, new AchievementsScoreMessageEvent(this.onAchievementsScore.bind(this)));
        this.addMessageEvent(communication, new ScrSendUserInfoEvent(this.onSubscriptionUserInfoEvent.bind(this)));
        this.addMessageEvent(communication, new IsFirstLoginOfDayMessageEvent(this.onIsFirstLoginOfDay.bind(this)));

        log.debug('Quest message handler initialized');
    }

    /**
	 * Add a message event and track it for cleanup
	 */
    private addMessageEvent(communication: IHabboCommunicationManager, event: IMessageEvent): void
    {
        communication.addMessageEvent(event);
        this._messageEvents.push(event);
    }

    /**
	 * Handle single quest data update
	 */
    // AS3: .../src/com/sulake/habbo/quest/_SafeCls_1951.as::onQuest()
    private onQuest(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const parser = event.parser as QuestMessageEventParser;

        if(!parser) return;

        log.trace('Quest received');

        if(parser.quest) this._engine.questController?.onQuest(parser.quest);
    }

    /**
	 * Handle quest list
	 */
    // AS3: .../src/com/sulake/habbo/quest/_SafeCls_1951.as::onQuests()
    private onQuests(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const parser = event.parser as QuestsMessageEventParser;

        if(!parser) return;

        log.trace(`Quests received: count=${parser.quests?.length}, openWindow=${parser.openWindow}`);
        this._engine.events.emit(
            QuestsListEvent.QUESTS,
            new QuestsListEvent(QuestsListEvent.QUESTS, parser.quests, parser.openWindow)
        );
    }

    /**
	 * Handle seasonal quest list
	 */
    // AS3: .../src/com/sulake/habbo/quest/_SafeCls_1951.as::onSeasonalQuests()
    private onSeasonalQuests(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const parser = event.parser as SeasonalQuestsMessageEventParser;

        if(!parser) return;

        log.trace(`Seasonal quests received: count=${parser.quests?.length}`);
        this._engine.events.emit(
            QuestsListEvent.QUESTS_SEASONAL,
            new QuestsListEvent(QuestsListEvent.QUESTS_SEASONAL, parser.quests, true)
        );
    }

    /**
	 * Handle quest completion
	 */
    // AS3: .../src/com/sulake/habbo/quest/_SafeCls_1951.as::onQuestCompleted()
    private onQuestCompleted(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const parser = event.parser as QuestCompletedMessageEventParser;

        if(!parser) return;

        log.info(`Quest completed: ${parser.questData?.campaignCode} quest: ${parser.questData?.id}`);

        if(parser.questData)
        {
            this._engine.questController?.onQuestCompleted(parser.questData, parser.showDialog);

            // The gate is AS3's and it was missing: the event fired for EVERY completed quest,
            // and `seasonalcalendar/MainWindow` listens to it — so the calendar reacted to
            // ordinary quests as though they were its own.
            if(this._engine.isSeasonalQuest(parser.questData))
            {
                this._engine.events.emit(
                    QuestCompletedEvent.QUEST_SEASONAL,
                    new QuestCompletedEvent(QuestCompletedEvent.QUEST_SEASONAL, parser.questData)
                );
            }
        }
    }

    /**
	 * Handle quest cancellation
	 */
    // AS3: .../src/com/sulake/habbo/quest/_SafeCls_1951.as::onQuestCancelled()
    private onQuestCancelled(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const parser = event.parser as QuestCancelledMessageEventParser;

        if(!parser) return;

        log.debug(`Quest cancelled: ${parser.quest?.id}`);
        this._engine.questController?.onQuestCancelled(parser.quest?.campaignChainCode ?? '');

        // A quest can be cancelled for two reasons and only one of them is the player's doing.
        // Without this the expired ones simply vanished from the list with no explanation.
        if(parser.expired)
        {
            this._engine.windowManager?.alert('${quests.expired.title}', '${quests.expired.body}', 0, null);
        }
    }

    /**
	 * Handle achievement list
	 */
    // AS3: .../src/com/sulake/habbo/quest/_SafeCls_1951.as::onAchievements()
    private onAchievements(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const parser = event.parser as AchievementsEventParser;

        if(!parser) return;

        this._engine.achievementController?.onAchievements(
            parser.achievements as AchievementData[],
            parser.defaultCategory
        );
    }

    /**
	 * Handle single achievement update
	 */
    // AS3: .../src/com/sulake/habbo/quest/_SafeCls_1951.as::onAchievement()
    private onAchievement(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const parser = event.parser as AchievementEventParser;

        if(!parser) return;

        this._engine.achievementController?.onAchievement(parser.achievement as AchievementData);
        this._engine.achievementsResolutionController?.onAchievement(parser.achievement as AchievementData);
    }

    /**
	 * Handle resolution achievements
	 */
    // AS3: .../src/com/sulake/habbo/quest/_SafeCls_1951.as::onAchievementResolutions()
    private onAchievementResolutions(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const parser = event.parser as AchievementResolutionsMessageEventParser;

        if(!parser) return;

        this._engine.achievementsResolutionController?.onResolutionAchievements(
            parser.stuffId,
            parser.achievements,
            parser.endTime
        );
    }

    /**
	 * Handle resolution progress
	 */
    // AS3: .../src/com/sulake/habbo/quest/_SafeCls_1951.as::onAchievementResolutionProgress()
    private onAchievementResolutionProgress(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const parser = event.parser as AchievementResolutionProgressMessageEventParser;

        if(!parser) return;

        this._engine.achievementsResolutionController?.onResolutionProgress(
            parser.stuffId,
            parser.achievementId,
            parser.requiredLevelBadgeCode,
            parser.userProgress,
            parser.totalProgress,
            parser.endTime
        );
    }

    /**
	 * Handle resolution completed
	 */
    // AS3: .../src/com/sulake/habbo/quest/_SafeCls_1951.as::onAchievementResolutionCompleted()
    private onAchievementResolutionCompleted(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const parser = event.parser as AchievementResolutionCompletedMessageEventParser;

        if(!parser) return;

        this._engine.achievementsResolutionController?.onResolutionCompleted(
            parser.badgeCode,
            parser.stuffCode
        );
    }

    /**
	 * Handle competition voting info
	 */
    // AS3: .../src/com/sulake/habbo/quest/_SafeCls_1951.as::onCompetitionVotingInfo()
    private onCompetitionVotingInfo(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const parser = event.parser as CompetitionVotingInfoMessageEventParser;

        if(!parser) return;

        this._engine.roomCompetitionController?.onCompetitionVotingInfo(parser);
    }

    /**
	 * Handle competition entry submit result
	 */
    // AS3: .../src/com/sulake/habbo/quest/_SafeCls_1951.as::onCompetitionEntrySubmitResult()
    private onCompetitionEntrySubmitResult(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const parser = event.parser as CompetitionEntrySubmitResultMessageEventParser;

        if(!parser) return;

        this._engine.roomCompetitionController?.onCompetitionEntrySubmitResult(parser);
    }

    /**
	 * Handle room entry
	 */
    // AS3: .../src/com/sulake/habbo/quest/_SafeCls_1951.as::onRoomEnter()
    private onRoomEnter(event: IMessageEvent): void
    {
        if(!this._engine) return;

        // `owner` is the whole reason the competition controller wants this message: it decides
        // whether the banner offers to submit the room or to vote for it. It used to be passed 0.
        const parser = event.parser as RoomEntryInfoMessageParser | null;

        this._engine.roomCompetitionController?.onRoomEnter(parser?.owner ?? false);
        this._engine.currentlyInRoom = true;
    }

    /**
	 * Handle room exit
	 */
    // AS3: .../src/com/sulake/habbo/quest/_SafeCls_1951.as::onRoomExit()
    private onRoomExit(_event: IMessageEvent): void
    {
        if(!this._engine) return;

        this._engine.questController?.onRoomExit();
        this._engine.achievementController?.onRoomExit();
        this._engine.roomCompetitionController?.onRoomExit();
        this._engine.currentlyInRoom = false;
    }

    /**
	 * Handle achievement level-up notification
	 */
    // AS3: .../src/com/sulake/habbo/quest/_SafeCls_1951.as::onLevelUp()
    private onLevelUp(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const parser = event.parser as HabboAchievementNotificationMessageEventParser;

        if(!parser) return;

        // Levelling an achievement is reported before the controller is told, and it was not
        // reported at all. The name sent is the badge's BASE name — `getBadgeBaseName()` strips
        // the level suffix — so the five levels of one achievement aggregate as one thing.
        const badgeBaseName = this._engine.localization?.getBadgeBaseName(parser.data?.badgeCode ?? '') ?? '';

        this._engine.send(new EventLogMessageComposer(
            'Achievements', badgeBaseName, 'Leveled', '', parser.data?.level ?? 0));

        this._engine.achievementsResolutionController?.onLevelUp(parser.data);

        log.trace('Achievement level-up notification received');
    }

    /**
	 * Handle a single activity-point balance change (seasonal calendar currency display).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/_SafeCls_1951.as::onActivityPointsNotification()
    private onActivityPointsNotification(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const notification = event as HabboActivityPointNotificationMessageEvent;

        if(!notification.parser) return;

        this._engine.questController?.onActivityPoints(notification.type, notification.amount);
    }

    /**
	 * Handle the whole wallet.
	 *
	 * AS3 zeroes every `ActivityPointTypeEnum` value first and then applies the wallet, so a
	 * currency the server stopped sending falls back to 0 instead of keeping its last value.
	 * The reset pass is the reason the order matters.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/_SafeCls_1951.as::onActivityPoints()
    private onActivityPoints(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const parser = event.parser as ActivityPointsMessageParser;

        if(!parser) return;

        for(const type of ActivityPointTypeEnum.values())
        {
            this._engine.questController?.onActivityPoints(type, 0);
        }

        for(const [type, amount] of parser.points)
        {
            this._engine.questController?.onActivityPoints(type, amount);
        }
    }

    /**
	 * The room's furniture changed — added, removed, or removed in bulk.
	 *
	 * AS3 registers the same handler for all three and ignores the payload entirely: the
	 * competition controller re-reads the room itself.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/_SafeCls_1951.as::onFurnisChanged()
    private onFurnisChanged(_event: IMessageEvent): void
    {
        this._engine?.roomCompetitionController?.onContextChanged();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/_SafeCls_1951.as::onRoomSettingsSaved()
    private onRoomSettingsSaved(_event: IMessageEvent): void
    {
        this._engine?.roomCompetitionController?.onContextChanged();
    }

    /**
	 * Publishes the achievement score as a localization parameter, which is what makes
	 * `${achievements.categories.score}` resolve to a number instead of rendering its own key.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/_SafeCls_1951.as::onAchievementsScore()
    private onAchievementsScore(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const parser = event.parser as AchievementsScoreMessageParser;

        if(!parser) return;

        this._engine.localization?.registerParameter('achievements.categories.score', 'score', parser.score.toString());
    }

    /**
	 * The subscription reply doubles as the room-competition trigger: AS3 only kicks the
	 * competition init off for a VIP, and only on response type 2.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/_SafeCls_1951.as::onSubscriptionUserInfoEvent()
    private onSubscriptionUserInfoEvent(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const parser = event.parser as ScrSendUserInfoMessageParser;

        if(!parser) return;

        if(parser.isVIP && parser.responseType === 2)
        {
            this._engine.roomCompetitionController?.sendRoomCompetitionInit();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/_SafeCls_1951.as::onIsFirstLoginOfDay()
    private onIsFirstLoginOfDay(event: IMessageEvent): void
    {
        if(!this._engine) return;

        const parser = event.parser as IsFirstLoginOfDayMessageParser;

        if(!parser) return;

        this._engine.setIsFirstLoginOfDay(parser.isFirstLoginOfDay);
    }
}
