import type {ILocalizable} from './ILocalizable';
import type {ILocalization} from './ILocalization';
import type {ICoreLocalizationManager} from './ICoreLocalizationManager';

interface IParameterData
{
    id: string;
    // AS3: .../src/com/sulake/core/localization/Localization.as::get value()
    value: string;
}

/**
 * Localization entry that holds a single localized string
 *
 * Based on AS3 com.sulake.core.localization.Localization
 */
export class Localization implements ILocalization
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/localization/Localization.as::_manager
    private readonly _manager: ICoreLocalizationManager;
    // AS3: .../src/com/sulake/core/localization/Localization.as::_key
    private readonly _key: string;
    // AS3: .../src/com/sulake/core/localization/Localization.as::_parameters
    private _parameters: Map<string, IParameterData> | null = null;
    // AS3: .../src/com/sulake/core/localization/Localization.as::_listeners
    private _listeners: Set<ILocalizable> | null = null;

    constructor(
        manager: ICoreLocalizationManager,
        key: string,
        value: string | null = null,
        placeholder: boolean = false
    )
    {
        this._manager = manager;
        this._key = key;
        this._value = value;
        this._placeholder = placeholder;
    }

    /**
	 * True while the only value this entry has is its own key.
	 *
	 * `registerListener()` creates such an entry so a listener has something to receive before the
	 * texts arrive — AS3 does the same (`new Localization(this, param1, param1)`), and it is
	 * harmless there because nothing reads captions back out of the table. This port does: it
	 * resolves `${key}` tokens eagerly when a window is parsed, and a stand-in entry answered that
	 * lookup as a hit — so the *second* window to use a key got the key painted on it, permanently.
	 * The wired chest's Withdraw button was the second one.
	 */
    // TS-only: AS3 has no equivalent, because AS3 never resolves a caption through this table.
    private _placeholder: boolean;

    // TS-only: see `_placeholder`.
    get isPlaceholder(): boolean
    {
        return this._placeholder;
    }

    // AS3: sources/win63_version/core/localization/Localization.as::_value
    private _value: string | null;

    // AS3: .../src/com/sulake/core/localization/Localization.as::get value()
    get value(): string
    {
        return this.fillParameterValues();
    }

    // AS3: .../src/com/sulake/core/localization/Localization.as::get isInitialized()
    get isInitialized(): boolean
    {
        return this._value !== null;
    }

    // AS3: .../src/com/sulake/core/localization/Localization.as::get raw()
    get raw(): string
    {
        return this._value ?? '';
    }

    // AS3: .../src/com/sulake/core/localization/Localization.as::setValue()
    setValue(value: string): void
    {
        this._value = value;
        this._placeholder = false;
        this.updateListeners();
    }

    // AS3: .../src/com/sulake/core/localization/Localization.as::registerListener()
    registerListener(listener: ILocalizable): void
    {
        if(!this._listeners)
        {
            this._listeners = new Set();
        }

        this._listeners.add(listener);

        listener.localization = this._manager.interpolate(this.value);
    }

    // AS3: .../src/com/sulake/core/localization/Localization.as::removeListener()
    removeListener(listener: ILocalizable): void
    {
        if(this._listeners)
        {
            this._listeners.delete(listener);
        }
    }

    // AS3: .../src/com/sulake/core/localization/Localization.as::registerParameter()
    registerParameter(name: string, value: string, id: string = '%'): void
    {
        if(!this._parameters)
        {
            this._parameters = new Map();
        }

        this._parameters.set(name, {
            id: id,
            value: value,
        });

        this.updateListeners();
    }

    // AS3: .../src/com/sulake/core/localization/Localization.as::updateListeners()
    updateListeners(): void
    {
        const interpolatedValue = this._manager.interpolate(this.value);

        if(this._listeners)
        {
            for(const listener of this._listeners)
            {
                listener.localization = interpolatedValue;
            }
        }
    }

    // AS3: .../src/com/sulake/core/localization/Localization.as::fillParameterValues()
    private fillParameterValues(): string
    {
        let result = this._value;

        if(result === null)
        {
            return '';
        }

        // Fill in registered parameters
        if(this._parameters)
        {
            for(const [paramName, paramData] of this._parameters)
            {
                // Simple parameter replacement: %param%
                const pattern = paramData.id + paramName + paramData.id;
                const regex = new RegExp(this.escapeRegex(pattern), 'gim');
                result = result.replace(regex, paramData.value);

                // Check for plural forms: %{param|zero|one|many}
                const lowerResult = result.toLowerCase();
                const pluralPattern = paramData.id + '{' + paramName;

                if(lowerResult.indexOf(pluralPattern) >= 0)
                {
                    let pluralIndex: number;
                    // AS3 uses int(value): a full Number() parse truncated toward zero,
                    // and 0 for a non-numeric or empty value. parseInt() diverges — it
                    // reads only leading digits ("12px" -> 12) and yields NaN for "" or
                    // "abc", which falls through to the default plural form instead of
                    // AS3's zero form.
                    const parsedValue = Number(paramData.value);
                    const numValue = Number.isFinite(parsedValue) ? Math.trunc(parsedValue) : 0;

                    switch(numValue)
                    {
                        case 0:
                            pluralIndex = 1;
                            break;
                        case 1:
                            pluralIndex = 2;
                            break;
                        default:
                            pluralIndex = 3;
                    }

                    // Match %{param|zero|one|many}
                    const pluralRegex = new RegExp(
                        this.escapeRegex(paramData.id) + '\\{' + paramName + '\\|([^|]*)\\|([^|]*)\\|([^}]*)\\}',
                        'gim'
                    );
                    const doubleIdRegex = new RegExp(this.escapeRegex(paramData.id + paramData.id), 'gim');

                    result = result.replace(pluralRegex, '$' + pluralIndex);
                    result = result.replace(doubleIdRegex, paramData.value);
                }
            }
        }

        // Handle %%%key%%% references to sub-localizations
        const subKeyRegex = /%%%([A-Za-z0-9_])+%%%/g;
        const matches = result.match(subKeyRegex);

        if(matches !== null)
        {
            for(let i = matches.length - 1; i >= 0; i--)
            {
                const match = matches[i];
                const subKey = match.substring(3, match.length - 3);
                const fullKey = this._key + '.' + subKey;
                const subValue = this._manager.getLocalization(fullKey, subKey);
                result = result.replace(match, subValue);
            }
        }

        return result;
    }

    private escapeRegex(str: string): string
    {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
