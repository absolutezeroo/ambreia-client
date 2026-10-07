import {z} from 'zod';
import type {Component} from '../runtime/Component';
import type {IAttachInstanceOptions, IContext} from '../runtime/IContext';
import type {IID} from '../runtime/IID';
import type {AppConfig} from '../config/AppConfig';

/** What a feature's create() gives the kernel to register: a component, a plain instance, or nothing. */
export type FeatureProduct = Component | {instance: unknown; attach?: IAttachInstanceOptions} | null;

/** What create() receives: the DI context, its own section (and only it, §5.2), and `app`. */
export interface IFeatureContext<C>
{
    readonly context: IContext;
    readonly config: Readonly<C & {enabled: boolean}>;
    readonly app: Readonly<AppConfig>;
}

/**
 * A feature, declared (spec §4): its id (also the name of its config section), its section's
 * schema, the interfaces it provides, and how it is made. What it depends on is read off what
 * create() returns, so it is not declared twice.
 */
export interface IFeature<S extends z.ZodObject = z.ZodObject>
{
    readonly id: string;
    readonly config?: S;
    readonly provides?: readonly IID<any>[];
    create(feature: IFeatureContext<z.infer<S>>): FeatureProduct | Promise<FeatureProduct>;
}

export function defineFeature<S extends z.ZodObject = z.ZodObject>(feature: IFeature<S>): IFeature<S>
{
    return feature;
}

/** The config sections the features declare, for loadConfig(): one per feature, `{}` when it has none. */
export function featureSections(features: readonly IFeature<any>[]): Map<string, z.ZodObject>
{
    return new Map(features.map(feature => [feature.id, feature.config ?? z.object({})]));
}
