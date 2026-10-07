import {Node3D} from './Node3D';
import {Vector3D} from './Vector3D';
import {getXmlAttribute, getXmlRoot} from '../structure/AvatarXmlUtils';

/**
 * A geometry item representing a single body part piece in 3D space.
 *
 * @see sources/win63_version/habbo/avatar/geometry/GeometryItem.as
 */
export class GeometryItem extends Node3D
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryItem.as::_radius
    private _radius: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryItem.as::GeometryItem()
    constructor(data: any, isDynamic: boolean = false)
    {
        const element = getXmlRoot(data);
        const x = element ? getXmlAttribute(element, 'x') : data.x;
        const y = element ? getXmlAttribute(element, 'y') : data.y;
        const z = element ? getXmlAttribute(element, 'z') : data.z;

        super(
            parseFloat(x) || 0,
            parseFloat(y) || 0,
            parseFloat(z) || 0
        );

        this._id = element ? getXmlAttribute(element, 'id') : String(data.id);
        this._radius = parseFloat(element ? getXmlAttribute(element, 'radius') : data.radius) || 0;
        this._normal = new Vector3D(
            parseFloat(element ? getXmlAttribute(element, 'nx') : data.nx) || 0,
            parseFloat(element ? getXmlAttribute(element, 'ny') : data.ny) || 0,
            parseFloat(element ? getXmlAttribute(element, 'nz') : data.nz) || 0
        );
        this._isDoubleSided = Boolean(parseInt(element ? getXmlAttribute(element, 'double') : data.double));
        this._isDynamic = isDynamic;
    }

    private _id: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryItem.as::get id()
    public get id(): string
    {
        return this._id;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryItem.as::_normal
    private _normal: Vector3D;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryItem.as::get normal()
    public get normal(): Vector3D
    {
        return this._normal;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryItem.as::_isDoubleSided
    private _isDoubleSided: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryItem.as::get isDoubleSided()
    public get isDoubleSided(): boolean
    {
        return this._isDoubleSided;
    }

    private _isDynamic: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryItem.as::get isDynamic()
    public get isDynamic(): boolean
    {
        return this._isDynamic;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryItem.as::getDistance()
    public getDistance(camera: Vector3D): number
    {
        const near = Math.abs(camera.z - this.transformedLocation.z - this._radius);
        const far = Math.abs(camera.z - this.transformedLocation.z + this._radius);

        return Math.min(near, far);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryItem.as::toString()
    public toString(): string
    {
        return this._id + ': ' + this.location + ' - ' + this.transformedLocation;
    }
}