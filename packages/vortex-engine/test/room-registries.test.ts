import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {RoomObjectLogicRegistry} from '@ambreia/iso/object/RoomObjectLogicRegistry';
import type {RoomObjectVisualizationRegistry} from '@ambreia/iso/object/RoomObjectVisualizationRegistry';
import {RoomObjectFactory} from '@ambreia/iso/scene/RoomObjectFactory';
import {RoomObjectVisualizationFactory} from '@ambreia/iso/scene/object/RoomObjectVisualizationFactory';
import {createRoomRegistries} from '@ambreia/iso/object/createRoomRegistries';
import {DEFAULT_ROOM_MODULES} from '@ambreia/iso/defaultRoomModules';
import {registerScene} from '@ambreia/iso/scene/registerScene';
import {registerFurniture} from '@ambreia/iso/furniture/registerFurniture';
import {registerAvatars} from '@ambreia/iso/avatar/registerAvatars';
import {registerEffects} from '@ambreia/iso/effects/registerEffects';
import {AvatarVisualization} from '@ambreia/iso/avatar/visualization/AvatarVisualization';
import {FurnitureFireworksVisualization} from '@ambreia/iso/furniture/visualization/FurnitureFireworksVisualization';

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
    return createRoomRegistries(DEFAULT_ROOM_MODULES);
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

test('the default modules are the scene, furniture, avatars and effects, in that order', () =>
{
    assert.deepEqual(DEFAULT_ROOM_MODULES, [registerScene, registerFurniture, registerAvatars, registerEffects]);
});

test('without the effects module, avatars get no additions and fireworks no particles', () =>
{
    AvatarVisualization.additions = null;
    FurnitureFireworksVisualization.particleSystems = null;

    const r = createRoomRegistries([registerScene, registerFurniture, registerAvatars]);

    assert.equal(AvatarVisualization.additions, null);
    assert.equal(FurnitureFireworksVisualization.particleSystems, null);
    // The fireworks are still furniture: drawn, wrapped, animated.
    assert.equal(r.visualizations.create('furniture_fireworks')?.constructor.name, 'FurnitureFireworksVisualization');
    assert.equal(r.visualizations.create('user')?.constructor.name, 'AvatarVisualization');
});

test('the effects module gives avatars their additions and fireworks their particles', () =>
{
    createRoomRegistries([registerEffects]);

    assert.equal(AvatarVisualization.additions?.constructor.name, 'AvatarAdditionFactory');
    assert.equal(typeof FurnitureFireworksVisualization.particleSystems, 'function');
});

test('a logic or visualization type registered twice is an error naming it, unless override is asked for', () =>
{
    const {logics, visualizations} = createRoomRegistries(DEFAULT_ROOM_MODULES);

    assert.throws(() => logics.register('furniture_basic', () => ({}) as never), /Room object logic "furniture_basic" is already registered/);
    assert.throws(() => visualizations.register('furniture_static', () => ({}) as never), /Room object visualization "furniture_static" is already registered/);
    visualizations.registerData('probe_data', () => ({}) as never);
    assert.throws(() => visualizations.registerData('probe_data', () => ({}) as never), /visualization data "probe_data" is already registered/);

    const replaced = {} as never;

    logics.register('furniture_basic', () => replaced, {override: true});
    assert.equal(logics.create('furniture_basic'), replaced);
});
