/**
 * PlaneVisualizationAnimationLayer
 *
 * @see com.sulake.habbo.room.object.visualization.room.rasterizer.animated.PlaneVisualizationAnimationLayer
 *
 * Animation layer for landscape plane visualization. Contains a collection of
 * AnimationItems that are rendered with tiling/wrapping behavior.
 */
import {AnimationItem} from './AnimationItem';

/**
 * Configuration for an animation item parsed from visualization data.
 */
export interface IAnimationItemData
{
    asset: string;
    x: number;
    y: number;
    speedX: number;
    speedY: number;
}

export class PlaneVisualizationAnimationLayer
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/PlaneVisualizationAnimationLayer.as::_color
    private _color: number = 0;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/PlaneVisualizationAnimationLayer.as::_bitmapData
    private _bitmapData: HTMLCanvasElement | null = null;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/PlaneVisualizationAnimationLayer.as::_items
    private _items: AnimationItem[] = [];

    constructor(items: IAnimationItemData[], assetTextures: Map<string, HTMLCanvasElement> | null)
    {
        if(items !== null && assetTextures !== null)
        {
            for(const itemData of items)
            {
                const assetCanvas = assetTextures.get(itemData.asset);

                if(assetCanvas !== undefined)
                {
                    const item = new AnimationItem(
                        itemData.x,
                        itemData.y,
                        itemData.speedX,
                        itemData.speedY,
                        assetCanvas
                    );

                    this._items.push(item);
                }
            }
        }
    }

    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/PlaneVisualizationAnimationLayer.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/PlaneVisualizationAnimationLayer.as::clearCache()
    clearCache(): void
    {
        this._bitmapData = null;
    }

    /**
	 * Render animation items onto a canvas.
	 *
	 * Each item is drawn at its computed position, with wrapping copies drawn
	 * at tileWidth/tileHeight offsets to create seamless tiling.
	 *
	 * @param canvas - Target canvas (or null to create one)
	 * @param width - Target width
	 * @param height - Target height
	 * @param _normal - Surface normal (unused for animation layers)
	 * @param offsetX - Horizontal offset
	 * @param offsetY - Vertical offset
	 * @param tileWidth - Width of tile repeat area
	 * @param tileHeight - Height of tile repeat area
	 * @param speedXScale - Horizontal speed scale
	 * @param speedYScale - Vertical speed scale
	 * @param time - Current time in ms
	 * @returns Rendered canvas
	 */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/PlaneVisualizationAnimationLayer.as::render()
    render(
        canvas: HTMLCanvasElement | null,
        width: number,
        height: number,
        _normal: unknown,
        offsetX: number,
        offsetY: number,
        tileWidth: number,
        tileHeight: number,
        speedXScale: number,
        speedYScale: number,
        time: number
    ): HTMLCanvasElement | null
    {
        if(canvas === null || canvas.width !== width || canvas.height !== height)
        {
            if(this._bitmapData === null || this._bitmapData.width !== width || this._bitmapData.height !== height)
            {
                this._bitmapData = document.createElement('canvas');
                this._bitmapData.width = width;
                this._bitmapData.height = height;
            }
            else
            {
                const ctx = this._bitmapData.getContext('2d')!;
                ctx.clearRect(0, 0, width, height);
            }

            canvas = this._bitmapData;
        }

        if(tileWidth > 0 && tileHeight > 0)
        {
            const ctx = canvas.getContext('2d')!;

            for(const item of this._items)
            {
                if(item === null) continue;

                const [posX, posY] = item.getPosition(tileWidth, tileHeight, speedXScale, speedYScale, time);
                const drawX = posX - offsetX;
                const drawY = posY - offsetY;

                const bmp = item.bitmapData;
                if(bmp === null) continue;

                const bw = bmp.width;
                const bh = bmp.height;

                // Draw at base position + 3 wrapping copies
                if(drawX > -bw && drawX < width && drawY > -bh && drawY < height)
                {
                    ctx.drawImage(bmp, drawX, drawY);
                }

                if(drawX - tileWidth > -bw && drawX - tileWidth < width && drawY > -bh && drawY < height)
                {
                    ctx.drawImage(bmp, drawX - tileWidth, drawY);
                }

                if(drawX > -bw && drawX < width && drawY - tileHeight > -bh && drawY - tileHeight < height)
                {
                    ctx.drawImage(bmp, drawX, drawY - tileHeight);
                }

                if(drawX - tileWidth > -bw && drawX - tileWidth < width && drawY - tileHeight > -bh && drawY - tileHeight < height)
                {
                    ctx.drawImage(bmp, drawX - tileWidth, drawY - tileHeight);
                }
            }
        }

        return canvas;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/PlaneVisualizationAnimationLayer.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        this._bitmapData = null;

        for(const item of this._items)
        {
            if(item !== null)
            {
                item.dispose();
            }
        }

        this._items = [];
    }
}
