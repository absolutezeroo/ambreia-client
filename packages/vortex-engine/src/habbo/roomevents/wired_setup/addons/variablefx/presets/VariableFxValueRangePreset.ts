import type {IWindow} from '@core/window/IWindow';
import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';
import type {PresetManager} from '../../../uibuilder/PresetManager';
import {NumberInputParam} from '../../../uibuilder/params/NumberInputParam';
import {TextParam} from '../../../uibuilder/params/TextParam';
import type {NumberInputPreset} from '../../../uibuilder/presets/NumberInputPreset';
import type {SectionPreset} from '../../../uibuilder/presets/SectionPreset';
import {WiredUIPreset} from '../../../uibuilder/presets/WiredUIPreset';
import type {WiredStyle} from '../../../uibuilder/styles/WiredStyle';
import {VariableFxEditorMetadata} from '../model/VariableFxEditorMetadata';
import type {VariableFxEditorState} from '../model/VariableFxEditorState';
import type {IVariableFxStateListener} from './IVariableFxStateListener';

/**
 * The bar's ends: the value that reads as empty and the value that reads as full.
 *
 * The whole section hides itself for the two categories that have no range to configure — a level
 * effect's range is the level's own, a number display has none at all. `applyToState()` therefore
 * checks `visible` before writing, so a hidden section cannot overwrite the range those categories
 * set for themselves.
 *
 * The inputs accept the full int range on purpose. Nothing here rejects min ≥ max either; the state
 * repairs that in `sanitize()` and the addon's `validate()` is what refuses the save, so the user
 * can type the two numbers in whichever order they like.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/presets/VariableFxValueRangePreset.as
 */
export class VariableFxValueRangePreset extends WiredUIPreset
{
    // AS3: .../presets/VariableFxValueRangePreset.as::_listener (name derived)
    private _listener: IVariableFxStateListener | null;

    // AS3: .../presets/VariableFxValueRangePreset.as::_state (name derived)
    private _state: VariableFxEditorState | null = null;

    /** Set while `refreshForState()` writes the inputs, so their change events are ignored. */
    // AS3: .../presets/VariableFxValueRangePreset.as::_refreshing (name derived)
    private _refreshing: boolean = false;

    // AS3: .../presets/VariableFxValueRangePreset.as::_section (name derived)
    private _section: SectionPreset | null;

    // AS3: .../presets/VariableFxValueRangePreset.as::_minInput (name derived)
    private _minInput: NumberInputPreset | null;

    // AS3: .../presets/VariableFxValueRangePreset.as::_maxInput (name derived)
    private _maxInput: NumberInputPreset | null;

    // AS3: .../presets/VariableFxValueRangePreset.as::VariableFxValueRangePreset()
    constructor(
        roomEvents: HabboUserDefinedRoomEvents,
        presetManager: PresetManager,
        wiredStyle: WiredStyle,
        listener: IVariableFxStateListener
    )
    {
        super(roomEvents, presetManager, wiredStyle);

        this._listener = listener;

        // Width -1: the inputs size themselves to the row rather than to a fixed column.
        this._minInput = presetManager.createNumberInput(new NumberInputParam(0, -2147483648, 2147483647, -1));
        this._maxInput = presetManager.createNumberInput(new NumberInputParam(100, -2147483648, 2147483647, -1));

        const onChange = (): void => this.onNumberChange();

        this._minInput.onValueChange = onChange;
        this._maxInput.onValueChange = onChange;

        const infoParam = new TextParam(1);

        infoParam.textColor = wiredStyle.softTextColor;

        const info = presetManager.createText('${wiredfurni.params.variablefx.value_range.info}', infoParam);
        const minLabel = presetManager.createText('Min:', new TextParam(0, false));
        const separator = presetManager.createText('-', new TextParam(0, false));
        const maxLabel = presetManager.createText('Max:', new TextParam(0, false));

        // Hand-set widths, as AS3 has them — the row is measured, not stacked.
        minLabel.window.width = 26;
        separator.window.width = 8;
        maxLabel.window.width = 30;

        const row = presetManager.createSimpleListView(
            false, [minLabel, this._minInput, separator, maxLabel, this._maxInput], true
        );

        this._section = presetManager.createSection(
            '${wiredfurni.params.variablefx.value_range}',
            presetManager.createSimpleListView(true, [info, row])
        );
    }

    // AS3: .../presets/VariableFxValueRangePreset.as::init()
    init(state: VariableFxEditorState): void
    {
        this._state = state;

        this.refreshForState(state);
    }

    /** Writes nothing while hidden — the categories that hide it own their own range. */
    // AS3: .../presets/VariableFxValueRangePreset.as::applyToState()
    applyToState(state: VariableFxEditorState): void
    {
        if(!this.visible || this._minInput === null || this._maxInput === null) return;

        state.defaultMinValue = this._minInput.value;
        state.defaultMaxValue = this._maxInput.value;
    }

    // AS3: .../presets/VariableFxValueRangePreset.as::refreshForState()
    refreshForState(state: VariableFxEditorState): void
    {
        this._refreshing = true;

        this.visible = VariableFxEditorMetadata.categoryUsesValueRange(state.categoryId);

        if(this._minInput !== null) this._minInput.value = state.defaultMinValue;
        if(this._maxInput !== null) this._maxInput.value = state.defaultMaxValue;

        this._refreshing = false;
    }

    // AS3: .../presets/VariableFxValueRangePreset.as::get window()
    override get window(): IWindow
    {
        return this._section!.window;
    }

    // AS3: .../presets/VariableFxValueRangePreset.as::resizeToWidth()
    override resizeToWidth(width: number): void
    {
        super.resizeToWidth(width);

        this._section?.resizeToWidth(width);
    }

    // AS3: .../presets/VariableFxValueRangePreset.as::get childPresets()
    protected override get childPresets(): WiredUIPreset[]
    {
        return this._section === null ? [] : [this._section];
    }

    // AS3: .../presets/VariableFxValueRangePreset.as::onNumberChange()
    private onNumberChange(): void
    {
        const state = this._state;

        if(this._refreshing || state === null) return;

        this.applyToState(state);
        state.sanitize();

        this._listener?.variableFxStateChanged(state, true);
    }

    // AS3: .../presets/VariableFxValueRangePreset.as::dispose()
    override dispose(): void
    {
        if(this.disposed) return;

        super.dispose();

        this._listener = null;
        this._state = null;
        this._section = null;
        this._minInput = null;
        this._maxInput = null;
    }
}
