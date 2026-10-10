// The asset-packs feature (spec 2026-10-09-ambreia-everything): once the configuration is loaded it
// opens one .ambreia directory per family for the avatar renderer and the room engine.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ConfigError, loadConfig} from '@ambreia/kernel/config/loadConfig';
import {FeatureScope} from '@ambreia/kernel/feature/FeatureScope';
import {featureSections} from '@ambreia/kernel/feature/defineFeature';
import {AssetPacksFeature} from '../src/features/asset-packs/feature';
import type {IEngineHost} from '../src/features/index';

const PROPERTIES: Record<string, string> = {'url.prefix': 'http://assets'};
const ALL = {
    clothing: '${url.prefix}/ambreia/clothing/',
    effects: '${url.prefix}/ambreia/effects/',
    room: '${url.prefix}/ambreia/room/',
    pets: '${url.prefix}/ambreia/pets/',
    furniture: '${url.prefix}/ambreia/furniture/'
};

function host(initialized: boolean): {host: IEngineHost; complete: () => void}
{
    let onComplete: (() => void) | null = null;
    const configuration = {
        isInitialized: () => initialized,
        getProperty: (key: string) => PROPERTIES[key] ?? '',
        interpolate: (text: string) => text.replace(/\$\{([^}]+)\}/g, (_, key: string) => PROPERTIES[key] ?? ''),
        events: {once: (_event: string, listener: () => void) => { onComplete = listener; }}
    };

    return {host: {made: {configuration, assetDirectories: null}} as unknown as IEngineHost, complete: () => onComplete?.()};
}

const create = (config: Record<string, unknown>, made: IEngineHost): unknown =>
    AssetPacksFeature.create({context: null as never, config: {enabled: true, ...config}, app: {} as never, host: made, scope: new FeatureScope()});

test('the five directories are opened once the configuration completes, ${url.prefix} resolved', () =>
{
    const {host: made, complete} = host(false);

    create(ALL, made);
    assert.equal(made.made.assetDirectories, null);

    complete();

    assert.equal(made.made.assetDirectories?.room.url, 'http://assets/ambreia/room/');
    assert.equal(made.made.assetDirectories?.furniture.url, 'http://assets/ambreia/furniture/');
});

test('without an asset-packs section the asset host\'s ambreia/<family>/ is used: a config.json-less deploy still boots', () =>
{
    const {host: made} = host(true);

    create({}, made);

    assert.equal(made.made.assetDirectories?.pets.url, 'http://assets/ambreia/pets/');
});

test('a misspelt family key is a configuration error, not a silently unused directory', () =>
{
    const sources = [{name: 'defaults', values: {app: {server: {host: 'ws://test'}}}}, {name: 'config.json', values: {'asset-packs': {...ALL, furnture: 'x'}}}];

    assert.throws(() => loadConfig(sources, featureSections([AssetPacksFeature])), ConfigError);
});

test('a key that is not 32 bytes of base64url is a configuration error', () =>
{
    const sources = [{name: 'defaults', values: {app: {server: {host: 'ws://test'}}}}, {name: 'config.json', values: {'asset-packs': {...ALL, key: 'too-short'}}}];

    assert.throws(() => loadConfig(sources, featureSections([AssetPacksFeature])), ConfigError);
});
