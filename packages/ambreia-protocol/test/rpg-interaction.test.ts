// F3b §7 (vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-interaction-design.md): each
// parser reads, and the serializer writes, the fields in the order of the server's
// Serializers/Rpg/Interaction and Parsers/Rpg/Interaction.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {RpgZoneInteractivesMessageParser} from '../src/parser/rpg/interaction/RpgZoneInteractivesMessageParser';
import {RpgTargetMessageParser} from '../src/parser/rpg/interaction/RpgTargetMessageParser';
import {RpgTargetSelectMessage} from '../src/outgoing/rpg/interaction/RpgTargetSelectMessage';
import {RpgTargetSelectMessageSerializer} from '../src/serializer/rpg/interaction/RpgTargetSelectMessageSerializer';

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

test('RpgZoneInteractives: count, then each object and its interaction', () =>
{
    assert.deepEqual(new RpgZoneInteractivesMessageParser().parse(wire(3, 1, 'door', 2, 'sign', 3, 'door')).objects,
        [{objectId: 1, interaction: 'door'}, {objectId: 2, interaction: 'sign'}, {objectId: 3, interaction: 'door'}]);
    assert.deepEqual(new RpgZoneInteractivesMessageParser().parse(wire(0)).objects, []);
});

test('RpgTarget: object, kind, name, level, class', () =>
{
    assert.deepEqual({...new RpgTargetMessageParser().parse(wire(4, 'player', 'Boromir', 6, 'class.warrior'))},
        {objectId: 4, kind: 'player', name: 'Boromir', level: 6, classId: 'class.warrior'});
    assert.throws(() => new RpgTargetMessageParser().parse(wire(0, '', '', 0)), /past the end/);
});

test('RpgTargetSelect writes the object id', () =>
{
    assert.deepEqual(new RpgTargetSelectMessageSerializer().serialize(new RpgTargetSelectMessage(4)), [4]);
    assert.deepEqual(new RpgTargetSelectMessageSerializer().serialize(new RpgTargetSelectMessage(0)), [0]);
});
