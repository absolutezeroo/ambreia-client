import type {IWindow} from '@core/window/IWindow';
import type {IInteractiveWindow} from '@core/window/components/IInteractiveWindow';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';

import type {PresetManager} from '../PresetManager';
import type {WiredStyle} from '../styles/WiredStyle';
import {WiredUIPreset} from './WiredUIPreset';

/**
 * ButtonPreset — a captioned text button. In scale mode (default) it clamps its width to the resize
 * width; in stretch mode it reports a static width from its natural size. Fires the supplied callback
 * on click.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/roomevents/wired_setup/uibuilder/presets/ButtonPreset.as
 */
export class ButtonPreset extends WiredUIPreset
{
    // AS3: ButtonPreset.as::MODE_SCALE
    public static readonly MODE_SCALE: number = 0;

    // AS3: ButtonPreset.as::MODE_STRETCH
    public static readonly MODE_STRETCH: number = 1;

    // AS3: ButtonPreset.as::_container
    private _container: IInteractiveWindow;

    // AS3: ButtonPreset.as::_mode
    private _mode: number;

    // AS3: ButtonPreset.as::_onClick (click callback)
    private _onClick: (() => void) | null;

    // AS3: ButtonPreset.as::ButtonPreset()
    constructor(roomEvents: HabboUserDefinedRoomEvents, presetManager: PresetManager, wiredStyle: WiredStyle, caption: string, onClick: (() => void) | null, mode: number = 0)
    {
        super(roomEvents, presetManager, wiredStyle);

        this._onClick = onClick;
        this._container = wiredStyle.createButton();
        this._container.caption = caption;
        this._mode = mode;
        this._container.addEventListener(WindowMouseEvent.CLICK, this._buttonClicked);
    }

    // AS3: ButtonPreset.as::buttonClicked()
    private _buttonClicked = (_event: WindowMouseEvent): void =>
    {
        if(this._onClick != null)
        {
            this._onClick();
        }
    };

    /** Only the AIR build has this setter; `ApiKeySection` is its one caller, in both trees. */
    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/uibuilder/presets/ButtonPreset.as::set buttonText()
    set buttonText(value: string)
    {
        this._container.caption = value;
    }

    // AS3: ButtonPreset.as::get window()
    override get window(): IWindow
    {
        return this._container;
    }

    // AS3: ButtonPreset.as::resizeToWidth()
    override resizeToWidth(width: number): void
    {
        super.resizeToWidth(width);

        if(this._mode === 0)
        {
            this._container.limits.minWidth = width;
            this._container.limits.maxWidth = width;
            this._container.width = width;
        }
    }

    // AS3: ButtonPreset.as::hasStaticWidth()
    override hasStaticWidth(): boolean
    {
        return this._mode === 1;
    }

    // AS3: ButtonPreset.as::get staticWidth()
    override get staticWidth(): number
    {
        if(this._mode === 1)
        {
            return this._container.width;
        }

        return -1;
    }

    // AS3: ButtonPreset.as::dispose()
    override dispose(): void
    {
        if(this.disposed)
        {
            return;
        }

        super.dispose();
        this._container.dispose();
        this._container = null as unknown as IInteractiveWindow;
        this._onClick = null;
    }
}
