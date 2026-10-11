import type {HostFeature} from '@ambreia/kernel/feature/defineFeature';
import type {IKernelConfig} from '@ambreia/kernel/config/loadConfig';
import {FeatureDependencyError} from '@ambreia/kernel/feature/bootFeatures';
import {RoomWidgetRegistry} from '../ui/RoomWidgetRegistry';
import type {IRoomWidgetDefinition} from '../ui/RoomWidgetRegistry';
import type {IEngineHost, IEngineManagers} from './EngineHost';

/** A slot of `host.made`: what an earlier feature made, read by the ones after it. */
export type MadeSlot = keyof IEngineManagers;

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
    /**
     * The slots of `host.made` create() reads at once: checked non-null before it runs
     * (guardedFeatures()), so a feature listed before what it needs fails the boot by name
     * instead of attaching nothing in silence. A slot read later, in a callback, is not one.
     */
    readonly requires?: readonly MadeSlot[];
}

/**
 * The features with their `requires` enforced: a required slot still null when a feature is
 * created is a FeatureDependencyError naming both, before create() runs. The kernel checks what
 * the DI knows (the interfaces); this is the same promise for what the game passes by hand.
 */
export function guardedFeatures(features: readonly IGameFeature[]): IGameFeature[]
{
    return features.map(feature =>
    {
        const requires = feature.requires ?? [];

        if(requires.length === 0) return feature;

        return {
            ...feature,
            create: made =>
            {
                const missing = requires.filter(slot => made.host.made[slot] === null);

                if(missing.length > 0) throw new FeatureDependencyError(missing.map(slot => `Feature "${feature.id}" needs host.made.${slot}, which no feature before it made`));

                return feature.create(made);
            }
        };
    });
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
