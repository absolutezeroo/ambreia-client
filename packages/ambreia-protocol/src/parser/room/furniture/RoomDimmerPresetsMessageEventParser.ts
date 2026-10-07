import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for room dimmer presets message
 *
 * @see source_as_win63/habbo/communication/messages/parser/room/furniture/RoomDimmerPresetsMessageEventParser.as
 */
export class RoomDimmerPresetsMessageEventParser implements IMessageParser
{
    private _presets: IDimmerPreset[] = [];

    private _selectedPresetId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/RoomDimmerPresetsMessageEventParser.as::get selectedPresetId()
    get selectedPresetId(): number
    {
        return this._selectedPresetId;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/RoomDimmerPresetsMessageEventParser.as::get presetCount()
    get presetCount(): number
    {
        return this._presets.length;
    }

    private _itemId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/RoomDimmerPresetsMessageEventParser.as::get itemId()
    get itemId(): number
    {
        return this._itemId;
    }

    private _isOn: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/RoomDimmerPresetsMessageEventParser.as::get isOn()
    get isOn(): boolean
    {
        return this._isOn;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/RoomDimmerPresetsMessageEventParser.as::getPreset()
    getPreset(index: number): IDimmerPreset | null
    {
        if(index < 0 || index >= this._presets.length)
        {
            return null;
        }
        return this._presets[index];
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/RoomDimmerPresetsMessageEventParser.as::flush()
    flush(): boolean
    {
        this._presets = [];
        this._selectedPresetId = 0;
        this._itemId = 0;
        this._isOn = false;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/RoomDimmerPresetsMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const count = wrapper.readInt();
        this._selectedPresetId = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const id = wrapper.readInt();
            const type = wrapper.readInt();
            const colorStr = wrapper.readString();
            const color = parseInt(colorStr.substr(1), 16);
            const light = wrapper.readInt();

            this._presets.push({id, type, color, light});
        }

        this._isOn = wrapper.readBoolean();
        this._itemId = wrapper.readInt();

        return true;
    }
}

export interface IDimmerPreset
{
    id: number;
    type: number;
    color: number;
    light: number;
}
