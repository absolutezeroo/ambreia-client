import {Logger} from '@ambreia/common/utils/Logger';
import {Component} from '../runtime/Component';
import type {CoreComponentContext} from '../runtime/CoreComponentContext';
import type {IAttachInstanceOptions} from '../runtime/IContext';
import {getIIDName} from '../runtime/IID';
import type {IID} from '../runtime/IID';
import type {IKernelConfig} from '../config/loadConfig';
import type {FeatureProduct, IFeature} from './defineFeature';

const log = Logger.getLogger('kernel.feature.bootFeatures');

/** Required dependencies nobody provides: the boot stops here, naming each (spec §4, §11). */
export class FeatureDependencyError extends Error
{
    public readonly issues: readonly string[];

    constructor(issues: readonly string[])
    {
        super(issues.join('\n'));
        this.name = 'FeatureDependencyError';
        this.issues = issues;
    }
}

export type FeatureState = 'disabled' | 'locked' | 'ready';

/** One feature as the kernel booted it: the introspection of §9 (J5). */
export interface IFeatureReport
{
    readonly id: string;
    readonly enabled: boolean;
    readonly provides: readonly string[];
    readonly requires: readonly string[];
    /** Read live: `locked` while a dependency has not arrived. */
    state(): FeatureState;
}

export interface IKernelReport
{
    readonly features: readonly IFeatureReport[];
}

/**
 * Creates the enabled features in list order (an asynchronous create is awaited, so a feature
 * can rely on the ones before it having been made), registers what each makes under its
 * interfaces, then checks every required dependency has a provider. A missing one throws
 * FeatureDependencyError, naming the feature, the interface and the disabled feature that would
 * have provided it, where the DI alone would leave the component locked in silence.
 */
export async function bootFeatures<H>(context: CoreComponentContext, features: readonly IFeature<any, H>[], config: IKernelConfig, host?: H): Promise<IKernelReport>
{
    const reports: IFeatureReport[] = [];
    const requiring: Array<{id: string; requires: IID[]}> = [];
    const disabledProviders = new Map<IID, string>();

    for(const feature of features)
    {
        const section = config.section<Record<string, unknown>>(feature.id);
        const provides = [...(feature.provides ?? [])];

        if(!section.enabled)
        {
            for(const iid of provides) disabledProviders.set(iid, feature.id);
            reports.push(report(feature.id, false, provides, [], () => 'disabled'));
            log.info(`Feature "${feature.id}" is disabled`);
            continue;
        }

        const made = {context, config: section, app: config.app, host: host as H};
        const product = await feature.create(made);
        const requires = attach(context, feature, provides, product);

        await feature.afterAttach?.(product, made);

        requiring.push({id: feature.id, requires});
        reports.push(report(feature.id, true, provides, requires, () => stateOf(context, provides, product)));
    }

    const provided = context.providedInterfaces();
    const issues: string[] = [];

    for(const {id, requires} of requiring)
    {
        for(const iid of requires)
        {
            if(provided.has(iid)) continue;

            const disabled = disabledProviders.get(iid);

            issues.push(`Feature "${id}" waits on ${getIIDName(iid)}, which no enabled feature provides${disabled ? ` (provided by "${disabled}", disabled)` : ''}`);
        }
    }

    if(issues.length > 0) throw new FeatureDependencyError(issues);

    return {features: reports};
}

/** Registers the product and returns what it requires. */
function attach<H>(context: CoreComponentContext, feature: IFeature<any, H>, provides: IID[], product: FeatureProduct): IID[]
{
    if(product === null) return [];

    if(product instanceof Component)
    {
        context.attachComponent(product, provides);

        return product.requiredDependencies;
    }

    const options: IAttachInstanceOptions = product.attach ?? {};

    if(provides.length !== 1) throw new Error(`Feature "${feature.id}" makes a plain instance: it must provide exactly one interface`);

    context.attachInstance(provides[0], product.instance, options);

    return (options.dependencies ?? []).filter(dependency => dependency.required).map(dependency => dependency.identifier);
}

function stateOf(context: CoreComponentContext, provides: IID[], product: FeatureProduct): FeatureState
{
    if(product instanceof Component) return product.locked ? 'locked' : 'ready';
    if(product === null || provides.length === 0) return 'ready';

    return context.queueInterface(provides[0]) !== null ? 'ready' : 'locked';
}

function report(id: string, enabled: boolean, provides: IID[], requires: IID[], state: () => FeatureState): IFeatureReport
{
    return {id, enabled, provides: provides.map(getIIDName), requires: requires.map(getIIDName), state};
}
