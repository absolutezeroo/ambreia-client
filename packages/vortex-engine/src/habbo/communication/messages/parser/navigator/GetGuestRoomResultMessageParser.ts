import type {IMessageParser} from '@core/communication/messages/IMessageParser';
import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';
import type {IDisposable} from '@ambreia/common/IDisposable';
import {GuestRoomData, RoomModerationSettings} from '../../incoming/navigator';
import {RoomChatSettings} from '../roomsettings/RoomChatSettings';

/**
 * Parser for get guest room result message
 *
 * The traces point at the PRIMARY tree, where this class is `_SafeCls_2063` and every member name
 * is readable. `win63_version`'s `GetGuestRoomResultEventParser.as` is an OLDER build of the same
 * parser, and the difference is not cosmetic: it reads five chat integers off the wire where this
 * revision reads one. Porting that older body is what made this message die on "End of buffer" —
 * see `parse()`.
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2064/_SafeCls_2063.as
 */
export class GetGuestRoomResultMessageParser implements IMessageParser, IDisposable
{
    private _enterRoom: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2064/_SafeCls_2063.as::get enterRoom()
    get enterRoom(): boolean
    {
        return this._enterRoom;
    }

    private _roomForward: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2064/_SafeCls_2063.as::get roomForward()
    get roomForward(): boolean
    {
        return this._roomForward;
    }

    private _staffPick: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2064/_SafeCls_2063.as::get staffPick()
    get staffPick(): boolean
    {
        return this._staffPick;
    }

    private _isGroupMember: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2064/_SafeCls_2063.as::get isGroupMember()
    get isGroupMember(): boolean
    {
        return this._isGroupMember;
    }

    private _openingConnection: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2064/_SafeCls_2063.as::get openingConnection()
    get openingConnection(): boolean
    {
        return this._openingConnection;
    }

    private _data: GuestRoomData | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2064/_SafeCls_2063.as::get data()
    get data(): GuestRoomData | null
    {
        return this._data;
    }

    private _roomModerationSettings: RoomModerationSettings | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2064/_SafeCls_2063.as::get roomModerationSettings()
    get roomModerationSettings(): RoomModerationSettings | null
    {
        return this._roomModerationSettings;
    }

    private _chatSettings: RoomChatSettings | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2064/_SafeCls_2063.as::get chatSettings()
    get chatSettings(): RoomChatSettings | null
    {
        return this._chatSettings;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2064/_SafeCls_2063.as::flush()
    flush(): boolean
    {
        this._enterRoom = false;
        this._roomForward = false;
        this._staffPick = false;
        this._isGroupMember = false;
        this._openingConnection = false;
        this._data = null;
        this._roomModerationSettings = null;
        this._chatSettings = null;

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2064/_SafeCls_2063.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._enterRoom = wrapper.readBoolean();

        this._data = new GuestRoomData(wrapper);

        this._roomForward = wrapper.readBoolean();
        this._staffPick = wrapper.readBoolean();
        this._isGroupMember = wrapper.readBoolean();

        const allInRoomMuted = wrapper.readBoolean();

        this._roomModerationSettings = new RoomModerationSettings(wrapper);

        this._data.allInRoomMuted = allInRoomMuted;
        this._data.canMute = wrapper.readBoolean();

        // ONE integer, not five. `_SafeCls_1709.fromFloodSensitivity()` fills chat mode, bubble
        // width and scroll speed from AS3's own defaults because this revision no longer sends them
        // with the room — they are account preferences now and travel in their own packet. The port
        // had `win63_version`'s older body here, reading all five straight off the wire, so it ate
        // `openingConnection` and then ran 16 bytes past the end of every 3042.
        this._chatSettings = RoomChatSettings.fromFloodSensitivity(wrapper.readInt());

        this._openingConnection = wrapper.readBoolean();

        return true;
    }

    /**
	 * No `_disposed` flag, deliberately: AS3 carries none either and answers `disposed` off the
	 * moderation settings being null, so that one field is both the payload and the flag. A parser
	 * that has never parsed therefore reads as disposed, which is the source's own behaviour.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2064/_SafeCls_2063.as::get disposed()
    get disposed(): boolean
    {
        return this._roomModerationSettings === null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2064/_SafeCls_2063.as::dispose()
    dispose(): void
    {
        this._roomModerationSettings = null;
    }
}
