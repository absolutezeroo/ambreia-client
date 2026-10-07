import {Logger} from '@ambreia/common/utils/Logger';
import type {IConnection} from '../connection/IConnection';
import type {IMessageDataWrapper} from '../messages/IMessageDataWrapper';

const log = Logger.getLogger('core.communication.style.MessageMap');

/** Reads one incoming message off the wire into a plain object. */
export interface IIncomingParser<M>
{
    parse(wrapper: IMessageDataWrapper): M;
}

/** Writes one outgoing message as the values the wire format encodes, in the server's order. */
export interface IOutgoingSerializer<M>
{
    serialize(message: M): unknown[];
}

export interface IMessageHandler<M>
{
    handle(message: M): void;
}

type MessageClass<M> = abstract new (...args: never[]) => M;

/**
 * The new network style (spec §6): a message is a plain class, a parser or serializer moves it
 * across the wire, a handler receives it, and a map per domain ties them to the server's ids
 * (`Incoming.X` / `Outgoing.X` of @ambreia/protocol). It runs beside the inherited events and
 * composers on the same connection; installing refuses a header one of them already serves.
 */
export class MessageMap
{
    private readonly _incoming: Array<{header: number; name: string; read: (wrapper: IMessageDataWrapper) => void}> = [];
    private readonly _outgoing = new Map<MessageClass<unknown>, {header: number; serialize: (message: never) => unknown[]}>();

    incoming<M>(header: number, parser: IIncomingParser<M>, handler: IMessageHandler<M>): this
    {
        const name = parser.constructor === Object ? `#${header}` : parser.constructor.name;

        this._incoming.push({header, name, read: wrapper => handler.handle(parser.parse(wrapper))});

        return this;
    }

    outgoing<M>(type: MessageClass<M>, header: number, serializer: IOutgoingSerializer<M>): this
    {
        this._outgoing.set(type, {header, serialize: serializer.serialize.bind(serializer) as (message: never) => unknown[]});

        return this;
    }

    /** Subscribes every incoming entry; returns the unsubscription of them all. */
    install(connection: IConnection): () => void
    {
        const uninstalls: Array<() => void> = [];

        try
        {
            for(const entry of this._incoming) uninstalls.push(connection.handleIncoming(entry.header, entry.name, entry.read));
        }
        catch (error)
        {
            // All or nothing: a map half installed would serve some of its domain and not the rest.
            for(const uninstall of uninstalls) uninstall();
            throw error;
        }

        return () => { for(const uninstall of uninstalls) uninstall(); };
    }

    /** Sends `message` under the header of its class. False (and a warning, once) for a class the map does not know. */
    send(connection: IConnection, message: object): boolean
    {
        const entry = this._outgoing.get(message.constructor as MessageClass<unknown>);

        if(!entry)
        {
            log.once(`unknown-message:${message.constructor.name}`).warn(`No serializer for ${message.constructor.name} in this map — not sent`);

            return false;
        }

        return connection.sendValues(entry.header, message.constructor.name, entry.serialize(message as never));
    }
}
