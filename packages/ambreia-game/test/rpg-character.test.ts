// features/character (F3a §6.4): the characters screen and the character's state arrive in the
// session, the client's requests leave through the same map, and the HUD shows the state.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import {Incoming, Outgoing} from '@ambreia/protocol/Headers.generated';
import {RpgEnterWorldMessage} from '@ambreia/protocol/outgoing/rpg/characters/RpgEnterWorldMessage';
import {RpgCharacterSession} from '../src/features/character/RpgCharacterSession';
import {PlayerHudState} from '../src/features/hud/PlayerHudState';
import {bindCharacterToHud} from '../src/features/hud/CharacterHudBridge';

const STATS = [12, 8, 10, 160, 90, 4, 620, 130, 100, 12];

function wire(...values: Array<number | string | boolean>): IMessageDataWrapper
{
    let at = 0;

    return {readInt: () => values[at++], readString: () => values[at++], readBoolean: () => values[at++]} as unknown as IMessageDataWrapper;
}

/** A connection that records what the map subscribes and what it sends. */
function connection(): {connection: IConnection; deliver(header: number, ...values: Array<number | string | boolean>): void; sent: Array<[number, unknown[]]>}
{
    const handlers = new Map<number, (wrapper: IMessageDataWrapper) => void>();
    const sent: Array<[number, unknown[]]> = [];

    return {
        sent,
        connection: {
            handleIncoming: (header: number, _name: string, handler: (wrapper: IMessageDataWrapper) => void) => { handlers.set(header, handler); return () => handlers.delete(header); },
            sendValues: (header: number, _name: string, values: unknown[]) => { sent.push([header, values]); return true; }
        } as unknown as IConnection,
        deliver: (header, ...values) => handlers.get(header)!(wire(...values))
    };
}

test('the characters screen data and the character state land in the session', () =>
{
    const session = new RpgCharacterSession();
    const {connection: c, deliver} = connection();

    session.install(c);
    deliver(Incoming.RpgCharacterListMessageComposer, 5, 1, 7, 'Arwen', 'hd-180-1', 'F', 'class.classless', '', 1, true);
    deliver(Incoming.RpgClassListMessageComposer, 1, 'class.mage', 'damage', 6, 'intelligence', false, 0);
    deliver(Incoming.RpgCharacterStateMessageComposer, 7, 'class.mage', '', 3, 20, 40, 220, ...STATS);

    assert.equal(session.characters?.characters[0].name, 'Arwen');
    assert.equal(session.classes?.classes[0].id, 'class.mage');
    assert.equal(session.state?.level, 3);
});

test('a client request leaves under its own header, serialized in the server order', () =>
{
    const session = new RpgCharacterSession();
    const {connection: c, sent} = connection();

    session.install(c);

    assert.equal(session.send(new RpgEnterWorldMessage(7)), true);
    assert.deepEqual(sent, [[Outgoing.RpgEnterWorldMessageEvent, [7]]]);
});

test('the HUD shows the state, then follows progress and stats; the current HP and mana belong to the combat model', () =>
{
    const session = new RpgCharacterSession();
    const hud = new PlayerHudState();
    const {connection: c, deliver} = connection();

    session.install(c);
    bindCharacterToHud(session, hud);
    deliver(Incoming.RpgCharacterStateMessageComposer, 7, 'class.warrior', '', 6, 20, 380, 400, ...STATS);

    // The maxima are the stats'; the current values wait for the combat's own vitals (RpgSelfVitals).
    assert.deepEqual([hud.value.level, hud.value.xp, hud.value.xpMax, hud.value.hp, hud.value.hpMax, hud.value.mana, hud.value.manaMax], [6, 380, 400, null, 160, null, 90]);

    // What PlayerFrameBinding writes from the combat model.
    hud.update({hp: 150, mana: 80});
    deliver(Incoming.RpgCharacterProgressMessageComposer, 7, 15, 450);
    deliver(Incoming.RpgCharacterStatsMessageComposer, 13, 8, 10, 170, 90, 4, 620, 130, 100, 13);

    assert.deepEqual([hud.value.level, hud.value.xp, hud.value.xpMax, hud.value.hpMax, hud.value.hp], [7, 15, 450, 170, 150]);

    // A lower maximum does not write the current values either: the server's next vitals do.
    deliver(Incoming.RpgCharacterStatsMessageComposer, 13, 8, 10, 120, 60, 4, 620, 130, 100, 13);

    assert.deepEqual([hud.value.hp, hud.value.hpMax, hud.value.mana, hud.value.manaMax], [150, 120, 80, 60]);
});

test('at the maximum level the XP bar is full and reads MAX', () =>
{
    const session = new RpgCharacterSession();
    const hud = new PlayerHudState();
    const {connection: c, deliver} = connection();

    session.install(c);
    bindCharacterToHud(session, hud);
    deliver(Incoming.RpgCharacterProgressMessageComposer, 20, 0, 0);

    assert.deepEqual([hud.value.xp, hud.value.xpMax, hud.value.xpLabel], [1, 1, 'MAX']);
});
