import type {IHabboLocalizationManager} from '../localization/IHabboLocalizationManager';

/**
 * Turns a number of seconds into the localized "3 days" / "5 minutes" strings the client shows.
 *
 * Every branch resolves a `friendlytime.*` key with an `amount` parameter — the numbers are
 * substituted by localization, not concatenated, because word order differs per language. The
 * `suffix` is appended to the *key*, not to the text: `getFriendlyTime(loc, s, '.ago')` looks up
 * `friendlytime.days.ago`.
 *
 * This file used to hardcode English ("5 days", "just now") and take no localization manager,
 * which is why several call sites carried notes about it. It now matches AS3.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/FriendlyTime.as
 */
export class FriendlyTime
{
    // AS3: .../habbo/utils/FriendlyTime.as::_SafeStr_10685
    public static readonly MINUTE: number = 60;

    // AS3: .../habbo/utils/FriendlyTime.as::_SafeStr_11707
    public static readonly HOUR: number = 3600;

    // AS3: .../habbo/utils/FriendlyTime.as::_SafeStr_11671
    public static readonly DAY: number = 86400;

    /**
     * AS3: .../habbo/utils/FriendlyTime.as::_SafeStr_11493
     *
     * Declared in AS3 and used by no branch of either formatter — kept so the member list matches.
     */
    public static readonly WEEK: number = 604800;

    // AS3: .../habbo/utils/FriendlyTime.as::MONTH_IN_SECONDS
    public static readonly MONTH: number = 2592000;

    // AS3: .../habbo/utils/FriendlyTime.as::YEAR_IN_SECONDS
    public static readonly YEAR: number = 31536000;

    /**
     * AS3: .../habbo/utils/FriendlyTime.as::getFriendlyTime()
     *
     * Falls through to seconds — AS3 has no "just now" case.
     */
    // AS3: .../src/com/sulake/habbo/utils/FriendlyTime.as::getFriendlyTime()
    static getFriendlyTime(
        localization: IHabboLocalizationManager | null,
        seconds: number,
        suffix: string = '',
        threshold: number = 3
    ): string
    {
        if(seconds > threshold * FriendlyTime.YEAR)
        {
            return FriendlyTime.getLocalization(localization, 'friendlytime.years' + suffix, Math.round(seconds / FriendlyTime.YEAR));
        }

        if(seconds > threshold * FriendlyTime.MONTH)
        {
            return FriendlyTime.getLocalization(localization, 'friendlytime.months' + suffix, Math.round(seconds / FriendlyTime.MONTH));
        }

        if(seconds > threshold * FriendlyTime.DAY)
        {
            return FriendlyTime.getLocalization(localization, 'friendlytime.days' + suffix, Math.round(seconds / FriendlyTime.DAY));
        }

        if(seconds > threshold * FriendlyTime.HOUR)
        {
            return FriendlyTime.getLocalization(localization, 'friendlytime.hours' + suffix, Math.round(seconds / FriendlyTime.HOUR));
        }

        if(seconds > threshold * FriendlyTime.MINUTE)
        {
            return FriendlyTime.getLocalization(localization, 'friendlytime.minutes' + suffix, Math.round(seconds / FriendlyTime.MINUTE));
        }

        return FriendlyTime.getLocalization(localization, 'friendlytime.seconds' + suffix, Math.round(seconds));
    }

    /**
     * AS3: .../habbo/utils/FriendlyTime.as::getShortFriendlyTime()
     *
     * The same ladder against `friendlytime.<unit>.short<suffix>` keys — note `.short` sits before
     * the suffix, so `('.ago')` here means `friendlytime.days.short.ago`.
     */
    // AS3: .../src/com/sulake/habbo/utils/FriendlyTime.as::getShortFriendlyTime()
    static getShortFriendlyTime(
        localization: IHabboLocalizationManager | null,
        seconds: number,
        suffix: string = '',
        threshold: number = 3
    ): string
    {
        if(seconds > threshold * FriendlyTime.YEAR)
        {
            return FriendlyTime.getLocalization(localization, 'friendlytime.years.short' + suffix, Math.round(seconds / FriendlyTime.YEAR));
        }

        if(seconds > threshold * FriendlyTime.MONTH)
        {
            return FriendlyTime.getLocalization(localization, 'friendlytime.months.short' + suffix, Math.round(seconds / FriendlyTime.MONTH));
        }

        if(seconds > threshold * FriendlyTime.DAY)
        {
            return FriendlyTime.getLocalization(localization, 'friendlytime.days.short' + suffix, Math.round(seconds / FriendlyTime.DAY));
        }

        if(seconds > threshold * FriendlyTime.HOUR)
        {
            return FriendlyTime.getLocalization(localization, 'friendlytime.hours.short' + suffix, Math.round(seconds / FriendlyTime.HOUR));
        }

        if(seconds > threshold * FriendlyTime.MINUTE)
        {
            return FriendlyTime.getLocalization(localization, 'friendlytime.minutes.short' + suffix, Math.round(seconds / FriendlyTime.MINUTE));
        }

        return FriendlyTime.getLocalization(localization, 'friendlytime.seconds.short' + suffix, Math.round(seconds));
    }

    /**
     * AS3: .../habbo/utils/FriendlyTime.as::getLocalization()
     *
     * The key doubles as its own default, so a missing entry shows the key rather than an empty
     * string. Returning the key when there is no manager at all keeps that behaviour.
     */
    // AS3: .../src/com/sulake/habbo/utils/FriendlyTime.as::getLocalization()
    static getLocalization(localization: IHabboLocalizationManager | null, key: string, amount: number): string
    {
        if(!localization)
        {
            return key;
        }

        return localization.getLocalizationWithParams(key, key, 'amount', amount.toString());
    }
}
