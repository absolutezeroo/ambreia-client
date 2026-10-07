import type {ILocalizable} from '@ambreia/ui/ILocalizable';
import type {IWindowLocalization} from '@ambreia/ui/IWindowLocalization';

/**
 * The editor's texts: the owner's `mapeditor.<lang>.txt` override files (key=value, `#` comments,
 * `\n` for a newline, `%name%` placeholders), read the way build-gamedata-locale.mjs reads them.
 * Every `${key}` caption of the vortex_map_editor_* layouts resolves through it.
 */
export class EditorTexts implements IWindowLocalization
{
    private readonly _texts = new Map<string, string>();

    constructor(...sources: readonly string[])
    {
        for(const source of sources)
        {
            for(const line of source.split(/\r\n|\n|\r/))
            {
                if(line.startsWith('#')) continue;

                const i = line.indexOf('=');

                if(i <= 0) continue;

                const value = line.slice(i + 1).trim().replace(/\\n/g, '\n');

                if(value) this._texts.set(line.slice(0, i).trim(), value);
            }
        }
    }

    /** The text of key with its %name% placeholders filled, or the key itself when unknown. */
    get(key: string, params: Readonly<Record<string, string | number>> = {}): string
    {
        const text = this._texts.get(key);

        return text === undefined ? key : text.replace(/%(\w+)%/g, (_, name: string) => String(params[name] ?? ''));
    }

    has(key: string): boolean
    {
        return this._texts.has(key);
    }

    getResolvedLocalization(key: string): string | null
    {
        return this._texts.get(key) ?? null;
    }

    // Text windows take their text from this call, not from getResolvedLocalization: answer at once.
    // The texts never change while the editor runs, so nothing is kept to push later.
    registerLocalizationListener(key: string, target: ILocalizable): void
    {
        const text = this._texts.get(key);

        if(text !== undefined) target.localization = text;
    }

    removeLocalizationListener(_key: string, _target: ILocalizable): void
    {
    }
}
