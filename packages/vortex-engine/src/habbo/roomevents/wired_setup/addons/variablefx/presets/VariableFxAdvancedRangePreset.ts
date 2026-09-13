import type {IWindow} from '@core/window/IWindow';
import type {
    AbstractVariableList
} from '@habbo/communication/messages/incoming/userdefinedroomevents/wiredcontext/AbstractVariableList';
import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';
import type {PresetManager} from '../../../uibuilder/PresetManager';
import {SectionParam} from '../../../uibuilder/params/SectionParam';
import type {SectionPreset} from '../../../uibuilder/presets/SectionPreset';
import type {SimpleListViewPreset} from '../../../uibuilder/presets/SimpleListViewPreset';
import {WiredUIPreset} from '../../../uibuilder/presets/WiredUIPreset';
import type {WiredStyle} from '../../../uibuilder/styles/WiredStyle';
import {VariableFxEditorMetadata} from '../model/VariableFxEditorMetadata';
import type {VariableFxEditorState} from '../model/VariableFxEditorState';
import type {IVariableFxStateListener} from './IVariableFxStateListener';
import {VariableFxVariableOverrideRowPreset} from './VariableFxVariableOverrideRowPreset';

/**
 * The collapsed "advanced" section: bind either end of the range to a variable instead of a number.
 *
 * Starts collapsed because most effects never need it — the two rows underneath are the whole
 * content, and they are the same class told apart by which end they own.
 *
 * `refreshForSourceType()` returns whether the LAYOUT changed, not whether the values did: the
 * caller needs to know when to re-measure the dialog, and either the section appearing or the
 * source type changing can move things. Hiding follows the same rule as the plain value range — a
 * level effect and a number display have no range to override.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/presets/VariableFxAdvancedRangePreset.as
 */
export class VariableFxAdvancedRangePreset extends WiredUIPreset
{
    // AS3: .../presets/VariableFxAdvancedRangePreset.as::_listener (name derived)
    private _listener: IVariableFxStateListener | null;

    // AS3: .../presets/VariableFxAdvancedRangePreset.as::_state (name derived)
    private _state: VariableFxEditorState | null = null;

    // AS3: .../presets/VariableFxAdvancedRangePreset.as::_variables
    private _variables: AbstractVariableList | null = null;

    // AS3: .../presets/VariableFxAdvancedRangePreset.as::_section (name derived)
    private _section: SectionPreset | null;

    // AS3: .../presets/VariableFxAdvancedRangePreset.as::_rows (name derived)
    private _rows: SimpleListViewPreset | null;

    // AS3: .../presets/VariableFxAdvancedRangePreset.as::_overrideMinPreset
    private _overrideMinPreset: VariableFxVariableOverrideRowPreset | null;

    // AS3: .../presets/VariableFxAdvancedRangePreset.as::_overrideMaxPreset
    private _overrideMaxPreset: VariableFxVariableOverrideRowPreset | null;

    /** Primed to the minimum int so the first `refreshForSourceType()` always reports a change. */
    // AS3: .../presets/VariableFxAdvancedRangePreset.as::_sourceType (name derived)
    private _sourceType: number = -2147483648;

    // AS3: .../presets/VariableFxAdvancedRangePreset.as::VariableFxAdvancedRangePreset()
    constructor(
        roomEvents: HabboUserDefinedRoomEvents,
        presetManager: PresetManager,
        wiredStyle: WiredStyle,
        listener: IVariableFxStateListener
    )
    {
        super(roomEvents, presetManager, wiredStyle);

        this._listener = listener;

        const onRowChange = (): void => this.onRowChange();

        this._overrideMinPreset = presetManager.createVariableFxVariableOverrideRowPreset(
            VariableFxVariableOverrideRowPreset.MINIMUM, onRowChange
        );
        this._overrideMaxPreset = presetManager.createVariableFxVariableOverrideRowPreset(
            VariableFxVariableOverrideRowPreset.MAXIMUM, onRowChange
        );

        this._rows = presetManager.createSimpleListView(true, [this._overrideMinPreset, this._overrideMaxPreset]);
        this._rows.spacing = wiredStyle.genericVerticalSpacing;

        this._section = presetManager.createSection(
            '${wiredfurni.params.variablefx.advanced.range}', this._rows, SectionParam.COLLAPSED
        );
    }

    // AS3: .../presets/VariableFxAdvancedRangePreset.as::init()
    init(state: VariableFxEditorState, variables: AbstractVariableList | null): void
    {
        this._state = state;
        this._variables = variables;

        this.refreshForSourceType(state);
    }

    // AS3: .../presets/VariableFxAdvancedRangePreset.as::applyToState()
    applyToState(state: VariableFxEditorState, finalize: boolean = false): void
    {
        if(!this.visible) return;

        this._overrideMinPreset?.applyToState(state, finalize);
        this._overrideMaxPreset?.applyToState(state, finalize);
    }

    /** Returns whether the LAYOUT moved, so the caller knows to re-measure. */
    // AS3: .../presets/VariableFxAdvancedRangePreset.as::refreshForSourceType()
    refreshForSourceType(state: VariableFxEditorState): boolean
    {
        const wasVisible = this.visible;
        const previousSourceType = this._sourceType;

        this._sourceType = state.sourceType;
        this.visible = VariableFxEditorMetadata.categoryUsesValueRange(state.categoryId);

        if(!this.visible) return wasVisible !== this.visible;

        this._overrideMinPreset?.init(this._variables, state);
        this._overrideMaxPreset?.init(this._variables, state);

        return wasVisible !== this.visible || previousSourceType !== this._sourceType;
    }

    // AS3: .../presets/VariableFxAdvancedRangePreset.as::get window()
    override get window(): IWindow
    {
        return this._section!.window;
    }

    // AS3: .../presets/VariableFxAdvancedRangePreset.as::resizeToWidth()
    override resizeToWidth(width: number): void
    {
        super.resizeToWidth(width);

        this._section?.resizeToWidth(width);
    }

    // AS3: .../presets/VariableFxAdvancedRangePreset.as::get childPresets()
    protected override get childPresets(): WiredUIPreset[]
    {
        return this._section === null ? [] : [this._section];
    }

    /** `false`: a variable binding changes no layout, so the dialog need not re-measure. */
    // AS3: .../presets/VariableFxAdvancedRangePreset.as::onRowChange()
    private onRowChange(): void
    {
        const state = this._state;

        if(state === null) return;

        this.applyToState(state);
        state.sanitize();

        this._listener?.variableFxStateChanged(state, false);
    }

    // AS3: .../presets/VariableFxAdvancedRangePreset.as::dispose()
    override dispose(): void
    {
        if(this.disposed) return;

        super.dispose();

        this._listener = null;
        this._state = null;
        this._variables = null;
        this._section = null;
        this._rows = null;
        this._overrideMinPreset = null;
        this._overrideMaxPreset = null;
    }
}
