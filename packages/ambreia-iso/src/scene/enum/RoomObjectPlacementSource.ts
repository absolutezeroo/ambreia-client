/**
 * Where a furni being placed in the room came from. Carried on the placement event so a widget can
 * tell "I dragged this out of the catalog preview" from "I dragged it out of my inventory".
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/enum/RoomObjectPlacementSource.as
 */
export class RoomObjectPlacementSource
{
    // AS3: .../src/com/sulake/habbo/room/enum/RoomObjectPlacementSource.as::CATALOG
    public static readonly CATALOG: string = 'catalog';

    // AS3: .../src/com/sulake/habbo/room/enum/RoomObjectPlacementSource.as::INVENTORY
    public static readonly INVENTORY: string = 'inventory';

    // AS3: .../src/com/sulake/habbo/room/enum/RoomObjectPlacementSource.as::INFO_STAND
    public static readonly INFO_STAND: string = 'info_stand';
}
