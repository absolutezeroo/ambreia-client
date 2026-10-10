import type {Container} from 'pixi.js';
import {Rectangle, Sprite, Texture} from 'pixi.js';
import type {AssetLibrary} from '@ambreia/common/assets/AssetLibrary';
import {sheetFrames, type IVfxSheet, type VfxAttach} from './vfxSheets';

/** What the effects need of the room: its overlay and where things are on it (RoomEngine). */
export interface IVfxStage
{
    readonly rpgOverlay: Container | null;
    /** An avatar's body centre, or its feet. */
    getRpgOverlayAnchor(objectId: number, out: {x: number; y: number}, feet?: boolean): boolean;
    /** The floor at this tile. */
    getRpgOverlayCell(x: number, y: number, out: {x: number; y: number}): boolean;
    /** A sheet under an avatar, sorted behind it; null when it is not an avatar here. */
    playRpgGroundSheet(objectId: number, frames: readonly Texture[], ms: number, anchorX: number, anchorY: number, loop: boolean): (() => void) | null;
}

/** Where a sprite follows: an avatar (its body or its feet) or a tile. */
type Follow = (out: {x: number; y: number}) => boolean;

/** The shortest flight: a projectile between neighbours still shows. */
const MIN_FLIGHT_MS = 180;

/**
 * The combat's sprite effects, drawn on the room canvas's overlay in the objects' own space, so they
 * scale and scroll with the room: a projectile from one avatar to another (shoot()), a sheet played
 * once over an avatar or a tile (burst(), burstAt()), one looped over an avatar until stopped
 * (loop()). What plays when is the content's (vfxSheets.ts: IVfxSet); this only draws. Each sprite
 * advances itself in its onRender; the frame loop allocates nothing. The textures are cut from the
 * library's bitmaps on first use.
 */
export class CombatVfx
{
    private readonly _textures = new Map<string, Texture[]>();
    private readonly _point = {x: 0, y: 0};

    constructor(
        private readonly _assets: AssetLibrary,
        private readonly _stage: () => IVfxStage | null
    ) {}

    /**
     * The sheet flies from one avatar's body to the other's at `speed` px/s, following the target
     * as it walks, then `land` runs. Returns the flight in ms; 0 when nothing could be drawn (then
     * `land` does not run).
     */
    shoot(sheet: IVfxSheet, speed: number, fromId: number, toId: number, land: () => void): number
    {
        const stage = this._stage();
        const frames = this.frames(sheet);
        const point = this._point;

        if(!stage?.rpgOverlay || !frames || speed <= 0 || !stage.getRpgOverlayAnchor(toId, point)) return 0;

        const to = {x: point.x, y: point.y};

        if(!stage.getRpgOverlayAnchor(fromId, point)) return 0;

        const from = {x: point.x, y: point.y};
        const ms = Math.max(MIN_FLIGHT_MS, Math.hypot(to.x - from.x, to.y - from.y) / speed * 1000);
        const sprite = CombatVfx.sprite(sheet, frames[0], from);
        const born = performance.now();
        let done = false;

        sprite.onRender = () =>
        {
            if(done) return;

            const age = performance.now() - born;
            const t = Math.min(1, age / ms);

            if(stage.getRpgOverlayAnchor(toId, point))
            {
                to.x = point.x;
                to.y = point.y;
            }

            sprite.position.set(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
            sprite.texture = frames[Math.floor(age / sheet.ms) % frames.length];

            if(t < 1) return;

            done = true;
            // The scene graph is being walked: it changes once the frame is drawn.
            queueMicrotask(() =>
            {
                if(!sprite.destroyed) sprite.destroy();
                land();
            });
        };
        stage.rpgOverlay.addChild(sprite);

        return ms;
    }

    /**
     * The sheet plays once on this avatar, following it: on its body or at its feet over it, or on
     * the ground under it (an avatar addition, sorted behind it).
     */
    burst(sheet: IVfxSheet, objectId: number, attach: VfxAttach): void
    {
        const stage = this._stage();

        if(!stage) return;

        if(attach === 'ground')
        {
            const frames = this.frames(sheet);

            if(frames) stage.playRpgGroundSheet(objectId, frames, sheet.ms, sheet.anchorX, sheet.anchorY, false);

            return;
        }

        this.play(stage, sheet, out => stage.getRpgOverlayAnchor(objectId, out, attach === 'feet'), false);
    }

    /** The sheet plays once on this tile. */
    burstAt(sheet: IVfxSheet, x: number, y: number): void
    {
        const stage = this._stage();

        if(stage) this.play(stage, sheet, out => stage.getRpgOverlayCell(x, y, out), false);
    }

    /** The sheet loops on this avatar (as burst() places it), following it, until the returned function is called. */
    loop(sheet: IVfxSheet, objectId: number, attach: VfxAttach): () => void
    {
        const stage = this._stage();

        if(!stage) return () => undefined;

        if(attach === 'ground')
        {
            const frames = this.frames(sheet);

            return (frames && stage.playRpgGroundSheet(objectId, frames, sheet.ms, sheet.anchorX, sheet.anchorY, true)) ?? (() => undefined);
        }

        return this.play(stage, sheet, out => stage.getRpgOverlayAnchor(objectId, out, attach === 'feet'), true);
    }

    private play(stage: IVfxStage, sheet: IVfxSheet, follow: Follow, loop: boolean): () => void
    {
        const frames = this.frames(sheet);
        const point = this._point;

        if(!stage.rpgOverlay || !frames || !follow(point)) return () => undefined;

        const sprite = CombatVfx.sprite(sheet, frames[0], point);
        const born = performance.now();
        let done = false;
        const stop = (): void =>
        {
            if(done) return;

            done = true;
            queueMicrotask(() => { if(!sprite.destroyed) sprite.destroy(); });
        };

        sprite.onRender = () =>
        {
            if(done) return;

            const index = Math.floor((performance.now() - born) / sheet.ms);

            if(!loop && index >= frames.length)
            {
                stop();

                return;
            }

            sprite.texture = frames[index % frames.length];
            if(follow(point)) sprite.position.set(point.x, point.y);
        };
        stage.rpgOverlay.addChild(sprite);

        return stop;
    }

    private static sprite(sheet: IVfxSheet, texture: Texture, at: {x: number; y: number}): Sprite
    {
        const sprite = new Sprite({texture, eventMode: 'none'});

        sprite.anchor.set(sheet.anchorX / sheet.width, sheet.anchorY / sheet.height);
        sprite.position.set(at.x, at.y);

        return sprite;
    }

    private frames(sheet: IVfxSheet): Texture[] | null
    {
        const known = this._textures.get(sheet.asset);

        if(known) return known;

        const bitmap = this._assets.getAssetByName(sheet.asset)?.content;

        if(!(bitmap instanceof ImageBitmap)) return null;

        const base = Texture.from(bitmap);
        const frames = sheetFrames(sheet).map(cell => new Texture({source: base.source, frame: new Rectangle(cell.x, cell.y, sheet.width, sheet.height)}));

        this._textures.set(sheet.asset, frames);

        return frames;
    }

    dispose(): void
    {
        for(const frames of this._textures.values()) for(const texture of frames) texture.destroy();
        this._textures.clear();
    }
}
