// Spec §4: a feature's needs are declared and checked before create(). `host.made` is filled by
// hand in list order, so the one way a feature can be wrong is to read a slot a later feature
// makes: every RPG feature is created here with `made` instrumented, and what it reads at once
// has to be declared in `requires` and made by a feature before it.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DOMAdapter} from 'pixi.js';
import {loadConfig} from '@ambreia/kernel/config/loadConfig';
import {featureSections} from '@ambreia/kernel/feature/defineFeature';
import type {IFeatureContext} from '@ambreia/kernel/feature/defineFeature';
import {FeatureDependencyError} from '@ambreia/kernel/feature/bootFeatures';
import {FeatureScope} from '@ambreia/kernel/feature/FeatureScope';
import type {CoreComponentContext} from '@ambreia/kernel/runtime/CoreComponentContext';
import type {AssetLibrary} from '@ambreia/common/assets/AssetLibrary';
import type {IAvatarData} from '@ambreia/avatar/AvatarData';
import type {IGameFeature, MadeSlot} from '../src/features/GameFeature';
import type {IEngineHost, IEngineManagers} from '../src/features/index';

DOMAdapter.set({...DOMAdapter.get(), createCanvas: () => ({getContext: () => null}) as unknown as HTMLCanvasElement});

const {GAME_FEATURES, emptyManagers} = await import('../src/features/index');
const {guardedFeatures, roomWidgetRegistry} = await import('../src/features/GameFeature');

/** The features made without the DI: everything after the core managers (they return null and fill `made`). */
const RPG_FEATURES = GAME_FEATURES.filter(feature => (feature.provides ?? []).length === 0 && feature.id !== 'communication-demo');

function context(host: IEngineHost, feature: IGameFeature): IFeatureContext<Record<string, unknown>, IEngineHost>
{
    const config = loadConfig([{name: 'defaults', values: {app: {server: {host: 'ws://test'}}}}], featureSections(GAME_FEATURES)).config;

    // A probe feature of the test has no section of its own.
    const section = GAME_FEATURES.some(candidate => candidate.id === feature.id) ? config.section(feature.id) : {enabled: true};

    return {context: {} as CoreComponentContext, config: section, app: config.app, host, scope: new FeatureScope()};
}

function host(made: IEngineManagers): IEngineHost
{
    return {
        assets: {} as AssetLibrary,
        avatarData: {} as IAvatarData,
        legacy: {},
        onWindowManager: () => undefined,
        renderer: () => null,
        roomWidgets: roomWidgetRegistry(GAME_FEATURES, loadConfig([{name: 'defaults', values: {app: {server: {host: 'ws://test'}}}}], featureSections(GAME_FEATURES)).config),
        made
    };
}

test('no RPG feature reads at once a slot a later feature makes, and what it reads is declared', async () =>
{
    const made = emptyManagers();
    const writers = new Map<MadeSlot, string>();
    const reads = new Map<string, Set<MadeSlot>>();
    let current = '';
    const probe = new Proxy(made, {
        get(target, slot: MadeSlot): unknown
        {
            if(current !== '' && slot in target) reads.get(current)!.add(slot);

            return target[slot];
        },
        set(target, slot: MadeSlot, value: never): boolean
        {
            if(current !== '' && !writers.has(slot)) writers.set(slot, current);
            target[slot] = value;

            return true;
        }
    });
    const scopes: FeatureScope[] = [];
    const issues: string[] = [];

    assert.ok(RPG_FEATURES.length >= 7, `RPG features found: ${RPG_FEATURES.map(feature => feature.id).join(', ')}`);

    for(const feature of RPG_FEATURES)
    {
        current = feature.id;
        reads.set(feature.id, new Set());

        const made = context(host(probe), feature);

        await feature.create(made);
        scopes.push(made.scope);

        const declared = new Set(feature.requires ?? []);
        const order = (id: string): number => RPG_FEATURES.findIndex(candidate => candidate.id === id);

        for(const slot of reads.get(feature.id)!)
        {
            const writer = writers.get(slot);

            if(writer === undefined || writer === feature.id) continue;

            if(order(writer) > order(feature.id)) issues.push(`"${feature.id}" reads host.made.${slot} at once, which "${writer}" makes after it`);
            else if(!declared.has(slot)) issues.push(`"${feature.id}" reads host.made.${slot} at once: declare it in requires`);
        }

        for(const slot of declared)
        {
            const writer = writers.get(slot);

            if(writer !== undefined && writer !== feature.id && order(writer) > order(feature.id)) issues.push(`"${feature.id}" requires host.made.${slot}, which "${writer}" makes after it`);
        }
    }

    current = '';
    for(const scope of scopes.reverse()) scope.release();

    assert.deepEqual(issues, []);
});

test('a required slot still null when the feature is created is a boot error naming both', async () =>
{
    const feature: IGameFeature = {id: 'probe', requires: ['hud', 'character'], create: () => null};
    const [guarded] = guardedFeatures([feature]);
    const made = emptyManagers();

    await assert.rejects(async () => guarded.create(context(host(made), feature)), (error: unknown) =>
    {
        assert.ok(error instanceof FeatureDependencyError);
        assert.deepEqual(error.issues, [
            'Feature "probe" needs host.made.hud, which no feature before it made',
            'Feature "probe" needs host.made.character, which no feature before it made'
        ]);

        return true;
    });

    assert.equal(guardedFeatures([{id: 'free', create: () => null}])[0].requires, undefined);
});

test('disposing a feature takes its listeners off and its console hook away', async () =>
{
    const made = emptyManagers();
    const feature = RPG_FEATURES.find(candidate => candidate.id === 'character')!;
    const ctx = context(host(made), feature);
    const root = globalThis as unknown as {__ambreia?: Record<string, unknown>};

    await feature.create(ctx);

    const session = made.character!;

    assert.ok(session.events.listenerCount('characters') > 0);
    assert.ok(root.__ambreia?.characters);

    ctx.scope.release();

    assert.equal(session.events.listenerCount('characters'), 0);
    assert.equal(root.__ambreia?.characters, undefined);
});
