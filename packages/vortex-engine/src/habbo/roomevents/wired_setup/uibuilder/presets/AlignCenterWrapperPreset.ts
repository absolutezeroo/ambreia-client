import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import {WindowEvent} from '@core/window/events/WindowEvent';
import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';

import type {PresetManager} from '../PresetManager';
import type {WiredStyle} from '../styles/WiredStyle';
import {WiredUIPreset} from './WiredUIPreset';

/**
 * AlignCenterWrapperPreset — wraps a preset in a container and, on resize, horizontally centres the
 * wrapped preset within the given width. Matches the container height to the wrapped window.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/roomevents/wired_setup/uibuilder/presets/AlignCenterWrapperPreset.as
 */
export class AlignCenterWrapperPreset extends WiredUIPreset
{
    // AS3: AlignCenterWrapperPreset.as::_window
    private _window: IWindowContainer;

    // AS3: AlignCenterWrapperPreset.as::_SafeStr_5158 (wrapped preset)
    private _wrapped: WiredUIPreset;

    // AS3: AlignCenterWrapperPreset.as::AlignCenterWrapperPreset()
    constructor(roomEvents: HabboUserDefinedRoomEvents, presetManager: PresetManager, wiredStyle: WiredStyle, wrapped: WiredUIPreset)
    {
        super(roomEvents, presetManager, wiredStyle);

        this._window = presetManager.createLayout('container_view') as unknown as IWindowContainer;
        this._wrapped = wrapped;
        this._window.addChild(this._wrapped.window);
        this._wrapped.window.addEventListener(WindowEvent.WE_RESIZED, this._onResizeListener);
    }

    // DEVIATION: AS3 lays out once, in resizeToWidth(), because its assets are embedded and a
    //   StaticBitmapAssetWrapperPreset already has its bitmap's size when it is built. Here
    //   ResourceManager.retrieveAsset() fetches an unseen image asynchronously, so the child is
    //   still the layout's 30x30 when resizeToWidth() runs and grows later — which left the
    //   Projectile directional-system image clipped to 30px. Re-running the layout on the child's
    //   WE_RESIZED, as CenteredContainerPreset.as does, restores the synchronous result.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/roomevents/wired_setup/uibuilder/presets/AlignCenterWrapperPreset.as::resizeToWidth()
    private _onResizeListener = (_event: WindowEvent): void =>
    {
        if(this._ignoreListeners)
        {
            return;
        }

        this.resize();
    };

    // TS-only: re-entrancy guard for _onResizeListener, as CenteredContainerPreset.as::_ignoreListeners.
    private _ignoreListeners: boolean = false;

    // AS3: AlignCenterWrapperPreset.as::get window()
    override get window(): IWindow
    {
        return this._window;
    }

    // AS3: AlignCenterWrapperPreset.as::resizeToWidth()
    override resizeToWidth(width: number): void
    {
        this._ignoreListeners = true;
        super.resizeToWidth(width);
        this._window.width = width;

        let childWidth: number;

        if(this._wrapped.hasStaticWidth())
        {
            this._wrapped.resizeToWidth(this._wrapped.staticWidth);
            childWidth = this._wrapped.staticWidth;
        }
        else
        {
            this._wrapped.resizeToWidth(width);
            childWidth = this._wrapped.window.width;
        }

        const x = Math.max(0, Math.trunc(width / 2 - childWidth / 2));

        this._wrapped.window.x = x;
        this._window.height = this._wrapped.window.height;
        this._ignoreListeners = false;
    }

    // AS3: AlignCenterWrapperPreset.as::get childPresets()
    protected override get childPresets(): WiredUIPreset[]
    {
        return [this._wrapped];
    }

    // AS3: AlignCenterWrapperPreset.as::dispose()
    override dispose(): void
    {
        if(this.disposed)
        {
            return;
        }

        this._wrapped.window.removeEventListener(WindowEvent.WE_RESIZED, this._onResizeListener);
        super.dispose();
        this._window.dispose();
        this._window = null as unknown as IWindowContainer;
        this._wrapped = null as unknown as WiredUIPreset;
    }
}
