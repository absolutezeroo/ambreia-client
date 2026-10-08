import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nodeWindowManager} from './node-window-host';
import type {IItemGridWindow} from '../src/components/IItemGridWindow';

test('populate fills rows: 52 px items in a 270 px grid make five columns', () =>
{
    const wm = nodeWindowManager();

    wm.registerWidgetLayout('grid_xml', '<layout><window><itemgrid_vertical name="grid" x="0" y="0" width="270" height="300" params="16"/></window></layout>');
    wm.registerWidgetLayout('tile_xml', '<layout><window><container name="tile" x="0" y="0" width="52" height="52" params="16"/></window></layout>');

    const grid = wm.buildWidgetLayout('grid_xml') as unknown as IItemGridWindow;

    grid.populate(Array.from({length: 12}, () => wm.buildWidgetLayout('tile_xml')!));

    assert.equal(grid.numColumns, 5);
    assert.equal(grid.numGridItems, 12);

    wm.dispose();
});
