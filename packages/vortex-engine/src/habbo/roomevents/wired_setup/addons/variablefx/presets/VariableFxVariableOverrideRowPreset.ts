import type {IWindow} from '@core/window/IWindow';
import type {
    AbstractVariableList
} from '@habbo/communication/messages/incoming/userdefinedroomevents/wiredcontext/AbstractVariableList';
import type {
    WiredVariable
} from '@habbo/communication/messages/incoming/userdefinedroomevents/variables/WiredVariable';
import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';
import {VariableExtraSourceTypes} from '../../../common/VariableExtraSourceTypes';
import type {ISourceTypeListener} from '../../../inputsources/ISourceTypeListener';
import {WiredInputSourcePicker} from '../../../inputsources/WiredInputSourcePicker';
import type {PresetManager} from '../../../uibuilder/PresetManager';
import {CheckboxOptionParam} from '../../../uibuilder/params/CheckboxOptionParam';
import {SourceTypeSelectorParam} from '../../../uibuilder/params/SourceTypeSelectorParam';
import type {CheckboxGroupPreset} from '../../../uibuilder/presets/CheckboxGroupPreset';
import type {SimpleListViewPreset} from '../../../uibuilder/presets/SimpleListViewPreset';
import type {SourceTypeSelectorPreset} from '../../../uibuilder/presets/SourceTypeSelectorPreset';
import type {VariablePickerPreset} from '../../../uibuilder/presets/VariablePickerPreset';
import {WiredUIPreset} from '../../../uibuilder/presets/WiredUIPreset';
import type {WiredStyle} from '../../../uibuilder/styles/WiredStyle';
import type {VariableFxEditorState} from '../model/VariableFxEditorState';

/**
 * One "override this end of the range with a variable" row: a checkbox, a variable picker and a
 * source-type selector.
 *
 * Both ends use the same class, told apart by {@link MINIMUM} / {@link MAXIMUM} — which is the only
 * thing deciding which three state fields it reads and writes. That keeps the two rows genuinely
 * identical rather than near-copies.
 *
 * The source options are not fixed: a furni effect offers furni-or-global, a user effect
 * user-or-global. Global is always there, because a global variable belongs to nobody in
 * particular.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/presets/VariableFxVariableOverrideRowPreset.as
 */
export class VariableFxVariableOverrideRowPreset extends WiredUIPreset implements ISourceTypeListener
{
    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::MINIMUM (name derived)
    //   The AS3 constant is `_SafeStr_10633`, value 0.
    static readonly MINIMUM: number = 0;

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::MAXIMUM
    static readonly MAXIMUM: number = 1;

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::_kind (name derived)
    private _kind: number;

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::_onChange (name derived)
    private _onChange: (() => void) | null;

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::_sourceType (name derived)
    private _sourceType: number;

    /** Set while `init()` writes the controls, so their change events are ignored. */
    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::_refreshing (name derived)
    private _refreshing: boolean = false;

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::_checkboxGroup (name derived)
    private _checkboxGroup: CheckboxGroupPreset | null;

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::_variablePicker (name derived)
    private _variablePicker: VariablePickerPreset | null;

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::_sourceSelector (name derived)
    private _sourceSelector: SourceTypeSelectorPreset | null;

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::_row (name derived)
    private _row: SimpleListViewPreset | null;

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::VariableFxVariableOverrideRowPreset()
    constructor(
        roomEvents: HabboUserDefinedRoomEvents,
        presetManager: PresetManager,
        wiredStyle: WiredStyle,
        kind: number,
        onChange: () => void
    )
    {
        super(roomEvents, presetManager, wiredStyle);

        this._kind = kind;
        this._onChange = onChange;
        this._sourceType = WiredInputSourcePicker.USER_SOURCE;

        this._variablePicker = presetManager.createVariablePicker(
            VariableFxVariableOverrideRowPreset.variableSelectionFilter,
            () => this.notifyChanged()
        );
        this._sourceSelector = presetManager.createSourceTypeSelector(new SourceTypeSelectorParam(
            VariableFxVariableOverrideRowPreset.sourceOptionsForType(this._sourceType), this, this._sourceType
        ));
        this._row = presetManager.createSimpleListView(false, [this._variablePicker, this._sourceSelector], true);

        // The whole row is the checkbox's payload, so ticking the box is what reveals the controls.
        this._checkboxGroup = presetManager.createCheckboxGroup(
            [new CheckboxOptionParam(VariableFxVariableOverrideRowPreset.labelForKind(kind), 0, null, this._row)],
            () => this.notifyChanged()
        );
    }

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::init()
    init(variables: AbstractVariableList | null, state: VariableFxEditorState): void
    {
        this._refreshing = true;

        this._sourceType = this.overrideTarget(state);

        this._variablePicker?.init(variables, this.variableId(state), this._sourceType);
        this._sourceSelector?.reinit(
            VariableFxVariableOverrideRowPreset.sourceOptionsForType(state.sourceType), this._sourceType
        );

        const checkbox = this._checkboxGroup?.get(0) ?? null;

        if(checkbox !== null)
        {
            checkbox.selected = this.enabled(state);
            checkbox.updateDisabledState();
        }

        this._refreshing = false;
    }

    /**
     * `finalize` asks the picker for its FINAL answer rather than its current selection — the
     * difference matters when the user typed a new variable's name and never picked it from the
     * list, which is exactly the moment the dialog is being saved.
     */
    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::applyToState()
    applyToState(state: VariableFxEditorState, finalize: boolean = false): void
    {
        const enabled = this._checkboxGroup?.get(0)?.selected ?? false;
        const variableId = this.selectedVariableId(finalize);

        if(this._kind === VariableFxVariableOverrideRowPreset.MINIMUM)
        {
            state.overrideMinEnabled = enabled;
            state.overrideMinTarget = this._sourceType;
            state.overrideMinVariableId = variableId;

            return;
        }

        state.overrideMaxEnabled = enabled;
        state.overrideMaxTarget = this._sourceType;
        state.overrideMaxVariableId = variableId;
    }

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::get sourceTypeValue()
    get sourceTypeValue(): number
    {
        return this._sourceType;
    }

    /** The picker follows the source: a furni's variables are not a user's. */
    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::set sourceType()
    set sourceType(value: number)
    {
        this._sourceType = value;

        if(this._variablePicker !== null) this._variablePicker.variableTarget = value;

        this.notifyChanged();
    }

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::get window()
    override get window(): IWindow
    {
        return this._checkboxGroup!.window;
    }

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::resizeToWidth()
    override resizeToWidth(width: number): void
    {
        super.resizeToWidth(width);

        this._checkboxGroup?.resizeToWidth(width);
    }

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::get childPresets()
    protected override get childPresets(): WiredUIPreset[]
    {
        return this._checkboxGroup === null ? [] : [this._checkboxGroup];
    }

    /** Global is always offered; the other option follows the effect's own source. */
    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::sourceOptionsForType()
    private static sourceOptionsForType(sourceType: number): number[]
    {
        return sourceType === WiredInputSourcePicker.FURNI_SOURCE
            ? [WiredInputSourcePicker.FURNI_SOURCE, VariableExtraSourceTypes.GLOBAL_SOURCE]
            : [WiredInputSourcePicker.USER_SOURCE, VariableExtraSourceTypes.GLOBAL_SOURCE];
    }

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::labelForKind()
    private static labelForKind(kind: number): string
    {
        return kind === VariableFxVariableOverrideRowPreset.MINIMUM
            ? '${wiredfurni.params.variablefx.advanced.override_min}'
            : '${wiredfurni.params.variablefx.advanced.override_max}';
    }

    /** Only variables that hold a value can bound a range. */
    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::variableSelectionFilter()
    private static variableSelectionFilter(variable: WiredVariable): boolean
    {
        return variable.hasValue;
    }

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::selectedVariableId()
    private selectedVariableId(finalize: boolean): string
    {
        if(this._variablePicker === null) return '';

        if(finalize) return this._variablePicker.finalizeSelection;

        return this._variablePicker.selected?.variableId ?? '';
    }

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::notifyChanged()
    private notifyChanged(): void
    {
        if(this._refreshing) return;

        this._onChange?.();
    }

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::enabled()
    private enabled(state: VariableFxEditorState): boolean
    {
        return this._kind === VariableFxVariableOverrideRowPreset.MINIMUM
            ? state.overrideMinEnabled
            : state.overrideMaxEnabled;
    }

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::overrideTarget()
    private overrideTarget(state: VariableFxEditorState): number
    {
        return this._kind === VariableFxVariableOverrideRowPreset.MINIMUM
            ? state.overrideMinTarget
            : state.overrideMaxTarget;
    }

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::variableId()
    private variableId(state: VariableFxEditorState): string
    {
        return this._kind === VariableFxVariableOverrideRowPreset.MINIMUM
            ? state.overrideMinVariableId
            : state.overrideMaxVariableId;
    }

    // AS3: .../presets/VariableFxVariableOverrideRowPreset.as::dispose()
    override dispose(): void
    {
        if(this.disposed) return;

        super.dispose();

        this._onChange = null;
        this._checkboxGroup = null;
        this._variablePicker = null;
        this._sourceSelector = null;
        this._row = null;
    }
}
