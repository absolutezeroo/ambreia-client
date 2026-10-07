import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for the live room visualization settings push (wall visibility + wall/floor
 * thickness), sent when a room's build settings change while the client is in the room.
 *
 * @see sources/win63_version/habbo/communication/messages/parser/room/engine/RoomVisualizationSettingsEventParser.as
 */
export class RoomVisualizationSettingsEventParser implements IMessageParser
{
    private _wallsHidden: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/RoomVisualizationSettingsEventParser.as::get wallsHidden()
    get wallsHidden(): boolean
    {
        return this._wallsHidden;
    }

    private _wallThicknessMultiplier: number = 1;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/RoomVisualizationSettingsEventParser.as::get wallThicknessMultiplier()
    get wallThicknessMultiplier(): number
    {
        return this._wallThicknessMultiplier;
    }

    private _floorThicknessMultiplier: number = 1;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/RoomVisualizationSettingsEventParser.as::get floorThicknessMultiplier()
    get floorThicknessMultiplier(): number
    {
        return this._floorThicknessMultiplier;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/RoomVisualizationSettingsEventParser.as::flush()
    flush(): boolean
    {
        this._wallsHidden = false;
        this._wallThicknessMultiplier = 1;
        this._floorThicknessMultiplier = 1;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/RoomVisualizationSettingsEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._wallsHidden = wrapper.readBoolean();

        let wallThickness = wrapper.readInt();
        let floorThickness = wrapper.readInt();

        if(wallThickness < -2) wallThickness = -2;
        else if(wallThickness > 1) wallThickness = 1;

        if(floorThickness < -2) floorThickness = -2;
        else if(floorThickness > 1) floorThickness = 1;

        this._wallThicknessMultiplier = Math.pow(2, wallThickness);
        this._floorThicknessMultiplier = Math.pow(2, floorThickness);

        return true;
    }
}
