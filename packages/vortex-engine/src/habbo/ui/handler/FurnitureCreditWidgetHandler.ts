/**
 * FurnitureCreditWidgetHandler
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/FurnitureCreditWidgetHandler.as
 *
 * Two messages: the open request (which reads the credit value off the room object and gates on
 * ownership) and the redeem, which goes out through the room session.
 *
 * `processEvent()` is a no-op here. AS3's body is `if(_container != null && _container.events !=
 * null && null != null) { _container.events.dispatchEvent(null); }` — a branch that can never be
 * taken, dispatching a null if it somehow were. Dead source, not behaviour.
 */
import type {IRoomWidgetHandler} from '@habbo/ui/IRoomWidgetHandler';
import type {IRoomWidgetHandlerContainer} from '@habbo/ui/IRoomWidgetHandlerContainer';
import {RoomWidgetCreditFurniUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetCreditFurniUpdateEvent';
import {RoomWidgetCreditFurniRedeemMessage} from '@habbo/ui/widget/messages/RoomWidgetCreditFurniRedeemMessage';
import {RoomWidgetFurniToWidgetMessage} from '@habbo/ui/widget/messages/RoomWidgetFurniToWidgetMessage';

export class FurnitureCreditWidgetHandler implements IRoomWidgetHandler
{
    // AS3: FurnitureCreditWidgetHandler.as::_SafeStr_5769
    private _disposed: boolean = false;

    // AS3: FurnitureCreditWidgetHandler.as::_container
    private _container: IRoomWidgetHandlerContainer | null = null;

    // AS3: FurnitureCreditWidgetHandler.as::get type()
    public get type(): string
    {
        return 'RWE_FURNI_CREDIT_WIDGET';
    }

    // AS3: FurnitureCreditWidgetHandler.as::set container()
    public set container(value: IRoomWidgetHandlerContainer | null)
    {
        this._container = value;
    }

    // AS3: FurnitureCreditWidgetHandler.as::getWidgetMessages()
    public getWidgetMessages(): string[]
    {
        return [
            RoomWidgetFurniToWidgetMessage.WIDGET_MESSAGE_REQUEST_CREDITFURNI_WIDGET,
            RoomWidgetCreditFurniRedeemMessage.REDEEM
        ];
    }

    // AS3: FurnitureCreditWidgetHandler.as::processWidgetMessage()
    public processWidgetMessage(message: unknown): unknown
    {
        if(this.disposed || message === null || message === undefined) return null;

        const widgetMessage = message as RoomWidgetFurniToWidgetMessage;

        switch(widgetMessage.type)
        {
            case RoomWidgetFurniToWidgetMessage.WIDGET_MESSAGE_REQUEST_CREDITFURNI_WIDGET:
                this.openRedeemDialog(widgetMessage);
                break;
            case RoomWidgetCreditFurniRedeemMessage.REDEEM: {
                const redeem = message as RoomWidgetCreditFurniRedeemMessage;

                this._container?.roomSession?.sendCreditFurniRedeemMessage(redeem.objectId);
                break;
            }
        }

        return null;
    }

    /**
     * Only the furni's owner sees the dialog at all.
     */
    // DEVIATION: AS3 also refuses an NFT credit furni unless `nft.credit.converting.enabled` is set,
    //   and tells the widget which kind it is; the RPG fork removed NFT.
    // AS3: FurnitureCreditWidgetHandler.as::processWidgetMessage() "RWFWM_MESSAGE_REQUEST_CREDITFURNI"
    private openRedeemDialog(message: RoomWidgetFurniToWidgetMessage): void
    {
        const roomObject = this._container?.roomEngine?.getRoomObject(
            message.roomId, message.id, message.category
        ) ?? null;

        if(roomObject === null) return;

        if(!this._container?.isOwnerOfFurniture(roomObject)) return;

        const model = roomObject.getModel();

        if(model === null) return;

        const creditValue = model.getNumber('furniture_credit_value');

        this._container?.desktopEvents.emit(
            RoomWidgetCreditFurniUpdateEvent.UPDATE_CREDIT_FURNI,
            new RoomWidgetCreditFurniUpdateEvent(
                RoomWidgetCreditFurniUpdateEvent.UPDATE_CREDIT_FURNI, message.id, creditValue
            )
        );
    }

    // AS3: FurnitureCreditWidgetHandler.as::getProcessedEvents()
    public getProcessedEvents(): string[]
    {
        return [];
    }

    // AS3: FurnitureCreditWidgetHandler.as::processEvent()
    public processEvent(_event: unknown): void
    {
        // Dead in AS3 — see the class note.
    }

    // AS3: FurnitureCreditWidgetHandler.as::update()
    public update(): void
    {
        // AS3 no-op.
    }

    // AS3: FurnitureCreditWidgetHandler.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: FurnitureCreditWidgetHandler.as::dispose()
    public dispose(): void
    {
        this._disposed = true;
        this._container = null;
    }
}
