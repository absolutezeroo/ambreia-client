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

test('the test ticket names the cell when there is one', async () =>
{
    const seen: string[] = [];
    const api = new EditorApiClient('http://x', async url =>
    {
        seen.push(url);

        return new Response(JSON.stringify({ssoToken: 't', roomId: 5}));
    });

    assert.deepEqual(await api.testTicket('v', {x: 2, y: 3}), {ssoToken: 't', roomId: 5});
    await api.testTicket('v', null);

    assert.deepEqual(seen, ['http://x/api/editor/zones/v/test?x=2&y=3', 'http://x/api/editor/zones/v/test']);
});

test('the monsters come from the editor route, the names from the content texts', async () =>
{
    const guardian = {id: 'monster.grove.guardian', rank: 'boss', behavior: 'melee', aggressive: true, figure: '12 0 6A8F3A'};
    const seen: string[] = [];
    const api = new EditorApiClient('', async url =>
    {
        seen.push(url);

        return url.endsWith('/monsters')
            ? new Response(JSON.stringify([guardian]))
            : new Response('# comment\r\nmonster.grove.guardian.name=Gardien du bosquet\r\nbroken line\r\n');
    });

    assert.deepEqual(await api.monsters(), [guardian]);
    assert.deepEqual([...await api.texts()], [['monster.grove.guardian.name', 'Gardien du bosquet']]);
    assert.deepEqual(seen, ['/api/editor/monsters', '/api/public/content/texts/fr']);
});

test('the dialogues come from the editor route, the quests from the public definitions', async () =>
{
    const seen: string[] = [];
    const api = new EditorApiClient('', async url =>
    {
        seen.push(url);

        return url.endsWith('/dialogues')
            ? new Response(JSON.stringify(['dialogue.camp.elder']))
            : new Response(JSON.stringify([{id: 'quest.camp.wolves', level: 1, objectives: [], rewards: []}]));
    });

    assert.deepEqual(await api.dialogues(), ['dialogue.camp.elder']);
    assert.deepEqual(await api.quests(), ['quest.camp.wolves']);
    assert.deepEqual(seen, ['/api/editor/dialogues', '/api/public/content/definitions/quest']);
});
