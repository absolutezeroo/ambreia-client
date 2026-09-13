import type {Triggerable} from '@habbo/communication/messages/incoming/userdefinedroomevents/Triggerable';
import {Util} from '@habbo/roomevents/Util';
import {DefaultElement} from '../../DefaultElement';
import type {ISourceTypeListener} from '../../inputsources/ISourceTypeListener';
import {WiredInputSourcePicker} from '../../inputsources/WiredInputSourcePicker';
import type {PresetManager} from '../../uibuilder/PresetManager';
import type {WiredUIBuilder} from '../../uibuilder/WiredUIBuilder';
import {SourceTypeSelectorParam} from '../../uibuilder/params/SourceTypeSelectorParam';
import type {WiredUIPreset} from '../../uibuilder/presets/WiredUIPreset';
import type {WiredStyle} from '../../uibuilder/styles/WiredStyle';
import {DefaultAddonType} from '../DefaultAddonType';
import {VariableFxEditorMetadata} from './model/VariableFxEditorMetadata';
import {VariableFxEditorState} from './model/VariableFxEditorState';
import type {IVariableFxStateListener} from './presets/IVariableFxStateListener';
import type {VariableFxAdvancedRangePreset} from './presets/VariableFxAdvancedRangePreset';
import type {VariableFxValueRangePreset} from './presets/VariableFxValueRangePreset';
import type {VariableFxVisibilitySettingsPreset} from './presets/VariableFxVisibilitySettingsPreset';
import type {VariableFxVisualizationSettingsPreset} from './presets/VariableFxVisualizationSettingsPreset';

/**
 * What every Variable FX wired add-on is: four sections over one shared state object.
 *
 * The six concrete add-ons differ by almost nothing — a code, a category id, and for two of them an
 * extra int param. Everything the user actually sees and edits is here, which is why the subclasses
 * are thirty lines each.
 *
 * The param layout is the contract with the server and is worth stating, because the indices are
 * not what the field order suggests: three of the values are written as LONGS, each taking two
 * slots. Writing pushes 0..9 plainly, then `defaultMinValue` into 10-11, `defaultMaxValue` into
 * 12-13, four flags into 14..17, `audienceVariableValue` into 18-19 and `segments` at 20 — 21
 * entries, which is exactly what the server's `FurnitureWiredVariableFxAddonLogic` declares rule by
 * rule. Reading takes the low word of each long, which is why `readIntParams()` skips 10, 12 and 18.
 *
 * Named for what it is: the AS3 class is `_SafeCls_4377` and the name exists in no tree.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/_SafeCls_4377.as
 */
export class VariableFxAddonBase extends DefaultAddonType implements IVariableFxStateListener, ISourceTypeListener
{
    /** The dialog is wider than a default add-on's — four sections and a preview do not fit. */
    // AS3: .../addons/variablefx/_SafeCls_4377.as::get widthModifier()
    private static readonly WIDTH_MODIFIER: number = 1.45;

    // AS3: .../addons/variablefx/_SafeCls_4377.as::_state (name derived)
    protected _state: VariableFxEditorState | null = null;

    // AS3: .../addons/variablefx/_SafeCls_4377.as::_visualizationPreset (name derived)
    private _visualizationPreset: VariableFxVisualizationSettingsPreset | null = null;

    // AS3: .../addons/variablefx/_SafeCls_4377.as::_valueRangePreset (name derived)
    private _valueRangePreset: VariableFxValueRangePreset | null = null;

    // AS3: .../addons/variablefx/_SafeCls_4377.as::_visibilityPreset (name derived)
    private _visibilityPreset: VariableFxVisibilitySettingsPreset | null = null;

    // AS3: .../addons/variablefx/_SafeCls_4377.as::_advancedRangePreset (name derived)
    private _advancedRangePreset: VariableFxAdvancedRangePreset | null = null;

    /** Which of the six effect families this add-on configures; -1 in the base, set by each one. */
    // AS3: .../addons/variablefx/_SafeCls_4377.as::get categoryId()
    protected get categoryId(): number
    {
        return -1;
    }

    // AS3: .../addons/variablefx/_SafeCls_4377.as::get inputMode()
    override get inputMode(): number
    {
        return DefaultElement.INPUTS_TYPE_UI_BUILDER;
    }

    // AS3: .../addons/variablefx/_SafeCls_4377.as::get widthModifier()
    override get widthModifier(): number
    {
        return VariableFxAddonBase.WIDTH_MODIFIER;
    }

    /** The header's own furni-or-user picker, read straight off the def's first int param. */
    // AS3: .../addons/variablefx/_SafeCls_4377.as::getHeaderSourceTypeSelectorParam()
    getHeaderSourceTypeSelectorParam(def: Triggerable): SourceTypeSelectorParam
    {
        return new SourceTypeSelectorParam(
            [WiredInputSourcePicker.FURNI_SOURCE, WiredInputSourcePicker.USER_SOURCE],
            this,
            def.getInt(0)
        );
    }

    // AS3: .../addons/variablefx/_SafeCls_4377.as::get headerSourceType()
    get headerSourceType(): number
    {
        return this._state?.sourceType ?? WiredInputSourcePicker.USER_SOURCE;
    }

    /**
     * Changing the source re-lays the dialog out, because the sections it can offer change with it
     * — which is why this is the one path that calls `resizeFrame()`.
     */
    // AS3: .../addons/variablefx/_SafeCls_4377.as::set sourceType()
    set sourceType(value: number)
    {
        const state = this._state;

        if(state === null) return;

        const changed = state.sourceType !== value;

        state.sourceType = value;
        state.sanitize();

        this._visibilityPreset?.refreshForState(state);
        this._advancedRangePreset?.refreshForSourceType(state);

        this.variableFxStateChanged(state, false);

        if(changed) this.roomEvents.wiredCtrl.resizeFrame();
    }

    // AS3: .../addons/variablefx/_SafeCls_4377.as::buildInputs()
    override buildInputs(presetManager: PresetManager, _wiredStyle: WiredStyle, builder: WiredUIBuilder): void
    {
        const info = this.createTopInfoPreset(presetManager);

        this._visualizationPreset = presetManager.createVariableFxVisualizationSettingsPreset(this);
        this._valueRangePreset = presetManager.createVariableFxValueRangePreset(this);
        this._visibilityPreset = presetManager.createVariableFxVisibilitySettingsPreset(this);
        this._advancedRangePreset = presetManager.createVariableFxAdvancedRangePreset(this);

        if(info !== null) builder.addElements(info);

        builder.addElements(
            this._visualizationPreset, this._valueRangePreset, this._visibilityPreset, this._advancedRangePreset
        );
    }

    /** Only the level add-ons override this, to explain what a levelling effect is. */
    // AS3: .../addons/variablefx/_SafeCls_4377.as::createTopInfoPreset()
    protected createTopInfoPreset(_presetManager: PresetManager): WiredUIPreset | null
    {
        return null;
    }

    /**
     * Builds the state from the def, then hands it to whichever presets exist.
     *
     * The presets can be absent: `onEditStart()` is called before `buildInputs()` the first time a
     * dialog opens, which is exactly why AS3 guards on the first of them rather than assuming.
     */
    // AS3: .../addons/variablefx/_SafeCls_4377.as::onEditStart()
    override onEditStart(def: Triggerable): void
    {
        const state = new VariableFxEditorState();

        state.categoryId = this.categoryId;

        this.readIntParams(def.intParams, state);
        this.readStringParam(def, state);

        state.overrideMinVariableId = def.variableIds[0] ?? '';
        state.overrideMaxVariableId = def.variableIds[1] ?? '';
        state.audienceVariableId = def.variableIds[2] ?? '';

        state.sanitize();

        this._state = state;

        if(this._visualizationPreset === null) return;

        const variables = def.wiredContext.roomVariablesList;

        this._visualizationPreset.init(state);
        this._valueRangePreset?.init(state);
        this._visibilityPreset?.init(state, variables);
        this._advancedRangePreset?.init(state, variables);
    }

    // AS3: .../addons/variablefx/_SafeCls_4377.as::onEditEnd()
    override onEditEnd(): void
    {
        super.onEditEnd();

        this._visibilityPreset?.closePopups();
    }

    // AS3: .../addons/variablefx/_SafeCls_4377.as::readIntParamsFromForm()
    override readIntParamsFromForm(): number[]
    {
        const state = this.currentState();
        const params: number[] = [];

        if(state !== null) this.writeIntParams(params, state);

        return params;
    }

    /** `true`: the variable ids are what the picker FINALLY resolved, not its live selection. */
    // AS3: .../addons/variablefx/_SafeCls_4377.as::readVariableIdsFromForm()
    override readVariableIdsFromForm(): string[]
    {
        const state = this.currentState(true);

        if(state === null) return ['', '', ''];

        return [state.overrideMinVariableId, state.overrideMaxVariableId, state.audienceVariableId];
    }

    // AS3: .../addons/variablefx/_SafeCls_4377.as::readStringParamFromForm()
    override readStringParamFromForm(): string
    {
        const state = this.currentState();

        return state === null ? '' : this.writeStringParam(state);
    }

    /** The one rule the form cannot express, so it is checked on save instead. */
    // AS3: .../addons/variablefx/_SafeCls_4377.as::validate()
    override validate(): string | null
    {
        const state = this._state;

        if(state !== null
            && VariableFxEditorMetadata.categoryUsesValueRange(state.categoryId)
            && state.defaultMaxValue <= state.defaultMinValue)
        {
            return this.roomEvents.localization.getLocalization(
                'wiredfurni.error.variable_fx.value_range',
                'Maximum value must be greater than minimum value.'
            );
        }

        return null;
    }

    /** `rebuild` false means only the value moved, so the preview need not be rebuilt. */
    // AS3: .../addons/variablefx/_SafeCls_4377.as::variableFxStateChanged()
    variableFxStateChanged(state: VariableFxEditorState, rebuild: boolean = true): void
    {
        this._state = state;

        if(this._visualizationPreset === null) return;

        if(rebuild) this._visualizationPreset.refreshPreview();
    }

    /**
     * Pulls the form into the state and repairs it — the single point every read goes through, so
     * no caller can serialise a half-applied form.
     */
    // AS3: .../addons/variablefx/_SafeCls_4377.as::currentState()
    protected currentState(finalize: boolean = false): VariableFxEditorState | null
    {
        const state = this._state;

        if(state === null || this._visualizationPreset === null) return state;

        this._visualizationPreset.applyToState(state);
        this._valueRangePreset?.applyToState(state);
        this._visibilityPreset?.applyToState(state);
        this._advancedRangePreset?.applyToState(state, finalize);

        state.sanitize();

        return state;
    }

    /** Indices 10, 12 and 18 are skipped: they are the HIGH words of the three longs. */
    // AS3: .../addons/variablefx/_SafeCls_4377.as::readIntParams()
    protected readIntParams(params: number[], state: VariableFxEditorState): void
    {
        state.sourceType = params[0] ?? 0;
        state.visibility = params[1] ?? 0;
        state.showMode = params[2] ?? 0;
        state.visibilityMask = params[3] ?? 0;
        state.showOnMouseHover = (params[4] ?? 0) !== 0;
        state.showDuration = params[5] ?? 0;
        state.styleId = params[6] ?? 0;
        state.colorId = params[7] ?? 0;
        state.widthId = params[8] ?? 0;
        state.rendererId = params[9] ?? 0;
        state.defaultMinValue = params[11] ?? 0;
        state.defaultMaxValue = params[13] ?? 0;
        state.overrideMinEnabled = (params[14] ?? 0) !== 0;
        state.overrideMaxEnabled = (params[15] ?? 0) !== 0;
        state.overrideMinTarget = params[16] ?? 0;
        state.overrideMaxTarget = params[17] ?? 0;
        state.audienceVariableValue = params[19] ?? 0;
        state.segments = params[20] ?? 0;
    }

    // AS3: .../addons/variablefx/_SafeCls_4377.as::writeIntParams()
    protected writeIntParams(params: number[], state: VariableFxEditorState): void
    {
        params.push(state.sourceType);
        params.push(state.visibility);
        params.push(state.showMode);
        params.push(state.visibilityMask);
        params.push(state.showOnMouseHover ? 1 : 0);
        params.push(state.showDuration);
        params.push(state.styleId);
        params.push(state.colorId);
        params.push(state.widthId);
        params.push(state.rendererId);

        // Two slots each: a value range can legitimately exceed an int.
        Util.pushIntAsLong(params, state.defaultMinValue);
        Util.pushIntAsLong(params, state.defaultMaxValue);

        params.push(state.overrideMinEnabled ? 1 : 0);
        params.push(state.overrideMaxEnabled ? 1 : 0);
        params.push(state.overrideMinTarget);
        params.push(state.overrideMaxTarget);

        Util.pushIntAsLong(params, state.audienceVariableValue);

        params.push(state.segments);
    }

    /** Only the number display uses the string param, for its icon. */
    // AS3: .../addons/variablefx/_SafeCls_4377.as::readStringParam()
    protected readStringParam(_def: Triggerable, _state: VariableFxEditorState): void
    {
        // Subclasses read.
    }

    // AS3: .../addons/variablefx/_SafeCls_4377.as::writeStringParam()
    protected writeStringParam(_state: VariableFxEditorState): string
    {
        return '';
    }
}
