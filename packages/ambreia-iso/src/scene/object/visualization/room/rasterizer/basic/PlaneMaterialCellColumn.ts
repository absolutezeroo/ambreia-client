/**
 * PlaneMaterialCellColumn
 *
 * Based on AS3: com.sulake.habbo.room.object.visualization.room.rasterizer.basic.PlaneMaterialCellColumn
 *
 * A column of PlaneMaterialCells, rendered vertically with various repeat modes.
 */
import type {IVector3d} from '../../../../../../utils/IVector3d';
import {Vector3d} from '../../../../../../utils/Vector3d';
import type {PlaneMaterialCell} from './PlaneMaterialCell';

export class PlaneMaterialCellColumn
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::REPEAT_MODE_NONE
    public static readonly REPEAT_MODE_NONE: number = 0;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::REPEAT_MODE_ALL
    public static readonly REPEAT_MODE_ALL: number = 1;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::REPEAT_MODE_BORDERS
    public static readonly REPEAT_MODE_BORDERS: number = 2;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::REPEAT_MODE_CENTER
    public static readonly REPEAT_MODE_CENTER: number = 3;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::REPEAT_MODE_FIRST
    public static readonly REPEAT_MODE_FIRST: number = 4;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::REPEAT_MODE_LAST
    public static readonly REPEAT_MODE_LAST: number = 5;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::_cells
    private _cells: PlaneMaterialCell[];
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::_repeatMode
    private _repeatMode: number;
    private _cachedBitmap: HTMLCanvasElement | null = null;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::_cachedBitmapNormal
    private _cachedBitmapNormal: Vector3d | null = null;
    private _cachedOffsetX: number = 0;
    private _cachedOffsetY: number = 0;
    private _cacheUsed: boolean = false;

    constructor(width: number, cells: PlaneMaterialCell[] | null, repeatMode: number = 1)
    {
        this._cells = [];

        if(width < 1) width = 1;
        this._width = width;

        if(cells !== null)
        {
            for(const cell of cells)
            {
                if(cell !== null)
                {
                    this._cells.push(cell);
                    if(!cell.isStatic)
                    {
                        this._isStatic = false;
                    }
                }
            }
        }

        this._repeatMode = repeatMode;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::_isStatic
    private _isStatic: boolean = true;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::get isStatic()
    get isStatic(): boolean
    {
        return this._isStatic;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::_width
    private _width: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::get width()
    get width(): number
    {
        return this._width;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::isRepeated()
    isRepeated(): boolean
    {
        return this._repeatMode !== 0;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::dispose()
    dispose(): void
    {
        if(this._cells !== null)
        {
            for(const cell of this._cells)
            {
                if(cell !== null)
                {
                    cell.dispose();
                }
            }
            this._cells = [];
        }
        this._cachedBitmap = null;
        this._cachedBitmapNormal = null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::clearCache()
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

        for(const cell of this._cells)
        {
            if(cell !== null)
            {
                cell.clearCache();
            }
        }
        this._cacheUsed = false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::getCells()
    getCells(): PlaneMaterialCell[]
    {
        return this._cells;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::render()
    render(height: number, normal: IVector3d, offsetX: number, offsetY: number): HTMLCanvasElement | null
    {
        if(this._repeatMode === 0)
        {
            height = this.getCellsHeight(this._cells, normal);
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
                if(this._cachedBitmap.height === height &&
					Vector3d.isEqual(this._cachedBitmapNormal, normal) &&
					this._cachedOffsetX === offsetX &&
					this._cachedOffsetY === offsetY)
                {
                    return this._cachedBitmap;
                }
                this._cachedBitmap = null;
            }
        }
        else if(this._cachedBitmap !== null)
        {
            if(this._cachedBitmap.height === height)
            {
                const ctx = this._cachedBitmap.getContext('2d')!;
                ctx.clearRect(0, 0, this._cachedBitmap.width, this._cachedBitmap.height);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, this._cachedBitmap.width, this._cachedBitmap.height);
            }
            else
            {
                this._cachedBitmap = null;
            }
        }

        this._cacheUsed = true;

        if(this._cachedBitmap === null)
        {
            if(height < 1) height = 1;
            this._cachedBitmap = document.createElement('canvas');
            this._cachedBitmap.width = this._width;
            this._cachedBitmap.height = height;
            const ctx = this._cachedBitmap.getContext('2d')!;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, this._width, height);
        }

        this._cachedBitmapNormal.assign(normal);
        this._cachedOffsetX = offsetX;
        this._cachedOffsetY = offsetY;

        if(this._cells.length === 0)
        {
            return this._cachedBitmap;
        }

        switch(this._repeatMode)
        {
            case PlaneMaterialCellColumn.REPEAT_MODE_NONE:
                this.renderRepeatNone(normal);
                break;
            case PlaneMaterialCellColumn.REPEAT_MODE_BORDERS:
                this.renderRepeatBorders(normal);
                break;
            case PlaneMaterialCellColumn.REPEAT_MODE_CENTER:
                this.renderRepeatCenter(normal);
                break;
            case PlaneMaterialCellColumn.REPEAT_MODE_FIRST:
                this.renderRepeatFirst(normal);
                break;
            case PlaneMaterialCellColumn.REPEAT_MODE_LAST:
                this.renderRepeatLast(normal);
                break;
            default:
                this.renderRepeatAll(normal, offsetX, offsetY);
                break;
        }

        return this._cachedBitmap;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::getCellsHeight()
    private getCellsHeight(cells: PlaneMaterialCell[], normal: IVector3d): number
    {
        if(cells === null || cells.length === 0) return 0;

        let total = 0;
        for(const cell of cells)
        {
            if(cell !== null)
            {
                total += cell.getHeight(normal);
            }
        }
        return total;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::renderCells()
    private renderCells(
        cells: PlaneMaterialCell[],
        yPos: number,
        topToBottom: boolean,
        normal: IVector3d,
        offsetX: number = 0,
        offsetY: number = 0
    ): number
    {
        if(cells === null || cells.length === 0 || this._cachedBitmap === null)
        {
            return yPos;
        }

        const ctx = this._cachedBitmap.getContext('2d')!;

        for(let i = 0; i < cells.length; i++)
        {
            const cell = topToBottom ? cells[i] : cells[cells.length - 1 - i];

            if(cell !== null)
            {
                const cellBitmap = cell.render(normal, offsetX, offsetY);

                if(cellBitmap !== null)
                {
                    if(!topToBottom)
                    {
                        yPos -= cellBitmap.height;
                    }

                    ctx.drawImage(cellBitmap, 0, yPos);

                    if(topToBottom)
                    {
                        yPos += cellBitmap.height;
                    }

                    if((topToBottom && yPos >= this._cachedBitmap.height) ||
						(!topToBottom && yPos <= 0))
                    {
                        return yPos;
                    }
                }
            }
        }

        return yPos;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::renderRepeatNone()
    private renderRepeatNone(normal: IVector3d): void
    {
        if(this._cells.length === 0 || this._cachedBitmap === null) return;
        this.renderCells(this._cells, 0, true, normal);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::renderRepeatAll()
    private renderRepeatAll(normal: IVector3d, offsetX: number, offsetY: number): void
    {
        if(this._cells.length === 0 || this._cachedBitmap === null) return;

        let yPos = 0;
        while(yPos < this._cachedBitmap.height)
        {
            yPos = this.renderCells(this._cells, yPos, true, normal, offsetX, offsetY);
            if(yPos === 0) return;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::renderRepeatBorders()
    private renderRepeatBorders(normal: IVector3d): void
    {
        if(this._cells.length === 0 || this._cachedBitmap === null) return;

        const centerCells: PlaneMaterialCell[] = [];
        let centerHeight = 0;

        for(let i = 1; i < this._cells.length - 1; i++)
        {
            const cell = this._cells[i];
            if(cell !== null)
            {
                const h = cell.getHeight(normal);
                if(h > 0)
                {
                    centerHeight += h;
                    centerCells.push(cell);
                }
            }
        }

        if(this._cells.length === 1)
        {
            const cell = this._cells[0];
            if(cell !== null)
            {
                const h = cell.getHeight(normal);
                if(h > 0)
                {
                    centerHeight += h;
                    centerCells.push(cell);
                }
            }
        }

        let startY = (this._cachedBitmap.height - centerHeight) >> 1;
        let endY = this.renderCells(centerCells, startY, true, normal);

        // First cell repeats upward
        const firstCell = this._cells[0];
        if(firstCell !== null)
        {
            const firstArr = [firstCell];
            while(startY >= 0)
            {
                startY = this.renderCells(firstArr, startY, false, normal);
            }
        }

        // Last cell repeats downward
        const lastCell = this._cells[this._cells.length - 1];
        if(lastCell !== null)
        {
            const lastArr = [lastCell];
            while(endY < this._cachedBitmap.height)
            {
                endY = this.renderCells(lastArr, endY, true, normal);
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::renderRepeatCenter()
    private renderRepeatCenter(normal: IVector3d): void
    {
        if(this._cells.length === 0 || this._cachedBitmap === null) return;

        const firstHalf: PlaneMaterialCell[] = [];
        const secondHalf: PlaneMaterialCell[] = [];
        let firstHeight = 0;
        let secondHeight = 0;

        for(let i = 0; i < (this._cells.length >> 1); i++)
        {
            const cell = this._cells[i];
            if(cell !== null)
            {
                const h = cell.getHeight(normal);
                if(h > 0)
                {
                    firstHeight += h;
                    firstHalf.push(cell);
                }
            }
        }

        for(let i = (this._cells.length >> 1) + 1; i < this._cells.length; i++)
        {
            const cell = this._cells[i];
            if(cell !== null)
            {
                const h = cell.getHeight(normal);
                if(h > 0)
                {
                    secondHeight += h;
                    secondHalf.push(cell);
                }
            }
        }

        let overflow = 0;
        let startY: number;
        let endY = this._cachedBitmap.height;

        if(firstHeight + secondHeight > this._cachedBitmap.height)
        {
            overflow = firstHeight + secondHeight - this._cachedBitmap.height;
            // AS3 also adjusts startY by the overflow here, but startY is unconditionally reset to 0
            // below before its only real use, so that adjustment never survives to matter either way.
            endY += overflow - (overflow >> 1);
        }

        if(overflow === 0)
        {
            const centerCell = this._cells[this._cells.length >> 1];
            if(centerCell !== null)
            {
                const cellHeight = centerCell.getHeight(normal);
                if(cellHeight > 0)
                {
                    const available = this._cachedBitmap.height - (firstHeight + secondHeight);
                    const totalCenterHeight = Math.ceil(available / cellHeight) * cellHeight;
                    startY = firstHeight - ((totalCenterHeight - available) >> 1);
                    const endCenter = startY + totalCenterHeight;
                    const centerArr = [centerCell];
                    let pos = startY;
                    while(pos < endCenter)
                    {
                        pos = this.renderCells(centerArr, pos, true, normal);
                    }
                }
            }
        }

        startY = 0;
        this.renderCells(firstHalf, startY, true, normal);
        this.renderCells(secondHalf, endY, false, normal);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::renderRepeatFirst()
    private renderRepeatFirst(normal: IVector3d): void
    {
        if(this._cells.length === 0 || this._cachedBitmap === null) return;

        let yPos = this._cachedBitmap.height;
        yPos = this.renderCells(this._cells, yPos, false, normal);

        const firstCell = this._cells[0];
        if(firstCell !== null)
        {
            const firstArr = [firstCell];
            while(yPos >= 0)
            {
                yPos = this.renderCells(firstArr, yPos, false, normal);
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCellColumn.as::renderRepeatLast()
    private renderRepeatLast(normal: IVector3d): void
    {
        if(this._cells.length === 0 || this._cachedBitmap === null) return;

        let yPos = 0;
        yPos = this.renderCells(this._cells, yPos, true, normal);

        const lastCell = this._cells[this._cells.length - 1];
        if(lastCell !== null)
        {
            const lastArr = [lastCell];
            while(yPos < this._cachedBitmap.height)
            {
                yPos = this.renderCells(lastArr, yPos, true, normal);
            }
        }
    }
}
