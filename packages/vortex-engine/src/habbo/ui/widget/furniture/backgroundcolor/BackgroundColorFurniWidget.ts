/**
 * BackgroundColorFurniWidget
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/backgroundcolor/BackgroundColorFurniWidget.as
 *
 * The background toner's HSL editor: three sliders, a live preview swatch, and apply / on-off /
 * close. Unlike the other furni widgets it is opened by its *handler* calling `open()` rather than
 * by an update event, because the handler is event-driven (`getProcessedEvents()`) instead of
 * message-driven.
 */
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IRoomWidgetHandler} from '@habbo/ui/IRoomWidgetHandler';
import {RoomWidgetBase} from '@habbo/ui/widget/RoomWidgetBase';
import type {FurnitureBackgroundColorWidgetHandler} from '@habbo/ui/handler/FurnitureBackgroundColorWidgetHandler';
import {ColorConverter} from '@room/utils/ColorConverter';
import {SetRoomBackgroundColorDataMessageComposer} from '@habbo/communication/messages/outgoing/room/furniture/SetRoomBackgroundColorDataMessageComposer';
import {UseFurnitureMessageComposer} from '@habbo/communication/messages/outgoing/room/furniture/UseFurnitureMessageComposer';
import {BackgroundColorWidgetSlider} from './BackgroundColorWidgetSlider';

export class BackgroundColorFurniWidget extends RoomWidgetBase
{
    // AS3: BackgroundColorFurniWidget.as::PARAMETER_HUE
    private static readonly PARAMETER_HUE: string = 'hue';

    // AS3: BackgroundColorFurniWidget.as::PARAMETER_SATURATION
    private static readonly PARAMETER_SATURATION: string = 'saturation';

    // AS3: BackgroundColorFurniWidget.as::PARAMETER_LIGHTNESS
    private static readonly PARAMETER_LIGHTNESS: string = 'lightness';

    // AS3: BackgroundColorFurniWidget.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: BackgroundColorFurniWidget.as::_SafeStr_6628
    private _objectId: number = 0;

    // AS3: BackgroundColorFurniWidget.as::_sliders
    private _sliders: BackgroundColorWidgetSlider[] = [];

    // AS3: BackgroundColorFurniWidget.as::_SafeStr_6701
    private _hue: number = 0;

    // AS3: BackgroundColorFurniWidget.as::_SafeStr_6829
    private _saturation: number = 0;

    // AS3: BackgroundColorFurniWidget.as::_SafeStr_6793
    private _lightness: number = 0;

    // AS3: BackgroundColorFurniWidget.as::BackgroundColorFurniWidget()
    constructor(
        // AS3: BackgroundColorFurniWidget.as::BackgroundColorFurniWidget() param1
        handler: IRoomWidgetHandler,
        // AS3: BackgroundColorFurniWidget.as::BackgroundColorFurniWidget() param2
        windowManager: IHabboWindowManager,
        // AS3: BackgroundColorFurniWidget.as::BackgroundColorFurniWidget() param3
        assets: IAssetLibrary | null = null,
        // AS3: BackgroundColorFurniWidget.as::BackgroundColorFurniWidget() param4
        localizations: IHabboLocalizationManager | null = null
    )
    {
        super(handler, windowManager, assets, localizations);

        this.handler.widget = this;
    }

    // AS3: BackgroundColorFurniWidget.as::get handler()
    public get handler(): FurnitureBackgroundColorWidgetHandler
    {
        return this.widgetHandler as FurnitureBackgroundColorWidgetHandler;
    }

    /**
     * The `Math.max(x, 0)` clamps are AS3's: an unset model variable reads back as -1, and a
     * negative would put the slider knob off its track.
     */
    // AS3: BackgroundColorFurniWidget.as::open()
    public open(objectId: number, hue: number, saturation: number, lightness: number): void
    {
        this._objectId = objectId;
        // `| 0` is AS3's `int` field coercion: a toner never set has no stuff data, the model answers
        // NaN, and AS3 stores 0 where a plain number kept NaN and put every knob at x = NaN.
        this._hue = Math.max(hue, 0) | 0;
        this._saturation = Math.max(saturation, 0) | 0;
        this._lightness = Math.max(lightness, 0) | 0;

        this.createWindow();
    }

    // AS3: BackgroundColorFurniWidget.as::setParameterCallback()
    public setParameterCallback(parameter: string, value: number): void
    {
        switch(parameter)
        {
            case BackgroundColorFurniWidget.PARAMETER_HUE:
                this._hue = value;
                break;
            case BackgroundColorFurniWidget.PARAMETER_SATURATION:
                this._saturation = value;
                break;
            case BackgroundColorFurniWidget.PARAMETER_LIGHTNESS:
                this._lightness = value;
                break;
        }

        this.renderColorPreview();
    }

    /**
     * Builds only once — re-opening a toner reuses the existing window and its slider positions
     * rather than rebuilding, which is why `open()` assigns the values before this runs.
     */
    // AS3: BackgroundColorFurniWidget.as::createWindow()
    private createWindow(): void
    {
        if(this._window) return;

        this._window = this.windowManager.buildWidgetLayout('background_color_ui_xml') as IWindowContainer | null;

        if(this._window === null) return;

        this._window.procedure = this.windowProcedure;
        this._window.center();

        this._sliders.push(new BackgroundColorWidgetSlider(
            this, BackgroundColorFurniWidget.PARAMETER_HUE, this._window.findChildByName('hue_container') as IWindowContainer | null, this._hue
        ));
        this._sliders.push(new BackgroundColorWidgetSlider(
            this, BackgroundColorFurniWidget.PARAMETER_SATURATION, this._window.findChildByName('saturation_container') as IWindowContainer | null, this._saturation
        ));
        this._sliders.push(new BackgroundColorWidgetSlider(
            this, BackgroundColorFurniWidget.PARAMETER_LIGHTNESS, this._window.findChildByName('lightness_container') as IWindowContainer | null, this._lightness
        ));
    }

    // AS3: BackgroundColorFurniWidget.as::destroyWindow()
    private destroyWindow(): void
    {
        for(const slider of this._sliders)
        {
            slider.dispose();
        }

        this._sliders = [];

        if(this._window)
        {
            this._window.dispose();
            this._window = null;
        }
    }

    /**
     * AS3 packs the three 8-bit channels into one int and hands it to `ColorConverter.hslToRGB()`,
     * then fills a bitmap the size of the swatch. The port used to set the window's `color`
     * instead, which a bitmap wrapper never paints — the swatch stayed empty on every tick.
     */
    // AS3: BackgroundColorFurniWidget.as::renderColorPreview()
    private renderColorPreview(): void
    {
        if(this._window === null) return;

        const preview = this._window.findChildByName('color_preview_bitmap') as IBitmapWrapperWindow | null;

        if(preview === null) return;

        const packed = ((this._hue & 0xFF) << 16) + ((this._saturation & 0xFF) << 8) + (this._lightness & 0xFF);
        const canvas = new OffscreenCanvas(Math.max(1, preview.width), Math.max(1, preview.height));
        const context = canvas.getContext('2d');

        if(context === null) return;

        context.fillStyle = '#' + (ColorConverter.hslToRGB(packed) & 0xFFFFFF).toString(16).padStart(6, '0');
        context.fillRect(0, 0, canvas.width, canvas.height);
        preview.bitmap = canvas.transferToImageBitmap();
    }

    /**
     * The on-off button sends the *generic* use-furniture message, not a toner-specific one — the
     * server toggles the furni's state like any other multi-state item.
     */
    // AS3: BackgroundColorFurniWidget.as::windowProcedure()
    private windowProcedure = (event: WindowEvent, window: IWindow): void =>
    {
        if(window === null || event.type !== 'WME_CLICK') return;

        const connection = this.handler?.container?.connection ?? null;

        switch(window.name)
        {
            case 'apply_button':
                connection?.send(new SetRoomBackgroundColorDataMessageComposer(
                    this._objectId, this._hue, this._saturation, this._lightness
                ));
                break;
            case 'on_off_button':
                connection?.send(new UseFurnitureMessageComposer(this._objectId));
                break;
            case 'header_button_close':
                this.destroyWindow();
                break;
        }
    };

    // AS3: BackgroundColorFurniWidget.as::dispose()
    public override dispose(): void
    {
        this.destroyWindow();

        super.dispose();
    }
}
