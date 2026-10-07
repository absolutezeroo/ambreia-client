import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WindowManager} from '@ambreia/ui/kit/WindowManager';
import {HabboWindowManager} from '@ambreia/game/window/HabboWindowManager';
import type {IContext} from '@ambreia/kernel/runtime/IContext';
import {GLAZE_GAME_WIDGET_TYPES} from '../src/boot/GameWidgetPlaceholder';

// Glaze cannot import the engine, so it spells the game widget types out; this keeps the copy
// in step with the engine's registerHabboWidgets().
test('Glaze offers every widget type the engine builds', () =>
{
    const options = {interpolate: (text: string) => text};
    const glaze = new WindowManager(options);

    for(const type of GLAZE_GAME_WIDGET_TYPES) glaze.widgets.register(type, () => null);

    assert.deepEqual(glaze.widgets.types(), new HabboWindowManager({} as IContext, options).widgets.types());
});
