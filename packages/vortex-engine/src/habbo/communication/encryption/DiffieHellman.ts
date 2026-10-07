import type {IKeyExchange} from '@core/communication/handshake/IKeyExchange';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.communication.encryption.DiffieHellman');

/**
 * Simple BigInteger implementation for Diffie-Hellman
 * Uses native BigInt for calculations
 */
class BigIntWrapper
{
    private _value: bigint;

    constructor(value: bigint | string | number = 0n)
    {
        if(typeof value === 'string')
        {
            this._value = BigInt(value);
        }
        else if(typeof value === 'number')
        {
            this._value = BigInt(value);
        }
        else
        {
            this._value = value;
        }
    }

    static fromRadix(str: string, radix: number = 16): BigIntWrapper
    {
        if(radix === 16)
        {
            return new BigIntWrapper(BigInt('0x' + str));
        }
        else if(radix === 10)
        {
            return new BigIntWrapper(BigInt(str));
        }
        else
        {
            // Manual conversion for other radixes
            let result = 0n;
            const base = BigInt(radix);

            for(const char of str)
            {
                const digit = parseInt(char, radix);

                result = result * base + BigInt(digit);
            }

            return new BigIntWrapper(result);
        }
    }

    toRadix(radix: number = 16): string
    {
        if(radix === 16)
        {
            return this._value.toString(16);
        }
        else if(radix === 10)
        {
            return this._value.toString(10);
        }
        else
        {
            // Manual conversion for other radixes
            if(this._value === 0n) return '0';

            const base = BigInt(radix);
            const digits: string[] = [];

            let remaining = this._value;

            while(remaining > 0n)
            {
                const digit = Number(remaining % base);

                digits.unshift(digit.toString(radix));

                remaining = remaining / base;
            }

            return digits.join('');
        }
    }

    /**
	 * Modular exponentiation: base^exp mod mod
	 */
    modPow(exponent: BigIntWrapper, modulus: BigIntWrapper): BigIntWrapper
    {
        let result = 1n;
        let base = this._value % modulus._value;
        let exp = exponent._value;

        while(exp > 0n)
        {
            if(exp % 2n === 1n)
            {
                result = (result * base) % modulus._value;
            }

            exp = exp / 2n;
            base = (base * base) % modulus._value;
        }

        return new BigIntWrapper(result);
    }

    compareTo(other: BigIntWrapper): number
    {
        if(this._value < other._value) return -1;

        if(this._value > other._value) return 1;

        return 0;
    }

    getValue(): bigint
    {
        return this._value;
    }
}

/**
 * Diffie-Hellman key exchange implementation
 */
export class DiffieHellman implements IKeyExchange
{
    // AS3: .../src/com/sulake/habbo/communication/encryption/DiffieHellman.as::_prime
    private _prime: BigIntWrapper;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/encryption/DiffieHellman.as::_generator
    private _generator: BigIntWrapper;
    // AS3: .../src/com/sulake/habbo/communication/encryption/DiffieHellman.as::_privateKey
    private _privateKey: BigIntWrapper | null = null;
    // AS3: .../src/com/sulake/habbo/communication/encryption/DiffieHellman.as::_publicKey
    private _publicKey: BigIntWrapper | null = null;
    // AS3: .../src/com/sulake/habbo/communication/encryption/DiffieHellman.as::_serverPublicKey
    private _serverPublicKey: BigIntWrapper | null = null;
    // AS3: .../src/com/sulake/habbo/communication/encryption/DiffieHellman.as::_sharedKey
    private _sharedKey: BigIntWrapper | null = null;

    // AS3: .../src/com/sulake/habbo/communication/encryption/DiffieHellman.as::_minimumPublicKey
    private readonly _minimumPublicKey = new BigIntWrapper(2n);
    private readonly _minimumSharedKey = new BigIntWrapper(2n);

    /**
	 * Create a new Diffie-Hellman key exchange
	 * @param primeHex Prime number (p) as hex string
	 * @param generatorHex Generator (g) as hex string
	 */
    constructor(primeHex: string, generatorHex: string)
    {
        this._prime = BigIntWrapper.fromRadix(primeHex, 16);
        this._generator = BigIntWrapper.fromRadix(generatorHex, 16);
    }

    /**
	 * Initialize with our private key
	 */
    // AS3: .../src/com/sulake/habbo/communication/encryption/DiffieHellman.as::init()
    init(privateKeyHex: string, radix: number = 16): boolean
    {
        try
        {
            this._privateKey = BigIntWrapper.fromRadix(privateKeyHex, radix);

            // Calculate public key: g^privateKey mod p
            this._publicKey = this._generator.modPow(this._privateKey, this._prime);

            return true;
        }
        catch (error)
        {
            log.error('DiffieHellman init error:', error);

            return false;
        }
    }

    /**
	 * Generate shared key from server's public key
	 */
    // AS3: .../src/com/sulake/habbo/communication/encryption/DiffieHellman.as::generateSharedKey()
    generateSharedKey(serverPublicKeyHex: string, radix: number = 16): string
    {
        if(!this._privateKey)
        {
            throw new Error('DiffieHellman not initialized');
        }

        this._serverPublicKey = BigIntWrapper.fromRadix(serverPublicKeyHex, radix);

        // Calculate shared key: serverPublicKey^privateKey mod p
        this._sharedKey = this._serverPublicKey.modPow(this._privateKey, this._prime);

        return this.getSharedKey(radix);
    }

    /**
	 * Get our public key
	 */
    // AS3: .../src/com/sulake/habbo/communication/encryption/DiffieHellman.as::getPublicKey()
    getPublicKey(radix: number = 16): string
    {
        if(!this._publicKey)
        {
            throw new Error('DiffieHellman not initialized');
        }

        return this._publicKey.toRadix(radix);
    }

    /**
	 * Get the shared key
	 */
    // AS3: .../src/com/sulake/habbo/communication/encryption/DiffieHellman.as::getSharedKey()
    getSharedKey(radix: number = 16): string
    {
        if(!this._sharedKey)
        {
            throw new Error('Shared key not generated');
        }
        return this._sharedKey.toRadix(radix);
    }

    /**
	 * Validate server's public key (should be >= 2)
	 */
    // AS3: .../src/com/sulake/habbo/communication/encryption/DiffieHellman.as::isValidServerPublicKey()
    isValidServerPublicKey(): boolean
    {
        if(!this._serverPublicKey) return false;
        return this._serverPublicKey.compareTo(this._minimumPublicKey) >= 0;
    }

    /**
	 * Validate the shared key (should be >= 2)
	 */
    // AS3: .../src/com/sulake/habbo/communication/encryption/DiffieHellman.as::isValidSharedKey()
    isValidSharedKey(): boolean
    {
        if(!this._sharedKey) return false;
        return this._sharedKey.compareTo(this._minimumSharedKey) >= 0;
    }
}
