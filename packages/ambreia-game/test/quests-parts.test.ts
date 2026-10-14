// The quests feature's parts (features/quests/): the log, the markers, the texts, the tracker, the toasts, the definitions.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IRpgQuestLogEntry} from '@ambreia/protocol/incoming/rpg/quests/IRpgQuestLogEntry';
import {RpgQuestResultMessage} from '@ambreia/protocol/incoming/rpg/quests/RpgQuestResultMessage';
import {QuestLogModel} from '../src/features/quests/model/QuestLogModel';
import {NpcMarkers} from '../src/features/quests/model/NpcMarkers';
import {objectiveLine, questTitle} from '../src/features/quests/questTexts';
import {objectiveIcon, QUEST_READY_ICON} from '../src/features/quests/objectiveIcons';
import {trackerLines} from '../src/features/quests/tracker/trackerLines';
import {resultToast} from '../src/features/quests/results/resultToast';
import {QuestDefinitions} from '../src/features/quests/definitions/QuestDefinitions';
import {choiceIcon} from '../src/features/quests/dialogue/choiceIcons';
import {markerLook} from '../src/features/quests/markers/markerLook';
import {RoomObjectCategoryEnum} from '@ambreia/iso/scene/object/RoomObjectCategoryEnum';
import {NpcClicks} from '../src/features/quests/npc/NpcClicks';
import {LazySlot} from '../src/features/quests/LazySlot';
import {rewardLines} from '../src/features/quests/journal/rewardLines';

const known: Record<string, string> = {
    'quest.camp.wolves.name': 'Les loups du bosquet',
    'quest.camp.wolves.objective.0': 'Loups des bois tués : %current%/%required%',
    'vortex.quest.ready': 'À rendre',
    'vortex.quest.result.accepted': 'Quête acceptée',
    'vortex.quest.done.banner': 'Quête terminée',
    'vortex.quest.error.quest.log_full': 'Journal plein',
    'vortex.quest.error.failed': 'Impossible'
};

const texts = {
    text: (key: string) => known[key] ?? key,
    textOr: (key: string, fallback: string) => known[key] ?? fallback,
    contentName: (key: string, id: string) => known[key] ?? id
};

const wolves = (state: string, current = 1): IRpgQuestLogEntry => ({questId: 'quest.camp.wolves', state, objectives: [{kind: 'kill', current, required: 3}]});

test('the log splits active and done, and tells its listeners', () =>
{
    const log = new QuestLogModel();
    let changes = 0;

    log.events.on('changed', () => changes++);
    log.set([wolves('active'), {questId: 'quest.old', state: 'done', objectives: []}]);

    assert.deepEqual(log.active().map(q => q.questId), ['quest.camp.wolves']);
    assert.deepEqual(log.done().map(q => q.questId), ['quest.old']);
    assert.equal(log.of('quest.old')?.state, 'done');
    assert.equal(changes, 1);
    log.clear();
    assert.equal(log.entries.length, 0);
});

test('the markers replace each other, and an NPC with an empty marker is still an NPC', () =>
{
    const markers = new NpcMarkers();

    markers.set([{objectId: 5, marker: 'available'}, {objectId: 6, marker: ''}]);
    assert.equal(markers.markerOf(5), 'available');
    assert.equal(markers.isNpc(6), true);
    assert.equal(markers.isNpc(7), false);

    markers.set([{objectId: 5, marker: 'ready'}]);
    assert.equal(markers.markerOf(5), 'ready');
    assert.equal(markers.isNpc(6), false);
});

test('an objective line fills its counts; a quest title is its content name', () =>
{
    assert.equal(objectiveLine(texts, 'quest.camp.wolves', 0, {kind: 'kill', current: 1, required: 3}), 'Loups des bois tués : 1/3');
    assert.equal(questTitle(texts, 'quest.camp.wolves'), 'Les loups du bosquet');
});

test('AMissingObjectiveText_FallsBackToKindAndCount', () =>
{
    assert.equal(objectiveLine(texts, 'quest.nope', 0, {kind: 'reach', current: 0, required: 1}), 'reach 0/1');
});

test('each kind has its icon, an unknown kind the default', () =>
{
    assert.notEqual(objectiveIcon('kill'), objectiveIcon('nope'));
    assert.ok(QUEST_READY_ICON.length > 0);
});

test('the tracker shows the first unmet objective, or « à rendre » when ready; done quests are not tracked', () =>
{
    const lines = trackerLines([wolves('active'), wolves('ready', 3), {questId: 'quest.old', state: 'done', objectives: []}], texts);

    assert.equal(lines.length, 2);
    assert.deepEqual(lines[0], {icon: objectiveIcon('kill'), title: 'Les loups du bosquet', objective: 'Loups des bois tués : 1/3', count: '1 / 3'});
    assert.deepEqual(lines[1], {icon: QUEST_READY_ICON, title: 'Les loups du bosquet', objective: 'À rendre', count: ''});
});

test('a result is a toast: success for ok, the code\'s text for a refusal', () =>
{
    assert.deepEqual(resultToast(texts, new RpgQuestResultMessage('accepted', 'ok', 'quest.camp.wolves')), {kind: 'success', title: 'Quête acceptée', text: 'Les loups du bosquet', ms: 3000});
    assert.deepEqual(resultToast(texts, new RpgQuestResultMessage('completed', 'ok', 'quest.camp.wolves'))?.title, 'Quête terminée');
    assert.deepEqual(resultToast(texts, new RpgQuestResultMessage('accepted', 'quest.log_full', 'quest.camp.wolves')), {kind: 'error', title: 'Journal plein', text: 'Les loups du bosquet', ms: 3000});
});

test('AnUnknownCode_ToastsTheGenericRefusal', () =>
{
    assert.equal(resultToast(texts, new RpgQuestResultMessage('talk', 'npc.weird', ''))?.title, 'Impossible');
});

test('the definitions load once, and a failed load is tried again', async () =>
{
    let calls = 0;
    let fail = true;
    const definitions = new QuestDefinitions(async () =>
    {
        calls++;
        if(fail) throw new Error('offline');

        return [{id: 'quest.camp.wolves', kind: 'quest', level: 2, objectives: [{kind: 'kill', count: 3}], rewards: [{kind: 'xp', amount: 120}]}];
    });

    await definitions.load();
    assert.equal(definitions.of('quest.camp.wolves'), null);
    fail = false;
    await definitions.load();
    await definitions.load();

    assert.equal(definitions.of('quest.camp.wolves')?.level, 2);
    assert.equal(calls, 2);
});

test('a choice\'s icon says what it does', () =>
{
    assert.notEqual(choiceIcon('accept'), choiceIcon('next'));
    assert.notEqual(choiceIcon('complete'), choiceIcon('accept'));
    assert.equal(choiceIcon('close'), choiceIcon('next'));
});

test('a marker\'s look: « ! » for a quest offered, « ? » to hand in, a dim « ? » under way, nothing otherwise', () =>
{
    assert.equal(markerLook('available')?.dim, false);
    assert.equal(markerLook('ready')?.dim, false);
    assert.equal(markerLook('active')?.dim, true);
    assert.equal(markerLook('ready')?.icon, markerLook('active')?.icon);
    assert.notEqual(markerLook('available')?.icon, markerLook('ready')?.icon);
    assert.equal(markerLook(''), null);
});

test('a click on an NPC talks to it; on anyone else it does nothing', () =>
{
    const talked: number[] = [];
    const clicks = new NpcClicks(id => id === 5, id => talked.push(id));

    assert.equal(clicks.selected(5, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER), true);
    assert.equal(clicks.selected(6, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER), false);
    assert.equal(clicks.selected(5, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE), false);
    assert.deepEqual(talked, [5]);
});

test('a lazy slot builds once, on first use, and only when it can', () =>
{
    let ready = false;
    let built = 0;
    const slot = new LazySlot(() => ready ? {n: ++built, dispose: () => undefined} : null);

    assert.equal(slot.get(), null);
    ready = true;
    assert.equal(slot.get()?.n, 1);
    assert.equal(slot.get()?.n, 1);
    assert.equal(built, 1);
});

test('the rewards read as lines: experience, then each item with its quantity', () =>
{
    assert.deepEqual(rewardLines({...texts, text: (key: string) => key === 'vortex.quest.reward.xp' ? 'Expérience' : key, contentName: (_key: string, id: string) => id === 'item.weapon.rusted_sword' ? 'Épée rouillée' : id}, {
        id: 'quest.camp.wolves',
        level: 1,
        objectives: [],
        rewards: [{kind: 'xp', amount: 120}, {kind: 'items', items: [{item: 'item.weapon.rusted_sword', quantity: 1}]}, {kind: 'gold', amount: 5}]
    }), [{name: 'Expérience', value: '120'}, {name: 'Épée rouillée', value: '×1'}]);
});
