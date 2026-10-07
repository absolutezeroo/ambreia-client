import type {ByteArray} from '../util/ByteArray';
import type {IMessageDataWrapper} from './IMessageDataWrapper';

/**
 * Implementation of message data wrapper
 * Provides typed access to message contents
 */
export class MessageDataWrapper implements IMessageDataWrapper
{
    private readonly _messageId: number;
    private readonly _data: ByteArray;

    constructor(messageId: number, data: ByteArray)
    {
        this._messageId = messageId;
        this._data = data;
    }

    get bytesAvailable(): number
    {
        return this._data.bytesAvailable;
    }

    getMessageId(): number
    {
        return this._messageId;
    }

    readString(): string
    {
        return this._data.readUTF();
    }

    readInt(): number
    {
        return this._data.readInt();
    }

    readLong(): number
    {
        // Read as two 32-bit unsigned integers (big-endian)
        const high = this._data.readUnsignedInt();
        const low = this._data.readUnsignedInt();

        // Check if negative (high bit set)
        const isNegative = (high & 0x80000000) !== 0;

        if(isNegative)
        {
            // Two's complement for negative numbers
            // Invert and add 1
            let invHigh = (~high) >>> 0;
            let invLow = (~low) >>> 0;

            invLow = (invLow + 1) >>> 0;
            if(invLow === 0)
            {
                invHigh = (invHigh + 1) >>> 0;
            }

            return -(invHigh * 0x100000000 + invLow);
        }

        return high * 0x100000000 + low;
    }

    readBoolean(): boolean
    {
        return this._data.readBoolean();
    }

    readShort(): number
    {
        return this._data.readShort();
    }

    readByte(): number
    {
        return this._data.readByte();
    }

    readFloat(): number
    {
        return this._data.readFloat();
    }

    readDouble(): number
    {
        return this._data.readDouble();
    }
}
