// The zone's notices (an area's name, a level advice): a toast, not a modal alert.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {zoneNotice} from '../src/features/hud/zoneNotice';

test('an area entered is a toast: its first line the title, the rules under it', () =>
{
    assert.deepEqual(zoneNotice('zone.area', 'Vous entrez : Camp\nZone sûre'), {kind: 'info', title: 'Vous entrez : Camp', text: 'Zone sûre', ms: 4000});
});

test('a one-line zone notice has no text under its title', () =>
{
    assert.deepEqual(zoneNotice('zone.level', 'Niveau conseillé : 5.'), {kind: 'info', title: 'Niveau conseillé : 5.', text: '', ms: 4000});
});

test('a dialog that is not the zone\'s is left to the alert', () =>
{
    assert.equal(zoneNotice('admin', 'Hello'), null);
});
