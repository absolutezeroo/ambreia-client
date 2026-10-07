/**
 * RoomWallData
 *
 * Based on AS3: com.sulake.habbo.room.object.RoomWallData
 */
import {Vector3d} from '../../utils/Vector3d';
import type {IVector3d} from '../../utils/IVector3d';

export interface IPoint
{
    x: number;
    y: number;
}

export class RoomWallData
{
    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::WALL_DIRECTION_VECTORS
    public static readonly WALL_DIRECTION_VECTORS: IVector3d[] = [
        new Vector3d(1, 0, 0),
        new Vector3d(0, 1, 0),
        new Vector3d(-1, 0, 0),
        new Vector3d(0, -1, 0),
    ];

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::WALL_NORMAL_VECTORS
    public static readonly WALL_NORMAL_VECTORS: IVector3d[] = [
        new Vector3d(0, 1, 0),
        new Vector3d(-1, 0, 0),
        new Vector3d(0, -1, 0),
        new Vector3d(1, 0, 0),
    ];

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::_corners
    private _corners: IPoint[] = [];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomWallData.as::_endPoints
    private _endPoints: IPoint[] = [];
    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::_directions
    private _directions: number[] = [];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomWallData.as::_lengths
    private _lengths: number[] = [];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomWallData.as::_leftTurns
    private _leftTurns: boolean[] = [];
    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::_borders
    private _borders: boolean[] = [];
    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::_hideWalls
    private _hideWalls: boolean[] = [];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomWallData.as::_manuallyLeftCut
    private _manuallyLeftCut: boolean[] = [];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomWallData.as::_manuallyRightCut
    private _manuallyRightCut: boolean[] = [];
    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::_count
    private _count: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::get count()
    get count(): number
    {
        return this._count;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::addWall()
    addWall(corner: IPoint, direction: number, length: number, border: boolean, leftTurn: boolean): void
    {
        if(this.checkIsNotDuplicate(corner, direction, length, border, leftTurn))
        {
            this._corners.push({x: corner.x, y: corner.y});
            this._directions.push(direction);
            this._lengths.push(length);
            this._borders.push(border);
            this._leftTurns.push(leftTurn);
            this._hideWalls.push(false);
            this._manuallyLeftCut.push(false);
            this._manuallyRightCut.push(false);
            this._count++;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::getCorner()
    getCorner(index: number): IPoint
    {
        return this._corners[index];
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::getEndPoint()
    getEndPoint(index: number): IPoint
    {
        this.calculateWallEndPoints();
        return this._endPoints[index];
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::getLength()
    getLength(index: number): number
    {
        return this._lengths[index];
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::getDirection()
    getDirection(index: number): number
    {
        return this._directions[index];
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::getBorder()
    getBorder(index: number): boolean
    {
        return this._borders[index];
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::getHideWall()
    getHideWall(index: number): boolean
    {
        return this._hideWalls[index];
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::getLeftTurn()
    getLeftTurn(index: number): boolean
    {
        return this._leftTurns[index];
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::getManuallyLeftCut()
    getManuallyLeftCut(index: number): boolean
    {
        return this._manuallyLeftCut[index];
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::getManuallyRightCut()
    getManuallyRightCut(index: number): boolean
    {
        return this._manuallyRightCut[index];
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::setHideWall()
    setHideWall(index: number, hide: boolean): void
    {
        this._hideWalls[index] = hide;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::setLength()
    setLength(index: number, length: number): void
    {
        if(length < this._lengths[index])
        {
            this._lengths[index] = length;
            this._manuallyRightCut[index] = true;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::moveCorner()
    moveCorner(index: number, distance: number): void
    {
        if(distance > 0 && distance < this._lengths[index])
        {
            const dir = RoomWallData.WALL_DIRECTION_VECTORS[this.getDirection(index)];
            this._corners[index] = {
                x: this._corners[index].x + distance * dir.x,
                y: this._corners[index].y + distance * dir.y,
            };
            this._lengths[index] -= distance;
            this._manuallyLeftCut[index] = true;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::checkIsNotDuplicate()
    private checkIsNotDuplicate(corner: IPoint, direction: number, length: number, border: boolean, leftTurn: boolean): boolean
    {
        for(let i = 0; i < this._count; i++)
        {
            if(this._corners[i].x === corner.x &&
				this._corners[i].y === corner.y &&
				this._directions[i] === direction &&
				this._lengths[i] === length &&
				this._borders[i] === border &&
				this._leftTurns[i] === leftTurn)
            {
                return false;
            }
        }
        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomWallData.as::calculateWallEndPoints()
    private calculateWallEndPoints(): void
    {
        if(this._endPoints.length !== this._count)
        {
            this._endPoints = [];

            for(let i = 0; i < this._count; i++)
            {
                const corner = this.getCorner(i);
                const dir = RoomWallData.WALL_DIRECTION_VECTORS[this.getDirection(i)];
                const length = this.getLength(i);

                this._endPoints.push({
                    x: corner.x + dir.x * length,
                    y: corner.y + dir.y * length,
                });
            }
        }
    }
}
