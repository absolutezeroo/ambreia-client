/**
 * FurnitureBadgeDisplayLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureBadgeDisplayLogic.as
 *
 * Logic for badge display furniture (loads and shows badge assets).
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectBadgeAssetEvent} from '../../scene/events/RoomObjectBadgeAssetEvent';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';
import type {RoomObjectDataUpdateMessage} from '../../scene/messages/RoomObjectDataUpdateMessage';
import type {RoomObjectGroupBadgeUpdateMessage} from '../../scene/messages/RoomObjectGroupBadgeUpdateMessage';
import type {StringArrayStuffData} from '../../scene/object/data/StringArrayStuffData';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureBadgeDisplayLogic extends FurnitureLogic
{
    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectBadgeAssetEvent.LOAD_BADGE,
            RoomObjectWidgetRequestEvent.ROWRE_BADGE_DISPLAY_ENGRAVING
        ];

        return this.getAllEventTypes(super.getEventTypes(), types);
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        const dataMessage = message as unknown as RoomObjectDataUpdateMessage;

        if('state' in message && 'data' in message && dataMessage.data !== null)
        {
            const stringData = dataMessage.data as unknown as StringArrayStuffData;

            if(typeof stringData.getValue === 'function')
            {
                this.updateBadge(stringData.getValue(1));
            }
        }

        const badgeMessage = message as unknown as RoomObjectGroupBadgeUpdateMessage;

        if('assetName' in message && 'badgeId' in message)
        {
            if(badgeMessage.assetName !== 'loading_icon')
            {
                this.object?.getModelController()?.setString(RoomObjectVariableEnum.FURNITURE_BADGE_ASSET_NAME, badgeMessage.assetName);
                this.object?.getModelController()?.setNumber(RoomObjectVariableEnum.FURNITURE_BADGE_IMAGE_STATUS, 1);
                this.update(performance.now());
            }
        }
    }

    override mouseEvent(event: RoomSpriteMouseEvent, geometry: IRoomGeometry): void
    {
        if(event === null || geometry === null)
        {
            return;
        }

        if(this.object === null)
        {
            return;
        }

        if(event.type === 'doubleClick')
        {
            this.useObject();
            return;
        }

        super.mouseEvent(event, geometry);
    }

    override useObject(): void
    {
        if(this.eventDispatcher !== null && this.object !== null)
        {
            this.eventDispatcher.emit(
                RoomObjectWidgetRequestEvent.ROWRE_BADGE_DISPLAY_ENGRAVING,
                new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_BADGE_DISPLAY_ENGRAVING, this.object)
            );
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureBadgeDisplayLogic.as::updateBadge()
    protected updateBadge(badgeId: string): void
    {
        if(badgeId !== '' && this.eventDispatcher !== null && this.object !== null)
        {
            this.eventDispatcher.emit(
                RoomObjectBadgeAssetEvent.LOAD_BADGE,
                new RoomObjectBadgeAssetEvent(RoomObjectBadgeAssetEvent.LOAD_BADGE, this.object, badgeId, false)
            );
        }
    }
}
