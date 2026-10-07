/**
 * FurnitureParticleSystemParticle
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureParticleSystemParticle
 *
 * Individual particle with position, velocity (verlet), lifetime, and fade.
 */
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';

export class FurnitureParticleSystemParticle
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::_lifeTime
    private _lifeTime: number = 0;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::_fadeTime
    private _fadeTime: number = 0;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::_frames
    private _frames: IGraphicAsset[] | null = null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::_x
    private _x: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::get x()
    get x(): number
    {
        return this._x;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::set x()
    set x(value: number)
    {
        this._x = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::_y
    private _y: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::get y()
    get y(): number
    {
        return this._y;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::set y()
    set y(value: number)
    {
        this._y = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::_z
    private _z: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::get z()
    get z(): number
    {
        return this._z;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::set z()
    set z(value: number)
    {
        this._z = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::_lastX
    private _lastX: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::get lastX()
    get lastX(): number
    {
        return this._lastX;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::set lastX()
    set lastX(value: number)
    {
        this._hasMoved = true;
        this._lastX = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::_lastY
    private _lastY: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::get lastY()
    get lastY(): number
    {
        return this._lastY;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::set lastY()
    set lastY(value: number)
    {
        this._hasMoved = true;
        this._lastY = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::_lastZ
    private _lastZ: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::get lastZ()
    get lastZ(): number
    {
        return this._lastZ;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::set lastZ()
    set lastZ(value: number)
    {
        this._hasMoved = true;
        this._lastZ = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::_hasMoved
    private _hasMoved: boolean = false;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::get hasMoved()
    get hasMoved(): boolean
    {
        return this._hasMoved;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::_direction
    private _direction: { x: number; y: number; z: number } | null = null;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::get direction()
    get direction(): { x: number; y: number; z: number } | null
    {
        return this._direction;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::_age
    private _age: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::get age()
    get age(): number
    {
        return this._age;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::_isEmitter
    private _isEmitter: boolean = false;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::get isEmitter()
    get isEmitter(): boolean
    {
        return this._isEmitter;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::_fade
    private _fade: boolean = false;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::get fade()
    get fade(): boolean
    {
        return this._fade;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::_alphaMultiplier
    private _alphaMultiplier: number = 1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::get alphaMultiplier()
    get alphaMultiplier(): number
    {
        return this._alphaMultiplier;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::get isAlive()
    get isAlive(): boolean
    {
        return this._age <= this._lifeTime;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::init()
    init(
        x: number, y: number, z: number,
        direction: { x: number; y: number; z: number },
        force: number, timeStep: number, lifeTime: number,
        isEmitter: boolean = false,
        frames: IGraphicAsset[] | null = null,
        fade: boolean = false
    ): void
    {
        this._x = x;
        this._y = y;
        this._z = z;

        const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z) || 1;
        this._direction = {
            x: direction.x / len * force,
            y: direction.y / len * force,
            z: direction.z / len * force
        };

        this._lastX = this._x - this._direction.x * timeStep;
        this._lastY = this._y - this._direction.y * timeStep;
        this._lastZ = this._z - this._direction.z * timeStep;

        this._age = 0;
        this._hasMoved = false;
        this._lifeTime = lifeTime;
        this._isEmitter = isEmitter;
        this._frames = frames;
        this._fade = fade;
        this._alphaMultiplier = 1;
        this._fadeTime = 0.5 + Math.random() * 0.5;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::update()
    update(): void
    {
        this._age++;

        if(this._age === this._lifeTime)
        {
            this.ignite();
        }

        if(this._fade)
        {
            if(this._age / this._lifeTime > this._fadeTime)
            {
                this._alphaMultiplier = (this._lifeTime - this._age) / (this._lifeTime * (1 - this._fadeTime));
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::getAsset()
    getAsset(): IGraphicAsset | null
    {
        if(this._frames !== null && this._frames.length > 0)
        {
            return this._frames[this._age % this._frames.length];
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::dispose()
    dispose(): void
    {
        this._direction = null;
        this._frames = null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::copy()
    copy(source: FurnitureParticleSystemParticle, scaleFactor: number): void
    {
        this._x = source._x * scaleFactor;
        this._y = source._y * scaleFactor;
        this._z = source._z * scaleFactor;
        this._lastX = source._lastX * scaleFactor;
        this._lastY = source._lastY * scaleFactor;
        this._lastZ = source._lastZ * scaleFactor;
        this._hasMoved = source._hasMoved;
        this._direction = source._direction;
        this._age = source._age;
        this._lifeTime = source._lifeTime;
        this._isEmitter = source._isEmitter;
        this._fade = source._fade;
        this._fadeTime = source._fadeTime;
        this._alphaMultiplier = source._alphaMultiplier;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemParticle.as::ignite()
    protected ignite(): void
    {
        // Override in emitter subclass
    }
}
