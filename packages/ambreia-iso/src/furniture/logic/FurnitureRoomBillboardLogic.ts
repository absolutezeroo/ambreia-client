/**
 * FurnitureRoomBillboardLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurnitureRoomBillboardLogic.as
 *
 * Logic for room billboard furniture (branding with clickable URL).
 */
import {FurnitureRoomBrandingLogic} from './FurnitureRoomBrandingLogic';
import {RoomObjectRoomAdEvent} from '../../scene/events/RoomObjectRoomAdEvent';

export class FurnitureRoomBillboardLogic extends FurnitureRoomBrandingLogic
{
    constructor()
    {
        super();
        this._hasClickUrl = true;
    }

    protected override getAdClickUrl(model: { getString(key: string): string | null }): string | null
    {
        return model.getString('furniture_branding_url');
    }

    protected override handleAdClick(_id: number, _type: string, url: string): void
    {
        if(url.indexOf('http') === 0)
        {
            window.open(url, '_blank');
        }
        else if(this.eventDispatcher !== null)
        {
            this.eventDispatcher.emit(
                RoomObjectRoomAdEvent.ROOM_AD_FURNI_CLICK,
                new RoomObjectRoomAdEvent(RoomObjectRoomAdEvent.ROOM_AD_FURNI_CLICK, this.object, '', url)
            );
        }
    }
}
