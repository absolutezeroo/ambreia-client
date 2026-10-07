import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for a single live room property update (floor/wallpaper/landscape type),
 * sent when a room's decoration changes while the client is in the room.
 *
 * @see sources/win63_version/habbo/communication/messages/parser/room/engine/RoomPropertyMessageEventParser.as
 */
export class RoomPropertyMessageEventParser implements IMessageParser
{
    private _floorType: string | null = null;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/RoomPropertyMessageEventParser.as::get floorType()
    get floorType(): string | null
    {
        return this._floorType;
    }

    private _wallType: string | null = null;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/RoomPropertyMessageEventParser.as::get wallType()
    get wallType(): string | null
    {
        return this._wallType;
    }

    private _landscapeType: string | null = null;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/RoomPropertyMessageEventParser.as::get landscapeType()
    get landscapeType(): string | null
    {
        return this._landscapeType;
    }

    private _animatedLandscapeType: string | null = null;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/RoomPropertyMessageEventParser.as::get animatedLandscapeType()
    get animatedLandscapeType(): string | null
    {
        return this._animatedLandscapeType;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/RoomPropertyMessageEventParser.as::flush()
    flush(): boolean
    {
        this._floorType = null;
        this._wallType = null;
        this._landscapeType = null;
        this._animatedLandscapeType = null;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/RoomPropertyMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const propertyName = wrapper.readString();
        const propertyValue = wrapper.readString();

        switch(propertyName)
        {
            case 'floor':
                this._floorType = propertyValue;
                break;
            case 'wallpaper':
                this._wallType = propertyValue;
                break;
            case 'landscape':
                this._landscapeType = propertyValue;
                break;
            case 'landscapeanim':
                this._animatedLandscapeType = propertyValue;
                break;
        }

        return true;
    }
}
