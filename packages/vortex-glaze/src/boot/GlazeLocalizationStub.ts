import type {IWindowLocalization} from '@ambreia/ui/IWindowLocalization';
import type {ILocalizable} from '@ambreia/ui/ILocalizable';

/**
 * GlazeLocalizationStub — the localisation the window manager reads `${key}` texts from.
 *
 * The real `HabboLocalizationManager` drags in the configuration + communication managers (and
 * therefore the external_variables / game-data download pipeline), none of which a window-layout
 * editor needs. It answers nothing, which leaves every `${key}` caption raw — precisely how Glaze
 * displays untranslated captions ("Localise" in the toolbar swaps the real texts in).
 */
export class GlazeLocalizationStub implements IWindowLocalization
{
    /**
     * Null is "no text yet", which is what leaves `${...}` in the caption for Glaze to show raw.
     * `WindowParser.localizationResolver` is wired to this as soon as the manager gets it.
     */
    public getResolvedLocalization(_key: string): string | null
    {
        return null;
    }

    public registerLocalizationListener(_key: string, _listener: ILocalizable): void
    {
    }

    public removeLocalizationListener(_key: string, _listener: ILocalizable): void
    {
    }
}
