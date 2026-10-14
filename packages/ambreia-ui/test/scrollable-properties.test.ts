import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nodeWindowManager} from './node-window-host';
import {WindowType} from '../src/enum/WindowType';
import type {IItemGridWindow} from '../src/components/IItemGridWindow';
import type {IItemListWindow} from '../src/components/IItemListWindow';

const DEFAULTS = {threshold: 10, background: false, blend: 1, color: 0xffffffff, widthMin: -1, widthMax: -1, heightMin: -1, heightMax: -1};

// Without their `properties` setter, a scrollable grid or list dropped its layout's `spacing` and every
// view set it from code. Their inner grid/list comes from the element description's `window_layout`
// (habbo_window_layout_scrollable_*_xml, which gives the inner one its own `spacing` 0): both are
// given here, the Node host loads neither.
for(const kind of ['itemgrid', 'itemlist'] as const)
{
    test(`a scrollable ${kind} passes its layout's spacing to the inner one`, () =>
    {
        const wm = nodeWindowManager();
        const type = `scrollable_${kind}_vertical`;
        const inner = kind === 'itemgrid' ? '_ITEMGRID' : '_ITEMLIST';
        const windowLayout = `habbo_window_layout_${type}_xml`;

        wm.loadElementDescription({id: 'test', source: 'test', elements: [{
            type, typeId: kind === 'itemgrid' ? WindowType.SCROLLABLE_ITEMGRID_VERTICAL : WindowType.SCROLLABLE_ITEMLIST_VERTICAL,
            intent: 'default', style: 0, renderer: 'null', asset: '', layout: '', windowLayout, defaults: DEFAULTS, states: []
        }]});
        wm.registerWidgetLayout(windowLayout, '<layout width="40" height="40"><window>'
            + `<${kind}_vertical x="0" y="0" width="23" height="40" params="2193" name="${inner}" tags="${inner}, _EXCLUDE, _INTERNAL">`
            + '<variables><var key="spacing" value="0" type="int"/></variables>'
            + `</${kind}_vertical>`
            + '<scrollbar_vertical x="23" y="0" width="17" height="40" params="2129" name="_SCROLLBAR" tags="_SCROLLBAR, _EXCLUDE, _INTERNAL"/>'
            + '</window></layout>');
        wm.registerWidgetLayout('scroll_xml', `<layout><window><${type} name="scroll" x="0" y="0" width="200" height="200" params="16">`
            + '<variables><var key="spacing" value="7" type="int"/></variables>'
            + `</${type}></window></layout>`);

        const scroll = wm.buildWidgetLayout('scroll_xml') as unknown as IItemGridWindow | IItemListWindow;

        assert.equal(scroll.spacing, 7);

        wm.dispose();
    });
}
