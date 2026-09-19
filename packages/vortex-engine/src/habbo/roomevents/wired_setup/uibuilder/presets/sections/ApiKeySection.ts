import {Logger} from '@core/utils/Logger';
import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';

import type {PresetManager} from '../../PresetManager';
import type {WiredStyle} from '../../styles/WiredStyle';
import {TextAreaParam} from '../../params/TextAreaParam';
import type {ButtonPreset} from '../ButtonPreset';
import type {ButtonRowPreset} from '../ButtonRowPreset';
import type {SimpleListViewPreset} from '../SimpleListViewPreset';
import type {TextAreaPreset} from '../TextAreaPreset';
import {AbstractSectionPreset} from './AbstractSectionPreset';

const log = Logger.getLogger('habbo.roomevents.wired_setup.uibuilder.ApiKeySection');

/**
 * ApiKeySection — one API key (read or write) with its three buttons and a read-only text area.
 *
 * The generate button is the only one wired outwards: it hands the click straight to the owner,
 * which sends the request and later writes the answer back through `set key`. Clear and copy are
 * local, and both are disabled while the key is empty — which is also how the generate button
 * knows to call itself "regenerate".
 *
 * The port keeps the AIR tree's own directory name in its path — `applications/` there, flattened
 * into `sections/` here alongside the three other sections that moved the same way.
 *
 * AS3: sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/uibuilder/presets/sections/applications/ApiKeySection.as
 */
export class ApiKeySection extends AbstractSectionPreset
{
    // AS3: ApiKeySection.as::_onGenerateKey (name derived: the AIR field is obfuscated)
    private _onGenerateKey: (() => void) | null;

    // AS3: ApiKeySection.as::_onKeyChange (name derived: the AIR field is obfuscated)
    private _onKeyChange: ((key: string) => void) | null;

    // AS3: ApiKeySection.as::_listView (name derived)
    private _listView: SimpleListViewPreset | null;

    // AS3: ApiKeySection.as::_buttonRow (name derived)
    private _buttonRow: ButtonRowPreset | null;

    // AS3: ApiKeySection.as::_generateButton (name derived)
    private _generateButton: ButtonPreset | null;

    // AS3: ApiKeySection.as::_clearButton (name derived)
    private _clearButton: ButtonPreset | null;

    // AS3: ApiKeySection.as::_copyButton (name derived)
    private _copyButton: ButtonPreset | null;

    // AS3: ApiKeySection.as::_key
    private _key: TextAreaPreset | null;

    // AS3: ApiKeySection.as::ApiKeySection()
    constructor(
        roomEvents: HabboUserDefinedRoomEvents,
        presetManager: PresetManager,
        wiredStyle: WiredStyle,
        writeKey: boolean,
        onGenerateKey: (() => void) | null,
        onKeyChange: ((key: string) => void) | null = null
    )
    {
        super(roomEvents, presetManager, wiredStyle);

        this._onGenerateKey = onGenerateKey;
        this._onKeyChange = onKeyChange;
        this._generateButton = presetManager.createButton(this.l('web_api.generate'), onGenerateKey);
        this._clearButton = presetManager.createButton(this.l('web_api.clear'), this.onClearKey);
        this._copyButton = presetManager.createButton(this.l('web_api.copy'), this.onCopyKey);
        this._buttonRow = presetManager.createButtonRow([this._generateButton, this._clearButton, this._copyButton]);

        // Not editable and word-wrapped: the key is shown, never typed. The `-1` in
        // maxCharacters is AS3's own — the field is read-only, so no limit applies.
        const keyParam = new TextAreaParam(30, -1, -1, -1, -1, '', null, null, false, true);

        this._key = presetManager.createTextArea(keyParam);
        this._listView = presetManager.createSimpleListView(true, [this._buttonRow, this._key]);

        this.initializeSection(writeKey ? this.l('web_api.write.title') : this.l('web_api.read.title'), this._listView);
    }

    // AS3: ApiKeySection.as::onClearKey()
    private onClearKey = (): void =>
    {
        if(this._key === null) return;

        this._key.text = '';
        this.onKeyTextChanged();
    };

    // DEVIATION: AS3 writes `Clipboard.generalClipboard.setData("air:text", …)`, an AIR API with
    //   no browser counterpart and no failure mode. `navigator.clipboard.writeText()` is the
    //   equivalent and CAN be refused (no user gesture, no permission, insecure origin), so the
    //   rejection is caught and logged. The notification is posted either way, exactly as AS3
    //   posts it unconditionally — a refusal is rare enough that lying about it is better than
    //   teaching the button to sometimes say nothing.
    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/uibuilder/presets/sections/applications/ApiKeySection.as::onCopyKey()
    private onCopyKey = (): void =>
    {
        const key = this._key?.text ?? '';

        void navigator.clipboard?.writeText(key).catch(() =>
        {
            log.warn('Clipboard write refused — the API key was not copied');
        });

        this._roomEvents.notifications.addItem('${notification.wired.copied_api_key}', 'wired');
    };

    // AS3: ApiKeySection.as::set key()
    set key(value: string)
    {
        if(this._key === null) return;

        this._key.text = value;
        this.onKeyTextChanged();
    }

    // AS3: ApiKeySection.as::get key()
    get key(): string
    {
        return this._key?.text ?? '';
    }

    // AS3: ApiKeySection.as::onKeyTextChanged()
    private onKeyTextChanged(): void
    {
        const hasKey = (this._key?.text.length ?? 0) > 0;

        if(this._generateButton !== null)
        {
            this._generateButton.buttonText = hasKey ? this.l('web_api.regenerate') : this.l('web_api.generate');
        }

        if(this._clearButton !== null) this._clearButton.disabled = !hasKey;
        if(this._copyButton !== null) this._copyButton.disabled = !hasKey;

        if(this._onKeyChange !== null)
        {
            this._onKeyChange(this._key?.text ?? '');
        }
    }

    /**
	 * AS3 drops six of the eight fields and skips `_copyButton` and `_onKeyChange`; both are
	 * nulled here. Nothing reads either after dispose in either tree, so this is tidying, not a
	 * behaviour change.
	 */
    // AS3: ApiKeySection.as::dispose()
    override dispose(): void
    {
        if(this.disposed)
        {
            return;
        }

        super.dispose();

        this._onGenerateKey = null;
        this._onKeyChange = null;
        this._listView = null;
        this._buttonRow = null;
        this._generateButton = null;
        this._clearButton = null;
        this._copyButton = null;
        this._key = null;
    }
}
