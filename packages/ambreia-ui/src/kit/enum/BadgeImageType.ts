/**
 * The three badge sources a `badge_image` widget can draw from.
 *
 * Derived name: the class is obfuscated in every tree on disk — `_SafeCls_3232` in the
 * primary one, `_Str_4387` in the otherwise unobfuscated 2016 tree, `class_2522` in
 * `win63_version` — so `BadgeImageType` is this port's name, taken from the constants it
 * declares and from the `badge_image:type` property it is the range of. The three values
 * and `ALL` are verbatim.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/_SafeCls_3232.as
 */
export class BadgeImageType
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/_SafeCls_3232.as::NORMAL
    public static readonly NORMAL: string = 'normal';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/_SafeCls_3232.as::GROUP
    public static readonly GROUP: string = 'group';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/_SafeCls_3232.as::PERK
    public static readonly PERK: string = 'perk';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/_SafeCls_3232.as::ALL
    public static readonly ALL: string[] = [
        BadgeImageType.NORMAL,
        BadgeImageType.GROUP,
        BadgeImageType.PERK
    ];
}
