import type {IWindow} from '@core/window/IWindow';
import type {
    AbstractVariableList
} from '@habbo/communication/messages/incoming/userdefinedroomevents/wiredcontext/AbstractVariableList';
import type {
    WiredVariable
} from '@habbo/communication/messages/incoming/userdefinedroomevents/variables/WiredVariable';
import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';
import {Util} from '@habbo/roomevents/Util';
import {ExpandableDropdownOption} from '../../../common/advanced_dropdown/ExpandableDropdownOption';
import {WiredInputSourcePicker} from '../../../inputsources/WiredInputSourcePicker';
import type {PresetManager} from '../../../uibuilder/PresetManager';
import {CheckboxOptionParam} from '../../../uibuilder/params/CheckboxOptionParam';
import {DropdownParam} from '../../../uibuilder/params/DropdownParam';
import {NumberInputParam} from '../../../uibuilder/params/NumberInputParam';
import {RadioButtonParam} from '../../../uibuilder/params/RadioButtonParam';
import {SectionParam} from '../../../uibuilder/params/SectionParam';
import type {CheckboxGroupPreset} from '../../../uibuilder/presets/CheckboxGroupPreset';
import type {RadioGroupPreset} from '../../../uibuilder/presets/RadioGroupPreset';
import type {SectionPreset} from '../../../uibuilder/presets/SectionPreset';
import type {SplitterPreset} from '../../../uibuilder/presets/SplitterPreset';
import {WiredUIPreset} from '../../../uibuilder/presets/WiredUIPreset';
import type {NamedDropdownPreset} from '../../../uibuilder/presets/combinations/NamedDropdownPreset';
import type {NamedNumberInputPreset} from '../../../uibuilder/presets/combinations/NamedNumberInputPreset';
import type {WiredStyle} from '../../../uibuilder/styles/WiredStyle';
import type {VariableFxEditorState} from '../model/VariableFxEditorState';
import type {IVariableFxStateListener} from './IVariableFxStateListener';
import type {VariableFxAudienceVariablePopup} from './VariableFxAudienceVariablePopup';

/**
 * Who sees the effect, when it shows, and for how long.
 *
 * Three controls that are really one decision. The show MODE is a radio group, and only the middle
 * option — "when the variable changes" — has a payload: the update mask, the duration and the
 * hover flag live inside it and are disabled when another mode is chosen.
 *
 * The audience dropdown is the interesting part. Two of its entries are not values but ACTIONS:
 * picking "has a variable" opens {@link VariableFxAudienceVariablePopup} instead of changing the
 * state, and the state is only written when that modal saves. Its label then rewrites itself to
 * name the chosen variable and value, which is why `createAudienceOptions()` is rebuilt on every
 * refresh rather than built once.
 *
 * The first two entries appear only for a USER effect: a furni's effect has no "only the user" or
 * "the user's team" to offer.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/presets/VariableFxVisibilitySettingsPreset.as
 */
export class VariableFxVisibilitySettingsPreset extends WiredUIPreset
{
    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::_listener (name derived)
    private _listener: IVariableFxStateListener | null;

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::_state (name derived)
    private _state: VariableFxEditorState | null = null;

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::_variables
    private _variables: AbstractVariableList | null = null;

    /** Set while `refreshForState()` writes the controls, so their change events are ignored. */
    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::_refreshing (name derived)
    private _refreshing: boolean = false;

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::_section (name derived)
    private _section: SectionPreset | null;

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::_audiencePopup
    private _audiencePopup: VariableFxAudienceVariablePopup | null;

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::_audienceDropdown (name derived)
    private _audienceDropdown: NamedDropdownPreset | null;

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::_showModeGroup (name derived)
    private _showModeGroup: RadioGroupPreset | null;

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::_showModePayload (name derived)
    private _showModePayload: WiredUIPreset | null;

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::_durationInput (name derived)
    private _durationInput: NamedNumberInputPreset | null;

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::_hoverGroup (name derived)
    private _hoverGroup: CheckboxGroupPreset | null;

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::_maskSplitter (name derived)
    private _maskSplitter: SplitterPreset | null;

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::_durationSplitter (name derived)
    private _durationSplitter: SplitterPreset | null;

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::_updateMaskGroup (name derived)
    private _updateMaskGroup: CheckboxGroupPreset | null;

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::VariableFxVisibilitySettingsPreset()
    constructor(
        roomEvents: HabboUserDefinedRoomEvents,
        presetManager: PresetManager,
        wiredStyle: WiredStyle,
        listener: IVariableFxStateListener
    )
    {
        super(roomEvents, presetManager, wiredStyle);

        this._listener = listener;

        this._audienceDropdown = presetManager.createNamedDropdown(
            // The param's callback is variadic; the dropdown passes the option it selected.
            new DropdownParam('', this.createAudienceOptions(),
                (...args: unknown[]) => this.onAudienceChange((args[0] as ExpandableDropdownOption | null) ?? null)),
            '${wiredfurni.params.variablefx.visibility.audience}'
        );
        this._audiencePopup = presetManager.createVariableFxAudienceVariablePopup(
            (variableId, matchValue, value) => this.onAudienceVariableSaved(variableId, matchValue, value)
        );

        const onCheckboxChange = (): void => this.stateChanged();

        // Two columns, four flags — which kinds of change make the effect reappear.
        this._updateMaskGroup = presetManager.createCheckboxGroup([
            new CheckboxOptionParam('${wiredfurni.params.variablefx.update_mask.1}', 0),
            new CheckboxOptionParam('${wiredfurni.params.variablefx.update_mask.2}', 1),
            new CheckboxOptionParam('${wiredfurni.params.variablefx.update_mask.3}', 2),
            new CheckboxOptionParam('${wiredfurni.params.variablefx.update_mask.4}', 3)
        ], onCheckboxChange, 2);

        this._hoverGroup = presetManager.createCheckboxGroup(
            [new CheckboxOptionParam('${wiredfurni.params.variablefx.mouse_hover}', 0)], onCheckboxChange
        );

        this._durationInput = presetManager.createNamedNumberInput(
            new NumberInputParam(3000, 1500, 20000, 45), '${wiredfurni.params.variablefx.show_duration}'
        );
        this._durationInput.onValueChange = (): void => this.stateChanged();

        this._maskSplitter = presetManager.createSplitter();
        this._durationSplitter = presetManager.createSplitter();

        const payload = presetManager.createSimpleListView(true, [
            this._updateMaskGroup, this._maskSplitter, this._durationInput,
            this._durationSplitter, this._hoverGroup
        ]);

        this._showModePayload = presetManager.createPaddedContainerPreset(
            payload, 6, 5, 6, 5, wiredStyle.createBorder()
        );

        // Only mode 1 carries the payload; the other two are bare options.
        this._showModeGroup = presetManager.createRadioGroup([
            new RadioButtonParam(0, '${wiredfurni.params.variablefx.show_mode.always}'),
            new RadioButtonParam(1, '${wiredfurni.params.variablefx.show_mode.when_variable_changes}', null, this._showModePayload),
            new RadioButtonParam(2, '${wiredfurni.params.variablefx.show_mode.never}')
        ], () => this.stateChanged());

        this._section = presetManager.createSection(
            '${wiredfurni.params.variablefx.visibility}',
            presetManager.createSimpleListView(true, [this._showModeGroup, this._audienceDropdown]),
            SectionParam.COLLAPSED
        );
    }

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::init()
    init(state: VariableFxEditorState, variables: AbstractVariableList | null): void
    {
        this._state = state;
        this._variables = variables;

        this.refreshForState(state);
    }

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::applyToState()
    applyToState(state: VariableFxEditorState): void
    {
        if(this._audienceDropdown !== null) state.visibility = this._audienceDropdown.selectedId;
        if(this._showModeGroup !== null) state.showMode = this._showModeGroup.selected;

        state.showOnMouseHover = this._hoverGroup?.get(0)?.selected ?? false;
        state.visibilityMask = this._updateMaskGroup?.mask ?? 0;

        if(this._durationInput !== null) state.showDuration = this._durationInput.value;
    }

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::refreshForState()
    refreshForState(state: VariableFxEditorState): void
    {
        this._refreshing = true;

        this._audienceDropdown?.reinit(this.createAudienceOptions(), state.visibility);

        if(this._showModeGroup !== null) this._showModeGroup.selected = state.showMode;

        const hover = this._hoverGroup?.get(0) ?? null;

        if(hover !== null) hover.selected = state.showOnMouseHover;

        if(this._updateMaskGroup !== null) this._updateMaskGroup.mask = state.visibilityMask;
        if(this._durationInput !== null) this._durationInput.value = state.showDuration;
        if(this._audienceDropdown !== null) this._audienceDropdown.visible = true;

        // The payload belongs to mode 1 alone.
        if(this._showModePayload !== null) this._showModePayload.disabled = state.showMode !== 1;

        this._refreshing = false;
    }

    /** Called when the dialog closes, so a modal cannot outlive the form that opened it. */
    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::closePopups()
    closePopups(): void
    {
        this._audiencePopup?.hide();
    }

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::get window()
    override get window(): IWindow
    {
        return this._section!.window;
    }

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::resizeToWidth()
    override resizeToWidth(width: number): void
    {
        super.resizeToWidth(width);

        this._section?.resizeToWidth(width);
    }

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::get childPresets()
    protected override get childPresets(): WiredUIPreset[]
    {
        const children: WiredUIPreset[] = [];

        if(this._section !== null) children.push(this._section);
        if(this._audiencePopup !== null) children.push(this._audiencePopup);

        return children;
    }

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::isVariableAudience()
    private static isVariableAudience(visibility: number): boolean
    {
        return visibility === 3 || visibility === 4;
    }

    /**
     * The variable entries are ACTIONS, not values: picking one opens the modal and re-reads the
     * state, leaving it unchanged until the modal saves.
     */
    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::onAudienceChange()
    private onAudienceChange(option: ExpandableDropdownOption | null): void
    {
        const state = this._state;

        if(this._refreshing || state === null) return;

        if(option !== null && VariableFxVisibilitySettingsPreset.isVariableAudience(option.id))
        {
            this._audiencePopup?.open(
                this._variables, state.audienceVariableId, state.visibility === 4, state.audienceVariableValue
            );
            this.refreshForState(state);

            return;
        }

        this.stateChanged();
    }

    /** Visibility 4 means "and it equals this value"; 3 means "whoever has it at all". */
    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::onAudienceVariableSaved()
    private onAudienceVariableSaved(variableId: string, matchValue: boolean, value: number): void
    {
        const state = this._state;

        if(state === null) return;

        state.visibility = matchValue ? 4 : 3;
        state.audienceVariableId = variableId;
        state.audienceVariableValue = matchValue ? value : 0;

        state.sanitize();
        this.refreshForState(state);

        this._listener?.variableFxStateChanged(state, false);
    }

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::stateChanged()
    private stateChanged(): void
    {
        const state = this._state;

        if(this._refreshing || state === null) return;

        this.applyToState(state);
        state.sanitize();
        this.refreshForState(state);

        this._listener?.variableFxStateChanged(state, false);
    }

    /** Rebuilt every refresh, because the variable entry's LABEL depends on the current selection. */
    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::createAudienceOptions()
    private createAudienceOptions(): ExpandableDropdownOption[]
    {
        const options: ExpandableDropdownOption[] = [];
        const state = this._state;

        // A furni's effect has no user, so neither of the first two entries means anything for it.
        if(state === null || state.sourceType === WiredInputSourcePicker.USER_SOURCE)
        {
            options.push(new ExpandableDropdownOption(0, '${wiredfurni.params.variablefx.visibility.only_user}'));
            options.push(new ExpandableDropdownOption(1, '${wiredfurni.params.variablefx.visibility.game_team}'));
        }

        options.push(new ExpandableDropdownOption(this.variableAudienceOptionId, this.variableAudienceOptionText()));
        options.push(new ExpandableDropdownOption(2, '${wiredfurni.params.variablefx.visibility.everyone}'));

        return options;
    }

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::get variableAudienceOptionId()
    private get variableAudienceOptionId(): number
    {
        return this._state !== null && this._state.visibility === 4 ? 4 : 3;
    }

    /**
     * Four labels for one entry, in decreasing order of how much is known: nothing chosen, a
     * variable id the room no longer has, a variable with a value to match, and a variable alone.
     */
    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::variableAudienceOptionText()
    private variableAudienceOptionText(): string
    {
        const state = this._state;

        if(state === null || state.audienceVariableId === '')
        {
            return this.loc('wiredfurni.params.variablefx.visibility.has_variable');
        }

        const variable = this.audienceVariable;

        if(variable === null)
        {
            return this.localizations.getLocalizationWithParams(
                'wiredfurni.params.variablefx.visibility.has_variable.named', '',
                'variable', state.audienceVariableId
            );
        }

        if(state.visibility === 4)
        {
            const value = Util.variableValueWithString(variable, state.audienceVariableValue)
                ?? String(state.audienceVariableValue);

            return this.localizations.getLocalizationWithParams(
                'wiredfurni.params.variablefx.visibility.has_variable.value', '',
                'variable', variable.variableName, 'value', value
            );
        }

        return this.localizations.getLocalizationWithParams(
            'wiredfurni.params.variablefx.visibility.has_variable.named', '',
            'variable', variable.variableName
        );
    }

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::get audienceVariable()
    private get audienceVariable(): WiredVariable | null
    {
        if(this._variables === null || this._state === null) return null;

        return Util.findVariableById(this._variables.variables ?? [], this._state.audienceVariableId);
    }

    // AS3: .../presets/VariableFxVisibilitySettingsPreset.as::dispose()
    override dispose(): void
    {
        if(this.disposed) return;

        super.dispose();

        this._listener = null;
        this._state = null;
        this._variables = null;
        this._section = null;
        this._audiencePopup = null;
        this._audienceDropdown = null;
        this._showModeGroup = null;
        this._showModePayload = null;
        this._durationInput = null;
        this._hoverGroup = null;
        this._maskSplitter = null;
        this._durationSplitter = null;
        this._updateMaskGroup = null;
    }
}
