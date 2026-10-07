/**
 * Rasterizer
 *
 * Bitmap helpers shared by the room's rasterizers and by the shore-mask builder: a Bresenham line
 * plotted pixel by pixel, and the three axis flips.
 *
 * The class is `_SafeCls_4426` in the primary tree; the name here is recovered from PRODUCTION,
 * where `ShoreMaskCreatorUtility.as` l.250 calls `Rasterizer.getFlipHBitmapData()` — the same four
 * methods under a readable class name.
 *
 * AS3 works on `flash.display.BitmapData`; this port has no such type and uses `OffscreenCanvas`,
 * which every other pixel-building path here already does (FurniturePlane, FurnitureThumbnail-
 * Visualization, FurnitureRoomBrandingVisualization).
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/_SafeCls_4426.as
 */
import type {IInterpolationPoint} from './LineInterpolation';

export class Rasterizer
{
    /**
     * Plots the straight line between two points, one pixel at a time.
     *
     * @param target - The canvas to draw into
     * @param from - First endpoint, inclusive
     * @param to - Second endpoint, inclusive
     * @param color - 32-bit ARGB, as AS3's setPixel32 takes it
     */
    // DEVIATION: AS3 brackets the loop with `BitmapData.lock()`/`unlock()` so that per-pixel
    //   setPixel32 does not repaint the screen each time. Canvas2D has no equivalent, and calling
    //   fillRect once per pixel would be far slower than what lock() was avoiding, so the pixels
    //   are written into one ImageData and blitted once — which is what lock/unlock amounts to.
    //   AS3's early `return` for a zero-length line also skips its own `unlock()`, a leak Flash
    //   tolerated; there is nothing to leak here.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/_SafeCls_4426.as::line()
    static line(target: OffscreenCanvas, from: IInterpolationPoint, to: IInterpolationPoint, color: number): void
    {
        const context = target.getContext('2d');

        if(context === null) return;

        const width = target.width;
        const height = target.height;

        if(width <= 0 || height <= 0) return;

        const image = context.getImageData(0, 0, width, height);
        const pixels = image.data;

        const alpha = (color >>> 24) & 0xFF;
        const red = (color >>> 16) & 0xFF;
        const green = (color >>> 8) & 0xFF;
        const blue = color & 0xFF;

        const plot = (x: number, y: number): void =>
        {
            if(x < 0 || y < 0 || x >= width || y >= height) return;

            const offset = (y * width + x) * 4;

            pixels[offset] = red;
            pixels[offset + 1] = green;
            pixels[offset + 2] = blue;
            pixels[offset + 3] = alpha;
        };

        let x = Math.trunc(from.x);
        let y = Math.trunc(from.y);

        let deltaX = Math.trunc(to.x) - x;
        let deltaY = Math.trunc(to.y) - y;

        const stepX = deltaX > 0 ? 1 : -1;
        const stepY = deltaY > 0 ? 1 : -1;

        deltaX = Math.abs(deltaX);
        deltaY = Math.abs(deltaY);

        plot(x, y);

        if(deltaX === 0 && deltaY === 0)
        {
            context.putImageData(image, 0, 0);

            return;
        }

        let error = 0;

        if(deltaX > deltaY)
        {
            let remaining = deltaX - 1;

            while(remaining >= 0)
            {
                error += deltaY;
                x += stepX;

                if(error >= deltaX / 2)
                {
                    error -= deltaX;
                    y += stepY;
                }

                plot(x, y);

                remaining--;
            }
        }
        else
        {
            let remaining = deltaY - 1;

            while(remaining >= 0)
            {
                error += deltaX;
                y += stepY;

                if(error >= deltaY / 2)
                {
                    error -= deltaY;
                    x += stepX;
                }

                plot(x, y);

                remaining--;
            }
        }

        plot(Math.trunc(to.x), Math.trunc(to.y));

        context.putImageData(image, 0, 0);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/_SafeCls_4426.as::getFlipHBitmapData()
    static getFlipHBitmapData(source: OffscreenCanvas | null): OffscreenCanvas | null
    {
        return Rasterizer.flip(source, -1, 1);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/_SafeCls_4426.as::getFlipVBitmapData()
    static getFlipVBitmapData(source: OffscreenCanvas | null): OffscreenCanvas | null
    {
        return Rasterizer.flip(source, 1, -1);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/_SafeCls_4426.as::getFlipHVBitmapData()
    static getFlipHVBitmapData(source: OffscreenCanvas | null): OffscreenCanvas | null
    {
        return Rasterizer.flip(source, -1, -1);
    }

    /**
     * The body the three flips share: AS3 spells each one out with its own Matrix, scaled and then
     * translated back into frame. The scale factors are the only thing that differs.
     */
    // TS-only: the common half of getFlipH/V/HVBitmapData(), which AS3 repeats three times.
    private static flip(source: OffscreenCanvas | null, scaleX: number, scaleY: number): OffscreenCanvas | null
    {
        if(source === null) return null;

        const target = new OffscreenCanvas(source.width, source.height);
        const context = target.getContext('2d');

        if(context === null) return null;

        context.setTransform(
            scaleX, 0, 0, scaleY,
            scaleX < 0 ? source.width : 0,
            scaleY < 0 ? source.height : 0
        );
        context.drawImage(source, 0, 0);

        return target;
    }
}
