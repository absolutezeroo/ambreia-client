import {ByteArray} from '../util/ByteArray';

/**
 * Cryptographic utility functions
 */
export class CryptoTools
{
    /**
	 * Convert ByteArray to string (treating bytes as character codes)
	 */
    // AS3: .../src/com/sulake/core/communication/encryption/CryptoTools.as::byteArrayToString()
    static byteArrayToString(bytes: ByteArray): string
    {
        const savedPosition = bytes.position;
        bytes.position = 0;

        const codes: number[] = new Array(bytes.bytesAvailable);

        for(let i = 0; bytes.bytesAvailable > 0; i++)
        {
            codes[i] = bytes.readUnsignedByte();
        }

        bytes.position = savedPosition;
        return String.fromCharCode(...codes);
    }

    /**
	 * Convert string to ByteArray (treating characters as bytes)
	 */
    // AS3: .../src/com/sulake/core/communication/encryption/CryptoTools.as::stringToByteArray()
    static stringToByteArray(str: string): ByteArray
    {
        const bytes = new ByteArray(str.length);
        for(let i = 0; i < str.length; i++)
        {
            bytes.writeByte(str.charCodeAt(i) & 0xFF);
        }
        bytes.position = 0;
        return bytes;
    }

    /**
	 * Convert ByteArray to hexadecimal string
	 */
    // AS3: .../src/com/sulake/core/communication/encryption/CryptoTools.as::byteArrayToHexString()
    static byteArrayToHexString(bytes: ByteArray, uppercase: boolean = false): string
    {
        const savedPosition = bytes.position;
        bytes.position = 0;

        const parts: string[] = new Array(bytes.bytesAvailable);

        for(let i = 0; bytes.bytesAvailable > 0; i++)
        {
            const byte = bytes.readUnsignedByte();
            const hex = byte.toString(16).padStart(2, '0');
            parts[i] = uppercase ? hex.toUpperCase() : hex;
        }

        bytes.position = savedPosition;
        return parts.join('');
    }

    /**
	 * Convert hexadecimal string to ByteArray
	 */
    // AS3: .../src/com/sulake/core/communication/encryption/CryptoTools.as::hexStringToByteArray()
    static hexStringToByteArray(hex: string): ByteArray
    {
        // Ensure even length
        if(hex.length % 2 !== 0)
        {
            hex = '0' + hex;
        }

        const bytes = new ByteArray(hex.length / 2);
        for(let i = 0; i < hex.length; i += 2)
        {
            const high = parseInt(hex[i], 16);
            const low = parseInt(hex[i + 1], 16);
            bytes.writeByte((high << 4) | low);
        }
        bytes.position = 0;
        return bytes;
    }

    /**
	 * Fletcher-100 checksum
	 */
    // AS3: .../src/com/sulake/core/communication/encryption/CryptoTools.as::fletcher100()
    static fletcher100(bytes: ByteArray, initialA: number = 0, initialB: number = 0): number
    {
        let a = initialA;
        let b = initialB;

        for(let i = 0; i < bytes.length; i++)
        {
            a = (a + bytes.getByte(i)) % 255;
            b = (b + a) % 255;
        }

        return (a + b) % 100;
    }

    /**
	 * Generate random bytes
	 */
    static randomBytes(length: number): ByteArray
    {
        const bytes = new ByteArray(length);
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);

        for(let i = 0; i < length; i++)
        {
            bytes.writeByte(array[i]);
        }
        bytes.position = 0;
        return bytes;
    }

    /**
	 * Generate random hex string
	 */
    static randomHexString(byteLength: number): string
    {
        const bytes = this.randomBytes(byteLength);
        return this.byteArrayToHexString(bytes);
    }
}
