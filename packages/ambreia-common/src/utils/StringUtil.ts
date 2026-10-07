/**
 * String utility functions.
 *
 * Provides static helper methods for common string operations
 * such as padding, trimming, validation, and sanitization.
 *
 * @see source_as_win63/habbo/utils/StringUtil.as
 */
export class StringUtil
{
    /**
	 * Lookup table behind {@link makeMagicString}. Ported verbatim, including the six empty slots
	 * and the duplicated characters — callers index it by `value - base`, so any change to the
	 * contents or the length changes every string built from it.
	 */
    // AS3: .../src/com/sulake/habbo/utils/StringUtil.as::characters
    private static readonly CHARACTERS: string[] = [
        'p', 'e', ',', 'i', '"', 'r', '', 'm', 'o', '}',
        'n', 'g', '', '{', 'x', 'l', ':', 'q', 'a', 'c',
        ':', 's', 'o', ' ', '(', '', 'p', 't', 'i', 'v',
        'h', 'f', '', ' ', 'c', 'd', '', 'k', ')', 's',
        'z', '', 'y', 'w', 'b', '-', 't', 'j', '', 'u',
        ':', '.', ' ', 'a', '"', '"', 'e', 'm', ' ', ','
    ];

    /**
	 * Build a string from an offset plus a list of table indices — the obfuscation the Flash client
	 * uses so the room-render JSON's key names never appear as literals in the SWF.
	 *
	 * Kept as the real mechanism rather than folded into the strings it produces: the caller reads
	 * as it does in AS3, and a wrong index shows up as a wrong string instead of silently matching
	 * a hand-decoded constant.
	 *
	 * @param base The offset subtracted from every value
	 * @param values Table indices, each offset by `base`
	 * @returns The assembled string
	 */
    // AS3: .../src/com/sulake/habbo/utils/StringUtil.as::makeMagicString()
    static makeMagicString(base: number, ...values: number[]): string
    {
        let result: string = '';

        for(const value of values)
        {
            result += StringUtil.CHARACTERS[value - base];
        }

        return result;
    }

    /**
	 * Pad a string with leading zeros to reach a target length.
	 *
	 * @param str The string to pad
	 * @param length The desired minimum length
	 * @returns The padded string
	 */
    // AS3: .../src/com/sulake/habbo/utils/StringUtil.as::addLeftZeroPadding()
    static addLeftZeroPadding(str: string, length: number): string
    {
        while(str.length < length)
        {
            str = '0' + str;
        }

        return str;
    }

    /**
	 * Remove all font HTML tags from a string.
	 *
	 * @param str The string to strip font tags from
	 * @returns The string with font tags removed
	 */
    // AS3: .../src/com/sulake/habbo/utils/StringUtil.as::stripFontTag()
    static stripFontTag(str: string): string
    {
        return str.replace(/<\/?font[^>]*>/gi, '');
    }

    /**
	 * Trim whitespace from both ends of a string.
	 *
	 * @param str The string to trim
	 * @returns The trimmed string, or empty string if null/undefined
	 */
    // AS3: .../src/com/sulake/habbo/utils/StringUtil.as::trim()
    static trim(str: string): string
    {
        return str ? str.trim() : '';
    }

    /**
	 * Remove all whitespace characters from a string.
	 *
	 * @param str The string to process
	 * @returns The string with all spaces removed
	 */
    // AS3: .../src/com/sulake/habbo/utils/StringUtil.as::removeWhiteSpace()
    static removeWhiteSpace(str: string): string
    {
        return str ? str.replace(/ /g, '') : '';
    }

    /**
	 * Convert a string to lowercase alphanumeric characters only.
	 *
	 * @param str The string to convert
	 * @returns The alphanumeric lowercase string
	 */
    // AS3: .../src/com/sulake/habbo/utils/StringUtil.as::toAlphaNumericLow()
    static toAlphaNumericLow(str: string): string
    {
        return str.toLowerCase().replace(/\W/g, '');
    }

    /**
	 * Return the string or an empty string if null/undefined.
	 *
	 * @param str The string to check
	 * @returns The string, or empty string if null/undefined
	 */
    // AS3: .../src/com/sulake/habbo/utils/StringUtil.as::nonNull()
    static nonNull(str: string | null): string
    {
        return str ?? '';
    }

    /**
	 * Check if a string is empty (null, undefined, or zero length).
	 *
	 * @param str The string to check
	 * @returns True if the string is empty
	 */
    // AS3: .../src/com/sulake/habbo/utils/StringUtil.as::isEmpty()
    static isEmpty(str: string | null): boolean
    {
        return str === null || str.length === 0;
    }

    /**
	 * Check if a string is blank (null, undefined, or only whitespace).
	 *
	 * @param str The string to check
	 * @returns True if the string is blank
	 */
    // AS3: .../src/com/sulake/habbo/utils/StringUtil.as::isBlank()
    static isBlank(str: string | null): boolean
    {
        if(str === null)
        {
            return true;
        }

        return StringUtil.trim(str).length === 0;
    }
}
