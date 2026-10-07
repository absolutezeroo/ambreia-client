/**
 * Vector3d
 *
 * Based on AS3: com.sulake.room.utils.Vector3d
 *
 * A mutable 3D vector implementation with static utility methods.
 */
import type {IVector3d} from './IVector3d';

export class Vector3d implements IVector3d
{
    constructor(x: number = 0, y: number = 0, z: number = 0)
    {
        this._x = x;
        this._y = y;
        this._z = z;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/utils/Vector3d.as::_x
    private _x: number;

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::get x()
    get x(): number
    {
        return this._x;
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::set x()
    set x(value: number)
    {
        this._x = value;
        this._length = NaN;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/utils/Vector3d.as::_y
    private _y: number;

    // Static utility methods

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::get y()
    get y(): number
    {
        return this._y;
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::set y()
    set y(value: number)
    {
        this._y = value;
        this._length = NaN;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/utils/Vector3d.as::_z
    private _z: number;

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::get z()
    get z(): number
    {
        return this._z;
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::set z()
    set z(value: number)
    {
        this._z = value;
        this._length = NaN;
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::_length
    private _length: number = NaN;

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::get length()
    get length(): number
    {
        if(isNaN(this._length))
        {
            this._length = Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z);
        }

        return this._length;
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::sum()
    static sum(a: IVector3d | null, b: IVector3d | null): Vector3d | null
    {
        if(a === null || b === null)
        {
            return null;
        }

        return new Vector3d(a.x + b.x, a.y + b.y, a.z + b.z);
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::dif()
    static dif(a: IVector3d | null, b: IVector3d | null): Vector3d | null
    {
        if(a === null || b === null)
        {
            return null;
        }

        return new Vector3d(a.x - b.x, a.y - b.y, a.z - b.z);
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::product()
    static product(v: IVector3d | null, scalar: number): Vector3d | null
    {
        if(v === null)
        {
            return null;
        }

        return new Vector3d(v.x * scalar, v.y * scalar, v.z * scalar);
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::dotProduct()
    static dotProduct(a: IVector3d | null, b: IVector3d | null): number
    {
        if(a === null || b === null)
        {
            return 0;
        }

        return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::crossProduct()
    static crossProduct(a: IVector3d | null, b: IVector3d | null): Vector3d | null
    {
        if(a === null || b === null)
        {
            return null;
        }

        return new Vector3d(
            a.y * b.z - a.z * b.y,
            a.z * b.x - a.x * b.z,
            a.x * b.y - a.y * b.x
        );
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::scalarProjection()
    static scalarProjection(a: IVector3d | null, b: IVector3d | null): number
    {
        if(a === null || b === null)
        {
            return -1;
        }

        const len = b.length;

        if(len > 0)
        {
            return (a.x * b.x + a.y * b.y + a.z * b.z) / len;
        }

        return -1;
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::cosAngle()
    static cosAngle(a: IVector3d | null, b: IVector3d | null): number
    {
        if(a === null || b === null)
        {
            return 0;
        }

        const lenProduct = a.length * b.length;

        if(lenProduct === 0)
        {
            return 0;
        }

        return Vector3d.dotProduct(a, b) / lenProduct;
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::isEqual()
    static isEqual(a: IVector3d | null, b: IVector3d | null): boolean
    {
        if(a === null || b === null)
        {
            return false;
        }

        return a.x === b.x && a.y === b.y && a.z === b.z;
    }

    // Instance methods

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::negate()
    negate(): void
    {
        this._x = -this._x;
        this._y = -this._y;
        this._z = -this._z;
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::add()
    add(v: IVector3d | null): void
    {
        if(v === null)
        {
            return;
        }

        this._x += v.x;
        this._y += v.y;
        this._z += v.z;
        this._length = NaN;
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::sub()
    sub(v: IVector3d | null): void
    {
        if(v === null)
        {
            return;
        }

        this._x -= v.x;
        this._y -= v.y;
        this._z -= v.z;
        this._length = NaN;
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::mul()
    mul(scalar: number): void
    {
        this._x *= scalar;
        this._y *= scalar;
        this._z *= scalar;
        this._length = NaN;
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::div()
    div(scalar: number): void
    {
        if(scalar !== 0)
        {
            this._x /= scalar;
            this._y /= scalar;
            this._z /= scalar;
            this._length = NaN;
        }
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::assign()
    assign(v: IVector3d | null): void
    {
        if(v === null)
        {
            return;
        }

        this._x = v.x;
        this._y = v.y;
        this._z = v.z;
        this._length = NaN;
    }

    // AS3: .../src/com/sulake/room/utils/Vector3d.as::toString()
    toString(): string
    {
        return `(${this._x},${this._y},${this._z})`;
    }
}
