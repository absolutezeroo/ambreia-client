/**
 * FurnitureGroupForumTerminalLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureGroupForumTerminalLogic.as
 *
 * Logic for group forum terminal furniture (guild customized + internal link to group forum).
 */
import {FurnitureGuildCustomizedLogic} from './FurnitureGuildCustomizedLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureGroupForumTerminalLogic extends FurnitureGuildCustomizedLogic
{
    override getEventTypes(): string[]
    {
        return this.getAllEventTypes(super.getEventTypes(), [
            RoomObjectWidgetRequestEvent.ROWRE_INTERNAL_LINK
        ]);
    }

    override useObject(): void
    {
        if(this.eventDispatcher !== null && this.object !== null)
        {
            this.eventDispatcher.emit(
                RoomObjectWidgetRequestEvent.ROWRE_INTERNAL_LINK,
                new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_INTERNAL_LINK, this.object)
            );
        }

        super.useObject();
    }

    protected override openContextMenu(): void
    {
        // No context menu for forum terminal
    }

    protected override updateGuildId(value: string): void
    {
        super.updateGuildId(value);

        this.object?.getModelController()?.setString(
            RoomObjectVariableEnum.FURNITURE_INTERNAL_LINK,
            'groupforum/' + value
        );
    }
}
