/** An NPC of the zone and what it has for this player: available, ready, active, or empty (M2a §3.2). */
export interface IRpgNpcMarker
{
    readonly objectId: number;
    /** available (« ! »), ready (« ? »), active (grey « ? »), or empty. */
    readonly marker: string;
}
