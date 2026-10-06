/**
 * The one-letter product type a catalog offer carries on the wire, plus the few that spell
 * themselves out.
 *
 * **Class name RECOVERED** from `sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/
 * catalog/enum/ProductTypeEnum.as`; the 2026 tree obfuscates it to `_SafeCls_1784` and keeps the
 * members readable.
 *
 * Nothing in the 2026 tree references the class — every site writes the literal (`"s"`, `"e"`, …),
 * and so does this port. It is ported so those literals have somewhere to point.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/enum/_SafeCls_1784.as
 */
export const ProductTypeEnum = {
    // AS3: _SafeCls_1784.as::PRODUCT_TYPE_ITEM
    PRODUCT_TYPE_ITEM: 'i',

    // AS3: _SafeCls_1784.as::PRODUCT_TYPE_STUFF
    PRODUCT_TYPE_STUFF: 's',

    // AS3: _SafeCls_1784.as::PRODUCT_TYPE_EFFECT
    PRODUCT_TYPE_EFFECT: 'e',

    // AS3: _SafeCls_1784.as::PRODUCT_TYPE_CLUB
    PRODUCT_TYPE_CLUB: 'h',

    // AS3: _SafeCls_1784.as::PRODUCT_TYPE_BADGE
    PRODUCT_TYPE_BADGE: 'b',

    // AS3: _SafeCls_1784.as::PRODUCT_TYPE_GAME_TOKEN
    PRODUCT_TYPE_GAME_TOKEN: 'GAME_TOKEN',

    // AS3: _SafeCls_1784.as::PRODUCT_TYPE_MINT_TOKEN
    PRODUCT_TYPE_MINT_TOKEN: 'MINT_TOKEN',

    // AS3: _SafeCls_1784.as::PRODUCT_TYPE_PET
    PRODUCT_TYPE_PET: 'p',

    // AS3: _SafeCls_1784.as::PRODUCT_TYPE_RENTABLE_BOT
    PRODUCT_TYPE_RENTABLE_BOT: 'r',

    // AS3: _SafeCls_1784.as::PRODUCT_TYPE_NFT
    PRODUCT_TYPE_NFT: 'n',

    // AS3: _SafeCls_1784.as::PRODUCT_TYPE_CHAT_STYLE
    PRODUCT_TYPE_CHAT_STYLE: 'chat_style',
} as const;

export type ProductTypeEnumValue = typeof ProductTypeEnum[keyof typeof ProductTypeEnum];
