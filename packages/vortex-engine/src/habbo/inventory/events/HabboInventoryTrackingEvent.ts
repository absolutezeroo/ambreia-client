/**
 * The tracking event names the inventory emits as the user moves between its tabs, plus one for
 * closing it. They exist so the tracking backend sees which tab was opened, not to drive any UI.
 *
 * The values were already spelled out as string literals across the inventory models; this is their
 * AS3 home.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/events/HabboInventoryTrackingEvent.as
 */
export class HabboInventoryTrackingEvent
{
    // AS3: .../src/com/sulake/habbo/inventory/events/HabboInventoryTrackingEvent.as::HABBO_INVENTORY_TRACKING_EVENT_CLOSED
    public static readonly CLOSED: string = 'HABBO_INVENTORY_TRACKING_EVENT_CLOSED';

    // AS3: .../src/com/sulake/habbo/inventory/events/HabboInventoryTrackingEvent.as::HABBO_INVENTORY_TRACKING_EVENT_FURNI
    public static readonly FURNI: string = 'HABBO_INVENTORY_TRACKING_EVENT_FURNI';

    // AS3: .../src/com/sulake/habbo/inventory/events/HabboInventoryTrackingEvent.as::HABBO_INVENTORY_TRACKING_EVENT_POSTERS
    public static readonly POSTERS: string = 'HABBO_INVENTORY_TRACKING_EVENT_POSTERS';

    // AS3: .../src/com/sulake/habbo/inventory/events/HabboInventoryTrackingEvent.as::HABBO_INVENTORY_TRACKING_EVENT_BADGES
    public static readonly BADGES: string = 'HABBO_INVENTORY_TRACKING_EVENT_BADGES';

    // AS3: .../src/com/sulake/habbo/inventory/events/HabboInventoryTrackingEvent.as::HABBO_INVENTORY_TRACKING_EVENT_ACHIEVEMENTS
    public static readonly ACHIEVEMENTS: string = 'HABBO_INVENTORY_TRACKING_EVENT_ACHIEVEMENTS';

    // AS3: .../src/com/sulake/habbo/inventory/events/HabboInventoryTrackingEvent.as::HABBO_INVENTORY_TRACKING_EVENT_TRADING
    public static readonly TRADING: string = 'HABBO_INVENTORY_TRACKING_EVENT_TRADING';

    // AS3: .../src/com/sulake/habbo/inventory/events/HabboInventoryTrackingEvent.as::HABBO_INVENTORY_TRACKING_EVENT_PETS
    public static readonly PETS: string = 'HABBO_INVENTORY_TRACKING_EVENT_PETS';

    // AS3: .../src/com/sulake/habbo/inventory/events/HabboInventoryTrackingEvent.as::HABBO_INVENTORY_TRACKING_EVENT_BOTS
    public static readonly BOTS: string = 'HABBO_INVENTORY_TRACKING_EVENT_BOTS';
}
