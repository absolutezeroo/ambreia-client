import type {Matrix4x4} from './Matrix4x4';
import {Vector3D} from './Vector3D';

/**
 * Base 3D node with a location and transformed location.
 *
 * @see sources/win63_version/habbo/avatar/geometry/Node3D.as
 */
export class Node3D
{
    private _needsTransform: boolean = false;

    constructor(x: number, y: number, z: number)
    {
        this._transformedLocation = new Vector3D();
        this._location = new Vector3D(x, y, z);

        if(x !== 0 || y !== 0 || z !== 0)
        {
            this._needsTransform = true;
        }
    }

    private _location: Vector3D;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Node3D.as::get location()
    public get location(): Vector3D
    {
        return this._location;
    }

    private _transformedLocation: Vector3D;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Node3D.as::get transformedLocation()
    public get transformedLocation(): Vector3D
    {
        return this._transformedLocation;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Node3D.as::applyTransform()
    public applyTransform(matrix: Matrix4x4): void
    {
        if(this._needsTransform)
        {
            this._transformedLocation = matrix.vectorMultiplication(this._location);
        }
    }
}
