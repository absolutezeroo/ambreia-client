/**
 * Generic catalog state-change event (type-only payload).
 *
 * @see sources/win63_version/habbo/catalog/event/CatalogEvent.as
 */
export class CatalogEvent
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/event/CatalogEvent.as::CATALOG_INITIALIZED
    static readonly CATALOG_INITIALIZED: string = 'CATALOG_INITIALIZED';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/event/CatalogEvent.as::CATALOG_NOT_READY
    static readonly CATALOG_NOT_READY: string = 'CATALOG_NOT_READY';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/event/CatalogEvent.as::CATALOG_NEW_ITEMS_SHOW
    static readonly CATALOG_NEW_ITEMS_SHOW: string = 'CATALOG_NEW_ITEMS_SHOW';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/event/CatalogEvent.as::CATALOG_NEW_ITEMS_HIDE
    static readonly CATALOG_NEW_ITEMS_HIDE: string = 'CATALOG_NEW_ITEMS_HIDE';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/event/CatalogEvent.as::CATALOG_USER_SELECTED
    static readonly CATALOG_USER_SELECTED: string = 'CATALOG_USER_SELECTED';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/event/CatalogEvent.as::CATALOG_INVISIBLE_PAGE_VISITED
    static readonly CATALOG_INVISIBLE_PAGE_VISITED: string = 'CATALOG_INVISIBLE_PAGE_VISITED';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/event/CatalogEvent.as::COLLECTIBLES_CLAIM_WAIT
    static readonly COLLECTIBLES_CLAIM_WAIT: string = 'COLLECTIBLE_CLAIM_WAIT';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/event/CatalogEvent.as::COLLECTIBLES_CLAIM_SUCCESS
    static readonly COLLECTIBLES_CLAIM_SUCCESS: string = 'COLLECTIBLE_CLAIM_SUCCESS';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/event/CatalogEvent.as::COLLECTIBLES_CLAIM_FAIL
    static readonly COLLECTIBLES_CLAIM_FAIL: string = 'COLLECTIBLES_CLAIM_FAIL';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/event/CatalogEvent.as::COLLECTIBLES_MINT_SUCCESS
    static readonly COLLECTIBLES_MINT_SUCCESS: string = 'COLLECTIBLES_MINT_SUCCESS';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/event/CatalogEvent.as::COLLECTIBLES_MINT_FAIL
    static readonly COLLECTIBLES_MINT_FAIL: string = 'COLLECTIBLES_MINT_FAIL';

    private _type: string;

    constructor(type: string)
    {
        this._type = type;
    }

    get type(): string
    {
        return this._type;
    }
}
