import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Save a dimmer preset configuration
 *
 * Color is sent as a hex string (e.g., '#ff0000') and apply is sent as 1/0.
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/room/furniture/RoomDimmerSavePresetMessageComposer.as
 */
type RoomDimmerSavePresetMessageArray = [number, number, string, number, boolean, boolean, number];

export class RoomDimmerSavePresetComposer extends MessageComposer<RoomDimmerSavePresetMessageArray>
{
    private _data: RoomDimmerSavePresetMessageArray;

    constructor(presetNumber: number, effectTypeId: number, color: string, brightness: number, apply: boolean, objectId: number)
    {
        super();
        this._data = [presetNumber, effectTypeId, color, brightness, apply, false, objectId];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/furniture/RoomDimmerSavePresetMessageComposer.as::getMessageArray()
    getMessageArray(): RoomDimmerSavePresetMessageArray
    {
        return this._data;
    }
}
