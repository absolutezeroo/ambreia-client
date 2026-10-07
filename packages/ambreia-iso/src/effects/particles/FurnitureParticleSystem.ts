/**
 * FurnitureParticleSystem
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureParticleSystem
 *
 * Container for particle emitters. Manages particle animation, rendering,
 * and sprite delegation.
 */
import {Texture} from 'pixi.js';
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';
import type {IRoomObjectSprite} from '../../object/visualization/IRoomObjectSprite';
import type {AnimatedFurnitureVisualization} from '../../furniture/visualization/AnimatedFurnitureVisualization';
import {FurnitureParticleSystemEmitter} from './FurnitureParticleSystemEmitter';
import type {IFurnitureParticleSystem, IParticleSystemData} from '../../furniture/visualization/IFurnitureParticleSystem';

export class FurnitureParticleSystem implements IFurnitureParticleSystem
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

    /**
     * The surface the particles are drawn onto, which replaces the `canvasId` layer's own texture.
     *
     * AS3 clones the layer's `BitmapData` and hands the clone to the sprite; the clone's *pixels*
     * never survive, because `updateCanvas()` fills the whole thing with `_bgColor` on the next
     * line. Only its dimensions matter, so this port allocates a blank canvas of the same size
     * instead of reading the layer's texture back — same result, no GPU readback.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::_canvas
    private _canvas: OffscreenCanvas | null = null;
    private _canvasContext: OffscreenCanvasRenderingContext2D | null = null;
    private _canvasTexture: Texture | null = null;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::_canvasSprite
    private _canvasSprite: IRoomObjectSprite | null = null;
    /**
     * A surface filled with `_bgColor` and nothing else, drawn over the canvas at `_blend` alpha
     * once per frame when `blend < 1`. That is AS3's fade: the previous frame's particles are
     * pulled `blend` of the way back to the background instead of being erased, which is what
     * gives a rocket its trail.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::_blendCanvas
    private _blendCanvas: OffscreenCanvas | null = null;
    // AS3 keeps this as `_blendTransform.alphaMultiplier`; there is no ColorTransform here.
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::_blend
    private _blend: number = 1;
    // Opaque black, and it is load-bearing: the canvas layer of every shipped fireworks furni is
    // declared `ink="ADD"`, under which black adds nothing. None of the 2,504 particle systems in
    // the shipped set carries a `bgColor` of its own, so this default is what they all use.
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::_bgColor
    private _bgColor: number = 0xFF000000;

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
        this.disposeCanvas();
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
        this.updateCanvas();
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
        this.updateCanvas();
    }

    /**
     * Points the `canvasId` layer at this system's own drawing surface, allocating it on first use
     * and whenever the layer changes size, then clears it.
     *
     * Both clears run whenever the surface exists, even if the sprite is not ready yet — that is
     * AS3's own bracketing, and it is what makes a re-ignition start from a blank canvas.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::updateCanvas()
    private updateCanvas(): void
    {
        if(this._activeEmitter === null) return;
        if(this._canvasId < 0) return;

        const sprite = this._visualization.getSprite(this._canvasId);

        if(sprite !== null && sprite.texture !== null)
        {
            const width = Math.floor(sprite.width);
            const height = Math.floor(sprite.height);

            if(width <= 1 || height <= 1) return;

            if(this._canvas !== null && (this._canvas.width !== width || this._canvas.height !== height))
            {
                this.releaseCanvas();
            }

            if(this._canvas === null) this.createCanvas(width, height);

            this._canvasOffsetX = -sprite.offsetX;
            this._canvasOffsetY = -sprite.offsetY;
            this._canvasSprite = sprite;

            if(this._canvasTexture !== null) sprite.texture = this._canvasTexture;
        }

        this.fillBackground();
    }

    // TS-only: AS3 allocates the two BitmapDatas inline in `updateCanvas()`; a canvas plus its
    //   context plus a Texture is enough lines to be worth its own method.
    private createCanvas(width: number, height: number): void
    {
        this._canvas = new OffscreenCanvas(width, height);
        this._canvasContext = this._canvas.getContext('2d');

        if(this._canvasContext === null)
        {
            this._canvas = null;

            return;
        }

        this._canvasContext.imageSmoothingEnabled = false;
        this._canvasTexture = Texture.from({resource: this._canvas, alphaMode: 'premultiply-alpha-on-upload'});

        // AS3 only allocates the fade surface when there is a fade to apply.
        if(this._blend !== 1)
        {
            this._blendCanvas = new OffscreenCanvas(width, height);

            const context = this._blendCanvas.getContext('2d');

            if(context !== null)
            {
                context.fillStyle = FurnitureParticleSystem.toCssColor(this._bgColor);
                context.fillRect(0, 0, width, height);
            }
        }
    }

    /**
     * Drops the surface without destroying its texture.
     *
     * The room's own `ExtendedSprite` is still pointing at that texture until the next render
     * pass reads `sprite.texture` again, so destroying it here would blank the layer for a frame.
     * AS3 only nulls the reference in the two places this is called from — a size change and
     * `copyStateFrom()` — and disposes the bitmap solely in `dispose()`.
     */
    // TS-only: AS3 writes `_canvas = null` inline at both call sites; a Texture has more pieces
    //   hanging off it than a BitmapData does.
    private releaseCanvas(): void
    {
        this._canvasTexture = null;
        this._canvasContext = null;
        this._canvas = null;
        this._blendCanvas = null;
    }

    // The `dispose()` arm: AS3 calls `BitmapData.dispose()` on both surfaces there and only there.
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::dispose()
    private disposeCanvas(): void
    {
        this._canvasTexture?.destroy(true);
        this.releaseCanvas();
        this._canvasSprite = null;
    }

    /**
     * Replaces the surface with the background colour — Flash's `fillRect`, which overwrites
     * alpha as well, not a composite.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::updateCanvas()
    //   (the two `fillRect(rect, _bgColor)` calls, shared with `updateAnimation()`'s blend==1 arm)
    private fillBackground(): void
    {
        const context = this._canvasContext;

        if(context === null || this._canvas === null) return;

        context.clearRect(0, 0, this._canvas.width, this._canvas.height);
        context.fillStyle = FurnitureParticleSystem.toCssColor(this._bgColor);
        context.fillRect(0, 0, this._canvas.width, this._canvas.height);
    }

    // TS-only: Flash takes an ARGB uint straight into `fillRect`; a 2D context wants CSS.
    private static toCssColor(argb: number): string
    {
        const alpha = ((argb >>> 24) & 0xFF) / 255;
        const red = (argb >>> 16) & 0xFF;
        const green = (argb >>> 8) & 0xFF;
        const blue = argb & 0xFF;

        return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
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
        if(this._activeEmitter === null || this._canvasSprite === null)
        {
            return;
        }

        // `AnimatedFurnitureVisualization.updateSprites()` has just run — the caller invokes it
        // through `super` first — and it puts the layer's own library asset back on the sprite.
        // This is AS3's answer to that, and without it the canvas is shown for no frame at all.
        if(this._canvasTexture !== null && this._canvasSprite.texture !== this._canvasTexture)
        {
            this._canvasSprite.texture = this._canvasTexture;
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

        // AS3 computes this before stepping the emitter, and it is an int there.
        const verticalOffset = Math.trunc(this._offsetY * this._scaleFactor);

        this._activeEmitter.update();

        if(!this._hasIgnited) return;

        if(this._activeEmitter.roomObjectSpriteId >= 0)
        {
            const sprite = this._visualization.getSprite(this._activeEmitter.roomObjectSpriteId);

            if(sprite !== null)
            {
                sprite.visible = false;
            }
        }

        if(this._canvas === null) this.updateCanvas();

        const context = this._canvasContext;

        if(context === null || this._canvas === null) return;

        if(this._blend === 1)
        {
            this.fillBackground();
        }
        else if(this._blendCanvas !== null)
        {
            context.globalAlpha = this._blend;
            context.drawImage(this._blendCanvas, 0, 0);
            context.globalAlpha = 1;
        }

        for(const particle of this._activeEmitter.particles)
        {
            // AS3's `* 10 / 10` on both terms is an identity left by the decompiler; the int
            // assignment that follows it is not, hence the truncation.
            const x = Math.trunc(this._canvasOffsetX + (particle.x - particle.z) * this._scaleFactor);
            const y = Math.trunc(
                this._canvasOffsetY - verticalOffset
                + (particle.y + (particle.x + particle.z) / 2) * this._scaleFactor
            );
            const asset = particle.getAsset();

            if(asset === null)
            {
                // A particle with no frame is a 2×2 white dot. Opaque, so source-over and Flash's
                // replacing `fillRect` agree.
                context.fillStyle = '#ffffff';
                context.fillRect(x - 1, y - 1, 2, 2);

                continue;
            }

            if(particle.fade && particle.alphaMultiplier < 1)
            {
                context.globalAlpha = particle.alphaMultiplier;
                FurnitureParticleSystem.drawAsset(context, asset, x, y);
                context.globalAlpha = 1;
            }
            else
            {
                FurnitureParticleSystem.drawAsset(context, asset, x, y);
            }
        }

        // The texture object never changes identity, so the sprite keeps pointing at it; this is
        // what tells PixiJS the pixels behind it did change.
        this._canvasTexture?.source.update();
    }

    /**
     * Blits one particle frame onto the surface.
     *
     * `asset.offsetX/offsetY` are added exactly as AS3 adds them: the port's accessor already
     * carries the same sign as Flash's — `FurnitureVisualization` uses the two interchangeably at
     * the same lines on both sides.
     */
    // TS-only: Flash reaches the pixels through `asset.asset.content` and `copyPixels`; here the
    //   frame is a rect inside a shared spritesheet texture and has to be blitted by hand.
    private static drawAsset(
        context: OffscreenCanvasRenderingContext2D,
        asset: IGraphicAsset,
        x: number,
        y: number
    ): void
    {
        const texture = asset.texture;

        if(texture === null) return;

        const resource = (texture.source as unknown as {resource?: unknown} | null)?.resource;

        if(!FurnitureParticleSystem.isDrawable(resource)) return;

        // A rotated or trimmed frame is not simply its frame rect, and no particle frame in the
        // shipped set is either — so decline rather than draw it wrong.
        if((texture.rotate ?? 0) !== 0 || texture.trim) return;

        const frame = texture.frame;

        context.drawImage(
            resource as CanvasImageSource,
            frame.x, frame.y, frame.width, frame.height,
            x + asset.offsetX, y + asset.offsetY, frame.width, frame.height
        );
    }

    // TS-only: the same four CPU-side sources `RoomEngine.blitTextureFrame()` accepts.
    private static isDrawable(resource: unknown): boolean
    {
        return (typeof ImageBitmap !== 'undefined' && resource instanceof ImageBitmap)
            || (typeof OffscreenCanvas !== 'undefined' && resource instanceof OffscreenCanvas)
            || (typeof HTMLCanvasElement !== 'undefined' && resource instanceof HTMLCanvasElement)
            || (typeof HTMLImageElement !== 'undefined' && resource instanceof HTMLImageElement);
    }

    /**
     * Reads one `<particlesystem>` — as the bundle's `logic.particleSystems[n]`.
     *
     * This used to be written against the Flash XML: `@`-prefixed attribute names, snake_case
     * keys, a `frame` element list, string values. The bundle carries none of that — the keys are
     * camelCase and the values are real numbers and booleans — so every lookup missed and every
     * `|| default` handed back its default. `particlesPerFrame` and `maxNumParticles` both came
     * out 0, which is an emitter that emits nothing, and `spriteId` came out -1, so nothing was
     * hidden either. Measured against the 2,504 particle systems in the shipped furni set.
     *
     * Defaults are applied on *absence*, as AS3 does: `offsetY` is legitimately 0 in this data,
     * and `|| 10` turned that into 10.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureParticleSystem.as::parseData()
    parseData(data: IParticleSystemData): void
    {
        this._size = Number(data.size ?? 0);
        this._canvasId = data.canvasId !== undefined ? Number(data.canvasId) : -1;
        this._offsetY = data.offsetY !== undefined ? Number(data.offsetY) : 10;
        this._scaleFactor = this._size / 64;
        // AS3 clamps: the shipped set contains a `blend` of 3.5.
        this._blend = Math.min(data.blend !== undefined ? Number(data.blend) : 1, 1);
        this._bgColor = data.bgColor !== undefined ? parseInt(String(data.bgColor), 16) : 0xFF000000;

        for(const emitterData of data.emitters ?? [])
        {
            const emitter = new FurnitureParticleSystemEmitter(
                String(emitterData.name ?? ''),
                Number(emitterData.spriteId ?? -1)
            );

            this._emitters.set(Number(emitterData.id ?? 0), emitter);

            const simulation = emitterData.simulation ?? {};

            for(const particleData of emitterData.particles ?? [])
            {
                const frames: IGraphicAsset[] = [];

                for(const frameName of particleData.frames ?? [])
                {
                    const asset = this._visualization.assetCollection?.getAsset(frameName) ?? null;

                    if(asset !== null) frames.push(asset);
                }

                emitter.configureParticle(
                    Number(particleData.lifeTime ?? 0),
                    particleData.isEmitter !== false,
                    frames,
                    particleData.fade === true
                );
            }

            emitter.setup(
                Number(emitterData.maxNumParticles ?? 0),
                Number(emitterData.particlesPerFrame ?? 0),
                Number(simulation.force ?? 0),
                {x: 0, y: Number(simulation.direction ?? 0), z: 0},
                Number(simulation.gravity ?? 0),
                Number(simulation.airFriction ?? 0),
                String(simulation.shape ?? ''),
                Number(simulation.energy ?? 0),
                Number(emitterData.fuseTime ?? 0),
                emitterData.burstPulse !== undefined ? Number(emitterData.burstPulse) : 1
            );
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

        // AS3 drops the surface here: the new system draws at a different scale, so the old
        // canvas is the wrong size and `updateCanvas()` must allocate again.
        this.releaseCanvas();
    }
}
