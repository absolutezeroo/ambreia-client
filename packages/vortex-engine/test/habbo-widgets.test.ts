import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HabboWindowManager} from '@ambreia/game/window/HabboWindowManager';
import type {IContext} from '@ambreia/kernel/runtime/IContext';

// The 25 types of HabboWidgetFactory.WIDGET_REGISTRY before J3 split them between the kit and the
// engine: the layouts name them, so none may go missing in the move.
const TYPES = [
    'avatar_image', 'badge_image', 'balloon', 'countdown', 'furniture_image', 'hover_bitmap',
    'illumina_border', 'illumina_chat_bubble', 'illumina_input', 'limited_item_overlay_grid',
    'limited_item_overlay_preview', 'limited_item_overlay_supply', 'pet_image', 'pixel_limit',
    'product_icon', 'product_image', 'progress_indicator', 'rarity_item_overlay_grid',
    'rarity_item_overlay_preview', 'room_previewer', 'room_thumbnail', 'room_user_count',
    'running_number', 'separator', 'updating_timestamp'
];

test('the engine window manager offers the 25 widget types (kit + game)', () =>
{
    const manager = new HabboWindowManager({} as IContext, {interpolate: (text: string) => text});

    assert.deepEqual(manager.widgets.types(), TYPES);
});
