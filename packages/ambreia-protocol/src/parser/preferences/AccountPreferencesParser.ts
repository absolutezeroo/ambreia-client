import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * Parser for account preferences message
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1927/_SafeCls_1926.as
 * (real name unrecoverable - this AS3 file lives outside com/sulake, but is
 * directly imported by HabboFreeFlowChat.as/SessionDataManager.as as their
 * account-preferences parser, so it is genuinely part of the client despite
 * the path, unlike the rest of src/unknowns/)
 */
export class AccountPreferencesParser implements IMessageParser
{
    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::_uiVolume
    private _uiVolume: number = 0;

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::get uiVolume()
    get uiVolume(): number
    {
        return this._uiVolume;
    }

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::_furniVolume
    private _furniVolume: number = 0;

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::get furniVolume()
    get furniVolume(): number
    {
        return this._furniVolume;
    }

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::_traxVolume
    private _traxVolume: number = 0;

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::get traxVolume()
    get traxVolume(): number
    {
        return this._traxVolume;
    }

    private _roomInvitesIgnored: boolean = false;

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::get roomInvitesIgnored()
    get roomInvitesIgnored(): boolean
    {
        return this._roomInvitesIgnored;
    }

    private _roomCameraFollowDisabled: boolean = false;

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::get roomCameraFollowDisabled()
    get roomCameraFollowDisabled(): boolean
    {
        return this._roomCameraFollowDisabled;
    }

    private _uiFlags: number = 0;

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::get uiFlags()
    get uiFlags(): number
    {
        return this._uiFlags;
    }

    // AS3 field name is "preferedChatStyle" (one r) - matches HabboFreeFlowChat.as's own
    // field spelling, kept here too since both trace to the same AS3 source.
    private _preferedChatStyle: number = 0;

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::get preferedChatStyle()
    get preferedChatStyle(): number
    {
        return this._preferedChatStyle;
    }

    private _wiredMenuButton: boolean = false;

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::get wiredMenuButton()
    get wiredMenuButton(): boolean
    {
        return this._wiredMenuButton;
    }

    private _wiredInspectButton: boolean = false;

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::get wiredInspectButton()
    get wiredInspectButton(): boolean
    {
        return this._wiredInspectButton;
    }

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::_playTestMode
    private _playTestMode: boolean = false;

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::get playTestMode()
    get playTestMode(): boolean
    {
        return this._playTestMode;
    }

    private _wiredWhisperDisabled: boolean = false;

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::get wiredWhisperDisabled()
    get wiredWhisperDisabled(): boolean
    {
        return this._wiredWhisperDisabled;
    }

    private _showAllNotifications: boolean = false;

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::get showAllNotifications()
    get showAllNotifications(): boolean
    {
        return this._showAllNotifications;
    }

    private _wiredUiStyle: string = '';

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::get wiredUiStyle()
    get wiredUiStyle(): string
    {
        return this._wiredUiStyle;
    }

    private _chatSizePreference: number = 0;

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::get chatSizePreference()
    get chatSizePreference(): number
    {
        return this._chatSizePreference;
    }

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::_chatMode
    private _chatMode: number = 0;

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::get chatMode()
    get chatMode(): number
    {
        return this._chatMode;
    }

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::_chatBubbleWidth
    private _chatBubbleWidth: number = 1;

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::get chatBubbleWidth()
    get chatBubbleWidth(): number
    {
        return this._chatBubbleWidth;
    }

    private _chatScrollSpeed: number = 1;

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::get chatScrollSpeed()
    get chatScrollSpeed(): number
    {
        return this._chatScrollSpeed;
    }

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::flush()
    flush(): boolean
    {
        this._uiVolume = 0;
        this._furniVolume = 0;
        this._traxVolume = 0;
        this._roomInvitesIgnored = false;
        this._roomCameraFollowDisabled = false;
        this._uiFlags = 0;
        this._preferedChatStyle = 0;
        this._wiredMenuButton = false;
        this._wiredInspectButton = false;
        this._playTestMode = false;
        this._wiredWhisperDisabled = false;
        this._showAllNotifications = false;
        this._wiredUiStyle = '';
        this._chatSizePreference = 0;
        this._chatMode = 0;
        this._chatBubbleWidth = 1;
        this._chatScrollSpeed = 1;
        return true;
    }

    // AS3: .../src/unknowns/_SafePkg_1927/_SafeCls_1926.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._uiVolume = wrapper.readInt();
        this._furniVolume = wrapper.readInt();
        this._traxVolume = wrapper.readInt();
        wrapper.readBoolean(); // AS3 reads and discards this slot too - no getter for it there either
        this._roomInvitesIgnored = wrapper.readBoolean();
        this._roomCameraFollowDisabled = wrapper.readBoolean();
        this._uiFlags = wrapper.readInt();
        this._preferedChatStyle = wrapper.readInt();
        this._wiredMenuButton = wrapper.readBoolean();
        this._wiredInspectButton = wrapper.readBoolean();
        this._playTestMode = wrapper.readBoolean();
        wrapper.readInt(); // AS3 reads and discards this slot too - no getter for it there either
        this._wiredWhisperDisabled = wrapper.readBoolean();

        // AS3 guards every field from here on with bytesAvailable > 0 - older server
        // builds may send a shorter version of this message without these trailing fields.
        this._showAllNotifications = wrapper.bytesAvailable > 0 ? wrapper.readBoolean() : false;
        this._wiredUiStyle = wrapper.bytesAvailable > 0 ? wrapper.readString() : '';
        this._chatSizePreference = wrapper.bytesAvailable > 0 ? wrapper.readInt() : 0;
        this._chatMode = wrapper.bytesAvailable > 0 ? wrapper.readInt() : 0;
        this._chatBubbleWidth = wrapper.bytesAvailable > 0 ? wrapper.readInt() : 1;
        this._chatScrollSpeed = wrapper.bytesAvailable > 0 ? wrapper.readInt() : 1;

        return true;
    }
}
