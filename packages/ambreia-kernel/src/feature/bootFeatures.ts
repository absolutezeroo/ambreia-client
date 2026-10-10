import {Logger} from '@ambreia/common/utils/Logger';
import {Component} from '../runtime/Component';
import type {CoreComponentContext} from '../runtime/CoreComponentContext';
import type {IAttachInstanceOptions} from '../runtime/IContext';
import {getIIDName} from '../runtime/IID';
import type {IID} from '../runtime/IID';
import type {IKernelConfig} from '../config/loadConfig';
import type {FeatureProduct, IFeature, IFeatureContext} from './defineFeature';
import {FeatureScope} from './FeatureScope';

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
    /**
     * Undoes the boot: each enabled feature's dispose(), then its scope, last booted first. The DI
     * context and the Components in it are the host's to dispose (Core.dispose()); a plain instance
     * is disposed with its carrier.
     */
    dispose(): void;
}

interface IBooted<H>
{
    readonly feature: IFeature<any, H>;
    readonly made: IFeatureContext<any, H>;
    readonly product: FeatureProduct;
}

/**
 * Creates the enabled features in list order (an asynchronous create is awaited, so a feature
 * can rely on the ones before it having been made), registers what each makes under its
 * interfaces, then checks every required dependency has a provider. A missing one throws
 * FeatureDependencyError, naming the feature, the interface and the disabled feature that would
 * have provided it, where the DI alone would leave the component locked in silence. Two features
 * with one id, two enabled providers of one interface, and features that wait on each other are
 * boot errors too: the DI would shadow the one and leave the others locked in silence.
 */
export async function bootFeatures<H>(context: CoreComponentContext, features: readonly IFeature<any, H>[], config: IKernelConfig, host?: H): Promise<IKernelReport>
{
    const reports: IFeatureReport[] = [];
    const requiring: Array<{id: string; requires: IID[]}> = [];
    const booted: IBooted<H>[] = [];
    const disabledProviders = new Map<IID, string>();
    const providers = new Map<IID, string>();
    const declared = checkDeclarations(features, config);
    const switchedOff = features
        .filter(feature => feature.essential !== undefined && !config.section(feature.id).enabled)
        .map(feature => `Feature "${feature.id}" cannot be switched off: ${feature.essential}`);

    // Before anything is made: an essential feature's partners use it in their afterAttach.
    if(declared.length > 0 || switchedOff.length > 0) throw new FeatureDependencyError([...declared, ...switchedOff]);

    const dispose = (): void =>
    {
        for(const {feature, made, product} of booted.reverse())
        {
            try
            {
                feature.dispose?.(product, made);
            }
            catch (error)
            {
                log.error(`Feature "${feature.id}" failed to dispose`, error);
            }

            made.scope.release();
        }

        booted.length = 0;
    };

    try
    {
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

            for(const iid of provides) providers.set(iid, feature.id);

            const made: IFeatureContext<any, H> = {context, config: section, app: config.app, host: host as H, scope: new FeatureScope()};
            const product = await feature.create(made);

            booted.push({feature, made, product});

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

        issues.push(...cycles(requiring, providers));

        if(issues.length > 0) throw new FeatureDependencyError(issues);
    }
    catch (error)
    {
        // A boot that fails half-way leaves nothing behind: the host shows the error and may boot again.
        dispose();

        throw error;
    }

    return {features: reports, dispose};
}

/** Two features with one id, or two enabled features providing one interface: named, before anything is made. */
function checkDeclarations<H>(features: readonly IFeature<any, H>[], config: IKernelConfig): string[]
{
    const issues: string[] = [];
    const ids = new Set<string>();
    const providers = new Map<IID, string>();

    for(const feature of features)
    {
        if(ids.has(feature.id)) issues.push(`Feature "${feature.id}" is declared twice`);

        ids.add(feature.id);

        if(!config.section(feature.id).enabled) continue;

        for(const iid of feature.provides ?? [])
        {
            const other = providers.get(iid);

            if(other !== undefined) issues.push(`${getIIDName(iid)} is provided by both "${other}" and "${feature.id}"`);
            else providers.set(iid, feature.id);
        }
    }

    return issues;
}

/**
 * Features that wait on each other, through the interfaces they provide: the DI leaves every one
 * of them locked, and the 15 s warning is all that would say so. One line per cycle, in boot order.
 * A feature's dependency on its own interface is not a cycle: it resolves with the feature.
 */
function cycles(requiring: ReadonlyArray<{id: string; requires: IID[]}>, providers: ReadonlyMap<IID, string>): string[]
{
    const edges = new Map(requiring.map(({id, requires}) => [id, [...new Set(requires.map(iid => providers.get(iid)).filter((to): to is string => to !== undefined && to !== id))]]));
    const done = new Set<string>();
    const issues: string[] = [];

    const visit = (id: string, path: string[]): void =>
    {
        if(done.has(id)) return;

        const at = path.indexOf(id);

        if(at !== -1)
        {
            issues.push(`Features wait on each other: ${[...path.slice(at), id].map(step => `"${step}"`).join(' → ')}`);

            return;
        }

        for(const to of edges.get(id) ?? []) visit(to, [...path, id]);

        done.add(id);
    };

    for(const {id} of requiring) visit(id, []);

    return issues;
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
