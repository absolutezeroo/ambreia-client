/**
 * The six body parts the avatar's geometry addresses by name.
 *
 * Four of the six constants are `_SafeStr_N` in the primary tree and appear in no other tree, so
 * their **names are derived from their values** — `leftitem`, `rightitem`, `leftarm`, `rightarm`
 * spell themselves. `TORSO` and `HEAD` survive the obfuscator intact.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/AvatarBodyPartType.as
 */
export class AvatarBodyPartType
{
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarBodyPartType.as::TORSO
    public static readonly TORSO: string = 'torso';

    // Name DERIVED from the value (`_SafeStr_11353`).
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarBodyPartType.as::_SafeStr_11353
    public static readonly LEFT_ITEM: string = 'leftitem';

    // Name DERIVED from the value (`_SafeStr_11261`).
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarBodyPartType.as::_SafeStr_11261
    public static readonly RIGHT_ITEM: string = 'rightitem';

    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarBodyPartType.as::HEAD
    public static readonly HEAD: string = 'head';

    // Name DERIVED from the value (`_SafeStr_11160`).
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarBodyPartType.as::_SafeStr_11160
    public static readonly LEFT_ARM: string = 'leftarm';

    // Name DERIVED from the value (`_SafeStr_11111`).
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarBodyPartType.as::_SafeStr_11111
    public static readonly RIGHT_ARM: string = 'rightarm';
}
