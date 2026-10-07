import {Logger} from '@ambreia/common/utils/Logger';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import {LineInterpolation} from '@room/utils/LineInterpolation';
import type {BCFloorPlanEditor} from './BCFloorPlanEditor';
import type {FloorPlanCache, IPlanPoint} from './FloorPlanCache';

const log = Logger.getLogger('habbo.window.utils.floorplaneditor.HeightMapEditor');

/** An RGB triple in 0..1, as AS3's `hslToRgb()` returns it. */
// TS-only: AS3 uses a bare `Array` of three Numbers.
export type RgbTriple = [number, number, number];

/**
 * HeightMapEditor — the isometric grid you actually draw the floor plan on.
 *
 * Every tile is the same base sprite recoloured by its height: a 30-entry HSL ramp running from
 * warm to cold, at full saturation for a free tile and washed out (s 0.33, l 0.4) for one that
 * already has furniture on it. AS3 gets there with `BitmapData.colorTransform()` and a
 * `ColorTransform` of three multipliers; Canvas 2D has no such call, so the multiply is done per
 * pixel — the same way `BitmapDataRenderer.tintBitmap()` already does it for every window in the
 * port. It is affordable because the result is **cached per height and zoom**, so it runs at most
 * 30 times a level rather than once a tile.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/floorplaneditor/HeightMapEditor.as
 */
export class HeightMapEditor
{
    // AS3: HeightMapEditor.as::LEVELS
    public static readonly LEVELS: number = 30;

    /** AS3's four `[Embed]`ed tile classes, by the names the asset build ships them under. */
    // AS3: HeightMapEditor.as::floor_editor_tile_base / _entry / _base_large / _entry_large
    private static readonly TILE_BASE: string = 'floor_editor_tile_base';
    // AS3: HeightMapEditor.as::floor_editor_tile_entry
    private static readonly TILE_ENTRY: string = 'floor_editor_tile_entry';
    // AS3: HeightMapEditor.as::floor_editor_tile_base_large
    private static readonly TILE_BASE_LARGE: string = 'floor_editor_tile_base_large';
    // AS3: HeightMapEditor.as::floor_editor_tile_entry_large
    private static readonly TILE_ENTRY_LARGE: string = 'floor_editor_tile_entry_large';

    // AS3: HeightMapEditor.as::_bcFloorPlanEditor
    private _bcFloorPlanEditor: BCFloorPlanEditor;

    // AS3: HeightMapEditor.as::_drawing
    private _drawing: boolean = false;

    // AS3: HeightMapEditor.as::_drawingHeight
    private _drawingHeight: number = 0;

    // AS3: HeightMapEditor.as::_tileImageBase
    private _tileImageBase: ImageBitmap | null = null;

    // AS3: HeightMapEditor.as::_tileImageEntry
    private _tileImageEntry: ImageBitmap | null = null;

    // AS3: HeightMapEditor.as::_tileImageBaseLarge
    private _tileImageBaseLarge: ImageBitmap | null = null;

    // AS3: HeightMapEditor.as::_tileImageEntryLarge
    private _tileImageEntryLarge: ImageBitmap | null = null;

    // AS3: HeightMapEditor.as::_heigthColorMap  (AS3's own spelling)
    private _heigthColorMap: RgbTriple[] = [];

    // AS3: HeightMapEditor.as::_occupiedHeigthColorMap
    private _occupiedHeigthColorMap: RgbTriple[] = [];

    // AS3: HeightMapEditor.as::_lastDrawAddress
    private _lastDrawAddress: IPlanPoint = {x: -1000, y: -1000};

    // AS3: HeightMapEditor.as::_floorPlan
    private _floorPlan: FloorPlanCache;

    // AS3: HeightMapEditor.as::_colorPickMode
    private _colorPickMode: boolean = false;

    // AS3: HeightMapEditor.as::_zoomLevel
    private _zoomLevel: number = 1;

    // AS3: HeightMapEditor.as::_coloredTiles
    private _coloredTiles: Map<number, ImageBitmap> = new Map();

    // AS3: HeightMapEditor.as::_coloredOccupiedTiles
    private _coloredOccupiedTiles: Map<number, ImageBitmap> = new Map();

    // AS3: HeightMapEditor.as::_coloredTilesLarge
    private _coloredTilesLarge: Map<number, ImageBitmap> = new Map();

    // AS3: HeightMapEditor.as::_coloredOccupiedTilesLarge
    private _coloredOccupiedTilesLarge: Map<number, ImageBitmap> = new Map();

    // AS3: HeightMapEditor.as::_selectionStartPoint
    private _selectionStartPoint: IPlanPoint = {x: -1000, y: -1000};

    // AS3: HeightMapEditor.as::_isRectSelect
    private _isRectSelect: boolean = false;

    // AS3: HeightMapEditor.as::HeightMapEditor()
    constructor(bcFloorPlanEditor: BCFloorPlanEditor)
    {
        this._bcFloorPlanEditor = bcFloorPlanEditor;
        this._floorPlan = bcFloorPlanEditor.floorPlanCache;

        const bitmapElement = bcFloorPlanEditor.heightMapBitmapElement;
        const mouseCapturer = bcFloorPlanEditor.heightMapMouseCapturer;

        if(bitmapElement !== null) bitmapElement.procedure = this.editorWindowProcedure;
        if(mouseCapturer !== null) mouseCapturer.procedure = this.editorWindowProcedure;

        // AS3 instantiates four [Embed]ed classes here and has its bitmaps before the first line of
        // drawing code runs. See `BCFloorPlanEditor.requestEmbeddedAsset()` for why this port has to
        // ask, and what the black panel it fixes looked like.
        const request = bcFloorPlanEditor.requestEmbeddedAsset.bind(bcFloorPlanEditor);

        request(HeightMapEditor.TILE_BASE, bitmap => { this._tileImageBase = bitmap; this.refreshFromCache(); });
        request(HeightMapEditor.TILE_ENTRY, bitmap => { this._tileImageEntry = bitmap; this.refreshFromCache(); });
        request(HeightMapEditor.TILE_BASE_LARGE, bitmap => { this._tileImageBaseLarge = bitmap; this.refreshFromCache(); });
        request(HeightMapEditor.TILE_ENTRY_LARGE, bitmap => { this._tileImageEntryLarge = bitmap; this.refreshFromCache(); });

        // The ramp: hue walks 0.6 down by 0.85 over the 30 levels and wraps back into 0..1 when it
        // goes negative, so the top of the scale comes round to red again.
        for(let level = 0; level < HeightMapEditor.LEVELS; level++)
        {
            let hue = 0.6 - (level / HeightMapEditor.LEVELS) * 0.85;

            if(hue < 0) hue = 1 + hue;

            this._heigthColorMap.push(HeightMapEditor.hslToRgb(hue, 1, 0.5));
            this._occupiedHeigthColorMap.push(HeightMapEditor.hslToRgb(hue, 0.33, 0.4));
        }
    }

    // AS3: HeightMapEditor.as::hslToRgb()
    public static hslToRgb(h: number, s: number, l: number): RgbTriple
    {
        if(s === 0) return [l, l, l];

        const hue2rgb = (p: number, q: number, t: number): number =>
        {
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1 / 6) return p + (q - p) * 6 * t;
            if(t < 0.5) return q;
            if(t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;

            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
    }

    // AS3: HeightMapEditor.as::get heigthColorMap()
    get heigthColorMap(): RgbTriple[]
    {
        return this._heigthColorMap;
    }

    // AS3: HeightMapEditor.as::set drawingHeight()
    set drawingHeight(value: number)
    {
        this._drawingHeight = Math.min(HeightMapEditor.LEVELS, Math.max(0, value));
    }

    // AS3: HeightMapEditor.as::get drawingHeight()
    get drawingHeight(): number
    {
        return this._drawingHeight;
    }

    // AS3: HeightMapEditor.as::set drawing()
    set drawing(value: boolean)
    {
        this._drawing = value;
    }

    // AS3: HeightMapEditor.as::refreshFromCache()
    refreshFromCache(): void
    {
        this._lastDrawAddress = {x: -1000, y: -1000};

        this.updateView();
    }

    /**
     * AS3: HeightMapEditor.as::editorWindowProcedure()
     *
     * Both the bitmap and the invisible capture region point here, because the drawn map shrinks to
     * its content and the region is what catches a drag that leaves it.
     */
    // AS3: HeightMapEditor.as::editorWindowProcedure()
    private editorWindowProcedure = (event: WindowEvent, window: IWindow): void =>
    {
        if(!(event instanceof WindowMouseEvent)) return;

        if(this._colorPickMode)
        {
            if(event.type === 'WME_CLICK')
            {
                const address = this.getTileAddressFromMousePoint(event, window);

                this._drawingHeight = this._floorPlan.getHeightAt(address.x, address.y);
                this._bcFloorPlanEditor.updateColorSliderTrack(this._drawingHeight);
            }

            return;
        }

        const isPointerEdge = event.type === 'WME_UP' || event.type === 'WME_UP_OUTSIDE'
            || event.type === 'WME_DOWN';

        if(!isPointerEdge && !(this._drawing && event.type === 'WME_MOVE')) return;

        const address = this.getTileAddressFromMousePoint(event, window);

        if(event.type === 'WME_UP' || event.type === 'WME_UP_OUTSIDE')
        {
            this._drawing = false;

            if(this._isRectSelect)
            {
                this._isRectSelect = false;
                this._floorPlan.submitTemporaryCache();
            }
        }

        if(event.type === 'WME_DOWN')
        {
            this._drawing = true;
            this._lastDrawAddress = {x: -1000, y: -1000};

            // Shift turns the drag into a rectangle, rubber-banded against a snapshot.
            if(event.shiftKey)
            {
                this._isRectSelect = true;
                this._selectionStartPoint = address;
                this._floorPlan.initTemporaryCache();
            }

            this.applyDraw(address.x, address.y);
            this.updateView();
            this._lastDrawAddress = address;
        }

        if(this._drawing && event.type === 'WME_MOVE')
        {
            if(this._isRectSelect) this.dragRectangleTo(address);
            else this.dragFreehandTo(address);

            this._lastDrawAddress = address;
        }
    };

    /**
     * AS3: HeightMapEditor.as::editorWindowProcedure() (the rect-select branch)
     *
     * The map has to be able to *hold* the rectangle before any of it is drawn, so the far corner
     * is walked back one row and one column at a time until both fit. AS3's two `attemptExpand`
     * probes run first and their results gate the walk — if neither direction can grow at all the
     * whole move is abandoned, which is what stops a drag past the size limit from drawing a
     * partial band.
     */
    // AS3: HeightMapEditor.as::editorWindowProcedure() (the rect-select branch)
    private dragRectangleTo(address: IPlanPoint): void
    {
        const left = Math.min(this._selectionStartPoint.x, address.x);
        let right = Math.max(this._selectionStartPoint.x, address.x);
        const top = Math.min(this._selectionStartPoint.y, address.y);
        let bottom = Math.max(this._selectionStartPoint.y, address.y);

        let columnsFit = this._floorPlan.attemptExpandColumns(right);
        let rowsFit = this._floorPlan.attemptExpandRows(bottom);

        if(!columnsFit && !rowsFit) return;

        while(bottom >= top && !rowsFit)
        {
            bottom -= 1;
            rowsFit = this._floorPlan.attemptExpandRows(bottom);
        }

        while(right >= left && !columnsFit)
        {
            right -= 1;
            columnsFit = this._floorPlan.attemptExpandColumns(right);
        }

        if(!columnsFit || !rowsFit) return;

        // Back to the snapshot, then grow to the corner that survived and fill.
        this._floorPlan.clearTemporaryCache();
        this._floorPlan.attemptExpandRows(bottom);
        this._floorPlan.attemptExpandColumns(right);

        for(let x = left; x <= right; x++)
        {
            for(let y = top; y <= bottom; y++) this.applyDraw(x, y);
        }

        this.updateView();
    }

    /** Draws the tile under the cursor and fills the gap the last sample left. */
    // AS3: HeightMapEditor.as::editorWindowProcedure() (the freehand branch)
    private dragFreehandTo(address: IPlanPoint): void
    {
        if(this._lastDrawAddress.x !== address.x || this._lastDrawAddress.y !== address.y)
        {
            this.applyDraw(address.x, address.y);
        }

        const delta = this.interpolateBetweenLastPointAndDrawPoint(address);

        if(Math.abs(delta.x) > 0 || Math.abs(delta.y) > 0) this.updateView();
    }

    // AS3: HeightMapEditor.as::getMousePositionRelativeToBitmap()
    private getMousePositionRelativeToBitmap(event: WindowMouseEvent, window: IWindow): IPlanPoint
    {
        const point = {x: event.localX, y: event.localY};

        window.convertPointFromLocalToGlobalSpace(point);
        this._bcFloorPlanEditor.heightMapBitmapElement?.convertPointFromGlobalToLocalSpace(point);

        return point;
    }

    // AS3: HeightMapEditor.as::getTileAddressFromMousePoint()
    private getTileAddressFromMousePoint(event: WindowMouseEvent, window: IWindow): IPlanPoint
    {
        const point = this.getMousePositionRelativeToBitmap(event, window);

        return this.transformFromScreenSpace(point.x, point.y);
    }

    /**
     * AS3: HeightMapEditor.as::interpolateBetweenLastPointAndDrawPoint()
     *
     * A fast drag skips tiles; this fills the line between the two samples. Both endpoints are
     * excluded because the caller has already drawn them.
     */
    // AS3: HeightMapEditor.as::interpolateBetweenLastPointAndDrawPoint()
    private interpolateBetweenLastPointAndDrawPoint(address: IPlanPoint): IPlanPoint
    {
        if(this._lastDrawAddress.x === -1000 && this._lastDrawAddress.y === -1000)
        {
            this._lastDrawAddress = {x: address.x, y: address.y};
        }

        const deltaX = address.x - this._lastDrawAddress.x;
        const deltaY = address.y - this._lastDrawAddress.y;

        const points = LineInterpolation.interpolationPoints(
            this._lastDrawAddress.x, this._lastDrawAddress.y, address.x, address.y
        );

        for(const point of points)
        {
            const isEndpoint = (this._lastDrawAddress.x === point.x && this._lastDrawAddress.y === point.y)
                || (address.x === point.x && address.y === point.y);

            if(!isEndpoint) this.applyDraw(point.x, point.y);
        }

        return {x: deltaX, y: deltaY};
    }

    /**
     * AS3: HeightMapEditor.as::applyDraw()
     *
     * The five modes, dispatched on the editor's current one. Raise, lower and door all refuse on a
     * tile that has no floor (`height < 0`), so they never create one.
     */
    // AS3: HeightMapEditor.as::applyDraw()
    private applyDraw(x: number, y: number): void
    {
        const modes = this._bcFloorPlanEditor.drawModes;
        let height: number;

        switch(this._bcFloorPlanEditor.drawMode)
        {
            case modes[0]:
                this._floorPlan.setHeightAt(x, y, this._drawingHeight);
                break;
            case modes[1]:
                this._floorPlan.setHeightAt(x, y, -1);
                break;
            case modes[2]:
                height = this._floorPlan.getHeightAt(x, y);

                if(height >= 0)
                {
                    this._floorPlan.setHeightAt(x, y, Math.min(HeightMapEditor.LEVELS - 1, height + 1));
                }
                break;
            case modes[3]:
                height = this._floorPlan.getHeightAt(x, y);

                if(height >= 0) this._floorPlan.setHeightAt(x, y, Math.max(0, height - 1));
                break;
            case modes[4]:
                height = this._floorPlan.getHeightAt(x, y);

                if(height >= 0) this._floorPlan.entryPoint = {x, y};
                break;
        }
    }

    /**
     * AS3: HeightMapEditor.as::updateView()
     *
     * Lays every tile out in screen space, measures the extent, then composes one bitmap. The
     * `+18`/`+27` are the tile's own width and height overhang past the last origin.
     */
    // AS3: HeightMapEditor.as::updateView()
    private updateView(): void
    {
        const placements: {point: IPlanPoint; image: ImageBitmap}[] = [];

        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;

        for(let y = 0; y < this._floorPlan.floorHeight; y++)
        {
            for(let x = 0; x < this._floorPlan.floorWidth; x++)
            {
                const point = this.transformToScreenSpace(x, y);

                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);

                if(this._floorPlan.isEntryPoint(x, y))
                {
                    const entry = this.getEntryTile();

                    if(entry !== null) placements.push({point, image: entry});

                    continue;
                }

                const height = Math.min(this._floorPlan.getHeightAt(x, y), HeightMapEditor.LEVELS - 1);

                if(height < 0) continue;

                const tile = this.getColoredTile(height, this._floorPlan.isTileReserved(x, y));

                if(tile !== null) placements.push({point, image: tile});
            }
        }

        // Nothing to place while the plan is empty, and nothing to place either until the four tile
        // bitmaps land — `requestEmbeddedAsset()` calls back into `refreshFromCache()` per tile, so
        // this runs again as they do, and warns by name for one that can never arrive.
        if(placements.length === 0) return;

        const canvas = new OffscreenCanvas(maxX - minX + 18, maxY - minY + 27);
        const context = canvas.getContext('2d');

        if(context === null)
        {
            log.warn('no 2d context for the height map');

            return;
        }

        context.imageSmoothingEnabled = false;

        for(const placement of placements)
        {
            context.drawImage(placement.image, placement.point.x - minX, placement.point.y - minY);
        }

        const bitmapElement = this._bcFloorPlanEditor.heightMapBitmapElement;

        if(bitmapElement !== null) bitmapElement.bitmap = canvas.transferToImageBitmap();
    }

    /**
     * AS3: HeightMapEditor.as::getColoredTile()
     *
     * AS3 clones the base tile and runs `colorTransform()` over it. Canvas 2D has no such call, so
     * the three multipliers are applied per pixel — the same approach `BitmapDataRenderer` already
     * takes. Cached per height, per occupied-ness, per zoom, so this runs 30 times a level at most.
     */
    // AS3: HeightMapEditor.as::getColoredTile()
    private getColoredTile(height: number, occupied: boolean): ImageBitmap | null
    {
        const cache = occupied
            ? (this._zoomLevel === 1 ? this._coloredOccupiedTiles : this._coloredOccupiedTilesLarge)
            : (this._zoomLevel === 1 ? this._coloredTiles : this._coloredTilesLarge);

        const cached = cache.get(height);

        if(cached !== undefined) return cached;

        const source = this._zoomLevel === 1 ? this._tileImageBase : this._tileImageBaseLarge;

        if(source === null) return null;

        const multipliers = occupied ? this._occupiedHeigthColorMap[height] : this._heigthColorMap[height];

        if(multipliers === undefined) return null;

        const canvas = new OffscreenCanvas(source.width, source.height);
        const context = canvas.getContext('2d', {willReadFrequently: true});

        if(context === null) return null;

        context.imageSmoothingEnabled = false;
        context.drawImage(source, 0, 0);

        const image = context.getImageData(0, 0, source.width, source.height);
        const data = image.data;

        for(let i = 0; i < data.length; i += 4)
        {
            data[i] = data[i] * multipliers[0];
            data[i + 1] = data[i + 1] * multipliers[1];
            data[i + 2] = data[i + 2] * multipliers[2];
        }

        context.putImageData(image, 0, 0);

        const tile = canvas.transferToImageBitmap();

        cache.set(height, tile);

        return tile;
    }

    // AS3: HeightMapEditor.as::getEntryTile()
    private getEntryTile(): ImageBitmap | null
    {
        return this._zoomLevel === 1 ? this._tileImageEntry : this._tileImageEntryLarge;
    }

    /**
     * AS3: HeightMapEditor.as::transformFromScreenSpace()
     *
     * The inverse projection. `floorHeight / 2` re-centres it, which is why the mapping shifts as
     * the plan grows downward.
     */
    // AS3: HeightMapEditor.as::transformFromScreenSpace()
    private transformFromScreenSpace(screenX: number, screenY: number): IPlanPoint
    {
        const halfWidths = screenX / 16 / this._zoomLevel;
        const halfHeights = screenY / 8 / this._zoomLevel;
        const centre = this._floorPlan.floorHeight / 2;

        return {
            x: Math.trunc(halfHeights + (halfWidths - centre)),
            y: Math.trunc(halfHeights - (halfWidths - centre)),
        };
    }

    // AS3: HeightMapEditor.as::transformToScreenSpace()
    private transformToScreenSpace(x: number, y: number): IPlanPoint
    {
        return {
            x: this._zoomLevel * 8 * (x - y),
            y: this._zoomLevel * 4 * (x + y),
        };
    }

    // AS3: HeightMapEditor.as::get colorPickMode()
    get colorPickMode(): boolean
    {
        return this._colorPickMode;
    }

    // AS3: HeightMapEditor.as::set colorPickMode()
    set colorPickMode(value: boolean)
    {
        this._colorPickMode = value;
    }

    // AS3: HeightMapEditor.as::get zoomLevel()
    get zoomLevel(): number
    {
        return this._zoomLevel;
    }

    /** Only 1 and 2 exist; anything else is ignored rather than clamped. */
    // AS3: HeightMapEditor.as::set zoomLevel()
    set zoomLevel(value: number)
    {
        if(value < 1 || value > 2) return;

        this._zoomLevel = value;
    }
}
