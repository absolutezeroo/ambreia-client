// The inventory's pure rules (features/inventory/items): which tab lists an item, what the bag
// grid shows, and the server's content texts (Objets §17.3).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IRpgItemEntry} from '@ambreia/protocol/incoming/rpg/items/IRpgItemEntry';
import {bagView, EQUIPMENT_SLOTS, isEquipment, itemIcon, itemTab, parseTexts} from '../src/features/inventory/items';

const item = (itemId: number, definitionId: string, container: number, slot: number, quantity = 1): IRpgItemEntry =>
    ({itemId, definitionId, quantity, durability: -1, bound: false, container, slot});

test('an item is listed under the tab of its kind', () =>
{
    assert.equal(itemTab('item.weapon.rusted_sword'), 'tab_equipment');
    assert.equal(itemTab('item.ring.copper_ring'), 'tab_equipment');
    assert.equal(itemTab('item.material.amber_shard'), 'tab_resources');
    assert.equal(itemTab('item.quest.sealed_letter'), 'tab_quests');
    assert.equal(itemTab('item.consumable.minor_potion'), 'tab_items');
    assert.equal(itemTab('item.furniture.amber_throne'), 'tab_items');
    assert.equal(isEquipment('item.consumable.minor_potion'), false);
    assert.equal(itemIcon('item.weapon.unknown_axe'), itemIcon('item.weapon.rusted_sword'));
});

test('the equipment slots follow the server numbers (0 head … 9 ring 2)', () =>
{
    assert.equal(EQUIPMENT_SLOTS[0], 'head');
    assert.equal(EQUIPMENT_SLOTS[5], 'weapon');
    assert.equal(EQUIPMENT_SLOTS[9], 'ring2');
    assert.equal(EQUIPMENT_SLOTS.length, 10);
});

test('the grid shows the tab\'s bag items in bag order, then the free cases; worn items stay out', () =>
{
    const items = [
        item(1, 'item.material.amber_shard', 0, 4, 12),
        item(2, 'item.weapon.short_bow', 0, 2),
        item(3, 'item.weapon.rusted_sword', 1, 5),
        item(4, 'item.head.leather_cap', 0, 0)
    ];
    const cases = bagView(items, 5, 'tab_equipment', () => true);

    assert.deepEqual(cases.map(entry => entry?.itemId ?? null), [4, 2, null, null]);
    assert.deepEqual(bagView(items, 5, 'tab_resources', () => false).map(entry => entry?.itemId ?? null), [null, null]);
});

test('content texts are key=value lines', () =>
{
    assert.deepEqual(parseTexts('item.weapon.rusted_sword.name=Épée rouillée\r\n# comment\n\nitem.a.b.description=x = y\n'),
        {'item.weapon.rusted_sword.name': 'Épée rouillée', 'item.a.b.description': 'x = y'});
});
