/**
 * FurnitureParticleSystemEmitter
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureParticleSystemEmitter
 *
 * Manages spawning and verlet physics of particles.
 */
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';
import {FurnitureParticleSystemParticle} from './FurnitureParticleSystemParticle';

interface IParticleConfig
{
    lifeTime: number;
    isEmitter: boolean;
    frames: IGraphicAsset[];
    fade: boolean;
}

export class FurnitureParticleSystemEmitter extends FurnitureParticleSystemParticle
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::SHAPE_CONE
    public static readonly SHAPE_CONE: string = 'cone';
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::SHAPE_PLANE
    public static readonly SHAPE_PLANE: string = 'plane';
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::SHAPE_SPHERE
    public static readonly SHAPE_SPHERE: string = 'sphere';

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::_name
    private _name: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::_force
    private _force: number = 0;
    private _emitterDirection: { x: number; y: number; z: number } = {x: 0, y: -1, z: 0};
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::_timeStep
    private _timeStep: number = 0.1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::_gravity
    private _gravity: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::_airFriction
    private _airFriction: number = 0;
    private _shape: string = '';
    private _particleConfigs: IParticleConfig[] = [];
    private _maxParticles: number = 0;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::_particlesPerFrame
    private _particlesPerFrame: number = 0;
    private _totalEmitted: number = 0;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::_fuseTime
    private _fuseTime: number = 10;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::_energy
    private _energy: number = 1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::_burstPulse
    private _burstPulse: number = 1;

    constructor(name: string = '', spriteId: number = -1)
    {
        super();
        this._name = name;
        this._roomObjectSpriteId = spriteId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::_roomObjectSpriteId
    private _roomObjectSpriteId: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::get roomObjectSpriteId()
    get roomObjectSpriteId(): number
    {
        return this._roomObjectSpriteId;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::_particles
    private _particles: FurnitureParticleSystemParticle[] = [];

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::get particles()
    get particles(): FurnitureParticleSystemParticle[]
    {
        return this._particles;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::_hasIgnited
    private _hasIgnited: boolean = false;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::get hasIgnited()
    get hasIgnited(): boolean
    {
        return this._hasIgnited;
    }

    override dispose(): void
    {
        for(const p of this._particles)
        {
            p.dispose();
        }

        this._particles = [];
        this._particleConfigs = [];
        super.dispose();
    }

    override update(): void
    {
        super.update();
        this.verlet();

        if(!this.isAlive && this._totalEmitted < this._maxParticles)
        {
            if(this.age % this._burstPulse === 0)
            {
                this.releaseParticles(this);
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::setup()
    setup(
        maxParticles: number,
        particlesPerFrame: number,
        force: number,
        direction: { x: number; y: number; z: number },
        gravity: number,
        airFriction: number,
        shape: string,
        energy: number,
        fuseTime: number,
        burstPulse: number
    ): void
    {
        this._maxParticles = maxParticles;
        this._particlesPerFrame = particlesPerFrame;
        this._force = force;

        const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z) || 1;
        this._emitterDirection = {x: direction.x / len, y: direction.y / len, z: direction.z / len};

        this._gravity = gravity;
        this._airFriction = airFriction;
        this._shape = shape;
        this._fuseTime = fuseTime;
        this._energy = energy;
        this._burstPulse = burstPulse;
        this.reset();
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::reset()
    reset(): void
    {
        for(const p of this._particles)
        {
            p.dispose();
        }

        this._particles = [];
        this._totalEmitted = 0;
        this._hasIgnited = false;
        this.init(0, 0, 0, this._emitterDirection, this._force, this._timeStep, this._fuseTime, true);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::copyStateFrom()
    copyStateFrom(source: FurnitureParticleSystemEmitter, scaleFactor: number): void
    {
        super.copy(source, scaleFactor);
        this._force = source._force;
        this._emitterDirection = source._emitterDirection;
        this._gravity = source._gravity;
        this._airFriction = source._airFriction;
        this._shape = source._shape;
        this._fuseTime = source._fuseTime;
        this._energy = source._energy;
        this._burstPulse = source._burstPulse;
        this._timeStep = source._timeStep;
        this._hasIgnited = source._hasIgnited;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::configureParticle()
    configureParticle(lifeTime: number, isEmitter: boolean, frames: IGraphicAsset[], fade: boolean): void
    {
        this._particleConfigs.push({lifeTime, isEmitter, frames, fade});
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::verlet()
    verlet(): void
    {
        const friction = this._airFriction;
        const dt2 = this._timeStep * this._timeStep;

        if(this.isAlive || this._totalEmitted < this._maxParticles)
        {
            const tempX = this.x;
            const tempY = this.y;
            const tempZ = this.z;

            this.x = (2 - friction) * this.x - (1 - friction) * this.lastX;
            this.y = (2 - friction) * this.y - (1 - friction) * this.lastY + this._gravity * dt2;
            this.z = (2 - friction) * this.z - (1 - friction) * this.lastZ;

            this.lastX = tempX;
            this.lastY = tempY;
            this.lastZ = tempZ;
        }

        const toRemove: FurnitureParticleSystemParticle[] = [];

        for(const particle of this._particles)
        {
            particle.update();

            const px = particle.x;
            const py = particle.y;
            const pz = particle.z;

            particle.x = (2 - friction) * particle.x - (1 - friction) * particle.lastX;
            particle.y = (2 - friction) * particle.y - (1 - friction) * particle.lastY + this._gravity * dt2;
            particle.z = (2 - friction) * particle.z - (1 - friction) * particle.lastZ;

            particle.lastX = px;
            particle.lastY = py;
            particle.lastZ = pz;

            if(particle.y > 10 || !particle.isAlive)
            {
                toRemove.push(particle);
            }
        }

        for(const particle of toRemove)
        {
            const idx = this._particles.indexOf(particle);

            if(idx !== -1)
            {
                this._particles.splice(idx, 1);
            }

            particle.dispose();
        }
    }

    protected override ignite(): void
    {
        this._hasIgnited = true;

        if(this._totalEmitted < this._maxParticles)
        {
            if(this.age > 1)
            {
                this.releaseParticles(this);
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::releaseParticles()
    private releaseParticles(source: FurnitureParticleSystemParticle): void
    {
        const dir = {x: 0, y: 0, z: 0};
        const config = this.getRandomParticleConfiguration();

        for(let i = 0; i < this._particlesPerFrame; i++)
        {
            switch(this._shape)
            {
                case FurnitureParticleSystemEmitter.SHAPE_CONE:
                    dir.x = this.randomSign() * Math.random();
                    dir.y = -(Math.random() + 1);
                    dir.z = this.randomSign() * Math.random();
                    break;
                case FurnitureParticleSystemEmitter.SHAPE_PLANE:
                    dir.x = this.randomSign() * Math.random();
                    dir.y = 0;
                    dir.z = this.randomSign() * Math.random();
                    break;
                case FurnitureParticleSystemEmitter.SHAPE_SPHERE:
                    dir.x = this.randomSign() * Math.random();
                    dir.y = this.randomSign() * Math.random();
                    dir.z = this.randomSign() * Math.random();
                    break;
            }

            const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z) || 1;
            dir.x /= len;
            dir.y /= len;
            dir.z /= len;

            const particle = new FurnitureParticleSystemParticle();

            let lifeTime: number;
            let isEmitter: boolean;
            let frames: IGraphicAsset[];
            let fade: boolean;

            if(config !== null)
            {
                lifeTime = Math.floor(Math.random() * config.lifeTime + 10);
                isEmitter = config.isEmitter;
                frames = config.frames;
                fade = config.fade;
            }
            else
            {
                lifeTime = Math.floor(Math.random() * 20 + 10);
                isEmitter = false;
                frames = [];
                fade = false;
            }

            particle.init(source.x, source.y, source.z, dir, this._energy, this._timeStep, lifeTime, isEmitter, frames, fade);
            this._particles.push(particle);
            this._totalEmitted++;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystemEmitter.as::getRandomParticleConfiguration()
    private getRandomParticleConfiguration(): IParticleConfig | null
    {
        if(this._particleConfigs.length === 0)
        {
            return null;
        }

        return this._particleConfigs[Math.floor(Math.random() * this._particleConfigs.length)];
    }

    private randomSign(): number
    {
        return Math.random() < 0.5 ? 1 : -1;
    }
}
