/**
 * Which catalog a page belongs to.
 *
 * AS3 also has `BUILDER` (`"BUILDERS_CLUB"`), the Builders Club catalog; the RPG fork removed it.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/enum/CatalogType.as
 */
export const CatalogType = {
    // AS3: CatalogType.as::NORMAL
    NORMAL: 'NORMAL',
} as const;

export type CatalogTypeValue = typeof CatalogType[keyof typeof CatalogType];
