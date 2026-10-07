/**
 * Interface for key exchange algorithms (e.g., Diffie-Hellman)
 */
export interface IKeyExchange
{
    /**
	 * Initialize with private key
	 * @param privateKeyHex Private key as hex string
	 * @param radix Number base (default 16 for hex)
	 * @returns Success status
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/communication/handshake/IKeyExchange.as::init()
    init(privateKeyHex: string, radix?: number): boolean;

    /**
	 * Generate shared key from server's public key
	 * @param serverPublicKeyHex Server's public key as hex string
	 * @param radix Number base (default 16 for hex)
	 * @returns Shared key as hex string
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/communication/handshake/IKeyExchange.as::generateSharedKey()
    generateSharedKey(serverPublicKeyHex: string, radix?: number): string;

    /**
	 * Get the shared key
	 * @param radix Number base for output (default 16 for hex)
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/communication/handshake/IKeyExchange.as::getSharedKey()
    getSharedKey(radix?: number): string;

    /**
	 * Get our public key to send to server
	 * @param radix Number base for output (default 16 for hex)
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/communication/handshake/IKeyExchange.as::getPublicKey()
    getPublicKey(radix?: number): string;

    /**
	 * Validate server's public key
	 */
    isValidServerPublicKey(): boolean;

    /**
	 * Validate the computed shared key
	 */
    isValidSharedKey(): boolean;
}
