// The skills feature's in-world parts (features/skills/play/).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IScopedTimer} from '@ambreia/kernel/feature/FeatureScope';
import {DefinitionsLoader} from '../src/features/skills/play/DefinitionsLoader';
import {HeldBackMarks} from '../src/features/skills/play/HeldBackMarks';
import {SkillBarHud} from '../src/features/skills/play/SkillBarHud';
import {WhileTicker} from '../src/features/skills/play/WhileTicker';

test('the definitions load once; a failed load is tried again next time', async () =>
{
    let calls = 0;
    let fail = true;
    const defined: unknown[][] = [];
    const loader = new DefinitionsLoader(async kind =>
    {
        calls++;
        if(fail) throw new Error(`${kind}: HTTP 500`);

        return [kind];
    }, (skills, statuses, classes) => { defined.push([skills, statuses, classes]); });

    await loader.load();
    assert.equal(defined.length, 0);

    fail = false;
    await loader.load();
    await loader.load();
    assert.deepEqual(defined, [[['skill'], ['status'], ['class']]]);
    assert.equal(calls, 6);
});

test('a bar slot shows its skill\'s icon, cost, tooltip and the end of its cooldown on the wall clock', () =>
{
    const slots: unknown[] = [];
    const book = {
        bar: ['skill:bolt', ''],
        readyAt: () => 1500,
        definition: () => ({cost: 10, cooldownMs: 2500}) as never
    };
    const hud = new SkillBarHud(book, () => ({text: (key: string) => key, textOr: (_key: string, fallback: string) => fallback, contentName: (_key: string, id: string) => id}), () => 'icon.bolt', written => slots.push(...written), () => 1000, () => 50_000);

    hud.render();

    assert.equal(slots.length, 6);
    assert.deepEqual(slots[1], {icon: null, cooldownEnd: undefined, cost: undefined, tip: undefined});

    const bolt = slots[0] as {icon: string; cooldownEnd: number; cost: number; tip: {title: string; meta: string; shortcut: string}};

    assert.equal(bolt.icon, 'icon.bolt');
    assert.equal(bolt.cooldownEnd, 50_500);
    assert.equal(bolt.cost, 10);
    assert.equal(bolt.tip.title, 'bolt');
    assert.equal(bolt.tip.meta, 'vortex.skill.rank.short · vortex.skill.mana_cost : 10 · vortex.skill.cooldown.short : 2.5 s');
});

test('a slowed combatant is marked and walks slower; leaving the zone gives everyone their pace back', () =>
{
    const marks: Array<[number, string | null]> = [];
    const steps: Array<[number, number | null]> = [];
    const held = new HeldBackMarks(
        id => id === 'status.frozen' ? {id, type: 'slow', slowPercent: 50, durationMs: 0, vfx: null} : null,
        id => `icon:${id}`,
        (objectId, icon) => marks.push([objectId, icon]),
        (objectId, stepMs) => steps.push([objectId, stepMs])
    );

    held.update(7, [{statusId: 'status.frozen', endsAt: null, stacks: 1}]);
    held.clear();

    assert.deepEqual(marks, [[7, 'icon:status.frozen']]);
    assert.deepEqual(steps, [[7, 1000], [7, null]]);
});

test('the ticker runs while asked, once, and stops when no longer', () =>
{
    let started = 0;
    let cleared = 0;
    const ticker = new WhileTicker((): IScopedTimer => { started++; return {active: true, clear: () => { cleared++; }}; }, () => {}, 100);

    ticker.sync(true);
    ticker.sync(true);
    ticker.sync(false);
    ticker.sync(false);
    assert.deepEqual([started, cleared], [1, 1]);
});
