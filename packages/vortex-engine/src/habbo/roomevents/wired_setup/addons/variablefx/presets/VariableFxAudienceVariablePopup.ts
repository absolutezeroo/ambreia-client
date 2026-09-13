import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {
    AbstractVariableList
} from '@habbo/communication/messages/incoming/userdefinedroomevents/wiredcontext/AbstractVariableList';
import type {
    WiredVariable
} from '@habbo/communication/messages/incoming/userdefinedroomevents/variables/WiredVariable';
import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';
import {WiredInputSourcePicker} from '../../../inputsources/WiredInputSourcePicker';
import type {PresetManager} from '../../../uibuilder/PresetManager';
import {CheckboxOptionParam} from '../../../uibuilder/params/CheckboxOptionParam';
import {NumberInputParam} from '../../../uibuilder/params/NumberInputParam';
import type {ButtonPreset} from '../../../uibuilder/presets/ButtonPreset';
import type {ButtonRowPreset} from '../../../uibuilder/presets/ButtonRowPreset';
import type {CheckboxGroupPreset} from '../../../uibuilder/presets/CheckboxGroupPreset';
import type {CheckboxOptionPreset} from '../../../uibuilder/presets/CheckboxOptionPreset';
import type {PaddedContainerPreset} from '../../../uibuilder/presets/PaddedContainerPreset';
import type {SimpleListViewPreset} from '../../../uibuilder/presets/SimpleListViewPreset';
import type {NamedNumberInputPreset} from '../../../uibuilder/presets/combinations/NamedNumberInputPreset';
import type {VariablePickerPreset} from '../../../uibuilder/presets/VariablePickerPreset';
import {WiredUIPreset} from '../../../uibuilder/presets/WiredUIPreset';
import type {FramePreset} from '../../../uibuilder/presets/main_layout/FramePreset';
import type {WiredStyle} from '../../../uibuilder/styles/WiredStyle';

/** What the popup hands back when the user saves: which variable, and optionally which value. */
export type VariableFxAudienceSelection = (variableId: string, matchValue: boolean, value: number) => void;

/**
 * "Who sees this?" — a modal for picking the variable, and optionally the value, that decides the
 * audience.
 *
 * A separate window rather than an inline section because it is opened from a row inside an already
 * crowded dialog. It lives on desktop layer 1, is centred and activated on open, and is REMOVED
 * from the desktop on close rather than merely hidden — a hidden window still takes part in
 * hit-testing.
 *
 * The value half is gated on the chosen variable actually holding a value, and the gate is
 * enforced twice: `refreshValueControls()` unticks and disables the checkbox when it does not, and
 * `onSaveClicked()` ANDs the flag with `hasValue` again on the way out. The second is not
 * redundant — the selection can change between the two.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/presets/VariableFxAudienceVariablePopup.as
 */
export class VariableFxAudienceVariablePopup extends WiredUIPreset
{
    // AS3: .../presets/VariableFxAudienceVariablePopup.as::WIDTH
    private static readonly WIDTH: number = 300;

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::DESKTOP_WINDOW_LAYER
    private static readonly DESKTOP_WINDOW_LAYER: number = 1;

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::_onSelected (name derived)
    private _onSelected: VariableFxAudienceSelection | null;

    /** Set while `open()` writes the controls, so their change events are ignored. */
    // AS3: .../presets/VariableFxAudienceVariablePopup.as::_refreshing (name derived)
    private _refreshing: boolean = false;

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::_frame (name derived)
    private _frame: FramePreset | null;

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::_variablePicker (name derived)
    private _variablePicker: VariablePickerPreset | null;

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::_selectValueGroup
    private _selectValueGroup: CheckboxGroupPreset | null;

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::_selectValueCheckbox (name derived)
    private _selectValueCheckbox: CheckboxOptionPreset | null;

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::_valueInput (name derived)
    private _valueInput: NamedNumberInputPreset | null;

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::_saveButton (name derived)
    private _saveButton: ButtonPreset | null;

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::_cancelButton (name derived)
    private _cancelButton: ButtonPreset | null;

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::_buttonRow (name derived)
    private _buttonRow: ButtonRowPreset | null;

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::_content (name derived)
    private _content: SimpleListViewPreset | null;

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::_paddedContent (name derived)
    private _paddedContent: PaddedContainerPreset | null;

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::VariableFxAudienceVariablePopup()
    constructor(
        roomEvents: HabboUserDefinedRoomEvents,
        presetManager: PresetManager,
        wiredStyle: WiredStyle,
        onSelected: VariableFxAudienceSelection
    )
    {
        super(roomEvents, presetManager, wiredStyle);

        this._onSelected = onSelected;

        // No filter: ANY variable can name an audience, value or not.
        this._variablePicker = presetManager.createVariablePicker(
            () => true,
            () => this.onVariableSelected()
        );
        this._selectValueGroup = presetManager.createCheckboxGroup(
            [new CheckboxOptionParam('${wiredfurni.params.variablefx.audience_popup.select_value}', 0)],
            () => this.onSelectValueChanged()
        );
        this._selectValueCheckbox = this._selectValueGroup.get(0);

        const valueInput = presetManager.createNamedNumberInput(
            new NumberInputParam(0, -2147483648, 2147483647, 45, 0, false, true),
            '${wiredfurni.params.variablefx.audience_popup.value}'
        );

        this._valueInput = valueInput;

        this._saveButton = presetManager.createButton(
            this.loc('wiredfurni.params.variablefx.audience_popup.save'), () => this.onSaveClicked()
        );
        this._cancelButton = presetManager.createButton(this.loc('cancel'), () => this.hide());
        this._buttonRow = presetManager.createButtonRow([this._saveButton, this._cancelButton]);

        this._content = presetManager.createSimpleListView(
            true, [this._variablePicker, this._selectValueGroup, valueInput]
        );
        this._content.spacing = wiredStyle.genericVerticalSpacing;

        this._paddedContent = presetManager.createPaddedContainerPreset(this._content, 8, 8, 8, 8);
        this._frame = presetManager.createFramePreset([this._paddedContent, this._buttonRow], () => this.hide());

        this._frame.title = this.loc('wiredfurni.params.variablefx.audience_popup.title');

        this._frame.resizeToWidth(VariableFxAudienceVariablePopup.WIDTH);

        this._frame.window.visible = false;
    }

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::open()
    open(variables: AbstractVariableList | null, variableId: string, matchValue: boolean, value: number): void
    {
        this._refreshing = true;

        this._variablePicker?.init(variables, variableId, WiredInputSourcePicker.USER_SOURCE);

        if(this._selectValueCheckbox !== null) this._selectValueCheckbox.selected = matchValue;
        if(this._valueInput !== null) this._valueInput.value = value;

        this._refreshing = false;

        this.refreshValueControls();
        this.show();
    }

    /** Removed from the desktop, not merely hidden — a hidden window still hit-tests. */
    // AS3: .../presets/VariableFxAudienceVariablePopup.as::hide()
    hide(): void
    {
        const frame = this._frame;

        if(frame === null) return;

        if(frame.window.parent !== null)
        {
            const desktop = this._roomEvents.windowManager?.getDesktop(
                VariableFxAudienceVariablePopup.DESKTOP_WINDOW_LAYER
            ) ?? null;

            (desktop as IWindowContainer | null)?.removeChild(frame.window);
        }

        frame.window.visible = false;
    }

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::get window()
    override get window(): IWindow
    {
        return this._frame!.window;
    }

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::get childPresets()
    protected override get childPresets(): WiredUIPreset[]
    {
        return this._frame === null ? [] : [this._frame];
    }

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::show()
    private show(): void
    {
        const frame = this._frame;

        if(frame === null) return;

        if(frame.window.parent === null)
        {
            const desktop = this._roomEvents.windowManager?.getDesktop(
                VariableFxAudienceVariablePopup.DESKTOP_WINDOW_LAYER
            ) ?? null;

            (desktop as IWindowContainer | null)?.addChild(frame.window);
        }

        frame.window.visible = true;
        frame.window.center();
        frame.window.activate();
    }

    /** The value flag is ANDed with `hasValue` again here: the selection can move between checks. */
    // AS3: .../presets/VariableFxAudienceVariablePopup.as::onSaveClicked()
    private onSaveClicked(): void
    {
        const selected = this._variablePicker?.selected ?? null;

        if(selected === null || this._variablePicker === null) return;

        this._onSelected?.(
            this._variablePicker.finalizeSelection,
            (this._selectValueCheckbox?.selected ?? false) && selected.hasValue,
            this._valueInput?.value ?? 0
        );

        this.hide();
    }

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::onVariableSelected()
    private onVariableSelected(): void
    {
        if(this._refreshing) return;

        this.refreshValueControls();
    }

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::onSelectValueChanged()
    private onSelectValueChanged(): void
    {
        if(this._refreshing) return;

        this.refreshValueControls();
    }

    /**
     * Three gates off one question: does the chosen variable hold a value?
     *
     * If it does not, the checkbox is unticked (silently — the guard stops that write from
     * re-entering here) and disabled, the number input follows it, and Save is disabled whenever
     * nothing is chosen at all.
     */
    // AS3: .../presets/VariableFxAudienceVariablePopup.as::refreshValueControls()
    private refreshValueControls(): void
    {
        const selected: WiredVariable | null = this._variablePicker?.selected ?? null;
        const hasValue = selected !== null && selected.hasValue;
        const checkbox = this._selectValueCheckbox;

        if(!hasValue && (checkbox?.selected ?? false))
        {
            this._refreshing = true;

            if(checkbox !== null) checkbox.selected = false;

            this._refreshing = false;
        }

        if(checkbox !== null) checkbox.disabled = !hasValue;
        if(this._valueInput !== null) this._valueInput.disabled = !hasValue || !(checkbox?.selected ?? false);
        if(this._saveButton !== null) this._saveButton.disabled = selected === null;
    }

    // AS3: .../presets/VariableFxAudienceVariablePopup.as::dispose()
    override dispose(): void
    {
        if(this.disposed) return;

        this.hide();

        super.dispose();

        this._onSelected = null;
        this._frame = null;
        this._variablePicker = null;
        this._selectValueGroup = null;
        this._selectValueCheckbox = null;
        this._valueInput = null;
        this._saveButton = null;
        this._cancelButton = null;
        this._buttonRow = null;
        this._content = null;
        this._paddedContent = null;
    }
}
