import type {CatalogCategory} from '@ambreia/map-editor-core/palette/CatalogCategory';

/** The catalogue's category menu, as (value, label). */
export const CATALOG_CATEGORIES: readonly (readonly [CatalogCategory | 'all', string])[] = [
    ['all', 'Toutes les catégories'],
    ['seats', 'Sièges'],
    ['tables', 'Tables'],
    ['decor', 'Décorations'],
    ['plants', 'Plantes'],
    ['lights', 'Lumières'],
    ['floors', 'Sols'],
    ['rares', 'Rares'],
    ['misc', 'Divers']
];
