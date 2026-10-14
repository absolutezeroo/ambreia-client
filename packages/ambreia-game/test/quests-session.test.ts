// M2a §3.1–3.2: the quests session installed on a fake connection, fed the server's bytes; what it announces and sends.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {Incoming, Outgoing} from '@ambreia/protocol/Headers.generated';
import {RpgQuestSession} from '../src/features/quests/RpgQuestSession';

function wire(...values: Array<number | string>): IMessageDataWrapper
{
    let at = 0;

    return {readInt: () => values[at++] as number, readString: () => values[at++] as string} as unknown as IMessageDataWrapper;
}

function connection(): {connection: IConnection; receive: (header: number, ...values: Array<number | string>) => void; sent: Array<[number, unknown[]]>}
{
    const handlers = new Map<number, (wrapper: IMessageDataWrapper) => void>();
    const sent: Array<[number, unknown[]]> = [];
    const fake = {
        handleIncoming: (header: number, _name: string, read: (wrapper: IMessageDataWrapper) => void) =>
        {
            handlers.set(header, read);

            return () => handlers.delete(header);
        },
        sendValues: (header: number, _name: string, values: unknown[]) =>
        {
            sent.push([header, values]);

            return true;
        }
    } as unknown as IConnection;

    return {connection: fake, receive: (header, ...values) => handlers.get(header)!(wire(...values)), sent};
}

test('the session announces each of the five messages', () =>
{
    const session = new RpgQuestSession();
    const net = connection();
    const heard: string[] = [];

    session.install(net.connection);
    session.events.on('npcs', m => heard.push(`npcs ${m.npcs.length}`));
    session.events.on('dialogue', m => heard.push(`dialogue ${m.text}`));
    session.events.on('dialogueClose', () => heard.push('close'));
    session.events.on('log', m => heard.push(`log ${m.quests[0].questId}`));
    session.events.on('result', m => heard.push(`result ${m.action} ${m.code}`));

    net.receive(Incoming.RpgNpcsMessageComposer, 1, 5, 'available');
    net.receive(Incoming.RpgDialogueMessageComposer, 5, 'dialogue.camp.elder.name', 't.start', 0);
    net.receive(Incoming.RpgDialogueCloseMessageComposer);
    net.receive(Incoming.RpgQuestLogMessageComposer, 1, 'quest.camp.wolves', 'active', 0);
    net.receive(Incoming.RpgQuestResultMessageComposer, 'accepted', 'ok', 'quest.camp.wolves');

    assert.deepEqual(heard, ['npcs 1', 'dialogue t.start', 'close', 'log quest.camp.wolves', 'result accepted ok']);
});

test('talk, choose and abandon go out under their headers', () =>
{
    const session = new RpgQuestSession();
    const net = connection();

    session.install(net.connection);
    session.talk(42);
    session.choose(1);
    session.abandon('quest.camp.wolves');

    assert.deepEqual(net.sent, [
        [Outgoing.RpgNpcTalkMessageEvent, [42]],
        [Outgoing.RpgDialogueChooseMessageEvent, [1]],
        [Outgoing.RpgQuestAbandonMessageEvent, ['quest.camp.wolves']]
    ]);
});
