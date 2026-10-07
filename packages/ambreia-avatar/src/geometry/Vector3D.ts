/**
 * 3D vector used in avatar geometry calculations.
 *
 * @see sources/win63_version/habbo/avatar/geometry/Vector3D.as
 */
export class Vector3D
{
    constructor(x: number = 0, y: number = 0, z: number = 0)
    {
        this._x = x;
        this._y = y;
        this._z = z;
    }

    private _x: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Vector3D.as::get x()
    public get x(): number
    {
        return this._x;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Vector3D.as::set x()
    public set x(value: number)
    {
        this._x = value;
    }

    private _y: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Vector3D.as::get y()
    public get y(): number
    {
        return this._y;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Vector3D.as::set y()
    public set y(value: number)
    {
        this._y = value;
    }

    private _z: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Vector3D.as::get z()
    public get z(): number
    {
        return this._z;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Vector3D.as::set z()
    public set z(value: number)
    {
        this._z = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Vector3D.as::dot()
    public static dot(a: Vector3D, b: Vector3D): number
    {
        return a._x * b._x + a._y * b._y + a._z * b._z;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Vector3D.as::cross()
    public static cross(a: Vector3D, b: Vector3D): Vector3D
    {
        const result = new Vector3D();

        result._x = a._y * b._z - a._z * b._y;
        result._y = a._z * b._x - a._x * b._z;
        result._z = a._x * b._y - a._y * b._x;

        return result;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Vector3D.as::subtract()
    public static subtract(a: Vector3D, b: Vector3D): Vector3D
    {
        return new Vector3D(a._x - b._x, a._y - b._y, a._z - b._z);
    }

    public dotProduct(other: Vector3D): number
    {
        return this._x * other._x + this._y * other._y + this._z * other._z;
    }

    public crossProduct(other: Vector3D): Vector3D
    {
        const result = new Vector3D();

        result._x = this._y * other._z - this._z * other._y;
        result._y = this._z * other._x - this._x * other._z;
        result._z = this._x * other._y - this._y * other._x;

        return result;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Vector3D.as::subtract()
    public subtract(other: Vector3D): void
    {
        this._x -= other._x;
        this._y -= other._y;
        this._z -= other._z;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Vector3D.as::add()
    public add(other: Vector3D): void
    {
        this._x += other._x;
        this._y += other._y;
        this._z += other._z;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Vector3D.as::normalize()
    public normalize(): void
    {
        const len = 1 / this.length();

        this._x *= len;
        this._y *= len;
        this._z *= len;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Vector3D.as::length()
    public length(): number
    {
        return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Vector3D.as::toString()
    public toString(): string
    {
        return 'Vector3D: (' + this._x + ',' + this._y + ',' + this._z + ')';
    }
}
