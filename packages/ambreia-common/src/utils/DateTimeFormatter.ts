/**
 * DateTimeFormatter — minimal port of flash.globalization.DateTimeFormatter covering the pattern-based
 * formatting the wired system needs. The Flash class is locale-aware; this shim ignores the locale (the
 * only caller uses "en-US" with a fixed numeric pattern) and formats from the pattern's tokens in local
 * time (matching Flash's default and the round-trip against Date.parse the caller relies on).
 *
 * Supported tokens: yyyy (4-digit year), MM (2-digit month), dd (2-digit day), HH (2-digit 24h hour),
 * mm (2-digit minute), ss (2-digit second). Any other characters are emitted literally. Tokens are
 * case-sensitive (MM = month, mm = minute), so a single left-to-right pass has no collisions.
 *
 * AS3 (Flash SDK): flash.globalization.DateTimeFormatter — used by the wired DATE_RANGE_ACTIVE condition.
 */
export class DateTimeFormatter
{
    // AS3: the active dateTimePattern (Flash defaults to a locale pattern; the wired caller always sets it).
    private _pattern: string = 'yyyy/MM/dd HH:mm';

    // AS3: new DateTimeFormatter(requestedLocaleIDName) — locale is accepted but unused (numeric pattern only).
    constructor(_locale: string)
    {
    }

    // AS3: DateTimeFormatter.setDateTimePattern()
    setDateTimePattern(pattern: string): void
    {
        this._pattern = pattern;
    }

    // AS3: DateTimeFormatter.format()
    format(date: Date): string
    {
        const pad = (value: number, length: number): string => value.toString().padStart(length, '0');

        return this._pattern
            .replace(/yyyy/g, pad(date.getFullYear(), 4))
            .replace(/MM/g, pad(date.getMonth() + 1, 2))
            .replace(/dd/g, pad(date.getDate(), 2))
            .replace(/HH/g, pad(date.getHours(), 2))
            .replace(/mm/g, pad(date.getMinutes(), 2))
            .replace(/ss/g, pad(date.getSeconds(), 2));
    }
}
