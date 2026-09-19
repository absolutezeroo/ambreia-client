import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {RenderRoomMessageComposer} from '@habbo/communication/messages/outgoing/camera/RenderRoomMessageComposer';
import type {IRoomEngineRectangle} from '@habbo/room/RoomEngine';
import {CameraSlotData} from './CameraSlotData';
import type {CameraWidget} from './CameraWidget';

/**
 * The viewfinder window: a live preview of the room, a shutter button and five photo slots.
 *
 * The slots and their render messages are **static**, so photos survive the window being closed and
 * reopened — that is what `getFromMemoryCache()` restores. Taking a shot stores the composer built
 * at that moment, not at purchase time, so each slot keeps the room exactly as it was.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/camera/CameraViewFinder.as
 */
export class CameraViewFinder
{
    // AS3: .../ui/widget/camera/CameraViewFinder.as::_SafeStr_11343
    private static readonly FLASH_DURATION: number = 350;

    // AS3: .../ui/widget/camera/CameraViewFinder.as::NUMBER_OF_SLOTS
    private static readonly NUMBER_OF_SLOTS: number = 5;

    // The side of a photo, which AS3 writes as the literal 320 in `clearCurrentSlot()` rather
    // than reading `_imageWidth` — the same 320 the layout gives the `image` bitmap.
    // AS3: .../ui/widget/camera/CameraViewFinder.as::clearCurrentSlot()
    private static readonly PHOTO_SIZE: number = 320;

    // AS3: .../ui/widget/camera/CameraViewFinder.as::_SafeStr_8174
    private static _slotsFullAlertShown: boolean = false;

    // AS3: .../ui/widget/camera/CameraViewFinder.as::_shotImages
    private static _shotImages: (CameraSlotData | null)[] = new Array(CameraViewFinder.NUMBER_OF_SLOTS).fill(null);

    // AS3: .../ui/widget/camera/CameraViewFinder.as::_renderRoomMessages
    private static _renderRoomMessages: (RenderRoomMessageComposer | null)[] =
        new Array(CameraViewFinder.NUMBER_OF_SLOTS).fill(null);

    // AS3: .../ui/widget/camera/CameraViewFinder.as::_SafeStr_4549
    private _widget: CameraWidget;

    // AS3: .../ui/widget/camera/CameraViewFinder.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: .../ui/widget/camera/CameraViewFinder.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../ui/widget/camera/CameraViewFinder.as::_SafeStr_4794
    private _imageWindow: (IWindow & { bitmap?: ImageBitmap | null }) | null = null;

    // AS3: .../ui/widget/camera/CameraViewFinder.as::_flash
    private _flash: IWindow | null = null;

    // AS3: .../ui/widget/camera/CameraViewFinder.as::_imageWidth
    private _imageWidth: number = 0;

    // AS3: .../ui/widget/camera/CameraViewFinder.as::_SafeStr_9317
    private _imageHeight: number = 0;

    // AS3: .../ui/widget/camera/CameraViewFinder.as::_previewImageMode
    private _previewImageMode: boolean = false;

    // AS3: .../ui/widget/camera/CameraViewFinder.as::_SafeStr_4679
    private _activeSlot: number = 0;

    // AS3: .../ui/widget/camera/CameraViewFinder.as::_flashStartTime
    private _flashStartTime: number = 0;

    // TS-only: no AS3 counterpart. Latches the async capture in update(); AS3's snapshot is
    // synchronous and needs no such guard.
    private _captureInFlight: boolean = false;

    // AS3: .../ui/widget/camera/CameraViewFinder.as::CameraViewFinder()
    constructor(widget: CameraWidget)
    {
        this._widget = widget;

        this.openViewFinder();

        this._activeSlot = 0;

        while(this._activeSlot < CameraViewFinder.NUMBER_OF_SLOTS)
        {
            this.clearCurrentSlot(true);
            this._activeSlot = this._activeSlot + 1;
        }

        this._activeSlot = 0;

        if(this.getFromMemoryCache())
        {
            const slotContainer = this._window?.findChildByName('slot_container');

            if(slotContainer) slotContainer.visible = true;
        }

        this.setMode(false);
        this.setActiveSlot(0);

        this._flash = this._window?.findChildByName('flash') ?? null;

        if(this._flash) this._flash.visible = false;
    }

    // AS3: .../ui/widget/camera/CameraViewFinder.as::dispose()
    dispose(): void
    {
        if(this._disposed)
        {
            return;
        }

        this._flash = null;
        this._imageWindow = null;
        this._widget.component?.removeUpdateReceiver(this);

        if(this._window)
        {
            this._window.destroy();
            this._window = null;
        }

        this._disposed = true;
    }

    // AS3: .../ui/widget/camera/CameraViewFinder.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../ui/widget/camera/CameraViewFinder.as::openViewFinder()
    private openViewFinder(): void
    {
        if(this._window !== null)
        {
            return;
        }

        this._window = this._widget.getXmlWindow('camera_interface') as IWindowContainer | null;

        if(this._window === null) return;

        this._window.center();
        this._window.visible = false;

        this._imageWindow = this._window.findChildByName('image') as (IWindow & { bitmap?: ImageBitmap | null }) | null;

        if(this._imageWindow)
        {
            this._imageWidth = this._imageWindow.width;
            this._imageHeight = this._imageWindow.height;
            this._imageWindow.visible = true;
        }

        this._window.procedure = this.windowProcedure;
    }

    // AS3: .../ui/widget/camera/CameraViewFinder.as::update()
    update(_time: number): void
    {
        if(this._previewImageMode)
        {
            return;
        }

        // AS3 redraws the preview synchronously every tick. The port's capture is a GPU readback
        // and therefore async: a tick arriving while the previous capture is still running is
        // skipped rather than queued, so the viewfinder runs at whatever rate the readback
        // sustains instead of building a backlog.
        if(!this._captureInFlight && this._window?.visible === true)
        {
            this._captureInFlight = true;

            void this._widget.snapShotRoomCanvas(this.getViewPort())
                .then((bitmap) =>
                {
                    if(!this._disposed && bitmap !== null && this._imageWindow && !this._previewImageMode)
                    {
                        this._imageWindow.bitmap = bitmap;
                    }
                })
                .finally(() =>
                {
                    this._captureInFlight = false;
                });
        }

        if(this._flashStartTime > 0)
        {
            this.updateFlash();
        }
    }

    // AS3: .../ui/widget/camera/CameraViewFinder.as::updateFlash()
    private updateFlash(): void
    {
        if(this._flash === null) return;

        this._flash.visible = true;

        const elapsed = performance.now() - this._flashStartTime;
        const blend = (CameraViewFinder.FLASH_DURATION - elapsed) / CameraViewFinder.FLASH_DURATION;

        (this._flash as IWindow & { blend?: number }).blend = blend;

        if(elapsed > CameraViewFinder.FLASH_DURATION)
        {
            this._flashStartTime = 0;
            this._flash.visible = false;
        }
    }

    /**
	 * The rectangle the server should render, in screen coordinates — the preview window's position
	 * offset by the viewfinder window's own.
	 */
    // AS3: .../ui/widget/camera/CameraViewFinder.as::getViewPort()
    getViewPort(): IRoomEngineRectangle
    {
        if(this._window === null || this._imageWindow === null)
        {
            return {left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0};
        }

        const left = this._window.x + this._imageWindow.x;
        const top = this._window.y + this._imageWindow.y;

        return {
            left,
            top,
            right: left + this._imageWindow.width,
            bottom: top + this._imageWindow.height,
            width: this._imageWindow.width,
            height: this._imageWindow.height
        };
    }

    /**
	 * `source` is not decoration: it is the only thing the opening event reports — which button
	 * opened the camera — and the parameter existed here with nothing reading it.
	 */
    // AS3: .../ui/widget/camera/CameraViewFinder.as::toggleVisible()
    toggleVisible(source: string): void
    {
        if(this._window === null) return;

        if(this._window.visible)
        {
            this.hide();
        }
        else
        {
            // AS3 reaches tracking through its `HabboTracking.getInstance()` singleton; this port
            // replaced that with DI at the call site, and RoomUI is the component that holds it.
            this._widget.component?.habboTracking?.trackEventLog(
                'Stories', 'camera', 'stories.camera.opened', source);
            this.show();
            this.setMode(false);
        }
    }

    // AS3: .../ui/widget/camera/CameraViewFinder.as::show()
    show(): void
    {
        if(this._window === null) return;

        this._window.visible = true;
        this._window.center();
        this._widget.component?.registerUpdateReceiver(this, 100);
    }

    // AS3: .../ui/widget/camera/CameraViewFinder.as::hide()
    hide(): void
    {
        if(this._window === null) return;

        this._window.visible = false;
        this._widget.component?.removeUpdateReceiver(this);
    }

    // AS3: .../ui/widget/camera/CameraViewFinder.as::windowProcedure()
    private windowProcedure = (event: WindowEvent, window: IWindow): void =>
    {
        if(this._window === null) return;

        // The shutter button swaps its own bitmap on every mouse state before any click handling.
        if(window.name === 'button_release')
        {
            const releaseBitmap = this._window.findChildByName('release_bitmap') as (IWindow & { assetUri?: string }) | null;

            if(releaseBitmap)
            {
                switch(event.type)
                {
                    case 'WME_DOWN': releaseBitmap.assetUri = 'camera_camera_btn_down'; break;
                    case 'WME_UP': releaseBitmap.assetUri = 'camera_cam_btn_hi'; break;
                    case 'WME_OVER': releaseBitmap.assetUri = 'camera_cam_btn_hi'; break;
                    case 'WME_OUT': releaseBitmap.assetUri = 'camera_camera_btn'; break;
                }
            }
        }

        if(event.type !== 'WME_CLICK')
        {
            return;
        }

        const targetName = (event.target as IWindow | null)?.name ?? window.name;

        switch(targetName)
        {
            case 'header_button_close':
                this.hide();
                break;

            case 'button_editor':
                this.hide();
                this._widget.editPhoto(this._imageWindow?.bitmap ?? null);
                break;

            case 'delete_photo_button':
                this.clearCurrentSlot();
                this.setMode(false);
                break;

            case 'header_button_help':
                this._widget.component?.context?.createLinkEvent('habbopages/camera');
                break;

            case 'button_release':
            {
                // In preview mode the shutter is a "back to live" button instead.
                if(this._previewImageMode)
                {
                    this.setMode(false);
                    break;
                }

                this._widget.triggetCameraShutterSound();

                const message = this._widget.handler?.collectPhotoData() ?? null;

                if(message !== null && message.isSendable())
                {
                    CameraViewFinder._renderRoomMessages[this._activeSlot] = message;
                    this.addToCurrentSlot(this._imageWindow?.bitmap ?? null);
                    this._flashStartTime = performance.now();

                    const slotContainer = this._window.findChildByName('slot_container');

                    if(slotContainer) slotContainer.visible = true;

                    break;
                }

                this._widget.windowManager.alert('${generic.alert.title}', '${camera.alert.too_much_stuff}', 0, null);
            }
        }

        if(targetName.indexOf('cameraButton_') !== -1)
        {
            const index = parseInt(targetName.charAt(targetName.length - 1), 10);

            if(CameraViewFinder._shotImages[index]?.isEmpty !== false)
            {
                this.setActiveSlot(index);
                this.setMode(false);

                return;
            }

            const slot = CameraViewFinder._shotImages[index] as CameraSlotData;

            if(this._imageWindow) this._imageWindow.bitmap = slot.image as ImageBitmap | null;

            this.setMode(true);
            this.setActiveSlot(index);
        }

        if(targetName.indexOf('chooseSlotButton_') !== -1)
        {
            const index = parseInt(targetName.charAt(targetName.length - 1), 10);

            if(CameraViewFinder._shotImages.length < index)
            {
                return;
            }

            this.setActiveSlot(index);
            this.setMode(false);
        }
    };

    // AS3: .../ui/widget/camera/CameraViewFinder.as::setActiveSlot()
    private setActiveSlot(index: number): void
    {
        if(this._window === null) return;

        const previous = this._window.findChildByName('slotImage_' + this._activeSlot) as (IWindow & { assetUri?: string }) | null;

        if(previous) previous.assetUri = 'camera_arrow_gray';

        this._activeSlot = index;

        const current = this._window.findChildByName('slotImage_' + this._activeSlot) as (IWindow & { assetUri?: string }) | null;

        if(current) current.assetUri = 'camera_arrow_green';

        const border = this._window.findChildByName('photo_border');
        const button = this._window.findChildByName('cameraButton_' + this._activeSlot);

        if(border && button)
        {
            border.x = button.x - 1 + (button.parent?.x ?? 0);
            border.y = button.y - 3 + (button.parent?.y ?? 0);
            border.visible = true;

            const deleteButton = this._window.findChildByName('delete_photo_button');

            if(deleteButton)
            {
                deleteButton.y = border.y;
                deleteButton.x = border.x + border.width - deleteButton.width;
            }
        }
    }

    // AS3: .../ui/widget/camera/CameraViewFinder.as::setMode()
    private setMode(preview: boolean): void
    {
        if(this._window === null) return;

        this._previewImageMode = preview;

        // The date and room name are hidden in both modes — AS3 assigns them false unconditionally.
        for(const name of ['photo_date', 'photo_roomname'])
        {
            const child = this._window.findChildByName(name);

            if(child) child.visible = false;
        }

        const crosshair = this._window.findChildByName('camera_crosshair');

        if(crosshair) crosshair.visible = !preview;

        for(const name of ['delete_photo_button', 'button_editor', 'buyButtonBg'])
        {
            const child = this._window.findChildByName(name);

            if(child) child.visible = preview;
        }
    }

    // AS3: .../ui/widget/camera/CameraViewFinder.as::getFromMemoryCache()
    private getFromMemoryCache(): boolean
    {
        let found = false;

        for(let i = 0; i < CameraViewFinder._shotImages.length; i++)
        {
            const slot = CameraViewFinder._shotImages[i];

            if(slot !== null && slot.isEmpty === false)
            {
                this.drawImageToSlot(i, slot);
                found = true;
            }
        }

        return found;
    }

    // AS3: .../ui/widget/camera/CameraViewFinder.as::drawImageToSlot()
    private drawImageToSlot(index: number, slot: CameraSlotData): void
    {
        const target = this._window?.findChildByName('cameraSlot_' + index) as (IWindow & { bitmap?: ImageBitmap | null }) | null;

        if(target === null || this._imageWidth <= 0) return;

        // AS3 allocates an opaque BitmapData the size of the slot and draws the photo into it
        // through a matrix scaled by `(width - 2) / _imageWidth`, offset by (1,1) — the photo
        // shrunk to 56x56 inside a 58x58 black frame. Assigning the photo to the window instead
        // does *not* produce the same framing, which is what this used to claim: the layout
        // declares `stretched_x`/`stretched_y` false on every `cameraSlot_N`, so the window draws
        // the 320x320 image at native size and the slot showed its top-left corner.
        const canvas = new OffscreenCanvas(target.width, target.height);
        const ctx = canvas.getContext('2d');

        if(ctx === null) return;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if(slot.image !== null)
        {
            const scale = (target.width - 2) / this._imageWidth;
            const image = slot.image as ImageBitmap;

            ctx.drawImage(image, 1, 1, image.width * scale, image.height * scale);
        }

        target.bitmap = canvas.transferToImageBitmap();
    }

    /**
     * The blank photo an emptied slot holds: AS3's `new BitmapData(320, 320, false, 13816530)`.
     *
     * It is what makes deleting a shot visible — `clearCurrentSlot()` feeds it back through
     * `addToCurrentSlot()`, which repaints both the thumbnail and the viewfinder with it. Passing
     * `null` instead, as this used to, left `drawImageToSlot()` nothing to draw and the deleted
     * photo stayed on screen.
     */
    // AS3: .../ui/widget/camera/CameraViewFinder.as::clearCurrentSlot()
    private static createEmptyPhoto(): ImageBitmap | null
    {
        const canvas = new OffscreenCanvas(CameraViewFinder.PHOTO_SIZE, CameraViewFinder.PHOTO_SIZE);
        const ctx = canvas.getContext('2d');

        if(ctx === null) return null;

        ctx.fillStyle = '#d2d2d2';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        return canvas.transferToImageBitmap();
    }

    // AS3: .../ui/widget/camera/CameraViewFinder.as::findNextEmptySlotIndex()
    private findNextEmptySlotIndex(): number
    {
        for(let i = 0; i < CameraViewFinder._shotImages.length; i++)
        {
            if(CameraViewFinder._shotImages[i]?.isEmpty)
            {
                return i;
            }
        }

        return -1;
    }

    // AS3: .../ui/widget/camera/CameraViewFinder.as::clearCurrentSlot()
    private clearCurrentSlot(keepFilled: boolean = false): void
    {
        const current = CameraViewFinder._shotImages[this._activeSlot];

        // The constructor's initialisation pass sets `keepFilled`, so reopening the camera does not
        // wipe slots that survived from the previous session.
        if(keepFilled && current && !current.isEmpty)
        {
            return;
        }

        CameraViewFinder._shotImages[this._activeSlot] = null;
        this.addToCurrentSlot(CameraViewFinder.createEmptyPhoto(), true);

        if(this._imageWindow)
        {
            this._imageWindow.bitmap = CameraViewFinder._shotImages[this._activeSlot]?.image as ImageBitmap | null ?? null;
        }

        this.setMode(false);
    }

    // AS3: .../ui/widget/camera/CameraViewFinder.as::addToCurrentSlot()
    private addToCurrentSlot(image: ImageBitmap | null, empty: boolean = false, fromCache: boolean = false): void
    {
        const slot = new CameraSlotData();

        slot.image = image;

        if(empty)
        {
            slot.isEmpty = true;
        }
        else
        {
            slot.setDate(new Date());
            slot.isEmpty = false;
        }

        if((!fromCache && !empty) || CameraViewFinder._shotImages[this._activeSlot] === null)
        {
            CameraViewFinder._shotImages[this._activeSlot] = slot;
        }

        this.drawImageToSlot(this._activeSlot, slot);

        if(!empty)
        {
            const next = this.findNextEmptySlotIndex();

            if(next >= 0)
            {
                this.setActiveSlot(next);
            }
            else if(!CameraViewFinder._slotsFullAlertShown && !fromCache)
            {
                // Shown once per session, then suppressed — the flag is never cleared.
                this._widget.windowManager.alert(
                    this._widget.localizations?.getLocalization('camera.full.header') ?? '',
                    this._widget.localizations?.getLocalization('camera.full.body') ?? '',
                    0,
                    null
                );

                CameraViewFinder._slotsFullAlertShown = true;
            }
        }
    }

    // AS3: .../ui/widget/camera/CameraViewFinder.as::getRenderRoomMessage()
    getRenderRoomMessage(): RenderRoomMessageComposer | null
    {
        return CameraViewFinder._renderRoomMessages[this._activeSlot];
    }
}
