import {Logger} from '@core/utils/Logger';
import type {IDisposable} from '@core/runtime/IDisposable';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {ISelectableWindow} from '@core/window/components/ISelectableWindow';
import type {IDropMenuWindow} from '@core/window/components/IDropMenuWindow';
import {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {WindowUtils} from '@core/window/utils/WindowUtils';
import {RaidProtectionSettingsData} from './RaidProtectionSettingsData';
import type {RaidProtectionSettingsController} from './RaidProtectionSettingsController';
import type {HabboNavigator} from '../HabboNavigator';

const log = Logger.getLogger('habbo.navigator.raidprotection.RaidProtectionSettingsView');

/**
 * The `raid_protection_settings` window.
 *
 * It holds no state of its own beyond the last settings it was handed: every control is looked up
 * by name on demand, and a save collects the controls back into a draft
 * ({@link collectDraft}) rather than tracking edits. `_updatingControls` exists because
 * {@link update} writes all seven controls, and each write fires the same `WE_SELECTED` the user
 * would — without the guard, filling the window would re-run `refreshState()` seven times.
 *
 * The three fields the user cannot edit — room id, incident flag, last-raid timestamp — are
 * carried through from the settings the server sent, never from a control.
 *
 * Only `AIR-1.0.31` has this class. Its name and all its methods are readable there; the private
 * fields `_settings` and `_saveOutstanding` are derived from what they hold.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/navigator/raidprotection/RaidProtectionSettingsView.as
 */
export class RaidProtectionSettingsView implements IDisposable
{
    // AS3: .../raidprotection/RaidProtectionSettingsView.as::SENSITIVITY_VALUES
    private static readonly SENSITIVITY_VALUES: readonly number[] = [0, 1, 2];

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::ACTION_VALUES
    private static readonly ACTION_VALUES: readonly number[] = [0, 1];

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::BAN_DURATION_VALUES
    private static readonly BAN_DURATION_VALUES: readonly number[] =
        [300, 900, 1800, 3600, 10800, 21600, 43200, 86400, 259200, 604800];

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::GUARD_DURATION_VALUES
    private static readonly GUARD_DURATION_VALUES: readonly number[] = [300, 900, 1800, 3600, 10800];

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::_controller (name derived)
    private _controller: RaidProtectionSettingsController | null;

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::_navigator
    private _navigator: HabboNavigator | null;

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::_settings (name derived)
    private _settings: RaidProtectionSettingsData | null = null;

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::_updatingControls
    private _updatingControls: boolean = false;

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::_saveOutstanding (name derived)
    private _saveOutstanding: boolean = false;

    private _disposed: boolean = false;

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::RaidProtectionSettingsView()
    constructor(controller: RaidProtectionSettingsController, navigator: HabboNavigator)
    {
        this._controller = controller;
        this._navigator = navigator;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::get visible()
    get visible(): boolean
    {
        return this._window !== null && this._window.visible;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::isShowingRoom()
    isShowingRoom(roomId: number): boolean
    {
        return this.visible && this._settings !== null && this._settings.roomId === roomId;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::update()
    update(settings: RaidProtectionSettingsData): void
    {
        this.ensureWindow();

        if(this._window === null) return;

        this._settings = settings;
        this._updatingControls = true;

        this.setChecked(this.enabledCheckbox, settings.enabled);
        this.setChecked(this.guardEnabledCheckbox, settings.guardEnabled);

        this.setSelection(this.detectionDropdown, RaidProtectionSettingsView.SENSITIVITY_VALUES, settings.detectionSensitivity);
        this.setSelection(this.actionDropdown, RaidProtectionSettingsView.ACTION_VALUES, settings.actionType);
        this.setSelection(this.banDurationDropdown, RaidProtectionSettingsView.BAN_DURATION_VALUES, settings.banDurationSeconds);
        this.setSelection(this.guardDurationDropdown, RaidProtectionSettingsView.GUARD_DURATION_VALUES, settings.guardDurationSeconds);
        this.setSelection(this.guardSensitivityDropdown, RaidProtectionSettingsView.SENSITIVITY_VALUES, settings.guardSensitivity);

        const inactiveText = this.incidentInactiveText;

        if(inactiveText !== null)
        {
            inactiveText.text = settings.lastRaidAtEpochSeconds > 0
                ? this._navigator?.localization?.getLocalizationWithParams(
                    'raid.protection.settings.status.inactive.last',
                    '',
                    'timestamp',
                    new Date(settings.lastRaidAtEpochSeconds * 1000).toLocaleString()
                ) ?? ''
                : '${raid.protection.settings.status.inactive}';

            inactiveText.visible = !settings.incidentActive;
        }

        const activeText = this.incidentActiveText;

        if(activeText !== null) activeText.visible = settings.incidentActive;

        this._updatingControls = false;
        this.refreshState();
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::show()
    show(): void
    {
        if(this._window === null) return;

        this._window.visible = true;
        this._window.activate();
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::hide()
    hide(): void
    {
        if(this._window) this._window.visible = false;
    }

    /**
     * Greys out Save while a save is in flight, and while the confirmation dialog is up.
     */
    // AS3: .../raidprotection/RaidProtectionSettingsView.as::setSaveOutstanding()
    setSaveOutstanding(outstanding: boolean): void
    {
        this._saveOutstanding = outstanding;

        if(this.visible) this.refreshState();
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::ensureWindow()
    private ensureWindow(): void
    {
        if(this._window) return;

        const window = this._navigator?.getXmlWindow('raid_protection_settings') ?? null;

        if(window === null)
        {
            log.warn('raid_protection_settings layout is missing — the window cannot be built');
            return;
        }

        this._window = window as unknown as IWindowContainer;
        this._window.center();

        const sensitivityLabels = [
            '${raid.protection.settings.sensitivity.low}',
            '${raid.protection.settings.sensitivity.medium}',
            '${raid.protection.settings.sensitivity.high}'
        ];

        this.detectionDropdown?.populate(sensitivityLabels);
        this.actionDropdown?.populate([
            '${raid.protection.settings.action.kick}',
            '${raid.protection.settings.action.temporary_ban}'
        ]);
        this.banDurationDropdown?.populate(this.durationLabels(RaidProtectionSettingsView.BAN_DURATION_VALUES));
        this.guardDurationDropdown?.populate(this.durationLabels(RaidProtectionSettingsView.GUARD_DURATION_VALUES));
        this.guardSensitivityDropdown?.populate(sensitivityLabels);

        for(const control of this.controls)
        {
            control.addEventListener(WindowEvent.WE_SELECTED, this.onControlChanged);
            control.addEventListener(WindowEvent.WE_UNSELECTED, this.onControlChanged);
        }

        this.saveButton?.addEventListener(WindowMouseEvent.CLICK, this.onSave);
        this.cancelButton?.addEventListener(WindowMouseEvent.CLICK, this.onCancel);
        this._window.findChildByTag('close')?.addEventListener(WindowMouseEvent.CLICK, this.onCancel);
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::durationLabels()
    private durationLabels(values: readonly number[]): string[]
    {
        return values.map((value) => `\${raid.protection.settings.duration.${value}}`);
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::onControlChanged()
    private onControlChanged = (): void =>
    {
        if(!this._updatingControls) this.refreshState();
    };

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::onSave()
    private onSave = (): void =>
    {
        if(this._settings === null) return;

        const draft = this.collectDraft();

        if(draft === null) return;

        this._controller?.requestSave(draft);
    };

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::onCancel()
    private onCancel = (): void =>
    {
        this._controller?.close();
    };

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::collectDraft()
    private collectDraft(): RaidProtectionSettingsData | null
    {
        if(this._settings === null) return null;

        const detection = this.readSelection(this.detectionDropdown, RaidProtectionSettingsView.SENSITIVITY_VALUES);
        const action = this.readSelection(this.actionDropdown, RaidProtectionSettingsView.ACTION_VALUES);
        const banDuration = this.readSelection(this.banDurationDropdown, RaidProtectionSettingsView.BAN_DURATION_VALUES);
        const guardDuration = this.readSelection(this.guardDurationDropdown, RaidProtectionSettingsView.GUARD_DURATION_VALUES);
        const guardSensitivity = this.readSelection(this.guardSensitivityDropdown, RaidProtectionSettingsView.SENSITIVITY_VALUES);

        if(detection === null
            || action === null
            || banDuration === null
            || guardDuration === null
            || guardSensitivity === null)
        {
            return null;
        }

        return new RaidProtectionSettingsData(
            this._settings.roomId,
            this.enabledCheckbox?.isSelected ?? false,
            detection,
            action,
            banDuration,
            this.guardEnabledCheckbox?.isSelected ?? false,
            guardDuration,
            guardSensitivity,
            this._settings.incidentActive,
            this._settings.lastRaidAtEpochSeconds
        );
    }

    /**
     * Three nested gates: nothing is editable while protection is off; the ban duration is only
     * editable when the action is a temporary ban (never for a kick); and the guard section is
     * only editable when the guard itself is on.
     */
    // AS3: .../raidprotection/RaidProtectionSettingsView.as::refreshState()
    private refreshState(): void
    {
        if(this._window === null) return;

        const enabled = this.enabledCheckbox?.isSelected ?? false;
        const isKick = this.actionDropdown?.selection
            === RaidProtectionSettingsView.ACTION_VALUES.indexOf(RaidProtectionSettingsData.ACTION_KICK);

        const protectionControls = this.protectionControls;
        const banDurationSection = this.banDurationSection;
        const guardControls = this.guardControls;
        const saveButton = this.saveButton;

        if(protectionControls) WindowUtils.disableSection(protectionControls, !enabled);

        if(banDurationSection) WindowUtils.disableSection(banDurationSection, !enabled || isKick);

        if(guardControls)
        {
            WindowUtils.disableSection(guardControls, !enabled || !(this.guardEnabledCheckbox?.isSelected ?? false));
        }

        if(saveButton) WindowUtils.disableSection(saveButton, this._saveOutstanding);
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::setChecked()
    private setChecked(checkbox: ISelectableWindow | null, checked: boolean): void
    {
        if(checkbox === null) return;

        if(checked)
        {
            checkbox.select();
        }
        else
        {
            checkbox.unselect();
        }
    }

    /**
     * AS3 assigns `dropdown.selection = VALUES.indexOf(value)` inline. Split out here so the two
     * directions stay symmetrical with {@link readSelection}, and so a value the server sent that
     * is not in the whitelist leaves the dropdown alone instead of selecting index -1.
     */
    // TS-only: extracted from the seven inline assignments in
    //   `RaidProtectionSettingsView.as::update()`; AS3 has no such helper.
    private setSelection(dropdown: IDropMenuWindow | null, values: readonly number[], value: number): void
    {
        if(dropdown === null) return;

        const index = values.indexOf(value);

        if(index < 0)
        {
            log.warn(`Server sent a value this client has no option for: ${value}`);
            return;
        }

        dropdown.selection = index;
    }

    // TS-only: the inverse of `setSelection()`; AS3 spells both bound checks out inline in
    //   `RaidProtectionSettingsView.as::collectDraft()`.
    private readSelection(dropdown: IDropMenuWindow | null, values: readonly number[]): number | null
    {
        if(dropdown === null) return null;

        const index = dropdown.selection;

        if(index < 0 || index >= values.length) return null;

        return values[index] ?? null;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::get controls()
    private get controls(): IWindow[]
    {
        const names = [
            'enabled_checkbox',
            'guard_enabled_checkbox',
            'detection_sensitivity_dropdown',
            'action_type_dropdown',
            'ban_duration_dropdown',
            'guard_duration_dropdown',
            'guard_sensitivity_dropdown'
        ];

        const found: IWindow[] = [];

        for(const name of names)
        {
            const child = this._window?.findChildByName(name) ?? null;

            if(child !== null) found.push(child);
        }

        return found;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::get enabledCheckbox()
    private get enabledCheckbox(): ISelectableWindow | null
    {
        return this.find<ISelectableWindow>('enabled_checkbox');
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::get protectionControls()
    private get protectionControls(): IWindow | null
    {
        return this._window?.findChildByName('protection_controls') ?? null;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::get detectionDropdown()
    private get detectionDropdown(): IDropMenuWindow | null
    {
        return this.find<IDropMenuWindow>('detection_sensitivity_dropdown');
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::get actionDropdown()
    private get actionDropdown(): IDropMenuWindow | null
    {
        return this.find<IDropMenuWindow>('action_type_dropdown');
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::get banDurationSection()
    private get banDurationSection(): IWindow | null
    {
        return this._window?.findChildByName('ban_duration_section') ?? null;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::get banDurationDropdown()
    private get banDurationDropdown(): IDropMenuWindow | null
    {
        return this.find<IDropMenuWindow>('ban_duration_dropdown');
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::get guardEnabledCheckbox()
    private get guardEnabledCheckbox(): ISelectableWindow | null
    {
        return this.find<ISelectableWindow>('guard_enabled_checkbox');
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::get guardControls()
    private get guardControls(): IWindow | null
    {
        return this._window?.findChildByName('guard_controls') ?? null;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::get guardDurationDropdown()
    private get guardDurationDropdown(): IDropMenuWindow | null
    {
        return this.find<IDropMenuWindow>('guard_duration_dropdown');
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::get guardSensitivityDropdown()
    private get guardSensitivityDropdown(): IDropMenuWindow | null
    {
        return this.find<IDropMenuWindow>('guard_sensitivity_dropdown');
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::get incidentActiveText()
    private get incidentActiveText(): ITextWindow | null
    {
        return this.find<ITextWindow>('incident_active_text');
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::get incidentInactiveText()
    private get incidentInactiveText(): ITextWindow | null
    {
        return this.find<ITextWindow>('incident_inactive_text');
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::get saveButton()
    private get saveButton(): IWindow | null
    {
        return this._window?.findChildByName('save_button') ?? null;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::get cancelButton()
    private get cancelButton(): IWindow | null
    {
        return this._window?.findChildByName('cancel_button') ?? null;
    }

    // TS-only: AS3 casts each `findChildByName()` result at the call site
    //   (`_SafeCls_2391(_window.findChildByName(...))`); one helper says the same thing once.
    private find<T>(name: string): T | null
    {
        const child = this._window?.findChildByName(name) ?? null;

        return child === null ? null : (child as unknown as T);
    }

    // AS3: .../raidprotection/RaidProtectionSettingsView.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        if(this._window)
        {
            for(const control of this.controls)
            {
                control.removeEventListener(WindowEvent.WE_SELECTED, this.onControlChanged);
                control.removeEventListener(WindowEvent.WE_UNSELECTED, this.onControlChanged);
            }

            this.saveButton?.removeEventListener(WindowMouseEvent.CLICK, this.onSave);
            this.cancelButton?.removeEventListener(WindowMouseEvent.CLICK, this.onCancel);
            this._window.findChildByTag('close')?.removeEventListener(WindowMouseEvent.CLICK, this.onCancel);

            this._window.dispose();
            this._window = null;
        }

        this._controller = null;
        this._navigator = null;
        this._settings = null;
    }
}
