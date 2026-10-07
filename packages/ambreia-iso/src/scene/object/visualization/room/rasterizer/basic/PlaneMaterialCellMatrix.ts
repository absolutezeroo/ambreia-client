/**
 * PlaneMaterialCellMatrix
 *
 * Based on AS3: com.sulake.habbo.room.object.visualization.room.rasterizer.basic.PlaneMaterialCellMatrix
 *
 * A matrix of PlaneMaterialCellColumns, rendered horizontally with various repeat modes.
 */
import type {IVector3d} from '../../../../../../utils/IVector3d';
import {Vector3d} from '../../../../../../utils/Vector3d';
import {Randomizer} from '../../utils/Randomizer';
import type {PlaneMaterialCell} from './PlaneMaterialCell';
import {PlaneMaterialCellColumn} from './PlaneMaterialCellColumn';

export class PlaneMaterialCellMatrix
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::REPEAT_MODE_ALL
    public static readonly REPEAT_MODE_ALL: number = 1;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::REPEAT_MODE_BORDERS
    public static readonly REPEAT_MODE_BORDERS: number = 2;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::REPEAT_MODE_CENTER
    public static readonly REPEAT_MODE_CENTER: number = 3;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::REPEAT_MODE_FIRST
    public static readonly REPEAT_MODE_FIRST: number = 4;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::REPEAT_MODE_LAST
    public static readonly REPEAT_MODE_LAST: number = 5;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::REPEAT_MODE_RANDOM
    public static readonly REPEAT_MODE_RANDOM: number = 6;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::REPEAT_MODE_DEFAULT
    public static readonly REPEAT_MODE_DEFAULT: number = 1;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::ALIGN_TOP
    public static readonly ALIGN_TOP: number = 1;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::ALIGN_BOTTOM
    public static readonly ALIGN_BOTTOM: number = 2;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::ALIGN_DEFAULT
    public static readonly ALIGN_DEFAULT: number = 1;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::_columns
    private _columns: (PlaneMaterialCellColumn | null)[];
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::_repeatMode
    private _repeatMode: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::_align
    private _align: number;
    private _cachedBitmap: HTMLCanvasElement | null = null;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::_cachedBitmapNormal
    private _cachedBitmapNormal: Vector3d | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::_cachedBitmapHeight
    private _cachedBitmapHeight: number = 0;
    private _cacheUsed: boolean = false;

    constructor(
        numColumns: number,
        repeatMode: number = 1,
        align: number = 1,
        normalMinX: number = -1,
        normalMaxX: number = 1,
        normalMinY: number = -1,
        normalMaxY: number = 1
    )
    {
        this._columns = [];
        if(numColumns < 1) numColumns = 1;

        for(let i = 0; i < numColumns; i++)
        {
            this._columns.push(null);
        }

        this._repeatMode = repeatMode;
        this._align = align;
        this._normalMinX = normalMinX;
        this._normalMaxX = normalMaxX;
        this._normalMinY = normalMinY;
        this._normalMaxY = normalMaxY;

        if(this._repeatMode === PlaneMaterialCellMatrix.REPEAT_MODE_RANDOM)
        {
            this._isStatic = false;
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::_isStatic
    private _isStatic: boolean = true;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::get isStatic()
    get isStatic(): boolean
    {
        return this._isStatic;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::_normalMinX
    private _normalMinX: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::get normalMinX()
    get normalMinX(): number
    {
        return this._normalMinX;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::_normalMaxX
    private _normalMaxX: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::get normalMaxX()
    get normalMaxX(): number
    {
        return this._normalMaxX;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::_normalMinY
    private _normalMinY: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::get normalMinY()
    get normalMinY(): number
    {
        return this._normalMinY;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::_normalMaxY
    private _normalMaxY: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::get normalMaxY()
    get normalMaxY(): number
    {
        return this._normalMaxY;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::nextRandomColumnIndex()
    private static nextRandomColumnIndex(count: number): number
    {
        const values = Randomizer.getValues(1, 0, count * 17631);
        return values[0] % count;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::isBottomAligned()
    isBottomAligned(): boolean
    {
        return this._align === PlaneMaterialCellMatrix.ALIGN_BOTTOM;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::dispose()
    dispose(): void
    {
        this._cachedBitmap = null;
        this._cachedBitmapNormal = null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::clearCache()
    clearCache(): void
    {
        if(!this._cacheUsed) return;

        this._cachedBitmap = null;
        if(this._cachedBitmapNormal !== null)
        {
            this._cachedBitmapNormal.x = 0;
            this._cachedBitmapNormal.y = 0;
            this._cachedBitmapNormal.z = 0;
        }
        this._cachedBitmapHeight = 0;

        for(const column of this._columns)
        {
            if(column !== null)
            {
                column.clearCache();
            }
        }
        this._cacheUsed = false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::createColumn()
    createColumn(index: number, width: number, cells: PlaneMaterialCell[] | null, repeatMode: number = 1): boolean
    {
        if(index < 0 || index >= this._columns.length) return false;

        const newColumn = new PlaneMaterialCellColumn(width, cells, repeatMode);
        const oldColumn = this._columns[index];
        if(oldColumn !== null)
        {
            oldColumn.dispose();
        }
        this._columns[index] = newColumn;

        if(!newColumn.isStatic)
        {
            this._isStatic = false;
        }

        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::getColumns()
    getColumns(width: number): (PlaneMaterialCellColumn | null)[]
    {
        if(this._repeatMode === PlaneMaterialCellMatrix.REPEAT_MODE_RANDOM)
        {
            const result: PlaneMaterialCellColumn[] = [];
            let xPos = 0;
            while(xPos < width)
            {
                const col = this._columns[PlaneMaterialCellMatrix.nextRandomColumnIndex(this._columns.length)];
                if(col === null) break;
                result.push(col);
                if(col.width <= 1) break;
                xPos += col.width;
            }
            return result;
        }
        return this._columns;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::render()
    render(
        canvas: HTMLCanvasElement | null,
        width: number,
        height: number,
        normal: IVector3d,
        hasTexture: boolean,
        offsetX: number,
        offsetY: number,
        isTopAligned: boolean
    ): HTMLCanvasElement | null
    {
        if(width < 1) width = 1;
        if(height < 1) height = 1;

        if(canvas !== null && (canvas.width !== width || canvas.height !== height))
        {
            canvas = null;
        }

        if(this._cachedBitmapNormal === null)
        {
            this._cachedBitmapNormal = new Vector3d();
        }

        // Check static cache
        if(this._isStatic)
        {
            if(this._cachedBitmap !== null)
            {
                if(this._cachedBitmap.width === width &&
					this._cachedBitmap.height === height &&
					Vector3d.isEqual(this._cachedBitmapNormal, normal))
                {
                    if(canvas !== null)
                    {
                        this.copyCachedBitmapOnCanvas(canvas, this._cachedBitmapHeight, offsetY, isTopAligned);
                        return canvas;
                    }
                    return this._cachedBitmap;
                }
                this._cachedBitmap = null;
            }
        }
        else if(this._cachedBitmap !== null)
        {
            if(this._cachedBitmap.width === width && this._cachedBitmap.height === height)
            {
                const ctx = this._cachedBitmap.getContext('2d')!;
                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
            }
            else
            {
                this._cachedBitmap = null;
            }
        }

        this._cacheUsed = true;
        this._cachedBitmapNormal.assign(normal);

        // No texture - fill white
        if(!hasTexture)
        {
            this._cachedBitmapHeight = height;
            if(this._cachedBitmap === null)
            {
                this._cachedBitmap = document.createElement('canvas');
                this._cachedBitmap.width = width;
                this._cachedBitmap.height = height;
                const ctx = this._cachedBitmap.getContext('2d')!;
                ctx.fillStyle = '#FFFFFFFF';
                ctx.fillRect(0, 0, width, height);
            }
            else
            {
                const ctx = this._cachedBitmap.getContext('2d')!;
                ctx.fillStyle = '#FFFFFFFF';
                ctx.fillRect(0, 0, width, height);
            }
            if(canvas !== null)
            {
                this.copyCachedBitmapOnCanvas(canvas, height, offsetY, isTopAligned);
                return canvas;
            }
            return this._cachedBitmap;
        }

        if(this._cachedBitmap === null)
        {
            this._cachedBitmapHeight = height;
            this._cachedBitmap = document.createElement('canvas');
            this._cachedBitmap.width = width;
            this._cachedBitmap.height = height;
            const ctx = this._cachedBitmap.getContext('2d')!;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
        }

        // Render columns
        const renderedColumns: HTMLCanvasElement[] = [];
        for(const column of this._columns)
        {
            if(column !== null)
            {
                const colBitmap = column.render(height, normal, offsetX, offsetY);
                if(colBitmap !== null)
                {
                    renderedColumns.push(colBitmap);
                }
            }
        }

        if(renderedColumns.length === 0)
        {
            if(canvas !== null) return canvas;
            return this._cachedBitmap;
        }

        let resultHeight: number;
        switch(this._repeatMode)
        {
            case PlaneMaterialCellMatrix.REPEAT_MODE_BORDERS:
                resultHeight = this.renderRepeatBorders(this._cachedBitmap, renderedColumns);
                break;
            case PlaneMaterialCellMatrix.REPEAT_MODE_CENTER:
                resultHeight = this.renderRepeatCenter(this._cachedBitmap, renderedColumns);
                break;
            case PlaneMaterialCellMatrix.REPEAT_MODE_FIRST:
                resultHeight = this.renderRepeatFirst(this._cachedBitmap, renderedColumns);
                break;
            case PlaneMaterialCellMatrix.REPEAT_MODE_LAST:
                resultHeight = this.renderRepeatLast(this._cachedBitmap, renderedColumns);
                break;
            case PlaneMaterialCellMatrix.REPEAT_MODE_RANDOM:
                resultHeight = this.renderRepeatRandom(this._cachedBitmap, renderedColumns);
                break;
            default:
                resultHeight = this.renderRepeatAll(this._cachedBitmap, renderedColumns);
                break;
        }

        this._cachedBitmapHeight = resultHeight;

        if(canvas !== null)
        {
            this.copyCachedBitmapOnCanvas(canvas, resultHeight, offsetY, isTopAligned);
            return canvas;
        }

        return this._cachedBitmap;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::copyCachedBitmapOnCanvas()
    private copyCachedBitmapOnCanvas(canvas: HTMLCanvasElement, renderHeight: number, offsetY: number, isTopAligned: boolean): void
    {
        if(canvas === null || this._cachedBitmap === null || canvas === this._cachedBitmap) return;

        if(!isTopAligned)
        {
            offsetY = canvas.height - renderHeight - offsetY;
        }

        const ctx = canvas.getContext('2d')!;
        let srcY: number;
        let srcH: number;

        if(this._align === PlaneMaterialCellMatrix.ALIGN_TOP)
        {
            srcY = 0;
            srcH = this._cachedBitmapHeight;
        }
        else
        {
            srcY = this._cachedBitmap.height - this._cachedBitmapHeight;
            srcH = this._cachedBitmapHeight;
        }

        if(srcH > 0 && this._cachedBitmap.width > 0)
        {
            ctx.drawImage(
                this._cachedBitmap,
                0, srcY, this._cachedBitmap.width, srcH,
                0, offsetY, this._cachedBitmap.width, srcH
            );
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::getColumnsWidth()
    private getColumnsWidth(columns: HTMLCanvasElement[]): number
    {
        let total = 0;
        for(const col of columns)
        {
            if(col !== null) total += col.width;
        }
        return total;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::renderColumns()
    private renderColumns(
        target: HTMLCanvasElement,
        columns: HTMLCanvasElement[],
        xPos: number,
        leftToRight: boolean
    ): { x: number; maxHeight: number }
    {
        if(columns === null || columns.length === 0 || target === null)
        {
            return {x: xPos, maxHeight: 0};
        }

        const ctx = target.getContext('2d')!;
        let maxHeight = 0;

        for(let i = 0; i < columns.length; i++)
        {
            const col = leftToRight ? columns[i] : columns[columns.length - 1 - i];

            if(col !== null)
            {
                if(!leftToRight) xPos -= col.width;

                let yOff = 0;
                if(this._align === PlaneMaterialCellMatrix.ALIGN_BOTTOM)
                {
                    yOff = target.height - col.height;
                }

                ctx.drawImage(col, xPos, yOff);

                if(col.height > maxHeight) maxHeight = col.height;

                if(leftToRight) xPos += col.width;

                if((leftToRight && xPos >= target.width) || (!leftToRight && xPos <= 0))
                {
                    return {x: xPos, maxHeight};
                }
            }
        }

        return {x: xPos, maxHeight};
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::renderRepeatAll()
    private renderRepeatAll(target: HTMLCanvasElement, columns: HTMLCanvasElement[]): number
    {
        if(columns.length === 0 || target === null) return 0;

        let maxHeight = 0;
        let xPos = 0;

        while(xPos < target.width)
        {
            const result = this.renderColumns(target, columns, xPos, true);
            xPos = result.x;
            if(result.maxHeight > maxHeight) maxHeight = result.maxHeight;
            if(result.x === 0) return maxHeight;
        }

        return maxHeight;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::renderRepeatBorders()
    private renderRepeatBorders(target: HTMLCanvasElement, columns: HTMLCanvasElement[]): number
    {
        if(columns.length === 0 || target === null) return 0;

        let maxHeight = 0;
        const centerCols: HTMLCanvasElement[] = [];
        let centerWidth = 0;

        for(let i = 1; i < columns.length - 1; i++)
        {
            const col = columns[i];
            if(col !== null)
            {
                centerWidth += col.width;
                centerCols.push(col);
            }
        }

        if(this._columns.length === 1 && columns[0])
        {
            centerWidth = columns[0].width;
            centerCols.push(columns[0]);
        }

        let startX = (target.width - centerWidth) >> 1;
        const centerResult = this.renderColumns(target, centerCols, startX, true);
        let endX = centerResult.x;
        if(centerResult.maxHeight > maxHeight) maxHeight = centerResult.maxHeight;

        // First column repeats left
        if(columns[0])
        {
            const firstArr = [columns[0]];
            while(startX >= 0)
            {
                const r = this.renderColumns(target, firstArr, startX, false);
                startX = r.x;
                if(r.maxHeight > maxHeight) maxHeight = r.maxHeight;
            }
        }

        // Last column repeats right
        if(columns[columns.length - 1])
        {
            const lastArr = [columns[columns.length - 1]];
            while(endX < target.width)
            {
                const r = this.renderColumns(target, lastArr, endX, true);
                endX = r.x;
                if(r.maxHeight > maxHeight) maxHeight = r.maxHeight;
            }
        }

        return maxHeight;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::renderRepeatCenter()
    private renderRepeatCenter(target: HTMLCanvasElement, columns: HTMLCanvasElement[]): number
    {
        if(columns.length === 0 || target === null) return 0;

        let maxHeight = 0;
        const firstHalf: HTMLCanvasElement[] = [];
        const secondHalf: HTMLCanvasElement[] = [];
        let firstWidth = 0;
        let secondWidth = 0;

        for(let i = 0; i < (columns.length >> 1); i++)
        {
            if(columns[i])
            {
                firstWidth += columns[i].width;
                firstHalf.push(columns[i]);
            }
        }

        for(let i = (columns.length >> 1) + 1; i < columns.length; i++)
        {
            if(columns[i])
            {
                secondWidth += columns[i].width;
                secondHalf.push(columns[i]);
            }
        }

        let overflow = 0;
        let startX: number;
        let endX = target.width;

        if(firstWidth + secondWidth > target.width)
        {
            overflow = firstWidth + secondWidth - target.width;
            // AS3 also adjusts startX by the overflow here, but startX is unconditionally reset to 0
            // below before its only real use, so that adjustment never survives to matter either way.
            endX += overflow - (overflow >> 1);
        }

        if(overflow === 0)
        {
            const centerCol = columns[columns.length >> 1];
            if(centerCol)
            {
                const colWidth = centerCol.width;
                const available = target.width - (firstWidth + secondWidth);
                const totalCenter = Math.ceil(available / colWidth) * colWidth;
                startX = firstWidth - ((totalCenter - available) >> 1);
                const endCenter = startX + totalCenter;
                const centerArr = [centerCol];
                let pos = startX;
                while(pos < endCenter)
                {
                    const r = this.renderColumns(target, centerArr, pos, true);
                    pos = r.x;
                    if(r.maxHeight > maxHeight) maxHeight = r.maxHeight;
                }
            }
        }

        startX = 0;
        let r = this.renderColumns(target, firstHalf, startX, true);
        if(r.maxHeight > maxHeight) maxHeight = r.maxHeight;

        r = this.renderColumns(target, secondHalf, endX, false);
        if(r.maxHeight > maxHeight) maxHeight = r.maxHeight;

        return maxHeight;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::renderRepeatFirst()
    private renderRepeatFirst(target: HTMLCanvasElement, columns: HTMLCanvasElement[]): number
    {
        if(columns.length === 0 || target === null) return 0;

        let maxHeight = 0;
        let xPos = target.width;

        let r = this.renderColumns(target, columns, xPos, false);
        xPos = r.x;
        if(r.maxHeight > maxHeight) maxHeight = r.maxHeight;

        if(columns[0])
        {
            const firstArr = [columns[0]];
            while(xPos >= 0)
            {
                r = this.renderColumns(target, firstArr, xPos, false);
                xPos = r.x;
                if(r.maxHeight > maxHeight) maxHeight = r.maxHeight;
            }
        }

        return maxHeight;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::renderRepeatLast()
    private renderRepeatLast(target: HTMLCanvasElement, columns: HTMLCanvasElement[]): number
    {
        if(columns.length === 0 || target === null) return 0;

        let maxHeight = 0;
        let xPos = 0;

        let r = this.renderColumns(target, columns, xPos, true);
        xPos = r.x;
        if(r.maxHeight > maxHeight) maxHeight = r.maxHeight;

        if(columns[columns.length - 1])
        {
            const lastArr = [columns[columns.length - 1]];
            while(xPos < target.width)
            {
                r = this.renderColumns(target, lastArr, xPos, true);
                xPos = r.x;
                if(r.maxHeight > maxHeight) maxHeight = r.maxHeight;
            }
        }

        return maxHeight;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellMatrix.as::renderRepeatRandom()
    private renderRepeatRandom(target: HTMLCanvasElement, columns: HTMLCanvasElement[]): number
    {
        if(columns.length === 0 || target === null) return 0;

        let maxHeight = 0;
        let xPos = 0;

        while(xPos < target.width)
        {
            const col = columns[PlaneMaterialCellMatrix.nextRandomColumnIndex(columns.length)];
            if(col === null) return maxHeight;

            const colArr = [col];
            const r = this.renderColumns(target, colArr, xPos, true);
            xPos = r.x;
            if(r.maxHeight > maxHeight) maxHeight = r.maxHeight;
        }

        return maxHeight;
    }
}
