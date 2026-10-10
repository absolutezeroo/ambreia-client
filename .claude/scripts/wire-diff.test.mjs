import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clientReads, clientValues, serverValues, serverWrites } from './wire-diff.mjs';

test('incoming: reads and writes in source order, loops included, helpers inlined', () =>
{
    const parser = `const count = wrapper.readInt(); for(…) hits.push({id: wrapper.readInt(), stats: readBlock(wrapper), killed: wrapper.readBoolean()});`;
    const serializer = `packet.WriteInteger(m.Hits.Length); foreach (…) { packet.WriteInteger(h.Id); BlockWriter.Write(packet, h.Stats); packet.WriteBoolean(h.Killed); }`;

    assert.deepEqual(clientReads(parser, name => (name === 'readBlock' ? 'wrapper.readString(); wrapper.readShort()' : null)), ['int', 'int', 'string', 'short', 'bool']);
    assert.deepEqual(serverWrites(serializer, name => (name === 'BlockWriter' ? 'packet.WriteString(a).WriteShort(b);' : null)), ['int', 'int', 'string', 'short', 'bool']);
});

test('an unresolved helper shows as ?name instead of vanishing', () =>
{
    assert.deepEqual(clientReads('wrapper.readInt(); readThing(wrapper)'), ['int', '?readThing']);
    assert.deepEqual(serverWrites('packet.WriteInteger(1); Thing.Write(packet, x)'), ['int', '?Thing']);
});

test('outgoing: client values take their declared type; server pops name what they fill', () =>
{
    const messageClass = `constructor(readonly skillId: string, readonly x: number, readonly urgent: boolean) {}`;

    assert.deepEqual(clientValues('return [message.skillId, message.x, message.urgent];', messageClass), ['skillid:string', 'x:int', 'urgent:bool']);
    assert.deepEqual(serverValues('new M { SkillId = packet.PopString(), X = packet.PopInt(), Urgent = packet.PopBoolean() }'), ['skillid:string', 'x:int', 'urgent:bool']);
    assert.deepEqual(clientValues('return [];', ''), []);
});
