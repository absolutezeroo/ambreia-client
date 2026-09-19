import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {CameraPhotoLab} from './CameraPhotoLab';

/**
 * The effect-strength slider under the filter grid in the photo lab.
 *
 * Two procedures drive it: the knob reports `WE_RELOCATED` while dragged (which only resizes the
 * coloured "active" portion of the shaft) and commits the value on mouse-up, while a click anywhere
 * on the shaft jumps the knob there and commits immediately.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/camera/CameraFxStrengthSlider.as
 */
export class CameraFxStrengthSlider
{
    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::_SafeStr_4550
    private _photoLab: CameraPhotoLab | null;

    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::_SafeStr_5368
    private _window: IWindowContainer | null;

    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::_SafeStr_5960
    private _sliderBaseAsset: ImageBitmap | null = null;

    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::_SafeStr_5888
    private _sliderButtonAsset: ImageBitmap | null = null;

    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::_activeBaseArea
    private _activeBaseArea: IWindow | null = null;

    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::_sliderBaseWidth
    private _sliderBaseWidth: number = 0;

    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::_referenceWidth
    private _referenceWidth: number = 0;

    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::_SafeStr_9255
    private _shaftClickOffset: number = 0;

    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::CameraFxStrengthSlider()
    constructor(photoLab: CameraPhotoLab, window: IWindowContainer, assets: IAssetLibrary | null)
    {
        this._photoLab = photoLab;
        this._window = window;

        this.storeAssets(assets);
        this.displaySlider();
    }

    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::dispose()
    dispose(): void
    {
        this._photoLab = null;
        this._window = null;
        this._sliderBaseAsset = null;
        this._sliderButtonAsset = null;
    }

    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::disable()
    disable(): void
    {
        if(this._window) this._window.visible = false;
    }

    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::enable()
    enable(): void
    {
        if(this._window) this._window.visible = true;
    }

    /**
	 * The usable travel of the knob in pixels. `CameraEffect.setMaxValue()` is fed from this, so an
	 * effect's `value` is a pixel offset and `getEffectStrength()` divides by it.
	 */
    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::getScale()
    getScale(): number
    {
        return this._referenceWidth;
    }

    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::setValue()
    setValue(value: number): void
    {
        if(this._window !== null)
        {
            const button = this._window.findChildByName('slider_button');

            if(button !== null)
            {
                button.x = value;
            }
        }
    }

    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::buttonProcedure()
    private buttonProcedure = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WE_RELOCATED')
        {
            if(this._activeBaseArea)
            {
                this._activeBaseArea.width = window.x / this._referenceWidth * this._sliderBaseWidth;
            }
        }
        else if(event.type === 'WME_UP' || event.type === 'WME_UP_OUTSIDE')
        {
            this._photoLab?.setSelectedFxValue(window.x);
        }
    };

    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::shaftProcedure()
    private shaftProcedure = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WME_DOWN' && window.name === 'shaft_click_area')
        {
            const value = (event as WindowMouseEvent).localX - this._shaftClickOffset;

            this.setValue(value);
            this._photoLab?.setSelectedFxValue(value);
        }
    };

    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::displaySlider()
    private displaySlider(): void
    {
        if(this._window === null)
        {
            return;
        }

        const clickArea = this._window.findChildByName('shaft_click_area');

        if(clickArea) clickArea.procedure = this.shaftProcedure;

        const sliderBase = this._window.findChildByName('slider_base') as IBitmapWrapperWindow | null;

        if(sliderBase !== null && this._sliderBaseAsset !== null)
        {
            this._sliderBaseWidth = sliderBase.width;

            // AS3 allocates a transparent BitmapData and copyPixels() the asset into it before
            // assigning it. The copy buys nothing: `_activeBaseArea` is only ever touched again by
            // `buttonProcedure`, which sets its `width` — a window property, not a bitmap
            // operation — so the pixels are never mutated and the asset can be assigned whole.
            sliderBase.bitmap = this._sliderBaseAsset;
            this._activeBaseArea = sliderBase;
        }

        const movementArea = this._window.findChildByName('slider_movement_area') as IWindowContainer | null;

        if(movementArea !== null)
        {
            const button = movementArea.findChildByName('slider_button') as IBitmapWrapperWindow | null;

            if(button !== null && this._sliderButtonAsset !== null)
            {
                button.bitmap = this._sliderButtonAsset;
                button.procedure = this.buttonProcedure;

                this._referenceWidth = movementArea.width - button.width;
                this._shaftClickOffset = (this._sliderBaseWidth - this._referenceWidth) / 2;
            }
        }
    }

    // AS3: .../ui/widget/camera/CameraFxStrengthSlider.as::storeAssets()
    private storeAssets(assets: IAssetLibrary | null): void
    {
        if(assets === null)
        {
            return;
        }

        this._sliderBaseAsset = (assets.getAssetByName('camera_fx_slider_bottom_active')?.content ?? null) as ImageBitmap | null;
        this._sliderButtonAsset = (assets.getAssetByName('camera_fx_slider_button')?.content ?? null) as ImageBitmap | null;
    }
}
