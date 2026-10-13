// The inventory window's parts (features/inventory/window/): the item's lines, the search field, the actions.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IRpgItemEntry} from '@ambreia/protocol/incoming/rpg/items/IRpgItemEntry';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import {RpgItemDestroyMessage} from '@ambreia/protocol/outgoing/rpg/items/RpgItemDestroyMessage';
import {RpgItemEquipMessage} from '@ambreia/protocol/outgoing/rpg/items/RpgItemEquipMessage';
import {itemKindLine, thousands} from '../src/features/inventory/window/itemLines';
import {SearchField} from '../src/features/inventory/window/SearchField';
import {ItemActions} from '../src/features/inventory/window/ItemActions';

const texts = {
    text: (key: string, ...params: string[]) => [key, ...params].join(' '),
    contentName: (_key: string, id: string) => id
};

function item(definitionId: string, extra: Partial<IRpgItemEntry> = {}): IRpgItemEntry
{
    return {itemId: 1, definitionId, container: 0, slot: 3, quantity: 1, bound: false, durability: -1, ...extra} as IRpgItemEntry;
}

test('gold and gems read in groups of three, an unknown amount as 0', () =>
{
    assert.equal(thousands(1234567), '1 234 567');
    assert.equal(thousands(null), '0');
});

test('the kind line says the kind, then bound and durability when they apply', () =>
{
    assert.equal(itemKindLine(texts, item('item.weapon.rusted_sword', {bound: true, durability: 50})), 'weapon · vortex.inventory.bound · vortex.inventory.durability value 50');
    assert.equal(itemKindLine(texts, item('item.consumable.minor_potion')), 'consumable');
});

test('the search field clears its placeholder on click, restores it when left empty, and reads the query on key up', () =>
{
    const queries: string[] = [];
    const search = new SearchField(() => 'Rechercher', query => queries.push(query));
    const field = {name: 'search_input', text: 'Rechercher'} as unknown as IWindow & {text: string};
    const event = (type: string) => ({type}) as WindowEvent;

    assert.equal(search.handle(event('WME_CLICK'), field), true);
    assert.equal(field.text, '');
    field.text = '  Épée ';
    search.handle(event('WKE_KEY_UP'), field);
    assert.deepEqual(queries, ['épée']);
    field.text = ' ';
    search.handle(event('WE_UNFOCUSED'), field);
    assert.equal(field.text, 'Rechercher');
    assert.equal(search.handle(event('WME_CLICK'), {name: 'other'} as IWindow), false);
});

test('equip is sent for equipment only; drop only once the confirmation says OK', () =>
{
    const sent: object[] = [];
    let answer: ((dialog: {dispose(): void}, event: {type: string}) => void) | null = null;
    const actions = new ItemActions({send: message => { sent.push(message); return true; }}, (_title, _text, onAnswer) => answer = onAnswer, texts);

    actions.equip(item('item.consumable.minor_potion'));
    actions.equip(item('item.weapon.rusted_sword'));
    assert.deepEqual(sent.map(m => m.constructor), [RpgItemEquipMessage]);

    actions.drop(item('item.consumable.minor_potion', {quantity: 2}));
    assert.equal(sent.length, 1, 'nothing until the answer');
    answer!({dispose() {}}, {type: 'WE_CANCEL'});
    assert.equal(sent.length, 1);
    actions.drop(item('item.consumable.minor_potion', {quantity: 2}));
    answer!({dispose() {}}, {type: 'WE_OK'});
    assert.deepEqual(sent.map(m => m.constructor), [RpgItemEquipMessage, RpgItemDestroyMessage]);
});
