/**
 * RoomVisualization
 *
 * Based on AS3: com.sulake.habbo.room.object.visualization.room.RoomVisualization
 *
 * Main visualization class for room rendering. Creates and manages planes
 * (floors, walls, landscapes) from RoomPlaneParser data.
 */
import type {IRoomGeometry} from '@room/utils/IRoomGeometry';
import type {IRoomObjectSprite} from '@room/object/visualization/IRoomObjectSprite';
import type {IRoomObjectVisualizationData} from '@room/object/visualization/IRoomObjectVisualizationData';
import {RoomObjectSpriteVisualization} from '@room/object/visualization/RoomObjectSpriteVisualization';
import {RoomObjectSpriteType} from '@room/object/enum/RoomObjectSpriteType';
import {RoomPlane} from './RoomPlane';
import {Vector3d} from '@room/utils/Vector3d';
import {RoomPlaneData} from '@habbo/room/object/RoomPlaneData';
import {RoomObjectVariableEnum} from '@habbo/room/object/RoomObjectVariableEnum';
import type {RoomPlaneParser} from '@habbo/room/object/RoomPlaneParser';
import {RoomVisualizationData} from './RoomVisualizationData';
import {RoomPlaneBitmapMaskParser} from '@habbo/room/object/RoomPlaneBitmapMaskParser';
import type {IRoomObjectModel} from '@room/object/IRoomObjectModel';
import {Logger} from "@core";

const log = Logger.getLogger('habbo.room.object.visualization.room.RoomVisualization');

export class RoomVisualization extends RoomObjectSpriteVisualization
{
    // Floor colors (AS3: RoomVisualization.as lines 26-28)
    public static readonly FLOOR_COLOR_TOP: number = 0xFFFFFF;    // 16777215 (const_650)
    public static readonly FLOOR_COLOR_LEFT: number = 0xDDDDDD;   // 14540253 (const_802)
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::FLOOR_COLOR_RIGHT
    public static readonly FLOOR_COLOR_RIGHT: number = 0xBBBBBB;  // 12303291 (FLOOR_COLOR_RIGHT)

    // Wall colors (AS3: RoomVisualization.as lines 30-33)
    public static readonly WALL_COLOR_TOP: number = 0xFFFFFF;     // 16777215 (const_1167, normal.y > 0)
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::WALL_COLOR_SIDE
    public static readonly WALL_COLOR_SIDE: number = 0xCCCCCC;    // 13421772 (WALL_COLOR_SIDE)
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::WALL_COLOR_BOTTOM
    public static readonly WALL_COLOR_BOTTOM: number = 0x999999;  // 10066329 (WALL_COLOR_BOTTOM)
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::WALL_COLOR_BORDER
    public static readonly WALL_COLOR_BORDER: number = 0x999999;  // 10066329 (WALL_COLOR_BORDER)

    // Landscape colors (AS3: RoomVisualization.as lines 35-37)
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::LANDSCAPE_COLOR_TOP
    public static readonly LANDSCAPE_COLOR_TOP: number = 0xFFFFFF;   // 16777215
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::LANDSCAPE_COLOR_SIDE
    public static readonly LANDSCAPE_COLOR_SIDE: number = 0xCCCCCC;  // 13421772
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::LANDSCAPE_COLOR_BOTTOM
    public static readonly LANDSCAPE_COLOR_BOTTOM: number = 0x999999; // 10066329

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::ROOM_DEPTH_OFFSET
    private static readonly ROOM_DEPTH_OFFSET: number = 1000;
    private static readonly UPDATE_INTERVAL: number = 250;

    private _planes: RoomPlane[] = [];

    /**
	 * The plane parser this visualization was built from. AS3 keeps it as `_SafeStr_4639` and reaches
	 * it again for the highlight area; the port used to read it from the model at each use.
	 */
    // AS3: RoomVisualization.as::_SafeStr_4639 (name derived: the plane parser)
    private _planeParser: RoomPlaneParser | null = null;

    // AS3: RoomVisualization.as::_highlightAreaX
    private _highlightAreaX: number = 0;

    // AS3: RoomVisualization.as::_highlightAreaY
    private _highlightAreaY: number = 0;

    // AS3: RoomVisualization.as::_highlightAreaWidth
    private _highlightAreaWidth: number = 0;

    // AS3: RoomVisualization.as::_highlightAreaHeight
    private _highlightAreaHeight: number = 0;

    /**
	 * The filter stack painted onto the highlight planes. AS3 types it `Array` and the area selector
	 * supplies one `ColorMatrixFilter`; `RoomObjectSprite.filters` takes the same shape.
	 */
    // AS3: RoomVisualization.as::_highlightFilter
    private _highlightFilter: unknown[] = [];

    private _planeIndexMap: Map<number, number> = new Map();
    private _initialized: boolean = false;
    private _visiblePlanes: RoomPlane[] = [];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::_visiblePlaneSpriteNumbers
    private _visiblePlaneSpriteNumbers: number[] = [];
    private _planeTypeVisibility: boolean[] = [];

    private _floorType: string | null = null;
    private _wallType: string | null = null;
    private _landscapeType: string | null = null;

    /**
     * Base wall thickness in world units, before the room's own multiplier.
     *
     * The same constant `RoomPlaneParser` builds the wall's edge planes from — kept in step with it
     * by value, since the parser's copy is private and this one only sizes the reveal.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomPlaneParser.as::WALL_THICKNESS
    public static readonly WALL_THICKNESS: number = 0.25;

    /**
     * The room's own thickness *multipliers*, not thicknesses — AS3's naming, kept.
     *
     * NaN until the visualization-settings message arrives, which is what
     * {@link updateThickness} tests: an unset room keeps the parser's own default of 1.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::_floorThickness
    private _floorThickness: number = NaN;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::_wallThickness
    private _wallThickness: number = NaN;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::_backgroundColor
    private _backgroundColor: number = 0xFFFFFF;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::_backgroundRed
    private _backgroundRed: number = 255;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::_backgroundGreen
    private _backgroundGreen: number = 255;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::_backgroundBlue
    private _backgroundBlue: number = 255;

    private _updateCount: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::_lastUpdateTime
    private _lastUpdateTime: number = -1000;
    private _geometryUpdateId: number = -1;

    private _geometryDirX: number = 0;
    private _geometryDirY: number = 0;
    private _geometryDirZ: number = 0;
    private _geometryScale: number = 0;

    private _maskParser: RoomPlaneBitmapMaskParser;
    private _maskXml: string | null = null;

    private _visualizationData: RoomVisualizationData | null = null;

    constructor()
    {
        super();

        this._planeTypeVisibility[0] = false;
        this._planeTypeVisibility[RoomPlane.TYPE_WALL] = true;
        this._planeTypeVisibility[RoomPlane.TYPE_FLOOR] = true;
        this._planeTypeVisibility[RoomPlane.TYPE_LANDSCAPE] = true;

        this._maskParser = new RoomPlaneBitmapMaskParser();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::get floorRelativeDepth()
    get floorRelativeDepth(): number
    {
        return RoomVisualization.ROOM_DEPTH_OFFSET + 0.1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::get wallRelativeDepth()
    get wallRelativeDepth(): number
    {
        return RoomVisualization.ROOM_DEPTH_OFFSET + 0.5;
    }

    // Sits between floorRelativeDepth (+0.1) and wallRelativeDepth (+0.5) for a wall-ad plane.
    // Dead in AS3 itself too - declared, never read anywhere in the primary tree - kept for
    // parity with its two siblings above.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::get wallAdRelativeDepth()
    get wallAdRelativeDepth(): number
    {
        return RoomVisualization.ROOM_DEPTH_OFFSET + 0.49;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::get planeCount()
    get planeCount(): number
    {
        return this._planes.length;
    }

    /**
     * Every plane the room is built from — floor tiles, walls, landscape.
     *
     * Read-only to the caller: `SpriteDataCollector.getRoomPlanes()` projects each one's corners
     * for the photo and must not be able to reorder the list it is drawing from.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::get planes()
    get planes(): readonly RoomPlane[]
    {
        return this._planes;
    }

    override dispose(): void
    {
        this.resetRoomPlanes();
        this._planes = [];
        this._planeIndexMap.clear();
        this._visiblePlanes = [];
        this._visiblePlaneSpriteNumbers = [];

        this._maskParser.dispose();

        super.dispose();
    }

    override initialize(data: IRoomObjectVisualizationData): boolean
    {
        this.reset();

        if(data instanceof RoomVisualizationData)
        {
            this._visualizationData = data;
        }

        return true;
    }

    override update(geometry: IRoomGeometry, time: number, _update: boolean, _skipUpdate: boolean): void
    {
        const roomObject = this.object;

        if(roomObject === null)
        {
            return;
        }

        if(geometry === null)
        {
            return;
        }

        const geometryUpdated = this.updateGeometry(geometry);
        const model = roomObject.getModel();

        // Before `initializeRoomPlanes()`, and that ordering is the whole of it: a thickness change
        // throws the planes away, and this is what rebuilds them — in the *same* tick, so the room
        // is never without them. AS3 has the two adjacent and in this order (l.601-609) for exactly
        // that reason.
        // AS3: .../src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::update()
        this.updatePlaneThicknesses(model);

        this.initializeRoomPlanes();

        // Check for mask and color changes (AS3: updateMasksAndColors)
        let needsUpdate = this.updateMasksAndColors(model);

        // Check if enough time has passed for an update
        if(time < this._lastUpdateTime + RoomVisualization.UPDATE_INTERVAL && !geometryUpdated && !needsUpdate)
        {
            return;
        }

        // Update plane texture types and visibilities from model (AS3: updatePlaneTexturesAndVisibilities)
        if(this.updatePlaneTexturesAndVisibilities(model))
        {
            needsUpdate = true;
        }

        // Update planes
        if(this.updatePlanes(geometry, geometryUpdated, time))
        {
            needsUpdate = true;
        }

        if(needsUpdate)
        {
            // Apply background color to planes
            for(let i = 0; i < this._visiblePlanes.length; i++)
            {
                const spriteNumber = this._visiblePlaneSpriteNumbers[i];
                const sprite = this.getSprite(spriteNumber);
                const plane = this._visiblePlanes[i];

                if(sprite !== null && plane !== null && plane.type !== RoomPlane.TYPE_LANDSCAPE)
                {
                    let color = plane.color;

                    // Apply background color tinting
                    const blue = (color & 0xFF) * this._backgroundBlue / 255;
                    const green = ((color >> 8) & 0xFF) * this._backgroundGreen / 255;
                    const red = ((color >> 16) & 0xFF) * this._backgroundRed / 255;
                    const alpha = (color >> 24) & 0xFF;

                    color = (alpha << 24) + (red << 16) + (green << 8) + blue;
                    sprite.color = color;
                }
            }

            this.increaseUpdateId();
        }

        this._updateModelCounter = model?.getUpdateID() ?? 0;
        this._lastUpdateTime = time;
    }

    protected override reset(): void
    {
        super.reset();

        this._floorType = null;
        this._wallType = null;
        this._landscapeType = null;

        // The cached mask XML, and it is not optional. `resetRoomPlanes()` ends by calling this,
        // and it has just destroyed every plane and their masks with them. `updateMasksAndColors()`
        // re-applies masks only when the XML differs from what it last saw — so leaving the cache
        // standing across a rebuild means the fresh planes never get their doors and windows, and
        // no later update can fix it because the XML never changes again. AS3 nulls it here for
        // exactly this reason (`reset()`, `_SafeStr_8318 = null`).
        //
        // Harmless until something started rebuilding planes mid-session: `updatePlaneThicknesses()`
        // now does, and the doorway rendered for two frames and then went solid for good.
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::reset()
        this._maskXml = null;

        this._geometryUpdateId = -1;
        this._geometryScale = 0;
    }

    /**
	 * Initialize room planes from the RoomPlaneParser stored in the model.
	 * AS3 equivalent: reads "room_plane_xml" string from model, parses it with own RoomPlaneParser.
	 * Vortex: reads the RoomPlaneParser object reference directly from the model.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::initializeRoomPlanes()
    protected initializeRoomPlanes(): void
    {
        if(this._initialized)
        {
            return;
        }

        const model = this.object?.getModel();
        if(!model)
        {
            return;
        }

        // Read the RoomPlaneParser from the model (equivalent of AS3 "room_plane_xml")
        const planeParser = model.getObject(RoomObjectVariableEnum.ROOM_PLANE_PARSER) as RoomPlaneParser | null;

        if(!planeParser || planeParser.planeCount <= 0)
        {
            return;
        }

        // Before parsing, not after: the multipliers size the wall's side and top faces, and those
        // are planes the parser generates. Handing them over afterwards would change nothing.
        // This handoff was missing, which is why the room settings' thickness controls did nothing.
        // AS3: .../src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::initializeRoomPlanes()
        if(!isNaN(this._floorThickness)) planeParser.floorThicknessMultiplier = this._floorThickness;
        if(!isNaN(this._wallThickness)) planeParser.wallThicknessMultiplier = this._wallThickness;

        this._planeParser = planeParser;
        this.createPlanesAndSprites(planeParser);

        log.debug(`Created ${this._planes.length} planes`);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::defineSprites()
    protected defineSprites(startIndex: number = 0): void
    {
        const count = this._planes.length;
        this.createSprites(count);

        for(let i = startIndex; i < count; i++)
        {
            const plane = this._planes[i];
            const sprite = this.getSprite(i);

            if(sprite !== null && plane !== null && plane.leftSide !== null && plane.rightSide !== null)
            {
                if(plane.type === RoomPlane.TYPE_WALL && (plane.leftSide.length < 1 || plane.rightSide.length < 1))
                {
                    sprite.alphaTolerance = 256;
                }
                else
                {
                    sprite.alphaTolerance = 128;
                }

                if(plane.type === RoomPlane.TYPE_WALL)
                {
                    sprite.tag = `plane.wall@${i + 1}`;
                }
                else if(plane.type === RoomPlane.TYPE_FLOOR)
                {
                    sprite.tag = `plane.floor@${i + 1}`;
                }
                else
                {
                    sprite.tag = `plane@${i + 1}`;
                }

                sprite.spriteType = RoomObjectSpriteType.ROOM_PLANE;

                // A highlight plane is tinted, pulled in front of the floor it covers, and taken out
                // of hit-testing — otherwise the overlay would swallow every click on the tiles it
                // is drawn over, including the one that ends the drag.
                if(this._planeParser?.isPlaneTemporaryHighlighter(i) ?? false)
                {
                    sprite.filters = this._highlightFilter as never[];
                    sprite.skipMouseHandling = true;
                    plane.extraDepth = -100;
                    plane.isHighlighter = true;
                }
                else
                {
                    sprite.filters = [];
                    sprite.skipMouseHandling = false;
                    plane.extraDepth = 0;
                    plane.isHighlighter = false;
                }
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::updatePlanes()
    protected updatePlanes(geometry: IRoomGeometry, geometryUpdated: boolean, time: number): boolean
    {
        const roomObject = this.object;

        if(roomObject === null)
        {
            return false;
        }

        if(geometry === null)
        {
            return false;
        }

        this._updateCount++;

        if(geometryUpdated)
        {
            this._visiblePlanes = [];
            this._visiblePlaneSpriteNumbers = [];
        }

        let updated = false;
        const visiblePlanesSet = this._visiblePlanes.length > 0;
        const planesToCheck = visiblePlanesSet ? this._visiblePlanes : this._planes;

        for(let i = 0; i < planesToCheck.length; i++)
        {
            let spriteIndex = i;

            if(visiblePlanesSet)
            {
                spriteIndex = this._visiblePlaneSpriteNumbers[i];
            }

            const sprite = this.getSprite(spriteIndex);

            if(sprite !== null)
            {
                const plane = planesToCheck[i];

                if(plane !== null)
                {
                    sprite.planeId = plane.uniqueId;

                    if(plane.update(geometry, time))
                    {
                        if(plane.visible)
                        {
                            let depth = plane.relativeDepth + this.floorRelativeDepth + spriteIndex / 1000;

                            if(plane.type !== RoomPlane.TYPE_FLOOR)
                            {
                                depth = plane.relativeDepth + this.wallRelativeDepth + spriteIndex / 1000;

                                if(plane.leftSide.length < 1 || plane.rightSide.length < 1)
                                {
                                    depth += RoomVisualization.ROOM_DEPTH_OFFSET * 0.5;
                                }
                            }

                            // Update PixiJS zIndex for proper rendering order
                            plane.displayObject.zIndex = -depth;

                            this.updateSprite(sprite, plane, `plane ${spriteIndex} ${geometry.scale}`, depth);
                        }

                        updated = true;
                    }

                    const visibility = plane.visible && this._planeTypeVisibility[plane.type];

                    if(sprite.visible !== visibility)
                    {
                        sprite.visible = visibility;
                        updated = true;
                    }

                    if(sprite.visible && !visiblePlanesSet)
                    {
                        this._visiblePlanes.push(plane);
                        this._visiblePlaneSpriteNumbers.push(i);
                    }
                }
                else
                {
                    sprite.planeId = 0;

                    if(sprite.visible)
                    {
                        sprite.visible = false;
                        updated = true;
                    }
                }
            }
        }

        return updated;
    }

    /**
	 * Create planes from the RoomPlaneParser data.
	 * Based on AS3: RoomVisualization.createPlanesAndSprites() lines 569-700
	 * + AS3: RoomEngine.createRoom() door mask application (lines 3044-3076)
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::createPlanesAndSprites()
    private createPlanesAndSprites(planeParser: RoomPlaneParser, startIndex: number = 0): void
    {
        const origin = this.object!.getLocation();
        const randomSeed = Math.floor(Math.random() * 10000);

        // AS3 takes the same index and passes it on to defineSprites(), so a highlight added on top
        // of an existing room builds planes and sprites only for what the parser just appended.
        for(let i = startIndex; i < planeParser.planeCount; i++)
        {
            const location = planeParser.getPlaneLocation(i);
            const leftSide = planeParser.getPlaneLeftSide(i);
            const rightSide = planeParser.getPlaneRightSide(i);
            const type = planeParser.getPlaneType(i);
            const secondaryNormals = planeParser.getPlaneSecondaryNormals(i);

            if(!location || !leftSide || !rightSide)
            {
                continue;
            }

            const normal = Vector3d.crossProduct(leftSide, rightSide);

            let planeType: number;
            let color: number;
            // AS3 gives the billboard the WALL plane type and tells the two apart only by which
            // rasterizer it hands over, so the branch below has to carry the distinction itself.
            let isBillboard = false;

            // Map type and color according to AS3 createPlanesAndSprites (lines 607-668)
            if(type === RoomPlaneData.PLANE_FLOOR)
            {
                planeType = RoomPlane.TYPE_FLOOR;

                if(normal !== null && normal.z !== 0)
                {
                    color = RoomVisualization.FLOOR_COLOR_TOP;
                }
                else if(normal !== null && normal.x !== 0)
                {
                    color = RoomVisualization.FLOOR_COLOR_RIGHT;
                }
                else
                {
                    color = RoomVisualization.FLOOR_COLOR_LEFT;
                }
            }
            else if(type === RoomPlaneData.PLANE_WALL)
            {
                planeType = RoomPlane.TYPE_WALL;

                if(normal !== null && normal.x === 0 && normal.y === 0)
                {
                    color = RoomVisualization.WALL_COLOR_BOTTOM;
                }
                else if(normal !== null && normal.y > 0)
                {
                    color = RoomVisualization.WALL_COLOR_TOP;
                }
                else if(normal !== null && normal.y === 0)
                {
                    color = RoomVisualization.WALL_COLOR_SIDE;
                }
                else
                {
                    color = RoomVisualization.WALL_COLOR_BOTTOM;
                }
            }
            else if(type === RoomPlaneData.PLANE_LANDSCAPE)
            {
                planeType = RoomPlane.TYPE_LANDSCAPE;

                if(normal !== null && normal.y > 0)
                {
                    color = RoomVisualization.LANDSCAPE_COLOR_TOP;
                }
                else if(normal !== null && normal.y === 0)
                {
                    color = RoomVisualization.LANDSCAPE_COLOR_SIDE;
                }
                else
                {
                    color = RoomVisualization.LANDSCAPE_COLOR_BOTTOM;
                }
            }
            // AS3: .../RoomVisualization.as::updateRoomPlanes() l.442-468. The port had no branch
            // for it at all, so every billboard plane fell through the `continue` below and was
            // never created. Its colours are the landscape ones and its plane type is WALL — both
            // straight from the AS3 — and only its rasterizer differs.
            else if(type === RoomPlaneData.PLANE_BILLBOARD)
            {
                planeType = RoomPlane.TYPE_WALL;
                isBillboard = true;

                if(normal !== null && normal.x === 0 && normal.y === 0)
                {
                    color = RoomVisualization.LANDSCAPE_COLOR_BOTTOM;
                }
                else if(normal !== null && normal.y > 0)
                {
                    color = RoomVisualization.LANDSCAPE_COLOR_TOP;
                }
                else if(normal !== null && normal.y === 0)
                {
                    color = RoomVisualization.LANDSCAPE_COLOR_SIDE;
                }
                else
                {
                    color = RoomVisualization.LANDSCAPE_COLOR_BOTTOM;
                }
            }
            else
            {
                continue;
            }

            const plane = new RoomPlane(
                origin,
                location,
                leftSide,
                rightSide,
                planeType,
                true,
                secondaryNormals.length > 0 ? secondaryNormals : null,
                randomSeed
            );

            plane.color = color;

            // Assign rasterizer from visualization data
            if(this._visualizationData !== null)
            {
                if(planeType === RoomPlane.TYPE_FLOOR)
                {
                    plane.rasterizer = this._visualizationData.floorRasterizer;
                }
                else if(planeType === RoomPlane.TYPE_WALL)
                {
                    // A billboard is a wall-typed plane (AS3 passes 1 as the type,
                    // RoomVisualization.as l.444) that draws through its own rasterizer, so the
                    // choice cannot be made on the plane type alone.
                    plane.rasterizer = isBillboard
                        ? this._visualizationData.wallAdRasterizr
                        : this._visualizationData.wallRasterizer;
                }
                else if(planeType === RoomPlane.TYPE_LANDSCAPE)
                {
                    // AS3: .../RoomVisualization.as::updateRoomPlanes() l.436-439. Without this a
                    // landscape plane had no rasterizer at all and drew nothing — the scenery
                    // behind every window.
                    plane.rasterizer = this._visualizationData.landscapeRasterizer;
                }

                // Every plane, whatever its type: AS3 assigns it outside the rasterizer branch
                // (l.472), because a landscape plane carries `hole` masks as readily as a wall
                // carries doors and windows.
                // AS3: .../src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::updateRoomPlanes()
                plane.maskManager = this._visualizationData.maskManager;

                // TS-only: the depth a cut opening's reveal is drawn to, in world units — the base
                //   thickness times the room's own multiplier, which is what `_wallThickness`
                //   holds. AS3 keeps this in the plane parser, which builds the wall's edge planes
                //   from it and never tells a plane; the reveal is drawn by the plane, so it has
                //   to know. An unset room falls back to the parser's own default of 1.
                plane.wallThickness = RoomVisualization.WALL_THICKNESS
                    * (isNaN(this._wallThickness) ? 1 : this._wallThickness);
            }

            // Thin walls without texture (AS3 lines 624-626)
            if(planeType === RoomPlane.TYPE_WALL)
            {
                if(leftSide.length < 1 || rightSide.length < 1)
                {
                    plane.hasTexture = false;
                }
            }

            // The parser's own rectangle masks, replayed onto the plane. AS3 runs this loop for
            // every plane it keeps, right before pushing it, and it is what gave `addRectangleMask()`
            // its only caller — without it the method was ported and unreachable.
            // AS3: .../src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::createPlanesAndSprites()
            const maskCount = planeParser.getPlaneMaskCount(i);

            for(let maskIndex = 0; maskIndex < maskCount; maskIndex++)
            {
                plane.addRectangleMask(
                    planeParser.getPlaneMaskLeftSideLoc(i, maskIndex),
                    planeParser.getPlaneMaskRightSideLoc(i, maskIndex),
                    planeParser.getPlaneMaskLeftSideLength(i, maskIndex),
                    planeParser.getPlaneMaskRightSideLength(i, maskIndex)
                );
            }

            this._planeIndexMap.set(i, this._planes.length);
            this._planes.push(plane);
        }

        this._initialized = true;

        this.defineSprites(startIndex);
    }

    /**
	 * Paint a highlight rectangle over the floor, for the wired area selector.
	 *
	 * The planes come from the parser, which appends a second set of floor planes covering the area;
	 * this then builds sprites for exactly those and gives them {@link _highlightFilter}. `reset()` at
	 * the end is what forces the next frame to re-sort, so the overlay lands in front.
	 */
    // AS3: RoomVisualization.as::initializeHighlightArea()
    initializeHighlightArea(x: number, y: number, width: number, height: number, filter: unknown[]): void
    {
        this.clearHighlightArea();

        if(this._planeParser === null) return;

        this._highlightAreaX = x;
        this._highlightAreaY = y;
        this._highlightAreaWidth = width;
        this._highlightAreaHeight = height;
        this._highlightFilter = filter;

        this._planeParser.initializeHighlightArea(x, y, width, height);
        this.createPlanesAndSprites(this._planeParser, this._planes.length);
        this.reset();
    }

    /**
	 * Drops the highlight planes and the sprites built for them.
	 *
	 * The sprite count is counted rather than assumed: the parser reports how many planes it removed,
	 * but only those that actually produced a visualization plane have an index in the map, and the
	 * two can differ when a plane was rejected for a zero-length side.
	 */
    // AS3: RoomVisualization.as::clearHighlightArea()
    clearHighlightArea(): void
    {
        this._highlightAreaX = 0;
        this._highlightAreaY = 0;
        this._highlightAreaWidth = 0;
        this._highlightAreaHeight = 0;

        if(this._planeParser === null) return;

        const removed = this._planeParser.clearHighlightArea();

        let removedPlanes = 0;

        for(let i = this._planeParser.planeCount; i < this._planeParser.planeCount + removed; i++)
        {
            if(this._planeIndexMap.has(i))
            {
                removedPlanes += 1;
                this._planeIndexMap.delete(i);
            }
        }

        if(removedPlanes === 0) return;

        this._planes = this._planes.slice(0, this._planes.length - removedPlanes);
        this.createSprites(this._planes.length);
        this.reset();
    }

    /**
	 * Update plane texture types and visibilities from the room model.
	 * Based on AS3 RoomVisualization.updatePlaneTexturesAndVisibilities()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::updatePlaneTexturesAndVisibilities()
    /**
     * Picks up a change to the room's wall or floor thickness and rebuilds the planes for it.
     *
     * The rebuild is the whole point: the thickness is not a property a plane can be told after the
     * fact, it is baked into the geometry `RoomPlaneParser` generates — the wall's side and top
     * faces are separate planes, sized from it. Nothing short of re-parsing changes them, which is
     * why AS3 answers `true` here and lets the caller re-run `initializeRoomPlanes()`.
     *
     * Both are read and compared together, as AS3 does: a settings message carries the two, and
     * rebuilding twice for one message would throw the planes away mid-frame for nothing.
     *
     * This was missing entirely. `RoomLogic` has always written both variables onto the model from
     * the visualization-settings message, and nothing had ever read them — so the parser kept its
     * default multiplier of 1 and the room settings' thickness controls did nothing at all.
     *
     * **It must be called immediately before `initializeRoomPlanes()`**, which is where AS3 calls
     * it. Anywhere later and the reset lands after the rebuild that would have undone it, leaving
     * the room with no planes until the next tick — a room that renders and then goes black.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::updatePlaneThicknesses()
    private updatePlaneThicknesses(model: IRoomObjectModel): boolean
    {
        const floor = model.getNumber(RoomObjectVariableEnum.ROOM_FLOOR_THICKNESS_MULTIPLIER);
        const wall = model.getNumber(RoomObjectVariableEnum.ROOM_WALL_THICKNESS_MULTIPLIER);

        // NaN means the room's visualization settings have not arrived; the defaults stand.
        if(isNaN(floor) || isNaN(wall)) return false;
        if(floor === this._floorThickness && wall === this._wallThickness) return false;

        this._floorThickness = floor;
        this._wallThickness = wall;

        this.resetRoomPlanes();

        return true;
    }

    private updatePlaneTexturesAndVisibilities(model: any): boolean
    {
        if(!model) return false;

        if(this._updateModelCounter !== model.getUpdateID())
        {
            const wallType = model.getString(RoomObjectVariableEnum.ROOM_WALL_TYPE) as string | null;
            const floorType = model.getString(RoomObjectVariableEnum.ROOM_FLOOR_TYPE) as string | null;
            const landscapeType = model.getString(RoomObjectVariableEnum.ROOM_LANDSCAPE_TYPE) as string | null;

            // AS3 defaults to "111"/"201"/"1" when no type has been set yet
            // (RoomEngine.as::initializeRoom() lines 1370-1372) — not a made-up
            // "default" id, which has no matching floor/wall texture.
            this.updatePlaneTextureTypes(
                floorType ?? '111',
                wallType ?? '201',
                landscapeType ?? '1'
            );

            const floorVisible = model.getNumber(RoomObjectVariableEnum.ROOM_FLOOR_VISIBILITY);
            const wallVisible = model.getNumber(RoomObjectVariableEnum.ROOM_WALL_VISIBILITY);
            const landscapeVisible = model.getNumber(RoomObjectVariableEnum.ROOM_LANDSCAPE_VISIBILITY);

            this.updatePlaneTypeVisibilities(
                isNaN(floorVisible) ? true : !!floorVisible,
                isNaN(wallVisible) ? true : !!wallVisible,
                isNaN(landscapeVisible) ? true : !!landscapeVisible
            );

            return true;
        }

        return false;
    }

    /**
	 * Set plane IDs based on floor/wall/landscape type strings.
	 * Based on AS3 RoomVisualization.updatePlaneTextureTypes()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::updatePlaneTextureTypes()
    private updatePlaneTextureTypes(floorType: string, wallType: string, landscapeType: string): boolean
    {
        let changed = false;

        if(floorType !== this._floorType)
        {
            this._floorType = floorType;
            changed = true;
        }
        else
        {
            floorType = '';
        }

        if(wallType !== this._wallType)
        {
            this._wallType = wallType;
            changed = true;
        }
        else
        {
            wallType = '';
        }

        if(landscapeType !== this._landscapeType)
        {
            this._landscapeType = landscapeType;
            changed = true;
        }
        else
        {
            landscapeType = '';
        }

        if(!changed) return false;

        for(const plane of this._planes)
        {
            if(plane.type === RoomPlane.TYPE_FLOOR && floorType)
            {
                plane.id = floorType;
            }
            else if(plane.type === RoomPlane.TYPE_WALL && wallType)
            {
                plane.id = wallType;
            }
            else if(plane.type === RoomPlane.TYPE_LANDSCAPE && landscapeType)
            {
                plane.id = landscapeType;
            }
        }

        return true;
    }

    /**
	 * Update plane type visibility flags.
	 * Based on AS3 RoomVisualization.updatePlaneTypeVisibilities()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::updatePlaneTypeVisibilities()
    private updatePlaneTypeVisibilities(floor: boolean, wall: boolean, landscape: boolean): void
    {
        if(floor !== this._planeTypeVisibility[RoomPlane.TYPE_FLOOR]
			|| wall !== this._planeTypeVisibility[RoomPlane.TYPE_WALL]
			|| landscape !== this._planeTypeVisibility[RoomPlane.TYPE_LANDSCAPE])
        {
            this._planeTypeVisibility[RoomPlane.TYPE_FLOOR] = floor;
            this._planeTypeVisibility[RoomPlane.TYPE_WALL] = wall;
            this._planeTypeVisibility[RoomPlane.TYPE_LANDSCAPE] = landscape;
            this._visiblePlanes = [];
            this._visiblePlaneSpriteNumbers = [];
        }
    }

    /**
	 * Check for mask and background color changes in the model.
	 * Based on AS3 RoomVisualization.updateMasksAndColors()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::updateMasksAndColors()
    private updateMasksAndColors(model: any): boolean
    {
        if(!model) return false;

        let changed = false;

        if(this._updateModelCounter !== model.getUpdateID())
        {
            // Check mask XML changes
            const maskXml = model.getString(RoomObjectVariableEnum.ROOM_PLANE_MASK_XML) as string | null;

            if(maskXml && maskXml !== this._maskXml)
            {
                this.updatePlaneMasks(maskXml);
                this._maskXml = maskXml;
                changed = true;
            }

            // Check background color changes
            const bgColor = model.getNumber(RoomObjectVariableEnum.ROOM_BACKGROUND_COLOR);

            if(!isNaN(bgColor) && bgColor !== this._backgroundColor)
            {
                this._backgroundColor = bgColor;
                this._backgroundBlue = bgColor & 0xFF;
                this._backgroundGreen = (bgColor >> 8) & 0xFF;
                this._backgroundRed = (bgColor >> 16) & 0xFF;
                changed = true;
            }
        }

        return changed;
    }

    /**
	 * Apply bitmap masks to planes from parsed mask XML.
	 * Based on AS3 RoomVisualization.updatePlaneMasks() lines 466-547
	 *
	 * For each mask, finds matching wall/landscape planes via scalar projection
	 * and adds bitmap masks to them.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::updatePlaneMasks()
    private updatePlaneMasks(xmlString: string): void
    {
        if(!xmlString) return;

        this._maskParser.initialize(xmlString);

        const landscapePlaneIndices: number[] = [];
        const activeLandscapePlanes: number[] = [];
        let visibilityChanged = false;

        // Reset all bitmap masks and track landscape planes
        for(let i = 0; i < this._planes.length; i++)
        {
            const plane = this._planes[i];

            if(plane)
            {
                plane.resetBitmapMasks();

                if(plane.type === RoomPlane.TYPE_LANDSCAPE)
                {
                    landscapePlaneIndices.push(i);
                }
            }
        }

        // Apply masks to matching planes
        for(let maskIdx = 0; maskIdx < this._maskParser.maskCount; maskIdx++)
        {
            const maskType = this._maskParser.getMaskType(maskIdx);
            const maskLoc = this._maskParser.getMaskLocation(maskIdx);
            const maskCategory = this._maskParser.getMaskCategory(maskIdx);

            if(!maskLoc) continue;

            for(let planeIdx = 0; planeIdx < this._planes.length; planeIdx++)
            {
                const plane = this._planes[planeIdx];

                if(plane.type !== RoomPlane.TYPE_WALL && plane.type !== RoomPlane.TYPE_LANDSCAPE) continue;

                const loc = plane.location as Vector3d;
                const normal = plane.normal as Vector3d;
                const diff = Vector3d.dif(maskLoc, loc);

                if(!diff) continue;

                // Check if mask position is ON the plane surface
                const normalDist = Math.abs(Vector3d.scalarProjection(diff, normal));

                if(normalDist < 0.01)
                {
                    const leftSideLoc = Vector3d.scalarProjection(diff, plane.leftSide as Vector3d);
                    const rightSideLoc = Vector3d.scalarProjection(diff, plane.rightSide as Vector3d);

                    if(plane.type === RoomPlane.TYPE_WALL || (plane.type === RoomPlane.TYPE_LANDSCAPE && maskCategory === 'hole'))
                    {
                        if(maskType)
                        {
                            plane.addBitmapMask(maskType, leftSideLoc, rightSideLoc);
                        }
                    }
                    else if(plane.type === RoomPlane.TYPE_LANDSCAPE)
                    {
                        if(!plane.canBeVisible)
                        {
                            visibilityChanged = true;
                        }

                        plane.canBeVisible = true;
                        activeLandscapePlanes.push(planeIdx);
                    }
                }
            }
        }

        // Hide landscape planes that don't have any active masks
        for(const idx of landscapePlaneIndices)
        {
            if(!activeLandscapePlanes.includes(idx))
            {
                const plane = this._planes[idx];

                if(plane.canBeVisible)
                {
                    plane.canBeVisible = false;
                    visibilityChanged = true;
                }
            }
        }

        // Reset visible plane cache if visibility changed
        if(visibilityChanged)
        {
            this._visiblePlanes = [];
            this._visiblePlaneSpriteNumbers = [];
        }
    }

    /**
	 * Update sprite data from a plane.
	 * AS3: updateSprite() sets sprite.asset = getPlaneBitmap(plane, name).
	 *
	 * @see sources/win63_version/habbo/room/object/visualization/room/RoomVisualization.as
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::updateSprite()
    private updateSprite(sprite: IRoomObjectSprite, plane: RoomPlane, name: string, depth: number): void
    {
        const offset = plane.offset;

        sprite.offsetX = -offset.x;
        sprite.offsetY = -offset.y;
        sprite.relativeDepth = depth;
        sprite.color = plane.color;

        // AS3: sprite.asset = getPlaneBitmap(plane, name)
        const planeTexture = plane.copyBitmapData();

        if(planeTexture !== null)
        {
            sprite.texture = planeTexture;
        }

        sprite.assetName = `${name}_${this._updateCount}`;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::updateGeometry()
    private updateGeometry(geometry: IRoomGeometry): boolean
    {
        if(geometry.updateId !== this._geometryUpdateId)
        {
            this._geometryUpdateId = geometry.updateId;

            const direction = geometry.direction;

            if(direction !== null &&
				(direction.x !== this._geometryDirX ||
					direction.y !== this._geometryDirY ||
					direction.z !== this._geometryDirZ ||
					geometry.scale !== this._geometryScale))
            {
                this._geometryDirX = direction.x;
                this._geometryDirY = direction.y;
                this._geometryDirZ = direction.z;
                this._geometryScale = geometry.scale;

                return true;
            }
        }

        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/RoomVisualization.as::resetRoomPlanes()
    private resetRoomPlanes(): void
    {
        // The published sprites hold the planes' textures (`sprite.texture = planeTexture`), and
        // `plane.dispose()` destroys those textures. Detach them first, or the canvas draws one
        // whose `source` is now null — which surfaces inside PixiJS as
        // `getAdjustedBlendModeBlend: Cannot read properties of null (reading 'alphaMode')`, a long
        // way from here. A sprite with a null texture simply draws nothing until `updatePlanes()`
        // gives it the rebuilt one, which is the same frame.
        //
        // Flash tolerated the reverse order because a disposed BitmapData still drew as nothing.
        // `dispose()` on this class cleared the two lists below one line after calling this, so the
        // hazard only appeared once something *else* began calling it: nothing did until
        // `updatePlaneThicknesses()` landed.
        for(let i = 0; i < this.spriteCount; i++)
        {
            const sprite = this.getSprite(i);

            if(sprite !== null) sprite.texture = null;
        }

        this._visiblePlanes = [];
        this._visiblePlaneSpriteNumbers = [];

        for(const plane of this._planes)
        {
            if(plane !== null)
            {
                plane.dispose();
            }
        }

        this._planes = [];
        this._planeIndexMap.clear();
        this._initialized = false;
        this._updateCount++;

        this.reset();
    }
}
