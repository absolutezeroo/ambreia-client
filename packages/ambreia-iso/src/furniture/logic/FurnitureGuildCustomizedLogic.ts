/**
 * FurnitureGuildCustomizedLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurnitureGuildCustomizedLogic.as
 *
 * Logic for guild-customized furniture (badge, colors).
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';
import {RoomObjectBadgeAssetEvent} from '../../scene/events/RoomObjectBadgeAssetEvent';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';
import type {RoomObjectDataUpdateMessage} from '../../scene/messages/RoomObjectDataUpdateMessage';
import type {RoomObjectGroupBadgeUpdateMessage} from '../../scene/messages/RoomObjectGroupBadgeUpdateMessage';
import type {RoomObjectSelectedMessage} from '../../scene/messages/RoomObjectSelectedMessage';

export class FurnitureGuildCustomizedLogic extends FurnitureMultiStateLogic
{
    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureGuildCustomizedLogic.as::GUILD_ID_STUFFDATA_KEY
    public static readonly GUILD_ID_STUFFDATA_KEY = 1;
    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureGuildCustomizedLogic.as::BADGE_CODE_STUFFDATA_KEY
    public static readonly BADGE_CODE_STUFFDATA_KEY = 2;
    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureGuildCustomizedLogic.as::COLOR_1_STUFFDATA_KEY
    public static readonly COLOR_1_STUFFDATA_KEY = 3;
    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureGuildCustomizedLogic.as::COLOR_2_STUFFDATA_KEY
    public static readonly COLOR_2_STUFFDATA_KEY = 4;

    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectBadgeAssetEvent.LOAD_BADGE,
            RoomObjectWidgetRequestEvent.ROWRE_GUILD_FURNI_CONTEXT_MENU,
            RoomObjectWidgetRequestEvent.ROWRE_CLOSE_FURNI_CONTEXT_MENU
        ];

        return this.getAllEventTypes(super.getEventTypes(), types);
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        const dataMessage = message as unknown as RoomObjectDataUpdateMessage;

        if('data' in message && dataMessage.data !== null)
        {
            const data = dataMessage.data as { getValue?(index: number): string };

            if(data.getValue)
            {
                this.updateGuildId(data.getValue(1));
                this.updateGuildBadge(data.getValue(2));
                this.updateGuildColors(data.getValue(3), data.getValue(4));
            }
        }

        const badgeMessage = message as unknown as RoomObjectGroupBadgeUpdateMessage;

        if('assetName' in message && 'badgeId' in message)
        {
            if(badgeMessage.assetName !== 'loading_icon')
            {
                this.object?.getModelController()?.setString('furniture_guild_customized_asset_name', badgeMessage.assetName);
                this.update(performance.now());
            }
        }

        const selectedMessage = message as unknown as RoomObjectSelectedMessage;

        if('selected' in message)
        {
            if(this.eventDispatcher !== null && this.object !== null && !selectedMessage.selected)
            {
                this.eventDispatcher.emit(
                    RoomObjectWidgetRequestEvent.ROWRE_CLOSE_FURNI_CONTEXT_MENU,
                    new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_CLOSE_FURNI_CONTEXT_MENU, this.object)
                );
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

        if(event.type === 'click')
        {
            this.openContextMenu();
        }

        super.mouseEvent(event, geometry);
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureGuildCustomizedLogic.as::openContextMenu()
    protected openContextMenu(): void
    {
        if(this.eventDispatcher !== null && this.object !== null)
        {
            this.eventDispatcher.emit(
                RoomObjectWidgetRequestEvent.ROWRE_GUILD_FURNI_CONTEXT_MENU,
                new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_GUILD_FURNI_CONTEXT_MENU, this.object)
            );
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureGuildCustomizedLogic.as::updateGuildId()
    protected updateGuildId(value: string): void
    {
        this.object?.getModelController()?.setNumber('furniture_guild_customized_guild_id', parseInt(value));
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureGuildCustomizedLogic.as::updateGuildColors()
    private updateGuildColors(color1: string, color2: string): void
    {
        this.object?.getModelController()?.setNumber('furniture_guild_customized_color_1', parseInt(color1, 16));
        this.object?.getModelController()?.setNumber('furniture_guild_customized_color_2', parseInt(color2, 16));
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureGuildCustomizedLogic.as::updateGuildBadge()
    private updateGuildBadge(badgeCode: string): void
    {
        if(this.eventDispatcher !== null && this.object !== null)
        {
            this.eventDispatcher.emit(
                RoomObjectBadgeAssetEvent.LOAD_BADGE,
                new RoomObjectBadgeAssetEvent(RoomObjectBadgeAssetEvent.LOAD_BADGE, this.object, badgeCode, true)
            );
        }
    }
}
