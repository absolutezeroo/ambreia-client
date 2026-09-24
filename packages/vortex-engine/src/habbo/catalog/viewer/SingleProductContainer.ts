import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {ILimitedItemGridOverlayWidget} from '@habbo/window/widgets/ILimitedItemGridOverlayWidget';
import {ProductContainer} from './ProductContainer';
import {Logger} from '@core/utils/Logger';

/**
 * A single-product offer's grid item (the common, non-multi/bundle case).
 *
 * @see sources/win63_version/habbo/catalog/viewer/SingleProductContainer.as
 */
export class SingleProductContainer extends ProductContainer
{
    override initProductIcon(roomEngine: IRoomEngine, stuffData?: unknown | null): void
    {
        const product = this.firstProduct;

        if(!product) return;

        const image = product.initIcon(this, this, this, this.offer, this.targetIcon, stuffData, this.onPreviewImageReady.bind(this));

        this.setIconImage(image, true);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/SingleProductContainer.as::enableLimitedItemLayout()
    enableLimitedItemLayout(): void
    {
        this._view!.findChildByName('unique_item_background_bitmap')!.visible = true;

        const overlayContainer = this._view!.findChildByName('unique_item_overlay_container') as unknown as IWidgetWindow;
        const overlayWidget = overlayContainer.widget as ILimitedItemGridOverlayWidget;

        overlayContainer.visible = true;
        overlayWidget.serialNumber = this.firstProduct!.uniqueLimitedItemSeriesSize;
        overlayWidget.animated = true;

        this._view!.findChildByName('unique_item_sold_out_bitmap')!.visible = this.firstProduct!.uniqueLimitedItemsLeft === 0;
    }

    /**
     * A preview image the catalog had to download has arrived.
     *
     * `setImageFromAsset()` is called a second time on purpose: the first call, from
     * `Product.initIcon()`, missed the library and started this download, and only now can it
     * find the asset. The disposed check matters because the download outlives the page — a
     * player who clicks past the product before it lands must not repaint a dead window.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/SingleProductContainer.as::onPreviewImageReady()
    private onPreviewImageReady(loader: unknown): void
    {
        if(this.disposed) return;

        const catalog = this.offer.page?.viewer?.catalog ?? null;
        const assetName = (loader as {assetName?: string} | null)?.assetName ?? null;

        // PROBE (throwaway): did the Spaces thumbnail download come back, and into what.
        Logger.getLogger('habbo.catalog.viewer.SingleProductContainer').warn(`PROBE spaces icon ready: asset=${assetName} catalog=${catalog !== null} target=${this.targetIcon ? `${this.targetIcon.name} ${this.targetIcon.width}x${this.targetIcon.height} disposed=${this.targetIcon.disposed}` : null} inLibrary=${!!catalog?.assets?.getAssetByName(assetName ?? '')}`);

        if(catalog === null || assetName === null) return;

        catalog.setImageFromAsset(this.targetIcon, assetName, null);
    }

    // TS-only: no AS3 counterpart; re-pairs the inherited getter with the setter below. TypeScript
    //   shadows the whole accessor pair when a subclass declares only one half, so without this
    //   `this.view` reads `undefined` here - see the same note on `ProductContainer`.
    override get view(): IWindowContainer
    {
        return super.view;
    }

    override set view(view: IWindowContainer)
    {
        super.view = view;

        if(this.offer.product?.isUniqueLimitedItem)
        {
            (this.offer.productContainer as SingleProductContainer).enableLimitedItemLayout();
        }
    }

    protected override get useWideView(): boolean
    {
        return this.offer.isSingleChatStyle;
    }
}
