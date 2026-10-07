/**
 * RoomPlaneParser
 *
 * Based on AS3: com.sulake.habbo.room.object.RoomPlaneParser
 *
 * Parses floor height data into room planes (floors, walls, landscapes)
 */
import {Vector3d} from '../../utils/Vector3d';
import type {IVector3d} from '../../utils/IVector3d';
import {RoomPlaneData} from './RoomPlaneData';
import {type IPoint, RoomWallData} from './RoomWallData';
import {RoomFloorHole} from './RoomFloorHole';

export class RoomPlaneParser
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneParser.as::TILE_BLOCKED
    public static readonly TILE_BLOCKED: number = -110;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneParser.as::TILE_HOLE
    public static readonly TILE_HOLE: number = -100;
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::FLOOR_THICKNESS
    private static readonly FLOOR_THICKNESS: number = 0.25;
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::WALL_THICKNESS
    private static readonly WALL_THICKNESS: number = 0.25;
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::MAX_WALL_ADDITIONAL_HEIGHT
    private static readonly MAX_WALL_ADDITIONAL_HEIGHT: number = 20;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneParser.as::_tileMatrix
    private _tileMatrix: number[][] = [];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneParser.as::_tileMatrixOriginal
    private _tileMatrixOriginal: number[][] = [];
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::_width
    private _width: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneParser.as::_height
    private _height: number = 0;
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::_planes
    private _planes: RoomPlaneData[] = [];
    private _highlightPlanes: RoomPlaneData[] = [];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneParser.as::_fixedWallHeight
    private _fixedWallHeight: number = -1;
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::_floorHoles
    private _floorHoles: Map<number, RoomFloorHole> = new Map();
    private _floorHolesInverted: Map<number, RoomFloorHole> = new Map();
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneParser.as::_floorHoleMatrix
    private _floorHoleMatrix: boolean[][] = [];
    private _expandedTileMatrix: number[][] = [];

    constructor()
    {
        this._tileMatrix = [];
        this._tileMatrixOriginal = [];
        this._planes = [];
        this._highlightPlanes = [];
        this._floorHoleMatrix = [];
        this._wallHeight = 3.6;
        this._wallThicknessMultiplier = 1;
        this._floorThicknessMultiplier = 1;
        this._floorHoles = new Map();
        this._floorHolesInverted = new Map();
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneParser.as::_minX
    private _minX: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::get minX()
    get minX(): number
    {
        return this._minX;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneParser.as::_maxX
    private _maxX: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::get maxX()
    get maxX(): number
    {
        return this._maxX;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneParser.as::_minY
    private _minY: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::get minY()
    get minY(): number
    {
        return this._minY;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneParser.as::_maxY
    private _maxY: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::get maxY()
    get maxY(): number
    {
        return this._maxY;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneParser.as::_wallHeight
    private _wallHeight: number = 3.6;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::get wallHeight()
    get wallHeight(): number
    {
        if(this._fixedWallHeight !== -1) return this._fixedWallHeight + 3.6;
        return this._wallHeight;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::set wallHeight()
    set wallHeight(value: number)
    {
        if(value < 0) value = 0;
        this._wallHeight = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneParser.as::_wallThicknessMultiplier
    private _wallThicknessMultiplier: number = 1;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::get wallThicknessMultiplier()
    get wallThicknessMultiplier(): number
    {
        return this._wallThicknessMultiplier;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::set wallThicknessMultiplier()
    set wallThicknessMultiplier(value: number)
    {
        if(value < 0) value = 0;
        this._wallThicknessMultiplier = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneParser.as::_floorThicknessMultiplier
    private _floorThicknessMultiplier: number = 1;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::get floorThicknessMultiplier()
    get floorThicknessMultiplier(): number
    {
        return this._floorThicknessMultiplier;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::set floorThicknessMultiplier()
    set floorThicknessMultiplier(value: number)
    {
        if(value < 0) value = 0;
        this._floorThicknessMultiplier = value;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::_floorHeight
    private _floorHeight: number = 0;

    // Getters
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::get floorHeight()
    get floorHeight(): number
    {
        if(this._fixedWallHeight !== -1) return this._fixedWallHeight;
        return this._floorHeight;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::get tileMapWidth()
    get tileMapWidth(): number
    {
        return this._width;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::get tileMapHeight()
    get tileMapHeight(): number
    {
        return this._height;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::get planeCount()
    get planeCount(): number
    {
        return this._planes.length;
    }

    /**
	 * Append a second set of floor planes covering `(x, y, width, height)`, tracked separately so
	 * they can be sliced back off. They sit *after* every real plane in `_planes`, which is what lets
	 * the visualization give only them a filter.
	 *
	 * **The tile coordinates are multiplied by four** because the parser works on the expanded tile
	 * matrix — `expandFloorTiles()` subdivides every room tile into a 4x4 block, and the highlight has
	 * to be expressed in the same units as the planes it is overlaying.
	 */
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::initializeHighlightArea()
    initializeHighlightArea(x: number, y: number, width: number, height: number): void
    {
        this.clearHighlightArea();
        this.extractPlanes(this._expandedTileMatrix, x * 4, y * 4, width * 4, height * 4, true);
    }

    /**
	 * Drops the highlight planes and reports how many went, so the caller can release exactly that
	 * many sprites off the end.
	 */
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::clearHighlightArea()
    clearHighlightArea(): number
    {
        const removed = this._highlightPlanes.length;

        this._planes = this._planes.slice(0, this._planes.length - removed);
        this._highlightPlanes = [];

        return removed;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::isPlaneTemporaryHighlighter()
    isPlaneTemporaryHighlighter(index: number): boolean
    {
        if(index < 0 || index >= this.planeCount)
        {
            return false;
        }

        const plane = this._planes[index] ?? null;

        if(plane === null)
        {
            return false;
        }

        return this._highlightPlanes.indexOf(plane) !== -1;
    }

    // Static helper methods
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::getFloorHeight()
    private static getFloorHeight(tiles: number[][]): number
    {
        const length = tiles.length;
        if(length === 0) return 0;

        let maxHeight = 0;

        for(let y = 0; y < length; y++)
        {
            const row = tiles[y];
            for(let x = 0; x < row.length; x++)
            {
                const height = row[x];
                if(height > maxHeight) maxHeight = height;
            }
        }

        return maxHeight;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::findEntranceTile()
    private static findEntranceTile(tiles: number[][]): IPoint | null
    {
        if(tiles === null) return null;

        const height = tiles.length;
        if(height === 0) return null;

        const firstValidX: number[] = [];

        for(let y = 0; y < height; y++)
        {
            const row = tiles[y];
            if(row === null || row.length === 0) return null;

            let foundX = -1;
            for(let x = 0; x < row.length; x++)
            {
                if(row[x] >= 0)
                {
                    foundX = x;
                    break;
                }
            }

            if(foundX === -1)
            {
                firstValidX.push(row.length + 1);
            }
            else
            {
                firstValidX.push(foundX);
            }
        }

        for(let y = 1; y < firstValidX.length - 1; y++)
        {
            if(firstValidX[y] <= firstValidX[y - 1] - 1 &&
				firstValidX[y] <= firstValidX[y + 1] - 1)
            {
                return {x: firstValidX[y], y: y};
            }
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::expandFloorTiles()
    private static expandFloorTiles(tiles: number[][]): number[][]
    {
        const height = tiles.length;
        const width = tiles[0].length;

        const result: number[][] = [];
        for(let y = 0; y < height * 4; y++)
        {
            result[y] = new Array(width * 4).fill(0);
        }

        let resultY = 0;
        for(let y = 0; y < height; y++)
        {
            let resultX = 0;
            for(let x = 0; x < width; x++)
            {
                const tileHeight = tiles[y][x];

                if(tileHeight < 0 || tileHeight <= 255)
                {
                    for(let dy = 0; dy < 4; dy++)
                    {
                        for(let dx = 0; dx < 4; dx++)
                        {
                            result[resultY + dy][resultX + dx] = tileHeight < 0 ? tileHeight : tileHeight * 4;
                        }
                    }
                }
                else
                {
                    // Handle corner tiles with height variations
                    const baseHeight = (tileHeight & 255) * 4;
                    const corner0 = baseHeight + ((tileHeight >> 11) & 1) * 3;
                    const corner1 = baseHeight + ((tileHeight >> 10) & 1) * 3;
                    const corner2 = baseHeight + ((tileHeight >> 9) & 1) * 3;
                    const corner3 = baseHeight + ((tileHeight >> 8) & 1) * 3;

                    for(let i = 0; i < 3; i++)
                    {
                        const j = i + 1;
                        result[resultY][resultX + i] = Math.floor((corner0 * (3 - i) + corner1 * i) / 3);
                        result[resultY + 3][resultX + j] = Math.floor((corner2 * (3 - j) + corner3 * j) / 3);
                        result[resultY + j][resultX] = Math.floor((corner0 * (3 - j) + corner2 * j) / 3);
                        result[resultY + i][resultX + 3] = Math.floor((corner1 * (3 - i) + corner3 * i) / 3);
                    }

                    result[resultY + 1][resultX + 1] = corner0 > baseHeight ? baseHeight + 2 : baseHeight + 1;
                    result[resultY + 1][resultX + 2] = corner1 > baseHeight ? baseHeight + 2 : baseHeight + 1;
                    result[resultY + 2][resultX + 1] = corner2 > baseHeight ? baseHeight + 2 : baseHeight + 1;
                    result[resultY + 2][resultX + 2] = corner3 > baseHeight ? baseHeight + 2 : baseHeight + 1;
                }

                resultX += 4;
            }
            resultY += 4;
        }

        return result;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::addTileTypes()
    private static addTileTypes(tiles: number[][]): void
    {
        const height = tiles.length - 1;
        const width = tiles[0].length - 1;

        for(let y = 1; y < height; y++)
        {
            for(let x = 1; x < width; x++)
            {
                const tileHeight = tiles[y][x];
                if(tileHeight >= 0)
                {
                    const nw = tiles[y - 1][x - 1] & 255;
                    const n = tiles[y - 1][x] & 255;
                    const ne = tiles[y - 1][x + 1] & 255;
                    const w = tiles[y][x - 1] & 255;
                    const e = tiles[y][x + 1] & 255;
                    const sw = tiles[y + 1][x - 1] & 255;
                    const s = tiles[y + 1][x] & 255;
                    const se = tiles[y + 1][x + 1] & 255;

                    const higher = tileHeight + 1;
                    let corners = 0;

                    corners |= (nw === higher || n === higher || w === higher) ? 8 : 0;
                    corners |= (ne === higher || n === higher || e === higher) ? 4 : 0;
                    corners |= (sw === higher || s === higher || w === higher) ? 2 : 0;
                    corners |= (se === higher || s === higher || e === higher) ? 1 : 0;

                    if(corners === 15) corners = 0;

                    tiles[y][x] = tileHeight | (corners << 8);
                }
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::padHeightMap()
    private static padHeightMap(tiles: number[][]): void
    {
        for(const row of tiles)
        {
            row.push(RoomPlaneParser.TILE_BLOCKED);
            row.unshift(RoomPlaneParser.TILE_BLOCKED);
        }

        const width = tiles[0].length;
        const topRow = new Array(width).fill(RoomPlaneParser.TILE_BLOCKED);
        const bottomRow = new Array(width).fill(RoomPlaneParser.TILE_BLOCKED);

        tiles.push(bottomRow);
        tiles.unshift(topRow);
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::unpadHeightMap()
    private static unpadHeightMap(tiles: number[][]): void
    {
        tiles.shift();
        tiles.pop();

        for(const row of tiles)
        {
            row.shift();
            row.pop();
        }
    }

    // Public methods
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::dispose()
    dispose(): void
    {
        this._planes = [];
        this._tileMatrix = [];
        this._tileMatrixOriginal = [];
        this._floorHoleMatrix = [];
        this._floorHoles.clear();
        this._floorHolesInverted.clear();
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::reset()
    reset(): void
    {
        this._planes = [];
        this._tileMatrix = [];
        this._tileMatrixOriginal = [];
        this._highlightPlanes = [];
        this._width = 0;
        this._height = 0;
        this._minX = 0;
        this._maxX = 0;
        this._minY = 0;
        this._maxY = 0;
        this._floorHeight = 0;
        this._floorHoleMatrix = [];
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::initializeTileMap()
    initializeTileMap(width: number, height: number): boolean
    {
        if(width < 0) width = 0;
        if(height < 0) height = 0;

        this._tileMatrix = [];
        this._tileMatrixOriginal = [];
        this._floorHoleMatrix = [];

        for(let y = 0; y < height; y++)
        {
            const tileRow: number[] = [];
            const originalRow: number[] = [];
            const holeRow: boolean[] = [];

            for(let x = 0; x < width; x++)
            {
                tileRow[x] = RoomPlaneParser.TILE_BLOCKED;
                originalRow[x] = RoomPlaneParser.TILE_BLOCKED;
                holeRow[x] = false;
            }

            this._tileMatrix.push(tileRow);
            this._tileMatrixOriginal.push(originalRow);
            this._floorHoleMatrix.push(holeRow);
        }

        this._width = width;
        this._height = height;
        this._minX = this._width;
        this._maxX = -1;
        this._minY = this._height;
        this._maxY = -1;

        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::setTileHeight()
    setTileHeight(x: number, y: number, height: number): boolean
    {
        if(x >= 0 && x < this._width && y >= 0 && y < this._height)
        {
            this._tileMatrix[y][x] = height;

            if(height >= 0)
            {
                if(x < this._minX) this._minX = x;
                if(x > this._maxX) this._maxX = x;
                if(y < this._minY) this._minY = y;
                if(y > this._maxY) this._maxY = y;
            }
            else
            {
                // Update bounds if tile became blocked
                if(x === this._minX || x === this._maxX)
                {
                    let found = false;
                    for(let ty = this._minY; ty < this._maxY; ty++)
                    {
                        if(this.getTileHeightInternal(x, ty) >= 0)
                        {
                            found = true;
                            break;
                        }
                    }
                    if(!found)
                    {
                        if(x === this._minX) this._minX++;
                        if(x === this._maxX) this._maxX--;
                    }
                }

                if(y === this._minY || y === this._maxY)
                {
                    let found = false;
                    for(let tx = this._minX; tx < this._maxX; tx++)
                    {
                        if(this.getTileHeight(tx, y) >= 0)
                        {
                            found = true;
                            break;
                        }
                    }
                    if(!found)
                    {
                        if(y === this._minY) this._minY++;
                        if(y === this._maxY) this._maxY--;
                    }
                }
            }

            return true;
        }

        return false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::getTileHeight()
    getTileHeight(x: number, y: number): number
    {
        if(x < 0 || x >= this._width || y < 0 || y >= this._height)
        {
            return RoomPlaneParser.TILE_BLOCKED;
        }
        return Math.abs(this._tileMatrix[y][x]);
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::getTileHeightInternal()
    getTileHeightInternal(x: number, y: number): number
    {
        if(x < 0 || x >= this._width || y < 0 || y >= this._height)
        {
            return RoomPlaneParser.TILE_BLOCKED;
        }
        return this._tileMatrix[y][x];
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::initializeFromTileData()
    initializeFromTileData(fixedWallsHeight: number = -1, doorTile?: { x: number; y: number }): boolean
    {
        this._fixedWallHeight = fixedWallsHeight;

        // Copy tile matrix to original
        for(let y = 0; y < this._height; y++)
        {
            for(let x = 0; x < this._width; x++)
            {
                this._tileMatrixOriginal[y][x] = this._tileMatrix[y][x];
            }
        }

        // Use explicit door tile if provided, otherwise auto-detect from heightmap shape
        const entranceTile = doorTile ?? RoomPlaneParser.findEntranceTile(this._tileMatrix);

        // Apply floor holes
        for(let y = 0; y < this._height; y++)
        {
            for(let x = 0; x < this._width; x++)
            {
                if(this._floorHoleMatrix[y][x])
                {
                    this.setTileHeight(x, y, RoomPlaneParser.TILE_HOLE);
                }
            }
        }

        return this.initialize(entranceTile);
    }

    getPlane(index: number): RoomPlaneData | null
    {
        if(index < 0 || index >= this._planes.length)
        {
            return null;
        }
        return this._planes[index];
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::getPlaneLocation()
    getPlaneLocation(index: number): IVector3d | null
    {
        const plane = this.getPlane(index);
        if(plane !== null)
        {
            return plane.loc;
        }
        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::getPlaneLeftSide()
    getPlaneLeftSide(index: number): IVector3d | null
    {
        const plane = this.getPlane(index);
        if(plane !== null)
        {
            return plane.leftSide;
        }
        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::getPlaneRightSide()
    getPlaneRightSide(index: number): IVector3d | null
    {
        const plane = this.getPlane(index);
        if(plane !== null)
        {
            return plane.rightSide;
        }
        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::getPlaneNormal()
    getPlaneNormal(index: number): IVector3d | null
    {
        const plane = this.getPlane(index);
        if(plane !== null)
        {
            return plane.normal;
        }
        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::getPlaneNormalDirection()
    getPlaneNormalDirection(index: number): IVector3d | null
    {
        const plane = this.getPlane(index);
        if(plane !== null)
        {
            return plane.normalDirection;
        }
        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::getPlaneType()
    getPlaneType(index: number): number
    {
        const plane = this.getPlane(index);
        if(plane !== null)
        {
            return plane.type;
        }
        return RoomPlaneData.PLANE_UNDEFINED;
    }

    /**
     * The rectangle masks cut out of a plane — a door or a window opening, in the plane's own
     * left/right side units.
     *
     * These five delegate to `RoomPlaneData`, whose whole mask tier was already ported;
     * `RoomVisualization.createPlanesAndSprites()` is the one caller, and it replays them onto the
     * plane with `addRectangleMask()`. That call was missing, which left `RoomPlane`'s
     * `_rectangleMasks` permanently empty and `addRectangleMask()` with no call site at all.
     *
     * They answer 0 / -1 out of range exactly as AS3 does, and `maskCount` is 0 for every plane the
     * *current* build produces: `RoomPlaneData.addMask()` has no call site in the primary tree
     * either, so the only thing that can fill this list is a future producer. The chain is wired
     * end to end so that producer works the day it lands, rather than being one more thing to find.
     */
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::getPlaneMaskCount()
    getPlaneMaskCount(index: number): number
    {
        const plane = this.getPlane(index);
        if(plane !== null)
        {
            return plane.maskCount;
        }
        return 0;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::getPlaneMaskLeftSideLoc()
    getPlaneMaskLeftSideLoc(index: number, maskIndex: number): number
    {
        const plane = this.getPlane(index);
        if(plane !== null)
        {
            return plane.getMaskLeftSideLoc(maskIndex);
        }
        return -1;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::getPlaneMaskRightSideLoc()
    getPlaneMaskRightSideLoc(index: number, maskIndex: number): number
    {
        const plane = this.getPlane(index);
        if(plane !== null)
        {
            return plane.getMaskRightSideLoc(maskIndex);
        }
        return -1;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::getPlaneMaskLeftSideLength()
    getPlaneMaskLeftSideLength(index: number, maskIndex: number): number
    {
        const plane = this.getPlane(index);
        if(plane !== null)
        {
            return plane.getMaskLeftSideLength(maskIndex);
        }
        return -1;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::getPlaneMaskRightSideLength()
    getPlaneMaskRightSideLength(index: number, maskIndex: number): number
    {
        const plane = this.getPlane(index);
        if(plane !== null)
        {
            return plane.getMaskRightSideLength(maskIndex);
        }
        return -1;
    }

    // DEVIATION: the port is handed an already-built parser instead of the XML round-trip AS3 goes
    //   through, so neither the reader nor the writer has anything to do. `RoomLogic.initialize()`
    //   takes this `RoomPlaneParser` where AS3 takes an `XML` and stores `room_plane_xml` on the
    //   model; `RoomEngine` puts the same instance under `ROOM_PLANE_PARSER` and
    //   `RoomVisualization.initializeRoomPlanes()` reads that object. The check behind the claim:
    //   AS3's `initializeFromXML()` parses `tileMap`/`holeMap` and then calls
    //   `initializeFromTileData()` — which this port has and calls directly — so the XML carries no
    //   information the parser did not already hold. `getXML()` exists only to feed that reader
    //   back (`RoomEngine`, `RoomPreviewer`, `GameArenaView` all pass the serialised parser to
    //   `initializeRoom()`), and those call sites pass the parser itself here.
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::initializeFromXML()
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::getXML()

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::getPlaneSecondaryNormals()
    getPlaneSecondaryNormals(index: number): IVector3d[]
    {
        const plane = this.getPlane(index);
        if(plane === null)
        {
            return [];
        }

        const result: IVector3d[] = [];
        for(let i = 0; i < plane.secondaryNormalCount; i++)
        {
            const normal = plane.getSecondaryNormal(i);
            if(normal !== null)
            {
                result.push(normal);
            }
        }
        return result;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::addFloorHole()
    addFloorHole(id: number, x: number, y: number, width: number, height: number, invert: boolean = false): void
    {
        const hole = new RoomFloorHole(x, y, width, height);

        if(invert)
        {
            this._floorHolesInverted.set(id, hole);
        }
        else
        {
            this._floorHoles.set(id, hole);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::removeFloorHole()
    removeFloorHole(id: number): void
    {
        this._floorHoles.delete(id);
        this._floorHolesInverted.delete(id);
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::resetFloorHoles()
    resetFloorHoles(): void
    {
        this._floorHoles.clear();
        this._floorHolesInverted.clear();
    }

    // Private methods
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::initialize()
    private initialize(entranceTile: IPoint | null): boolean
    {
        let entranceHeight = 0;

        if(entranceTile !== null)
        {
            entranceHeight = this.getTileHeight(entranceTile.x, entranceTile.y);
            this.setTileHeight(entranceTile.x, entranceTile.y, RoomPlaneParser.TILE_BLOCKED);
        }

        this._floorHeight = RoomPlaneParser.getFloorHeight(this._tileMatrix);
        this.createWallPlanes();

        // Copy and expand tiles for floor plane extraction
        const tilesCopy: number[][] = [];
        for(const row of this._tileMatrix)
        {
            tilesCopy.push([...row]);
        }

        RoomPlaneParser.padHeightMap(tilesCopy);
        RoomPlaneParser.addTileTypes(tilesCopy);
        RoomPlaneParser.unpadHeightMap(tilesCopy);

        this._expandedTileMatrix = RoomPlaneParser.expandFloorTiles(tilesCopy);
        this.extractPlanes(this._expandedTileMatrix);

        // Add entrance floor tile
        if(entranceTile !== null)
        {
            this.setTileHeight(entranceTile.x, entranceTile.y, entranceHeight);
            this.addFloor(
                new Vector3d(entranceTile.x + 0.5, entranceTile.y + 0.5, entranceHeight),
                new Vector3d(-1, 0, 0),
                new Vector3d(0, -1, 0),
                false, false, false, false
            );
        }

        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::createWallPlanes()
    private createWallPlanes(): boolean
    {
        const tiles = this._tileMatrix;
        if(tiles === null) return false;

        const height = tiles.length;
        if(height === 0) return false;

        let width = 0;
        for(let y = 0; y < height; y++)
        {
            const row = tiles[y];
            if(row === null || row.length === 0) return false;
            if(width > 0)
            {
                width = Math.min(width, row.length);
            }
            else
            {
                width = row.length;
            }
        }

        const maxAdditionalHeight = Math.min(20, this._fixedWallHeight !== -1 ? this._fixedWallHeight : RoomPlaneParser.getFloorHeight(tiles));

        // Find starting point for wall tracing
        const startX = this.minX;
        let startY: number;

        for(startY = this.minY; startY <= this.maxY; startY++)
        {
            if(this.getTileHeightInternal(startX, startY) > RoomPlaneParser.TILE_HOLE)
            {
                startY--;
                break;
            }
        }

        if(startY > this.maxY) return false;

        const startPoint: IPoint = {x: startX, y: startY};
        const wallData = this.generateWallData(startPoint, true);
        const wallDataOriginal = this.generateWallData(startPoint, false);

        if(wallData !== null && wallDataOriginal !== null)
        {
            this.checkWallHiding(wallData, wallDataOriginal);
            this.addWalls(wallData, wallDataOriginal);
        }

        // Set blocked tiles to negative wall height
        for(let y = 0; y < this.tileMapHeight; y++)
        {
            for(let x = 0; x < this.tileMapWidth; x++)
            {
                if(this.getTileHeightInternal(x, y) < 0)
                {
                    this.setTileHeight(x, y, -(maxAdditionalHeight + this.wallHeight));
                }
            }
        }

        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::generateWallData()
    private generateWallData(startPoint: IPoint, includeHoles: boolean): RoomWallData | null
    {
        const wallData = new RoomWallData();
        const extractors = [
            this.extractTopWall.bind(this),
            this.extractRightWall.bind(this),
            this.extractBottomWall.bind(this),
            this.extractLeftWall.bind(this),
        ];

        let direction = 0;
        let currentPoint: IPoint = {x: startPoint.x, y: startPoint.y};
        let iterations = 0;

        while(iterations++ < 1000)
        {
            let isBorder = false;
            let isLeftTurn = false;

            if(currentPoint.x < this.minX || currentPoint.x > this.maxX ||
				currentPoint.y < this.minY || currentPoint.y > this.maxY)
            {
                isBorder = true;
            }

            const nextPoint = extractors[direction](currentPoint, includeHoles);

            if(nextPoint === null) return null;

            let length = Math.abs(nextPoint.x - currentPoint.x) + Math.abs(nextPoint.y - currentPoint.y);

            // Save the travel direction BEFORE updating it for the next segment
            const travelDirection = direction;

            if(currentPoint.x === nextPoint.x || currentPoint.y === nextPoint.y)
            {
                direction = (direction - 1 + 4) % 4;
                length += 1;
                isLeftTurn = true;
            }
            else
            {
                direction = (direction + 1) % 4;
                length -= 1;
            }

            // Use the SAVED travelDirection, not the updated direction
            wallData.addWall(currentPoint, travelDirection, length, isBorder, isLeftTurn);

            if(nextPoint.x === startPoint.x && nextPoint.y === startPoint.y &&
				(nextPoint.x !== currentPoint.x || nextPoint.y !== currentPoint.y))
            {
                break;
            }

            currentPoint = nextPoint;
        }

        if(wallData.count === 0) return null;

        return wallData;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::extractTopWall()
    private extractTopWall(point: IPoint, includeHoles: boolean): IPoint | null
    {
        if(point === null) return null;

        let step = 1;
        const threshold = includeHoles ? RoomPlaneParser.TILE_HOLE : RoomPlaneParser.TILE_BLOCKED;

        while(step < 1000)
        {
            if(this.getTileHeightInternal(point.x + step, point.y) > threshold)
            {
                return {x: point.x + step - 1, y: point.y};
            }
            if(this.getTileHeightInternal(point.x + step, point.y + 1) <= threshold)
            {
                return {x: point.x + step, y: point.y + 1};
            }
            step++;
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::extractRightWall()
    private extractRightWall(point: IPoint, includeHoles: boolean): IPoint | null
    {
        if(point === null) return null;

        let step = 1;
        const threshold = includeHoles ? RoomPlaneParser.TILE_HOLE : RoomPlaneParser.TILE_BLOCKED;

        while(step < 1000)
        {
            if(this.getTileHeightInternal(point.x, point.y + step) > threshold)
            {
                return {x: point.x, y: point.y + step - 1};
            }
            if(this.getTileHeightInternal(point.x - 1, point.y + step) <= threshold)
            {
                return {x: point.x - 1, y: point.y + step};
            }
            step++;
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::extractBottomWall()
    private extractBottomWall(point: IPoint, includeHoles: boolean): IPoint | null
    {
        if(point === null) return null;

        let step = 1;
        const threshold = includeHoles ? RoomPlaneParser.TILE_HOLE : RoomPlaneParser.TILE_BLOCKED;

        while(step < 1000)
        {
            if(this.getTileHeightInternal(point.x - step, point.y) > threshold)
            {
                return {x: point.x - step + 1, y: point.y};
            }
            if(this.getTileHeightInternal(point.x - step, point.y - 1) <= threshold)
            {
                return {x: point.x - step, y: point.y - 1};
            }
            step++;
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::extractLeftWall()
    private extractLeftWall(point: IPoint, includeHoles: boolean): IPoint | null
    {
        if(point === null) return null;

        let step = 1;
        const threshold = includeHoles ? RoomPlaneParser.TILE_HOLE : RoomPlaneParser.TILE_BLOCKED;

        while(step < 1000)
        {
            if(this.getTileHeightInternal(point.x, point.y - step) > threshold)
            {
                return {x: point.x, y: point.y - step + 1};
            }
            if(this.getTileHeightInternal(point.x + 1, point.y - step) <= threshold)
            {
                return {x: point.x + 1, y: point.y - step};
            }
            step++;
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::checkWallHiding()
    private checkWallHiding(wallData: RoomWallData, originalWallData: RoomWallData | null): void
    {
        // AS3: hidePeninsulaWallChains uses param2 (originalWallData), NOT wallData
        // This is important because originalWallData has the original wall structure
        // before floor holes are applied
        if(originalWallData !== null)
        {
            this.hidePeninsulaWallChains(originalWallData);
        }
        this.updateWallsNextToHoles(wallData);

        if(originalWallData !== null)
        {
            this.hideOriginallyHiddenWalls(wallData, originalWallData);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::hidePeninsulaWallChains()
    private hidePeninsulaWallChains(wallData: RoomWallData): void
    {
        const count = wallData.count;
        let i = 0;

        while(i < count)
        {
            const chainStart = i;
            let chainEnd = i;
            let leftTurnCount = 0;
            let shouldHide = false;

            while(!wallData.getBorder(i) && i < count)
            {
                if(wallData.getLeftTurn(i))
                {
                    leftTurnCount++;
                }
                else if(leftTurnCount > 0)
                {
                    leftTurnCount--;
                }

                if(leftTurnCount > 1)
                {
                    shouldHide = true;
                }

                chainEnd = i;
                i++;
            }

            if(shouldHide)
            {
                for(let j = chainStart; j <= chainEnd; j++)
                {
                    wallData.setHideWall(j, true);
                }
            }

            i++;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::updateWallsNextToHoles()
    private updateWallsNextToHoles(wallData: RoomWallData): void
    {
        const count = wallData.count;

        for(let i = 0; i < count; i++)
        {
            if(!wallData.getHideWall(i))
            {
                const corner = wallData.getCorner(i);
                const direction = wallData.getDirection(i);
                const length = wallData.getLength(i);
                const dirVector = RoomWallData.WALL_DIRECTION_VECTORS[direction];
                const normalVector = RoomWallData.WALL_NORMAL_VECTORS[direction];

                let holeCount = 0;

                for(let j = 0; j < length; j++)
                {
                    const checkX = corner.x + j * dirVector.x - normalVector.x;
                    const checkY = corner.y + j * dirVector.y - normalVector.y;

                    if(this.getTileHeightInternal(checkX, checkY) === RoomPlaneParser.TILE_HOLE)
                    {
                        if(j > 0 && holeCount === 0)
                        {
                            wallData.setLength(i, j);
                            break;
                        }
                        holeCount++;
                    }
                    else if(holeCount > 0)
                    {
                        wallData.moveCorner(i, holeCount);
                        break;
                    }
                }

                if(holeCount === length)
                {
                    wallData.setHideWall(i, true);
                }
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::hideOriginallyHiddenWalls()
    private hideOriginallyHiddenWalls(wallData: RoomWallData, originalWallData: RoomWallData): void
    {
        const count = wallData.count;

        for(let i = 0; i < count; i++)
        {
            if(!wallData.getHideWall(i))
            {
                const corner = wallData.getCorner(i);
                const endPoint: IPoint = {x: corner.x, y: corner.y};
                const dirVector = RoomWallData.WALL_DIRECTION_VECTORS[wallData.getDirection(i)];
                const length = wallData.getLength(i);

                endPoint.x += dirVector.x * length;
                endPoint.y += dirVector.y * length;

                const originalIndex = this.resolveOriginalWallIndex(corner, endPoint, originalWallData);

                if(originalIndex >= 0 && originalWallData.getHideWall(originalIndex))
                {
                    wallData.setHideWall(i, true);
                }
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::resolveOriginalWallIndex()
    private resolveOriginalWallIndex(start: IPoint, end: IPoint, wallData: RoomWallData): number
    {
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);

        const count = wallData.count;

        for(let i = 0; i < count; i++)
        {
            const corner = wallData.getCorner(i);
            const wallEnd = wallData.getEndPoint(i);

            if(start.x === end.x)
            {
                if(corner.x === start.x && wallEnd.x === start.x)
                {
                    const wallMinY = Math.min(corner.y, wallEnd.y);
                    const wallMaxY = Math.max(corner.y, wallEnd.y);

                    if(wallMinY <= minY && maxY <= wallMaxY)
                    {
                        return i;
                    }
                }
            }
            else if(start.y === end.y)
            {
                if(corner.y === start.y && wallEnd.y === start.y)
                {
                    const wallMinX = Math.min(corner.x, wallEnd.x);
                    const wallMaxX = Math.max(corner.x, wallEnd.x);

                    if(wallMinX <= minX && maxX <= wallMaxX)
                    {
                        return i;
                    }
                }
            }
        }

        return -1;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::addWalls()
    private addWalls(wallData: RoomWallData, originalWallData: RoomWallData): void
    {
        const count = wallData.count;
        const originalCount = originalWallData.count;

        for(let i = 0; i < count; i++)
        {
            if(!wallData.getHideWall(i))
            {
                const corner = wallData.getCorner(i);
                const direction = wallData.getDirection(i);
                const length = wallData.getLength(i);
                const dirVector = RoomWallData.WALL_DIRECTION_VECTORS[direction];
                const normalVector = RoomWallData.WALL_NORMAL_VECTORS[direction];

                // Find minimum floor height along wall
                let minFloorHeight = -1;
                for(let j = 0; j < length; j++)
                {
                    const checkX = corner.x + j * dirVector.x + normalVector.x;
                    const checkY = corner.y + j * dirVector.y + normalVector.y;
                    const tileHeight = this.getTileHeightInternal(checkX, checkY);

                    if(tileHeight >= 0 && (tileHeight < minFloorHeight || minFloorHeight < 0))
                    {
                        minFloorHeight = tileHeight;
                    }
                }

                const floorHeight = minFloorHeight;

                // Calculate wall position and vectors
                let loc = new Vector3d(corner.x, corner.y, floorHeight);
                loc = Vector3d.sum(loc, Vector3d.product(normalVector, 0.5)!)!;
                loc = Vector3d.sum(loc, Vector3d.product(dirVector, -0.5)!)!;

                const wallHeightTotal = this.wallHeight + Math.min(20, this.floorHeight) - minFloorHeight;
                const leftSide = Vector3d.product(dirVector, -length)!;
                const rightSide = new Vector3d(0, 0, wallHeightTotal);

                loc = Vector3d.dif(loc, leftSide)!;

                // Determine corner directions
                let nextDirection: number;
                let prevDirection: number;

                const originalIndex = this.resolveOriginalWallIndex(corner, wallData.getEndPoint(i), originalWallData);

                if(originalIndex >= 0)
                {
                    nextDirection = originalWallData.getDirection((originalIndex + 1) % originalCount);
                    prevDirection = originalWallData.getDirection((originalIndex - 1 + originalCount) % originalCount);
                }
                else
                {
                    nextDirection = wallData.getDirection((i + 1) % count);
                    prevDirection = wallData.getDirection((i - 1 + count) % count);
                }

                let cornerNormal: IVector3d | null = null;

                if((nextDirection - direction + 4) % 4 === 3)
                {
                    cornerNormal = RoomWallData.WALL_NORMAL_VECTORS[nextDirection];
                }
                else if((direction - prevDirection + 4) % 4 === 3)
                {
                    cornerNormal = RoomWallData.WALL_NORMAL_VECTORS[prevDirection];
                }

                const isLeftTurn = wallData.getLeftTurn(i);
                const prevIsLeftTurn = wallData.getLeftTurn((i - 1 + count) % count);
                const nextIsHidden = wallData.getHideWall((i + 1) % count);
                const isManuallyLeftCut = wallData.getManuallyLeftCut(i);
                const isManuallyRightCut = wallData.getManuallyRightCut(i);

                this.addWall(
                    loc, leftSide, rightSide, cornerNormal,
                    !prevIsLeftTurn || isManuallyLeftCut,
                    !isLeftTurn || isManuallyRightCut,
                    !nextIsHidden
                );
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::addWall()
    private addWall(
        loc: IVector3d,
        leftSide: IVector3d,
        rightSide: IVector3d,
        cornerNormal: IVector3d | null,
        addLeftEdge: boolean,
        addRightEdge: boolean,
        addCorner: boolean
    ): void
    {
        // Add wall plane
        this.addPlane(RoomPlaneData.PLANE_WALL, loc, leftSide, rightSide, cornerNormal ? [cornerNormal] : null);

        // Add landscape plane
        this.addPlane(RoomPlaneData.PLANE_LANDSCAPE, loc, leftSide, rightSide, cornerNormal ? [cornerNormal] : null);

        // Add wall thickness planes
        const wallThickness = RoomPlaneParser.WALL_THICKNESS * this._wallThicknessMultiplier;
        const floorThickness = RoomPlaneParser.FLOOR_THICKNESS * this._floorThicknessMultiplier;

        const normal = Vector3d.crossProduct(leftSide, rightSide)!;
        const thicknessVector = Vector3d.product(normal, (1 / normal.length) * -wallThickness)!;

        // Top edge
        this.addPlane(
            RoomPlaneData.PLANE_WALL,
            Vector3d.sum(loc, rightSide)!,
            leftSide,
            thicknessVector,
            [normal, cornerNormal].filter((n): n is IVector3d => n !== null)
        );

        // Left edge
        if(addLeftEdge)
        {
            const leftEdgeRightSide = Vector3d.product(rightSide, -(rightSide.length + floorThickness) / rightSide.length)!;
            this.addPlane(
                RoomPlaneData.PLANE_WALL,
                Vector3d.sum(Vector3d.sum(loc, leftSide)!, rightSide)!,
                leftEdgeRightSide,
                thicknessVector,
                [normal, cornerNormal].filter((n): n is IVector3d => n !== null)
            );
        }

        // Right edge
        if(addRightEdge)
        {
            const rightEdgeLeftSide = Vector3d.product(rightSide, (rightSide.length + floorThickness) / rightSide.length)!;
            const rightEdgeLoc = Vector3d.sum(loc, Vector3d.product(rightSide, -floorThickness / rightSide.length)!)!;
            this.addPlane(
                RoomPlaneData.PLANE_WALL,
                rightEdgeLoc,
                rightEdgeLeftSide,
                thicknessVector,
                [normal, cornerNormal].filter((n): n is IVector3d => n !== null)
            );

            // Corner piece
            if(addCorner)
            {
                const cornerLeftSide = Vector3d.product(leftSide, wallThickness / leftSide.length)!;
                this.addPlane(
                    RoomPlaneData.PLANE_WALL,
                    Vector3d.sum(Vector3d.sum(loc, rightSide)!, Vector3d.product(cornerLeftSide, -1)!)!,
                    cornerLeftSide,
                    thicknessVector,
                    [normal, leftSide, cornerNormal].filter((n): n is IVector3d => n !== null)
                );
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::addFloor()
    private addFloor(
        loc: IVector3d,
        leftSide: IVector3d,
        rightSide: IVector3d,
        addRight: boolean,
        addLeft: boolean,
        addBottom: boolean,
        addTop: boolean,
        isHighlight: boolean = false
    ): void
    {
        const plane = this.addPlane(RoomPlaneData.PLANE_FLOOR, loc, leftSide, rightSide, null, isHighlight);

        if(plane !== null)
        {
            const floorThickness = RoomPlaneParser.FLOOR_THICKNESS * this._floorThicknessMultiplier;
            const thicknessVector = new Vector3d(0, 0, floorThickness);
            const bottomLoc = Vector3d.dif(loc, thicknessVector)!;

            // AS3 param6: addBottom edge
            if(addBottom)
            {
                this.addPlane(RoomPlaneData.PLANE_FLOOR, bottomLoc, leftSide, thicknessVector, null, isHighlight);
            }

            // AS3 param7: addTop edge
            if(addTop)
            {
                this.addPlane(
                    RoomPlaneData.PLANE_FLOOR,
                    Vector3d.sum(Vector3d.sum(bottomLoc, leftSide)!, rightSide)!,
                    Vector3d.product(leftSide, -1)!,
                    thicknessVector,
                    null,
                    isHighlight
                );
            }

            // AS3 param4: addRight edge
            if(addRight)
            {
                this.addPlane(
                    RoomPlaneData.PLANE_FLOOR,
                    Vector3d.sum(bottomLoc, rightSide)!,
                    Vector3d.product(rightSide, -1)!,
                    thicknessVector,
                    null,
                    isHighlight
                );
            }

            // AS3 param5: addLeft edge
            if(addLeft)
            {
                this.addPlane(
                    RoomPlaneData.PLANE_FLOOR,
                    Vector3d.sum(bottomLoc, leftSide)!,
                    rightSide,
                    thicknessVector,
                    null,
                    isHighlight
                );
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::addPlane()
    private addPlane(
        type: number,
        loc: IVector3d,
        leftSide: IVector3d,
        rightSide: IVector3d,
        secondaryNormals: IVector3d[] | null = null,
        isHighlight: boolean = false
    ): RoomPlaneData | null
    {
        if(leftSide.length === 0 || rightSide.length === 0)
        {
            return null;
        }

        const plane = new RoomPlaneData(type, loc, leftSide, rightSide, secondaryNormals);
        this._planes.push(plane);

        if(isHighlight)
        {
            this._highlightPlanes.push(plane);
        }

        return plane;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneParser.as::extractPlanes()
    private extractPlanes(
        tiles: number[][],
        startX: number = 0,
        startY: number = 0,
        limitWidth: number = -1,
        limitHeight: number = -1,
        isHighlight: boolean = false
    ): void
    {
        const height = tiles.length;
        const width = tiles[0].length;

        const endY = limitHeight === -1 ? height : Math.min(height, startY + limitHeight);
        const endX = limitWidth === -1 ? width : Math.min(width, startX + limitWidth);

        // Track processed tiles
        const processed: boolean[][] = [];
        for(let y = 0; y < endY; y++)
        {
            processed[y] = new Array(endX).fill(false);
        }

        for(let y = startY; y < endY; y++)
        {
            for(let x = startX; x < endX; x++)
            {
                const tileHeight = tiles[y][x];

                // Skip blocked tiles or already processed
                if(tileHeight < 0 || processed[y][x]) continue;

                // Check edges
                const hasLeftEdge = x === 0 || tiles[y][x - 1] !== tileHeight;
                const hasTopEdge = y === 0 || tiles[y - 1][x] !== tileHeight;

                // Find width of same-height rectangle
                let rectWidth = x + 1;
                while(rectWidth < endX)
                {
                    if(tiles[y][rectWidth] !== tileHeight ||
						processed[y][rectWidth] ||
						(y > 0 && (tiles[y - 1][rectWidth] === tileHeight) === hasTopEdge))
                    {
                        break;
                    }
                    rectWidth++;
                }

                let hasRightEdge = rectWidth === width || tiles[y][rectWidth] !== tileHeight;

                // Find height of same-height rectangle
                let done = false;
                let rectHeight = y + 1;
                let hasBottomEdge = false;

                while(rectHeight <= endY && !done)
                {
                    hasBottomEdge = rectHeight === height || tiles[rectHeight][x] !== tileHeight;

                    done = rectHeight === endY ||
						hasBottomEdge ||
						(x > 0 && (tiles[rectHeight][x - 1] === tileHeight) === hasLeftEdge) ||
						(rectWidth < width && (tiles[rectHeight][rectWidth] === tileHeight) === hasRightEdge);

                    if(rectHeight === height) break;

                    for(let checkX = x; checkX < rectWidth; checkX++)
                    {
                        if((tiles[rectHeight][checkX] === tileHeight) === hasBottomEdge)
                        {
                            done = true;
                            rectWidth = checkX;
                            break;
                        }
                    }

                    if(done) break;
                    rectHeight++;
                }

                if(!hasBottomEdge)
                {
                    hasBottomEdge = rectHeight === height;
                }

                // rectWidth may have shrunk during the height scan (line ~1380), so hasRightEdge
                // must be recomputed against the final rectWidth (AS3: RoomPlaneParser.as:1673)
                hasRightEdge = rectWidth === width || tiles[y][rectWidth] !== tileHeight;

                // Mark tiles as processed
                for(let py = y; py < rectHeight; py++)
                {
                    for(let px = x; px < rectWidth; px++)
                    {
                        processed[py][px] = true;
                    }
                }

                // Calculate floor plane dimensions
                const planeX = x / 4 - 0.5;
                const planeY = y / 4 - 0.5;
                const planeWidth = (rectWidth - x) / 4;
                const planeHeight = (rectHeight - y) / 4;

                this.addFloor(
                    new Vector3d(planeX + planeWidth, planeY + planeHeight, tileHeight / 4),
                    new Vector3d(-planeWidth, 0, 0),
                    new Vector3d(0, -planeHeight, 0),
                    hasRightEdge,
                    hasLeftEdge,
                    hasBottomEdge,
                    hasTopEdge,
                    isHighlight
                );
            }
        }
    }
}
