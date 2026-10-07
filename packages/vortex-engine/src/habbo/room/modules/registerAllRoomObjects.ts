import {RoomObjectLogicEnum} from '@habbo/room/object/RoomObjectLogicEnum';
import {RoomObjectVisualizationEnum} from '@habbo/room/object/RoomObjectVisualizationEnum';
import {AvatarLogic} from '@habbo/room/object/logic/AvatarLogic';
import {PetLogic} from '@habbo/room/object/logic/PetLogic';
import {FurnitureAchievementResolutionLogic} from '@habbo/room/object/logic/furniture/FurnitureAchievementResolutionLogic';
import {FurnitureAreaHideLogic} from '@habbo/room/object/logic/furniture/FurnitureAreaHideLogic';
import {FurnitureBadgeDisplayLogic} from '@habbo/room/object/logic/furniture/FurnitureBadgeDisplayLogic';
import {FurnitureChangeStateWhenStepOnLogic} from '@habbo/room/object/logic/furniture/FurnitureChangeStateWhenStepOnLogic';
import {FurnitureClothingChangeLogic} from '@habbo/room/object/logic/furniture/FurnitureClothingChangeLogic';
import {FurnitureCounterClockLogic} from '@habbo/room/object/logic/furniture/FurnitureCounterClockLogic';
import {FurnitureCrackableLogic} from '@habbo/room/object/logic/furniture/FurnitureCrackableLogic';
import {FurnitureCraftingGizmoLogic} from '@habbo/room/object/logic/furniture/FurnitureCraftingGizmoLogic';
import {FurnitureCreditLogic} from '@habbo/room/object/logic/furniture/FurnitureCreditLogic';
import {FurnitureCuckooClockLogic} from '@habbo/room/object/logic/furniture/FurnitureCuckooClockLogic';
import {FurnitureCustomStackHeightLogic} from '@habbo/room/object/logic/furniture/FurnitureCustomStackHeightLogic';
import {FurnitureDiceLogic} from '@habbo/room/object/logic/furniture/FurnitureDiceLogic';
import {FurnitureEcotronBoxLogic} from '@habbo/room/object/logic/furniture/FurnitureEcotronBoxLogic';
import {FurnitureEditableInternalLinkLogic} from '@habbo/room/object/logic/furniture/FurnitureEditableInternalLinkLogic';
import {FurnitureEditableRoomLinkLogic} from '@habbo/room/object/logic/furniture/FurnitureEditableRoomLinkLogic';
import {FurnitureEffectBoxLogic} from '@habbo/room/object/logic/furniture/FurnitureEffectBoxLogic';
import {FurnitureExternalImageLogic} from '@habbo/room/object/logic/furniture/FurnitureExternalImageLogic';
import {FurnitureFireworksLogic} from '@habbo/room/object/logic/furniture/FurnitureFireworksLogic';
import {FurnitureFloorHoleLogic} from '@habbo/room/object/logic/furniture/FurnitureFloorHoleLogic';
import {FurnitureGroupForumTerminalLogic} from '@habbo/room/object/logic/furniture/FurnitureGroupForumTerminalLogic';
import {FurnitureGuildCustomizedLogic} from '@habbo/room/object/logic/furniture/FurnitureGuildCustomizedLogic';
import {FurnitureHabboWheelLogic} from '@habbo/room/object/logic/furniture/FurnitureHabboWheelLogic';
import {FurnitureHighScoreLogic} from '@habbo/room/object/logic/furniture/FurnitureHighScoreLogic';
import {FurnitureHockeyScoreLogic} from '@habbo/room/object/logic/furniture/FurnitureHockeyScoreLogic';
import {FurnitureHweenLovelockLogic} from '@habbo/room/object/logic/furniture/FurnitureHweenLovelockLogic';
import {FurnitureIceStormLogic} from '@habbo/room/object/logic/furniture/FurnitureIceStormLogic';
import {FurnitureInternalLinkLogic} from '@habbo/room/object/logic/furniture/FurnitureInternalLinkLogic';
import {FurnitureLogic} from '@habbo/room/object/logic/furniture/FurnitureLogic';
import {FurnitureLovelockLogic} from '@habbo/room/object/logic/furniture/FurnitureLovelockLogic';
import {FurnitureMannequinLogic} from '@habbo/room/object/logic/furniture/FurnitureMannequinLogic';
import {FurnitureMultiHeightLogic} from '@habbo/room/object/logic/furniture/FurnitureMultiHeightLogic';
import {FurnitureMultiStateLogic} from '@habbo/room/object/logic/furniture/FurnitureMultiStateLogic';
import {FurnitureOneWayDoorLogic} from '@habbo/room/object/logic/furniture/FurnitureOneWayDoorLogic';
import {FurniturePetProductLogic} from '@habbo/room/object/logic/furniture/FurniturePetProductLogic';
import {FurniturePlaceholderLogic} from '@habbo/room/object/logic/furniture/FurniturePlaceholderLogic';
import {FurniturePlanetSystemLogic} from '@habbo/room/object/logic/furniture/FurniturePlanetSystemLogic';
import {FurniturePresentLogic} from '@habbo/room/object/logic/furniture/FurniturePresentLogic';
import {FurniturePurchasableClothingLogic} from '@habbo/room/object/logic/furniture/FurniturePurchasableClothingLogic';
import {FurniturePushableLogic} from '@habbo/room/object/logic/furniture/FurniturePushableLogic';
import {FurnitureRandomStateLogic} from '@habbo/room/object/logic/furniture/FurnitureRandomStateLogic';
import {FurnitureRandomTeleportLogic} from '@habbo/room/object/logic/furniture/FurnitureRandomTeleportLogic';
import {FurnitureRentableSpaceLogic} from '@habbo/room/object/logic/furniture/FurnitureRentableSpaceLogic';
import {FurnitureRoomBackgroundColorLogic} from '@habbo/room/object/logic/furniture/FurnitureRoomBackgroundColorLogic';
import {FurnitureRoomBackgroundLogic} from '@habbo/room/object/logic/furniture/FurnitureRoomBackgroundLogic';
import {FurnitureRoomBillboardLogic} from '@habbo/room/object/logic/furniture/FurnitureRoomBillboardLogic';
import {FurnitureRoomDimmerLogic} from '@habbo/room/object/logic/furniture/FurnitureRoomDimmerLogic';
import {FurnitureScoreLogic} from '@habbo/room/object/logic/furniture/FurnitureScoreLogic';
import {FurnitureSoundBlockLogic} from '@habbo/room/object/logic/furniture/FurnitureSoundBlockLogic';
import {FurnitureStickieLogic} from '@habbo/room/object/logic/furniture/FurnitureStickieLogic';
import {FurnitureTrophyLogic} from '@habbo/room/object/logic/furniture/FurnitureTrophyLogic';
import {FurnitureVimeoLogic} from '@habbo/room/object/logic/furniture/FurnitureVimeoLogic';
import {FurnitureVoteCounterLogic} from '@habbo/room/object/logic/furniture/FurnitureVoteCounterLogic';
import {FurnitureVoteMajorityLogic} from '@habbo/room/object/logic/furniture/FurnitureVoteMajorityLogic';
import {FurnitureWelcomeGiftLogic} from '@habbo/room/object/logic/furniture/FurnitureWelcomeGiftLogic';
import {FurnitureWildwestWantedLogic} from '@habbo/room/object/logic/furniture/FurnitureWildwestWantedLogic';
import {FurnitureWindowLogic} from '@habbo/room/object/logic/furniture/FurnitureWindowLogic';
import {FurnitureYoutubeLogic} from '@habbo/room/object/logic/furniture/FurnitureYoutubeLogic';
import {RoomLogic} from '@habbo/room/object/logic/room/RoomLogic';
import {RoomTileCursorLogic} from '@habbo/room/object/logic/room/RoomTileCursorLogic';
import {SelectionArrowLogic} from '@habbo/room/object/logic/room/SelectionArrowLogic';
import {AvatarVisualization} from '@habbo/room/object/visualization/avatar/AvatarVisualization';
import {AvatarVisualizationData} from '@habbo/room/object/visualization/avatar/AvatarVisualizationData';
import {AnimatedFurnitureVisualization} from '@habbo/room/object/visualization/furniture/AnimatedFurnitureVisualization';
import {AnimatedFurnitureVisualizationData} from '@habbo/room/object/visualization/furniture/AnimatedFurnitureVisualizationData';
import {AvatarFurnitureVisualizationData} from '@habbo/room/object/visualization/furniture/AvatarFurnitureVisualizationData';
import {FurnitureBadgeDisplayVisualization} from '@habbo/room/object/visualization/furniture/FurnitureBadgeDisplayVisualization';
import {FurnitureBottleVisualization} from '@habbo/room/object/visualization/furniture/FurnitureBottleVisualization';
import {FurnitureCounterClockVisualization} from '@habbo/room/object/visualization/furniture/FurnitureCounterClockVisualization';
import {FurnitureCuboidVisualization} from '@habbo/room/object/visualization/furniture/FurnitureCuboidVisualization';
import {FurnitureExternalImageVisualization} from '@habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization';
import {FurnitureFireworksVisualization} from '@habbo/room/object/visualization/furniture/FurnitureFireworksVisualization';
import {FurnitureGiftWrappedFireworksVisualization} from '@habbo/room/object/visualization/furniture/FurnitureGiftWrappedFireworksVisualization';
import {FurnitureGiftWrappedVisualization} from '@habbo/room/object/visualization/furniture/FurnitureGiftWrappedVisualization';
import {FurnitureGuildCustomizedVisualization} from '@habbo/room/object/visualization/furniture/FurnitureGuildCustomizedVisualization';
import {FurnitureGuildIsometricBadgeVisualization} from '@habbo/room/object/visualization/furniture/FurnitureGuildIsometricBadgeVisualization';
import {FurnitureHabboWheelVisualization} from '@habbo/room/object/visualization/furniture/FurnitureHabboWheelVisualization';
import {FurnitureMannequinVisualization} from '@habbo/room/object/visualization/furniture/FurnitureMannequinVisualization';
import {FurniturePartyBeamerVisualization} from '@habbo/room/object/visualization/furniture/FurniturePartyBeamerVisualization';
import {FurniturePlanetSystemVisualization} from '@habbo/room/object/visualization/furniture/FurniturePlanetSystemVisualization';
import {FurniturePosterVisualization} from '@habbo/room/object/visualization/furniture/FurniturePosterVisualization';
import {FurnitureQueueTileVisualization} from '@habbo/room/object/visualization/furniture/FurnitureQueueTileVisualization';
import {FurnitureResettingAnimatedVisualization} from '@habbo/room/object/visualization/furniture/FurnitureResettingAnimatedVisualization';
import {FurnitureRoomBackgroundVisualization} from '@habbo/room/object/visualization/furniture/FurnitureRoomBackgroundVisualization';
import {FurnitureRoomBillboardVisualization} from '@habbo/room/object/visualization/furniture/FurnitureRoomBillboardVisualization';
import {FurnitureScoreBoardVisualization} from '@habbo/room/object/visualization/furniture/FurnitureScoreBoardVisualization';
import {FurnitureSoundblockVisualization} from '@habbo/room/object/visualization/furniture/FurnitureSoundblockVisualization';
import {FurnitureStickieVisualization} from '@habbo/room/object/visualization/furniture/FurnitureStickieVisualization';
import {FurnitureValRandomizerVisualization} from '@habbo/room/object/visualization/furniture/FurnitureValRandomizerVisualization';
import {FurnitureVisualization} from '@habbo/room/object/visualization/furniture/FurnitureVisualization';
import {FurnitureVisualizationData} from '@habbo/room/object/visualization/furniture/FurnitureVisualizationData';
import {FurnitureVoteCounterVisualization} from '@habbo/room/object/visualization/furniture/FurnitureVoteCounterVisualization';
import {FurnitureVoteMajorityVisualization} from '@habbo/room/object/visualization/furniture/FurnitureVoteMajorityVisualization';
import {FurnitureWaterAreaVisualization} from '@habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization';
import {FurnitureYoutubeVisualization} from '@habbo/room/object/visualization/furniture/FurnitureYoutubeVisualization';
import {AnimatedPetVisualization} from '@habbo/room/object/visualization/pet/AnimatedPetVisualization';
import {AnimatedPetVisualizationData} from '@habbo/room/object/visualization/pet/AnimatedPetVisualizationData';
import {RoomVisualization} from '@habbo/room/object/visualization/room/RoomVisualization';
import {TileCursorVisualization} from '@habbo/room/object/visualization/room/TileCursorVisualization';
import type {IIsoRegistries} from '@room/object/IIsoRegistries';

/**
 * Every room object type the engine builds, registered at once: the two switches of
 * RoomObjectFactory and RoomObjectVisualizationFactory as they stood before J4, comments included.
 * J4 Task 4 splits this into the scene, furniture, avatar and effect modules.
 */
export function registerAllRoomObjects(registries: IIsoRegistries): void
{
    // Logics (AS3: RoomObjectFactory.createRoomObjectLogic()).
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_BASIC, () => new FurnitureLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_MULTISTATE, () => new FurnitureMultiStateLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_MULTIHEIGHT, () => new FurnitureMultiHeightLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_PLACEHOLDER, () => new FurniturePlaceholderLogic());
    registries.logics.register(RoomObjectLogicEnum.USER, () => new AvatarLogic());
    registries.logics.register(RoomObjectLogicEnum.BOT, () => new AvatarLogic());
    registries.logics.register(RoomObjectLogicEnum.RENTABLE_BOT, () => new AvatarLogic());
    registries.logics.register(RoomObjectLogicEnum.PET, () => new PetLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_RANDOMSTATE, () => new FurnitureRandomStateLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_CREDIT, () => new FurnitureCreditLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_STICKIE, () => new FurnitureStickieLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_EXTERNAL_IMAGE_WALLITEM, () => new FurnitureExternalImageLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_PRESENT, () => new FurniturePresentLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_TROPHY, () => new FurnitureTrophyLogic());
    // DEVIATION: AS3 builds FurnitureFurniChestLogic / FurnitureCoinsChestLogic here. The RPG
    //   fork removed the wired chests, but furnidata can still name these two types, so they
    //   get the chests' own base, FurnitureLogic: a plain furni rather than one with no
    //   logic at all (which is what an unknown type gets — see the note above).
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_FURNI_CHEST, () => new FurnitureLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_COINS_CHEST, () => new FurnitureLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_ECOTRON_BOX, () => new FurnitureEcotronBoxLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_DICE, () => new FurnitureDiceLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_HOCKEY_SCORE, () => new FurnitureHockeyScoreLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_HABBOWHEEL, () => new FurnitureHabboWheelLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_ONE_WAY_DOOR, () => new FurnitureOneWayDoorLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_PLANET_SYSTEM, () => new FurniturePlanetSystemLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_WINDOW, () => new FurnitureWindowLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_ROOMDIMMER, () => new FurnitureRoomDimmerLogic());
    registries.logics.register(RoomObjectLogicEnum.ROOM_TILE_CURSOR, () => new RoomTileCursorLogic());
    registries.logics.register(RoomObjectLogicEnum.SELECTION_ARROW, () => new SelectionArrowLogic());
    // DEVIATION: AS3 builds the sound-machine / jukebox furniture logics here. The RPG
    //   fork removed jukebox music, but furnidata can still name these two types, so they get
    //   those logics' own base, FurnitureMultiStateLogic: a furni that still toggles its state.
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_SOUND_MACHINE, () => new FurnitureMultiStateLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_JUKEBOX, () => new FurnitureMultiStateLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_CRACKABLE, () => new FurnitureCrackableLogic());
    // DEVIATION: AS3 builds the song-disk furniture logic here; the RPG fork removed jukebox music,
    //   so a song disk is a plain furni (its logic's own base).
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_SONG_DISK, () => new FurnitureLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_PUSHABLE, () => new FurniturePushableLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_CLOTHING_CHANGE, () => new FurnitureClothingChangeLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_COUNTER_CLOCK, () => new FurnitureCounterClockLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_SCORE, () => new FurnitureScoreLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_ES, () => new FurnitureIceStormLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_FIREWORKS, () => new FurnitureFireworksLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_BB, () => new FurnitureRoomBillboardLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_BG, () => new FurnitureRoomBackgroundLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_WELCOME_GIFT, () => new FurnitureWelcomeGiftLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_FLOOR_HOLE, () => new FurnitureFloorHoleLogic());
    registries.logics.register(RoomObjectLogicEnum.ROOM, () => new RoomLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_MANNEQUIN, () => new FurnitureMannequinLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_GUILD_CUSTOMIZED, () => new FurnitureGuildCustomizedLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_GROUP_FORUM_TERMINAL, () => new FurnitureGroupForumTerminalLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_PET_CUSTOMIZATION, () => new FurniturePetProductLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_CUCKOO_CLOCK, () => new FurnitureCuckooClockLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_VOTE_COUNTER, () => new FurnitureVoteCounterLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_VOTE_MAJORITY, () => new FurnitureVoteMajorityLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_SOUNDBLOCK, () => new FurnitureSoundBlockLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_RANDOM_TELEPORT, () => new FurnitureRandomTeleportLogic());
    // DEVIATION: AS3 builds the monsterplant seed logic here. The RPG fork removed
    //   monsterplants, but furnidata can still name this type, so it gets that logic's own
    //   base, FurnitureMultiStateLogic: a furni that still toggles its state.
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_MONSTERPLANT_SEED, () => new FurnitureMultiStateLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_PURCHASABLE_CLOTHING, () => new FurniturePurchasableClothingLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_BACKGROUND_COLOR, () => new FurnitureRoomBackgroundColorLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_AREA_HIDE, () => new FurnitureAreaHideLogic());
    // DEVIATION: AS3 builds FurnitureMysterboxLogic / FurnitureMysteryTrophyLogic here. The RPG
    //   fork removed mystery boxes, but furnidata still names these two types, so they get those
    //   logics' real parent, FurnitureMultiStateLogic: a furni that still toggles its state, can
    //   be moved and picked up.
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_MYSTERYBOX, () => new FurnitureMultiStateLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_MYSTERYTROPHY, () => new FurnitureMultiStateLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_EFFECTBOX, () => new FurnitureEffectBoxLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_ACHIEVEMENT_RESOLUTION, () => new FurnitureAchievementResolutionLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_LOVELOCK_ENGRAVING, () => new FurnitureLovelockLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_WILD_WEST_WANTED_ENGRAVING, () => new FurnitureWildwestWantedLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_HABBOWEEN_ENGRAVING, () => new FurnitureHweenLovelockLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_BADGE_DISPLAY, () => new FurnitureBadgeDisplayLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_HIGH_SCORE, () => new FurnitureHighScoreLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_INTERNAL_LINK, () => new FurnitureInternalLinkLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_EDITABLE_INTERNAL_LINK, () => new FurnitureEditableInternalLinkLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_EDITABLE_ROOM_LINK, () => new FurnitureEditableRoomLinkLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_CUSTOM_STACK_HEIGHT, () => new FurnitureCustomStackHeightLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_YOUTUBE, () => new FurnitureYoutubeLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_RENTABLE_SPACE, () => new FurnitureRentableSpaceLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_CHANGE_STATE_WHEN_STEP_ON, () => new FurnitureChangeStateWhenStepOnLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_VIMEO, () => new FurnitureVimeoLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_CRAFTING_GIZMO, () => new FurnitureCraftingGizmoLogic());
    // DEVIATION: AS3 builds FurnitureNftCreditLogic / FurnitureNftRewardBoxLogic here. The RPG
    //   fork removed collectibles and NFT, but furnidata can still name these two types, so
    //   they get the NFT logics' own base, FurnitureLogic: a plain furni, like the chests above.
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_NFT_CREDIT, () => new FurnitureLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_NFT_REWARD_BOX, () => new FurnitureLogic());

    // Visualizations (AS3: RoomObjectVisualizationFactory.createRoomObjectVisualization()).
    // Room
    registries.visualizations.register(RoomObjectVisualizationEnum.ROOM, () => new RoomVisualization());
    // Tile cursor
    registries.visualizations.register(RoomObjectVisualizationEnum.TILE_CURSOR, () => new TileCursorVisualization());
    // Furniture - static
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_STATIC, () => new FurnitureVisualization());
    // Furniture - animated
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_ANIMATED, () => new AnimatedFurnitureVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_RESETTING_ANIMATED, () => new FurnitureResettingAnimatedVisualization());
    // Furniture - specialized
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_POSTER, () => new FurniturePosterVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_STICKIE, () => new FurnitureStickieVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_BOTTLE, () => new FurnitureBottleVisualization());
    // DEVIATION: AS3 builds FurnitureFurniChestVisualization / FurnitureCoinsChestVisualization
    //   here. The RPG fork removed the wired chests, but furnidata can still name these two
    //   types, so they draw through the chests' own base class: an animated furni with no
    //   floating item icons and no contents plaque.
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_FURNI_CHEST, () => new AnimatedFurnitureVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_COINS_CHEST, () => new AnimatedFurnitureVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_HABBOWHEEL, () => new FurnitureHabboWheelVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_VAL_RANDOMIZER, () => new FurnitureValRandomizerVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_QUEUE_TILE, () => new FurnitureQueueTileVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_PARTY_BEAMER, () => new FurniturePartyBeamerVisualization());
    // The class was ported and the enum entry was there; only this line
    // was missing, so every `furniture_cuboid` fell through to the
    // default and drew as a plain static furni.
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_CUBOID, () => new FurnitureCuboidVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_GIFT_WRAPPED, () => new FurnitureGiftWrappedVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_COUNTER_CLOCK, () => new FurnitureCounterClockVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_SCORE_BOARD, () => new FurnitureScoreBoardVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_FIREWORKS, () => new FurnitureFireworksVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_GIFT_WRAPPED_FIREWORKS, () => new FurnitureGiftWrappedFireworksVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_SOUNDBLOCK, () => new FurnitureSoundblockVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_VOTE_COUNTER, () => new FurnitureVoteCounterVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_VOTE_MAJORITY, () => new FurnitureVoteMajorityVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_BADGE_DISPLAY, () => new FurnitureBadgeDisplayVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_GUILD_CUSTOMIZED, () => new FurnitureGuildCustomizedVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_GUILD_ISOMETRIC_BADGE, () => new FurnitureGuildIsometricBadgeVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_BB, () => new FurnitureRoomBillboardVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_BG, () => new FurnitureRoomBackgroundVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_EXTERNAL_IMAGE, () => new FurnitureExternalImageVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_YOUTUBE, () => new FurnitureYoutubeVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_MANNEQUIN, () => new FurnitureMannequinVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_WATER_AREA, () => new FurnitureWaterAreaVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.FURNITURE_PLANET_SYSTEM, () => new FurniturePlanetSystemVisualization());
    // Avatar types
    registries.visualizations.register(RoomObjectVisualizationEnum.USER, () => new AvatarVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.BOT, () => new AvatarVisualization());
    registries.visualizations.register(RoomObjectVisualizationEnum.RENTABLE_BOT, () => new AvatarVisualization());
    // Pets
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as
    // `case "pet_animated": _loc3_ = AnimatedPetVisualization; break;` - this case was
    // simply missing from the port, so every pet resolved to null here, which made
    // RoomEngine.getGenericRoomObjectImage() bail on its `visualization === null` guard
    // and return id = -1 for every pet image request.
    registries.visualizations.register(RoomObjectVisualizationEnum.PET_ANIMATED, () => new AnimatedPetVisualization());

    // Visualization data (AS3: RoomObjectVisualizationFactory.getRoomObjectVisualizationData()).
    registries.visualizations.setDefaultData(() => new FurnitureVisualizationData());
    // AS3: `case "pet_animated": _loc8_ = AnimatedPetVisualizationData; break;` - a pet gets its own
    // data class, separate from the user/bot/rentable_bot one (this port once folded the two,
    // handing every pet an AvatarVisualizationData).
    registries.visualizations.registerData(RoomObjectVisualizationEnum.PET_ANIMATED, () => new AnimatedPetVisualizationData());
    registries.visualizations.registerData(RoomObjectVisualizationEnum.FURNITURE_MANNEQUIN, () => new AvatarFurnitureVisualizationData());
    registries.visualizations.registerData('user', () => new AvatarVisualizationData());
    registries.visualizations.registerData('bot', () => new AvatarVisualizationData());
    registries.visualizations.registerData('rentable_bot', () => new AvatarVisualizationData());
    // The types AS3 gives AnimatedFurnitureVisualizationData; the chests among them matter: a plain
    // FurnitureVisualizationData cannot parse an animated visualization and the chest then threw
    // on every frame (getRoomObjectVisualizationData(), AS3 lines 232-283).
    registries.visualizations.registerData('furniture_animated', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_furnichest', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_coinschest', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_resetting_animated', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_poster', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_habbowheel', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_val_randomizer', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_bottle', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_planet_system', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_queue_tile', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_party_beamer', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_counter_clock', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_water_area', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_score_board', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_fireworks', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_gift_wrapped_fireworks', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_guild_customized', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_guild_isometric_badge', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_vote_counter', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_vote_majority', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_soundblock', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_badge_display', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_external_image', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('furniture_youtube', () => new AnimatedFurnitureVisualizationData());
    registries.visualizations.registerData('tile_cursor', () => new AnimatedFurnitureVisualizationData());
}
