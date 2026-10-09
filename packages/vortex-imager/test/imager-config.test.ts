// The imager reads the families' .ambreia directories and their key from the client's own
// config.json (spec 2026-10-09-ambreia-everything §3): it never renders from other assets than the game.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {loadConfig} from '../src/config';

test('asset-packs comes from the client config.json IMAGER_CLIENT_CONFIG names', () =>
{
    const file = join(mkdtempSync(join(tmpdir(), 'imager-config-')), 'config.json');

    writeFileSync(file, JSON.stringify({'asset-packs': {room: '${url.prefix}/ambreia/room/', key: 'k'}}));
    process.env.IMAGER_CLIENT_CONFIG = file;

    try
    {
        assert.deepEqual(loadConfig().assetPacks, {room: '${url.prefix}/ambreia/room/', key: 'k'});
    }
    finally
    {
        delete process.env.IMAGER_CLIENT_CONFIG;
    }
});

test('a missing client config.json is an error that says what to do', () =>
{
    process.env.IMAGER_CLIENT_CONFIG = join(tmpdir(), 'no-such-dir', 'config.json');

    try
    {
        assert.throws(() => loadConfig(), /config\.example\.json/);
    }
    finally
    {
        delete process.env.IMAGER_CLIENT_CONFIG;
    }
});
