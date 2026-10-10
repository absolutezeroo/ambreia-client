// M1c: what a slow or a stun does to a combatant on the client, and the effects panel's times.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {holdBack, statusTime, type IStatusDefinition} from '../src/features/skills/RpgSkillSession';

const DEFS: Record<string, IStatusDefinition> = {
    'status.frozen': {id: 'status.frozen', type: 'slow', durationMs: 5000, slowPercent: 60},
    'status.chilled': {id: 'status.chilled', type: 'slow', durationMs: 5000, slowPercent: 30},
    'status.stunned': {id: 'status.stunned', type: 'stun', durationMs: 2000},
    'status.enraged': {id: 'status.enraged', type: 'buff', durationMs: 0}
};
const definition = (id: string): IStatusDefinition | null => DEFS[id] ?? null;
const status = (statusId: string, remainingMs = 3000) => ({statusId, remainingMs, stacks: 1});

test('the strongest slow sets the step, as the server walks it (500 × 100 / (100 − %))', () =>
{
    assert.deepEqual(holdBack([status('status.chilled'), status('status.frozen')], definition), {statusId: 'status.frozen', stepMs: 1250});
    assert.deepEqual(holdBack([status('status.enraged', -1)], definition), {statusId: null, stepMs: null});
    assert.deepEqual(holdBack([status('status.unknown')], definition), {statusId: null, stepMs: null});
});

test('a stun marks before a slow, and the slow still sets the step', () =>
{
    assert.deepEqual(holdBack([status('status.frozen'), status('status.stunned')], definition), {statusId: 'status.stunned', stepMs: 1250});
});

test('a status shows its seconds left, a status without end none', () =>
{
    assert.equal(statusTime(4200), '5 s');
    assert.equal(statusTime(90_000), '2 min');
    assert.equal(statusTime(-1), '');
});
