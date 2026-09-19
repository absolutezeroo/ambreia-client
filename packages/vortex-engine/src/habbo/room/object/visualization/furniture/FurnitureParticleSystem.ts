/**
 * FurnitureParticleSystem
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureParticleSystem
 *
 * Container for particle emitters. Manages particle animation, rendering,
 * and sprite delegation.
 */
import type {IGraphicAsset} from '@room/object/visualization/utils/IGraphicAsset';
import type {AnimatedFurnitureVisualization} from './AnimatedFurnitureVisualization';
import {FurnitureParticleSystemEmitter} from './FurnitureParticleSystemEmitter';

export class FurnitureParticleSystem
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::_emitters
    private _emitters: Map<number, FurnitureParticleSystemEmitter> = new Map();
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::_visualization
    private _visualization: AnimatedFurnitureVisualization;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::_size
    private _size: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::_canvasId
    private _canvasId: number = -1;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::_offsetY
    private _offsetY: number = 10;
    private _activeEmitter: FurnitureParticleSystemEmitter | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::_hasIgnited
    private _hasIgnited: boolean = false;
    private _canvasOffsetX: number = 0;
    private _canvasOffsetY: number = 0;
    private _scaleFactor: number = 1;

    constructor(visualization: AnimatedFurnitureVisualization)
    {
        this._visualization = visualization;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::dispose()
    dispose(): void
    {
        for(const emitter of this._emitters.values())
        {
            emitter.dispose();
        }

        this._emitters.clear();
        this._activeEmitter = null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::reset()
    reset(): void
    {
        if(this._activeEmitter !== null)
        {
            this._activeEmitter.reset();
        }

        this._activeEmitter = null;
        this._hasIgnited = false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::setAnimation()
    setAnimation(animationId: number): void
    {
        if(this._activeEmitter !== null)
        {
            this._activeEmitter.reset();
        }

        this._activeEmitter = this._emitters.get(animationId) || null;
        this._hasIgnited = false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::getSpriteYOffset()
    getSpriteYOffset(_scale: number, _direction: number, layerIndex: number): number
    {
        if(this._activeEmitter !== null && this._activeEmitter.roomObjectSpriteId === layerIndex)
        {
            return this._activeEmitter.y * this._scaleFactor;
        }

        return 0;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::controlsSprite()
    controlsSprite(layerIndex: number): boolean
    {
        if(this._activeEmitter !== null)
        {
            return this._activeEmitter.roomObjectSpriteId === layerIndex;
        }

        return false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::updateSprites()
    updateSprites(): void
    {
        if(this._activeEmitter === null)
        {
            return;
        }

        if(this._hasIgnited)
        {
            if(this._activeEmitter.roomObjectSpriteId >= 0)
            {
                const sprite = this._visualization.getSprite(this._activeEmitter.roomObjectSpriteId);

                if(sprite !== null)
                {
                    sprite.visible = false;
                }
            }
        }
    }

    // TODO(AS3): sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/
    //   furniture/FurnitureParticleSystem.as::updateAnimation() (l.211-258) and ::updateCanvas()
    //   (l.111-152). Only the emitter bookkeeping is ported; the particles are never drawn, so
    //   every particle furni (fireworks, fountains, campfire smoke) emits nothing visible.
    //
    //   What is missing: `updateCanvas()` clones the `canvas_id` sprite's bitmap into a working
    //   surface and reassigns the sprite to it; `updateAnimation()` then, per frame, refills that
    //   surface with `_bgColor` (or draws the blend background when `alphaMultiplier < 1`) and
    //   blits each `emitter.particles` entry at
    //   `(canvasOffsetX + (p.x - p.z) * scaleFactor, canvasOffsetY - offsetY * scaleFactor +
    //   (p.y + (p.x + p.z) / 2) * scaleFactor)` plus the asset's own offsets — `copyPixels` when
    //   opaque, `draw()` with an alpha transform when the particle is fading, and a 2×2 white
    //   rectangle when it has no asset at all.
    //
    //   The pieces exist: `FurnitureParticleSystemParticle.getAsset()` already resolves the frame,
    //   and `Texture.from({resource: <OffscreenCanvas>})` is how the rest of the port surfaces a
    //   per-frame surface. What is not settled is reading the sprite's current `Texture` back into
    //   a 2D context to seed the clone, which is why this is left rather than guessed at.
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::updateAnimation()
    updateAnimation(): void
    {
        if(this._activeEmitter === null)
        {
            return;
        }

        if(!this._hasIgnited && this._activeEmitter.hasIgnited)
        {
            this._hasIgnited = true;
        }

        this._activeEmitter.update();

        if(this._hasIgnited)
        {
            if(this._activeEmitter.roomObjectSpriteId >= 0)
            {
                const sprite = this._visualization.getSprite(this._activeEmitter.roomObjectSpriteId);

                if(sprite !== null)
                {
                    sprite.visible = false;
                }
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::parseData()
    parseData(data: any): void
    {
        this._size = parseInt(data.size || data['@size']) || 0;
        this._canvasId = parseInt(data.canvas_id || data['@canvas_id']) ?? -1;
        this._offsetY = parseInt(data.offset_y || data['@offset_y']) || 10;
        this._scaleFactor = this._size / 64;

        const emitters = data.emitter || data.emitters || [];
        const emitterList = Array.isArray(emitters) ? emitters : [emitters];

        for(const emitterData of emitterList)
        {
            const id = parseInt(emitterData.id || emitterData['@id']);
            const name = emitterData.name || emitterData['@name'] || '';
            const spriteId = parseInt(emitterData.sprite_id || emitterData['@sprite_id']) || -1;

            const emitter = new FurnitureParticleSystemEmitter(name, spriteId);
            this._emitters.set(id, emitter);

            const maxParticles = parseInt(emitterData.max_num_particles || emitterData['@max_num_particles']) || 0;
            const particlesPerFrame = parseInt(emitterData.particles_per_frame || emitterData['@particles_per_frame']) || 0;
            const burstPulse = parseInt(emitterData.burst_pulse || emitterData['@burst_pulse']) || 1;
            const fuseTime = parseInt(emitterData.fuse_time || emitterData['@fuse_time']) || 10;

            const sim = emitterData.simulation || {};
            const force = parseFloat(sim.force || sim['@force']) || 0;
            const dirY = parseFloat(sim.direction || sim['@direction']) || 0;
            const gravity = parseFloat(sim.gravity || sim['@gravity']) || 0;
            const airFriction = parseFloat(sim.airfriction || sim['@airfriction']) || 0;
            const shape = sim.shape || sim['@shape'] || 'cone';
            const energy = parseFloat(sim.energy || sim['@energy']) || 1;

            const particles = emitterData.particles || {};
            const particleList = particles.particle || [];
            const pList = Array.isArray(particleList) ? particleList : [particleList];

            for(const pData of pList)
            {
                const lifeTime = parseInt(pData.lifetime || pData['@lifetime']) || 20;
                const isEmitter = pData.is_emitter !== 'false' && pData['@is_emitter'] !== 'false';
                const fade = pData.fade === 'true' || pData['@fade'] === 'true';

                const frames: IGraphicAsset[] = [];
                const frameList = pData.frame || [];
                const fList = Array.isArray(frameList) ? frameList : [frameList];

                for(const fData of fList)
                {
                    const frameName = fData.name || fData['@name'];

                    if(frameName && this._visualization.assetCollection !== null)
                    {
                        const asset = this._visualization.assetCollection.getAsset(frameName);

                        if(asset !== null)
                        {
                            frames.push(asset);
                        }
                    }
                }

                emitter.configureParticle(lifeTime, isEmitter, frames, fade);
            }

            emitter.setup(maxParticles, particlesPerFrame, force, {
                x: 0,
                y: dirY,
                z: 0
            }, gravity, airFriction, shape, energy, fuseTime, burstPulse);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::copyStateFrom()
    copyStateFrom(source: FurnitureParticleSystem): void
    {
        let activeId = 0;

        if(source._activeEmitter !== null)
        {
            for(const [id, emitter] of source._emitters)
            {
                if(emitter === source._activeEmitter)
                {
                    activeId = id;
                    break;
                }
            }
        }

        this.setAnimation(activeId);

        if(this._activeEmitter !== null && source._activeEmitter !== null)
        {
            this._activeEmitter.copyStateFrom(source._activeEmitter, source._size / this._size);
        }
    }
}
