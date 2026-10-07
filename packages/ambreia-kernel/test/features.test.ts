import {test} from 'node:test';
import assert from 'node:assert/strict';
import {z} from 'zod';
import {CoreComponentContext} from '../src/runtime/CoreComponentContext';
import {Component} from '../src/runtime/Component';
import {ComponentDependency} from '../src/runtime/ComponentDependency';
import {createIID} from '../src/runtime/IID';
import {defineFeature, featureSections} from '../src/feature/defineFeature';
import type {IFeature} from '../src/feature/defineFeature';
import {bootFeatures, FeatureDependencyError} from '../src/feature/bootFeatures';
import {loadConfig} from '../src/config/loadConfig';
import type {IConfigSource} from '../src/config/loadConfig';

// Spec §4: a feature is declared, created in list order, and a required dependency nobody
// provides stops the boot, naming the feature and what it waits on (§11, J5).
const IID_A = createIID<object>('IID_A');
const IID_B = createIID<object>('IID_B');

class A extends Component {}

// The DI reads `dependencies` inside Component's constructor, before a subclass's own fields
// exist: the required flag has to be a literal of the class, not a constructor parameter.
class BRequired extends Component
{
    protected override get dependencies(): Array<ComponentDependency<unknown>>
    {
        return super.dependencies.concat([new ComponentDependency(IID_A, () => {}, true)]);
    }
}

class BOptional extends Component
{
    protected override get dependencies(): Array<ComponentDependency<unknown>>
    {
        return super.dependencies.concat([new ComponentDependency(IID_A, () => {}, false)]);
    }
}

const featureA = defineFeature({id: 'a', provides: [IID_A], create: ({context}) => new A(context)});
const featureB = (required = true): IFeature => defineFeature({id: 'b', provides: [IID_B], create: ({context}) => (required ? new BRequired(context) : new BOptional(context))});
const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

function config(features: readonly IFeature[], values: Record<string, unknown> = {}): ReturnType<typeof loadConfig>['config']
{
    const sources: IConfigSource[] = [{name: 'defaults', values: {app: {server: {host: 'ws://test'}}}}, {name: 'config.json', values}];

    return loadConfig(sources, featureSections(features)).config;
}

test('a feature waiting on another one is ready once both are created', async () =>
{
    const context = new CoreComponentContext();
    const features = [featureA, featureB()];
    const report = await bootFeatures(context, features, config(features));

    context.initialize();
    await flush();

    assert.deepEqual(report.features.map(f => [f.id, f.state()]), [['a', 'ready'], ['b', 'ready']]);
});

test('a required dependency nobody provides stops the boot, naming the feature and the IID', async () =>
{
    const features = [featureB()];

    await assert.rejects(bootFeatures(new CoreComponentContext(), features, config(features)), (error: unknown) =>
    {
        assert.ok(error instanceof FeatureDependencyError);
        assert.equal(error.message, 'Feature "b" waits on IID_A, which no enabled feature provides');

        return true;
    });
});

test('a required dependency on a disabled feature says which one', async () =>
{
    const features = [featureA, featureB()];

    await assert.rejects(bootFeatures(new CoreComponentContext(), features, config(features, {a: {enabled: false}})), (error: unknown) =>
        error instanceof FeatureDependencyError
        && error.message === 'Feature "b" waits on IID_A, which no enabled feature provides (provided by "a", disabled)');
});

test('an optional dependency on a disabled feature boots without it', async () =>
{
    const context = new CoreComponentContext();
    const features = [featureA, featureB(false)];
    const report = await bootFeatures(context, features, config(features, {a: {enabled: false}}));

    context.initialize();
    await flush();

    assert.deepEqual(report.features.map(f => [f.id, f.state()]), [['a', 'disabled'], ['b', 'ready']]);
});

test('an asynchronous create is awaited before the next feature is created', async () =>
{
    const order: string[] = [];
    const slow = defineFeature({id: 'slow', create: async () => { await flush(); order.push('slow'); return null; }});
    const next = defineFeature({id: 'next', create: () => { order.push('next'); return null; }});

    await bootFeatures(new CoreComponentContext(), [slow, next], config([slow, next]));

    assert.deepEqual(order, ['slow', 'next']);
});

test('a feature that makes a plain instance has it registered under its interface', async () =>
{
    const context = new CoreComponentContext();
    const thing = {plain: true};
    const plain = defineFeature({id: 'plain', provides: [IID_A], create: () => ({instance: thing})});

    await bootFeatures(context, [plain], config([plain]));
    context.initialize();
    await flush();

    assert.equal(context.queueInterface(IID_A), thing);
});

test('the report names what each feature provides and waits on, and passes it its own section', async () =>
{
    let seen: unknown = null;
    const tuned = defineFeature({
        id: 'tuned',
        config: z.object({limit: z.number().default(3)}),
        create: ({config: section}) => { seen = section; return null; }
    });
    const features = [featureA, featureB(), tuned];
    const report = await bootFeatures(new CoreComponentContext(), features, config(features, {tuned: {limit: 7}}));

    assert.deepEqual(report.features.map(f => [f.id, f.provides, f.requires]), [['a', ['IID_A'], []], ['b', ['IID_B'], ['IID_A']], ['tuned', [], []]]);
    assert.deepEqual(seen, {limit: 7, enabled: true});
});
