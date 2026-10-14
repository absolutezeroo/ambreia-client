import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contentName, contentOptions, libraryRows} from '../src/ui/panels/contentLabels';

const names = new Map([['quest.camp.wolves.name', 'Les loups du bosquet']]);

test('a menu names the served ids in French and keeps an id the zone still uses, flagged', () =>
{
    assert.deepEqual(contentOptions(['quest.camp.wolves', 'quest.camp.report'], ['quest.gone', '', 'quest.camp.wolves', 'quest.gone'], names), [
        ['quest.camp.wolves', 'Les loups du bosquet'],
        ['quest.camp.report', 'quest.camp.report'],
        ['quest.gone', 'quest.gone (inconnu)']
    ]);
});

test('without the server\'s list, only the ids the zone uses are offered', () =>
{
    assert.deepEqual(contentOptions([], ['dialogue.camp.elder'], names), [['dialogue.camp.elder', 'dialogue.camp.elder (inconnu)']]);
    assert.equal(contentName('quest.camp.wolves', names), 'Les loups du bosquet');
    assert.equal(contentName('quest.camp.report', names), 'quest.camp.report');
});

test('a library lists the ids by French name and searches the name and the id', () =>
{
    const ids = ['quest.camp.report', 'quest.camp.wolves'];

    assert.deepEqual(libraryRows(ids, names, '').map(r => r.title), ['Les loups du bosquet', 'quest.camp.report']);
    assert.deepEqual(libraryRows(ids, names, 'LOUPS').map(r => r.id), ['quest.camp.wolves']);
    assert.deepEqual(libraryRows(ids, names, 'report').map(r => r.id), ['quest.camp.report']);
});
