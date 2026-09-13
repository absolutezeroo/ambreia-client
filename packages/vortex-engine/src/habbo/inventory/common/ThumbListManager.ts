import type {IResourceManager} from '@core/window/IResourceManager';
import {Logger} from '@core/utils/Logger';

import type {IThumbListDataProvider} from './IThumbListDataProvider';

const log = Logger.getLogger('habbo.inventory.common.ThumbListManager');

/**
 * Composites a provider's items into one strip image: each icon centred on a thumbnail
 * background, laid out left to right and wrapped into rows that fit the view width.
 *
 * AS3 keeps a mutable `BitmapData` and copyPixels into it. A window here takes an immutable
 * `ImageBitmap`, so the strip lives in an OffscreenCanvas and `getListImage()` hands out a
 * snapshot of it — the store itself is never consumed.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as
 */
export class ThumbListManager
{
    // Eleven of AS3's eighteen members are absent, and they are all one thing: incremental mutation
    // of the strip — `addItemAsFirst`, `removeItemInIndex/Location/Image`, `replaceItemImage`,
    // `updateListItem`, and the `resolveGridLocation*` arithmetic those need. This note is here so
    // the next hollow-port sweep stops re-deriving it.
    //
    // They cannot be ported as written, and the reason is the one in the class comment above: AS3
    // patches a mutable `BitmapData` in place with copyPixels, and an `ImageBitmap` is immutable.
    // The port re-composites the whole strip through `updateImageFromList()` instead, which reaches
    // the same end state by the only route the platform offers.
    //
    // Nothing in this port calls this class at all today, so the choice is also untested in anger.
    // When a caller arrives, the thing to check is cost: re-compositing a long strip per change is
    // the price of immutability, and if it bites, the answer is an OffscreenCanvas kept between
    // updates — not the eleven methods, which have no target to patch.

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::_provider
    // Derived name: obfuscated in the primary tree.
    private _provider: IThumbListDataProvider | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::_columnCount
    // Derived name: obfuscated in the primary tree — how many thumbs fit across the view.
    private _columnCount: number = 1;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::_rowCount
    // Derived name: obfuscated in the primary tree.
    private _rowCount: number = 1;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::_listImage
    // Derived name: obfuscated in the primary tree — the composited strip.
    private _listImage: OffscreenCanvas | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::_viewWidth
    private _viewWidth: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::_viewHeight
    // Derived name: obfuscated in the primary tree.
    private _viewHeight: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::_thumbWidth
    private _thumbWidth: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::_thumbHeight
    // Derived name: obfuscated in the primary tree.
    private _thumbHeight: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::_thumbBackground
    // Derived name: obfuscated in the primary tree.
    private _thumbBackground: ImageBitmap | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::_thumbBackgroundSelected
    // Derived name: obfuscated in the primary tree.
    private _thumbBackgroundSelected: ImageBitmap | null = null;

    /**
	 * AS3 reads both backgrounds straight off the component asset library, which is resolved
	 * by then; this port's window images come through the ResourceManager, so the two are
	 * looked up from its cache and the strip is (re)built once they are there.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::ThumbListManager()
    constructor(
        resourceManager: IResourceManager | null,
        provider: IThumbListDataProvider,
        backgroundName: string,
        selectedBackgroundName: string,
        viewWidth: number,
        viewHeight: number
    )
    {
        this._provider = provider;
        this._viewWidth = viewWidth;
        this._viewHeight = viewHeight;

        // No `_png` suffix: images register under the bare file basename.
        this._thumbBackground = resourceManager?.getAsset(backgroundName.replace(/_png$/, '')) ?? null;
        this._thumbBackgroundSelected = resourceManager?.getAsset(selectedBackgroundName.replace(/_png$/, '')) ?? null;

        if(this._thumbBackground === null)
        {
            log.warn(`Thumb background "${backgroundName}" is not in the resource cache; the strip will be blank`);
        }

        this._thumbWidth = this._thumbBackground?.width ?? 0;
        this._thumbHeight = this._thumbBackground?.height ?? 0;
        this._columnCount = this._thumbWidth > 0 ? Math.floor(this._viewWidth / this._thumbWidth) : 1;

        this._listImage = ThumbListManager.createCanvas(this._viewWidth, this._viewHeight);
    }

    /**
	 * Redraws the whole strip from the provider's current list.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::updateImageFromList()
    updateImageFromList(): void
    {
        this._rowCount = this.resolveRowCountFromList();

        if(this._rowCount === 0)
        {
            this._listImage = ThumbListManager.createCanvas(this._viewWidth, this._viewHeight);

            return;
        }

        const width = Math.max(this._columnCount * this._thumbWidth, this._viewWidth);
        const height = Math.max(this._rowCount * this._thumbHeight, this._viewHeight);

        this._listImage = ThumbListManager.createCanvas(width, height);

        const context = this._listImage.getContext('2d');

        if(context === null) return;

        const items = this.getList();
        let index = 0;

        for(let row = 0; row < this._rowCount; row++)
        {
            for(let column = 0; column < this._columnCount; column++)
            {
                if(index >= items.length) break;

                const item = items[index];

                if(item !== null) this.drawThumb(context, item.iconImage, item.isSelected, column * this._thumbWidth, row * this._thumbHeight);

                index++;
            }
        }
    }

    /**
	 * A snapshot of the strip. Drawn into a throwaway canvas first so the backing store
	 * survives — `transferToImageBitmap()` would empty it.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::getListImage()
    getListImage(): ImageBitmap | null
    {
        if(this._listImage === null) return null;

        const snapshot = ThumbListManager.createCanvas(this._listImage.width, this._listImage.height);
        const context = snapshot.getContext('2d');

        if(context === null) return null;

        context.drawImage(this._listImage, 0, 0);

        return snapshot.transferToImageBitmap();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::resolveIndexFromImageLocation()
    resolveIndexFromImageLocation(point: {x: number; y: number}): number
    {
        const column = this._thumbWidth > 0 ? Math.floor(point.x / this._thumbWidth) : 0;
        const row = this._thumbHeight > 0 ? Math.floor(point.y / this._thumbHeight) : 0;

        return row * this._columnCount + column;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::getList()
    private getList(): ReturnType<IThumbListDataProvider['getDrawableList']>
    {
        return this._provider?.getDrawableList() ?? [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::resolveRowCountFromList()
    private resolveRowCountFromList(): number
    {
        return Math.ceil(this.getList().length / this._columnCount);
    }

    /**
	 * One cell: the background (selected variant when the item is), then the icon centred on it.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::createThumbImage()
    private drawThumb(
        context: OffscreenCanvasRenderingContext2D,
        icon: ImageBitmap | null,
        selected: boolean,
        x: number,
        y: number
    ): void
    {
        const background = selected ? this._thumbBackgroundSelected : this._thumbBackground;

        if(background !== null) context.drawImage(background, x, y);

        if(icon === null) return;

        context.drawImage(
            icon,
            x + Math.floor((this._thumbWidth - icon.width) / 2),
            y + Math.floor((this._thumbHeight - icon.height) / 2)
        );
    }

    // TS-only: AS3 allocates a BitmapData at each of these points.
    private static createCanvas(width: number, height: number): OffscreenCanvas
    {
        return new OffscreenCanvas(Math.max(1, Math.floor(width)), Math.max(1, Math.floor(height)));
    }

    // sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as
    // also carries an incremental half — `addItemAsFirst()`, `replaceItemImage()`,
    // `removeItemInIndex()`, `removeItemInLocation()`, `updateListItem()` and the
    // `removeItemInImage()` pixel-shuffle they share, ~150 lines that slide the strip's cells
    // around in place instead of redrawing. Nothing in the AS3 tree calls any of them:
    // `EffectsView` is this class's only consumer and it uses `updateImageFromList()`,
    // `getListImage()`, `resolveIndexFromImageLocation()` and `dispose()`. Port them if a
    // second consumer ever needs in-place edits.

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/common/ThumbListManager.as::dispose()
    dispose(): void
    {
        this._provider = null;
        this._listImage = null;
    }
}
