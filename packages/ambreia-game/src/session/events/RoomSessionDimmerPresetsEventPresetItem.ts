/**
 * Dimmer preset item
 *
 * @see source_as_win63/habbo/session/events/RoomSessionDimmerPresetsEventPresetItem.as
 */
export class RoomSessionDimmerPresetsEventPresetItem
{
    constructor(id: number, type: number, color: number, light: number)
    {
        this._id = id;
        this._type = type;
        this._color = color;
        this._light = light;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEventPresetItem.as::_id
    private _id: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEventPresetItem.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEventPresetItem.as::_type
    private _type: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEventPresetItem.as::get type()
    get type(): number
    {
        return this._type;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEventPresetItem.as::_color
    private _color: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEventPresetItem.as::get color()
    get color(): number
    {
        return this._color;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEventPresetItem.as::_light
    private _light: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDimmerPresetsEventPresetItem.as::get light()
    get light(): number
    {
        return this._light;
    }
}
