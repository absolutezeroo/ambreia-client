// Objets §17 (vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-items-design.md): each
// parser reads, and each serializer writes, the fields in the order of the server's
// Serializers/Rpg/Items and Parsers/Rpg/Items.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {RpgInventoryMessageParser} from '../src/parser/rpg/items/RpgInventoryMessageParser';
import {RpgItemResultMessageParser} from '../src/parser/rpg/items/RpgItemResultMessageParser';
import {RpgItemMoveMessage} from '../src/outgoing/rpg/items/RpgItemMoveMessage';
import {RpgItemSplitMessage} from '../src/outgoing/rpg/items/RpgItemSplitMessage';
import {RpgItemEquipMessage} from '../src/outgoing/rpg/items/RpgItemEquipMessage';
import {RpgItemUnequipMessage} from '../src/outgoing/rpg/items/RpgItemUnequipMessage';
import {RpgItemDestroyMessage} from '../src/outgoing/rpg/items/RpgItemDestroyMessage';
import {RpgItemClaimParcelMessage} from '../src/outgoing/rpg/items/RpgItemClaimParcelMessage';
import {RpgItemMoveMessageSerializer} from '../src/serializer/rpg/items/RpgItemMoveMessageSerializer';
import {RpgItemSplitMessageSerializer} from '../src/serializer/rpg/items/RpgItemSplitMessageSerializer';
import {RpgItemEquipMessageSerializer} from '../src/serializer/rpg/items/RpgItemEquipMessageSerializer';
import {RpgItemUnequipMessageSerializer} from '../src/serializer/rpg/items/RpgItemUnequipMessageSerializer';
import {RpgItemDestroyMessageSerializer} from '../src/serializer/rpg/items/RpgItemDestroyMessageSerializer';
import {RpgItemClaimParcelMessageSerializer} from '../src/serializer/rpg/items/RpgItemClaimParcelMessageSerializer';

/** A wrapper over values in wire order; a read of the wrong type or past the end is an error. */
function wire(...values: Array<number | string | boolean>): IMessageDataWrapper
{
    let at = 0;
    const next = <T>(type: string): T =>
    {
        if(at >= values.length) throw new Error('read past the end');
        if(typeof values[at] !== type) throw new Error(`expected a ${type} at ${at}, got ${typeof values[at]}`);

        return values[at++] as T;
    };

    return {readInt: () => next<number>('number'), readString: () => next<string>('string'), readBoolean: () => next<boolean>('boolean')} as unknown as IMessageDataWrapper;
}

test('RpgInventory: bag size, parcels, then each copy', () =>
{
    const inventory = new RpgInventoryMessageParser().parse(wire(30, 5, 2,
        41, 'item.weapon.rusted_sword', 1, 50, false, 1, 5,
        42, 'item.material.amber_shard', 12, -1, true, 0, 3));

    assert.equal(inventory.bagSize, 30);
    assert.equal(inventory.maxParcels, 5);
    assert.deepEqual(inventory.items, [
        {itemId: 41, definitionId: 'item.weapon.rusted_sword', quantity: 1, durability: 50, bound: false, container: 1, slot: 5},
        {itemId: 42, definitionId: 'item.material.amber_shard', quantity: 12, durability: -1, bound: true, container: 0, slot: 3}
    ]);
});

test('an RpgInventory cut short fails instead of reading zeros', () =>
{
    assert.throws(() => new RpgInventoryMessageParser().parse(wire(30, 5, 1, 41, 'item.weapon.rusted_sword', 1, 50, false, 1)), /past the end/);
});

test('RpgItemResult: action, then code', () =>
{
    assert.deepEqual({...new RpgItemResultMessageParser().parse(wire(3, 'wrong_class'))}, {action: 3, code: 'wrong_class'});
});

test('the six item messages serialize in the order the server parses them', () =>
{
    assert.deepEqual(new RpgItemMoveMessageSerializer().serialize(new RpgItemMoveMessage(2, 7)), [2, 7]);
    assert.deepEqual(new RpgItemSplitMessageSerializer().serialize(new RpgItemSplitMessage(2, 5, 9)), [2, 5, 9]);
    assert.deepEqual(new RpgItemEquipMessageSerializer().serialize(new RpgItemEquipMessage(4)), [4]);
    assert.deepEqual(new RpgItemUnequipMessageSerializer().serialize(new RpgItemUnequipMessage(8)), [8]);
    assert.deepEqual(new RpgItemDestroyMessageSerializer().serialize(new RpgItemDestroyMessage(4, 3)), [4, 3]);
    assert.deepEqual(new RpgItemClaimParcelMessageSerializer().serialize(new RpgItemClaimParcelMessage(1)), [1]);
});
