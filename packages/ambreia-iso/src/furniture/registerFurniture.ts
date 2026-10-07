import {RoomObjectLogicEnum} from '../scene/object/RoomObjectLogicEnum';
import {RoomObjectVisualizationEnum} from '../scene/object/RoomObjectVisualizationEnum';
import {FurnitureAchievementResolutionLogic} from './logic/FurnitureAchievementResolutionLogic';
import {FurnitureAreaHideLogic} from './logic/FurnitureAreaHideLogic';
import {FurnitureBadgeDisplayLogic} from './logic/FurnitureBadgeDisplayLogic';
import {FurnitureChangeStateWhenStepOnLogic} from './logic/FurnitureChangeStateWhenStepOnLogic';
import {FurnitureClothingChangeLogic} from './logic/FurnitureClothingChangeLogic';
import {FurnitureCounterClockLogic} from './logic/FurnitureCounterClockLogic';
import {FurnitureCrackableLogic} from './logic/FurnitureCrackableLogic';
import {FurnitureCraftingGizmoLogic} from './logic/FurnitureCraftingGizmoLogic';
import {FurnitureCreditLogic} from './logic/FurnitureCreditLogic';
import {FurnitureCuckooClockLogic} from './logic/FurnitureCuckooClockLogic';
import {FurnitureCustomStackHeightLogic} from './logic/FurnitureCustomStackHeightLogic';
import {FurnitureDiceLogic} from './logic/FurnitureDiceLogic';
import {FurnitureEcotronBoxLogic} from './logic/FurnitureEcotronBoxLogic';
import {FurnitureEditableInternalLinkLogic} from './logic/FurnitureEditableInternalLinkLogic';
import {FurnitureEditableRoomLinkLogic} from './logic/FurnitureEditableRoomLinkLogic';
import {FurnitureEffectBoxLogic} from './logic/FurnitureEffectBoxLogic';
import {FurnitureExternalImageLogic} from './logic/FurnitureExternalImageLogic';
import {FurnitureFireworksLogic} from './logic/FurnitureFireworksLogic';
import {FurnitureFloorHoleLogic} from './logic/FurnitureFloorHoleLogic';
import {FurnitureGroupForumTerminalLogic} from './logic/FurnitureGroupForumTerminalLogic';
import {FurnitureGuildCustomizedLogic} from './logic/FurnitureGuildCustomizedLogic';
import {FurnitureHabboWheelLogic} from './logic/FurnitureHabboWheelLogic';
import {FurnitureHighScoreLogic} from './logic/FurnitureHighScoreLogic';
import {FurnitureHockeyScoreLogic} from './logic/FurnitureHockeyScoreLogic';
import {FurnitureHweenLovelockLogic} from './logic/FurnitureHweenLovelockLogic';
import {FurnitureIceStormLogic} from './logic/FurnitureIceStormLogic';
import {FurnitureInternalLinkLogic} from './logic/FurnitureInternalLinkLogic';
import {FurnitureLogic} from './logic/FurnitureLogic';
import {FurnitureLovelockLogic} from './logic/FurnitureLovelockLogic';
import {FurnitureMannequinLogic} from './logic/FurnitureMannequinLogic';
import {FurnitureMultiHeightLogic} from './logic/FurnitureMultiHeightLogic';
import {FurnitureMultiStateLogic} from './logic/FurnitureMultiStateLogic';
import {FurnitureOneWayDoorLogic} from './logic/FurnitureOneWayDoorLogic';
import {FurniturePetProductLogic} from './logic/FurniturePetProductLogic';
import {FurniturePlaceholderLogic} from './logic/FurniturePlaceholderLogic';
import {FurniturePlanetSystemLogic} from './logic/FurniturePlanetSystemLogic';
import {FurniturePresentLogic} from './logic/FurniturePresentLogic';
import {FurniturePurchasableClothingLogic} from './logic/FurniturePurchasableClothingLogic';
import {FurniturePushableLogic} from './logic/FurniturePushableLogic';
import {FurnitureRandomStateLogic} from './logic/FurnitureRandomStateLogic';
import {FurnitureRandomTeleportLogic} from './logic/FurnitureRandomTeleportLogic';
import {FurnitureRentableSpaceLogic} from './logic/FurnitureRentableSpaceLogic';
import {FurnitureRoomBackgroundColorLogic} from './logic/FurnitureRoomBackgroundColorLogic';
import {FurnitureRoomBackgroundLogic} from './logic/FurnitureRoomBackgroundLogic';
import {FurnitureRoomBillboardLogic} from './logic/FurnitureRoomBillboardLogic';
import {FurnitureRoomDimmerLogic} from './logic/FurnitureRoomDimmerLogic';
import {FurnitureScoreLogic} from './logic/FurnitureScoreLogic';
import {FurnitureSoundBlockLogic} from './logic/FurnitureSoundBlockLogic';
import {FurnitureStickieLogic} from './logic/FurnitureStickieLogic';
import {FurnitureTrophyLogic} from './logic/FurnitureTrophyLogic';
import {FurnitureVimeoLogic} from './logic/FurnitureVimeoLogic';
import {FurnitureVoteCounterLogic} from './logic/FurnitureVoteCounterLogic';
import {FurnitureVoteMajorityLogic} from './logic/FurnitureVoteMajorityLogic';
import {FurnitureWelcomeGiftLogic} from './logic/FurnitureWelcomeGiftLogic';
import {FurnitureWildwestWantedLogic} from './logic/FurnitureWildwestWantedLogic';
import {FurnitureWindowLogic} from './logic/FurnitureWindowLogic';
import {FurnitureYoutubeLogic} from './logic/FurnitureYoutubeLogic';
import {AnimatedFurnitureVisualization} from './visualization/AnimatedFurnitureVisualization';
import {AnimatedFurnitureVisualizationData} from './visualization/AnimatedFurnitureVisualizationData';
import {AvatarFurnitureVisualizationData} from './visualization/AvatarFurnitureVisualizationData';
import {FurnitureBadgeDisplayVisualization} from './visualization/FurnitureBadgeDisplayVisualization';
import {FurnitureBottleVisualization} from './visualization/FurnitureBottleVisualization';
import {FurnitureCounterClockVisualization} from './visualization/FurnitureCounterClockVisualization';
import {FurnitureCuboidVisualization} from './visualization/FurnitureCuboidVisualization';
import {FurnitureExternalImageVisualization} from './visualization/FurnitureExternalImageVisualization';
import {FurnitureFireworksVisualization} from './visualization/FurnitureFireworksVisualization';
import {FurnitureGiftWrappedFireworksVisualization} from './visualization/FurnitureGiftWrappedFireworksVisualization';
import {FurnitureGiftWrappedVisualization} from './visualization/FurnitureGiftWrappedVisualization';
import {FurnitureGuildCustomizedVisualization} from './visualization/FurnitureGuildCustomizedVisualization';
import {FurnitureGuildIsometricBadgeVisualization} from './visualization/FurnitureGuildIsometricBadgeVisualization';
import {FurnitureHabboWheelVisualization} from './visualization/FurnitureHabboWheelVisualization';
import {FurnitureMannequinVisualization} from './visualization/FurnitureMannequinVisualization';
import {FurniturePartyBeamerVisualization} from './visualization/FurniturePartyBeamerVisualization';
import {FurniturePlanetSystemVisualization} from './visualization/FurniturePlanetSystemVisualization';
import {FurniturePosterVisualization} from './visualization/FurniturePosterVisualization';
import {FurnitureQueueTileVisualization} from './visualization/FurnitureQueueTileVisualization';
import {FurnitureResettingAnimatedVisualization} from './visualization/FurnitureResettingAnimatedVisualization';
import {FurnitureRoomBackgroundVisualization} from './visualization/FurnitureRoomBackgroundVisualization';
import {FurnitureRoomBillboardVisualization} from './visualization/FurnitureRoomBillboardVisualization';
import {FurnitureScoreBoardVisualization} from './visualization/FurnitureScoreBoardVisualization';
import {FurnitureSoundblockVisualization} from './visualization/FurnitureSoundblockVisualization';
import {FurnitureStickieVisualization} from './visualization/FurnitureStickieVisualization';
import {FurnitureValRandomizerVisualization} from './visualization/FurnitureValRandomizerVisualization';
import {FurnitureVisualization} from './visualization/FurnitureVisualization';
import {FurnitureVoteCounterVisualization} from './visualization/FurnitureVoteCounterVisualization';
import {FurnitureVoteMajorityVisualization} from './visualization/FurnitureVoteMajorityVisualization';
import {FurnitureWaterAreaVisualization} from './visualization/FurnitureWaterAreaVisualization';
import {FurnitureYoutubeVisualization} from './visualization/FurnitureYoutubeVisualization';
import type {IIsoRegistries} from '../object/IIsoRegistries';

/**
 * Furniture: every furniture_* logic and visualization, including the fireworks (drawn without
 * their particles unless registerEffects() runs too) and the mannequin.
 */
export function registerFurniture(registries: IIsoRegistries): void
{
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_BASIC, () => new FurnitureLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_MULTISTATE, () => new FurnitureMultiStateLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_MULTIHEIGHT, () => new FurnitureMultiHeightLogic());
    registries.logics.register(RoomObjectLogicEnum.FURNITURE_PLACEHOLDER, () => new FurniturePlaceholderLogic());
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
    registries.visualizations.registerData(RoomObjectVisualizationEnum.FURNITURE_MANNEQUIN, () => new AvatarFurnitureVisualizationData());
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
}
