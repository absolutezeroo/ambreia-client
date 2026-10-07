/**
 * Interface for reading parsed message data
 * Provides typed access to message contents
 */
export interface IMessageDataWrapper
{
    /**
	 * Number of bytes remaining to read
	 */
    // AS3: .../src/com/sulake/core/communication/messages/IMessageDataWrapper.as::get bytesAvailable()
    readonly bytesAvailable: number;

    /**
	 * Get the message ID
	 */
    getMessageId(): number;

    /**
	 * Read a UTF-8 string (with length prefix)
	 */
    // AS3: .../src/com/sulake/core/communication/messages/IMessageDataWrapper.as::readString()
    readString(): string;

    /**
	 * Read a 32-bit signed integer
	 */
    readInt(): number;

    /**
	 * Read a 64-bit integer (as JavaScript number)
	 */
    // AS3: .../src/com/sulake/core/communication/messages/IMessageDataWrapper.as::readLong()
    readLong(): number;

    /**
	 * Read a boolean (1 byte)
	 */
    // AS3: .../src/com/sulake/core/communication/messages/IMessageDataWrapper.as::readBoolean()
    readBoolean(): boolean;

    /**
	 * Read a 16-bit signed integer
	 */
    // AS3: .../src/com/sulake/core/communication/messages/IMessageDataWrapper.as::readShort()
    readShort(): number;

    /**
	 * Read a single byte
	 */
    // AS3: .../src/com/sulake/core/communication/messages/IMessageDataWrapper.as::readByte()
    readByte(): number;

    /**
	 * Read a 32-bit float
	 */
    // AS3: .../src/com/sulake/core/communication/messages/IMessageDataWrapper.as::readFloat()
    readFloat(): number;

    /**
	 * Read a 64-bit double
	 */
    // AS3: .../src/com/sulake/core/communication/messages/IMessageDataWrapper.as::readDouble()
    readDouble(): number;
}
