import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {IFurnitureData} from '@habbo/session/furniture/IFurnitureData';
import type {IPurchasableOffer} from '../IPurchasableOffer';
import type {HabboCatalog} from '../HabboCatalog';
import type {IProduct} from './IProduct';
import {ProductContainer} from './ProductContainer';

/**
 * The grid cell behind a furniture search result.
 *
 * Two things separate it from a normal `ProductContainer`. Its icon comes straight from the room
 * engine keyed on the furni's own id rather than from a catalog product, because a search result
 * has no page and therefore no product image to inherit. And it is **lazy**: the offer's price and
 * details are not known until the cell is activated, at which point it asks for them — a search can
 * return up to 400 results and requesting an offer for each on render would be 400 round trips.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/FurniProductContainer.as
 */
export class FurniProductContainer extends ProductContainer
{
    /**
     * Derived name — AS3 calls this `_SafeStr_5194`, the same identifier it uses on `HabboCatalog`
     * for the whole furni-data *collection*. Here it holds one entry, so the plural would mislead.
     */
    // AS3: FurniProductContainer.as::_SafeStr_5194
    private _furniData: IFurnitureData;

    // AS3: FurniProductContainer.as::FurniProductContainer()
    constructor(
        offer: IPurchasableOffer,
        products: IProduct[],
        catalog: HabboCatalog,
        furniData: IFurnitureData
    )
    {
        super(offer, products, catalog);

        this._furniData = furniData;
    }

    /**
     * AS3: FurniProductContainer.as::initProductIcon()
     *
     * Only floor (`"s"`) and wall (`"i"`) items have an icon to fetch; anything else falls through
     * and keeps whatever the base class left, which is AS3's behaviour and not an oversight.
     */
    // AS3: FurniProductContainer.as::initProductIcon()
    override initProductIcon(_roomEngine: IRoomEngine, _stuffData?: unknown | null): void
    {
        const roomEngine = this.catalog?.roomEngine ?? null;

        if(roomEngine === null) return;

        let result = null;

        switch(this._furniData.type)
        {
            case 's':
                result = roomEngine.getFurnitureIcon(this._furniData.id, this);
                break;
            case 'i':
                result = roomEngine.getWallItemIcon(this._furniData.id, this);
                break;
        }

        // AS3 reads `.data` off the ImageResult; a cached icon comes back filled and never calls
        // `imageReady()`, which is the half `PurchaseConfirmationDialog` documents at length.
        if(result !== null) this.setIconImage(result.data, true);
    }

    /**
     * AS3: FurniProductContainer.as::activate()
     *
     * Asks for whichever offer actually applies. The order matters: an explicit offer id wins, then
     * the rent offer, then the purchase offer. (AS3 also skips the rent offer on a Builders Club
     * page; the RPG fork removed the Builders Club.)
     */
    // AS3: FurniProductContainer.as::activate()
    override activate(): void
    {
        super.activate();

        if(this._offer != null && this._offer.offerId > -1)
        {
            this.catalog?.sendGetProductOffer(this._offer.offerId);
        }
        else if(this._furniData.rentOfferId > -1)
        {
            this.catalog?.sendGetProductOffer(this._furniData.rentOfferId);
        }
        else if(this._furniData.purchaseOfferId > -1)
        {
            this.catalog?.sendGetProductOffer(this._furniData.purchaseOfferId);
        }
    }

    // AS3: FurniProductContainer.as::get isLazy()
    override get isLazy(): boolean
    {
        return true;
    }
}
