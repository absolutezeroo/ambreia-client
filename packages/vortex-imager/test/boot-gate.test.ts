// The server listens before its pipelines are up: /health reports the boot step with a 503, every
// other route answers 503 + Retry-After until the boot is ready, so an orchestrator can tell
// "warming up" from "dead" and no handler ever sees a service that is not there yet.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../src/server';
import type {IServerDependencies} from '../src/server';
import {RenderCache} from '../src/cache/RenderCache';
import type {AvatarRenderService} from '../src/avatar/AvatarRenderService';
import type {IImagerConfig} from '../src/config';

function dependencies(): IServerDependencies
{
    return {
        config: {} as IImagerConfig,
        boot: {state: 'starting', reason: 'avatar pipeline', since: Date.now()},
        avatars: null as unknown as AvatarRenderService,
        badges: null,
        rooms: null,
        database: null,
        cache: new RenderCache(4, 0),
        roomCache: new RenderCache(4, 0),
        diskCache: null
    };
}

test('while booting, /health says so with a 503 and the render routes are gated', async () =>
{
    const deps = dependencies();
    const app = createServer(deps);

    const health = await app.inject({method: 'GET', url: '/health'});

    assert.equal(health.statusCode, 503);
    assert.equal(health.json().status, 'starting');
    assert.equal(health.json().boot.reason, 'avatar pipeline');

    const render = await app.inject({method: 'GET', url: '/habbo-imaging/avatarimage?figure=hd-180-1'});

    assert.equal(render.statusCode, 503);
    assert.equal(render.headers['retry-after'], '5');
    assert.match(render.json().error, /starting: avatar pipeline/);

    deps.boot = {state: 'failed', reason: 'http://assets/ambreia/clothing/ cannot be read: fetch failed', since: Date.now()};

    const failed = await app.inject({method: 'GET', url: '/health'});

    assert.equal(failed.statusCode, 503);
    assert.equal(failed.json().status, 'failed');
    assert.match(failed.json().boot.reason, /cannot be read/);

    await app.close();
});

test('once ready, /health answers 200', async () =>
{
    const deps = dependencies();

    deps.boot = {state: 'ready', reason: null, since: Date.now()};

    const app = createServer(deps);
    const health = await app.inject({method: 'GET', url: '/health'});

    assert.equal(health.statusCode, 200);
    assert.equal(health.json().status, 'ok');

    await app.close();
});
