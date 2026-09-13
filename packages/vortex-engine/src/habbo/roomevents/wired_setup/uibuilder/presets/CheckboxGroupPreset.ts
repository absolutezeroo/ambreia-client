import type {IWindow} from '@core/window/IWindow';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import {WindowEvent} from '@core/window/events/WindowEvent';
import {OrderedMap} from '@core/utils/OrderedMap';
import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';
import {Util} from '@habbo/roomevents/Util';

import type {PresetManager} from '../PresetManager';
import type {WiredStyle} from '../styles/WiredStyle';
import type {CheckboxOptionParam} from '../params/CheckboxOptionParam';
import {WiredUIPreset} from './WiredUIPreset';
import type {CheckboxOptionPreset} from './CheckboxOptionPreset';

/**
 * CheckboxGroupPreset — a group of checkbox options laid out in one or more columns, exposing the
 * selected set as a bit mask (bit i set ⇔ checkbox with id i is checked) and firing a change callback.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/roomevents/wired_setup/uibuilder/presets/CheckboxGroupPreset.as
 */
export class CheckboxGroupPreset extends WiredUIPreset
{
    // AS3: CheckboxGroupPreset.as::_container
    private _container: IItemListWindow;

    // AS3: CheckboxGroupPreset.as::_options (id -> option)
    private _options: OrderedMap<number, CheckboxOptionPreset>;

    // AS3: CheckboxGroupPreset.as::_onChange
    private _onChange: ((id: number, selected: boolean) => void) | null;

    // AS3: CheckboxGroupPreset.as::_rows (per-row horizontal lists, when multi-column)
    private _rows: IItemListWindow[] | null = null;

    // AS3: CheckboxGroupPreset.as::_columns
    private _columns: number;

    // AS3: CheckboxGroupPreset.as::CheckboxGroupPreset()
    constructor(roomEvents: HabboUserDefinedRoomEvents, presetManager: PresetManager, wiredStyle: WiredStyle, params: CheckboxOptionParam[], onChange: ((id: number, selected: boolean) => void) | null, columns: number = 1)
    {
        super(roomEvents, presetManager, wiredStyle);

        this._container = presetManager.createLayout('vertical_list_view') as unknown as IItemListWindow;
        this._columns = columns;
        this._onChange = onChange;

        let index = 0;
        let currentRow: IItemListWindow | null = null;

        if(this._columns > 0)
        {
            this._rows = [];
        }

        this._options = new OrderedMap<number, CheckboxOptionPreset>();

        for(const param of params)
        {
            if(param.id === -1)
            {
                param.id = index;
            }

            const last = params[params.length - 1] === param;
            const option = presetManager.createCheckboxOption(param, last);

            this._options.add(param.id, option);

            if(columns > 1)
            {
                if(index % columns === 0)
                {
                    currentRow = presetManager.createLayout('horizontal_list_view') as unknown as IItemListWindow;
                    currentRow.spacing = wiredStyle.genericHorizontalSpacing;
                    this._rows!.push(currentRow);
                    this._container.addListItem(currentRow);
                }

                currentRow!.addListItem(option.window);
            }
            else
            {
                this._container.addListItem(option.window);
            }

            if(onChange != null)
            {
                option.checkbox.addEventListener(WindowEvent.WE_SELECTED, this._onSelectionChange);
                option.checkbox.addEventListener(WindowEvent.WE_UNSELECTED, this._onSelectionChange);
            }

            index++;
        }
    }

    // AS3: CheckboxGroupPreset.as::onSelectionChange()
    private _onSelectionChange = (event: WindowEvent): void =>
    {
        if(this._onChange != null)
        {
            const id = event.window!.id;

            this._onChange(id, this.optionById(id).selected);
        }
    };

    // AS3: CheckboxGroupPreset.as::_SafeStr_4547() (name derived: fetch the option by checkbox id)
    optionById(id: number): CheckboxOptionPreset
    {
        return this._options.getValue(id)!;
    }

    /** One checkbox by its id — the row presets reach their single option through this. */
    // AS3: CheckboxGroupPreset.as::get()
    get(id: number): CheckboxOptionPreset | null
    {
        return this._options.getValue(id);
    }

    // AS3: CheckboxGroupPreset.as::get numCheckboxes()
    get numCheckboxes(): number
    {
        return this._options.length;
    }

    // AS3: CheckboxGroupPreset.as::get mask()
    get mask(): number
    {
        let mask = 0;

        for(const option of this._options.getValues())
        {
            if(option.selected)
            {
                mask |= 1 << option.checkbox.id;
            }
        }

        return mask;
    }

    // AS3: CheckboxGroupPreset.as::set mask()
    set mask(value: number)
    {
        for(const option of this._options.getValues())
        {
            const selected = (value & (1 << option.checkbox.id)) !== 0;

            Util.select(option.checkbox, selected);
        }
    }

    // AS3: CheckboxGroupPreset.as::resizeToWidth()
    override resizeToWidth(width: number): void
    {
        super.resizeToWidth(width);
        this._container.width = width;

        const columnWidth = Math.trunc((width - (this._columns - 1) * this._wiredStyle.genericHorizontalSpacing) / this._columns);
        let index = 0;

        for(const option of this._options.getValues())
        {
            option.resizeToWidth(columnWidth);

            if(this._columns > 1)
            {
                const row = this._rows![Math.trunc(index / this._columns)];

                if(option.window.height > row.height)
                {
                    row.height = option.window.height;
                }
            }

            index++;
        }
    }

    // AS3: CheckboxGroupPreset.as::get window()
    override get window(): IWindow
    {
        return this._container;
    }

    // AS3: CheckboxGroupPreset.as::get childPresets()
    protected override get childPresets(): WiredUIPreset[]
    {
        return this._options.getValues();
    }

    // AS3: CheckboxGroupPreset.as::dispose()
    override dispose(): void
    {
        if(this.disposed)
        {
            return;
        }

        super.dispose();
        this._container.dispose();
        this._container = null as unknown as IItemListWindow;
        this._options = null as unknown as OrderedMap<number, CheckboxOptionPreset>;
        this._onChange = null;
        this._rows = null;
    }
}
