import {EventEmitter} from 'eventemitter3';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import {MessageMap} from '@ambreia/net/style/MessageMap';
import {Incoming, Outgoing} from '@ambreia/protocol/Headers.generated';
import type {RpgInventoryMessage} from '@ambreia/protocol/incoming/rpg/items/RpgInventoryMessage';
import {RpgInventoryMessageParser} from '@ambreia/protocol/parser/rpg/items/RpgInventoryMessageParser';
import {RpgItemResultMessageParser} from '@ambreia/protocol/parser/rpg/items/RpgItemResultMessageParser';
import {RpgItemMoveMessage} from '@ambreia/protocol/outgoing/rpg/items/RpgItemMoveMessage';
import {RpgItemSplitMessage} from '@ambreia/protocol/outgoing/rpg/items/RpgItemSplitMessage';
import {RpgItemEquipMessage} from '@ambreia/protocol/outgoing/rpg/items/RpgItemEquipMessage';
import {RpgItemUnequipMessage} from '@ambreia/protocol/outgoing/rpg/items/RpgItemUnequipMessage';
import {RpgItemDestroyMessage} from '@ambreia/protocol/outgoing/rpg/items/RpgItemDestroyMessage';
import {RpgItemClaimParcelMessage} from '@ambreia/protocol/outgoing/rpg/items/RpgItemClaimParcelMessage';
import {RpgItemMoveMessageSerializer} from '@ambreia/protocol/serializer/rpg/items/RpgItemMoveMessageSerializer';
import {RpgItemSplitMessageSerializer} from '@ambreia/protocol/serializer/rpg/items/RpgItemSplitMessageSerializer';
import {RpgItemEquipMessageSerializer} from '@ambreia/protocol/serializer/rpg/items/RpgItemEquipMessageSerializer';
import {RpgItemUnequipMessageSerializer} from '@ambreia/protocol/serializer/rpg/items/RpgItemUnequipMessageSerializer';
import {RpgItemDestroyMessageSerializer} from '@ambreia/protocol/serializer/rpg/items/RpgItemDestroyMessageSerializer';
import {RpgItemClaimParcelMessageSerializer} from '@ambreia/protocol/serializer/rpg/items/RpgItemClaimParcelMessageSerializer';
import type {IRpgInventorySession, IRpgInventorySessionEvents} from './IRpgInventorySession';

/**
 * The items' messages: the client's counterpart of the server's RpgItemsMap.cs (Objets §17).
 * Each incoming message is announced as the session event it feeds.
 */
export function rpgItemsMap(announce: <E extends keyof IRpgInventorySessionEvents>(event: E, ...args: IRpgInventorySessionEvents[E]) => void): MessageMap
{
    return new MessageMap()
        .incoming(Incoming.RpgInventoryMessageComposer, new RpgInventoryMessageParser(), {handle: message => announce('inventory', message)})
        .incoming(Incoming.RpgItemResultMessageComposer, new RpgItemResultMessageParser(), {handle: message => announce('result', message)})
        .outgoing(RpgItemMoveMessage, Outgoing.RpgItemMoveMessageEvent, new RpgItemMoveMessageSerializer())
        .outgoing(RpgItemSplitMessage, Outgoing.RpgItemSplitMessageEvent, new RpgItemSplitMessageSerializer())
        .outgoing(RpgItemEquipMessage, Outgoing.RpgItemEquipMessageEvent, new RpgItemEquipMessageSerializer())
        .outgoing(RpgItemUnequipMessage, Outgoing.RpgItemUnequipMessageEvent, new RpgItemUnequipMessageSerializer())
        .outgoing(RpgItemDestroyMessage, Outgoing.RpgItemDestroyMessageEvent, new RpgItemDestroyMessageSerializer())
        .outgoing(RpgItemClaimParcelMessage, Outgoing.RpgItemClaimParcelMessageEvent, new RpgItemClaimParcelMessageSerializer());
}

/**
 * The played character's bag, equipment and parcels (Objets §17): the last RpgInventory, which
 * replaces everything — the client applies nothing on its own, it waits for the server's answer
 * and the inventory after it (§17.3).
 */
export class RpgInventorySession implements IRpgInventorySession
{
    readonly events = new EventEmitter<IRpgInventorySessionEvents>();
    private _inventory: RpgInventoryMessage | null = null;
    private _connection: IConnection | null = null;
    private _uninstall: (() => void) | null = null;
    private readonly _map: MessageMap = rpgItemsMap((event, ...args) =>
    {
        if(event === 'inventory') this._inventory = args[0] as RpgInventoryMessage;

        // Typed at the map's side; eventemitter3 cannot tie a generic event to its payload here.
        (this.events as unknown as EventEmitter).emit(event, ...args);
    });

    get inventory(): RpgInventoryMessage | null
    {
        return this._inventory;
    }

    /** Serves the items' headers on this connection (once: the client has one game socket). */
    install(connection: IConnection): void
    {
        if(this._connection === connection) return;

        this._uninstall?.();
        this._uninstall = this._map.install(connection);
        this._connection = connection;
    }

    send(message: object): boolean
    {
        return this._connection !== null && this._map.send(this._connection, message);
    }

    dispose(): void
    {
        this._uninstall?.();
        this._uninstall = null;
        this._connection = null;
        this.events.removeAllListeners();
    }
}
