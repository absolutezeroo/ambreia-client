import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {
    FloorHeightMapMessageParser
} from '@habbo/communication/messages/parser/room/engine/FloorHeightMapMessageParser';
import type {
    RoomOccupiedTilesMessageParser
} from '@habbo/communication/messages/parser/room/layout/RoomOccupiedTilesMessageParser';
import type {BCFloorPlanEditor} from './BCFloorPlanEditor';

/** A tile address in plan space. AS3 uses `flash.geom.Point`, which this port has no equivalent of. */
// TS-only: stands in for `flash.geom.Point`.
export interface IPlanPoint
{
    // TS-only: `flash.geom.Point.x`.
    x: number;

    // TS-only: `flash.geom.Point.y`.
    y: number;
}

/**
 * FloorPlanCache — the height map the editor is drawing on, and the rules about what may be drawn.
 *
 * The map is the server's own text format and stays that way end to end: one string per row, one
 * character per tile, **base 33** for the height (`"0"`-`"9"` then `"a"`-`"w"`), `"x"` for no tile
 * at all, rows separated by `\r`. `getData()` hands that string straight back to the save composer,
 * so nothing is ever converted to a grid and back — which is why an unknown character round-trips
 * unharmed rather than becoming a hole.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/floorplaneditor/FloorPlanCache.as
 */
export class FloorPlanCache
{
    /**
     * The largest plan a room may have without the `BUILDER_AT_WORK` perk, as `(width - 1) * (height - 1)`.
     *
     * AS3 declares the constant and then writes the literal `3025` in `checkSizeLimits()` anyway;
     * both are kept so the constant is not silently doing nothing.
     */
    // AS3: FloorPlanCache.as::MAX_AREA
    private static readonly MAX_AREA: number = 3025;

    // AS3: FloorPlanCache.as::MAX_AXIS_LENGTH
    private static readonly MAX_AXIS_LENGTH: number = 64;

    /** The radix AS3 reads and writes heights in — `parseInt(c, 33)` / `n.toString(33)`. */
    // TS-only: AS3 writes the literal 33 at both call sites.
    private static readonly HEIGHT_RADIX: number = 33;

    // AS3: FloorPlanCache.as::_bcFloorPlanEditor
    private _bcFloorPlanEditor: BCFloorPlanEditor;

    // AS3: FloorPlanCache.as::_floorWidth
    private _floorWidth: number = -1;

    // AS3: FloorPlanCache.as::_floorHeight
    private _floorHeight: number = -1;

    // AS3: FloorPlanCache.as::_floorPlanCache
    private _floorPlanCache: string[] | null = null;

    /** The pre-drag copy, kept while a shift-drag rectangle is being rubber-banded. */
    // AS3: FloorPlanCache.as::_floorPlanCacheBuffer
    private _floorPlanCacheBuffer: string[] | null = null;

    // AS3: FloorPlanCache.as::_reservedTiles
    private _reservedTiles: boolean[][] | null = null;

    // AS3: FloorPlanCache.as::_entryPoint
    private _entryPoint: IPlanPoint | null = null;

    // AS3: FloorPlanCache.as::_entryPointDir
    private _entryPointDir: number = 0;

    /** Set once the size-limit alert has been shown, so a held mouse button does not repeat it. */
    // AS3: FloorPlanCache.as::_showedPopup
    private _showedPopup: boolean = false;

    // AS3: FloorPlanCache.as::FloorPlanCache()
    constructor(bcFloorPlanEditor: BCFloorPlanEditor)
    {
        this._bcFloorPlanEditor = bcFloorPlanEditor;
    }

    // AS3: FloorPlanCache.as::onFloorHeightMap()
    onFloorHeightMap(event: IMessageEvent): void
    {
        const parser = event.parser as FloorHeightMapMessageParser | null;

        this.updateFloorPlanCache(parser?.text ?? '');
        this._showedPopup = false;
    }

    /**
     * AS3: FloorPlanCache.as::onOccupiedTiles()
     *
     * Guarded on the plan already being loaded: the two requests go out together and the answers
     * can arrive in either order, and `resetReservedTiles()` sizes itself from the plan's dimensions.
     */
    // AS3: FloorPlanCache.as::onOccupiedTiles()
    onOccupiedTiles(event: IMessageEvent): void
    {
        if(this._floorPlanCache === null) return;

        const parser = event.parser as RoomOccupiedTilesMessageParser | null;

        if(parser === null) return;

        this.resetReservedTiles();

        for(const tile of parser.occupiedTiles)
        {
            const row = this._reservedTiles?.[tile.y];

            if(row !== undefined) row[tile.x] = true;
        }
    }

    // AS3: FloorPlanCache.as::resetReservedTiles()
    private resetReservedTiles(): void
    {
        this._reservedTiles = [];

        for(let y = 0; y < this.floorHeight; y++)
        {
            const row: boolean[] = [];

            for(let x = 0; x < this.floorWidth; x++) row.push(false);

            this._reservedTiles.push(row);
        }
    }

    /** Rows are split on `\r`, and empty ones are dropped — the map text ends with a separator. */
    // AS3: FloorPlanCache.as::updateFloorPlanCache()
    private updateFloorPlanCache(text: string = ''): void
    {
        this._floorPlanCache = text.split('\r').filter((row) => row.length > 0);

        this.checkDimensions();
    }

    /**
     * AS3: FloorPlanCache.as::checkDimensions()
     *
     * Width comes from the first row alone; height counts rows up to the first empty one. AS3's
     * loop can therefore disagree with `_floorPlanCache.length` on a ragged map, and that is kept.
     */
    // AS3: FloorPlanCache.as::checkDimensions()
    private checkDimensions(): boolean
    {
        this._floorWidth = -1;
        this._floorHeight = -1;

        if(this._floorPlanCache === null || this._floorPlanCache.length === 0) return false;

        let rows = 0;

        for(const row of this._floorPlanCache)
        {
            if(row.length === 0) break;

            rows++;
        }

        this._floorWidth = this._floorPlanCache[0].length;
        this._floorHeight = rows;

        return true;
    }

    /**
     * AS3: FloorPlanCache.as::allowDrawAt()
     *
     * Note the transposed arguments in AS3's own size check — `checkSizeLimits(y + 1, x + 1)` — kept
     * as written. Row 0 and column 0 are special: the door has to sit on an edge, so drawing there
     * is only allowed when that tile would *be* the door.
     */
    // AS3: FloorPlanCache.as::allowDrawAt()
    private allowDrawAt(x: number, y: number): boolean
    {
        if(this._floorPlanCache === null || !this.checkSizeLimits(y + 1, x + 1)) return false;

        if(x === 0 || y === 0) return this.isDoorTileAllowedAt(x, y);

        return true;
    }

    // AS3: FloorPlanCache.as::isDoorTileAllowedAt()
    private isDoorTileAllowedAt(x: number, y: number): boolean
    {
        return this.isFirstColumnZeroOrHasDoorAt(x, y) && this.isFirstRowZeroOrHasDoorAt(x, y);
    }

    /** Every other cell of column 0 must be empty, so this tile is the only candidate door there. */
    // AS3: FloorPlanCache.as::isFirstColumnZeroOrHasDoorAt()
    private isFirstColumnZeroOrHasDoorAt(x: number, y: number): boolean
    {
        for(let row = 0; row < this._floorHeight; row++)
        {
            if(row !== y && this._floorPlanCache?.[row].substr(0, 1) !== 'x') return false;
        }

        return true;
    }

    /** `_y` is AS3's second parameter, which its body does not read either — kept for the signature. */
    // AS3: FloorPlanCache.as::isFirstRowZeroOrHasDoorAt()
    private isFirstRowZeroOrHasDoorAt(x: number, _y: number): boolean
    {
        for(let column = 0; column < this._floorWidth; column++)
        {
            if(column !== x && this._floorPlanCache?.[0].substr(column, 1) !== 'x') return false;
        }

        return true;
    }

    /**
     * AS3: FloorPlanCache.as::setHeightAt()
     *
     * Grows the map to reach the address if it has to, and refuses on a tile something is standing
     * on. A negative height writes `"x"`, i.e. removes the tile.
     */
    // AS3: FloorPlanCache.as::setHeightAt()
    setHeightAt(x: number, y: number, height: number): boolean
    {
        if(x < 0 || y < 0) return false;

        if(!this.allowDrawAt(x, y)) return false;

        while(x >= this._floorWidth)
        {
            if(!this.addColumn()) return false;
        }

        while(y >= this._floorHeight)
        {
            if(!this.addRow()) return false;
        }

        if(this.isTileReserved(x, y)) return false;

        if(this._floorPlanCache === null) return false;

        this._floorPlanCache[y] = FloorPlanCache.setCharAt(
            this._floorPlanCache[y],
            height < 0 ? 'x' : height.toString(FloorPlanCache.HEIGHT_RADIX),
            x
        );

        return true;
    }

    /** -1 for "no tile", which is both the out-of-bounds answer and what `"x"` means. */
    // AS3: FloorPlanCache.as::getHeightAt()
    getHeightAt(x: number, y: number): number
    {
        if(this._floorPlanCache === null
            || x < 0 || x >= this._floorWidth
            || y < 0 || y >= this._floorHeight)
        {
            return -1;
        }

        const character = this._floorPlanCache[y].charAt(x);

        return character === 'x' ? -1 : parseInt(character, FloorPlanCache.HEIGHT_RADIX);
    }

    // AS3: FloorPlanCache.as::setCharAt()
    private static setCharAt(text: string, character: string, index: number): string
    {
        return text.substr(0, index) + character + text.substr(index + 1);
    }

    // AS3: FloorPlanCache.as::get floorWidth()
    get floorWidth(): number
    {
        return this._floorWidth;
    }

    // AS3: FloorPlanCache.as::get floorHeight()
    get floorHeight(): number
    {
        return this._floorHeight;
    }

    /** The map in the server's own format, trailing separator included. */
    // AS3: FloorPlanCache.as::getData()
    getData(): string
    {
        if(this._floorPlanCache === null) return '';

        return this._floorPlanCache.map((row) => `${row}\r`).join('');
    }

    // AS3: FloorPlanCache.as::isTileReserved()
    isTileReserved(x: number, y: number): boolean
    {
        if(this._reservedTiles === null) return false;

        if(this._reservedTiles.length < y + 1) return false;

        if(this._reservedTiles[y].length < x + 1) return false;

        return this._reservedTiles[y][x];
    }

    // AS3: FloorPlanCache.as::isEntryPoint()
    isEntryPoint(x: number, y: number): boolean
    {
        if(this._entryPoint === null) return false;

        return this._entryPoint.x === x && this._entryPoint.y === y;
    }

    // AS3: FloorPlanCache.as::get entryPoint()
    get entryPoint(): IPlanPoint | null
    {
        return this._entryPoint;
    }

    // AS3: FloorPlanCache.as::set entryPoint()
    set entryPoint(value: IPlanPoint | null)
    {
        this._entryPoint = value;
    }

    // AS3: FloorPlanCache.as::get entryPointDir()
    get entryPointDir(): number
    {
        return this._entryPointDir;
    }

    /** Wraps rather than clamps: the two arrow buttons step it round the eight compass points. */
    // AS3: FloorPlanCache.as::set entryPointDir()
    set entryPointDir(value: number)
    {
        if(value < 0) value = 7;

        if(value > 7) value = 0;

        this._entryPointDir = value;
    }

    /**
     * AS3: FloorPlanCache.as::addColumn()
     *
     * `silent` is AS3's second parameter: the rubber-band path probes the limits deliberately and
     * must not raise the alert on every rejected column.
     */
    // AS3: FloorPlanCache.as::addColumn()
    private addColumn(silent: boolean = false): boolean
    {
        if(!this.checkSizeLimits(this._floorWidth + 1, this._floorHeight))
        {
            this.warnSizeLimit(silent);

            return false;
        }

        for(let y = 0; y < this._floorHeight; y++)
        {
            if(this._floorPlanCache !== null && this._floorPlanCache[y].length > 0)
            {
                this._floorPlanCache[y] += 'x';
                this._reservedTiles?.[y].push(false);
            }
        }

        this._floorWidth += 1;

        return true;
    }

    // AS3: FloorPlanCache.as::addRow()
    private addRow(silent: boolean = false): boolean
    {
        if(!this.checkSizeLimits(this._floorWidth, this._floorHeight + 1))
        {
            this.warnSizeLimit(silent);

            return false;
        }

        this._floorPlanCache?.push('x'.repeat(this._floorWidth));

        const reserved: boolean[] = [];

        for(let x = 0; x < this._floorWidth; x++) reserved.push(false);

        this._reservedTiles?.push(reserved);
        this._floorHeight += 1;

        return true;
    }

    /** Shared tail of `addColumn()`/`addRow()`, which AS3 writes out twice. */
    // AS3: FloorPlanCache.as::addColumn() / addRow() (the identical alert branch)
    private warnSizeLimit(silent: boolean): void
    {
        if(this._showedPopup || silent) return;

        // AS3 passes null for the subtitle; this port's parameter is non-nullable and an empty
        // subtitle is what SimpleAlertDialog renders for either.
        this._bcFloorPlanEditor.windowManager?.simpleAlert(
            '${floor.plan.editor.alert}', '', '${floor.plan.editor.size.limit.exceeded}'
        );

        const heightMapEditor = this._bcFloorPlanEditor.heightMapEditor;

        if(heightMapEditor !== null) heightMapEditor.drawing = false;

        this._showedPopup = true;
    }

    // AS3: FloorPlanCache.as::attemptExpandColumns()
    attemptExpandColumns(x: number): boolean
    {
        while(x >= this.floorWidth)
        {
            if(!this.addColumn(true)) return false;
        }

        return true;
    }

    // AS3: FloorPlanCache.as::attemptExpandRows()
    attemptExpandRows(y: number): boolean
    {
        while(y >= this.floorHeight)
        {
            if(!this.addRow(true)) return false;
        }

        return true;
    }

    /**
     * AS3: FloorPlanCache.as::checkSizeLimits()
     *
     * The area rule is `(w - 1) * (h - 1)`, not `w * h` — the outermost row and column are the wall
     * band, not floor. The `BUILDER_AT_WORK` perk lifts the area limit but never the 64-per-axis one.
     */
    // AS3: FloorPlanCache.as::checkSizeLimits()
    private checkSizeLimits(width: number, height: number): boolean
    {
        if(!this._bcFloorPlanEditor.largeFloorPlansAllowed
            && (width - 1) * (height - 1) > FloorPlanCache.MAX_AREA)
        {
            return false;
        }

        return width <= FloorPlanCache.MAX_AXIS_LENGTH && height <= FloorPlanCache.MAX_AXIS_LENGTH;
    }

    /** Takes the snapshot a shift-drag rubber-bands against, then starts from it. */
    // AS3: FloorPlanCache.as::initTemporaryCache()
    initTemporaryCache(): void
    {
        this._floorPlanCacheBuffer = this._floorPlanCache;

        this.clearTemporaryCache();
    }

    /** Restores the snapshot, so each mouse-move redraws the rectangle instead of accumulating. */
    // AS3: FloorPlanCache.as::clearTemporaryCache()
    clearTemporaryCache(): void
    {
        if(this._floorPlanCacheBuffer === null) return;

        this._floorPlanCache = [...this._floorPlanCacheBuffer];

        this.checkDimensions();
    }

    // AS3: FloorPlanCache.as::submitTemporaryCache()
    submitTemporaryCache(): void
    {
        this._floorPlanCacheBuffer = null;
    }
}
