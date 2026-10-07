/**
 * PlaneVisualizationLayer
 *
 * Based on AS3: com.sulake.habbo.room.object.visualization.room.rasterizer.basic.PlaneVisualizationLayer
 *
 * A single layer in a PlaneVisualization. Has material, color tint, alignment, and offset.
 */
import type {IVector3d} from '../../../../../../utils/IVector3d';
import type {PlaneMaterial} from './PlaneMaterial';

export class PlaneVisualizationLayer
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneVisualizationLayer.as::DEFAULT_OFFSET
    public static readonly DEFAULT_OFFSET: number = 0;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneVisualizationLayer.as::ALIGN_TOP
    public static readonly ALIGN_TOP: number = 1;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneVisualizationLayer.as::ALIGN_BOTTOM
    public static readonly ALIGN_BOTTOM: number = 2;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneVisualizationLayer.as::ALIGN_DEFAULT
    public static readonly ALIGN_DEFAULT: number = 1;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneVisualizationLayer.as::_material
    private _material: PlaneMaterial | null;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneVisualizationLayer.as::_color
    private _color: number;
    private _cachedBitmap: HTMLCanvasElement | null = null;

    constructor(material: PlaneMaterial | null, color: number, align: number, offset: number = 0)
    {
        this._material = material;
        this._color = color;
        this._align = align;
        this._offset = offset;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneVisualizationLayer.as::_align
    private _align: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneVisualizationLayer.as::get align()
    get align(): number
    {
        return this._align;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneVisualizationLayer.as::_offset
    private _offset: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneVisualizationLayer.as::get offset()
    get offset(): number
    {
        return this._offset;
    }

    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneVisualizationLayer.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneVisualizationLayer.as::dispose()
    dispose(): void
    {
        this._disposed = true;
        this._material = null;
        this._cachedBitmap = null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneVisualizationLayer.as::clearCache()
    clearCache(): void
    {
        this._cachedBitmap = null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneVisualizationLayer.as::getMaterial()
    getMaterial(): PlaneMaterial | null
    {
        return this._material;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneVisualizationLayer.as::getColor()
    getColor(): number
    {
        return this._color;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneVisualizationLayer.as::render()
    render(
        canvas: HTMLCanvasElement | null,
        width: number,
        height: number,
        normal: IVector3d,
        hasTexture: boolean,
        offsetX: number,
        offsetY: number
    ): HTMLCanvasElement | null
    {
        const r = (this._color >> 16) & 0xFF;
        const g = (this._color >> 8) & 0xFF;
        const b = this._color & 0xFF;
        const needsColorTransform = r < 255 || g < 255 || b < 255;

        if(canvas !== null && (canvas.width !== width || canvas.height !== height))
        {
            canvas = null;
        }

        let result: HTMLCanvasElement | null;

        if(this._material !== null)
        {
            if(needsColorTransform)
            {
                // Render to separate buffer for color transform
                result = this._material.render(null, width, height, normal, hasTexture, offsetX, offsetY + this._offset, this._align === PlaneVisualizationLayer.ALIGN_TOP);
            }
            else
            {
                result = this._material.render(canvas, width, height, normal, hasTexture, offsetX, offsetY + this._offset, this._align === PlaneVisualizationLayer.ALIGN_TOP);
            }

            if(result !== null && result !== canvas)
            {
                // Reuse existing cached canvas — just resize if dimensions differ
                if(this._cachedBitmap === null)
                {
                    this._cachedBitmap = document.createElement('canvas');
                }

                if(this._cachedBitmap.width !== result.width || this._cachedBitmap.height !== result.height)
                {
                    this._cachedBitmap.width = result.width;
                    this._cachedBitmap.height = result.height;
                }

                const ctx = this._cachedBitmap.getContext('2d')!;
                ctx.clearRect(0, 0, this._cachedBitmap.width, this._cachedBitmap.height);
                ctx.drawImage(result, 0, 0);
                result = this._cachedBitmap;
            }
        }
        else if(canvas === null)
        {
            // No material - create white fill
            if(this._cachedBitmap !== null && this._cachedBitmap.width === width && this._cachedBitmap.height === height)
            {
                return this._cachedBitmap;
            }

            this._cachedBitmap = document.createElement('canvas');
            this._cachedBitmap.width = width;
            this._cachedBitmap.height = height;
            const ctx = this._cachedBitmap.getContext('2d')!;
            ctx.fillStyle = '#FFFFFFFF';
            ctx.fillRect(0, 0, width, height);
            result = this._cachedBitmap;
        }
        else
        {
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#FFFFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            result = canvas;
        }

        // Apply color transform using GPU compositing (no CPU pixel loop)
        if(result !== null && needsColorTransform)
        {
            const ctx = result.getContext('2d')!;

            // Use 'multiply' composite to tint the image on the GPU
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(0, 0, result.width, result.height);

            // Restore original alpha by compositing with 'destination-in'
            // (multiply affects alpha, so we need to mask back to the original shape)
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(result, 0, 0);

            ctx.globalCompositeOperation = 'source-over';

            // Copy onto canvas if needed
            if(canvas !== null && result !== canvas)
            {
                const canvasCtx = canvas.getContext('2d')!;
                canvasCtx.drawImage(result, 0, 0);
                result = canvas;
            }
        }

        return result;
    }
}
