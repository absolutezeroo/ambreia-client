import type {IDisposable} from '@ambreia/common/IDisposable';

/**
 * Interface for outgoing message composers
 * Each composer represents a specific message type to send to the server
 *
 * Based on AS3: com.sulake.core.communication.messages.IMessageComposer
 */
export interface IMessageComposer<T extends unknown[]> extends IDisposable
{
    /**
	 * Get the array of values to encode in the message
	 * Values can be: string, number, boolean, Byte, Short, Long, ByteArray
	 */
    // AS3: .../src/com/sulake/core/communication/messages/IMessageComposer.as::getMessageArray()
    getMessageArray(): T;
}
