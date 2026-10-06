/**
 * RoomObjectFactory
 *
 * Based on AS3: com.sulake.habbo.room.RoomObjectFactory
 *
 * Factory for creating room object logic instances and object managers.
 * Visualization creation is handled by RoomObjectVisualizationFactory.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/RoomObjectFactory.as
 */
import {EventEmitter} from 'eventemitter3';
import type {IRoomObjectFactory} from '@room/IRoomObjectFactory';
import type {IRoomObjectEventHandler} from '@room/object/logic/IRoomObjectEventHandler';
import type {IRoomObjectManager} from '@room/IRoomObjectManager';
import {RoomObjectManager} from '@room/RoomObjectManager';
import {RoomObjectLogicEnum} from './object/RoomObjectLogicEnum';
import {FurnitureLogic} from './object/logic/furniture/FurnitureLogic';
import {FurnitureMultiStateLogic} from './object/logic/furniture/FurnitureMultiStateLogic';
import {FurnitureMultiHeightLogic} from './object/logic/furniture/FurnitureMultiHeightLogic';
import {FurniturePlaceholderLogic} from './object/logic/furniture/FurniturePlaceholderLogic';
import {AvatarLogic} from './object/logic/AvatarLogic';
import {PetLogic} from './object/logic/PetLogic';
import {FurnitureRandomStateLogic} from './object/logic/furniture/FurnitureRandomStateLogic';
import {FurnitureCreditLogic} from './object/logic/furniture/FurnitureCreditLogic';
import {FurnitureStickieLogic} from './object/logic/furniture/FurnitureStickieLogic';
import {FurnitureExternalImageLogic} from './object/logic/furniture/FurnitureExternalImageLogic';
import {FurniturePresentLogic} from './object/logic/furniture/FurniturePresentLogic';
import {FurnitureTrophyLogic} from './object/logic/furniture/FurnitureTrophyLogic';
import {FurnitureEcotronBoxLogic} from './object/logic/furniture/FurnitureEcotronBoxLogic';
import {FurnitureDiceLogic} from './object/logic/furniture/FurnitureDiceLogic';
import {FurnitureHockeyScoreLogic} from './object/logic/furniture/FurnitureHockeyScoreLogic';
import {FurnitureHabboWheelLogic} from './object/logic/furniture/FurnitureHabboWheelLogic';
import {FurnitureOneWayDoorLogic} from './object/logic/furniture/FurnitureOneWayDoorLogic';
import {FurniturePlanetSystemLogic} from './object/logic/furniture/FurniturePlanetSystemLogic';
import {FurnitureWindowLogic} from './object/logic/furniture/FurnitureWindowLogic';
import {FurnitureRoomDimmerLogic} from './object/logic/furniture/FurnitureRoomDimmerLogic';
import {RoomTileCursorLogic} from './object/logic/room/RoomTileCursorLogic';
import {SelectionArrowLogic} from './object/logic/room/SelectionArrowLogic';
import {FurnitureCrackableLogic} from './object/logic/furniture/FurnitureCrackableLogic';
import {FurniturePushableLogic} from './object/logic/furniture/FurniturePushableLogic';
import {FurnitureClothingChangeLogic} from './object/logic/furniture/FurnitureClothingChangeLogic';
import {FurnitureCounterClockLogic} from './object/logic/furniture/FurnitureCounterClockLogic';
import {FurnitureScoreLogic} from './object/logic/furniture/FurnitureScoreLogic';
import {FurnitureIceStormLogic} from './object/logic/furniture/FurnitureIceStormLogic';
import {FurnitureFireworksLogic} from './object/logic/furniture/FurnitureFireworksLogic';
import {FurnitureRoomBillboardLogic} from './object/logic/furniture/FurnitureRoomBillboardLogic';
import {FurnitureRoomBackgroundLogic} from './object/logic/furniture/FurnitureRoomBackgroundLogic';
import {FurnitureWelcomeGiftLogic} from './object/logic/furniture/FurnitureWelcomeGiftLogic';
import {FurnitureFloorHoleLogic} from './object/logic/furniture/FurnitureFloorHoleLogic';
import {RoomLogic} from './object/logic/room/RoomLogic';
import {FurnitureMannequinLogic} from './object/logic/furniture/FurnitureMannequinLogic';
import {FurnitureGuildCustomizedLogic} from './object/logic/furniture/FurnitureGuildCustomizedLogic';
import {FurnitureGroupForumTerminalLogic} from './object/logic/furniture/FurnitureGroupForumTerminalLogic';
import {FurniturePetProductLogic} from './object/logic/furniture/FurniturePetProductLogic';
import {FurnitureCuckooClockLogic} from './object/logic/furniture/FurnitureCuckooClockLogic';
import {FurnitureVoteCounterLogic} from './object/logic/furniture/FurnitureVoteCounterLogic';
import {FurnitureVoteMajorityLogic} from './object/logic/furniture/FurnitureVoteMajorityLogic';
import {FurnitureSoundBlockLogic} from './object/logic/furniture/FurnitureSoundBlockLogic';
import {FurnitureRandomTeleportLogic} from './object/logic/furniture/FurnitureRandomTeleportLogic';
import {FurniturePurchasableClothingLogic} from './object/logic/furniture/FurniturePurchasableClothingLogic';
import {FurnitureRoomBackgroundColorLogic} from './object/logic/furniture/FurnitureRoomBackgroundColorLogic';
import {FurnitureAreaHideLogic} from './object/logic/furniture/FurnitureAreaHideLogic';
import {FurnitureEffectBoxLogic} from './object/logic/furniture/FurnitureEffectBoxLogic';
import {FurnitureAchievementResolutionLogic} from './object/logic/furniture/FurnitureAchievementResolutionLogic';
import {FurnitureLovelockLogic} from './object/logic/furniture/FurnitureLovelockLogic';
import {FurnitureWildwestWantedLogic} from './object/logic/furniture/FurnitureWildwestWantedLogic';
import {FurnitureHweenLovelockLogic} from './object/logic/furniture/FurnitureHweenLovelockLogic';
import {FurnitureBadgeDisplayLogic} from './object/logic/furniture/FurnitureBadgeDisplayLogic';
import {FurnitureHighScoreLogic} from './object/logic/furniture/FurnitureHighScoreLogic';
import {FurnitureInternalLinkLogic} from './object/logic/furniture/FurnitureInternalLinkLogic';
import {FurnitureEditableInternalLinkLogic} from './object/logic/furniture/FurnitureEditableInternalLinkLogic';
import {FurnitureEditableRoomLinkLogic} from './object/logic/furniture/FurnitureEditableRoomLinkLogic';
import {FurnitureCustomStackHeightLogic} from './object/logic/furniture/FurnitureCustomStackHeightLogic';
import {FurnitureYoutubeLogic} from './object/logic/furniture/FurnitureYoutubeLogic';
import {FurnitureRentableSpaceLogic} from './object/logic/furniture/FurnitureRentableSpaceLogic';
import {FurnitureChangeStateWhenStepOnLogic} from './object/logic/furniture/FurnitureChangeStateWhenStepOnLogic';
import {FurnitureVimeoLogic} from './object/logic/furniture/FurnitureVimeoLogic';
import {FurnitureCraftingGizmoLogic} from './object/logic/furniture/FurnitureCraftingGizmoLogic';
// Vortex-only: the fishing spot's logic lives under src/vortex/, not in the ported tree.
import {FurnitureFishingSignLogic} from '@habbo/vortex/fishing/room/FurnitureFishingSignLogic';
import {FurnitureFishingSpotLogic} from '@habbo/vortex/fishing/room/FurnitureFishingSpotLogic';

type LogicConstructor = new () => IRoomObjectEventHandler;

export class RoomObjectFactory implements IRoomObjectFactory
{
    private _registeredTypes: Map<string, boolean>;
    // AS3: .../src/com/sulake/habbo/room/RoomObjectFactory.as::_trackedEventTypes
    private _trackedEventTypes: Map<string, boolean>;
    // AS3: .../src/com/sulake/habbo/room/RoomObjectFactory.as::_objectEventListeners
    private _objectEventListeners: Array<(event: unknown) => void>;

    constructor()
    {
        this._events = new EventEmitter();
        this._registeredTypes = new Map();
        this._trackedEventTypes = new Map();
        this._objectEventListeners = [];
    }

    private _events: EventEmitter;

    get events(): EventEmitter
    {
        return this._events;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/RoomObjectFactory.as::addObjectEventListener()
    addObjectEventListener(callback: (event: unknown) => void): void
    {
        if(this._objectEventListeners.indexOf(callback) < 0)
        {
            this._objectEventListeners.push(callback);

            if(callback !== null)
            {
                for(const eventType of this._trackedEventTypes.keys())
                {
                    this._events.on(eventType, callback);
                }
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/RoomObjectFactory.as::removeObjectEventListener()
    removeObjectEventListener(callback: (event: unknown) => void): void
    {
        const index = this._objectEventListeners.indexOf(callback);

        if(index >= 0)
        {
            this._objectEventListeners.splice(index, 1);

            if(callback !== null)
            {
                for(const eventType of this._trackedEventTypes.keys())
                {
                    this._events.off(eventType, callback);
                }
            }
        }
    }

    // DEVIATION: AS3 also maps `game_snowball` / `game_snowsplash` onto the snow-war logics; the RPG
    //   fork removed Snow War, so both types fall back to null like any unknown type.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/RoomObjectFactory.as::createRoomObjectLogic()
    // The case order mirrors the AS3 switch. AS3 has no default branch: an unknown type leaves the
    // class null and the method returns null, so the object simply gets no event handler.
    createRoomObjectLogic(type: string): IRoomObjectEventHandler | null
    {
        let LogicClass: LogicConstructor | null = null;

        switch(type)
        {
            case RoomObjectLogicEnum.FURNITURE_BASIC:
                LogicClass = FurnitureLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_MULTISTATE:
                LogicClass = FurnitureMultiStateLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_MULTIHEIGHT:
                LogicClass = FurnitureMultiHeightLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_PLACEHOLDER:
                LogicClass = FurniturePlaceholderLogic;

                break;

            case RoomObjectLogicEnum.USER:
            case RoomObjectLogicEnum.BOT:
            case RoomObjectLogicEnum.RENTABLE_BOT:
                LogicClass = AvatarLogic;

                break;

            case RoomObjectLogicEnum.PET:
                LogicClass = PetLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_RANDOMSTATE:
                LogicClass = FurnitureRandomStateLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_CREDIT:
                LogicClass = FurnitureCreditLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_STICKIE:
                LogicClass = FurnitureStickieLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_EXTERNAL_IMAGE_WALLITEM:
                LogicClass = FurnitureExternalImageLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_PRESENT:
                LogicClass = FurniturePresentLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_TROPHY:
                LogicClass = FurnitureTrophyLogic;

                break;

            // DEVIATION: AS3 builds FurnitureFurniChestLogic / FurnitureCoinsChestLogic here. The RPG
            //   fork removed the wired chests, but furnidata can still name these two types, so they
            //   get the chests' own base, FurnitureLogic: a plain furni rather than one with no
            //   logic at all (which is what an unknown type gets — see the note above).
            case RoomObjectLogicEnum.FURNITURE_FURNI_CHEST:
            case RoomObjectLogicEnum.FURNITURE_COINS_CHEST:
                LogicClass = FurnitureLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_ECOTRON_BOX:
                LogicClass = FurnitureEcotronBoxLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_DICE:
                LogicClass = FurnitureDiceLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_HOCKEY_SCORE:
                LogicClass = FurnitureHockeyScoreLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_HABBOWHEEL:
                LogicClass = FurnitureHabboWheelLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_ONE_WAY_DOOR:
                LogicClass = FurnitureOneWayDoorLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_PLANET_SYSTEM:
                LogicClass = FurniturePlanetSystemLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_WINDOW:
                LogicClass = FurnitureWindowLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_ROOMDIMMER:
                LogicClass = FurnitureRoomDimmerLogic;

                break;

            case RoomObjectLogicEnum.ROOM_TILE_CURSOR:
                LogicClass = RoomTileCursorLogic;

                break;

            case RoomObjectLogicEnum.SELECTION_ARROW:
                LogicClass = SelectionArrowLogic;

                break;

            // DEVIATION: AS3 builds the sound-machine / jukebox furniture logics here. The RPG
            //   fork removed jukebox music, but furnidata can still name these two types, so they get
            //   those logics' own base, FurnitureMultiStateLogic: a furni that still toggles its state.
            case RoomObjectLogicEnum.FURNITURE_SOUND_MACHINE:
            case RoomObjectLogicEnum.FURNITURE_JUKEBOX:
                LogicClass = FurnitureMultiStateLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_CRACKABLE:
                LogicClass = FurnitureCrackableLogic;

                break;

            // DEVIATION: AS3 builds the song-disk furniture logic here; the RPG fork removed jukebox music,
            //   so a song disk is a plain furni (its logic's own base).
            case RoomObjectLogicEnum.FURNITURE_SONG_DISK:
                LogicClass = FurnitureLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_PUSHABLE:
                LogicClass = FurniturePushableLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_CLOTHING_CHANGE:
                LogicClass = FurnitureClothingChangeLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_COUNTER_CLOCK:
                LogicClass = FurnitureCounterClockLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_SCORE:
                LogicClass = FurnitureScoreLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_ES:
                LogicClass = FurnitureIceStormLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_FIREWORKS:
                LogicClass = FurnitureFireworksLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_BB:
                LogicClass = FurnitureRoomBillboardLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_BG:
                LogicClass = FurnitureRoomBackgroundLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_WELCOME_GIFT:
                LogicClass = FurnitureWelcomeGiftLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_FLOOR_HOLE:
                LogicClass = FurnitureFloorHoleLogic;

                break;

            case RoomObjectLogicEnum.ROOM:
                LogicClass = RoomLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_MANNEQUIN:
                LogicClass = FurnitureMannequinLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_GUILD_CUSTOMIZED:
                LogicClass = FurnitureGuildCustomizedLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_GROUP_FORUM_TERMINAL:
                LogicClass = FurnitureGroupForumTerminalLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_PET_CUSTOMIZATION:
                LogicClass = FurniturePetProductLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_CUCKOO_CLOCK:
                LogicClass = FurnitureCuckooClockLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_VOTE_COUNTER:
                LogicClass = FurnitureVoteCounterLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_VOTE_MAJORITY:
                LogicClass = FurnitureVoteMajorityLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_SOUNDBLOCK:
                LogicClass = FurnitureSoundBlockLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_RANDOM_TELEPORT:
                LogicClass = FurnitureRandomTeleportLogic;

                break;

            // DEVIATION: AS3 builds the monsterplant seed logic here. The RPG fork removed
            //   monsterplants, but furnidata can still name this type, so it gets that logic's own
            //   base, FurnitureMultiStateLogic: a furni that still toggles its state.
            case RoomObjectLogicEnum.FURNITURE_MONSTERPLANT_SEED:
                LogicClass = FurnitureMultiStateLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_PURCHASABLE_CLOTHING:
                LogicClass = FurniturePurchasableClothingLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_BACKGROUND_COLOR:
                LogicClass = FurnitureRoomBackgroundColorLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_AREA_HIDE:
                LogicClass = FurnitureAreaHideLogic;

                break;

            // DEVIATION: AS3 builds FurnitureMysterboxLogic / FurnitureMysteryTrophyLogic here. The RPG
            //   fork removed mystery boxes, but furnidata still names these two types, so they get those
            //   logics' common ancestor, FurnitureLogic: a plain furni that can still be clicked, moved
            //   and picked up.
            case RoomObjectLogicEnum.FURNITURE_MYSTERYBOX:
            case RoomObjectLogicEnum.FURNITURE_MYSTERYTROPHY:
                LogicClass = FurnitureLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_EFFECTBOX:
                LogicClass = FurnitureEffectBoxLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_ACHIEVEMENT_RESOLUTION:
                LogicClass = FurnitureAchievementResolutionLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_LOVELOCK_ENGRAVING:
                LogicClass = FurnitureLovelockLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_WILD_WEST_WANTED_ENGRAVING:
                LogicClass = FurnitureWildwestWantedLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_HABBOWEEN_ENGRAVING:
                LogicClass = FurnitureHweenLovelockLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_BADGE_DISPLAY:
                LogicClass = FurnitureBadgeDisplayLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_HIGH_SCORE:
                LogicClass = FurnitureHighScoreLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_INTERNAL_LINK:
                LogicClass = FurnitureInternalLinkLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_EDITABLE_INTERNAL_LINK:
                LogicClass = FurnitureEditableInternalLinkLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_EDITABLE_ROOM_LINK:
                LogicClass = FurnitureEditableRoomLinkLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_CUSTOM_STACK_HEIGHT:
                LogicClass = FurnitureCustomStackHeightLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_YOUTUBE:
                LogicClass = FurnitureYoutubeLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_RENTABLE_SPACE:
                LogicClass = FurnitureRentableSpaceLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_CHANGE_STATE_WHEN_STEP_ON:
                LogicClass = FurnitureChangeStateWhenStepOnLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_VIMEO:
                LogicClass = FurnitureVimeoLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_CRAFTING_GIZMO:
                LogicClass = FurnitureCraftingGizmoLogic;

                break;

            // TS-only: Vortex-only fishing system — see docs/vortex-original/fishing.md §2.3.
            case RoomObjectLogicEnum.VORTEX_FISHING_SPOT:
                LogicClass = FurnitureFishingSpotLogic;

                break;

            // TS-only: Vortex-only fishing system — the sign, which opens the book. §1 and §15.
            case RoomObjectLogicEnum.VORTEX_FISHING_SIGN:
                LogicClass = FurnitureFishingSignLogic;

                break;

            // DEVIATION: AS3 builds FurnitureNftCreditLogic / FurnitureNftRewardBoxLogic here. The RPG
            //   fork removed collectibles and NFT, but furnidata can still name these two types, so
            //   they get the NFT logics' own base, FurnitureLogic: a plain furni, like the chests above.
            case RoomObjectLogicEnum.FURNITURE_NFT_CREDIT:
            case RoomObjectLogicEnum.FURNITURE_NFT_REWARD_BOX:
                LogicClass = FurnitureLogic;

                break;

            default:
                break;
        }

        if(LogicClass === null)
        {
            return null;
        }

        const logic = new LogicClass();

        if(logic !== null)
        {
            logic.eventDispatcher = this._events;

            if(!this._registeredTypes.has(type))
            {
                this._registeredTypes.set(type, true);

                const eventTypes = logic.getEventTypes();

                for(const eventType of eventTypes)
                {
                    this.addTrackedEventType(eventType);
                }
            }

            return logic;
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/RoomObjectFactory.as::createRoomObjectManager()
    createRoomObjectManager(): IRoomObjectManager
    {
        return new RoomObjectManager();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/RoomObjectFactory.as::addTrackedEventType()
    private addTrackedEventType(eventType: string): void
    {
        if(!this._trackedEventTypes.has(eventType))
        {
            this._trackedEventTypes.set(eventType, true);

            for(const listener of this._objectEventListeners)
            {
                if(listener !== null)
                {
                    this._events.on(eventType, listener);
                }
            }
        }
    }
}
