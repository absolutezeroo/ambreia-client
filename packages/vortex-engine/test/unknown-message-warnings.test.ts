// Kept code still subscribes to, and sends, messages outside the server contract. Each unknown
// class must warn once, not on every subscription or every send, or the real warnings drown.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MessageRegistry} from '../src/core/communication/messages/MessageRegistry';
import {MessageComposer} from '../src/core/communication/messages/MessageComposer';
import {MessageEvent} from '../src/core/communication/messages/MessageEvent';
import {SocketConnection} from '../src/core/communication/connection/SocketConnection';
import type {IEncryption} from '../src/core/communication/encryption/IEncryption';
import type {IMessageDataWrapper} from '../src/core/communication/messages/IMessageDataWrapper';

class OutsideContractParser
{
    flush(): boolean
    {
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        return wrapper !== null;
    }
}

class OutsideContractEvent extends MessageEvent
{
    constructor()
    {
        super(() => undefined, OutsideContractParser);
    }
}

class OutsideContractComposer extends MessageComposer<[]>
{
    getMessageArray(): []
    {
        return [];
    }
}

function countWarnings(body: () => void, needle: string): number
{
    const original = console.warn;
    let count = 0;

    console.warn = (...args: unknown[]) =>
    {
        if(args.some(a => String(a).includes(needle))) count++;
    };

    try
    {
        body();
    }
    finally
    {
        console.warn = original;
    }

    return count;
}

test('an unknown event class warns once, however many times it subscribes', () =>
{
    const registry = new MessageRegistry();
    const warnings = countWarnings(() =>
    {
        registry.registerMessageEvent(new OutsideContractEvent());
        registry.registerMessageEvent(new OutsideContractEvent());
        registry.registerMessageEvent(new OutsideContractEvent());
    }, 'OutsideContractEvent');

    assert.equal(warnings, 1);
});

test('an unknown composer warns once, however many times it is sent', () =>
{
    const connection = new SocketConnection();
    const plain: IEncryption = {encipher: () => undefined} as unknown as IEncryption;

    connection.setEncryption(plain, plain);

    const sent: boolean[] = [];
    const warnings = countWarnings(() =>
    {
        for(let i = 0; i < 3; i++) sent.push(connection.send(new OutsideContractComposer()));
    }, 'OutsideContractComposer');

    assert.equal(warnings, 1);
    // RoomEngine's pickup only disposes the furni when this is true.
    assert.deepEqual(sent, [false, false, false]);
});
