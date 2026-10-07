import {Vector3D} from './Vector3D';

/**
 * 4x4 matrix (stored as 3x3) for avatar geometry transformations.
 *
 * @see sources/win63_version/habbo/avatar/geometry/Matrix4x4.as
 */
export class Matrix4x4
{
    public static readonly IDENTITY: Matrix4x4 = new Matrix4x4(1, 0, 0, 0, 1, 0, 0, 0, 1);

    constructor(
        m00: number = 0, m01: number = 0, m02: number = 0,
        m10: number = 0, m11: number = 0, m12: number = 0,
        m20: number = 0, m21: number = 0, m22: number = 0
    )
    {
        this._data = [m00, m01, m02, m10, m11, m12, m20, m21, m22];
    }

    private _data: number[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Matrix4x4.as::get data()
    public get data(): number[]
    {
        return this._data;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Matrix4x4.as::getXRotationMatrix()
    public static getXRotationMatrix(angle: number): Matrix4x4
    {
        const rad = angle * Math.PI / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);

        return new Matrix4x4(1, 0, 0, 0, c, -s, 0, s, c);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Matrix4x4.as::getYRotationMatrix()
    public static getYRotationMatrix(angle: number): Matrix4x4
    {
        const rad = angle * Math.PI / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);

        return new Matrix4x4(c, 0, s, 0, 1, 0, -s, 0, c);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Matrix4x4.as::getZRotationMatrix()
    public static getZRotationMatrix(angle: number): Matrix4x4
    {
        const rad = angle * Math.PI / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);

        return new Matrix4x4(c, -s, 0, s, c, 0, 0, 0, 1);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Matrix4x4.as::identity()
    public identity(): Matrix4x4
    {
        this._data = [1, 0, 0, 0, 1, 0, 0, 0, 1];

        return this;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Matrix4x4.as::vectorMultiplication()
    public vectorMultiplication(v: Vector3D): Vector3D
    {
        const x = v.x * this._data[0] + v.y * this._data[3] + v.z * this._data[6];
        const y = v.x * this._data[1] + v.y * this._data[4] + v.z * this._data[7];
        const z = v.x * this._data[2] + v.y * this._data[5] + v.z * this._data[8];

        return new Vector3D(x, y, z);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Matrix4x4.as::multiply()
    public multiply(other: Matrix4x4): Matrix4x4
    {
        const a = this._data;
        const b = other._data;

        return new Matrix4x4(
            a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
            a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
            a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
            a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
            a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
            a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
            a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
            a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
            a[6] * b[2] + a[7] * b[5] + a[8] * b[8]
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Matrix4x4.as::scalarMultiply()
    public scalarMultiply(scalar: number): void
    {
        for(let i = 0; i < this._data.length; i++)
        {
            this._data[i] *= scalar;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Matrix4x4.as::rotateX()
    public rotateX(angle: number): Matrix4x4
    {
        const rot = Matrix4x4.getXRotationMatrix(angle);

        return rot.multiply(this);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Matrix4x4.as::rotateY()
    public rotateY(angle: number): Matrix4x4
    {
        const rot = Matrix4x4.getYRotationMatrix(angle);

        return rot.multiply(this);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Matrix4x4.as::rotateZ()
    public rotateZ(angle: number): Matrix4x4
    {
        const rot = Matrix4x4.getZRotationMatrix(angle);

        return rot.multiply(this);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Matrix4x4.as::transpose()
    public transpose(): Matrix4x4
    {
        return new Matrix4x4(
            this._data[0], this._data[3], this._data[6],
            this._data[1], this._data[4], this._data[7],
            this._data[2], this._data[5], this._data[8]
        );
    }

    /**
     * Empty in AS3 too — no parameters, no statements, and no call site in any tree. Ported as
     * the no-op it is rather than left out, so the class has the shape AS3 declares.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Matrix4x4.as::skew()
    public skew(): void
    {
    }

    /**
     * Always false, whatever it is handed — AS3's body is `return false` with the argument
     * unread, and no call site anywhere confirms what it was meant to do.
     *
     * Ported literally on purpose: a real element-wise comparison would be a different method
     * wearing this one's name, and any caller that turns up is relying on AS3's answer, not on
     * the answer the name suggests.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/Matrix4x4.as::equals()
    public equals(_other: Matrix4x4): boolean
    {
        return false;
    }
}
