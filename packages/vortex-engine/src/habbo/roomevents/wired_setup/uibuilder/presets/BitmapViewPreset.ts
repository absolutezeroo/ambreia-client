import type {IWindow} from '@core/window/IWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';

import type {PresetManager} from '../PresetManager';
import type {WiredStyle} from '../styles/WiredStyle';
import {WiredUIPreset} from './WiredUIPreset';

/**
 * BitmapViewPreset — a fixed-size bitmap surface (exposed via bitmapWindow for callers to draw into),
 * sized by setBitmapSize.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/roomevents/wired_setup/uibuilder/presets/BitmapViewPreset.as
 */
export class BitmapViewPreset extends WiredUIPreset
{
    // AS3: BitmapViewPreset.as::_window
    private _window: IBitmapWrapperWindow;

    // AS3: BitmapViewPreset.as::_width
    private _width: number = 0;

    // AS3: BitmapViewPreset.as::_height
    private _height: number = 0;

    // AS3: BitmapViewPreset.as::BitmapViewPreset()
    constructor(
        roomEvents: HabboUserDefinedRoomEvents,
        presetManager: PresetManager,
        wiredStyle: WiredStyle,
        ownGraphicContext: boolean = false
    )
    {
        super(roomEvents, presetManager, wiredStyle);

        this._window = presetManager.createLayout('bitmap_wrapper_view') as unknown as IBitmapWrapperWindow;

        // A surface redrawn every frame must not share its parent's graphic context, or the parent
        // is invalidated with it — which for the Variable FX preview is the whole wired dialog, 60
        // times a second.
        if(ownGraphicContext) (this._window as unknown as IWindow).setParamFlag(16, false);
    }

    // AS3: BitmapViewPreset.as::get bitmapWindow()
    get bitmapWindow(): IBitmapWrapperWindow
    {
        return this._window;
    }

    // AS3: BitmapViewPreset.as::get window()
    override get window(): IWindow
    {
        return this._window;
    }

    // AS3: BitmapViewPreset.as::hasStaticWidth()
    override hasStaticWidth(): boolean
    {
        return true;
    }

    // AS3: BitmapViewPreset.as::get staticWidth()
    override get staticWidth(): number
    {
        return this._width;
    }

    // AS3: BitmapViewPreset.as::setBitmapSize()
    setBitmapSize(width: number, height: number): void
    {
        this._width = width;
        this._height = height;
    }

    // AS3: BitmapViewPreset.as::resizeToWidth()
    override resizeToWidth(width: number): void
    {
        super.resizeToWidth(width);
        this._window.width = this._width;
        this._window.height = this._height;
    }

    // AS3: BitmapViewPreset.as::dispose()
    override dispose(): void
    {
        if(this.disposed)
        {
            return;
        }

        super.dispose();
        this._window.dispose();
        this._window = null as unknown as IBitmapWrapperWindow;
    }
}
