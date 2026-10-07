/**
 * FurnitureYoutubeLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureYoutubeLogic.as
 *
 * Logic for YouTube video furniture (widget = YOUTUBE, requests URL prefix).
 */
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectDataRequestEvent} from '../../scene/events/RoomObjectDataRequestEvent';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureYoutubeLogic extends FurnitureLogic
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/furniture/_SafeCls_2249.as::get widget()
    // The `RWE_` prefix is not decorative: RoomDesktop.processEvent() delivers an open/close-widget
    // event only to the handler whose `type` equals this string, and every handler's type is the
    // prefixed form. Returning the bare name silently routed the event to nobody.
    override get widget(): string | null
    {
        return 'RWE_YOUTUBE';
    }

    override getEventTypes(): string[]
    {
        return this.getAllEventTypes(super.getEventTypes(), [
            RoomObjectDataRequestEvent.URL_PREFIX
        ]);
    }

    override update(time: number): void
    {
        super.update(time);

        if(this.object === null)
        {
            return;
        }

        if(!this.object.getModel().hasString(RoomObjectVariableEnum.SESSION_URL_PREFIX))
        {
            this.eventDispatcher?.emit(
                RoomObjectDataRequestEvent.URL_PREFIX,
                new RoomObjectDataRequestEvent(RoomObjectDataRequestEvent.URL_PREFIX, this.object)
            );
        }
    }
}
