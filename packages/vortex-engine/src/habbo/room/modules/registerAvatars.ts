import {RoomObjectLogicEnum} from '@habbo/room/object/RoomObjectLogicEnum';
import {RoomObjectVisualizationEnum} from '@habbo/room/object/RoomObjectVisualizationEnum';
import {AvatarLogic} from '@habbo/room/object/logic/AvatarLogic';
import {PetLogic} from '@habbo/room/object/logic/PetLogic';
import {AvatarVisualization} from '@habbo/room/object/visualization/avatar/AvatarVisualization';
import {AvatarVisualizationData} from '@habbo/room/object/visualization/avatar/AvatarVisualizationData';
import {AnimatedPetVisualization} from '@habbo/room/object/visualization/pet/AnimatedPetVisualization';
import {AnimatedPetVisualizationData} from '@habbo/room/object/visualization/pet/AnimatedPetVisualizationData';
import type {IIsoRegistries} from '@room/object/IIsoRegistries';

/**
 * Avatars, bots and pets in a room: their logics, visualizations and data (the avatar renderer
 * itself is @ambreia/avatar). Bubbles, hearts and the other additions are registerEffects().
 */
export function registerAvatars(registries: IIsoRegistries): void
{
    registries.logics.register(RoomObjectLogicEnum.USER, () => new AvatarLogic());
    registries.logics.register(RoomObjectLogicEnum.BOT, () => new AvatarLogic());
    registries.logics.register(RoomObjectLogicEnum.RENTABLE_BOT, () => new AvatarLogic());
    registries.logics.register(RoomObjectLogicEnum.PET, () => new PetLogic());
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
    // AS3: `case "pet_animated": _loc8_ = AnimatedPetVisualizationData; break;` - a pet gets its own
    // data class, separate from the user/bot/rentable_bot one (this port once folded the two,
    // handing every pet an AvatarVisualizationData).
    registries.visualizations.registerData(RoomObjectVisualizationEnum.PET_ANIMATED, () => new AnimatedPetVisualizationData());
    registries.visualizations.registerData('user', () => new AvatarVisualizationData());
    registries.visualizations.registerData('bot', () => new AvatarVisualizationData());
    registries.visualizations.registerData('rentable_bot', () => new AvatarVisualizationData());
}
