import type {IDisposable} from '@core/runtime/IDisposable';
import {WindowEvent} from '@core/window/events/WindowEvent';
import type {Triggerable} from '@habbo/communication/messages/incoming/userdefinedroomevents/Triggerable';
import {
    WiredApiKeyResultMessageEvent
} from '@habbo/communication/messages/incoming/userdefinedroomevents/WiredApiKeyResultMessageEvent';
import {
    GenerateWiredApiKeyMessageComposer
} from '@habbo/communication/messages/outgoing/userdefinedroomevents/GenerateWiredApiKeyMessageComposer';
import type {
    WiredApiKeyResultParser
} from '@habbo/communication/messages/parser/userdefinedroomevents/WiredApiKeyResultParser';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';

import {DefaultElement} from '../DefaultElement';
import type {PresetManager} from '../uibuilder/PresetManager';
import type {WiredUIBuilder} from '../uibuilder/WiredUIBuilder';
import {CheckboxOptionParam} from '../uibuilder/params/CheckboxOptionParam';
import {TextParam} from '../uibuilder/params/TextParam';
import type {CheckboxGroupPreset} from '../uibuilder/presets/CheckboxGroupPreset';
import type {SectionPreset} from '../uibuilder/presets/SectionPreset';
import type {TextPreset} from '../uibuilder/presets/TextPreset';
import type {ApiKeySection} from '../uibuilder/presets/sections/ApiKeySection';
import type {UsageWarningSection} from '../uibuilder/presets/sections/UsageWarningSection';
import type {WiredStyle} from '../uibuilder/styles/WiredStyle';
import {AddonCodes} from './AddonCodes';
import {DefaultAddonType} from './DefaultAddonType';

/**
 * Gives one wired furni a pair of web-API keys — a read key and a write key — so an outside
 * service can read and set its variables.
 *
 * Three things are worth knowing about the shape:
 *
 * - **The two keys are sections, not fields.** Each owns its generate/clear/copy row and its own
 *   text area, and both answers arrive on the same message; `isReadKey` on the reply is what says
 *   which section to fill.
 * - **Mass deletion is guarded twice.** The checkbox is disabled while the write key is empty (a
 *   permission over a key nobody holds means nothing), and ticking it raises a confirm whose
 *   cancel un-ticks it. `_ignoreCheckboxEvents` exists for exactly one reason: `onEditStart()`
 *   sets the checkbox from the saved state, and without the guard that would raise the warning
 *   dialog every time the dialog opens on an already-permitted furni.
 * - **The int param is computed, not stored.** `readIntParamsFromForm()` reports the permission
 *   as 0 unless there IS a write key, so a furni that had the box ticked and then had its key
 *   cleared saves as not-permitted without the UI having to say so.
 *
 * Class name and file are the AIR dump's own — this class is not obfuscated there. The add-on
 * exists in no WIN63 build.
 *
 * AS3: sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/VariablesWebApiAddon.as
 */
export class VariablesWebApiAddon extends DefaultAddonType
{
    // AS3: VariablesWebApiAddon.as::MASS_DELETION_CHECKBOX_ID
    private static readonly MASS_DELETION_CHECKBOX_ID: number = 0;

    /** AS3 hard-codes this ARGB on the confirm dialog's title bar: a red, for a destructive grant. */
    // AS3: VariablesWebApiAddon.as::onChangeCheckbox()
    private static readonly WARNING_TITLE_BAR_COLOR: number = 13909337;

    // AS3: VariablesWebApiAddon.as::_usageWarning (name derived)
    private _usageWarning: UsageWarningSection | null = null;

    // AS3: VariablesWebApiAddon.as::_readKeySection (name derived)
    private _readKeySection: ApiKeySection | null = null;

    // AS3: VariablesWebApiAddon.as::_writeKeySection (name derived)
    private _writeKeySection: ApiKeySection | null = null;

    // AS3: VariablesWebApiAddon.as::_permissions
    private _permissions: CheckboxGroupPreset | null = null;

    // AS3: VariablesWebApiAddon.as::_ignoreCheckboxEvents
    private _ignoreCheckboxEvents: boolean = false;

    // AS3: VariablesWebApiAddon.as::get code()
    override get code(): number
    {
        return AddonCodes.VARIABLES_WEB_API;
    }

    // AS3: VariablesWebApiAddon.as::get inputMode()
    override get inputMode(): number
    {
        return DefaultElement.INPUTS_TYPE_UI_BUILDER;
    }

    // AS3: VariablesWebApiAddon.as::onInit()
    override onInit(roomEvents: HabboUserDefinedRoomEvents): void
    {
        super.onInit(roomEvents);

        roomEvents.communication?.addHabboConnectionMessageEvent(
            new WiredApiKeyResultMessageEvent(this.onWiredApiKeyResultEvent)
        );
    }

    // AS3: VariablesWebApiAddon.as::buildInputs()
    override buildInputs(presetManager: PresetManager, wiredStyle: WiredStyle, builder: WiredUIBuilder): void
    {
        this._usageWarning = presetManager.createUsageWarningSection(this.l('web_api.usage_info'));
        this._readKeySection = presetManager.createApiKeySection(false, this.onClickGeneratedReadKey);
        this._writeKeySection = presetManager.createApiKeySection(true, this.onClickGeneratedWriteKey, this.onWriteKeyChange);

        const textParam = new TextParam(1);

        textParam.textColor = wiredStyle.softTextColor;

        const info: TextPreset = presetManager.createText(this.l('web_api.permissions.bulk_delete.info'), textParam);
        const option = new CheckboxOptionParam(
            this.l('web_api.permissions.bulk_delete'),
            VariablesWebApiAddon.MASS_DELETION_CHECKBOX_ID,
            null,
            info
        );

        this._permissions = presetManager.createCheckboxGroup([option], this.onChangeCheckbox);

        const section: SectionPreset = presetManager.createSection(this.l('web_api.permissions'), this._permissions);

        builder.addElements(this._usageWarning, this._readKeySection, this._writeKeySection, section);
    }

    // AS3: VariablesWebApiAddon.as::onChangeCheckbox()
    private onChangeCheckbox = (id: number, value: boolean): void =>
    {
        if(this._ignoreCheckboxEvents)
        {
            return;
        }

        if(!value || id !== VariablesWebApiAddon.MASS_DELETION_CHECKBOX_ID)
        {
            return;
        }

        const dialog = this.roomEvents.windowManager?.confirm(
            this.l('web_api.permissions.bulk_delete.warning.title'),
            this.l('web_api.permissions.bulk_delete.warning.desc'),
            0,
            (confirmDialog: IDisposable, event: WindowEvent) =>
            {
                confirmDialog.dispose();

                // Anything but OK — the X, the cancel button — puts the checkbox back. The
                // `disposed` test is AS3's and is not paranoia: closing the whole wired dialog
                // disposes the group while the confirm is still up.
                if(event.type !== WindowEvent.WE_OK && this._permissions !== null && !this._permissions.disposed)
                {
                    const option = this._permissions.get(id);

                    if(option !== null) option.selected = false;
                }
            }
        ) ?? null;

        if(dialog !== null) dialog.titleBarColor = VariablesWebApiAddon.WARNING_TITLE_BAR_COLOR;
    };

    // AS3: VariablesWebApiAddon.as::onWriteKeyChange()
    private onWriteKeyChange = (key: string): void =>
    {
        const option = this._permissions?.get(VariablesWebApiAddon.MASS_DELETION_CHECKBOX_ID) ?? null;

        if(option !== null) option.disabled = key.length === 0;
    };

    // AS3: VariablesWebApiAddon.as::onEditStart()
    override onEditStart(def: Triggerable): void
    {
        if(this._readKeySection === null || this._writeKeySection === null) return;

        this._readKeySection.key = def.getString(0);
        this._writeKeySection.key = def.getString(1);

        this._ignoreCheckboxEvents = true;

        const option = this._permissions?.get(VariablesWebApiAddon.MASS_DELETION_CHECKBOX_ID) ?? null;

        if(option !== null) option.selected = def.getBoolean(0);

        this._ignoreCheckboxEvents = false;

        this.onWriteKeyChange(this._writeKeySection.key);
    }

    /** Both keys in one string param, tab-separated — read first, write second. */
    // AS3: VariablesWebApiAddon.as::readStringParamFromForm()
    override readStringParamFromForm(): string
    {
        return (this._readKeySection?.key ?? '') + '\t' + (this._writeKeySection?.key ?? '');
    }

    // AS3: VariablesWebApiAddon.as::readIntParamsFromForm()
    override readIntParamsFromForm(): number[]
    {
        const hasWriteKey = (this._writeKeySection?.key.length ?? 0) > 0;
        const permitted = this._permissions?.get(VariablesWebApiAddon.MASS_DELETION_CHECKBOX_ID)?.selected === true;

        return [hasWriteKey && permitted ? 1 : 0];
    }

    // AS3: VariablesWebApiAddon.as::get currentWiredId()
    private get currentWiredId(): number
    {
        return this.roomEvents.wiredCtrl.getCurrentWiredId();
    }

    // AS3: VariablesWebApiAddon.as::onClickGeneratedReadKey()
    onClickGeneratedReadKey = (): void =>
    {
        this.roomEvents.send(new GenerateWiredApiKeyMessageComposer(this.currentWiredId, true));
    };

    // AS3: VariablesWebApiAddon.as::onClickGeneratedWriteKey()
    onClickGeneratedWriteKey = (): void =>
    {
        this.roomEvents.send(new GenerateWiredApiKeyMessageComposer(this.currentWiredId, false));
    };

    /**
	 * The reply carries the furni it belongs to, and it is dropped unless that is still the one on
	 * screen — the dialog can have moved on to another furni while the request was in flight.
	 */
    // AS3: VariablesWebApiAddon.as::onWiredApiKeyResultEvent()
    private onWiredApiKeyResultEvent = (event: IMessageEvent): void =>
    {
        const parser = event.parser as WiredApiKeyResultParser | null;

        if(parser === null || parser.wiredId !== this.currentWiredId)
        {
            return;
        }

        if(parser.isReadKey)
        {
            if(this._readKeySection !== null) this._readKeySection.key = parser.key;
        }
        else if(this._writeKeySection !== null)
        {
            this._writeKeySection.key = parser.key;
        }
    };

    /** Four sections wide — the same reason the Variable FX add-ons ask for 1.45. */
    // AS3: VariablesWebApiAddon.as::get widthModifier()
    override get widthModifier(): number
    {
        return 1.4;
    }
}
