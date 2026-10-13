import type {RpgZoneInteractivesMessage} from '@ambreia/protocol/incoming/rpg/interaction/RpgZoneInteractivesMessage';
import type {RpgTargetMessage} from '@ambreia/protocol/incoming/rpg/interaction/RpgTargetMessage';

/** What the interaction session announces: the zone's usable objects, and a target set by the server. */
export interface IRpgInteractionSessionEvents
{
    interactives: [RpgZoneInteractivesMessage];
    target: [RpgTargetMessage];
}
