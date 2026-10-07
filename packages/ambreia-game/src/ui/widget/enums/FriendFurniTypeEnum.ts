/**
 * The five friend-furni kinds. Class name DERIVED — obfuscated in every tree, named from LOVE_LOCK/CARVE_A_TREE/FRIENDS_PORTRAIT.
 *
 * **Nothing in any source tree reads this class** — its values are written as literals wherever
 * they are needed, in AS3 and here alike. Transcribed because it is the only place these names are
 * recorded, not because anything dispatches on it.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/enums/_SafeCls_2473.as
 */
export const FriendFurniTypeEnum = {
    // AS3: _SafeCls_2473.as::LOVE_LOCK
    LOVE_LOCK: 0,

    // AS3: _SafeCls_2473.as::CARVE_A_TREE
    CARVE_A_TREE: 1,

    // AS3: _SafeCls_2473.as::FRIENDS_PORTRAIT
    FRIENDS_PORTRAIT: 2,

    /** Derived name — `_SafeStr_11427`; named from its own value, which is all it has. */
    // AS3: _SafeCls_2473.as::_SafeStr_11427
    TYPE_3: 3,

    /** Derived name — `_SafeStr_11716`; named from its own value, which is all it has. */
    // AS3: _SafeCls_2473.as::_SafeStr_11716
    TYPE_4: 4,
} as const;

export type FriendFurniTypeEnum = typeof FriendFurniTypeEnum[keyof typeof FriendFurniTypeEnum];
