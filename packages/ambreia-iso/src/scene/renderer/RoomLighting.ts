import {BlurFilter, ColorMatrixFilter, Container, RenderTexture, Sprite, Texture, type Renderer} from 'pixi.js';
import {platform} from '@ambreia/common/platform/Platform';
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import {Vector3d} from '../../utils/Vector3d';

/** A light in the room: where it stands, how far it reaches, its colour and strength. */
export interface IRoomLight
{
    /** Tile coordinates of its foot, and the floor's height there. */
    x: number;
    y: number;
    z: number;
    /** 0xRRGGBB. */
    color: number;
    /** How far it reaches, in tiles. */
    radius: number;
    /** 0..1 (more adds up toward white). */
    intensity: number;
    /** How high its flame burns above its foot, in tiles: where the light leaves from. */
    height?: number;
    /** 0..1: how much it flickers, a torch's 0.25, a lamp's 0. */
    flicker?: number;
    /** Which way it shines, a unit vector on the floor; absent: all round. */
    facing?: {x: number; y: number};
    /** With `facing`: 0 lights the half in front, 0.7 a narrow cone. */
    spread?: number;
}

/** An image that gives light, as the canvas draws it: it shows at full brightness, not darkened. */
export interface IRoomLightingEmitter
{
    texture: Texture;
    /** Its top-left on the canvas, and its scale there (negative: mirrored). */
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
}

/** The floor the light falls on: its size in tiles and each tile's height (negative: no floor). */
export interface IRoomLightingFloor
{
    readonly width: number;
    readonly length: number;
    heightAt(x: number, y: number): number;
}

/**
 * The room's light, worked out on the floor's grid and drawn as a light map over the scene.
 *
 * Every light gives each tile's floor within its reach a share of its colour, falling off with
 * distance, if it can see it: the ray from its flame down to the floor is cut by any tile rising
 * above it on the way. Walls (the sides of raised tiles and the room's own walls) are lit level by
 * level the same way, and only from the side they face, the more the squarer the light strikes.
 * Each lit floor and piece of wall then leaves a soft spot of its light on the map, at its height,
 * wide enough to blend with its neighbours; the map, blurred, is multiplied over the scene over the
 * ambient colour, and the lights alone are added a little on top for their glow.
 *
 * Furni and avatars are lit by the map where they are drawn, the light of what surrounds them on
 * screen: in one depth-sorted list, a light map over the scene cannot single them out.
 */
export class RoomLighting
{
    /** The light map's size against the canvas: a blurry map is a soft one. */
    private static readonly RESOLUTION: number = 0.5;
    private static readonly FALLOFF_SIZE: number = 128;
    /** The light map's blur, in light-map pixels. */
    private static readonly SOFTNESS: number = 4;
    /** How much the lights also brighten what they touch, added over the scene. */
    private static readonly GLOW: number = 0.22;
    /** A light with no flame height still leaves from this high: a lamp on the floor. */
    private static readonly DEFAULT_FLAME: number = 0.5;
    /** How finely a ray is walked for what cuts it, in tiles. */
    private static readonly RAY_STEP: number = 0.25;

    /** Everywhere no light reaches, 0xRRGGBB: 0xFFFFFF is daylight, the scene as drawn. */
    ambient: number = 0xFFFFFF;
    /** The lights set in the room. */
    lights: IRoomLight[] = [];
    /** A light carried by the player's own avatar; null: none. */
    lantern: Omit<IRoomLight, 'x' | 'y' | 'z'> | null = null;
    /**
     * Furni light the room by themselves (RoomRenderingCanvas.updateLighting()); off: only `lights`
     * and the lantern do.
     */
    furniLights: boolean = true;
    /** The floor the light falls on; null: no light map at all, the scene as drawn. */
    floor: IRoomLightingFloor | null = null;
    /** Where the room's walls end, in tiles above the lowest floor (Habbo's default wall: 3.6). */
    wallTop: number = 3.6;

    /** What the canvas shows over the scene: the light map multiplied, then the lights' glow added. */
    readonly view: Container = new Container();

    // Per tile, the light that reaches its floor, r g b, this frame.
    private _grid: Float32Array = new Float32Array(0);
    // This frame's lights, worked out (light()), for the walls; and one wall piece's light (wallLight()).
    private readonly _sources: {x: number; y: number; flame: number; radius: number; red: number; green: number; blue: number; fx: number; fy: number; spread: number}[] = [];
    private _sourceCount: number = 0;
    private readonly _cell: Float32Array = new Float32Array(3);
    private readonly _target: RenderTexture;
    private readonly _glowTarget: RenderTexture;
    private readonly _softMap: RenderTexture;
    private readonly _softGlow: RenderTexture;
    private readonly _ambientLayer: Container = new Container();
    private readonly _background: Sprite = new Sprite(Texture.WHITE);
    private readonly _spotLayer: Container = new Container();
    private readonly _spots: Sprite[] = [];
    private readonly _blurMap: Container = new Container();
    private readonly _blurGlow: Container = new Container();
    private readonly _nothing: Container = new Container();
    // The images that give light, as white shapes (_emitters, reused): stamped full bright on the map.
    private readonly _emitterLayer: Container = new Container();
    private readonly _emitters: Sprite[] = [];
    private readonly _falloff: Texture;
    private readonly _point: Vector3d = new Vector3d();
    private _disposed: boolean = false;

    constructor()
    {
        this._target = RenderTexture.create({width: 1, height: 1});
        this._glowTarget = RenderTexture.create({width: 1, height: 1});
        this._softMap = RenderTexture.create({width: 1, height: 1});
        this._softGlow = RenderTexture.create({width: 1, height: 1});
        this._falloff = RoomLighting.createFalloff();
        this._ambientLayer.addChild(this._background);

        // An image that gives light, as a white shape of itself: colour to 1, alpha kept.
        const white = new ColorMatrixFilter();

        white.matrix = [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0];
        this._emitterLayer.filters = [white];

        // Blurred into the soft textures the view shows: a filter on a shown sprite loses its blend mode.
        for(const [source, layer] of [[this._target, this._blurMap], [this._glowTarget, this._blurGlow]] as const)
        {
            const sprite = new Sprite(source);

            sprite.filters = [new BlurFilter({strength: RoomLighting.SOFTNESS, quality: 3})];
            layer.addChild(sprite);
        }

        const map = new Sprite(this._softMap);
        const glow = new Sprite(this._softGlow);

        map.blendMode = 'multiply';
        glow.blendMode = 'add';
        glow.alpha = RoomLighting.GLOW;
        map.scale.set(1 / RoomLighting.RESOLUTION);
        glow.scale.set(1 / RoomLighting.RESOLUTION);
        this.view.label = 'lighting';
        this.view.addChild(map, glow);
    }

    /**
     * Works the light out and draws the map for a canvas `width` × `height`, whose room point p
     * shows at `offsetX + scale × (geometry.getScreenPosition(p).x + width / 2)` (likewise y).
     * `own` is where the player's own avatar stands, in tiles; null when it is not in the room.
     * `furni` holds the furni lights found this frame, the first `furniCount` of them; `emitters`
     * the images that give light, the first `emitterCount` of them: they keep their full brightness,
     * and glow.
     */
    render(renderer: Renderer, geometry: IRoomGeometry, width: number, height: number, offsetX: number, offsetY: number, scale: number,
        own: {x: number; y: number} | null, time: number, furni: readonly IRoomLight[] = [], furniCount: number = 0,
        emitters: readonly IRoomLightingEmitter[] = [], emitterCount: number = 0): void
    {
        const floor = this.floor;

        this.view.visible = floor !== null;

        if(floor === null) return;

        const r = RoomLighting.RESOLUTION;
        const w = Math.max(1, Math.ceil(width * r));
        const h = Math.max(1, Math.ceil(height * r));

        if(this._target.width !== w || this._target.height !== h)
        {
            for(const target of [this._target, this._glowTarget, this._softMap, this._softGlow]) target.resize(w, h);
        }

        this.light(floor, own, time, furni, furniCount);
        this.drawSpots(floor, geometry, width, height, offsetX, offsetY, scale);

        this._background.tint = this.ambient;
        this._background.width = w;
        this._background.height = h;
        renderer.render({container: this._ambientLayer, target: this._target, clear: true});
        renderer.render({container: this._spotLayer, target: this._target, clear: false});
        renderer.render({container: this._nothing, target: this._glowTarget, clear: true, clearColor: [0, 0, 0, 0]});
        renderer.render({container: this._spotLayer, target: this._glowTarget, clear: false});

        // What gives light glows round itself (blurred with the glow), and shows full bright (stamped
        // after the blur, sharp).
        const stamped = this.placeEmitters(emitters, emitterCount);

        if(stamped) renderer.render({container: this._emitterLayer, target: this._glowTarget, clear: false});

        renderer.render({container: this._blurMap, target: this._softMap, clear: true});
        renderer.render({container: this._blurGlow, target: this._softGlow, clear: true, clearColor: [0, 0, 0, 0]});

        if(stamped) renderer.render({container: this._emitterLayer, target: this._softMap, clear: false});
    }

    /** Fills _grid with the light every tile's floor gets this frame, and _sources with the lights. */
    private light(floor: IRoomLightingFloor, own: {x: number; y: number} | null, time: number, furni: readonly IRoomLight[], furniCount: number): void
    {
        const size = floor.width * floor.length * 3;

        if(this._grid.length !== size) this._grid = new Float32Array(size);
        else this._grid.fill(0);

        this._sourceCount = 0;

        for(let i = 0; i < this.lights.length + furniCount; i++)
        {
            const light = i < this.lights.length ? this.lights[i] : furni[i - this.lights.length];

            this.addLight(floor, light, light.x, light.y, light.z, light.intensity * RoomLighting.flicker(light.flicker ?? 0, time, i));
        }

        if(this.lantern !== null && own !== null)
        {
            const z = Math.max(0, floor.heightAt(Math.round(own.x), Math.round(own.y)));

            this.addLight(floor, this.lantern, own.x, own.y, z, this.lantern.intensity * RoomLighting.flicker(this.lantern.flicker ?? 0, time, -1));
        }
    }

    /**
     * Adds one light to the floor of every tile within its reach that it can see from its flame,
     * and keeps it in _sources for the walls (wallLight()).
     */
    private addLight(floor: IRoomLightingFloor, light: Omit<IRoomLight, 'x' | 'y' | 'z'>, x: number, y: number, z: number, strength: number): void
    {
        const flame = z + (light.height ?? RoomLighting.DEFAULT_FLAME);
        const reach = Math.ceil(light.radius);
        const red = ((light.color >> 16) & 0xFF) / 255 * strength;
        const green = ((light.color >> 8) & 0xFF) / 255 * strength;
        const blue = (light.color & 0xFF) / 255 * strength;
        const cx = Math.round(x);
        const cy = Math.round(y);
        const source = this._sources[this._sourceCount] ?? {x: 0, y: 0, flame: 0, radius: 0, red: 0, green: 0, blue: 0, fx: 0, fy: 0, spread: -1};

        source.x = x;
        source.y = y;
        source.flame = flame;
        source.radius = light.radius;
        source.red = red;
        source.green = green;
        source.blue = blue;
        source.fx = light.facing?.x ?? 0;
        source.fy = light.facing?.y ?? 0;
        source.spread = light.facing ? light.spread ?? 0 : -1;
        this._sources[this._sourceCount++] = source;

        for(let ty = Math.max(0, cy - reach); ty <= Math.min(floor.length - 1, cy + reach); ty++)
        {
            for(let tx = Math.max(0, cx - reach); tx <= Math.min(floor.width - 1, cx + reach); tx++)
            {
                const top = floor.heightAt(tx, ty);

                // No floor, or a floor above the flame: the light cannot reach its top.
                if(top < 0 || top > flame) continue;

                const t = Math.hypot(tx - x, ty - y, (flame - top) * 0.5) / light.radius;

                if(t >= 1 || !this.sees(floor, x, y, flame, tx, ty, top, tx, ty)) continue;

                const falloff = (1 - t * t) * (1 - t * t) * RoomLighting.cone(source, tx - x, ty - y);
                const i = (ty * floor.width + tx) * 3;

                this._grid[i] += red * falloff;
                this._grid[i + 1] += green * falloff;
                this._grid[i + 2] += blue * falloff;
            }
        }
    }

    /**
     * True when a flame at (x, y, flame) sees the point (px, py, pz): walking the ray between
     * them, no tile on the way rises above it. The tile the point belongs to, (ownX, ownY), and the
     * light's own tile do not count.
     */
    private sees(floor: IRoomLightingFloor, x: number, y: number, flame: number, px: number, py: number, pz: number, ownX: number, ownY: number): boolean
    {
        const steps = Math.ceil(Math.hypot(px - x, py - y) / RoomLighting.RAY_STEP);
        const fromX = Math.round(x);
        const fromY = Math.round(y);

        for(let s = 1; s < steps; s++)
        {
            const f = s / steps;
            const sx = Math.round(x + (px - x) * f);
            const sy = Math.round(y + (py - y) * f);

            if((sx === ownX && sy === ownY) || (sx === fromX && sy === fromY)) continue;

            if(floor.heightAt(sx, sy) > flame + (pz - flame) * f) return false;
        }

        return true;
    }

    /**
     * The light a wall gets at the point (px, py, pz), facing (nx, ny), the wall belonging to tile
     * (ownX, ownY), into _cell; false when none reaches it. A light behind the wall does not reach
     * it, one in front lights it by distance and by how square it strikes (a grazing light, less),
     * if it sees that point.
     */
    private wallLight(floor: IRoomLightingFloor, px: number, py: number, pz: number, nx: number, ny: number, ownX: number, ownY: number): boolean
    {
        let red = 0;
        let green = 0;
        let blue = 0;

        for(let i = 0; i < this._sourceCount; i++)
        {
            const source = this._sources[i];
            const dx = source.x - px;
            const dy = source.y - py;
            const facing = dx * nx + dy * ny;

            if(facing <= 0) continue;

            const distance = Math.hypot(dx, dy, source.flame - pz);
            const t = distance / source.radius;

            if(t >= 1 || !this.sees(floor, source.x, source.y, source.flame, px, py, pz, ownX, ownY)) continue;

            const strike = facing / distance;
            const falloff = (1 - t * t) * (1 - t * t) * (0.35 + 0.65 * strike) * RoomLighting.cone(source, -dx, -dy);

            red += source.red * falloff;
            green += source.green * falloff;
            blue += source.blue * falloff;
        }

        this._cell[0] = red;
        this._cell[1] = green;
        this._cell[2] = blue;

        return red + green + blue > 0.004;
    }

    /**
     * One soft spot per lit tile floor, at its height, wide enough to blend with its neighbours;
     * and, level by level, one per piece of wall lit: the sides of the raised tiles down to the
     * floor in front, and the room's walls where the floor ends behind a tile.
     */
    private drawSpots(floor: IRoomLightingFloor, geometry: IRoomGeometry, width: number, height: number, offsetX: number, offsetY: number, scale: number): void
    {
        const r = RoomLighting.RESOLUTION;
        // A circle of radius 1 tile on the floor projects to this ellipse, in light-map pixels;
        // a height of one tile rises this far.
        const semiX = geometry.scale / 2 * Math.SQRT2 * scale * r;
        const semiY = geometry.scale / 4 * Math.SQRT2 * scale * r;
        const rise = geometry.scale / 2 * scale * r;
        const grid = this._grid;
        const cell = this._cell;
        let used = 0;
        const spot = (x: number, y: number, z: number, rx: number, ry: number, red: number, green: number, blue: number): void =>
        {
            this._point.x = x;
            this._point.y = y;
            this._point.z = z;

            const screen = geometry.getScreenPosition(this._point);

            if(screen === null) return;

            let sprite = this._spots[used];

            if(sprite === undefined)
            {
                sprite = new Sprite(this._falloff);
                sprite.anchor.set(0.5);
                sprite.blendMode = 'add';
                this._spots.push(sprite);
                this._spotLayer.addChild(sprite);
            }

            sprite.position.set((offsetX + scale * (screen.x + width / 2)) * r, (offsetY + scale * (screen.y + height / 2)) * r);
            sprite.width = rx * 2;
            sprite.height = ry * 2;
            sprite.tint = (RoomLighting.channel(red) << 16) | (RoomLighting.channel(green) << 8) | RoomLighting.channel(blue);
            sprite.visible = true;
            used++;
        };
        // A wall from `bottom` up to `top`, at (px, py) facing (nx, ny), level by level.
        const wall = (px: number, py: number, nx: number, ny: number, bottom: number, top: number, ownX: number, ownY: number): void =>
        {
            for(let z = bottom; z < top; z++)
            {
                const piece = Math.min(1, top - z);

                if(this.wallLight(floor, px, py, z + piece / 2, nx, ny, ownX, ownY))
                {
                    spot(px, py, z + piece / 2, semiX * 0.75, piece * rise * 0.8, cell[0], cell[1], cell[2]);
                }
            }
        };

        for(let ty = 0; ty < floor.length; ty++)
        {
            for(let tx = 0; tx < floor.width; tx++)
            {
                const top = floor.heightAt(tx, ty);

                if(top < 0) continue;

                const i = (ty * floor.width + tx) * 3;

                if(grid[i] + grid[i + 1] + grid[i + 2] > 0.004) spot(tx, ty, top, semiX, semiY, grid[i], grid[i + 1], grid[i + 2]);

                // Its sides the viewer sees (+x, +y), down to the floor in front of each.
                for(const [nx, ny] of [[1, 0], [0, 1]])
                {
                    const below = tx + nx < floor.width && ty + ny < floor.length ? floor.heightAt(tx + nx, ty + ny) : -1;

                    wall(tx + nx / 2, ty + ny / 2, nx, ny, Math.max(0, below), top, tx, ty);
                }

                // The room's walls, where the floor ends behind it (-x, -y), facing into the room.
                for(const [nx, ny] of [[1, 0], [0, 1]])
                {
                    const bx = tx - nx;
                    const by = ty - ny;

                    if(bx >= 0 && by >= 0 && floor.heightAt(bx, by) >= 0) continue;

                    wall(tx - nx / 2, ty - ny / 2, nx, ny, top, this.wallTop, bx, by);
                }
            }
        }

        for(let i = used; i < this._spots.length; i++) this._spots[i].visible = false;
    }

    /**
     * How much of a light shining one way (facing, spread) goes toward (dx, dy) from it: all of it
     * inside its cone, fading to nothing a little outside; a light shining all round, all of it.
     */
    private static cone(source: {fx: number; fy: number; spread: number}, dx: number, dy: number): number
    {
        const length = Math.hypot(dx, dy);

        if(source.spread < 0 || length < 0.5) return 1;

        const along = (dx * source.fx + dy * source.fy) / length;
        const t = Math.max(0, Math.min(1, (along - source.spread + 0.25) / 0.5));

        return t * t * (3 - 2 * t);
    }

    /** Lays the images that give light out on the light map; false when there are none. */
    private placeEmitters(emitters: readonly IRoomLightingEmitter[], count: number): boolean
    {
        const r = RoomLighting.RESOLUTION;

        for(let i = 0; i < count; i++)
        {
            const emitter = emitters[i];
            let sprite = this._emitters[i];

            if(sprite === undefined)
            {
                sprite = new Sprite();
                this._emitters.push(sprite);
                this._emitterLayer.addChild(sprite);
            }

            sprite.texture = emitter.texture;
            sprite.position.set(emitter.x * r, emitter.y * r);
            sprite.scale.set(emitter.scaleX * r, emitter.scaleY * r);
            sprite.visible = true;
        }

        for(let i = count; i < this._emitters.length; i++) this._emitters[i].visible = false;

        return count > 0;
    }

    /** A light value as a tint channel, 0..255; a light past full is full. */
    private static channel(value: number): number
    {
        return Math.round(Math.min(1, value) * 255);
    }

    /** A flame's strength at `time`, 1 - flicker at the dimmest; each light (`seed`) on its own beat. */
    private static flicker(amount: number, time: number, seed: number): number
    {
        if(amount <= 0) return 1;

        const wave = Math.sin(time * 0.011 + seed * 1.7) * 0.5 + Math.sin(time * 0.027 + seed * 3.1) * 0.3 + Math.sin(time * 0.061 + seed) * 0.2;

        return 1 - amount * (0.5 + 0.5 * wave);
    }

    /** White at the centre, fading to nothing at the edge: (1 - t²)², no hard rim. */
    private static createFalloff(): Texture
    {
        const size = RoomLighting.FALLOFF_SIZE;
        const canvas = platform().createCanvas(size, size);
        const context = canvas.getContext('2d') as CanvasRenderingContext2D;
        const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);

        for(let i = 0; i <= 8; i++)
        {
            const t = i / 8;

            gradient.addColorStop(t, `rgba(255, 255, 255, ${(1 - t * t) * (1 - t * t)})`);
        }

        context.fillStyle = gradient;
        context.fillRect(0, 0, size, size);

        return Texture.from({resource: canvas as unknown as HTMLCanvasElement, scaleMode: 'linear'});
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this.view.destroy({children: true});
        this._ambientLayer.destroy({children: true});
        this._spotLayer.destroy({children: true});
        this._blurMap.destroy({children: true});
        this._blurGlow.destroy({children: true});
        this._nothing.destroy();
        this._emitterLayer.destroy({children: true});

        for(const target of [this._target, this._glowTarget, this._softMap, this._softGlow]) target.destroy(true);

        this._falloff.destroy(true);
    }
}
