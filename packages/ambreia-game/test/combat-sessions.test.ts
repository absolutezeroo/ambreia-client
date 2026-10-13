// Spec §3.2: the network sessions are the combat model's only writers. Each session is installed on
// a fake connection and fed the server's bytes, in the server's order; what lands in the model, and
// what the client sends back, is checked.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import {UserRemoveMessageEvent} from '@ambreia/protocol/incoming/room/engine/UserRemoveMessageEvent';
import {setPlatform, BROWSER_PLATFORM} from '@ambreia/common/platform/Platform';
import {Incoming, Outgoing} from '@ambreia/protocol/Headers.generated';
import {RpgCombatSession} from '../src/features/combat/RpgCombatSession';
import {RpgInteractionSession} from '../src/features/interaction/RpgInteractionSession';
import {RpgSkillSession} from '../src/features/skills/RpgSkillSession';

const now = 1000;

setPlatform({...BROWSER_PLATFORM, now: () => now});

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

/** The handlers a map installed, by header, and what was sent. */
function connection(): {connection: IConnection; receive: (header: number, ...values: Array<number | string | boolean>) => void; deliver: (eventClass: abstract new (...args: never[]) => IMessageEvent, ...values: Array<number | string | boolean>) => void; sent: Array<[number, unknown[]]>}
{
    const handlers = new Map<number, (wrapper: IMessageDataWrapper) => void>();
    // The inherited events (several listeners per message), as SocketConnection keeps them.
    const events = new Set<IMessageEvent>();
    const sent: Array<[number, unknown[]]> = [];
    const fake = {
        handleIncoming: (header: number, _name: string, read: (wrapper: IMessageDataWrapper) => void) =>
        {
            handlers.set(header, read);

            return () => handlers.delete(header);
        },
        addMessageEvent: (event: IMessageEvent) => events.add(event),
        removeMessageEvent: (event: IMessageEvent) => events.delete(event),
        sendValues: (header: number, _name: string, values: unknown[]) =>
        {
            sent.push([header, values]);

            return true;
        }
    } as unknown as IConnection;

    return {
        connection: fake,
        receive: (header, ...values) =>
        {
            const read = handlers.get(header);

            if(!read) throw new Error(`no handler for ${header}`);
            read(wire(...values));
        },
        deliver: (eventClass, ...values) =>
        {
            for(const event of events)
            {
                if(!(event instanceof eventClass)) continue;

                const parser = new event.parserClass();

                parser.parse(wire(...values));
                event.parser = parser;
                event.callback(event);
            }
        },
        sent
    };
}

test('the combat session writes the vitals, the KO, the offer, the auto-attack and the level-up', () =>
{
    const session = new RpgCombatSession();
    const wire = connection();

    session.install(wire.connection);
    session.model.reset(1);
    wire.receive(Incoming.RpgSelfVitalsMessageComposer, 80, 100, 30, 64, true);
    assert.deepEqual(session.model.ownVitals, {health: 80, maxHealth: 100, mana: 30, maxMana: 64});
    assert.equal(session.model.self.inCombat, true);
    assert.equal(session.model.resyncing, false, 'the self vitals close the burst');

    wire.receive(Incoming.RpgAutoAttackStateMessageComposer, true);
    assert.equal(session.model.self.autoAttacking, true);

    wire.receive(Incoming.RpgDeathMessageComposer, 60);
    assert.deepEqual(session.model.self.death, {kind: 'ko', autoReleaseAt: 61000, waiting: false, offer: null});
    assert.equal(session.model.self.autoAttacking, false, 'a KO stops the attack');

    wire.receive(Incoming.RpgResurrectOfferMessageComposer, 2, 35, 30000);
    assert.equal(session.model.self.death.kind === 'ko' ? session.model.self.death.offer?.casterObjectId : -1, 2);

    const stats = [10, 12, 5, 100, 50, 2, 500, 300, 100, 20];
    let level = 0;

    session.model.events.on('levelUp', up => level = up.toLevel);
    wire.receive(Incoming.RpgLevelUpMessageComposer, 1, 2, ...stats, ...stats, 0);
    assert.equal(level, 2);
});

test('a unit leaving the room (UserRemove) is forgotten by the combat model, and an uninstalled session hears nothing', () =>
{
    const session = new RpgCombatSession();
    const wire = connection();

    session.install(wire.connection);
    session.model.setVitals(9, 30, 60);
    wire.deliver(UserRemoveMessageEvent, '9');
    assert.equal(session.model.vitalsOf(9), null);

    session.model.setVitals(9, 30, 60);
    session.dispose();
    wire.deliver(UserRemoveMessageEvent, '9');
    assert.notEqual(session.model.vitalsOf(9), null);
});

test('the combat session sends the auto-attack and the death choices, and wait and decline apply at once', () =>
{
    const session = new RpgCombatSession();
    const wire = connection();

    session.install(wire.connection);
    session.model.setKo(60);
    session.setAutoAttack(true);
    session.deathChoice('wait');
    session.deathChoice('release');

    assert.deepEqual(wire.sent, [
        [Outgoing.RpgAutoAttackMessageEvent, [true]],
        [Outgoing.RpgDeathChoiceMessageEvent, ['wait']],
        [Outgoing.RpgDeathChoiceMessageEvent, ['release']]
    ]);
    assert.equal(session.model.self.death.kind === 'ko' ? session.model.self.death.waiting : false, true);
});

test('the interaction session writes the target, the aims and the threat', () =>
{
    const combat = new RpgCombatSession();
    const session = new RpgInteractionSession(combat.model);
    const wire = connection();

    session.install(wire.connection);
    wire.receive(Incoming.RpgTargetMessageComposer, 9, 'monster', 'monster.wolf', 2, '', 'elite');
    assert.equal(session.targetId, 9);
    assert.equal(combat.model.target?.rank, 'elite');

    wire.receive(Incoming.RpgTargetsMessageComposer, 1, 9, 4);
    assert.equal(combat.model.targetOf(9), 4);

    wire.receive(Incoming.RpgThreatMessageComposer, 9, 80, false);
    assert.deepEqual(combat.model.threat, {percent: 80, hasAggro: false});

    wire.receive(Incoming.RpgTargetMessageComposer, 0, '', '', 0, '', '');
    assert.equal(session.targetId, 0);
    assert.equal(combat.model.threat, null);
});

test('the skills session writes the statuses, casts and cooldowns; readyAt honours a skill free of the global cooldown', () =>
{
    const combat = new RpgCombatSession();
    const session = new RpgSkillSession(combat.model);
    const wire = connection();

    session.install(wire.connection);
    session.define([
        {id: 'a', classes: [], level: 1, effects: [], target: 'enemy', globalCooldown: true, type: 'instant', cost: 1, castMs: 0, channelMs: 0, range: 5, cooldownMs: 0, vfx: null},
        {id: 'b', classes: [], level: 1, effects: [], target: 'enemy', globalCooldown: false, type: 'instant', cost: 1, castMs: 0, channelMs: 0, range: 5, cooldownMs: 0, vfx: null}
    ]);

    wire.receive(Incoming.RpgStatusesMessageComposer, 1, 9, 1, 'status.burn', 3000, 1);
    assert.deepEqual(session.statusesOf(9), [{statusId: 'status.burn', endsAt: 4000, stacks: 1}]);

    wire.receive(Incoming.RpgCastStartMessageComposer, 1, 9, 'a', 2000, false, 1, -1, -1);
    assert.equal(combat.model.castOf(9)?.skillId, 'a');
    wire.receive(Incoming.RpgCastEndMessageComposer, 1, 9, 'a', 'done');
    assert.equal(combat.model.castOf(9), null);

    wire.receive(Incoming.RpgCooldownsMessageComposer, 800, 0);
    assert.equal(session.readyAt('a'), 1800, 'the global cooldown holds it');
    assert.equal(session.readyAt('b'), 0, 'free of the global cooldown');
});
