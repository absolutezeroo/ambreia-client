/**
 * FurnitureAchievementResolutionLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureAchievementResolutionLogic.as
 *
 * Logic for achievement resolution furniture (not started / in progress / achieved / failed).
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import {FurnitureBadgeDisplayLogic} from './FurnitureBadgeDisplayLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';
import {RoomObjectBadgeAssetEvent} from '../../scene/events/RoomObjectBadgeAssetEvent';
import type {RoomObjectGroupBadgeUpdateMessage} from '../../scene/messages/RoomObjectGroupBadgeUpdateMessage';
import type {RoomObjectSelectedMessage} from '../../scene/messages/RoomObjectSelectedMessage';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureAchievementResolutionLogic extends FurnitureBadgeDisplayLogic
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureAchievementResolutionLogic.as::STATE_RESOLUTION_NOT_STARTED
    public static readonly STATE_RESOLUTION_NOT_STARTED = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureAchievementResolutionLogic.as::STATE_RESOLUTION_IN_PROGRESS
    public static readonly STATE_RESOLUTION_IN_PROGRESS = 1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureAchievementResolutionLogic.as::STATE_RESOLUTION_ACHIEVED
    public static readonly STATE_RESOLUTION_ACHIEVED = 2;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureAchievementResolutionLogic.as::STATE_RESOLUTION_FAILED
    public static readonly STATE_RESOLUTION_FAILED = 3;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureAchievementResolutionLogic.as::ACH_NOT_SET
    private static readonly ACH_NOT_SET = 'ACH_0';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureAchievementResolutionLogic.as::BADGE_VISIBLE_IN_STATE
    private static readonly BADGE_VISIBLE_IN_STATE = 2;

    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectWidgetRequestEvent.ROWRE_ACHIEVEMENT_RESOLUTION_OPEN,
            RoomObjectWidgetRequestEvent.ROWRE_ACHIEVEMENT_RESOLUTION_ENGRAVING,
            RoomObjectWidgetRequestEvent.ROWRE_ACHIEVEMENT_RESOLUTION_FAILED,
            RoomObjectBadgeAssetEvent.LOAD_BADGE
        ];

        return this.getAllEventTypes(super.getEventTypes(), types);
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        const badgeMessage = message as unknown as RoomObjectGroupBadgeUpdateMessage;

        if('assetName' in message && 'badgeId' in message)
        {
            if(badgeMessage.assetName !== 'loading_icon')
            {
                this.object?.getModelController()?.setNumber(
                    RoomObjectVariableEnum.FURNITURE_BADGE_VISIBLE_IN_STATE,
                    FurnitureAchievementResolutionLogic.BADGE_VISIBLE_IN_STATE
                );
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

    override useObject(): void
    {
        if(this.eventDispatcher !== null && this.object !== null)
        {
            const state = this.object.getState(0);

            switch(state)
            {
                case FurnitureAchievementResolutionLogic.STATE_RESOLUTION_NOT_STARTED:
                case FurnitureAchievementResolutionLogic.STATE_RESOLUTION_IN_PROGRESS:
                    this.eventDispatcher.emit(
                        RoomObjectWidgetRequestEvent.ROWRE_ACHIEVEMENT_RESOLUTION_OPEN,
                        new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_ACHIEVEMENT_RESOLUTION_OPEN, this.object)
                    );
                    break;

                case FurnitureAchievementResolutionLogic.STATE_RESOLUTION_ACHIEVED:
                    this.eventDispatcher.emit(
                        RoomObjectWidgetRequestEvent.ROWRE_ACHIEVEMENT_RESOLUTION_ENGRAVING,
                        new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_ACHIEVEMENT_RESOLUTION_ENGRAVING, this.object)
                    );
                    break;

                case FurnitureAchievementResolutionLogic.STATE_RESOLUTION_FAILED:
                    this.eventDispatcher.emit(
                        RoomObjectWidgetRequestEvent.ROWRE_ACHIEVEMENT_RESOLUTION_FAILED,
                        new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_ACHIEVEMENT_RESOLUTION_FAILED, this.object)
                    );
                    break;
            }
        }
    }

    protected override updateBadge(badgeId: string): void
    {
        if(badgeId !== FurnitureAchievementResolutionLogic.ACH_NOT_SET)
        {
            super.updateBadge(badgeId);
        }
    }
}
