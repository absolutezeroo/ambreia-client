import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for maintenance status message
 *
 * @see source_as_win63/habbo/communication/messages/parser/availability/MaintenanceStatusMessageEventParser.as
 */
export class MaintenanceStatusMessageEventParser implements IMessageParser
{
    private _isInMaintenance: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/availability/MaintenanceStatusMessageEventParser.as::get isInMaintenance()
    get isInMaintenance(): boolean
    {
        return this._isInMaintenance;
    }

    private _minutesUntilMaintenance: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/availability/MaintenanceStatusMessageEventParser.as::get minutesUntilMaintenance()
    get minutesUntilMaintenance(): number
    {
        return this._minutesUntilMaintenance;
    }

    private _duration: number = 15;

    // AS3: sources/win63_version/habbo/communication/messages/parser/availability/MaintenanceStatusMessageEventParser.as::get duration()
    get duration(): number
    {
        return this._duration;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/availability/MaintenanceStatusMessageEventParser.as::flush()
    flush(): boolean
    {
        this._isInMaintenance = false;
        this._minutesUntilMaintenance = 0;
        this._duration = 15;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/availability/MaintenanceStatusMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._isInMaintenance = wrapper.readBoolean();
        this._minutesUntilMaintenance = wrapper.readInt();

        if(wrapper.bytesAvailable)
        {
            this._duration = wrapper.readInt();
        }

        return true;
    }
}
