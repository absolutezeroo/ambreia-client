// Map editor spec §2: the API client maps the server's statuses without a network.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EditorApiClient} from '../src/api/EditorApiClient';
import {EditorApiError} from '../src/api/EditorApiError';
import {blankZone} from '../src/zone/blankZone';

const reply = (status: number, body?: unknown) =>
    async () => new Response(body === undefined ? null : JSON.stringify(body), {status});

test('a zone never saved has no latest document', async () =>
{
    assert.equal(await new EditorApiClient('', reply(404)).latestDocument('v'), null);
});

test('a refused or raced save comes back as a result with its findings', async () =>
{
    const findings = [{severity: 'Error', code: 'Conflict', elementId: null, message: 'again'}];
    const raced = await new EditorApiClient('', reply(409, {saved: false, version: null, published: false, findings}))
        .save('v', blankZone('v', 'V'));

    assert.equal(raced.saved, false);
    assert.equal(raced.findings[0].code, 'Conflict');
});

test('a lock held by someone else is false, not an error', async () =>
{
    assert.equal(await new EditorApiClient('', reply(409, {error: 'editor.zone_locked'})).lock('v'), false);
    assert.equal(await new EditorApiClient('', reply(200, {})).lock('v'), true);
});

test('a refusal carries the server code', async () =>
{
    await assert.rejects(
        new EditorApiClient('', reply(403, {error: 'editor.forbidden'})).listZones(),
        (e: unknown) => e instanceof EditorApiError && e.status === 403 && e.code === 'editor.forbidden'
    );
});

test('requests carry the session cookie and the document as JSON', async () =>
{
    const seen: {url: string; init?: RequestInit}[] = [];
    const api = new EditorApiClient('http://x', async (url, init) =>
    {
        seen.push({url, init});

        return new Response(JSON.stringify({saved: true, version: 3, published: false, findings: []}));
    });

    await api.save('my zone', blankZone('v', 'V'), 'relief');

    assert.equal(seen[0].url, 'http://x/api/editor/zones/my%20zone/versions?comment=relief');
    assert.equal(seen[0].init?.credentials, 'include');
    assert.equal(JSON.parse(String(seen[0].init?.body)).settings.id, 'v');
});
