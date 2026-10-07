import {z} from 'zod';
import type {Component} from '../runtime/Component';
import type {IAttachInstanceOptions} from '../runtime/IContext';
import type {CoreComponentContext} from '../runtime/CoreComponentContext';
import type {IID} from '../runtime/IID';
import type {AppConfig} from '../config/AppConfig';

/** What a feature's create() gives the kernel to register: a component, a plain instance, or nothing. */
export type FeatureProduct = Component | {instance: unknown; attach?: IAttachInstanceOptions} | null;

/**
 * What create() receives: the DI context, its own section (and only it, §5.2), `app`, and the
 * host's own objects (the client's bundles and application, which are not configuration).
 */
export interface IFeatureContext<C, H = unknown>
{
    readonly context: CoreComponentContext;
    readonly config: Readonly<C & {enabled: boolean}>;
    readonly app: Readonly<AppConfig>;
    readonly host: H;
}

/**
 * A feature, declared (spec §4): its id (also the name of its config section), its section's
 * schema, the interfaces it provides, and how it is made. What it depends on is read off what
 * create() returns, so it is not declared twice.
 */
export interface IFeature<S extends z.ZodObject = z.ZodObject, H = unknown>
{
    readonly id: string;
    readonly config?: S;
    readonly provides?: readonly IID<any>[];
    /**
     * Set when the host cannot run without the feature, with the reason: switching it off is then
     * a boot error naming it, rather than a client that throws later (the login, for one).
     */
    readonly essential?: string;
    create(feature: IFeatureContext<z.infer<S>, H>): FeatureProduct | Promise<FeatureProduct>;
    /**
     * Runs once what create() made is attached, and is awaited before the next feature is made:
     * the place for work that needs the product registered (the configuration's download).
     */
    afterAttach?(product: FeatureProduct, feature: IFeatureContext<z.infer<S>, H>): void | Promise<void>;
}

/** A feature of a given host, any section: what a host's feature list is typed with. */
export type HostFeature<H> = IFeature<z.ZodObject, H>;

export function defineFeature<S extends z.ZodObject = z.ZodObject, H = unknown>(feature: IFeature<S, H>): IFeature<S, H>
{
    return feature;
}

/** The config sections the features declare, for loadConfig(): one per feature, `{}` when it has none. */
export function featureSections(features: readonly IFeature<any, any>[]): Map<string, z.ZodObject>
{
    return new Map(features.map(feature => [feature.id, feature.config ?? z.object({})]));
}
