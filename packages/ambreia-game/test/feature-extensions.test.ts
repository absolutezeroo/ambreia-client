// Spec §4, §9 J6: a feature declares the library images it reads by name and the room widgets it
// builds; adding or removing one is its folder and its line in GAME_FEATURES, nothing else.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DOMAdapter} from 'pixi.js';
import {loadConfig} from '@ambreia/kernel/config/loadConfig';
import {featureSections} from '@ambreia/kernel/feature/defineFeature';
import type {IGameFeature} from '../src/features/GameFeature';

// The room engine builds Pixi filters when its module loads, and a filter probes WebGL through a
// canvas: Node has none, and Pixi takes a context-less canvas for "no WebGL".
DOMAdapter.set({...DOMAdapter.get(), createCanvas: () => ({getContext: () => null}) as unknown as HTMLCanvasElement});

const {GAME_FEATURES} = await import('../src/features/index');
const {featureImages, roomWidgetRegistry} = await import('../src/features/GameFeature');

function config(features: readonly IGameFeature[], values: Record<string, unknown> = {}): ReturnType<typeof loadConfig>['config']
{
    return loadConfig([{name: 'defaults', values: {app: {server: {host: 'ws://test'}}}}, {name: 'config.json', values}], featureSections(features)).config;
}

test('the images to decode are those the enabled features declare', () =>
{
    const features: IGameFeature[] = [
        {id: 'a', images: ['bubble', 'arrow'], create: () => null},
        {id: 'b', images: ['arrow', 'star'], create: () => null},
        {id: 'c', images: ['ghost'], create: () => null},
        {id: 'd', create: () => null}
    ];

    assert.deepEqual([...featureImages(features, config(features, {c: {enabled: false}}))].sort(), ['arrow', 'bubble', 'star']);
});

test('the room widgets are those of the enabled features: the name bubble, the loading bar, the location answer', () =>
{
    assert.deepEqual(roomWidgetRegistry(GAME_FEATURES, config(GAME_FEATURES)).types().sort(), ['RWE_AVATAR_INFO', 'RWE_LOADINGBAR', 'RWE_LOCATION_WIDGET']);
});

test('without the loading-bar feature, RWE_LOADINGBAR has no definition', () =>
{
    const registry = roomWidgetRegistry(GAME_FEATURES, config(GAME_FEATURES, {'loading-bar': {enabled: false}}));

    assert.deepEqual(registry.types().sort(), ['RWE_AVATAR_INFO', 'RWE_LOCATION_WIDGET']);
    assert.equal(registry.get('RWE_LOADINGBAR'), null);
    assert.equal(registry.get('RWE_LOADINGBAR'), null);
});

test('a widget type declared by two features is refused, naming both', () =>
{
    const features: IGameFeature[] = [
        {id: 'a', roomWidgets: {RWE_X: {handler: () => { throw new Error('unused'); }}}, create: () => null},
        {id: 'b', roomWidgets: {RWE_X: {handler: () => { throw new Error('unused'); }}}, create: () => null}
    ];

    assert.throws(() => roomWidgetRegistry(features, config(features)), /RWE_X.*"a".*"b"/);
});
