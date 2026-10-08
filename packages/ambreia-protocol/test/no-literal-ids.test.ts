import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {HabboMessages} from '../src/HabboMessages';
import {Incoming, Outgoing} from '../src/Headers.generated';

// A release revision re-draws every id (spec 2026-10-08-random-header-revisions §4.1): a number
// typed here would keep the old one while the table moved.
test('HabboMessages types no message id: every one comes from Headers.generated', () =>
{
    const source = readFileSync(fileURLToPath(new URL('../src/HabboMessages.ts', import.meta.url)), 'utf8');

    assert.deepEqual(source.match(/\.set\(\s*\d+/g) ?? [], []);
});

test('every registered id is one the emulator declares', () =>
{
    const messages = new HabboMessages();
    const incoming = new Set<number>(Object.values(Incoming));
    const outgoing = new Set<number>(Object.values(Outgoing));

    assert.deepEqual([...messages.events.keys()].filter(id => !incoming.has(id)), []);
    assert.deepEqual([...messages.composers.keys()].filter(id => !outgoing.has(id)), []);
});
