// The character's messages reach the HUD (F3 spec §3): a snapshot fills it, XP and level-ups move
// it, stats set the bars' maxima. Current HP and mana are the maxima until combat (M1) sends them.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import {PlayerHudState} from '../src/features/hud/PlayerHudState';
import {CharacterEvents, characterMessageMap} from '../src/features/character/CharacterMessageMap';

const HEADERS = {snapshot: 9000, xp: 9001, levelUp: 9002, stats: 9003};
const STATS = [12, 8, 10, 160, 90, 4, 52, 13, 100, 12];

function wire(...values: Array<number | string>): IMessageDataWrapper
{
    let at = 0;

    return {readInt: () => values[at++] as number, readString: () => values[at++] as string} as unknown as IMessageDataWrapper;
}

/** A connection that only records what the map subscribes, so the test can deliver messages. */
function connection(): {connection: IConnection; deliver(header: number, ...values: Array<number | string>): void}
{
    const handlers = new Map<number, (wrapper: IMessageDataWrapper) => void>();

    return {
        connection: {handleIncoming: (header: number, _name: string, handler: (wrapper: IMessageDataWrapper) => void) => { handlers.set(header, handler); return () => handlers.delete(header); }} as unknown as IConnection,
        deliver: (header, ...values) => handlers.get(header)!(wire(...values))
    };
}

test('a snapshot fills the HUD: level, XP, and full bars until combat sends the current values', () =>
{
    const hud = new PlayerHudState();
    const {connection: c, deliver} = connection();

    characterMessageMap(HEADERS, hud, new CharacterEvents()).install(c);
    deliver(HEADERS.snapshot, 'class.warrior', '', 7, 20, 120, 400, ...STATS);

    const value = hud.value;

    assert.deepEqual([value.level, value.xp, value.xpMax], [7, 120, 400]);
    assert.deepEqual([value.hp, value.hpMax, value.mana, value.manaMax], [160, 160, 90, 90]);
});

test('a level-up, then XP, then stats: the HUD ends on the new level, its XP and its new maxima', () =>
{
    const hud = new PlayerHudState();
    const events = new CharacterEvents();
    const levels: number[] = [];
    const {connection: c, deliver} = connection();

    events.on('levelUp', message => levels.push(message.newLevel));
    characterMessageMap(HEADERS, hud, events).install(c);
    deliver(HEADERS.snapshot, 'class.warrior', '', 7, 20, 380, 400, ...STATS);
    deliver(HEADERS.levelUp, 7, 8);
    deliver(HEADERS.xp, 35, 8, 15, 450);
    deliver(HEADERS.stats, 13, 8, 10, 170, 90, 4, 52, 13, 100, 13);

    assert.deepEqual(levels, [8]);
    assert.deepEqual([hud.value.level, hud.value.xp, hud.value.xpMax, hud.value.hpMax, hud.value.hp], [8, 15, 450, 170, 170]);
});

test('at the maximum level the XP bar is shown full, not empty', () =>
{
    const hud = new PlayerHudState();
    const {connection: c, deliver} = connection();

    characterMessageMap(HEADERS, hud, new CharacterEvents()).install(c);
    deliver(HEADERS.snapshot, 'class.mage', '', 20, 20, 0, 0, ...STATS);

    assert.equal(hud.value.xp, hud.value.xpMax);
    assert.ok((hud.value.xpMax ?? 0) > 0);
});
