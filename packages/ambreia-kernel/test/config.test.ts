import {test} from 'node:test';
import assert from 'node:assert/strict';
import {z} from 'zod';
import {loadConfig, ConfigError} from '../src/config/loadConfig';
import type {IConfigSource} from '../src/config/loadConfig';
import {browserSources, parseConfigJson, DEV_SERVER_HOST} from '../src/config/browserSources';

// Spec §5: typed, loaded once, validated, frozen; defaults → config.json → URL, in that order.
const SECTIONS = new Map<string, z.ZodObject>([
    ['room-ui', z.object({})],
    ['chat', z.object({maxLength: z.number().int().default(100)})]
]);

const defaults: IConfigSource = {name: 'defaults', values: {app: {server: {host: 'ws://localhost:40001'}}}};

function load(...more: IConfigSource[]): ReturnType<typeof loadConfig>
{
    return loadConfig([defaults, ...more], SECTIONS);
}

test('defaults alone: ports default to 40001, legacy is empty, sections take their defaults', () =>
{
    const {config, warnings} = load();

    assert.deepEqual(config.app.server.ports, [40001]);
    assert.deepEqual(config.legacy, {});
    assert.equal(config.section<{maxLength: number}>('chat').maxLength, 100);
    assert.deepEqual(warnings, []);
});

test('config.json overrides a default, the URL overrides config.json', () =>
{
    const {config} = load(
        {name: 'config.json', values: {app: {server: {host: 'wss://jeu.exemple.fr/ws'}, sso: 'from-json'}, chat: {maxLength: 50}}},
        {name: 'url', values: {app: {sso: 'from-url'}}}
    );

    assert.equal(config.app.server.host, 'wss://jeu.exemple.fr/ws');
    assert.equal(config.app.sso, 'from-url');
    assert.equal(config.section<{maxLength: number}>('chat').maxLength, 50);
});

test('an invalid field stops the load and is named in the error', () =>
{
    assert.throws(() => load({name: 'config.json', values: {app: {server: {host: 3}}}}), (error: unknown) =>
    {
        assert.ok(error instanceof ConfigError);
        assert.ok(error.issues.some(issue => issue.startsWith('app.server.host: ')), error.issues.join('\n'));

        return true;
    });
});

test('an unknown section is a warning, not an error', () =>
{
    const {warnings} = load({name: 'config.json', values: {fishing: {enabled: false}}});

    assert.deepEqual(warnings, ['unknown section "fishing" in config.json (a removed feature?)']);
});

test('every section is enabled unless config.json says otherwise', () =>
{
    assert.equal(load().config.section('room-ui').enabled, true);
    assert.equal(load({name: 'config.json', values: {'room-ui': {enabled: false}}}).config.section('room-ui').enabled, false);
});

test('a legacy value that is not text is named', () =>
{
    assert.throws(() => load({name: 'config.json', values: {legacy: {'url.prefix': 'x', 'game.width': 640}}}), (error: unknown) =>
    {
        assert.ok(error instanceof ConfigError);
        assert.ok(error.issues.some(issue => issue.startsWith('legacy.game.width: ')), error.issues.join('\n'));

        return true;
    });
});

test('the loaded configuration is frozen, all the way down', () =>
{
    const {config} = load({name: 'config.json', values: {legacy: {'url.prefix': 'x'}}});

    assert.ok(Object.isFrozen(config.app));
    assert.ok(Object.isFrozen(config.app.server));
    assert.ok(Object.isFrozen(config.app.server.ports));
    assert.ok(Object.isFrozen(config.legacy));
    assert.ok(Object.isFrozen(config.section('chat')));
});

test('browser sources: the dev host on localhost, the page origin elsewhere, ?sso and ?link from the URL', () =>
{
    const local = browserSources({hostname: 'localhost', protocol: 'http:', host: 'localhost:5173', search: '?sso=abc&link=navigator/goto/1'}, null);

    assert.deepEqual(local.map(source => source.name), ['defaults', 'url']);
    assert.equal((local[0].values as {app: {server: {host: string}}}).app.server.host, DEV_SERVER_HOST);
    assert.deepEqual(local[1].values, {app: {sso: 'abc', startLink: 'navigator/goto/1'}});

    const deployed = browserSources({hostname: 'jeu.exemple.fr', protocol: 'https:', host: 'jeu.exemple.fr', search: ''}, {app: {}});

    assert.deepEqual(deployed.map(source => source.name), ['defaults', 'config.json', 'url']);
    assert.equal((deployed[0].values as {app: {server: {host: string}}}).app.server.host, 'wss://jeu.exemple.fr/ws');
});

test('config.json that is not JSON is named', () =>
{
    assert.equal(parseConfigJson(null), null);
    assert.throws(() => parseConfigJson('{"app": '), (error: unknown) =>
        error instanceof ConfigError && error.issues[0].startsWith('config.json: '));
});
