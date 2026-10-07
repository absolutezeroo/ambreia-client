import type {IMessageDataWrapper} from '../messages/IMessageDataWrapper';

/**
 * A development hook on the wire (spec §8): the packet inspector sees every message after
 * decryption and before encoding, and may edit or drop it. Nothing installs one in production.
 */
export interface IPacketTap
{
    /** Values about to be encoded for `messageId`: return them (edited or not), or null to drop the message. */
    outgoing?(messageId: number, values: unknown[]): unknown[] | null;

    /** A decrypted incoming message: return the wrapper to handle (edited or not), or null to drop it. */
    incoming?(wrapper: IMessageDataWrapper): IMessageDataWrapper | null;
}
