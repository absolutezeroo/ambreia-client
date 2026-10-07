/**
 * Session data preferences event
 *
 * @see source_as_win63/habbo/session/events/SessionDataPreferencesEvent.as
 */
export class SessionDataPreferencesEvent
{
    public static readonly PREFERENCES_UPDATED = 'APUE_UPDATED';

    constructor(uiFlags: number)
    {
        this._uiFlags = uiFlags;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/SessionDataPreferencesEvent.as::_uiFlags
    private _uiFlags: number;

    // AS3: .../src/com/sulake/habbo/session/events/SessionDataPreferencesEvent.as::get uiFlags()
    get uiFlags(): number
    {
        return this._uiFlags;
    }
}
