import type {IWindowLocalization} from '@ambreia/ui/IWindowLocalization';
import type {ILocalizable} from '@ambreia/ui/ILocalizable';

/**
 * GlazeLocalizationStub — the localisation the window manager reads `${key}` texts from.
 *
 * The real `HabboLocalizationManager` drags in the configuration + communication managers (and
 * therefore the external_variables / game-data download pipeline), none of which a window-layout
 * editor needs. Without texts it answers nothing, which leaves every `${key}` caption raw —
 * precisely how Glaze displays untranslated captions. "Localise" in the toolbar hands it the
 * real texts (`setTexts()`), and it then serves them the way the manager does: a `text` element
 * registers a listener for its key and is pushed the value at once and on every later change.
 */
export class GlazeLocalizationStub implements IWindowLocalization
{
    private static _texts: Map<string, string> | null = null;
    private static readonly LISTENERS = new Map<string, Set<ILocalizable>>();

    /** Installs the texts "Localise" loaded (null reverts to raw keys) and pushes them to every listener. */
    public static setTexts(texts: Map<string, string> | null): void
    {
        GlazeLocalizationStub._texts = texts;

        for(const [key, listeners] of GlazeLocalizationStub.LISTENERS)
        {
            const value = texts?.get(key) ?? `\${${key}}`;

            for(const listener of listeners) listener.localization = value;
        }
    }

    /**
     * Null is "no text yet", which is what leaves `${...}` in the caption for Glaze to show raw.
     * `WindowParser.localizationResolver` is wired to this as soon as the manager gets it.
     */
    public getResolvedLocalization(key: string): string | null
    {
        return GlazeLocalizationStub._texts?.get(key) ?? null;
    }

    public registerLocalizationListener(key: string, listener: ILocalizable): void
    {
        let listeners = GlazeLocalizationStub.LISTENERS.get(key);

        if(!listeners)
        {
            listeners = new Set();
            GlazeLocalizationStub.LISTENERS.set(key, listeners);
        }

        listeners.add(listener);

        const value = GlazeLocalizationStub._texts?.get(key);

        if(value !== undefined) listener.localization = value;
    }

    public removeLocalizationListener(key: string, listener: ILocalizable): void
    {
        GlazeLocalizationStub.LISTENERS.get(key)?.delete(listener);
    }
}
