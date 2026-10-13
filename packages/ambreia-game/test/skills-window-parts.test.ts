// The skills window's parts (features/skills/window/): the catalogue, the stat lines, the bar editor.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {ISkillDefinition} from '../src/features/skills/ISkillDefinition';
import {SkillBarEditor} from '../src/features/skills/window/SkillBarEditor';
import {SkillCatalog} from '../src/features/skills/window/SkillCatalog';
import {skillStatLines} from '../src/features/skills/window/skillStatLines';

const skill = (id: string, level: number, kind: 'damage' | 'heal' | 'apply_status', extra: Partial<ISkillDefinition> = {}): ISkillDefinition => ({
    id, classes: ['mage'], level, target: 'enemy', globalCooldown: true, type: 'instant', cost: 10, castMs: 0, channelMs: 0, range: 5, cooldownMs: 0, vfx: null,
    effects: [{kind, base: 12, coefficient: 0, status: kind === 'apply_status' ? 'status.frozen' : null} as never],
    ...extra
});

const DEFINITIONS = [skill('bolt', 1, 'damage'), skill('mend', 3, 'heal'), skill('nova', 2, 'apply_status'), skill('storm', 9, 'damage')];

function session(known: string[], bar: string[] = [])
{
    const set: Array<[number, string]> = [];

    return {
        set,
        known, bar, definitions: DEFINITIONS,
        definition: (id: string) => DEFINITIONS.find(definition => definition.id === id) ?? null,
        statusDefinition: () => ({durationMs: 4000}) as never,
        setBar: (slot: number, action: string) => { set.push([slot, action]); }
    };
}

test('the class\'s skills: learned first, then by level; the filter keeps a camp, the search a name', () =>
{
    const catalog = new SkillCatalog(session(['mend', 'nova']), id => `Skill ${id}`);
    const ids = (): string[] => catalog.entries('mage').map(entry => `${entry.skillId}${entry.learned ? '*' : ''}`);

    assert.deepEqual(ids(), ['nova*', 'mend*', 'bolt', 'storm']);

    catalog.filter = 'damage';
    assert.deepEqual(ids(), ['bolt', 'storm']);

    catalog.filter = null;
    catalog.search = 'mend';
    assert.deepEqual(ids(), ['mend*']);
});

test('a skill\'s stat lines: cost, cooldown, range, its status, its amount, its cast time last', () =>
{
    const text = {
        text: (key: string, ...params: string[]) => params.length > 0 ? `${key}(${params.filter((_, i) => i % 2 === 1).join(',')})` : key,
        contentName: (_key: string, id: string) => id
    };
    const lines = skillStatLines(skill('nova', 2, 'apply_status', {cooldownMs: 8000}), text, () => ({durationMs: 4000}) as never);

    assert.deepEqual(lines.map(line => `${line.label}=${line.value}`), [
        'vortex.skill.mana_cost=10',
        'vortex.skill.cooldown=vortex.skill.seconds(8)',
        'vortex.skill.range=vortex.skill.tiles(5)',
        'vortex.skill.effect=status.frozen (vortex.skill.seconds(4))',
        'vortex.skill.cast_time=vortex.skill.instant'
    ]);
});

test('a chosen skill goes in the clicked slot, the same one again empties it; in « Raccourcis » a click only selects', () =>
{
    const state = session(['bolt', 'mend'], ['skill:bolt']);
    const editor = new SkillBarEditor(state);

    assert.equal(editor.click(1, 'mend', false), false);
    assert.deepEqual(state.set, [[1, 'skill:mend']]);

    assert.equal(editor.click(0, 'bolt', false), false);
    assert.deepEqual(state.set[1], [0, '']);

    assert.equal(editor.click(0, 'bolt', true), true);
    assert.equal(editor.slot, 0);
    assert.equal(state.set.length, 2);
});

test('restoring the defaults puts the learned skills in level order, then empties the rest', () =>
{
    const state = session(['storm', 'bolt', 'mend']);

    new SkillBarEditor(state).restoreDefaults();
    assert.deepEqual(state.set, [[0, 'skill:bolt'], [1, 'skill:mend'], [2, 'skill:storm'], [3, ''], [4, ''], [5, '']]);
});
