import {RoomWidgetUpdateEvent} from './RoomWidgetUpdateEvent';

/**
 * Shows or hides the room's loading bar. Carries nothing beyond its type — the bar has no
 * progress value; it is on or it is off.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetLoadingBarUpdateEvent.as
 */
export class RoomWidgetLoadingBarUpdateEvent extends RoomWidgetUpdateEvent
{
    // AS3: .../widget/events/RoomWidgetLoadingBarUpdateEvent.as::SHOW
    public static readonly SHOW: string = 'RWLBUE_SHOW_LOADING_BAR';

    // AS3: .../widget/events/RoomWidgetLoadingBarUpdateEvent.as::HIDE
    // The typo is AS3's: SHOW is spelled RWLBU**E**, HIDE is RWLBU**W**. Both strings are matched
    // literally throughout, so the inconsistency has to survive the port.
    public static readonly HIDE: string = 'RWLBUW_HIDE_LOADING_BAR';

    // AS3: .../widget/events/RoomWidgetLoadingBarUpdateEvent.as::RoomWidgetLoadingBarUpdateEvent()
    constructor(type: string)
    {
        super(type);
    }
}
