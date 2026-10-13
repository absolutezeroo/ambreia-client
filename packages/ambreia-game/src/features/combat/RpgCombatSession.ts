import {EventEmitter} from 'eventemitter3';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import {MessageMap} from '@ambreia/net/style/MessageMap';
import {Incoming, Outgoing} from '@ambreia/protocol/Headers.generated';
import {RpgCombatEventsMessageParser} from '@ambreia/protocol/parser/rpg/combat/RpgCombatEventsMessageParser';
import {RpgVitalsMessageParser} from '@ambreia/protocol/parser/rpg/combat/RpgVitalsMessageParser';
import {RpgSelfVitalsMessageParser} from '@ambreia/protocol/parser/rpg/combat/RpgSelfVitalsMessageParser';
import {RpgDeathMessageParser} from '@ambreia/protocol/parser/rpg/combat/RpgDeathMessageParser';
import {RpgCombatResultMessageParser} from '@ambreia/protocol/parser/rpg/combat/RpgCombatResultMessageParser';
import {RpgMonsterYellMessageParser} from '@ambreia/protocol/parser/rpg/combat/RpgMonsterYellMessageParser';
import {RpgResurrectOfferMessageParser} from '@ambreia/protocol/parser/rpg/combat/RpgResurrectOfferMessageParser';
import {RpgAutoAttackStateMessageParser} from '@ambreia/protocol/parser/rpg/combat/RpgAutoAttackStateMessageParser';
import {RpgLevelUpMessageParser} from '@ambreia/protocol/parser/rpg/characters/RpgLevelUpMessageParser';
import {RpgAutoAttackMessage} from '@ambreia/protocol/outgoing/rpg/combat/RpgAutoAttackMessage';
import {RpgDeathChoiceMessage, type DeathChoice} from '@ambreia/protocol/outgoing/rpg/combat/RpgDeathChoiceMessage';
import {RpgAutoAttackMessageSerializer} from '@ambreia/protocol/serializer/rpg/combat/RpgAutoAttackMessageSerializer';
import {RpgDeathChoiceMessageSerializer} from '@ambreia/protocol/serializer/rpg/combat/RpgDeathChoiceMessageSerializer';
import type {IRpgSkillImpact, IRpgSkillOutcome} from '@ambreia/protocol/incoming/rpg/skills/RpgSkillEventsMessage';
import {UserRemoveMessageEvent} from '@ambreia/protocol/incoming/room/engine/UserRemoveMessageEvent';
import type {UserRemoveMessageParser} from '@ambreia/protocol/parser/room/engine/UserRemoveMessageParser';
import {CombatModel} from './CombatModel';
import type {ICombatModelWriter} from './ICombatModelWriter';
import type {IRpgCombatSessionEvents} from './IRpgCombatSessionEvents';

/**
 * The combat's messages (M1a §9.2, M1d §2): each one written into the model, the blows and the
 * yells also announced for the visuals. RpgLevelUp is served here rather than by the character
 * session: the level-up panel is this feature's, and the character feature boots before it.
 */
export function rpgCombatMap(model: ICombatModelWriter, events: EventEmitter<IRpgCombatSessionEvents>): MessageMap
{
    return new MessageMap()
        .incoming(Incoming.RpgCombatEventsMessageComposer, new RpgCombatEventsMessageParser(), {handle: message =>
        {
            model.reportHits(message.hits);
            events.emit('hits', message);
        }})
        .incoming(Incoming.RpgVitalsMessageComposer, new RpgVitalsMessageParser(), {handle: message =>
        {
            for(const line of message.combatants) model.setVitals(line.objectId, line.health, line.maxHealth);
        }})
        .incoming(Incoming.RpgSelfVitalsMessageComposer, new RpgSelfVitalsMessageParser(), {handle: vitals =>
            model.setSelfVitals(vitals.health, vitals.maxHealth, vitals.mana, vitals.maxMana, vitals.inCombat)})
        .incoming(Incoming.RpgDeathMessageComposer, new RpgDeathMessageParser(), {handle: death => model.setKo(death.respawnSeconds)})
        .incoming(Incoming.RpgCombatResultMessageComposer, new RpgCombatResultMessageParser(), {handle: result => model.refused(result.code)})
        .incoming(Incoming.RpgMonsterYellMessageComposer, new RpgMonsterYellMessageParser(), {handle: yell => events.emit('yell', yell)})
        .incoming(Incoming.RpgResurrectOfferMessageComposer, new RpgResurrectOfferMessageParser(), {handle: offer =>
            model.setOffer(offer.casterObjectId, offer.healthPercent, offer.expiresMs)})
        .incoming(Incoming.RpgAutoAttackStateMessageComposer, new RpgAutoAttackStateMessageParser(), {handle: state => model.setAutoAttacking(state.active)})
        .incoming(Incoming.RpgLevelUpMessageComposer, new RpgLevelUpMessageParser(), {handle: up => model.levelUp(up)})
        .outgoing(RpgAutoAttackMessage, Outgoing.RpgAutoAttackMessageEvent, new RpgAutoAttackMessageSerializer())
        .outgoing(RpgDeathChoiceMessage, Outgoing.RpgDeathChoiceMessageEvent, new RpgDeathChoiceMessageSerializer());
}

/**
 * The zone's fight on the wire (M1a, M1d): the model it writes (`model`, one per client), the two
 * acts it sends (auto-attack, the KO player's choice), and the visuals' events.
 */
export class RpgCombatSession
{
    readonly events = new EventEmitter<IRpgCombatSessionEvents>();
    readonly model = new CombatModel();
    private _connection: IConnection | null = null;
    private _uninstall: (() => void) | null = null;
    private readonly _map: MessageMap = rpgCombatMap(this.model, this.events);
    // UserRemove is the room's (an inherited event, which takes several listeners): a monster
    // despawned or a player gone leaves no health, cast or target behind (the server does not say).
    private readonly _left = new UserRemoveMessageEvent(event => this.model.unitLeft((event.parser as UserRemoveMessageParser).roomIndex));

    /** Skills and statuses hurt and healed too (M1b): their visuals, after where they landed. */
    report(outcomes: readonly IRpgSkillOutcome[], impacts: readonly IRpgSkillImpact[] = []): void
    {
        if(impacts.length > 0) this.events.emit('impacts', impacts);
        this.events.emit('outcomes', outcomes);
    }

    /** A slow or a stun holds this combatant back (its icon), or no longer (null): the overlay marks it. */
    mark(objectId: number, icon: string | null): void
    {
        this.events.emit('mark', objectId, icon);
    }

    /** Starts or stops the auto-attack; the model follows the server's answer, never this call. */
    setAutoAttack(active: boolean): void
    {
        this.send(new RpgAutoAttackMessage(active));
    }

    /** The KO player's choice; `wait` and `decline` change nothing the server must confirm. */
    deathChoice(choice: DeathChoice): void
    {
        this.send(new RpgDeathChoiceMessage(choice));

        if(choice === 'wait') this.model.setWaiting();
        else if(choice === 'decline') this.model.declineOffer();
    }

    install(connection: IConnection): void
    {
        if(this._connection === connection) return;

        this._uninstall?.();

        const uninstallMap = this._map.install(connection);

        connection.addMessageEvent(this._left);
        this._uninstall = () =>
        {
            uninstallMap();
            connection.removeMessageEvent(this._left);
        };
        this._connection = connection;
    }

    private send(message: object): void
    {
        if(this._connection !== null) this._map.send(this._connection, message);
    }

    dispose(): void
    {
        this._uninstall?.();
        this._uninstall = null;
        this._connection = null;
        this.model.dispose();
        this.events.removeAllListeners();
    }
}
