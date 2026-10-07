import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CoreComponentContext} from '../src/core/runtime/CoreComponentContext';
import {createIID} from '../src/core/runtime/IID';

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
