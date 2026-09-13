import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';

import type {PresetManager} from '../../PresetManager';
import type {WiredStyle} from '../../styles/WiredStyle';
import type {DropdownParam} from '../../params/DropdownParam';
import {TextParam} from '../../params/TextParam';
import type {DropdownPreset} from '../DropdownPreset';
import type {SimpleListViewPreset} from '../SimpleListViewPreset';
import type {TextPreset} from '../TextPreset';
import type {ExpandableDropdownOption} from '../../../common/advanced_dropdown/ExpandableDropdownOption';
import {WiredUIPreset} from '../WiredUIPreset';

/**
 * NamedDropdownPreset — a label followed by a DropdownPreset, laid out horizontally inside a
 * growing_container_view. Delegates the selection API to the inner dropdown.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/roomevents/wired_setup/uibuilder/presets/combinations/NamedDropdownPreset.as
 */
export class NamedDropdownPreset extends WiredUIPreset
{
    // AS3: NamedDropdownPreset.as::_container
    private _container: IWindowContainer;

    // AS3: NamedDropdownPreset.as::_SafeStr_6284 (name derived: the label+dropdown list view)
    private _listView: SimpleListViewPreset;

    // AS3: NamedDropdownPreset.as::_SafeStr_4714 (name derived: the label text)
    private _text: TextPreset;

    // AS3: NamedDropdownPreset.as::_SafeStr_5522 (name derived: the inner dropdown)
    private _dropdown: DropdownPreset;

    // AS3: NamedDropdownPreset.as::NamedDropdownPreset()
    constructor(roomEvents: HabboUserDefinedRoomEvents, presetManager: PresetManager, wiredStyle: WiredStyle, param: DropdownParam, caption: string, bold: boolean = false)
    {
        super(roomEvents, presetManager, wiredStyle);

        this._container = presetManager.createLayout('growing_container_view') as unknown as IWindowContainer;
        this._text = presetManager.createText(caption, new TextParam(0, bold));
        this._dropdown = presetManager.createDropdown(param);
        this._text.window.y = wiredStyle.namedDropdownOffset;
        this._listView = presetManager.createSimpleListView(false, [this._text, this._dropdown], true);
        this._container.addChild(this._listView.window);
    }

    /**
     * The label column's width.
     *
     * Settable so a stack of named dropdowns can be given ONE column width — the widest label's —
     * and have every dropdown start at the same x. Nothing computes that here; the owner measures
     * its rows and writes the answer back.
     */
    // AS3: NamedDropdownPreset.as::get nameWidth()
    get nameWidth(): number
    {
        return this._text.window.width;
    }

    // AS3: NamedDropdownPreset.as::set nameWidth()
    set nameWidth(value: number)
    {
        this._text.window.width = value;

        this._listView.resize();
    }

    // AS3: NamedDropdownPreset.as::get selectedId()
    get selectedId(): number
    {
        return this._dropdown.selectedId;
    }

    // AS3: NamedDropdownPreset.as::set selectedId()
    set selectedId(id: number)
    {
        this._dropdown.selectedId = id;
    }

    // AS3: NamedDropdownPreset.as::get selected()
    get selected(): ExpandableDropdownOption | null
    {
        return this._dropdown.selected;
    }

    // AS3: NamedDropdownPreset.as::reinit()
    reinit(options: ExpandableDropdownOption[], selectedId: number): void
    {
        this._dropdown.reinit(options, selectedId);
    }

    // AS3: NamedDropdownPreset.as::reset()
    reset(): void
    {
        this._dropdown.reset();
    }

    // AS3: NamedDropdownPreset.as::hasStaticWidth()
    override hasStaticWidth(): boolean
    {
        return this._dropdown.hasStaticWidth();
    }

    // AS3: NamedDropdownPreset.as::get staticWidth()
    override get staticWidth(): number
    {
        if(this.hasStaticWidth())
        {
            return this._container.width;
        }

        throw new Error('Named dropdown has no static width');
    }

    // AS3: NamedDropdownPreset.as::get window()
    override get window(): IWindow
    {
        return this._container;
    }

    // AS3: NamedDropdownPreset.as::resizeToWidth()
    override resizeToWidth(width: number): void
    {
        super.resizeToWidth(width);
        this._listView.resizeToWidth(width);
    }

    // AS3: NamedDropdownPreset.as::get childPresets()
    protected override get childPresets(): WiredUIPreset[]
    {
        return [this._listView];
    }

    // AS3: NamedDropdownPreset.as::dispose() — note: AS3 disposes only the list view and nulls the
    // three presets; it deliberately leaves _container (the growing_container_view) un-disposed and
    // non-null. Preserved.
    override dispose(): void
    {
        if(this.disposed)
        {
            return;
        }

        super.dispose();
        this._listView.dispose();
        this._listView = null as unknown as SimpleListViewPreset;
        this._text = null as unknown as TextPreset;
        this._dropdown = null as unknown as DropdownPreset;
    }
}
