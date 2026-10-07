/**
 * What a usable furni does when you click it. Class name DERIVED — obfuscated in every tree, named from its members.
 *
 * **Nothing in any source tree reads this class** — its values are written as literals wherever
 * they are needed, in AS3 and here alike. Transcribed because it is the only place these names are
 * recorded, not because anything dispatches on it.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/enums/_SafeCls_3141.as
 */
export const FurniUsableTypeEnum = {
    // AS3: _SafeCls_3141.as::DUMMY
    DUMMY: "DUMMY",

    // AS3: _SafeCls_3141.as::FRIEND_FURNITURE
    FRIEND_FURNITURE: "FRIEND_FURNITURE",

    // AS3: _SafeCls_3141.as::MONSTERPLANT_SEED
    MONSTERPLANT_SEED: "MONSTERPLANT_SEED",

    // AS3: _SafeCls_3141.as::MYSTERY_BOX
    MYSTERY_BOX: "MYSTERY_BOX",

    // AS3: _SafeCls_3141.as::EFFECT_BOX
    EFFECT_BOX: "EFFECT_BOX",

    // AS3: _SafeCls_3141.as::MYSTERY_TROPHY
    MYSTERY_TROPHY: "MYSTERY_TROPHY",

    // AS3: _SafeCls_3141.as::RANDOM_TELEPORT
    RANDOM_TELEPORT: "RANDOM_TELEPORT",

    // AS3: _SafeCls_3141.as::PURCHASABLE_CLOTHING
    PURCHASABLE_CLOTHING: "PURCHASABLE_CLOTHING",

    // AS3: _SafeCls_3141.as::GENERIC_USABLE
    GENERIC_USABLE: "GENERIC_USABLE",
} as const;

export type FurniUsableTypeEnum = typeof FurniUsableTypeEnum[keyof typeof FurniUsableTypeEnum];
