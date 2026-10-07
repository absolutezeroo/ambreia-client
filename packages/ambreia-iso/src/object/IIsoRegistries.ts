import type {RoomObjectLogicRegistry} from './RoomObjectLogicRegistry';
import type {RoomObjectVisualizationRegistry} from './RoomObjectVisualizationRegistry';

/** The two registries a room module fills (scene, furniture, avatars, effects). */
export interface IIsoRegistries
{
    logics: RoomObjectLogicRegistry;
    visualizations: RoomObjectVisualizationRegistry;
}

/** A room module: fills the registries with its object types (registerScene, registerFurniture…). */
export type IsoModule = (registries: IIsoRegistries) => void;
