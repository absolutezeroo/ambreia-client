import type {HostFeature} from '@ambreia/kernel/feature/defineFeature';
import type {IKernelConfig} from '@ambreia/kernel/config/loadConfig';
import {RoomWidgetRegistry} from '../ui/RoomWidgetRegistry';
import type {IRoomWidgetDefinition} from '../ui/RoomWidgetRegistry';
import type {IEngineHost} from './index';

/**
 * A feature of the game (spec §4): the kernel's declaration, plus what the game reads off it
 * before the boot. A feature that needs one of these declares it here, in its own folder, rather
 * than in a list somewhere else.
 */
export interface IGameFeature extends HostFeature<IEngineHost>
{
    /** Library images the feature reads by exact name (`getAssetByName('…')`): decoded at load. */
    readonly images?: readonly string[];
    /** Room widget types it builds, by AS3 type code (`RWE_…`). */
    readonly roomWidgets?: Readonly<Record<string, IRoomWidgetDefinition>>;
}

const enabled = (features: readonly IGameFeature[], config: IKernelConfig): IGameFeature[] =>
    features.filter(feature => config.section(feature.id).enabled);

/** The images the enabled features read by name. */
export function featureImages(features: readonly IGameFeature[], config: IKernelConfig): ReadonlySet<string>
{
    return new Set(enabled(features, config).flatMap(feature => feature.images ?? []));
}

/** The room widgets of the enabled features; a type two of them declare is an error naming both. */
export function roomWidgetRegistry(features: readonly IGameFeature[], config: IKernelConfig): RoomWidgetRegistry
{
    const registry = new RoomWidgetRegistry();

    for(const feature of enabled(features, config))
    {
        for(const [type, definition] of Object.entries(feature.roomWidgets ?? {})) registry.register(type, definition, feature.id);
    }

    return registry;
}
