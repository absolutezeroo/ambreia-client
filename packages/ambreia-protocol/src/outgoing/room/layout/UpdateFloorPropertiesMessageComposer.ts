import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Saves the floor plan — the height map text, where the door goes, and the wall/floor thickness.
 *
 * Header 2937, from WIN63's registry (`_SafeCls_2046.as::_composers[2937] = _SafeCls_2580`) and
 * corroborated by vortex-emulator's `UpdateFloorPropertiesMessageEvent = 2937`.
 *
 * **Three body shapes, chosen by which arguments were left at their -1 default** — AS3 branches in
 * the constructor rather than always writing seven fields, so the server reads a 1-, 6- or 7-field
 * message and the field count is the discriminator. Reproduced exactly; collapsing it to one shape
 * would be a wire change.
 *
 * The thickness values are not the dropdown indices: `BCFloorPlanEditor.getThicknessSettingBySelectionIndex()`
 * maps them to -2/-1/0/1 first. `wallHeight` is -1 when the "fixed wall height" checkbox is off.
 *
 * Name recovered from
 * `sources/win63_version/habbo/communication/messages/outgoing/room/layout/UpdateFloorPropertiesMessageComposer.as`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2581/_SafeCls_2580.as
 */
export class UpdateFloorPropertiesMessageComposer extends MessageComposer<(string | number)[]>
{
    // AS3: _SafeCls_2580.as::_SafeStr_4642
    private _data: (string | number)[];

    // AS3: _SafeCls_2580.as::_SafeCls_2580()
    constructor(
        floorPlan: string,
        entryPointX: number = -1,
        entryPointY: number = -1,
        entryPointDir: number = -1,
        wallThickness: number = -1,
        floorThickness: number = -1,
        wallHeight: number = -1
    )
    {
        super();

        // AS3 tests the five middle arguments, not the seventh: a caller that passes only the plan
        // text sends the short form.
        if(entryPointX === -1 && entryPointY === -1 && entryPointDir === -1
            && wallThickness === -1 && floorThickness === -1)
        {
            this._data = [floorPlan];
        }
        else if(wallHeight === -1)
        {
            this._data = [
                floorPlan, entryPointX, entryPointY, entryPointDir, wallThickness, floorThickness
            ];
        }
        else
        {
            this._data = [
                floorPlan, entryPointX, entryPointY, entryPointDir, wallThickness, floorThickness,
                wallHeight
            ];
        }
    }

    // AS3: _SafeCls_2580.as::getMessageArray()
    getMessageArray(): (string | number)[]
    {
        return this._data;
    }
}
