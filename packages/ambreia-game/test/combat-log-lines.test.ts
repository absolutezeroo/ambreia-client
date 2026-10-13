// M1d §4: the combat log's lines, from the model's entries: each kind in its filter, each line's
// text with the names resolved (« Vous » for the player), the owner's icons and colours.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {logClock, logFilterOf, logLine, LOG_FILTERS} from '../src/features/combat/views/combatLogLines';

const text = (key: string, ...params: string[]): string => `${key}(${params.join(',')})`;
const names = {name: (objectId: number) => (objectId === 1 ? 'YOU' : objectId === 9 ? 'Wolf' : ''), content: (id: string) => `«${id}»`};

test('every kind falls in one filter of the owner\'s bar', () =>
{
    assert.deepEqual(LOG_FILTERS.map(filter => filter.key), ['vortex.combat.log.all', 'vortex.combat.log.damage', 'vortex.combat.log.heals', 'vortex.combat.log.system']);
    assert.equal(logFilterOf('dealt'), 'damage');
    assert.equal(logFilterOf('taken'), 'damage');
    assert.equal(logFilterOf('miss'), 'damage');
    assert.equal(logFilterOf('heal'), 'heals');
    for(const kind of ['status', 'cast', 'death', 'resurrect', 'levelup', 'refused'] as const) assert.equal(logFilterOf(kind), 'system');
});

test('a line resolves its object ids to names and its skill or status ids to content names', () =>
{
    const line = logLine({at: 0, kind: 'dealt', key: 'vortex.combat.log.dealt.crit', params: {amount: '12', absorbed: '0', source: '1', target: '9', skill: 'skill.mage.bolt'}}, text, names);

    assert.equal(line.text, 'vortex.combat.log.dealt.crit(amount,12,absorbed,0,source,YOU,target,Wolf,skill,«skill.mage.bolt»)');
    assert.ok(line.icon.startsWith('rpg/ui-icons/'));
    assert.equal(typeof line.color, 'number');

    const status = logLine({at: 0, kind: 'status', key: 'vortex.combat.log.status.expired', params: {status: 'status.burn', target: '9'}}, text, names);

    assert.equal(status.text, 'vortex.combat.log.status.expired(status,«status.burn»,target,Wolf)');
});

test('a refused skill reads as « skill : reason », the reason being its own text', () =>
{
    const line = logLine({at: 0, kind: 'refused', key: 'vortex.skill.error.no_mana', params: {skill: 'skill.mage.bolt'}}, text, names);

    assert.equal(line.text, 'vortex.skill.error(skill,«skill.mage.bolt»,reason,vortex.skill.error.no_mana())');
});

test('a line\'s time reads [HH:MM:SS] on the local clock', () =>
{
    assert.equal(logClock(new Date(2026, 9, 13, 7, 5, 9).getTime()), '[07:05:09]');
});
