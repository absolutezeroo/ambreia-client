/**
 * FurnitureFriendFurniLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureFriendFurniLogic.as
 *
 * Base logic for friend furniture (love locks, wild west wanted, etc.).
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';
import type {RoomObjectDataUpdateMessage} from '../../scene/messages/RoomObjectDataUpdateMessage';
import type {StringArrayStuffData} from '../../scene/object/data/StringArrayStuffData';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureFriendFurniLogic extends FurnitureMultiStateLogic
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureFriendFurniLogic.as::STATE_UNINITIALIZED
    private static readonly STATE_UNINITIALIZED = -1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureFriendFurniLogic.as::STATE_UNLOCKED
    private static readonly STATE_UNLOCKED = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureFriendFurniLogic.as::STATE_LOCKED
    private static readonly STATE_LOCKED = 1;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureFriendFurniLogic.as::_state
    private _state: number = -1;

    override get contextMenu(): string | null
    {
        return (this._state === FurnitureFriendFurniLogic.STATE_UNLOCKED) ? 'FRIEND_FURNITURE' : 'DUMMY';
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureFriendFurniLogic.as::get engravingDialogType()
    protected get engravingDialogType(): number
    {
        return 0;
    }

    override getEventTypes(): string[]
    {
        return this.getAllEventTypes(super.getEventTypes(), [
            RoomObjectWidgetRequestEvent.ROWRE_FRIEND_FURNITURE_ENGRAVING
        ]);
    }

    override initialize(data: unknown): void
    {
        super.initialize(data);

        this.object?.getModelController()?.setNumber(
            RoomObjectVariableEnum.FURNITURE_FRIENDFURNI_ENGRAVING_TYPE,
            this.engravingDialogType
        );
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        const dataMessage = message as unknown as RoomObjectDataUpdateMessage;

        if('state' in message && 'data' in message && dataMessage.data !== null)
        {
            const stringData = dataMessage.data as unknown as StringArrayStuffData;

            if(typeof stringData.getValue === 'function')
            {
                this._state = stringData.state;
            }
            else
            {
                this._state = dataMessage.state;
            }
        }

        super.processUpdateMessage(message);
    }

    override useObject(): void
    {
        if(this.eventDispatcher !== null && this.object !== null)
        {
            if(this._state === FurnitureFriendFurniLogic.STATE_LOCKED)
            {
                this.eventDispatcher.emit(
                    RoomObjectWidgetRequestEvent.ROWRE_FRIEND_FURNITURE_ENGRAVING,
                    new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_FRIEND_FURNITURE_ENGRAVING, this.object)
                );
            }
            else
            {
                super.useObject();
            }
        }
    }
}
