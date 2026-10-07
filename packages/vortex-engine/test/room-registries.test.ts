import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RoomObjectLogicRegistry} from '@room/object/RoomObjectLogicRegistry';
import {RoomObjectVisualizationRegistry} from '@room/object/RoomObjectVisualizationRegistry';
import {RoomObjectFactory} from '@habbo/room/RoomObjectFactory';
import {RoomObjectVisualizationFactory} from '@habbo/room/object/RoomObjectVisualizationFactory';
import {registerAllRoomObjects} from '@habbo/room/modules/registerAllRoomObjects';

// Every type the two switches built before J4 (relevé 2026-10-07, by running them over every enum
// value), and the class each one gave: the registries must give exactly these.
const LOGICS: Record<string, string> = {
    'furniture_basic': 'FurnitureLogic',
    'furniture_multistate': 'FurnitureMultiStateLogic',
    'furniture_multiheight': 'FurnitureMultiHeightLogic',
    'furniture_randomstate': 'FurnitureRandomStateLogic',
    'furniture_placeholder': 'FurniturePlaceholderLogic',
    'furniture_credit': 'FurnitureCreditLogic',
    'furniture_stickie': 'FurnitureStickieLogic',
    'furniture_present': 'FurniturePresentLogic',
    'furniture_trophy': 'FurnitureTrophyLogic',
    'furniture_furnichest': 'FurnitureLogic',
    'furniture_coinschest': 'FurnitureLogic',
    'furniture_ecotron_box': 'FurnitureEcotronBoxLogic',
    'furniture_dice': 'FurnitureDiceLogic',
    'furniture_hockey_score': 'FurnitureHockeyScoreLogic',
    'furniture_habbowheel': 'FurnitureHabboWheelLogic',
    'furniture_one_way_door': 'FurnitureOneWayDoorLogic',
    'furniture_planet_system': 'FurniturePlanetSystemLogic',
    'furniture_window': 'FurnitureWindowLogic',
    'furniture_external_image_wallitem': 'FurnitureExternalImageLogic',
    'furniture_roomdimmer': 'FurnitureRoomDimmerLogic',
    'furniture_sound_machine': 'FurnitureMultiStateLogic',
    'furniture_jukebox': 'FurnitureMultiStateLogic',
    'furniture_crackable': 'FurnitureCrackableLogic',
    'furniture_pushable': 'FurniturePushableLogic',
    'furniture_clothing_change': 'FurnitureClothingChangeLogic',
    'furniture_counter_clock': 'FurnitureCounterClockLogic',
    'furniture_score': 'FurnitureScoreLogic',
    'furniture_es': 'FurnitureIceStormLogic',
    'furniture_fireworks': 'FurnitureFireworksLogic',
    'furniture_song_disk': 'FurnitureLogic',
    'furniture_bb': 'FurnitureRoomBillboardLogic',
    'furniture_bg': 'FurnitureRoomBackgroundLogic',
    'furniture_welcome_gift': 'FurnitureWelcomeGiftLogic',
    'furniture_floor_hole': 'FurnitureFloorHoleLogic',
    'furniture_mannequin': 'FurnitureMannequinLogic',
    'furniture_guild_customized': 'FurnitureGuildCustomizedLogic',
    'furniture_group_forum_terminal': 'FurnitureGroupForumTerminalLogic',
    'furniture_pet_customization': 'FurniturePetProductLogic',
    'furniture_cuckoo_clock': 'FurnitureCuckooClockLogic',
    'furniture_vote_counter': 'FurnitureVoteCounterLogic',
    'furniture_vote_majority': 'FurnitureVoteMajorityLogic',
    'furniture_soundblock': 'FurnitureSoundBlockLogic',
    'furniture_random_teleport': 'FurnitureRandomTeleportLogic',
    'furniture_monsterplant_seed': 'FurnitureMultiStateLogic',
    'furniture_purchasable_clothing': 'FurniturePurchasableClothingLogic',
    'furniture_background_color': 'FurnitureRoomBackgroundColorLogic',
    'furniture_area_hide': 'FurnitureAreaHideLogic',
    'furniture_mysterybox': 'FurnitureMultiStateLogic',
    'furniture_effectbox': 'FurnitureEffectBoxLogic',
    'furniture_mysterytrophy': 'FurnitureMultiStateLogic',
    'furniture_achievement_resolution': 'FurnitureAchievementResolutionLogic',
    'furniture_lovelock': 'FurnitureLovelockLogic',
    'furniture_wildwest_wanted': 'FurnitureWildwestWantedLogic',
    'furniture_hween_lovelock': 'FurnitureHweenLovelockLogic',
    'furniture_badge_display': 'FurnitureBadgeDisplayLogic',
    'furniture_high_score': 'FurnitureHighScoreLogic',
    'furniture_internal_link': 'FurnitureInternalLinkLogic',
    'furniture_custom_stack_height': 'FurnitureCustomStackHeightLogic',
    'furniture_youtube': 'FurnitureYoutubeLogic',
    'furniture_rentable_space': 'FurnitureRentableSpaceLogic',
    'furniture_change_state_when_step_on': 'FurnitureChangeStateWhenStepOnLogic',
    'furniture_vimeo': 'FurnitureVimeoLogic',
    'furniture_editable_internal_link': 'FurnitureEditableInternalLinkLogic',
    'furniture_editable_room_link': 'FurnitureEditableRoomLinkLogic',
    'furniture_crafting_gizmo': 'FurnitureCraftingGizmoLogic',
    'furniture_nft_credit': 'FurnitureLogic',
    'furniture_nft_reward_box': 'FurnitureLogic',
    'room': 'RoomLogic',
    'user': 'AvatarLogic',
    'bot': 'AvatarLogic',
    'rentable_bot': 'AvatarLogic',
    'pet': 'PetLogic',
    'tile_cursor': 'RoomTileCursorLogic',
    'selection_arrow': 'SelectionArrowLogic'
};

const VISUALIZATIONS: Record<string, string> = {
    'room': 'RoomVisualization',
    'tile_cursor': 'TileCursorVisualization',
    'user': 'AvatarVisualization',
    'bot': 'AvatarVisualization',
    'rentable_bot': 'AvatarVisualization',
    'pet_animated': 'AnimatedPetVisualization',
    'furniture_static': 'FurnitureVisualization',
    'furniture_animated': 'AnimatedFurnitureVisualization',
    'furniture_resetting_animated': 'FurnitureResettingAnimatedVisualization',
    'furniture_poster': 'FurniturePosterVisualization',
    'furniture_habbowheel': 'FurnitureHabboWheelVisualization',
    'furniture_val_randomizer': 'FurnitureValRandomizerVisualization',
    'furniture_bottle': 'FurnitureBottleVisualization',
    'furniture_furnichest': 'AnimatedFurnitureVisualization',
    'furniture_coinschest': 'AnimatedFurnitureVisualization',
    'furniture_planet_system': 'FurniturePlanetSystemVisualization',
    'furniture_queue_tile': 'FurnitureQueueTileVisualization',
    'furniture_party_beamer': 'FurniturePartyBeamerVisualization',
    'furniture_cuboid': 'FurnitureCuboidVisualization',
    'furniture_gift_wrapped': 'FurnitureGiftWrappedVisualization',
    'furniture_counter_clock': 'FurnitureCounterClockVisualization',
    'furniture_water_area': 'FurnitureWaterAreaVisualization',
    'furniture_score_board': 'FurnitureScoreBoardVisualization',
    'furniture_fireworks': 'FurnitureFireworksVisualization',
    'furniture_gift_wrapped_fireworks': 'FurnitureGiftWrappedFireworksVisualization',
    'furniture_bb': 'FurnitureRoomBillboardVisualization',
    'furniture_bg': 'FurnitureRoomBackgroundVisualization',
    'furniture_stickie': 'FurnitureStickieVisualization',
    'furniture_mannequin': 'FurnitureMannequinVisualization',
    'furniture_guild_customized': 'FurnitureGuildCustomizedVisualization',
    'furniture_guild_isometric_badge': 'FurnitureGuildIsometricBadgeVisualization',
    'furniture_vote_counter': 'FurnitureVoteCounterVisualization',
    'furniture_vote_majority': 'FurnitureVoteMajorityVisualization',
    'furniture_soundblock': 'FurnitureSoundblockVisualization',
    'furniture_badge_display': 'FurnitureBadgeDisplayVisualization',
    'furniture_youtube': 'FurnitureYoutubeVisualization',
    'furniture_external_image': 'FurnitureExternalImageVisualization'
};

function registries(): {logics: RoomObjectLogicRegistry; visualizations: RoomObjectVisualizationRegistry}
{
    const r = {logics: new RoomObjectLogicRegistry(), visualizations: new RoomObjectVisualizationRegistry()};

    registerAllRoomObjects(r);

    return r;
}

test('every logic type builds the class it built before', () =>
{
    const factory = new RoomObjectFactory(registries().logics);
    const built = Object.fromEntries(Object.keys(LOGICS).map(t => [t, factory.createRoomObjectLogic(t)?.constructor.name]));

    assert.deepEqual(built, LOGICS);
});

test('every visualization type builds the class it built before', () =>
{
    const factory = new RoomObjectVisualizationFactory(registries().visualizations);
    const built = Object.fromEntries(Object.keys(VISUALIZATIONS).map(t => [t, factory.createRoomObjectVisualization(t)?.constructor.name]));

    assert.deepEqual(built, VISUALIZATIONS);
});

test('the registries know these types and no other', () =>
{
    const r = registries();

    assert.deepEqual(r.logics.types(), Object.keys(LOGICS).sort());
    assert.deepEqual(r.visualizations.types(), Object.keys(VISUALIZATIONS).sort());
});

test('an unknown type builds nothing', () =>
{
    const r = registries();

    assert.equal(r.logics.create('nope'), null);
    assert.equal(r.visualizations.create('nope'), null);
});

test('each content gets the data class getRoomObjectVisualizationData() gave it', () =>
{
    const r = registries().visualizations;
    const dataOf = (type: string): string | undefined => r.createData(type)?.constructor.name;

    assert.equal(dataOf('furniture_static'), 'FurnitureVisualizationData');
    assert.equal(dataOf('furniture_animated'), 'AnimatedFurnitureVisualizationData');
    assert.equal(dataOf('furniture_furnichest'), 'AnimatedFurnitureVisualizationData');
    assert.equal(dataOf('tile_cursor'), 'AnimatedFurnitureVisualizationData');
    assert.equal(dataOf('pet_animated'), 'AnimatedPetVisualizationData');
    assert.equal(dataOf('furniture_mannequin'), 'AvatarFurnitureVisualizationData');
    assert.equal(dataOf('user'), 'AvatarVisualizationData');
    assert.equal(dataOf('rentable_bot'), 'AvatarVisualizationData');
});
