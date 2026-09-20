// The concrete engine, not `IRoomEngine`, because that is what AS3 takes here
// (`getFurniData(..., param3:_SafeCls_90, ...)`): `getRoomObjects()` is declared on the class and
// not on the interface, in AS3 as here.
import {RoomEngine, type IRoomEngineRectangle} from '@habbo/room/RoomEngine';
import type {RoomRenderingCanvas} from '@habbo/room/renderer/RoomRenderingCanvas';
import {PlaneDrawingData} from '@habbo/room/object/visualization/room/PlaneDrawingData';
import type {IPlaneDrawingData} from '@room/object/visualization/IPlaneDrawingData';
import type {RoomObjectSpriteData} from '@room/data/RoomObjectSpriteData';
import type {IRoomObjectSpriteVisualization} from '@room/object/visualization/IRoomObjectSpriteVisualization';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import type {RoomPlane} from '@habbo/room/object/visualization/room/RoomPlane';
import type {RoomVisualization} from '@habbo/room/object/visualization/room/RoomVisualization';
import type {IPoint} from '@room/utils/IRoomGeometry';
import {Vector3d} from '@room/utils/Vector3d';

/**
 * Turns the room canvas into the JSON payload the camera sends for server-side rendering.
 *
 * The class is obfuscated as `_SafeCls_1840` in the primary tree and `class_2200` in the secondary;
 * the name here is recovered from
 * `sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SpriteDataCollector.as`,
 * whose own member names are obfuscated in turn and come from the WIN63 side.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1840.as
 */
export class SpriteDataCollector
{
    // AS3: .../habbo/room/utils/_SafeCls_1840.as::MAX_EXTERNAL_IMAGE_COUNT
    private static readonly MAX_EXTERNAL_IMAGE_COUNT: number = 30;

    // AS3: .../habbo/room/utils/_SafeCls_1840.as::AVATAR_WATER_EFFECT_MAGIC_Y_OFFSET
    private static readonly AVATAR_WATER_EFFECT_MAGIC_Y_OFFSET: number = -52;

    /** The one object type whose room sprite is a placeholder for a figure. */
    // AS3: .../habbo/room/utils/_SafeCls_1840.as::addMannequinSprites() ("boutique_mannequin1")
    private static readonly MANNEQUIN_OBJECT_TYPE: string = 'boutique_mannequin1';

    // AS3: .../habbo/room/utils/_SafeCls_1840.as::addMannequinSprites() ("mannequin_")
    private static readonly MANNEQUIN_SPRITE_PREFIX: string = 'mannequin_';

    /** AS3's `+ -16` on the mannequin's bottom edge. */
    // AS3: .../habbo/room/utils/_SafeCls_1840.as::addMannequinSprites()
    private static readonly MANNEQUIN_Y_OFFSET: number = 16;

    // AS3: .../habbo/room/utils/_SafeCls_1840.as::_SafeStr_5988
    private _firstSpriteZ: number = 0;

    // AS3: .../habbo/room/utils/_SafeCls_1840.as::spriteCount
    private _spriteCount: number = 0;

    // AS3: .../habbo/room/utils/_SafeCls_1840.as::externalImageCount
    private _externalImageCount: number = 0;

    /**
	 * AS3 sorts descending by z, and returns -1 for equal z as well as for greater — so equal
	 * elements keep swapping. Reproduced rather than corrected: the tie order is what the server
	 * receives.
	 */
    // AS3: .../habbo/room/utils/_SafeCls_1840.as::sortSpriteDataObjects()
    private static sortSpriteDataObjects(a: RoomObjectSpriteData, b: RoomObjectSpriteData): number
    {
        if(a.z < b.z) return 1;

        return -1;
    }

    /**
	 * Replaces a boutique mannequin's placeholder sprite with the mannequin's own sprite list,
	 * re-parented onto where the placeholder sat.
	 *
	 * The mannequin draws as one `mannequin_*` sprite in the room, but the photo needs the clothes
	 * on it — so the object's real sprite list is fetched and each part offset onto the
	 * placeholder's position. The `+ width / 2 + 1` and `+ height - 16` are AS3's literals: the
	 * parts are authored around the figure's own origin, which is the bottom centre of the
	 * placeholder, less sixteen.
	 *
	 * The offsets are added to the records in place, as AS3 does: `getSpriteList()` returns
	 * payload records built for this call — `getServerRenderData()` hands its array over and clears
	 * it — so nothing the room is drawing moves.
	 */
    // AS3: .../habbo/room/utils/_SafeCls_1840.as::addMannequinSprites()
    private static addMannequinSprites(sprites: RoomObjectSpriteData[], engine: RoomEngine): RoomObjectSpriteData[]
    {
        const result: RoomObjectSpriteData[] = [];

        for(const data of sprites)
        {
            if(data.objectType !== SpriteDataCollector.MANNEQUIN_OBJECT_TYPE
                || data.name.indexOf(SpriteDataCollector.MANNEQUIN_SPRITE_PREFIX) !== 0)
            {
                result.push(data);

                continue;
            }

            const object = engine.getRoomObject(
                engine.activeRoomId, data.objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE
            );
            const parts = (object?.getVisualization() as IRoomObjectSpriteVisualization | null)?.getSpriteList() ?? null;

            if(parts === null) continue;

            for(const part of parts)
            {
                part.x += data.x + data.width / 2 + 1;
                part.y += data.y + data.height - SpriteDataCollector.MANNEQUIN_Y_OFFSET;
                part.z += data.z;

                result.push(part);
            }
        }

        return result;
    }

    /**
	 * Orders a quad's four projected corners so the receiving renderer reads them as
	 * top-left, top-right, bottom-left, bottom-right.
	 *
	 * The first branch decides which of the two middle points is the *horizontal* neighbour of the
	 * first — a projected room plane is a parallelogram, so that cannot be assumed from the order
	 * they were produced in. The two swaps after it put the pair with the larger x first and the
	 * pair with the larger y first, which is what fixes the winding.
	 */
    // AS3: .../habbo/room/utils/_SafeCls_1840.as::sortQuadPoints()
    private static sortQuadPoints(a: IPoint, b: IPoint, c: IPoint, d: IPoint): IPoint[]
    {
        let points: IPoint[];

        if(a.x === b.x) points = [a, c, b, d];
        else if(a.x === c.x) points = [a, b, c, d];
        else if((b.x < a.x && b.y > a.y) || (b.x > a.x && b.y < a.y)) points = [a, c, b, d];
        else points = [a, b, c, d];

        if(points[0].x < points[1].x)
        {
            points = [points[1], points[0], points[3], points[2]];
        }

        if(points[0].y < points[2].y)
        {
            points = [points[2], points[3], points[0], points[1]];
        }

        return points;
    }

    /**
	 * The room's planes in the order the canvas drew them, keyed back to their drawn sprites.
	 *
	 * A plane's z has to come from the *sprite* that drew it, not from the plane, because that is
	 * the value the furniture sorted against. Planes the canvas never drew — off screen, or hidden
	 * behind a wall — keep the seed z and are appended after, which is where AS3 leaves them.
	 */
    // AS3: .../habbo/room/utils/_SafeCls_1840.as::sortRoomPlanes()
    private sortRoomPlanes(planes: readonly RoomPlane[], canvas: RoomRenderingCanvas): {plane: RoomPlane; z: number}[]
    {
        const remaining = new Map<number, {plane: RoomPlane; z: number}>();
        const seedZ = 1 + (this._firstSpriteZ ? this._firstSpriteZ : 0);

        for(const plane of planes) remaining.set(plane.uniqueId, {plane, z: seedZ});

        // Ascending by z then reversed, which is AS3's `sortOn("z", NUMERIC)` + `reverse()` — the
        // frontmost plane first.
        const drawn = [...canvas.getPlaneSortableSprites()].sort((a, b) => a.z - b.z).reverse();
        const sorted: {plane: RoomPlane; z: number}[] = [];

        for(const sortable of drawn)
        {
            const sprite = sortable.sprite;

            if(sprite === null) continue;

            const entry = remaining.get(sprite.planeId) ?? null;

            if(entry === null) continue;

            remaining.delete(sprite.planeId);
            entry.z = sortable.z;
            sorted.push(entry);
        }

        return sorted.concat([...remaining.values()]);
    }

    // AS3: .../habbo/room/utils/_SafeCls_1840.as::isSpriteInViewPort()
    private static isSpriteInViewPort(sprite: RoomObjectSpriteData, viewPort: IRoomEngineRectangle, canvas: RoomRenderingCanvas): boolean
    {
        const left = sprite.x + canvas.screenOffsetX;
        const top = sprite.y + canvas.screenOffsetY;

        return left < viewPort.right && left + sprite.width > viewPort.left
            && top < viewPort.bottom && top + sprite.height > viewPort.top;
    }

    /**
	 * The furniture and avatar sprites, as a JSON array.
	 *
	 * Three passes, in AS3's order: what the canvas drew, then every category-100 object's own
	 * sprite list merged in — which is what puts an avatar the canvas scrolled off screen back into
	 * the photo — then the mannequins expanded. Only after that is the lot sorted and filtered to
	 * the viewport, because the merged sprites have to sort among the drawn ones.
	 */
    // AS3: .../habbo/room/utils/_SafeCls_1840.as::getFurniData()
    getFurniData(
        viewPort: IRoomEngineRectangle,
        canvas: RoomRenderingCanvas,
        engine: RoomEngine,
        skipObjectId: number
    ): string
    {
        let sprites = canvas.getSortableSpriteList();

        // The culled-avatar merge. The canvas drops an avatar it scrolled off screen, and the photo
        // still wants it — so every category-100 object's own sprite list is re-parented onto where
        // the object is, whether or not the canvas drew it.
        //
        // The z and the baseline come from the avatar's *drawn* sprite when there is one, which is
        // what keeps a merged avatar sorted among the furniture rather than on top of it; with no
        // drawn sprite the object's screen y stands in.
        for(const object of engine.getRoomObjects(engine.activeRoomId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER))
        {
            if(object.getId() === skipObjectId) continue;

            const parts = (object.getVisualization() as IRoomObjectSpriteVisualization | null)?.getSpriteList() ?? null;

            if(parts === null) continue;

            let baseZ = 0;
            let baseY = 0;

            for(const drawn of sprites)
            {
                if(drawn.name === `avatar_${object.getId()}`)
                {
                    baseZ = drawn.z;
                    baseY = drawn.y + drawn.height - canvas.geometry.scale / 4;

                    break;
                }
            }

            const screen = engine.getRoomObjectScreenLocation(
                engine.activeRoomId, object.getId(), RoomObjectCategoryEnum.OBJECT_CATEGORY_USER, canvas.getId()
            );

            if(screen === null) continue;

            if(baseY === 0) baseY = screen.y;

            for(const part of parts)
            {
                part.x += screen.x - canvas.screenOffsetX;
                part.y += baseY;
                part.z += baseZ;

                // The two swimming effects are authored a tile higher than they draw; AS3 pulls
                // them back down by hand rather than fixing the assets.
                if(part.name.indexOf('h_std_fx29_') === 0 || part.name.indexOf('h_std_fx185_') === 0)
                {
                    part.y += SpriteDataCollector.AVATAR_WATER_EFFECT_MAGIC_Y_OFFSET;
                }

                sprites.push(part);
            }
        }

        sprites = SpriteDataCollector.addMannequinSprites(sprites, engine);
        sprites.sort(SpriteDataCollector.sortSpriteDataObjects);

        const result: Record<string, unknown>[] = [];

        for(const data of sprites)
        {
            const name = data.name;

            if(name !== null && name.length > 0
                && name.indexOf('tile_cursor_') !== 0
                && SpriteDataCollector.isSpriteInViewPort(data, viewPort, canvas)
                && (skipObjectId < 0 || data.objectId !== skipObjectId))
            {
                result.push(this.getSpriteDataObject(data, viewPort, canvas));

                if(!this._firstSpriteZ)
                {
                    this._firstSpriteZ = data.z;
                }

                this._spriteCount = this._spriteCount + 1;
            }
        }

        return JSON.stringify(result);
    }

    /**
	 * AS3 builds an empty object and stringifies it — the modifiers slot is reserved, not used.
	 */
    // AS3: .../habbo/room/utils/_SafeCls_1840.as::getRoomRenderingModifiers()
    getRoomRenderingModifiers(): string
    {
        return JSON.stringify({});
    }

    // AS3: .../habbo/room/utils/_SafeCls_1840.as::getSpriteDataObject()
    private getSpriteDataObject(
        sprite: RoomObjectSpriteData,
        viewPort: IRoomEngineRectangle,
        canvas: RoomRenderingCanvas
    ): Record<string, unknown>
    {
        const data: Record<string, unknown> = {};
        let name = sprite.name;

        // A palette-swapped asset is `assetName@paletteId`; AS3 resolves the palette's source image
        // through the content loader. That lookup needs `getGraphicAssetCollection().getPaletteXML()`
        // and is left out with the name split kept, so the base asset still resolves server-side.
        if(name.indexOf('@') !== -1)
        {
            name = name.split('@')[0];
        }

        data.name = name;
        data.x = sprite.x - viewPort.left + canvas.screenOffsetX;
        data.y = sprite.y - viewPort.top + canvas.screenOffsetY;
        data.z = sprite.z;

        // Each of these is omitted at its default, exactly as AS3 does — the payload is
        // checksummed by length, so an extra key is not free.
        if(sprite.alpha && sprite.alpha.toString() !== '255') data.alpha = sprite.alpha;

        if(sprite.flipH) data.flipH = sprite.flipH;

        if(sprite.color) data.color = sprite.color;

        if(sprite.blendMode && sprite.blendMode !== 'normal') data.blendMode = sprite.blendMode;

        // The shear and the frame only reach the payload for the sprites the canvas set them on —
        // a wall photo or a forum thumbnail. Both are omitted at their default like the rest.
        if(sprite.skew) data.skew = sprite.skew;

        if(sprite.frame) data.frame = sprite.frame;

        if(name.indexOf('http') === 0)
        {
            data.width = sprite.width;
            data.height = sprite.height;

            this._externalImageCount = this._externalImageCount + 1;

            // Past the cap the image is replaced by a plain box rather than dropped, so the
            // composition still lines up.
            if(this._externalImageCount > SpriteDataCollector.MAX_EXTERNAL_IMAGE_COUNT)
            {
                data.name = 'box';
            }
        }

        if(sprite.posture) data.posture = sprite.posture;

        return data;
    }

    /**
	 * The background plane sits behind everything, at a z derived from the frontmost sprite plus a
	 * per-sprite bias — the two magic constants are AS3's and are what keep it behind a crowded
	 * room.
	 */
    // AS3: .../habbo/room/utils/_SafeCls_1840.as::makeBackgroundPlane()
    private makeBackgroundPlane(viewPort: IRoomEngineRectangle, color: number, planes: IPlaneDrawingData[]): IPlaneDrawingData
    {
        let z: number;

        if(planes.length > 0)
        {
            z = Number(planes[0].z);

            if(this._firstSpriteZ)
            {
                z = Math.max(this._firstSpriteZ, z);
            }
        }
        else
        {
            z = this._firstSpriteZ ? this._firstSpriteZ : 0;
        }

        z += this._spriteCount * 1.776104 + planes.length * 2.31743;

        // AS3: `new PlaneDrawingData(null, param2)` — the colour goes through the constructor.
        const plane = new PlaneDrawingData(null, color);

        // AS3 sorts the four corners through sortQuadPoints(); for an axis-aligned rectangle that
        // ordering is bottom-right, bottom-left, top-right, top-left.
        plane.cornerPoints = [
            {x: viewPort.width, y: viewPort.height},
            {x: 0, y: viewPort.height},
            {x: viewPort.width, y: 0},
            {x: 0, y: 0}
        ];

        plane.z = z;

        return plane;
    }

    /**
	 * The room's own planes — floor tiles, walls, landscape.
	 */
    // AS3: .../habbo/room/utils/_SafeCls_1840.as::getRoomPlanes()
    getRoomPlanes(
        viewPort: IRoomEngineRectangle,
        canvas: RoomRenderingCanvas,
        engine: RoomEngine,
        backgroundColor: number
    ): IPlaneDrawingData[]
    {
        const planes: IPlaneDrawingData[] = [];
        const room = engine.getRoomObject(
            engine.activeRoomId, RoomEngine.OBJECT_ID_ROOM, RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM
        );
        const visualization = (room?.getVisualization() ?? null) as RoomVisualization | null;

        if(visualization !== null)
        {
            const geometry = canvas.geometry;

            for(const {plane, z} of this.sortRoomPlanes(visualization.planes, canvas))
            {
                // The three corners the plane's own vectors reach, plus the fourth by adding both:
                // a plane is an origin and two edges, so its quad is origin, origin+left,
                // origin+right, origin+left+right.
                // `Vector3d.sum()` answers null only for a null operand, which a live plane's
                // vectors are not — but the four projections below can each answer null on their
                // own, so the whole quad is checked once rather than four times.
                const leftCorner = Vector3d.sum(plane.location, plane.leftSide);
                const rightCorner = Vector3d.sum(plane.location, plane.rightSide);

                if(leftCorner === null || rightCorner === null) continue;

                const farCorner = Vector3d.sum(leftCorner, plane.rightSide);

                if(farCorner === null) continue;

                const origin = geometry.getScreenPoint(plane.location);
                const left = geometry.getScreenPoint(leftCorner);
                const right = geometry.getScreenPoint(rightCorner);
                const far = geometry.getScreenPoint(farCorner);

                if(origin === null || left === null || right === null || far === null) continue;

                const corners = [origin, left, right, far];
                let outsideX = 0;
                let outsideY = 0;

                for(const corner of corners)
                {
                    // Screen points come out centred on the room's origin; the same three offsets
                    // the renderer applies put them in viewport space.
                    corner.x += canvas.width / 2 + canvas.screenOffsetX - viewPort.left;
                    corner.y += canvas.height / 2 + canvas.screenOffsetY - viewPort.top;

                    if(corner.x < 0) outsideX--;
                    else if(corner.x >= viewPort.width) outsideX++;

                    if(corner.y < 0) outsideY--;
                    else if(corner.y >= viewPort.height) outsideY++;
                }

                // All four corners off the *same* side means the plane cannot cross the viewport.
                // Counting up and down separately is what stops a plane straddling it being culled.
                if(Math.abs(outsideX) === 4 || Math.abs(outsideY) === 4) continue;

                const sorted = SpriteDataCollector.sortQuadPoints(origin, left, right, far);

                // One entry per visualization layer, each with its own blended colour and asset
                // columns; they all share this plane's projected corners and z, which is what AS3
                // stamps on here — the corner array is shared by reference there too.
                // AS3: .../habbo/room/utils/_SafeCls_1840.as::getRoomPlanes()
                for(const data of plane.getDrawingDatas(geometry))
                {
                    data.cornerPoints = sorted;
                    data.z = z;

                    planes.push(data);
                }
            }
        }

        // AS3 unshifts it, so the background is the first entry and everything else sorts over it.
        planes.unshift(this.makeBackgroundPlane(viewPort, backgroundColor, planes));

        return planes;
    }
}
