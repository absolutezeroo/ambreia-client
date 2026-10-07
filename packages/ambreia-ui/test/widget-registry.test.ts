import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WidgetRegistry} from '../src/kit/WidgetRegistry';
import type {IWidgetWindow} from '../src/components/IWidgetWindow';

const window = {} as IWidgetWindow;

test('a registered type creates its widget for the window', () =>
{
    const registry = new WidgetRegistry();
    const widget = {disposed: false};

    registry.register('probe', w => (assert.equal(w, window), widget) as never);

    assert.equal(registry.createWidget('probe', window), widget);
    assert.deepEqual(registry.types(), ['probe']);
});

test('an unknown type creates nothing', () =>
{
    assert.equal(new WidgetRegistry().createWidget('nope', window), null);
});

test('types() is sorted', () =>
{
    const registry = new WidgetRegistry();

    for(const type of ['c', 'a', 'b']) registry.register(type, () => ({}) as never);

    assert.deepEqual(registry.types(), ['a', 'b', 'c']);
});
