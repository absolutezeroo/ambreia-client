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
import {OrderedMap} from '@core/utils/OrderedMap';
import type {VariableFxConfigUpdateData} from './object/variablefx/VariableFxConfigUpdateData';
import {VariableFxLogicConfig} from './object/logic/VariableFxLogicConfig';
import {AvatarLogicRoomData} from './object/logic/AvatarLogicRoomData';
import {FurnitureLogicRoomData} from './object/logic/FurnitureLogicRoomData';
import {RoomObjectLogicEnum} from './object/RoomObjectLogicEnum';
import {FurnitureLogic} from './object/logic/furniture/FurnitureLogic';
import {FurnitureMultiStateLogic} from './object/logic/furniture/FurnitureMultiStateLogic';
import {FurnitureMultiHeightLogic} from './object/logic/furniture/FurnitureMultiHeightLogic';
import {FurniturePlaceholderLogic} from './object/logic/furniture/FurniturePlaceholderLogic';
import {AvatarLogic} from './object/logic/AvatarLogic';
import {PetLogic} from './object/logic/PetLogic';
import {FurnitureRandomStateLogic} from './object/logic/furniture/FurnitureRandomStateLogic';
import {FurnitureCreditLogic} from './object/logic/furniture/FurnitureCreditLogic';
import {FurnitureNftCreditLogic} from './object/logic/furniture/FurnitureNftCreditLogic';
import {FurnitureNftRewardBoxLogic} from './object/logic/furniture/FurnitureNftRewardBoxLogic';
import {FurnitureStickieLogic} from './object/logic/furniture/FurnitureStickieLogic';
import {FurnitureExternalImageLogic} from './object/logic/furniture/FurnitureExternalImageLogic';
import {FurniturePresentLogic} from './object/logic/furniture/FurniturePresentLogic';
import {FurnitureTrophyLogic} from './object/logic/furniture/FurnitureTrophyLogic';
import {FurnitureEcotronBoxLogic} from './object/logic/furniture/FurnitureEcotronBoxLogic';
import {FurnitureFurniChestLogic} from './object/logic/furniture/FurnitureFurniChestLogic';
import {FurnitureCoinsChestLogic} from './object/logic/furniture/FurnitureCoinsChestLogic';
import {FurnitureDiceLogic} from './object/logic/furniture/FurnitureDiceLogic';
import {FurnitureHockeyScoreLogic} from './object/logic/furniture/FurnitureHockeyScoreLogic';
import {FurnitureHabboWheelLogic} from './object/logic/furniture/FurnitureHabboWheelLogic';
import {FurnitureOneWayDoorLogic} from './object/logic/furniture/FurnitureOneWayDoorLogic';
import {FurniturePlanetSystemLogic} from './object/logic/furniture/FurniturePlanetSystemLogic';
import {FurnitureWindowLogic} from './object/logic/furniture/FurnitureWindowLogic';
import {FurnitureRoomDimmerLogic} from './object/logic/furniture/FurnitureRoomDimmerLogic';
import {RoomTileCursorLogic} from './object/logic/room/RoomTileCursorLogic';
import {SelectionArrowLogic} from './object/logic/room/SelectionArrowLogic';
import {FurnitureSoundMachineLogic} from './object/logic/furniture/FurnitureSoundMachineLogic';
import {FurnitureJukeboxLogic} from './object/logic/furniture/FurnitureJukeboxLogic';
import {FurnitureCrackableLogic} from './object/logic/furniture/FurnitureCrackableLogic';
import {FurnitureSongDiskLogic} from './object/logic/furniture/FurnitureSongDiskLogic';
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
import {FurnitureMonsterplantSeedLogic} from './object/logic/furniture/FurnitureMonsterplantSeedLogic';
import {FurniturePurchasableClothingLogic} from './object/logic/furniture/FurniturePurchasableClothingLogic';
import {FurnitureRoomBackgroundColorLogic} from './object/logic/furniture/FurnitureRoomBackgroundColorLogic';
import {FurnitureAreaHideLogic} from './object/logic/furniture/FurnitureAreaHideLogic';
import {FurnitureMysterboxLogic} from './object/logic/furniture/FurnitureMysterboxLogic';
import {FurnitureEffectBoxLogic} from './object/logic/furniture/FurnitureEffectBoxLogic';
import {FurnitureMysteryTrophyLogic} from './object/logic/furniture/FurnitureMysteryTrophyLogic';
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
import {SnowballLogic} from './object/logic/game/SnowballLogic';
import {SnowSplashLogic} from './object/logic/game/SnowSplashLogic';
import {FurnitureFishingSpotLogic} from '@habbo/vortex/fishing/room/FurnitureFishingSpotLogic';

type LogicConstructor = new () => IRoomObjectEventHandler;

export class RoomObjectFactory implements IRoomObjectFactory
{
    private _registeredTypes: Map<string, boolean>;
    // AS3: .../src/com/sulake/habbo/room/RoomObjectFactory.as::_trackedEventTypes
    private _trackedEventTypes: Map<string, boolean>;
    // AS3: .../src/com/sulake/habbo/room/RoomObjectFactory.as::_objectEventListeners
    private _objectEventListeners: Array<(event: unknown) => void>;

    /**
     * Per-room VariableFx config stores, keyed by room *identifier*. Two maps rather than one
     * because a config is either a user effect or a furniture one, and each half is read by a
     * different set of object logics.
     */
    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/room/RoomObjectFactory.as::_avatarLogicRoomData
    //   Name derived: the AS3 field is `_SafeStr_5897`; named for what it holds.
    private _avatarLogicRoomData: OrderedMap<string, AvatarLogicRoomData> = new OrderedMap();

    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/room/RoomObjectFactory.as::_furnitureLogicRoomData
    //   Name derived: the AS3 field is `_SafeStr_5916`.
    private _furnitureLogicRoomData: OrderedMap<string, FurnitureLogicRoomData> = new OrderedMap();

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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/RoomObjectFactory.as::createRoomObjectLogic()
    // The case order mirrors the AS3 switch. AS3 has no default branch: an unknown type leaves the
    // class null and the method returns null, so the object simply gets no event handler.
    createRoomObjectLogic(type: string, roomId: string | null = null): IRoomObjectEventHandler | null
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

            case RoomObjectLogicEnum.FURNITURE_FURNI_CHEST:
                LogicClass = FurnitureFurniChestLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_COINS_CHEST:
                LogicClass = FurnitureCoinsChestLogic;

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

            case RoomObjectLogicEnum.FURNITURE_SOUND_MACHINE:
                LogicClass = FurnitureSoundMachineLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_JUKEBOX:
                LogicClass = FurnitureJukeboxLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_CRACKABLE:
                LogicClass = FurnitureCrackableLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_SONG_DISK:
                LogicClass = FurnitureSongDiskLogic;

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

            case RoomObjectLogicEnum.FURNITURE_MONSTERPLANT_SEED:
                LogicClass = FurnitureMonsterplantSeedLogic;

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

            case RoomObjectLogicEnum.FURNITURE_MYSTERYBOX:
                LogicClass = FurnitureMysterboxLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_EFFECTBOX:
                LogicClass = FurnitureEffectBoxLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_MYSTERYTROPHY:
                LogicClass = FurnitureMysteryTrophyLogic;

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

            case RoomObjectLogicEnum.FURNITURE_NFT_CREDIT:
                LogicClass = FurnitureNftCreditLogic;

                break;

            case RoomObjectLogicEnum.FURNITURE_NFT_REWARD_BOX:
                LogicClass = FurnitureNftRewardBoxLogic;

                break;

            // Neither derives from FurnitureLogic: a snowball is a `MovingObjectLogic` (the room
            // interpolates between the positions the simulation pushes) and its splash is a bare
            // `ObjectLogicBase` that never moves at all.
            case RoomObjectLogicEnum.SNOWBALL:
                LogicClass = SnowballLogic;

                break;

            case RoomObjectLogicEnum.SNOW_SPLASH:
                LogicClass = SnowSplashLogic;

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
            // The logic's link to its room's VariableFx config store. Without it every effect on
            // this object resolves no config and publishes nothing — the whole feature goes quiet
            // without failing. Avatars and pets share the avatar store; everything else that is a
            // FurnitureLogic takes the furniture one.
            if(roomId)
            {
                if(logic instanceof AvatarLogic || logic instanceof PetLogic)
                {
                    logic.roomData = this.getAvatarLogicRoomData(roomId);
                }
                else if(logic instanceof FurnitureLogic)
                {
                    logic.roomData = this.getFurnitureLogicRoomData(roomId);
                }
            }

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

    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/room/RoomObjectFactory.as::getAvatarLogicRoomData()
    private getAvatarLogicRoomData(roomId: string): AvatarLogicRoomData
    {
        let data = this._avatarLogicRoomData.getValue(roomId);

        if(data === null)
        {
            data = new AvatarLogicRoomData();
            this._avatarLogicRoomData.add(roomId, data);
        }

        return data;
    }

    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/room/RoomObjectFactory.as::getFurnitureLogicRoomData()
    private getFurnitureLogicRoomData(roomId: string): FurnitureLogicRoomData
    {
        let data = this._furnitureLogicRoomData.getValue(roomId);

        if(data === null)
        {
            data = new FurnitureLogicRoomData();
            this._furnitureLogicRoomData.add(roomId, data);
        }

        return data;
    }

    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/room/RoomObjectFactory.as::updateVariableFxConfigs()
    updateVariableFxConfigs(roomId: string, configs: VariableFxConfigUpdateData[]): void
    {
        for(const config of configs)
        {
            const store = config.isUserFx
                ? this.getAvatarLogicRoomData(roomId)
                : this.getFurnitureLogicRoomData(roomId);

            store.variableFxLogicManager?.upsertConfig(new VariableFxLogicConfig(
                config.configId,
                config.isUserFx,
                config.showMode,
                config.visibilityMask,
                config.showOnMouseHover,
                config.showDuration
            ));
        }
    }

    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/room/RoomObjectFactory.as::removeVariableFxConfigs()
    removeVariableFxConfigs(roomId: string, configIds: number[]): void
    {
        // Both stores, unconditionally: the remove message carries ids and nothing else, so which
        // half a config lived in is not knowable here. Removing from the wrong one is a no-op.
        const avatars = this.getAvatarLogicRoomData(roomId);
        const furniture = this.getFurnitureLogicRoomData(roomId);

        for(const configId of configIds)
        {
            avatars.variableFxLogicManager?.removeConfig(configId);
            furniture.variableFxLogicManager?.removeConfig(configId);
        }
    }

    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/room/RoomObjectFactory.as::disposeRoomLogicData()
    disposeRoomLogicData(roomId: string): void
    {
        this._avatarLogicRoomData.remove(roomId)?.dispose();
        this._furnitureLogicRoomData.remove(roomId)?.dispose();
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
