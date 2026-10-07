// Spec §6: the new network style. A message is a plain class; a parser reads it off the wire, a
// serializer writes it, a handler receives it; a map per domain ties them to the server's ids.
// It runs beside the inherited events and composers on the same connection.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SocketConnection} from '../src/connection/SocketConnection';
import {MessageEvent} from '../src/messages/MessageEvent';
import {WireFormatter} from '../src/wireformat/WireFormatter';
import {ByteArray} from '../src/util/ByteArray';
import {MessageMap} from '../src/style/MessageMap';
import type {IEncryption} from '../src/encryption/IEncryption';
import type {IConnection} from '../src/connection/IConnection';
import type {IMessageDataWrapper} from '../src/messages/IMessageDataWrapper';

class Chat
{
    constructor(readonly userId: number, readonly text: string) {}
}

class Say
{
    constructor(readonly text: string, readonly bubble: number) {}
}

const chatParser = {parse: (wrapper: IMessageDataWrapper): Chat => new Chat(wrapper.readInt(), wrapper.readString())};
const saySerializer = {serialize: (message: Say): unknown[] => [message.text, message.bubble]};

class LegacyParser
{
    flush(): boolean { return true; }
    parse(): boolean { return true; }
}

class LegacyEvent extends MessageEvent
{
    constructor() { super(() => {}, LegacyParser); }
}

const PLAIN = {encipher: () => undefined, decipher: () => undefined} as unknown as IEncryption;

function connection(): {connection: SocketConnection; sent: ArrayBuffer[]}
{
    const c = new SocketConnection();
    const sent: ArrayBuffer[] = [];

    c.registerMessageClasses({events: new Map([[100, LegacyEvent]]), composers: new Map()});
    c.setEncryption(PLAIN, PLAIN);
    (c as unknown as {_socket: unknown})._socket = {readyState: WebSocket.OPEN, send: (data: ArrayBuffer) => sent.push(data)};

    return {connection: c, sent};
}

function decode(buffer: ArrayBuffer): IMessageDataWrapper
{
    return new WireFormatter().splitMessages(new ByteArray(buffer), {getServerToClientEncryption: () => null} as unknown as IConnection)[0];
}

test('an incoming message of the map reaches its handler, parsed into the plain message', () =>
{
    const {connection: c} = connection();
    const got: Chat[] = [];

    new MessageMap().incoming(1446, chatParser, {handle: message => got.push(message)}).install(c);
    c.injectIncoming(1446, [7, 'salut']);

    assert.deepEqual(got, [new Chat(7, 'salut')]);
});

test('send() finds the serializer by the message class and sends under its header', () =>
{
    const {connection: c, sent} = connection();
    const map = new MessageMap().outgoing(Say, 1314, saySerializer);

    assert.equal(map.send(c, new Say('bonjour', 3)), true);

    const wrapper = decode(sent[0]);

    assert.deepEqual([wrapper.getMessageId(), wrapper.readString(), wrapper.readInt()], [1314, 'bonjour', 3]);
});

test('a message the map does not know is not sent', () =>
{
    const {connection: c, sent} = connection();

    assert.equal(new MessageMap().send(c, new Say('x', 0)), false);
    assert.equal(sent.length, 0);
});

test('a header an inherited event already serves is refused when the map is installed, named', () =>
{
    const {connection: c} = connection();

    c.addMessageEvent(new LegacyEvent());

    assert.throws(() => new MessageMap().incoming(100, chatParser, {handle: () => {}}).install(c), /header 100.*LegacyEvent/);
});

test('two maps cannot serve the same header', () =>
{
    const {connection: c} = connection();
    const map = (): MessageMap => new MessageMap().incoming(1446, chatParser, {handle: () => {}});

    map().install(c);

    assert.throws(() => map().install(c), /header 1446/);
});

test('uninstalling the map stops the delivery', () =>
{
    const {connection: c} = connection();
    const got: Chat[] = [];
    const uninstall = new MessageMap().incoming(1446, chatParser, {handle: message => got.push(message)}).install(c);

    uninstall();
    c.injectIncoming(1446, [1, 'perdu']);

    assert.deepEqual(got, []);
});

test('a message sent before the connection is configured leaves once it is', () =>
{
    const {connection: c, sent} = connection();
    const map = new MessageMap().outgoing(Say, 1314, saySerializer);

    (c as unknown as {_authenticated: boolean})._authenticated = true;

    assert.equal(map.send(c, new Say('tôt', 1)), false);
    assert.equal(sent.length, 0);

    c.isConfigured();

    assert.equal(decode(sent[0]).readString(), 'tôt');
});
