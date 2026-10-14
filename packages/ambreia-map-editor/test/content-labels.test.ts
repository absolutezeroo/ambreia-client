import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contentName, contentOptions} from '../src/ui/panels/contentLabels';

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
