import type {IWindow} from '@core/window/IWindow';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';

import type {PresetManager} from '../PresetManager';
import type {WiredStyle} from '../styles/WiredStyle';
import type {SourceTypeSelectorParam} from '../params/SourceTypeSelectorParam';
import type {ISourceTypePicker} from '../../inputsources/ISourceTypePicker';
import {SourceTypePicker} from '../../inputsources/SourceTypePicker';
import {NewSourceTypePicker} from '../../inputsources/newpicker/NewSourceTypePicker';
import {WiredUIPreset} from './WiredUIPreset';

/**
 * SourceTypeSelectorPreset — a fixed-width source-type selector. Builds the new (illumina) picker if
 * the style's selector view is tagged "NEW", otherwise the old picker, then initialises it with the
 * available source ids and current selection.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/roomevents/wired_setup/uibuilder/presets/SourceTypeSelectorPreset.as
 */
export class SourceTypeSelectorPreset extends WiredUIPreset
{
    // AS3: SourceTypeSelectorPreset.as::_window
    private _window: IItemListWindow;

    // AS3: SourceTypeSelectorPreset.as::_picker
    private _picker: ISourceTypePicker;

    // AS3: SourceTypeSelectorPreset.as::SourceTypeSelectorPreset()
    constructor(roomEvents: HabboUserDefinedRoomEvents, presetManager: PresetManager, wiredStyle: WiredStyle, param: SourceTypeSelectorParam)
    {
        super(roomEvents, presetManager, wiredStyle);

        this._window = wiredStyle.createSourceTypeSelector();

        if(this._window.tags.indexOf('NEW') !== -1)
        {
            this._picker = new NewSourceTypePicker(roomEvents, this._window, param.listener);
        }
        else
        {
            this._picker = new SourceTypePicker(roomEvents, this._window, param.listener);
        }

        this._picker.initialize(param.ids, param.currentSelection);
    }

    // AS3: SourceTypeSelectorPreset.as::select()
    /** Replaces the offered source types AND the selection — the options depend on the effect. */
    // AS3: SourceTypeSelectorPreset.as::reinit()
    reinit(ids: number[], selected: number): void
    {
        this._picker.initialize(ids, selected);
    }

    select(id: number): void
    {
        this._picker.select(id);
    }

    // AS3: SourceTypeSelectorPreset.as::hasStaticWidth()
    override hasStaticWidth(): boolean
    {
        return true;
    }

    // AS3: SourceTypeSelectorPreset.as::get staticWidth()
    override get staticWidth(): number
    {
        return this._window.width;
    }

    // AS3: SourceTypeSelectorPreset.as::get window()
    override get window(): IWindow
    {
        return this._window;
    }

    // AS3: SourceTypeSelectorPreset.as::resizeToWidth()
    override resizeToWidth(width: number): void
    {
        super.resizeToWidth(width);
    }

    // AS3: SourceTypeSelectorPreset.as::dispose()
    override dispose(): void
    {
        if(this.disposed)
        {
            return;
        }

        super.dispose();
        this._window.dispose();
        this._window = null as unknown as IItemListWindow;
        this._picker.dispose();
        this._picker = null as unknown as ISourceTypePicker;
    }
}
