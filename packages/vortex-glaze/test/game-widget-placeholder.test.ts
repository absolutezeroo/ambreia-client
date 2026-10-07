import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nodeWindowManager} from '../../ambreia-ui/test/node-window-host';
import type {PropertyStruct} from '@ambreia/ui/utils/PropertyStruct';
import {registerGameWidgetPlaceholders} from '../src/boot/GameWidgetPlaceholder';

// Glaze has no game widget, but an edited layout must save their properties back unchanged.
const LAYOUT = `<layout><window>
  <widget x="3" y="4" width="33" height="34" params="16" style="100" name="user_avatar">
    <variables>
      <var key="widget_type" value="avatar_image" type="String"/>
      <var key="avatar_image:only_head" value="true" type="Boolean"/>
      <var key="avatar_image:cropped" value="true" type="Boolean"/>
    </variables>
  </widget>
</window></layout>`;

test('a game widget keeps its own properties in Glaze', () =>
{
    const manager = nodeWindowManager(registerGameWidgetPlaceholders);

    manager.registerWidgetLayout('probe_xml', LAYOUT);

    const window = manager.buildWidgetLayout('probe_xml')!;
    const own = (window.properties as PropertyStruct[]).filter(p => p.key.startsWith('avatar_image:'));

    assert.deepEqual(own.map(p => [p.key, p.value]), [['avatar_image:only_head', true], ['avatar_image:cropped', true]]);

    manager.dispose();
});
