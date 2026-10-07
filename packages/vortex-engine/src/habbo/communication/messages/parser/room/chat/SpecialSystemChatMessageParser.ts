import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * Which special system message to show above a user, and above whom.
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2918/_SafeCls_3507.as
 *
 * Header 3102, from WIN63's own registry (`_SafeCls_2046.as::_events[3102]`). Subscribed by
 * `RoomChatHandler`, which turns it into a `RoomSessionChatEvent` of type
 * {@link RoomSessionChatEvent.CHAT_TYPE_SPECIAL_SYSTEM} — the payload carries no text, only a type
 * code the chat layer resolves.
 *
 * **Name DERIVED, not recovered.** This message exists in no unobfuscated tree: `win63_version` is
 * an older build that does not carry it at all (no file in
 * `habbo/communication/messages/incoming/room/chat/` and no `specialSystemType` anywhere), and
 * vortex-emulator has no constant for 3102 either. It is named for the AS3 handler it feeds,
 * `RoomChatHandler.as::onSpecialSystemChat()`, and for its own `specialSystemType` member.
 */
export class SpecialSystemChatMessageParser implements IMessageParser
{
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2918/_SafeCls_3507.as::userIndex
    // backing field — obfuscated in every available tree, named after its accessor.
    private _userIndex: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2918/_SafeCls_3507.as::specialSystemType
    private _specialSystemType: number = 0;

    /**
	 * The room *index* of the user the message belongs above — not a user id. AS3 resolves it with
	 * `userDataManager.getUserDataByIndex()` and dispatches the room object id it finds.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2918/_SafeCls_3507.as::get userIndex()
    get userIndex(): number
    {
        return this._userIndex;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2918/_SafeCls_3507.as::get specialSystemType()
    get specialSystemType(): number
    {
        return this._specialSystemType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2918/_SafeCls_3507.as::flush()
    flush(): boolean
    {
        this._userIndex = 0;
        this._specialSystemType = 0;

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2918/_SafeCls_3507.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        // AS3's readInteger() is this port's readInt() — same 32-bit field, both of them.
        this._userIndex = wrapper.readInt();
        this._specialSystemType = wrapper.readInt();

        return true;
    }
}
