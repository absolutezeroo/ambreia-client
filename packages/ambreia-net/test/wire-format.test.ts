// Spec §11, J1: what the client writes, the client reads back — int, short, string, boolean, list.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WireFormatter} from '../src/wireformat/WireFormatter';
import {Short} from '../src/util/Short';
import {Float} from '../src/util/Float';
import type {IConnection} from '../src/connection/IConnection';

const PLAIN = {getServerToClientEncryption: () => null} as unknown as IConnection;

test('a frame written by the formatter reads back field by field', () =>
{
    const formatter = new WireFormatter();
    const frame = formatter.encode(1234, [42, new Short(-7), 'héllo', true, false, [3, 'a']]);

    frame.position = 0;

    const [wrapper] = formatter.splitMessages(frame, PLAIN);

    assert.equal(wrapper.getMessageId(), 1234);
    assert.equal(wrapper.readInt(), 42);
    assert.equal(wrapper.readShort(), -7);
    assert.equal(wrapper.readString(), 'héllo');
    assert.equal(wrapper.readBoolean(), true);
    assert.equal(wrapper.readBoolean(), false);
    assert.equal(wrapper.readInt(), 2);
    assert.equal(wrapper.readInt(), 3);
    assert.equal(wrapper.readString(), 'a');
    assert.equal(wrapper.bytesAvailable, 0);
});

test('two frames in one buffer split into two messages, a partial third waits', () =>
{
    const formatter = new WireFormatter();
    const a = formatter.encode(1, [1]);
    const b = formatter.encode(2, ['x']);
    const c = formatter.encode(3, [9, 9]);
    const buffer = a.clone();

    buffer.position = buffer.length;
    b.position = 0;
    buffer.writeBytes(b);
    c.position = 0;
    buffer.writeBytes(c, 0, 5);
    buffer.position = 0;

    const messages = formatter.splitMessages(buffer, PLAIN);

    assert.deepEqual(messages.map(m => m.getMessageId()), [1, 2]);
    assert.equal(buffer.length, 5);
});

test('a null or undefined field is refused, not skipped', () =>
{
    const formatter = new WireFormatter();

    assert.throws(() => formatter.encode(7, [1, undefined, 'x']), /field 1 of message 7/);
    assert.throws(() => formatter.encode(7, [null]), /field 0 of message 7/);
});

test('a bare number is an int: a fraction is truncated, a Float is written as one', () =>
{
    const formatter = new WireFormatter();
    const asInt = formatter.encode(9, [1.75]);
    const asFloat = formatter.encode(9, [new Float(1.75)]);

    // 4 length + 2 header + 4 bytes of value, both ways; the int reads back as 1.
    assert.equal(asInt.length, 10);
    assert.equal(asFloat.length, 10);
    asInt.position = 6;
    assert.equal(asInt.readInt(), 1);
    asFloat.position = 6;
    assert.equal(asFloat.readFloat(), 1.75);
});
