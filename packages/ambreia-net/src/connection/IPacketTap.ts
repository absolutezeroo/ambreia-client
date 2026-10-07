import type {IMessageDataWrapper} from '../messages/IMessageDataWrapper';

/**
 * A development hook on the wire (spec §8): the packet inspector sees messages after decryption and
 * before encoding, and may edit or drop them. Nothing installs one in production.
 *
 * - Outgoing: `send()` only. The three handshake composers go through `sendUnencrypted()` untapped.
 *   PacketLogger has already logged a message the tap then drops.
 * - Incoming: reading a wrapper consumes it. A tap that only inspects must return a fresh wrapper
 *   built from the bytes it read, or the parser gets nothing. The tap runs before PacketLogger.
 * - Injected messages skip the queue that holds real ones until the configuration is ready.
 */
export interface IPacketTap
{
    /** Values about to be encoded for `messageId`: return them (edited or not), or null to drop the message. */
    outgoing?(messageId: number, values: unknown[]): unknown[] | null;

    /** A decrypted incoming message: return the wrapper to handle (edited or not), or null to drop it. */
    incoming?(wrapper: IMessageDataWrapper): IMessageDataWrapper | null;
}
