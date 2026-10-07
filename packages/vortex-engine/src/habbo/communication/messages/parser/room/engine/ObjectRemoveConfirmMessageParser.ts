import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * ObjectRemoveConfirmMessageParser — the server refuses to pick an object up without a confirmation
 * (WIN63 header 3643), and supplies the localisation keys for the dialog it wants shown.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_3699`); named after its readable consumer
 * `RoomMessageHandler.onObjectRemoveConfirm`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_3699.as
 */
export class ObjectRemoveConfirmMessageParser implements IMessageParser
{
    // AS3: _SafeCls_3699.as::_SafeStr_4689 (name recovered from `get category()`)
    private _category: number = 0;

    // AS3: _SafeCls_3699.as::_SafeStr_4872 (name recovered from `get id()`)
    private _id: number = 0;

    // AS3: _SafeCls_3699.as::_SafeStr_7684 (name recovered from `get confirmTitle()`)
    private _confirmTitle: string = '';

    // AS3: _SafeCls_3699.as::_SafeStr_8295 (name recovered from `get confirmBody()`)
    private _confirmBody: string = '';

    // AS3: _SafeCls_3699.as::get category()
    get category(): number
    {
        return this._category;
    }

    // AS3: _SafeCls_3699.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: _SafeCls_3699.as::get confirmTitle()
    get confirmTitle(): string
    {
        return this._confirmTitle;
    }

    // AS3: _SafeCls_3699.as::get confirmBody()
    get confirmBody(): string
    {
        return this._confirmBody;
    }

    // AS3: _SafeCls_3699.as::flush()
    flush(): boolean
    {
        this._category = 0;
        this._id = 0;
        this._confirmBody = '';
        this._confirmTitle = '';
        return true;
    }

    // AS3: _SafeCls_3699.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper == null)
        {
            return false;
        }

        // The wire carries a 0/1 flag, not a room-object category: AS3 maps it straight to
        // OBJECT_CATEGORY_WALL (20) / OBJECT_CATEGORY_FURNITURE (10) here, so `category` is already
        // in engine terms by the time the handler sees it.
        this._category = wrapper.readInt() === 1 ? 20 : 10;
        this._id = wrapper.readInt();
        this._confirmTitle = wrapper.readString();
        this._confirmBody = wrapper.readString();
        return true;
    }
}
