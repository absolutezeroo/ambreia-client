import {EventEmitter} from 'eventemitter3';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {MessageMap} from '@ambreia/net/style/MessageMap';
import type {RpgCharacterListMessage} from '@ambreia/protocol/incoming/rpg/characters/RpgCharacterListMessage';
import type {RpgClassListMessage} from '@ambreia/protocol/incoming/rpg/characters/RpgClassListMessage';
import type {RpgCharacterStateMessage} from '@ambreia/protocol/incoming/rpg/characters/RpgCharacterStateMessage';
import type {IRpgCharacterSession, IRpgCharacterSessionEvents} from './IRpgCharacterSession';
import {rpgCharactersMap} from './RpgCharactersMap';

/**
 * The account's characters and the played character (F3a): keeps the last list, classes and state
 * the server sent, announces each message, and sends the client's requests through the same map.
 */
export class RpgCharacterSession implements IRpgCharacterSession
{
    readonly events = new EventEmitter<IRpgCharacterSessionEvents>();
    private _characters: RpgCharacterListMessage | null = null;
    private _classes: RpgClassListMessage | null = null;
    private _state: RpgCharacterStateMessage | null = null;
    private _connection: IConnection | null = null;
    private _uninstall: (() => void) | null = null;
    private readonly _map: MessageMap = rpgCharactersMap((event, ...args) =>
    {
        const message = args[0];

        if(event === 'characters') this._characters = message as RpgCharacterListMessage;
        else if(event === 'classes') this._classes = message as RpgClassListMessage;
        else if(event === 'state') this._state = message as RpgCharacterStateMessage;

        // Typed at the map's side; eventemitter3 cannot tie a generic event to its payload here.
        (this.events as unknown as EventEmitter).emit(event, ...args);
    });

    get characters(): RpgCharacterListMessage | null
    {
        return this._characters;
    }

    get classes(): RpgClassListMessage | null
    {
        return this._classes;
    }

    get state(): RpgCharacterStateMessage | null
    {
        return this._state;
    }

    /** Serves the characters' headers on this connection (once: the client has one game socket). */
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
