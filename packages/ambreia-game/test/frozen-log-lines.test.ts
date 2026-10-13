// A combat log line is rendered when it is written: a monster's name leaves with the monster, and
// the panel, opened later or refilled by a chip, must still say who hit whom.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {ILogEntry} from '../src/features/combat/ILogEntry';
import {FrozenLines} from '../src/features/combat/views/FrozenLines';

test('a line keeps the names it was written with', () =>
{
    let wolf = 'Loup des bois';
    const lines = new FrozenLines(entry => ({text: `${wolf} ${entry.key}`, icon: '', color: 0}));
    const entry: ILogEntry = {at: 1, kind: 'taken', key: 'vous inflige 3', params: {source: '15'}};

    lines.of(entry);
    wolf = '';

    assert.equal(lines.of(entry).text, 'Loup des bois vous inflige 3');
});
