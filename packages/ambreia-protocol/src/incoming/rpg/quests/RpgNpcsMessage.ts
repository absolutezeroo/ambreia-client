import type {IRpgNpcMarker} from './IRpgNpcMarker';

/** The zone's NPCs and their markers for this player: on entry, then on each quest change (M2a §3.2). */
export class RpgNpcsMessage
{
    constructor(
        readonly npcs: readonly IRpgNpcMarker[]
    ) {}
}
