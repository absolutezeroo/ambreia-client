import type {IIsoRegistries, IsoModule} from './IIsoRegistries';
import {RoomObjectLogicRegistry} from './RoomObjectLogicRegistry';
import {RoomObjectVisualizationRegistry} from './RoomObjectVisualizationRegistry';

/** Empty registries, filled by the given modules in order (a later one may replace a type). */
export function createRoomRegistries(modules: readonly IsoModule[]): IIsoRegistries
{
    const registries: IIsoRegistries = {logics: new RoomObjectLogicRegistry(), visualizations: new RoomObjectVisualizationRegistry()};

    for(const module of modules) module(registries);

    return registries;
}
