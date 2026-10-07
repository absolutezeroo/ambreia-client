/**
 * FurnitureCuboidVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureCuboidVisualization
 *
 * Renders furniture as a colored 3D cuboid. Used for furniture that
 * doesn't have custom sprites (e.g., invisible/placeholder items).
 * Creates FurniturePlane objects and projects them via room geometry.
 */
import {Texture} from 'pixi.js';
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {IRoomObjectVisualizationData} from '../../object/visualization/IRoomObjectVisualizationData';
import {RoomObjectSpriteVisualization} from '../../object/visualization/RoomObjectSpriteVisualization';
import {Vector3d} from '../../utils/Vector3d';
import {FurniturePlane} from './FurniturePlane';

export class FurnitureCuboidVisualization extends RoomObjectSpriteVisualization
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureCuboidVisualization.as::_planes
    private _planes: FurniturePlane[] = [];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureCuboidVisualization.as::_planesInitialized
    private _planesInitialized: boolean = false;
    private _updateCounter: number = 0;

    override initialize(_data: IRoomObjectVisualizationData): boolean
    {
        this.reset();
        return true;
    }

    override update(geometry: IRoomGeometry, time: number, _update: boolean, _skipUpdate: boolean): void
    {
        const roomObject = this.object;

        if(roomObject === null) return;
        if(geometry === null) return;

        this.initializePlanes();
        this.updatePlanes(geometry, time);
    }

    override dispose(): void
    {
        super.dispose();

        for(const plane of this._planes)
        {
            if(plane !== null)
            {
                plane.dispose();
            }
        }

        this._planes = [];
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureCuboidVisualization.as::defineSprites()
    protected defineSprites(): void
    {
        this.createSprites(1);
    }

    /**
	 * Initialize planes from the room object model dimensions.
	 *
	 * Creates a single top-face plane from furniture_size_x/y/z.
	 *
	 * @see AS3 FurnitureCuboidVisualization.initializePlanes()
	 */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureCuboidVisualization.as::initializePlanes()
    protected initializePlanes(): void
    {
        if(this._planesInitialized) return;

        const roomObject = this.object;

        if(roomObject === null) return;

        const model = roomObject.getModel();
        const sizeX = model.getNumber('furniture_size_x');
        const sizeY = model.getNumber('furniture_size_y');
        const sizeZ = model.getNumber('furniture_size_z');

        if(isNaN(sizeX) || isNaN(sizeY) || isNaN(sizeZ)) return;

        const leftSide = new Vector3d(sizeX, 0, 0);
        const rightSide = new Vector3d(0, sizeY, 0);
        const origin = new Vector3d(-0.5, -0.5, 0);

        if(origin !== null && leftSide !== null && rightSide !== null)
        {
            const plane = new FurniturePlane(origin, leftSide, rightSide);
            plane.color = 0xFFFF00; // Yellow default (matches AS3)
            this._planes.push(plane);
            this._planesInitialized = true;
            this.defineSprites();
        }
    }

    /**
	 * Update all planes and sync their bitmaps to sprites.
	 *
	 * @see AS3 FurnitureCuboidVisualization.updatePlanes()
	 */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureCuboidVisualization.as::updatePlanes()
    protected updatePlanes(geometry: IRoomGeometry, time: number): void
    {
        const roomObject = this.object;

        if(roomObject === null) return;

        this._updateCounter++;

        for(let i = 0; i < this._planes.length; i++)
        {
            const plane = this._planes[i];

            if(plane === null) continue;

            // Handle rotation for diagonal directions
            const dir = Math.floor(roomObject.getDirection().x);

            if(dir / 45 === 2 || dir / 45 === 6)
            {
                plane.setRotation(true);
            }
            else
            {
                plane.setRotation(false);
            }

            const changed = plane.update(geometry, time);

            const sprite = this.getSprite(i);

            if(sprite !== null)
            {
                if(plane !== null)
                {
                    const offset = plane.offset;
                    sprite.offsetX = -offset.x;
                    sprite.offsetY = -offset.y;
                    sprite.color = plane.color;
                    sprite.visible = plane.visible;
                }
                else
                {
                    sprite.visible = false;
                }

                const bitmap = plane.bitmapData;
                sprite.texture = bitmap !== null ? Texture.from(bitmap) : null;

                if(changed)
                {
                    sprite.assetName = `plane_${i}_${geometry.scale}_${roomObject.getInstanceId()}_${this._updateCounter}`;
                }

                sprite.relativeDepth = plane.relativeDepth;
            }
        }
    }
}
