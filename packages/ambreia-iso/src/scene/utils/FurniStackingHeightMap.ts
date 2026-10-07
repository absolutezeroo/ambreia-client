/**
 * FurniStackingHeightMap
 *
 * @see source_as_flash/com/sulake/habbo/room/utils/FurniStackingHeightMap.as
 *
 * Tracks furniture stacking heights per tile and validates placement positions.
 * Uses flat 1D arrays for efficient access.
 */
export class FurniStackingHeightMap
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/FurniStackingHeightMap.as::_heightMap
    private _heightMap: number[];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/FurniStackingHeightMap.as::_isNotStackable
    private _isNotStackable: boolean[];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/FurniStackingHeightMap.as::_isRoomTile
    private _isRoomTile: boolean[];

    constructor(width: number, height: number)
    {
        this._width = width;
        this._height = height;
        const size = width * height;
        this._heightMap = new Array(size).fill(0);
        this._isNotStackable = new Array(size).fill(false);
        this._isRoomTile = new Array(size).fill(false);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/FurniStackingHeightMap.as::_width
    private _width: number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/FurniStackingHeightMap.as::get width()
    get width(): number
    {
        return this._width;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/FurniStackingHeightMap.as::_height
    private _height: number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/FurniStackingHeightMap.as::get height()
    get height(): number
    {
        return this._height;
    }

    /**
	 * Get tile height at position.
	 */
    getTileHeight(x: number, y: number): number
    {
        if(x < 0 || x >= this._width || y < 0 || y >= this._height) return 0;

        return this._heightMap[y * this._width + x];
    }

    /**
	 * Set tile height at position.
	 * Based on AS3 FurniStackingHeightMap._Str_3982()
	 */
    setTileHeight(x: number, y: number, height: number): void
    {
        if(x < 0 || x >= this._width || y < 0 || y >= this._height) return;

        this._heightMap[y * this._width + x] = height;
    }

    /**
	 * Set whether stacking is blocked on a tile.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/FurniStackingHeightMap.as::setStackingBlocked()
    setStackingBlocked(x: number, y: number, blocked: boolean): void
    {
        if(x < 0 || x >= this._width || y < 0 || y >= this._height) return;

        this._isNotStackable[y * this._width + x] = blocked;
    }

    /**
	 * Check if stacking is blocked on a tile.
	 */
    isStackingBlocked(x: number, y: number): boolean
    {
        if(x < 0 || x >= this._width || y < 0 || y >= this._height) return true;

        return this._isNotStackable[y * this._width + x];
    }

    /**
	 * Set whether a position is a valid room tile.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/FurniStackingHeightMap.as::setIsRoomTile()
    setIsRoomTile(x: number, y: number, isRoom: boolean): void
    {
        if(x < 0 || x >= this._width || y < 0 || y >= this._height) return;

        this._isRoomTile[y * this._width + x] = isRoom;
    }

    /**
	 * Check if a position is a valid room tile.
	 */
    getIsRoomTile(x: number, y: number): boolean
    {
        if(x < 0 || x >= this._width || y < 0 || y >= this._height) return false;

        return this._isRoomTile[y * this._width + x];
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/FurniStackingHeightMap.as::validPosition()
    private validPosition(x: number, y: number): boolean
    {
        return x >= 0 && x < this._width && y >= 0 && y < this._height;
    }

    /**
	 * Validate whether furniture can be placed at a location.
	 *
	 * @param x - Target X position
	 * @param y - Target Y position
	 * @param sizeX - Furniture width
	 * @param sizeY - Furniture depth
	 * @param limitX - Limit rectangle X (the object's own current footprint, ignored by the scan)
	 * @param limitY - Limit rectangle Y
	 * @param limitSizeX - Limit rectangle width
	 * @param limitSizeY - Limit rectangle height
	 * @param alwaysStackable - furniture_always_stackable: only require room tiles, skip the
	 *                          stacking-blocked and height-equality checks
	 * @param referenceHeight - Height every scanned tile must match (±0.01); -1 derives it from
	 *                          the target tile
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/FurniStackingHeightMap.as::validateLocation()
    validateLocation(
        x: number, y: number,
        sizeX: number, sizeY: number,
        limitX: number, limitY: number,
        limitSizeX: number, limitSizeY: number,
        alwaysStackable: boolean,
        referenceHeight: number = -1
    ): boolean
    {
        if(!this.validPosition(x, y) || !this.validPosition(x + sizeX - 1, y + sizeY - 1))
        {
            return false;
        }

        // An out-of-range limit rectangle collapses to the origin rather than carving a hole out
        // of negative/overflowing coordinates, and is clamped to the map so it can never mask
        // tiles past the far edge.
        if(limitX < 0 || limitX >= this._width) limitX = 0;
        if(limitY < 0 || limitY >= this._height) limitY = 0;

        limitSizeX = Math.min(limitSizeX, this._width - limitX);
        limitSizeY = Math.min(limitSizeY, this._height - limitY);

        // The reference is the target tile's own height, not the first tile the scan happens to
        // reach: those differ whenever the target tile itself falls inside the limit rectangle
        // (i.e. the object is being nudged onto a spot it already partly occupies), and the scan
        // skips it. Every scanned tile must sit at that same height for the footprint to be flat.
        if(referenceHeight === -1) referenceHeight = this.getTileHeight(x, y);

        for(let iy = y; iy < y + sizeY; iy++)
        {
            for(let ix = x; ix < x + sizeX; ix++)
            {
                // Tiles inside the limit rectangle are the object's own, so they are not obstacles.
                if(ix < limitX || ix >= limitX + limitSizeX || iy < limitY || iy >= limitY + limitSizeY)
                {
                    const idx = iy * this._width + ix;

                    if(alwaysStackable)
                    {
                        if(!this._isRoomTile[idx]) return false;
                    }
                    else if(this._isNotStackable[idx] || !this._isRoomTile[idx]
						|| Math.abs(this._heightMap[idx] - referenceHeight) > 0.01)
                    {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/FurniStackingHeightMap.as::dispose()
    dispose(): void
    {
        // AS3 also zeroes the dimensions: leaving them set while the arrays are empty
        // keeps validPosition() passing, so getTileHeight() reads undefined out of an
        // empty array (→ NaN downstream) instead of returning 0.
        this._heightMap = [];
        this._isNotStackable = [];
        this._isRoomTile = [];
        this._width = 0;
        this._height = 0;
    }
}
