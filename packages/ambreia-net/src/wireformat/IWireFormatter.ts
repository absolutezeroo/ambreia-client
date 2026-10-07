import type {IDisposable} from '@ambreia/common/IDisposable';
import type {ByteArray} from '../util/ByteArray';
import type {IMessageDataWrapper} from '../messages/IMessageDataWrapper';
import type {IConnection} from '../connection/IConnection';

/**
 * Interface for message encoding/decoding
 *
 * Based on AS3: com.sulake.core.communication.wireformat.IWireFormatter
 */
export interface IWireFormatter extends IDisposable
{
    /**
	 * Encode a message for sending
	 * @param messageId The message ID
	 * @param messageArray Array of values to encode
	 * @returns Encoded message as ByteArray
	 */
    encode(messageId: number, messageArray: unknown[]): ByteArray;

    /**
	 * Split received data into individual messages
	 * @param buffer The received data buffer
	 * @param connection The connection (for encryption)
	 * @returns Array of parsed message wrappers
	 */
    splitMessages(buffer: ByteArray, connection: IConnection): IMessageDataWrapper[];
}
