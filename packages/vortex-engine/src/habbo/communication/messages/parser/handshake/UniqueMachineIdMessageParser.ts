import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * The machine identifier the server settled on for this client (header 1973).
 *
 * `win63_version` is cited only for the readable class name; the traces below point at the primary
 * tree, where the class is obfuscated but the body is the one that ships.
 *
 * @see sources/win63_version/habbo/communication/messages/parser/handshake/UniqueMachineIDEventParser.as
 */
export class UniqueMachineIdMessageParser implements IMessageParser
{
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1820/_SafeCls_4080.as::machineID
    private _machineId: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1820/_SafeCls_4080.as::get machineID()
    get machineId(): string
    {
        return this._machineId;
    }

    /**
     * Clears the machine id, exactly as AS3 does.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1820/_SafeCls_4080.as::flush()
    flush(): boolean
    {
        this._machineId = '';

        return true;
    }

    /**
     * The guard is this port's, not AS3's: the source reads the string unconditionally. It is
     * harmless against this server, which always writes the field, and it keeps a truncated packet
     * from throwing during the handshake — the one exchange with no UI to report a failure.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1820/_SafeCls_4080.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper.bytesAvailable >= 2)
        {
            this._machineId = wrapper.readString();
        }

        return true;
    }
}
