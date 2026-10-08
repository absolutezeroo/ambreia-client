// The asset-packs feature (plan 2026-10-08-asset-packs): once the configuration is loaded, each
// configured .ambreia directory stands in for the .nitro directory the client downloads that family from.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AssetPacks} from '@ambreia/common/assets/pack/AssetPacks';
import {ConfigError, loadConfig} from '@ambreia/kernel/config/loadConfig';
import {featureSections} from '@ambreia/kernel/feature/defineFeature';
import {AssetPacksFeature} from '../src/features/asset-packs/feature';
import type {IEngineHost} from '../src/features/index';

const PROPERTIES: Record<string, string> = {
    'url.prefix': 'http://assets',
    'flash.dynamic.download.url': 'http://assets/dcr/hof_furni/',
    'flash.dynamic.avatar.download.url': 'http://assets/gordon/PRODUCTION/'
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

    return {host: {made: {configuration}} as unknown as IEngineHost, complete: () => onComplete?.()};
}

const create = (config: Record<string, unknown>, made: IEngineHost): unknown =>
    AssetPacksFeature.create({context: null as never, config: {enabled: true, ...config}, app: {} as never, host: made});

test('the configured packs are mounted on the download directories once the configuration completes', () =>
{
    const {host: made, complete} = host(false);

    create({furniture: '${url.prefix}/ambreia/furniture/', clothing: '${url.prefix}/ambreia/clothing/'}, made);
    assert.equal(AssetPacks.resolve('http://assets/dcr/hof_furni/throne.nitro'), null);

    complete();

    try
    {
        assert.equal(AssetPacks.resolve('http://assets/dcr/hof_furni/throne.nitro')?.pack.url, 'http://assets/ambreia/furniture/');
        assert.equal(AssetPacks.resolve('http://assets/gordon/PRODUCTION/hh_human_body.nitro')?.pack.url, 'http://assets/ambreia/clothing/');
    }
    finally
    {
        AssetPacks.unmountAll();
    }
});

test('without packs configured nothing is mounted: every .nitro loads as before', () =>
{
    create({}, host(true).host);

    assert.equal(AssetPacks.resolve('http://assets/dcr/hof_furni/throne.nitro'), null);
});

test('a misspelt pack key is a configuration error, not a silently unused pack', () =>
{
    const sources = [{name: 'defaults', values: {app: {server: {host: 'ws://test'}}}}, {name: 'config.json', values: {'asset-packs': {furnture: 'x'}}}];

    assert.throws(() => loadConfig(sources, featureSections([AssetPacksFeature])), ConfigError);
});

test('a key that is not 32 bytes of base64url is a configuration error', () =>
{
    const sources = [{name: 'defaults', values: {app: {server: {host: 'ws://test'}}}}, {name: 'config.json', values: {'asset-packs': {key: 'too-short'}}}];

    assert.throws(() => loadConfig(sources, featureSections([AssetPacksFeature])), ConfigError);
});
