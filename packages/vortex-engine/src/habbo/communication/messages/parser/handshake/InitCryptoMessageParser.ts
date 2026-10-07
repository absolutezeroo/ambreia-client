import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for InitDiffieHandshake response from server
 * Message ID: 771
 * Contains the encrypted prime and generator for Diffie-Hellman
 *
 * @see source_as_win63/habbo/communication/messages/parser/handshake/InitDiffieHandshakeEventParser.as
 */
export class InitDiffieHandshakeMessageParser implements IMessageParser
{
    private _encryptedPrime: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/InitDiffieHandshakeEventParser.as::get encryptedPrime()
    get encryptedPrime(): string
    {
        return this._encryptedPrime;
    }

    private _encryptedGenerator: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/InitDiffieHandshakeEventParser.as::get encryptedGenerator()
    get encryptedGenerator(): string
    {
        return this._encryptedGenerator;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/InitDiffieHandshakeEventParser.as::flush()
    flush(): boolean
    {
        this._encryptedPrime = '';
        this._encryptedGenerator = '';
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/InitDiffieHandshakeEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper.bytesAvailable < 2) return false;

        this._encryptedPrime = wrapper.readString();
        this._encryptedGenerator = wrapper.readString();

        return true;
    }
}
