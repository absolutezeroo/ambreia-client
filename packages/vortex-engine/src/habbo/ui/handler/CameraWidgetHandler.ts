import type {ILinkEventTracker} from '@core/runtime/events/ILinkEventTracker';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {Component} from '@core/runtime/Component';
import type {IRoomWidgetHandler} from '@habbo/ui/IRoomWidgetHandler';
import type {IRoomWidgetHandlerContainer} from '@habbo/ui/IRoomWidgetHandlerContainer';
import type {RoomDesktop} from '@habbo/ui/RoomDesktop';
import type {CameraWidget} from '@habbo/ui/widget/camera/CameraWidget';
import {HabboToolbarEvent} from '@habbo/toolbar/events/HabboToolbarEvent';
import {InitCameraMessageEvent} from '@habbo/communication/messages/incoming/camera/InitCameraMessageEvent';
import {CameraStorageUrlMessageEvent} from '@habbo/communication/messages/incoming/camera/CameraStorageUrlMessageEvent';
import {CameraPublishStatusMessageEvent} from '@habbo/communication/messages/incoming/camera/CameraPublishStatusMessageEvent';
import {CameraPurchaseOKMessageEvent} from '@habbo/communication/messages/incoming/camera/CameraPurchaseOKMessageEvent';
import {CompetitionStatusMessageEvent} from '@habbo/communication/messages/incoming/camera/CompetitionStatusMessageEvent';
import {RequestCameraConfigurationMessageComposer} from '@habbo/communication/messages/outgoing/camera/RequestCameraConfigurationMessageComposer';
import {PublishPhotoMessageComposer} from '@habbo/communication/messages/outgoing/camera/PublishPhotoMessageComposer';
import {PurchasePhotoMessageComposer} from '@habbo/communication/messages/outgoing/camera/PurchasePhotoMessageComposer';
import {PhotoCompetitionMessageComposer} from '@habbo/communication/messages/outgoing/camera/PhotoCompetitionMessageComposer';
import type {RenderRoomMessageComposer} from '@habbo/communication/messages/outgoing/camera/RenderRoomMessageComposer';
import type {InitCameraMessageParser} from '@habbo/communication/messages/parser/camera/InitCameraMessageParser';
import type {CameraStorageUrlMessageParser} from '@habbo/communication/messages/parser/camera/CameraStorageUrlMessageParser';
import {PerkType} from '../../communication/enum/PerkType';

/**
 * Wires the camera widget to the toolbar, the `camera/` link pattern and the five camera messages.
 *
 * The three prices default to 999 rather than 0, so a camera opened before `InitCamera` arrives
 * fails the purse check instead of appearing free.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/CameraWidgetHandler.as
 */
export class CameraWidgetHandler implements IRoomWidgetHandler, ILinkEventTracker
{
    // AS3: .../ui/handler/CameraWidgetHandler.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../ui/handler/CameraWidgetHandler.as::_container
    private _container: IRoomWidgetHandlerContainer | null = null;

    // AS3: .../ui/handler/CameraWidgetHandler.as::_SafeStr_4549
    private _widget: CameraWidget | null = null;

    // AS3: .../ui/handler/CameraWidgetHandler.as::_SafeStr_5844
    private _roomDesktop: RoomDesktop | null;

    // AS3: .../ui/handler/CameraWidgetHandler.as::_SafeStr_7565
    private _creditPrice: number = 999;

    // AS3: .../ui/handler/CameraWidgetHandler.as::_SafeStr_8180
    private _ducketPrice: number = 999;

    // AS3: .../ui/handler/CameraWidgetHandler.as::_SafeStr_8334
    private _publishDucketPrice: number = 999;

    // AS3: .../ui/handler/CameraWidgetHandler.as::_SafeStr_7620
    private readonly _storageUrlEvent: CameraStorageUrlMessageEvent;

    // AS3: .../ui/handler/CameraWidgetHandler.as::_SafeStr_8337
    private readonly _purchaseOkEvent: CameraPurchaseOKMessageEvent;

    // AS3: .../ui/handler/CameraWidgetHandler.as::_SafeStr_7802
    private readonly _publishStatusEvent: CameraPublishStatusMessageEvent;

    // AS3: .../ui/handler/CameraWidgetHandler.as::_SafeStr_8155
    private readonly _competitionStatusEvent: CompetitionStatusMessageEvent;

    // AS3: .../ui/handler/CameraWidgetHandler.as::_SafeStr_7568
    private readonly _initCameraEvent: InitCameraMessageEvent;

    // AS3: .../ui/handler/CameraWidgetHandler.as::CameraWidgetHandler()
    constructor(roomDesktop: RoomDesktop | null)
    {
        this._roomDesktop = roomDesktop;

        this._storageUrlEvent = new CameraStorageUrlMessageEvent(this.onCameraStorageUrlEvent);
        this._purchaseOkEvent = new CameraPurchaseOKMessageEvent(this.onPurchaseOK);
        this._publishStatusEvent = new CameraPublishStatusMessageEvent(this.onPublishStatus);
        this._competitionStatusEvent = new CompetitionStatusMessageEvent(this.onCompetitionStatus);
        this._initCameraEvent = new InitCameraMessageEvent(this.onInitCameraEvent);
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::get creditPrice()
    get creditPrice(): number
    {
        return this._creditPrice;
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::get ducketPrice()
    get ducketPrice(): number
    {
        return this._ducketPrice;
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::get publishDucketPrice()
    get publishDucketPrice(): number
    {
        return this._publishDucketPrice;
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::get type()
    get type(): string
    {
        return 'RWE_CAMERA';
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::get roomDesktop()
    get roomDesktop(): RoomDesktop | null
    {
        return this._roomDesktop;
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::set roomDesktop()
    set roomDesktop(value: RoomDesktop | null)
    {
        this._roomDesktop = value;
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::set container()
    set container(value: IRoomWidgetHandlerContainer | null)
    {
        // The old container is fully detached first — toolbar listener, link tracker and all five
        // message events — before the new one is attached.
        this._container?.toolbar?.toolbarEvents.off(HabboToolbarEvent.CAMERA_TOGGLE, this.onCameraRequested);
        this.unregisterLinkEventTracker();
        this.removeMessageEvents();

        this._container = value;

        this._container?.toolbar?.toolbarEvents.on(HabboToolbarEvent.CAMERA_TOGGLE, this.onCameraRequested);
        this.registerLinkEventTracker();

        if(this._container)
        {
            this._container.connection?.addMessageEvent(this._storageUrlEvent);
            this._container.connection?.addMessageEvent(this._purchaseOkEvent);
            this._container.connection?.addMessageEvent(this._publishStatusEvent);
            this._container.connection?.addMessageEvent(this._competitionStatusEvent);
            this._container.connection?.addMessageEvent(this._initCameraEvent);
        }
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::get container()
    get container(): IRoomWidgetHandlerContainer | null
    {
        return this._container;
    }

    // TS-only: the five removals appear in both `set container()` and `dispose()` in AS3.
    private removeMessageEvents(): void
    {
        const connection = this._container?.connection;

        if(!connection) return;

        connection.removeMessageEvent(this._storageUrlEvent);
        connection.removeMessageEvent(this._purchaseOkEvent);
        connection.removeMessageEvent(this._publishStatusEvent);
        connection.removeMessageEvent(this._competitionStatusEvent);
        connection.removeMessageEvent(this._initCameraEvent);
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::sendInitCameraMessage()
    sendInitCameraMessage(): void
    {
        if(this._container?.sessionDataManager?.isPerkAllowed(PerkType.CAMERA))
        {
            this._container.connection?.send(new RequestCameraConfigurationMessageComposer());
        }
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::onInitCameraEvent()
    private onInitCameraEvent = (event: IMessageEvent): void =>
    {
        const parser = event.parser as InitCameraMessageParser;

        this._creditPrice = parser.getCreditPrice();
        this._ducketPrice = parser.getDucketPrice();
        this._publishDucketPrice = parser.getPublishDucketPrice();
    };

    // AS3: .../ui/handler/CameraWidgetHandler.as::onPurchaseOK()
    private onPurchaseOK = (): void =>
    {
        this._widget?.purchaseSuccessful();
    };

    // AS3: .../ui/handler/CameraWidgetHandler.as::onPublishStatus()
    private onPublishStatus = (event: IMessageEvent): void =>
    {
        this._widget?.publishingStatus(event as CameraPublishStatusMessageEvent);
    };

    // AS3: .../ui/handler/CameraWidgetHandler.as::onCompetitionStatus()
    private onCompetitionStatus = (event: IMessageEvent): void =>
    {
        this._widget?.competitionStatus(event as CompetitionStatusMessageEvent);
    };

    // AS3: .../ui/handler/CameraWidgetHandler.as::onCameraStorageUrlEvent()
    private onCameraStorageUrlEvent = (event: IMessageEvent): void =>
    {
        if(!this._widget)
        {
            return;
        }

        this._widget.setRenderedPhotoUrl((event.parser as CameraStorageUrlMessageParser).url);
    };

    // AS3: .../ui/handler/CameraWidgetHandler.as::getWidgetMessages()
    getWidgetMessages(): string[] | null
    {
        return null;
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::processWidgetMessage()
    processWidgetMessage(_message: unknown): unknown
    {
        return null;
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::getProcessedEvents()
    getProcessedEvents(): string[]
    {
        return [];
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::processEvent()
    processEvent(_event: unknown): void
    {
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::update()
    update(): void
    {
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::set widget()
    set widget(value: CameraWidget | null)
    {
        this._widget = value;
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::get linkPattern()
    get linkPattern(): string
    {
        return 'camera/';
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::linkReceived()
    linkReceived(link: string): void
    {
        const parts = link.split('/');

        if(parts.length < 2)
        {
            return;
        }

        if(parts[1] === 'open')
        {
            this.openCamera('chatCameraCommand');
        }
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::registerLinkEventTracker()
    private registerLinkEventTracker(): void
    {
        (this._container?.windowManager as unknown as Component | null)?.context?.addLinkEventTracker(this);
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::unregisterLinkEventTracker()
    private unregisterLinkEventTracker(): void
    {
        (this._container?.windowManager as unknown as Component | null)?.context?.removeLinkEventTracker(this);
    }

    /**
	 * The link handler does not open the camera itself — it re-dispatches the toolbar event, so the
	 * `:camera` chat command and the toolbar button take exactly the same path.
	 */
    // AS3: .../ui/handler/CameraWidgetHandler.as::openCamera()
    private openCamera(iconName: string): void
    {
        if(this._container === null
            || this._container.toolbar === null
            || !this._container.sessionDataManager?.isPerkAllowed(PerkType.CAMERA))
        {
            return;
        }

        const event = new HabboToolbarEvent(HabboToolbarEvent.CAMERA_TOGGLE);

        event.iconName = iconName;
        this._container.toolbar.toolbarEvents.emit(HabboToolbarEvent.CAMERA_TOGGLE, event);
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::onCameraRequested()
    private onCameraRequested = (event: HabboToolbarEvent): void =>
    {
        if(event.type === HabboToolbarEvent.CAMERA_TOGGLE)
        {
            this._widget?.startTakingPhoto(event.iconName);
        }
    };

    // AS3: .../ui/handler/CameraWidgetHandler.as::confirmPhotoPurchase()
    confirmPhotoPurchase(): void
    {
        this._container?.connection?.send(new PurchasePhotoMessageComposer());
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::confirmPhotoPublish()
    confirmPhotoPublish(): void
    {
        this._container?.connection?.send(new PublishPhotoMessageComposer());
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::confirmPhotoCompetitionSubmit()
    confirmPhotoCompetitionSubmit(): void
    {
        this._container?.connection?.send(new PhotoCompetitionMessageComposer());
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::collectPhotoData()
    collectPhotoData(): RenderRoomMessageComposer | null
    {
        if(this._roomDesktop === null || this._widget === null)
        {
            return null;
        }

        return this._roomDesktop.roomEngine?.getRenderRoomMessage(
            this._widget.getViewPort(),
            this._roomDesktop.roomBackgroundColor
        ) ?? null;
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::sendPhotoData()
    sendPhotoData(message: RenderRoomMessageComposer): void
    {
        this._container?.connection?.send(message);
    }

    // AS3: .../ui/handler/CameraWidgetHandler.as::dispose()
    dispose(): void
    {
        this.removeMessageEvents();
        this._container?.toolbar?.toolbarEvents.off(HabboToolbarEvent.CAMERA_TOGGLE, this.onCameraRequested);
        this.unregisterLinkEventTracker();

        this._disposed = true;
        this._container = null;
        this._roomDesktop = null;
        this._widget = null;
    }
}
