import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import {AreaHideMessageData} from './AreaHideMessageData';

/**
 * AreaHideMessageParser — an area-hide furni toggled its hidden zone (WIN63 header 1131). The whole
 * payload is read by AreaHideMessageData; this parser is just its holder.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_3760`); named after the readable
 * `AreaHideMessageData` it wraps and its consumer `RoomMessageHandler.onAreaHide`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2942/_SafeCls_3760.as
 */
export class AreaHideMessageParser implements IMessageParser
{
    // AS3: _SafeCls_3760.as::_SafeStr_7991 (name recovered from `get areaHideMessageData()`)
    private _areaHideMessageData: AreaHideMessageData | null = null;

    // AS3: _SafeCls_3760.as::get areaHideMessageData()
    get areaHideMessageData(): AreaHideMessageData | null
    {
        return this._areaHideMessageData;
    }

    // AS3: _SafeCls_3760.as::flush()
    flush(): boolean
    {
        this._areaHideMessageData = null;
        return true;
    }

    // AS3: _SafeCls_3760.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper == null)
        {
            return false;
        }

        this._areaHideMessageData = new AreaHideMessageData(wrapper);
        return true;
    }
}
