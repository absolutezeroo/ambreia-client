import {Logger} from '@core/utils/Logger';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IItemGridWindow} from '@core/window/components/IItemGridWindow';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {IGridItem} from './IGridItem';
import type {IItemGrid} from './IItemGrid';
import {ProductContainer} from './ProductContainer';

const log = Logger.getLogger('habbo.catalog.viewer.BundleProductContainer');

/**
 * A bundle offer's grid item: shows a "deal" icon and populates a sub-grid of its products.
 *
 * @see sources/win63_version/habbo/catalog/viewer/BundleProductContainer.as
 */
export class BundleProductContainer extends ProductContainer implements IItemGrid
{
    private _dealIcon: ImageBitmap | null = null;

    override dispose(): void
    {
        if(this.disposed) return;

        this._dealIcon = null;
        super.dispose();
    }

    override initProductIcon(_roomEngine: IRoomEngine, _stuffData?: unknown | null): void
    {
        const asset = this.catalog!.assets!.getAssetByName('ctlg_pic_deal_icon_narrow');

        this._dealIcon = asset ? asset.content as ImageBitmap : null;

        this.setIconImage(this._dealIcon, false);
    }

    // AS3 passes a raw XML template and calls buildFromXML(layout) per bundle; this port's
    // callers already hold a built IWindow template (from windowManager.buildWidgetLayout()),
    // so this clones that template directly instead of rebuilding it from XML each time.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/BundleProductContainer.as::populateItemGrid()
    populateItemGrid(grid: IItemGridWindow, layout: IWindow): void
    {
        for(const product of this.offer.productContainer.products)
        {
            if(product.productType === 'b') continue;

            const view = layout.clone() as unknown as IWindowContainer;
            const clubLevelIcon = view.findChildByName('clubLevelIcon');

            if(clubLevelIcon != null)
            {
                clubLevelIcon.visible = false;
            }

            grid.addGridItem(view);
            product.view = view;

            const image = product.initIcon(this);

            if(image != null)
            {
                image.close();
            }

            product.grid = this;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/BundleProductContainer.as::setBundleCounter()
    setBundleCounter(count: number): void
    {
        const bundleCounter = this._view!.findChildByName('bundleCounter') as unknown as ITextWindow | null;

        if(bundleCounter != null)
        {
            bundleCounter.caption = count.toString();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/BundleProductContainer.as::select()
    select(item: IGridItem, _selected: boolean): void
    {
        log.debug(`Product Bundle, select item: ${item}`);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/BundleProductContainer.as::startDragAndDrop()
    startDragAndDrop(_item: IGridItem): boolean
    {
        return false;
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
        this.setBundleCounter(999);
    }
}
