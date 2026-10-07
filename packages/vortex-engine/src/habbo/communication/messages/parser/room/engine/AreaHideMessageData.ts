/**
 * AreaHideMessageData
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.AreaHideMessageData
 *
 * Data for area hide furniture zones.
 */
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IAreaHideInfo} from '@ambreia/iso/scene/IAreaHideInfo';

export class AreaHideMessageData implements IAreaHideInfo
{
    constructor(wrapper: IMessageDataWrapper)
    {
        this._furniId = wrapper.readInt();
        this._on = wrapper.readBoolean();
        this._rootX = wrapper.readInt();
        this._rootY = wrapper.readInt();
        this._width = wrapper.readInt();
        this._length = wrapper.readInt();
        this._invert = wrapper.readBoolean();
    }

    private _furniId: number;

    // AS3: .../src/unknowns/_SafePkg_2184/AreaHideMessageData.as::get furniId()
    get furniId(): number
    {
        return this._furniId;
    }

    // AS3: .../src/unknowns/_SafePkg_2184/AreaHideMessageData.as::_on
    private _on: boolean;

    // AS3: .../src/unknowns/_SafePkg_2184/AreaHideMessageData.as::get on()
    get on(): boolean
    {
        return this._on;
    }

    private _rootX: number;

    // AS3: .../src/unknowns/_SafePkg_2184/AreaHideMessageData.as::get rootX()
    get rootX(): number
    {
        return this._rootX;
    }

    private _rootY: number;

    // AS3: .../src/unknowns/_SafePkg_2184/AreaHideMessageData.as::get rootY()
    get rootY(): number
    {
        return this._rootY;
    }

    // AS3: .../src/unknowns/_SafePkg_2184/AreaHideMessageData.as::_width
    private _width: number;

    // AS3: .../src/unknowns/_SafePkg_2184/AreaHideMessageData.as::get width()
    get width(): number
    {
        return this._width;
    }

    // AS3: .../src/unknowns/_SafePkg_2184/AreaHideMessageData.as::_length
    private _length: number;

    // AS3: .../src/unknowns/_SafePkg_2184/AreaHideMessageData.as::get length()
    get length(): number
    {
        return this._length;
    }

    private _invert: boolean;

    // AS3: .../src/unknowns/_SafePkg_2184/AreaHideMessageData.as::get invert()
    get invert(): boolean
    {
        return this._invert;
    }
}
