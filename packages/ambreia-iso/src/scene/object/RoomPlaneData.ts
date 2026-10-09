/**
 * RoomPlaneData
 *
 * Based on AS3: com.sulake.habbo.room.object.RoomPlaneData
 */
import {Vector3d} from '../../utils/Vector3d';
import type {IVector3d} from '../../utils/IVector3d';
import {RoomPlaneMaskData} from './RoomPlaneMaskData';

export class RoomPlaneData
{
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::PLANE_UNDEFINED
    public static readonly PLANE_UNDEFINED: number = 0;
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::PLANE_FLOOR
    public static readonly PLANE_FLOOR: number = 1;
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::PLANE_WALL
    public static readonly PLANE_WALL: number = 2;
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::PLANE_LANDSCAPE
    public static readonly PLANE_LANDSCAPE: number = 3;
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::PLANE_BILLBOARD
    public static readonly PLANE_BILLBOARD: number = 4;

    /**
     * How far behind the objects on its own tile a raised floor piece sorts (sortTile): less than a
     * tile step (0.7071), so the objects on the tile behind stay behind it. An object standing on a
     * raised tile has its sprites held in front of that (RoomRenderingCanvas.raisedFloorAt), its
     * shadow's +1 included.
     */
    // TS-only: see sortTile.
    public static readonly RAISED_FLOOR_DEPTH: number = 0.6;
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::_secondaryNormals
    private _secondaryNormals: Vector3d[] = [];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneData.as::_masks
    private _masks: RoomPlaneMaskData[] = [];

    /**
     * A piece of raised floor sorts among the objects as the tile it stands on: the tile's centre at
     * its height. Null for the ground and the walls, which stay behind every object.
     */
    // TS-only: see RoomPlaneParser.extractPlanes().
    public sortTile: Vector3d | null = null;

    /**
     * The building a raised floor piece belongs to: the raised tiles joined edge to edge share one
     * number, so a block, its staircase and the walls touching it fade together. -1 elsewhere.
     */
    // TS-only: see RoomPlaneParser.extractPlanes().
    public sortGroup: number = -1;

    constructor(type: number, loc: IVector3d, leftSide: IVector3d, rightSide: IVector3d, secondaryNormals: IVector3d[] | null)
    {
        this._loc = new Vector3d();
        this._loc.assign(loc);

        this._leftSide = new Vector3d();
        this._leftSide.assign(leftSide);

        this._rightSide = new Vector3d();
        this._rightSide.assign(rightSide);

        this._type = type;

        if(leftSide !== null && rightSide !== null)
        {
            this._normal = Vector3d.crossProduct(leftSide, rightSide);

            if(this._normal !== null)
            {
                let angleX = 0;
                let angleY: number;
                const angleZ = 0;

                if(this._normal.x !== 0 || this._normal.y !== 0)
                {
                    let dx = this._normal.x;
                    let dy = this._normal.y;

                    angleX = 360 + (Math.atan2(dy, dx) / Math.PI * 180);
                    if(angleX >= 360) angleX -= 360;

                    dx = Math.sqrt(this._normal.x * this._normal.x + this._normal.y * this._normal.y);
                    dy = this._normal.z;

                    angleY = 360 + (Math.atan2(dy, dx) / Math.PI * 180);
                    if(angleY >= 360) angleY -= 360;
                }
                else if(this._normal.z < 0)
                {
                    angleY = 90;
                }
                else
                {
                    angleY = 270;
                }

                this._normalDirection = new Vector3d(angleX, angleY, angleZ);
            }
        }

        if(secondaryNormals !== null && secondaryNormals.length > 0)
        {
            for(const normal of secondaryNormals)
            {
                if(normal !== null && normal.length > 0)
                {
                    const vec = new Vector3d();
                    vec.assign(normal);
                    vec.mul(1 / vec.length);
                    this._secondaryNormals.push(vec);
                }
            }
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneData.as::_type
    private _type: number;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::get type()
    get type(): number
    {
        return this._type;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneData.as::_loc
    private _loc: Vector3d;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::get loc()
    get loc(): IVector3d
    {
        return this._loc;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::_leftSide
    private _leftSide: Vector3d;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::get leftSide()
    get leftSide(): IVector3d
    {
        return this._leftSide;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::_rightSide
    private _rightSide: Vector3d;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::get rightSide()
    get rightSide(): IVector3d
    {
        return this._rightSide;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::_normal
    private _normal: Vector3d | null = null;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::get normal()
    get normal(): IVector3d | null
    {
        return this._normal;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneData.as::_normalDirection
    private _normalDirection: Vector3d | null = null;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::get normalDirection()
    get normalDirection(): IVector3d | null
    {
        return this._normalDirection;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::get secondaryNormalCount()
    get secondaryNormalCount(): number
    {
        return this._secondaryNormals.length;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::get maskCount()
    get maskCount(): number
    {
        return this._masks.length;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::getSecondaryNormal()
    getSecondaryNormal(index: number): IVector3d | null
    {
        if(index < 0 || index >= this.secondaryNormalCount)
        {
            return null;
        }

        const result = new Vector3d();
        result.assign(this._secondaryNormals[index]);
        return result;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::addMask()
    addMask(leftSideLoc: number, rightSideLoc: number, leftSideLength: number, rightSideLength: number): void
    {
        const mask = new RoomPlaneMaskData(leftSideLoc, rightSideLoc, leftSideLength, rightSideLength);
        this._masks.push(mask);
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::getMaskLeftSideLoc()
    getMaskLeftSideLoc(index: number): number
    {
        const mask = this.getMask(index);
        if(mask !== null) return mask.leftSideLoc;
        return -1;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::getMaskRightSideLoc()
    getMaskRightSideLoc(index: number): number
    {
        const mask = this.getMask(index);
        if(mask !== null) return mask.rightSideLoc;
        return -1;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::getMaskLeftSideLength()
    getMaskLeftSideLength(index: number): number
    {
        const mask = this.getMask(index);
        if(mask !== null) return mask.leftSideLength;
        return -1;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::getMaskRightSideLength()
    getMaskRightSideLength(index: number): number
    {
        const mask = this.getMask(index);
        if(mask !== null) return mask.rightSideLength;
        return -1;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneData.as::getMask()
    private getMask(index: number): RoomPlaneMaskData | null
    {
        if(index < 0 || index >= this.maskCount)
        {
            return null;
        }
        return this._masks[index];
    }
}
