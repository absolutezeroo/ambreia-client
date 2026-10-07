import type {ByteArray} from '../util/ByteArray';

/**
 * Interface for encryption/decryption
 * Supports state preservation for handling incomplete messages
 */
export interface IEncryption
{
    /**
	 * Initialize the cipher with a key
	 */
    // AS3: .../src/com/sulake/core/communication/encryption/IEncryption.as::init()
    init(key: ByteArray): void;

    /**
	 * Encrypt data in-place
	 */
    // AS3: .../src/com/sulake/core/communication/encryption/IEncryption.as::encipher()
    encipher(data: ByteArray): void;

    /**
	 * Decrypt data in-place
	 */
    // AS3: .../src/com/sulake/core/communication/encryption/IEncryption.as::decipher()
    decipher(data: ByteArray): void;

    /**
	 * Mark/save current cipher state
	 * Used when reading incomplete messages
	 */
    // AS3: .../src/com/sulake/core/communication/encryption/IEncryption.as::mark()
    mark(): void;

    /**
	 * Reset to marked state
	 * Used to restore state when message was incomplete
	 */
    // AS3: .../src/com/sulake/core/communication/encryption/IEncryption.as::reset()
    reset(): void;
}
