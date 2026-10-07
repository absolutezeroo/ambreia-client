/**
 * Avatar figure part type identifiers.
 *
 * @see sources/win63_version/habbo/avatar/enum/AvatarFigurePartType.as
 */
export class AvatarFigurePartType
{
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::BODY
    public static readonly BODY: string = 'bd';
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::SHOES
    public static readonly SHOES: string = 'sh';
    public static readonly LEGS: string = 'lg';
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::CHEST
    public static readonly CHEST: string = 'ch';
    public static readonly WAIST_ACCESSORY: string = 'wa';
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::CHEST_ACCESSORY
    public static readonly CHEST_ACCESSORY: string = 'ca';
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::HEAD
    public static readonly HEAD: string = 'hd';
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::HAIR
    public static readonly HAIR: string = 'hr';
    public static readonly FACE_ACCESSORY: string = 'fa';
    public static readonly EYE_ACCESSORY: string = 'ea';
    public static readonly HEAD_ACCESSORY: string = 'ha';
    public static readonly HEAD_ACCESSORY_EXTRA: string = 'he';
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::COAT_CHEST
    public static readonly COAT_CHEST: string = 'cc';
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::CHEST_PRINT
    public static readonly CHEST_PRINT: string = 'cp';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::MISC
    public static readonly MISC: string = 'mc';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::MISC_RIGHT
    public static readonly MISC_RIGHT: string = 'mcr';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::_SafeStr_11626
    // AS3 name unrecoverable (obfuscated in every tree) - derived from pairing with MISC_RIGHT
    // ("mcr"), matching the LEFT_HAND/RIGHT_HAND, LEFT_SLEEVE/RIGHT_SLEEVE naming pattern used
    // throughout this enum.
    public static readonly MISC_LEFT: string = 'mcl';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::PET
    public static readonly PET: string = 'pt';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::PET_RIGHT
    public static readonly PET_RIGHT: string = 'ptr';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::PET_LEFT
    public static readonly PET_LEFT: string = 'ptl';
    public static readonly LEFT_HAND_ITEM: string = 'li';
    public static readonly LEFT_HAND: string = 'lh';
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::LEFT_SLEEVE
    public static readonly LEFT_SLEEVE: string = 'ls';
    public static readonly RIGHT_HAND: string = 'rh';
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::RIGHT_SLEEVE
    public static readonly RIGHT_SLEEVE: string = 'rs';
    public static readonly FACE: string = 'fc';
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::EYES
    public static readonly EYES: string = 'ey';
    public static readonly HAIR_BIG: string = 'hrb';
    public static readonly RIGHT_HAND_ITEM: string = 'ri';
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::LEFT_COAT_SLEEVE
    public static readonly LEFT_COAT_SLEEVE: string = 'lc';
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::RIGHT_COAT_SLEEVE
    public static readonly RIGHT_COAT_SLEEVE: string = 'rc';

    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarFigurePartType.as::FIGURE_SETS
    public static readonly FIGURE_SETS: string[] = [
        AvatarFigurePartType.SHOES,
        AvatarFigurePartType.LEGS,
        AvatarFigurePartType.CHEST,
        AvatarFigurePartType.WAIST_ACCESSORY,
        AvatarFigurePartType.CHEST_ACCESSORY,
        AvatarFigurePartType.HEAD,
        AvatarFigurePartType.HAIR,
        AvatarFigurePartType.FACE_ACCESSORY,
        AvatarFigurePartType.EYE_ACCESSORY,
        AvatarFigurePartType.HEAD_ACCESSORY,
        AvatarFigurePartType.HEAD_ACCESSORY_EXTRA,
        AvatarFigurePartType.COAT_CHEST,
        AvatarFigurePartType.CHEST_PRINT,
        AvatarFigurePartType.PET,
        AvatarFigurePartType.MISC
    ];
}
