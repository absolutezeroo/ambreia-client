import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for availability status message
 * Indicates if the hotel is open, shutting down, etc.
 *
 * @see source_as_win63/habbo/communication/messages/parser/availability/AvailabilityStatusMessageEventParser.as
 */
export class AvailabilityStatusMessageParser implements IMessageParser
{
    // AS3: sources/win63_version/habbo/communication/messages/parser/availability/AvailabilityStatusMessageEventParser.as::_isOpen
    private _isOpen: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/availability/AvailabilityStatusMessageEventParser.as::get isOpen()
    get isOpen(): boolean
    {
        return this._isOpen;
    }

    private _onShutDown: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/availability/AvailabilityStatusMessageEventParser.as::get onShutDown()
    get onShutDown(): boolean
    {
        return this._onShutDown;
    }

    private _isAuthenticHabbo: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/availability/AvailabilityStatusMessageEventParser.as::get isAuthenticHabbo()
    get isAuthenticHabbo(): boolean
    {
        return this._isAuthenticHabbo;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/availability/AvailabilityStatusMessageEventParser.as::flush()
    flush(): boolean
    {
        this._isOpen = false;
        this._onShutDown = false;
        this._isAuthenticHabbo = false;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/availability/AvailabilityStatusMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._isOpen = wrapper.readBoolean();
        this._onShutDown = wrapper.readBoolean();
        if(wrapper.bytesAvailable > 0)
        {
            this._isAuthenticHabbo = wrapper.readBoolean();
        }
        return true;
    }
}
