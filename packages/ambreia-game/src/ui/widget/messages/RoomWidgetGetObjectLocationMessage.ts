import {RoomWidgetMessage} from './RoomWidgetMessage';

/**
 * "Where is this object on screen?" — the only widget message whose answer is returned
 * synchronously, as the `RoomWidgetUpdateEvent` `processWidgetMessage()` hands back.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetGetObjectLocationMessage.as
 */
export class RoomWidgetGetObjectLocationMessage extends RoomWidgetMessage
{
    // AS3: .../widget/messages/RoomWidgetGetObjectLocationMessage.as::GET_OBJECT_LOCATION
    // Name DERIVED (`_SafeStr_10568`): obfuscated in every tree, named after its own value.
    public static readonly GET_OBJECT_LOCATION: string = 'RWGOI_MESSAGE_GET_OBJECT_LOCATION';

    // AS3: .../widget/messages/RoomWidgetGetObjectLocationMessage.as::GET_GAME_OBJECT_LOCATION
    // Name DERIVED (`_SafeStr_11363`), likewise.
    public static readonly GET_GAME_OBJECT_LOCATION: string = 'RWGOI_MESSAGE_GET_GAME_OBJECT_LOCATION';

    // AS3: .../widget/messages/RoomWidgetGetObjectLocationMessage.as::_objectId
    private _objectId: number;

    // AS3: .../widget/messages/RoomWidgetGetObjectLocationMessage.as::_objectType
    private _objectType: number;

    // AS3: .../widget/messages/RoomWidgetGetObjectLocationMessage.as::RoomWidgetGetObjectLocationMessage()
    constructor(type: string, objectId: number, objectType: number)
    {
        super(type);

        this._objectId = objectId;
        this._objectType = objectType;
    }

    // AS3: .../widget/messages/RoomWidgetGetObjectLocationMessage.as::get objectId()
    get objectId(): number
    {
        return this._objectId;
    }

    // AS3: .../widget/messages/RoomWidgetGetObjectLocationMessage.as::get objectType()
    get objectType(): number
    {
        return this._objectType;
    }
}
