/**
 * RoomGeometry
 *
 * Based on AS3: com.sulake.room.utils.RoomGeometry
 *
 * Handles isometric room projection and coordinate transformations.
 */
import type {IRoomGeometry, IPoint} from './IRoomGeometry';
import type {IVector3d} from './IVector3d';
import {Vector3d} from './Vector3d';

export class RoomGeometry implements IRoomGeometry
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::SCALE_ZOOMED_IN
    public static readonly SCALE_ZOOMED_IN: number = 64;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::SCALE_ZOOMED_OUT
    public static readonly SCALE_ZOOMED_OUT: number = 32;
    private _x: Vector3d;
    private _y: Vector3d;
    private _z: Vector3d;
    private _locationCache: Vector3d;
    private _directionCache: Vector3d;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::_depth
    private _depth: Vector3d;
    private _xScale: number = 1;
    private _yScale: number = 1;
    private _zScale: number = 1;
    private _xScaleInternal: number = 1;
    private _yScaleInternal: number = 1;
    private _zScaleInternal: number = 1;
    private _depthMin: number = -500;
    private _depthMax: number = 500;
    // AS3: sources/win63_version/room/utils/RoomGeometry.as::var_1033 (displacement map)
    private _displacements: Map<string, Vector3d> = new Map();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::RoomGeometry()
    constructor(scale: number, direction: IVector3d, location: IVector3d, depthDirection: IVector3d | null = null)
    {
        this.setScale(scale);
        this._x = new Vector3d();
        this._y = new Vector3d();
        this._z = new Vector3d();
        this._directionAxis = new Vector3d();
        this._locationCache = new Vector3d();
        this._directionCache = new Vector3d();
        this._depth = new Vector3d();

        this._xScaleInternal = 1;
        this._yScaleInternal = 1;
        this.x_scale = 1;
        this.y_scale = 1;
        this._zScaleInternal = Math.sqrt(0.5) / Math.sqrt(0.75);
        this.z_scale = 1;

        this.location = new Vector3d(location.x, location.y, location.z);
        this.direction = new Vector3d(direction.x, direction.y, direction.z);

        if(depthDirection !== null)
        {
            this.setDepthVector(depthDirection);
        }
        else
        {
            this.setDepthVector(direction);
        }
    }

    private _updateId: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::get updateId()
    get updateId(): number
    {
        return this._updateId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::_directionAxis
    private _directionAxis: Vector3d;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::get directionAxis()
    get directionAxis(): IVector3d
    {
        return this._directionAxis;
    }

    private _scale: number = 1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::get scale()
    get scale(): number
    {
        return this._scale / Math.sqrt(0.5);
    }

    private _location: Vector3d | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::get location()
    get location(): IVector3d
    {
        this._locationCache.assign(this._location);
        this._locationCache.x *= this._xScale;
        this._locationCache.y *= this._yScale;
        this._locationCache.z *= this._zScale;

        return this._locationCache;
    }

    private _direction: Vector3d | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::get direction()
    get direction(): IVector3d
    {
        return this._directionCache;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::set x_scale()
    set x_scale(value: number)
    {
        if(this._xScale !== value * this._xScaleInternal)
        {
            this._xScale = value * this._xScaleInternal;
            this._updateId++;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::set y_scale()
    set y_scale(value: number)
    {
        if(this._yScale !== value * this._yScaleInternal)
        {
            this._yScale = value * this._yScaleInternal;
            this._updateId++;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::set z_scale()
    set z_scale(value: number)
    {
        if(this._zScale !== value * this._zScaleInternal)
        {
            this._zScale = value * this._zScaleInternal;
            this._updateId++;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::getIntersectionVector()
    static getIntersectionVector(
        origin: IVector3d,
        direction: IVector3d,
        planeOrigin: IVector3d,
        planeNormal: IVector3d
    ): IVector3d | null
    {
        const denom = Vector3d.dotProduct(direction, planeNormal);

        if(Math.abs(denom) < 0.00001)
        {
            return null;
        }

        const diff = Vector3d.dif(origin, planeOrigin);
        const t = -Vector3d.dotProduct(planeNormal, diff!) / denom;

        return Vector3d.sum(origin, Vector3d.product(direction, t)!);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::dispose()
    dispose(): void
    {
        this._displacements.clear();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::setDisplacement()
    // The AS3 body is decompiler-corrupted (`null.assign(param2)`, `var_1033.add(null,null)`),
    // so this reconstructs the evident intent (key the displacement map by rounded
    // location) rather than transliterating the broken code.
    setDisplacement(location: IVector3d, displacement: IVector3d): void
    {
        if(location === null || displacement === null)
        {
            return;
        }

        const key = `${Math.round(location.x)}_${Math.round(location.y)}_${Math.round(location.z)}`;

        const vector = new Vector3d();

        vector.assign(displacement);

        this._displacements.set(key, vector);
        this._updateId++;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::setDepthVector()
    setDepthVector(direction: IVector3d): void
    {
        const yAxis = new Vector3d(0, 1, 0);
        const zAxis = new Vector3d(0, 0, 1);
        const xAxis = new Vector3d(1, 0, 0);

        const angleX = direction.x / 180 * Math.PI;
        const angleY = direction.y / 180 * Math.PI;
        const angleZ = direction.z / 180 * Math.PI;

        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);

        const rotatedY = Vector3d.sum(Vector3d.product(yAxis, cosX), Vector3d.product(xAxis, -sinX))!;
        const rotatedZ = new Vector3d(zAxis.x, zAxis.y, zAxis.z);
        const rotatedX = Vector3d.sum(Vector3d.product(yAxis, sinX), Vector3d.product(xAxis, cosX))!;

        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);

        const finalY = new Vector3d(rotatedY.x, rotatedY.y, rotatedY.z);
        const finalZ2 = Vector3d.sum(Vector3d.product(rotatedZ, cosY), Vector3d.product(rotatedX, sinY))!;
        const finalX2 = Vector3d.sum(Vector3d.product(rotatedZ, -sinY), Vector3d.product(rotatedX, cosY))!;

        if(angleZ !== 0)
        {
            const cosZ = Math.cos(angleZ);
            const sinZ = Math.sin(angleZ);

            const _finalY2 = Vector3d.sum(Vector3d.product(finalY, cosZ), Vector3d.product(finalZ2, sinZ));
            const _finalZ3 = Vector3d.sum(Vector3d.product(finalY, -sinZ), Vector3d.product(finalZ2, cosZ));

            const finalX3 = new Vector3d(finalX2.x, finalX2.y, finalX2.z);

            this._depth.assign(finalX3);
        }
        else
        {
            this._depth.assign(finalX2);
        }

        this._updateId++;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::adjustLocation()
    adjustLocation(location: IVector3d, z: number): void
    {
        if(location === null || this._z === null)
        {
            return;
        }

        const offset = Vector3d.product(this._z, -z)!;
        const newLocation = new Vector3d(
            location.x + offset.x,
            location.y + offset.y,
            location.z + offset.z
        );

        this.location = newLocation;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::getCoordinatePosition()
    getCoordinatePosition(vector: IVector3d): IVector3d | null
    {
        if(vector === null)
        {
            return null;
        }

        const projX = Vector3d.scalarProjection(vector, this._x);
        const projY = Vector3d.scalarProjection(vector, this._y);
        const projZ = Vector3d.scalarProjection(vector, this._z);

        return new Vector3d(projX, projY, projZ);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::getScreenPosition()
    getScreenPosition(vector: IVector3d): IVector3d | null
    {
        const diff = Vector3d.dif(vector, this._location);

        if(diff === null)
        {
            return null;
        }

        diff.x *= this._xScale;
        diff.y *= this._yScale;
        diff.z *= this._zScale;

        const depthProj = Vector3d.scalarProjection(diff, this._depth);

        if(depthProj < this._depthMin || depthProj > this._depthMax)
        {
            return null;
        }

        let screenX = Vector3d.scalarProjection(diff, this._x);
        let screenY = -Vector3d.scalarProjection(diff, this._y);

        screenX *= this._scale;
        screenY *= this._scale;

        const displacement = this.getDisplacement(vector);
        let finalDepth = depthProj;

        if(displacement !== null)
        {
            const diffWithDisp = Vector3d.dif(vector, this._location)!;

            diffWithDisp.add(displacement);
            diffWithDisp.x *= this._xScale;
            diffWithDisp.y *= this._yScale;
            diffWithDisp.z *= this._zScale;
            finalDepth = Vector3d.scalarProjection(diffWithDisp, this._depth);
        }

        diff.x = screenX;
        diff.y = screenY;
        diff.z = finalDepth;

        return diff;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::getScreenPoint()
    getScreenPoint(vector: IVector3d): IPoint | null
    {
        const screenPos = this.getScreenPosition(vector);

        if(screenPos === null)
        {
            return null;
        }

        return {x: screenPos.x, y: screenPos.y};
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::getPlanePosition()
    getPlanePosition(point: IPoint, loc: IVector3d, leftSide: IVector3d, rightSide: IVector3d): IPoint | null
    {
        const screenX = point.x / this._scale;
        const screenY = -point.y / this._scale;

        const screenVec = Vector3d.product(this._x, screenX)!;

        screenVec.add(Vector3d.product(this._y, screenY));

        const origin = new Vector3d(
            this._location!.x * this._xScale,
            this._location!.y * this._yScale,
            this._location!.z * this._zScale
        );
        origin.add(screenVec);

        const direction = this._z;

        const scaledLoc = new Vector3d(
            loc.x * this._xScale,
            loc.y * this._yScale,
            loc.z * this._zScale
        );

        const scaledLeft = new Vector3d(
            leftSide.x * this._xScale,
            leftSide.y * this._yScale,
            leftSide.z * this._zScale
        );

        const scaledRight = new Vector3d(
            rightSide.x * this._xScale,
            rightSide.y * this._yScale,
            rightSide.z * this._zScale
        );

        const normal = Vector3d.crossProduct(scaledLeft, scaledRight);

        const intersection = RoomGeometry.getIntersectionVector(origin, direction, scaledLoc, normal!) as Vector3d | null;

        if(intersection !== null)
        {
            intersection.sub(scaledLoc);

            const planeX = Vector3d.scalarProjection(intersection, leftSide) / scaledLeft.length * leftSide.length;
            const planeY = Vector3d.scalarProjection(intersection, rightSide) / scaledRight.length * rightSide.length;

            return {x: planeX, y: planeY};
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::performZoom()
    performZoom(): void
    {
        if(this.isZoomedIn())
        {
            this.setScale(32);
        }
        else
        {
            this.setScale(64);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::isZoomedIn()
    isZoomedIn(): boolean
    {
        return this.scale === 64;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::performZoomOut()
    performZoomOut(): void
    {
        this.setScale(32);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::performZoomIn()
    performZoomIn(): void
    {
        this.setScale(64);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::set scale()
    private setScale(value: number): void
    {
        if(value <= 1)
        {
            value = 1;
        }

        value *= Math.sqrt(0.5);

        if(value !== this._scale)
        {
            this._scale = value;
            this._updateId++;
        }
    }

    /**
	 * AS3 declares this a public setter and the port had it private, so nothing outside the class
	 * could move the camera — which is what left the room shake and rotate effects inert.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::set location()
    set location(location: IVector3d | null)
    {
        if(location === null)
        {
            return;
        }

        if(this._location === null)
        {
            this._location = new Vector3d();
        }

        const oldX = this._location.x;
        const oldY = this._location.y;
        const oldZ = this._location.z;

        this._location.assign(location);
        this._location.x /= this._xScale;
        this._location.y /= this._yScale;
        this._location.z /= this._zScale;

        if(this._location.x !== oldX || this._location.y !== oldY || this._location.z !== oldZ)
        {
            this._updateId++;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::set direction()
    set direction(direction: IVector3d | null)
    {
        if(direction === null)
        {
            return;
        }

        if(this._direction === null)
        {
            this._direction = new Vector3d();
        }

        const oldX = this._direction.x;
        const oldY = this._direction.y;
        const oldZ = this._direction.z;

        this._direction.assign(direction);
        this._directionCache.assign(direction);

        if(this._direction.x !== oldX || this._direction.y !== oldY || this._direction.z !== oldZ)
        {
            this._updateId++;
        }

        const yAxis = new Vector3d(0, 1, 0);
        const zAxis = new Vector3d(0, 0, 1);
        const xAxis = new Vector3d(1, 0, 0);

        const angleX = direction.x / 180 * Math.PI;
        const angleY = direction.y / 180 * Math.PI;
        const angleZ = direction.z / 180 * Math.PI;

        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);

        const rotatedY = Vector3d.sum(Vector3d.product(yAxis, cosX), Vector3d.product(xAxis, -sinX))!;
        const rotatedZ = new Vector3d(zAxis.x, zAxis.y, zAxis.z);
        const rotatedX = Vector3d.sum(Vector3d.product(yAxis, sinX), Vector3d.product(xAxis, cosX))!;

        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);

        const finalY = new Vector3d(rotatedY.x, rotatedY.y, rotatedY.z);
        const finalZ2 = Vector3d.sum(Vector3d.product(rotatedZ, cosY), Vector3d.product(rotatedX, sinY))!;
        const finalX2 = Vector3d.sum(Vector3d.product(rotatedZ, -sinY), Vector3d.product(rotatedX, cosY))!;

        if(angleZ !== 0)
        {
            const cosZ = Math.cos(angleZ);
            const sinZ = Math.sin(angleZ);

            const finalY2 = Vector3d.sum(Vector3d.product(finalY, cosZ), Vector3d.product(finalZ2, sinZ))!;
            const finalZ3 = Vector3d.sum(Vector3d.product(finalY, -sinZ), Vector3d.product(finalZ2, cosZ))!;
            const finalX3 = new Vector3d(finalX2.x, finalX2.y, finalX2.z);

            this._x.assign(finalY2);
            this._y.assign(finalZ3);
            this._z.assign(finalX3);
            this._directionAxis.assign(this._z);
        }
        else
        {
            this._x.assign(finalY);
            this._y.assign(finalZ2);
            this._z.assign(finalX2);
            this._directionAxis.assign(this._z);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/RoomGeometry.as::getDisplacenent() [sic]
    private getDisplacement(location: IVector3d): IVector3d | null
    {
        const key = `${Math.round(location.x)}_${Math.round(location.y)}_${Math.round(location.z)}`;

        return this._displacements.get(key) ?? null;
    }
}
