/**
 * Fired on the widget event bus when the player's current room changes, so widgets that
 * depend on room-session state can refresh.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/events/CatalogWidgetRoomChangedEvent.as
 */
export class CatalogWidgetRoomChangedEvent
{
    static readonly CWE_ROOM_CHANGED: string = 'CWE_ROOM_CHANGED';

    get type(): string
    {
        return CatalogWidgetRoomChangedEvent.CWE_ROOM_CHANGED;
    }
}
