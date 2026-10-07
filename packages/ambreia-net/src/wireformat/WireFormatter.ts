import {ByteArray} from '../util/ByteArray';
import {Byte} from '../util/Byte';
import {Short} from '../util/Short';
import {Long} from '../util/Long';
import {MessageDataWrapper} from '../messages/MessageDataWrapper';
import type {IMessageDataWrapper} from '../messages/IMessageDataWrapper';
import type {IWireFormatter} from './IWireFormatter';
import type {IConnection} from '../connection/IConnection';

/**
 * Wire format encoder/decoder implementation
 * Handles the binary protocol for Habbo communication
 */
export class WireFormatter implements IWireFormatter
{
    /**
	 * Maximum message data size.
	 *
	 * AS3 (`.../core/communication/wireformat/_SafeCls_3863.as::splitMessages()`) caps this at
	 * 262144 and throws past it. That number is a Flash Player ByteArray budget, not a rule of the
	 * protocol - nothing downstream of here cares how big a message is - so this port raises it,
	 * and this is the one deliberate divergence in this file.
	 *
	 * It has to: `CatalogIndexMessageComposer` (3666) writes the whole page tree with every page's
	 * offer ids inline, 4 bytes each. The emulator's catalog carries 78,312 visible offers across
	 * 2,165 pages, which is ~313KB of ids plus ~29KB of pages - 342,380 bytes on the wire, and the
	 * AS3 cap turned opening the catalog into a hard disconnect. Trimming it server-side would mean
	 * dropping the ids, and those are what `CatalogNavigator.getNodesByOfferId()` is built from
	 * (open-catalog-on-this-offer deep links), so the data is wanted; only the ceiling was wrong.
	 *
	 * Kept finite, and well under any real message, because it is still the guard that turns a
	 * desynced stream into one thrown error instead of a multi-megabyte allocation.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/wireformat/_SafeCls_3863.as::splitMessages()
    private static readonly MAX_DATA_SIZE = 1048576;

    private _disposed: boolean = false;

    get disposed(): boolean
    {
        return this._disposed;
    }

    /**
	 * Encode a message for sending
	 * Format: [4 bytes length][2 bytes messageId][...data]
	 */
    encode(messageId: number, messageArray: unknown[]): ByteArray
    {
        const message = new ByteArray();

        // Write placeholder for length (will be updated at the end)
        message.writeInt(0);

        // Write message ID
        message.writeShort(messageId);

        // Write each parameter based on type
        for(const param of messageArray)
        {
            this.writeValue(message, param);
        }

        // Update message length (excluding the 4-byte length field itself)
        const totalLength = message.length;
        message.position = 0;
        message.writeInt(totalLength - 4);
        message.position = totalLength;

        return message;
    }

    /**
	 * Split received data into individual messages
	 */
    splitMessages(buffer: ByteArray, connection: IConnection): IMessageDataWrapper[]
    {
        const messages: IMessageDataWrapper[] = [];
        const encryption = connection.getServerToClientEncryption();

        while(buffer.bytesAvailable >= 6)
        {
            const startPosition = buffer.position;

            // Read message length
            let length: number;

            if(encryption)
            {
                encryption.mark();

                // Read and decrypt length
                const lengthBytes = new ByteArray(4);
                buffer.readBytes(lengthBytes, 0, 4);
                lengthBytes.position = 0;
                encryption.decipher(lengthBytes);
                lengthBytes.position = 0;
                length = lengthBytes.readInt();
            }
            else
            {
                length = buffer.readInt();
            }

            // Validate length
            if(length < 2 || length > WireFormatter.MAX_DATA_SIZE)
            {
                // A bad length has two opposite causes: the server sent a genuinely oversized
                // packet (AS3 caps a message at 256KB and so does this port), or the byte stream
                // desynced and these 4 bytes were never a length field. The 2 bytes that follow
                // are the message id whenever the framing is still aligned, so deciphering them
                // here tells the two apart - a known header means "one composer is too big",
                // garbage means "the stream is lost". Reading them advances the RC4 keystream,
                // which costs nothing: SocketConnection.processReceivedData() tears the
                // connection down on this throw regardless.
                let nextMessageId = -1;

                if(buffer.bytesAvailable >= 2)
                {
                    const idBytes = new ByteArray(2);
                    buffer.readBytes(idBytes, 0, 2);
                    idBytes.position = 0;
                    encryption?.decipher(idBytes);
                    idBytes.position = 0;
                    nextMessageId = idBytes.readShort();
                }

                throw new Error(
                    `Invalid message length: ${length}`
                    + ` (nextMessageId=${nextMessageId}, framePosition=${startPosition}`
                    + `, buffered=${buffer.length}, encrypted=${encryption !== null})`
                );
            }

            // Check if we have enough data
            if(buffer.bytesAvailable < length)
            {
                // Not enough data - restore state and wait
                buffer.position = startPosition;
                if(encryption)
                {
                    encryption.reset();
                }
                break;
            }

            // Read message data
            let messageData: ByteArray;

            if(encryption)
            {
                // Read and decrypt data
                const encrypted = new ByteArray(length);
                buffer.readBytes(encrypted, 0, length);
                encrypted.position = 0;
                encryption.decipher(encrypted);

                messageData = new ByteArray(length);
                encrypted.position = 0;
                messageData.writeBytes(encrypted, 0, length);
                messageData.position = 0;
            }
            else
            {
                messageData = new ByteArray(length);
                buffer.readBytes(messageData, 0, length);
                messageData.position = 0;
            }

            // Read message ID (first 2 bytes of message data)
            const messageId = messageData.readShort();

            // Create wrapper with remaining data
            messages.push(new MessageDataWrapper(messageId, messageData));
        }

        // Compact buffer - remove processed data
        if(buffer.position > 0 && buffer.bytesAvailable > 0)
        {
            const src = buffer.getUint8ArrayView();
            const pos = buffer.position;
            const remaining = buffer.bytesAvailable;
            src.copyWithin(0, pos, pos + remaining);
            buffer.length = remaining;
            buffer.position = 0;
        }
        else if(buffer.position > 0)
        {
            buffer.clear();
        }

        return messages;
    }

    dispose(): void
    {
        if(this._disposed)
        {
            return;
        }
        this._disposed = true;
    }

    /**
	 * Write a value to the message based on its type
	 */
    private writeValue(message: ByteArray, value: unknown): void
    {
        if(value === null || value === undefined)
        {
            return;
        }

        if(typeof value === 'string')
        {
            message.writeUTF(value);
        }
        else if(typeof value === 'boolean')
        {
            message.writeBoolean(value);
        }
        else if(value instanceof Byte)
        {
            message.writeByte(value.value);
        }
        else if(value instanceof Short)
        {
            message.writeShort(value.value);
        }
        else if(value instanceof Long)
        {
            this.writeLong(message, value.value);
        }
        else if(value instanceof ByteArray)
        {
            // Write ByteArray with length prefix
            message.writeInt(value.length);
            const savedPosition = value.position;
            value.position = 0;
            message.writeBytes(value);
            value.position = savedPosition;
        }
        else if(typeof value === 'number')
        {
            // Default number type is int
            if(Number.isInteger(value))
            {
                message.writeInt(value);
            }
            else
            {
                // Float for non-integers
                message.writeFloat(value);
            }
        }
        else if(Array.isArray(value))
        {
            // Write array length then each element
            message.writeInt(value.length);
            for(const item of value)
            {
                this.writeValue(message, item);
            }
        }
    }

    /**
	 * Write a 64-bit integer as two 32-bit unsigned integers
	 */
    private writeLong(message: ByteArray, value: number): void
    {
        const isNegative = value < 0;
        const absValue = isNegative ? -value : value;

        let high = Math.floor(absValue / 0x100000000);
        let low = absValue >>> 0;

        if(isNegative)
        {
            // Two's complement
            high = (~high) >>> 0;
            low = (~low) >>> 0;
            low = (low + 1) >>> 0;
            if(low === 0)
            {
                high = (high + 1) >>> 0;
            }
        }

        message.writeUnsignedInt(high);
        message.writeUnsignedInt(low);
    }
}
