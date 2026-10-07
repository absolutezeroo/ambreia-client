import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * How many seconds the server will keep refusing this player's chat.
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2918/_SafeCls_3568.as
 *
 * One integer, nothing else. `RoomChatHandler` turns it into
 * `RoomSessionChatEvent.RSCE_FLOOD_EVENT`, which `ChatInputWidgetHandler` was already listening for.
 *
 * The name comes from vortex-emulator (`FloodControlMessageComposer`); no unobfuscated tree carries
 * this parser.
 */
export class FloodControlMessageParser implements IMessageParser
{
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2918/_SafeCls_3568.as::seconds
    // backing field — obfuscated in every available tree, named after its only accessor.
    private _seconds: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2918/_SafeCls_3568.as::get seconds()
    get seconds(): number
    {
        return this._seconds;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2918/_SafeCls_3568.as::flush()
    flush(): boolean
    {
        this._seconds = 0;

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2918/_SafeCls_3568.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        // AS3's readInteger() is this port's readInt() — same 32-bit field.
        this._seconds = wrapper.readInt();

        return true;
    }
}
