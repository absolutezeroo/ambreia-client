/**
 * What the room engine is currently doing to an object — placing it, dragging it, rotating a ghost,
 * picking it up.
 *
 * The values were already all over the port as bare string literals (`'OBJECT_PLACE'` in
 * `RoomEngine`, `CatalogObjectMover` and `RecyclerCatalogWidget`); this is their AS3 home.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomObjectOperationEnum.as
 */
export class RoomObjectOperationEnum
{
    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectOperationEnum.as::OBJECT_UNDEFINED
    public static readonly OBJECT_UNDEFINED: string = 'OBJECT_UNDEFINED';

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectOperationEnum.as::OBJECT_MOVE
    public static readonly OBJECT_MOVE: string = 'OBJECT_MOVE';

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectOperationEnum.as::OBJECT_PLACE
    public static readonly OBJECT_PLACE: string = 'OBJECT_PLACE';

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectOperationEnum.as::OBJECT_ROTATE_POSITIVE
    public static readonly OBJECT_ROTATE_POSITIVE: string = 'OBJECT_ROTATE_POSITIVE';

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectOperationEnum.as::OBJECT_ROTATE_NEGATIVE
    public static readonly OBJECT_ROTATE_NEGATIVE: string = 'OBJECT_ROTATE_NEGATIVE';

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectOperationEnum.as::OBJECT_MOVE_TO
    public static readonly OBJECT_MOVE_TO: string = 'OBJECT_MOVE_TO';

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectOperationEnum.as::OBJECT_PLACE_TO
    public static readonly OBJECT_PLACE_TO: string = 'OBJECT_PLACE_TO';

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectOperationEnum.as::OBJECT_PICKUP
    public static readonly OBJECT_PICKUP: string = 'OBJECT_PICKUP';

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectOperationEnum.as::OBJECT_PICKUP_BOT
    public static readonly OBJECT_PICKUP_BOT: string = 'OBJECT_PICKUP_BOT';

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectOperationEnum.as::OBJECT_PICKUP_PET
    public static readonly OBJECT_PICKUP_PET: string = 'OBJECT_PICKUP_PET';

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectOperationEnum.as::OBJECT_EJECT
    public static readonly OBJECT_EJECT: string = 'OBJECT_EJECT';

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectOperationEnum.as::OBJECT_SAVE_STUFF_DATA
    public static readonly OBJECT_SAVE_STUFF_DATA: string = 'OBJECT_SAVE_STUFF_DATA';
}
