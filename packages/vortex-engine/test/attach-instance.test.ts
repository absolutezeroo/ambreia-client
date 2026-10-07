import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CoreComponentContext} from '../src/core/runtime/CoreComponentContext';
import {createIID} from '../src/core/runtime/IID';
import {ComponentDependency} from '../src/core/runtime/ComponentDependency';

interface IThing { readonly name: string }

const IID_Thing = createIID<IThing>('IThing');

test('a request queued before the attach gets the instance, not a component', () =>
{
    const context = new CoreComponentContext();
    const thing: IThing = {name: 'plain'};
    let received: unknown = null;

    context.queueInterface(IID_Thing, (_iid, instance) => { received = instance; });
    context.attachInstance(IID_Thing, thing);

    assert.equal(received, thing);
});

test('a request made after the attach gets the instance', () =>
{
    const context = new CoreComponentContext();
    const thing: IThing = {name: 'plain'};

    context.attachInstance(IID_Thing, thing);

    assert.equal(context.queueInterface(IID_Thing), thing);
});

interface IDep { readonly value: number }

const IID_Dep = createIID<IDep>('IDep');
const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

test('an instance with dependencies is announced only once they resolve', async () =>
{
    const context = new CoreComponentContext();
    const thing: IThing = {name: 'plain'};
    let dependency: IDep | null = null;
    let received: unknown = null;

    context.queueInterface(IID_Thing, (_iid, instance) => { received = instance; });
    context.attachInstance(IID_Thing, thing, {
        dependencies: [new ComponentDependency(IID_Dep, (value: IDep | null) => { dependency = value; }, true)]
    });
    await flush();

    assert.equal(received, null);

    const provider: IDep = {value: 1};

    context.attachInstance(IID_Dep, provider);
    await flush();

    assert.equal(dependency, provider);
    assert.equal(received, thing);
});

test('the update option is called by the context update loop, once per frame', async () =>
{
    const context = new CoreComponentContext();
    const calls: number[] = [];

    context.attachInstance(IID_Thing, {name: 'ticking'}, {update: deltaTime => calls.push(deltaTime)});
    await flush();
    context.update(16);
    context.update(16);

    assert.equal(calls.length, 2);
});

test('ready runs once the dependencies resolve, before anyone receives the instance', async () =>
{
    const context = new CoreComponentContext();
    const order: string[] = [];

    context.queueInterface(IID_Thing, () => order.push('received'));
    context.attachInstance(IID_Thing, {name: 'initialised'}, {
        dependencies: [new ComponentDependency(IID_Dep, () => undefined, true)],
        ready: () => order.push('ready')
    });
    context.attachInstance(IID_Dep, {value: 2});
    await flush();

    assert.deepEqual(order, ['ready', 'received']);
});
