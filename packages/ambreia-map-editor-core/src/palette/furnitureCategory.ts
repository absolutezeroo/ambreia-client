import type {CatalogCategory} from './CatalogCategory';

// First match wins: a "rare_dragonlamp" is a rare before it is a light.
const RULES: readonly [CatalogCategory, RegExp][] = [
    ['rares', /(^|_)rare(_|$)|^rare/],
    ['seats', /chair|sofa|seat|stool|bench|throne|armchair|couch|bed|pillow|pouf/],
    ['tables', /table|desk|counter|bar_/],
    ['plants', /plant|tree|flower|bush|cactus|hedge|palm|grass|rose/],
    ['lights', /lamp|light|torch|lantern|candle|chandelier|neon/],
    ['floors', /floor|tile|carpet|rug|mat(_|$)|doormat|step/],
    ['decor', /shelf|shelves|poster|statue|fountain|vase|deco|pillar|column|fence|wall|screen|divider|cabinet|bookcase|fireplace|clock|mirror|painting/]
];

/** The catalogue category of a furniture, read from its class name. */
export function furnitureCategory(className: string): CatalogCategory
{
    const name = className.toLowerCase();

    return RULES.find(([, rule]) => rule.test(name))?.[0] ?? 'misc';
}
