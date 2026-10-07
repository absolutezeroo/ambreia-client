import type {IRoomSession} from '../IRoomSession';
import {RoomSessionEvent} from './RoomSessionEvent';
import {RoomSessionDimmerPresetsEventPresetItem} from './RoomSessionDimmerPresetsEventPresetItem';

/**
 * Room session dimmer presets event
 *
 * @see source_as_win63/habbo/session/events/RoomSessionDimmerPresetsEvent.as
 */
export class RoomSessionDimmerPresetsEvent extends RoomSessionEvent
{
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEvent.as::ROOM_DIMMER_PRESETS
    public static readonly ROOM_DIMMER_PRESETS = 'RSDPE_PRESETS';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEvent.as::_presets
    private _presets: RoomSessionDimmerPresetsEventPresetItem[] = [];

    constructor(type: string, session: IRoomSession, openLandingPage: boolean = false)
    {
        super(type, session, openLandingPage);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEvent.as::_selectedPresetId
    private _selectedPresetId: number = 0;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEvent.as::get selectedPresetId()
    get selectedPresetId(): number
    {
        return this._selectedPresetId;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEvent.as::set selectedPresetId()
    set selectedPresetId(value: number)
    {
        this._selectedPresetId = value;
    }

    private _itemId: number = 0;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEvent.as::get itemId()
    get itemId(): number
    {
        return this._itemId;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEvent.as::set itemId()
    set itemId(value: number)
    {
        this._itemId = value;
    }

    private _isOn: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEvent.as::get isOn()
    get isOn(): boolean
    {
        return this._isOn;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEvent.as::set isOn()
    set isOn(value: boolean)
    {
        this._isOn = value;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEvent.as::get presetCount()
    get presetCount(): number
    {
        return this._presets.length;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEvent.as::storePreset()
    storePreset(id: number, type: number, color: number, light: number): void
    {
        const preset = new RoomSessionDimmerPresetsEventPresetItem(id, type, color, light);
        this._presets[id - 1] = preset;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEvent.as::getPreset()
    getPreset(index: number): RoomSessionDimmerPresetsEventPresetItem | null
    {
        if(index < 0 || index >= this._presets.length)
        {
            return null;
        }
        return this._presets[index];
    }
}
