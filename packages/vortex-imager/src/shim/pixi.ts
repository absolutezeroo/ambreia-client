/**
 * The `pixi.js` surface the engine's avatar pipeline actually touches, reimplemented on
 * `@napi-rs/canvas`.
 *
 * `tools/build.mjs` aliases every `pixi.js` import in the engine's transitive graph to this
 * file. That graph — 130 files rooted at `AvatarRenderManager` — imports exactly three
 * symbols: `Texture`, `Spritesheet` and `Assets`. Nothing else from PixiJS is reachable, so
 * nothing else is implemented here; anything new the engine starts importing will fail at
 * bundle time rather than silently at runtime.
 *
 * A `Texture` here is a rectangle (`frame`) inside a drawable (`source.resource`), which is
 * all the compositing code ever asks for: it reads `source.resource` + `frame` and hands both
 * to `ctx.drawImage()`.
 */
import type {Canvas, Image} from '@napi-rs/canvas';
import { loadImage} from '@napi-rs/canvas';

/** Anything `ctx.drawImage()` accepts as a source. */
export type TextureResource = Canvas | Image;

export interface IRectangleLike
{
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * PixiJS splits a texture into the GPU-side source and the frame within it. The split is
 * kept because the engine reads `texture.source.resource` directly.
 */
export class TextureSource
{
    private _resource: TextureResource | null;

    constructor(resource: TextureResource)
    {
        this._resource = resource;
    }

    /**
	 * Deliberately `unknown`: the engine's compositing code casts this to the DOM's
	 * `CanvasImageSource` before handing it to `drawImage()`, and a cast out of `unknown` is
	 * legal where a cast between two unrelated concrete types would not compile. The runtime
	 * value is always a `Canvas` or an `Image`, both of which `@napi-rs/canvas` draws.
	 */
    get resource(): unknown
    {
        return this._resource;
    }

    get width(): number
    {
        return this._resource?.width ?? 0;
    }

    get height(): number
    {
        return this._resource?.height ?? 0;
    }

    /**
	 * PixiJS's "the pixels changed, re-upload them" signal.
	 *
	 * `RoomPlane.render()` calls it every time it repaints a floor or wall plane onto its own
	 * canvas. There is no GPU copy here — the canvas *is* the texture, and `composeSprites.ts`
	 * draws straight from it — so the repaint is already visible and there is nothing to do.
	 */
    update(): void
    {
        // Deliberately empty; see above.
    }

    destroy(): void
    {
        this._resource = null;
    }
}

/** What `Texture.from()` accepts: a bare drawable, or PixiJS's options object. */
export type TextureFromSource =
    | TextureResource
    | TextureSource
    | { resource: TextureResource; alphaMode?: string };

/** `textureFromCanvas()` (@ambreia/common) builds its Node textures on an ImageSource. */
export class ImageSource extends TextureSource
{
    constructor(options: {resource: TextureResource})
    {
        super(options.resource);
    }
}

export class Texture
{
    private _source: TextureSource;
    private _frame: IRectangleLike;
    private _trim: { x: number; y: number };
    private _orig: { width: number; height: number };

    constructor(options: {
        source: TextureSource;
        frame?: IRectangleLike | null;
        trim?: { x: number; y: number } | null;
        orig?: { width: number; height: number } | null;
    })
    {
        this._source = options.source;
        this._frame = options.frame ?? {
            x: 0,
            y: 0,
            width: options.source.width,
            height: options.source.height
        };
        this._trim = options.trim ?? {x: 0, y: 0};
        this._orig = options.orig ?? {width: this._frame.width, height: this._frame.height};
    }

    /**
	 * Where the frame's pixels sit inside the untrimmed sprite.
	 *
	 * A packer that trims transparent margins stores the surviving rectangle plus the offset it
	 * was cut from; PixiJS keeps both and draws the pixels at that offset, so every registration
	 * point in a `.nitro` bundle is relative to the *untrimmed* sprite. Dropping this is not a
	 * subtle inaccuracy — it moves a sprite by however much was cut off its top and left. The
	 * Freeze ice block (`es_box_64_a_0_0`, trimmed at `(2,16)`) rendered exactly 16px too high
	 * in every room until this existed, while a furni that happens to be untrimmed looked
	 * perfect beside it.
	 */
    get trim(): { x: number; y: number }
    {
        return this._trim;
    }

    /**
	 * The untrimmed size — what a bundle's registration points are measured against.
	 *
	 * Deliberately *not* what {@link width}/{@link height} return, even though real PixiJS
	 * reports `orig` there. The avatar pipeline sizes its composite canvas from
	 * `texture.width`/`height` and then draws `frame`, so switching those to `orig` grows the
	 * canvas without moving the pixels: a plain avatar went from 64x110 to 90x130 with the
	 * figure stuck in the corner. Whether that pipeline should be reading `orig` and honouring
	 * `trim` is an engine question, and a real one — but it is not this route's to answer, and
	 * changing it here would trade a furniture bug for an avatar one.
	 */
    get orig(): { width: number; height: number }
    {
        return this._orig;
    }

    /**
	 * Mirrors PixiJS's overload set: the engine calls this both with a raw drawable
	 * (`Texture.from(bitmap)`) and with an options object (`Texture.from({resource, alphaMode})`).
	 * `alphaMode` is a GPU upload hint with no meaning on a 2D canvas, so it is ignored.
	 */
    static from(source: TextureFromSource): Texture
    {
        if(source instanceof TextureSource)
        {
            return new Texture({source});
        }

        if(typeof source === 'object' && source !== null && 'resource' in source)
        {
            return new Texture({source: new TextureSource(source.resource)});
        }

        return new Texture({source: new TextureSource(source as TextureResource)});
    }

    get source(): TextureSource
    {
        return this._source;
    }

    get frame(): IRectangleLike
    {
        return this._frame;
    }

    get width(): number
    {
        return this._frame.width;
    }

    get height(): number
    {
        return this._frame.height;
    }

    /**
	 * `destroySource` is PixiJS's flag for tearing down the GPU resource too. Here the source
	 * is a plain canvas the garbage collector owns, so both paths just drop the reference.
	 */
    destroy(destroySource: boolean = false): void
    {
        if(destroySource) this._source.destroy();
    }
}

/** The TexturePacker-style frame block inside a .nitro bundle's JSON. */
export interface ISpritesheetFrameData
{
    frame: { x: number; y: number; w: number; h: number };

    /** Set by the packer when transparent margins were cut off. */
    trimmed?: boolean;

    /** The surviving rectangle's position inside the untrimmed sprite. */
    spriteSourceSize?: { x: number; y: number; w: number; h: number };

    /** The untrimmed size. */
    sourceSize?: { w: number; h: number };
}

export interface ISpritesheetData
{
    frames?: Record<string, ISpritesheetFrameData>;
    meta?: Record<string, unknown>;
}

/**
 * Slices one atlas into a `Texture` per frame.
 *
 * Trimming is carried through, because the furniture bundles use it heavily and the
 * registration points in the same bundle are relative to the untrimmed sprite — see
 * `Texture.trim`. Rotation and multi-pack sheets are the two things PixiJS's own Spritesheet
 * does that this one still does not; no `.nitro` read here has produced either, and a rotated
 * frame would come out sideways rather than silently misplaced.
 */
export class Spritesheet
{
    private _baseTexture: Texture;
    private _data: ISpritesheetData;
    private _textures: Record<string, Texture> = {};

    constructor(baseTexture: Texture, data: ISpritesheetData)
    {
        this._baseTexture = baseTexture;
        this._data = data;
    }

    get textures(): Record<string, Texture>
    {
        return this._textures;
    }

    async parse(): Promise<Record<string, Texture>>
    {
        const frames = this._data.frames ?? {};

        for(const [name, frameData] of Object.entries(frames))
        {
            const rect = frameData?.frame;

            if(!rect) continue;

            const trimmed = frameData.trimmed === true && frameData.spriteSourceSize !== undefined;
            const source = frameData.sourceSize;

            this._textures[name] = new Texture({
                source: this._baseTexture.source,
                frame: {x: rect.x, y: rect.y, width: rect.w, height: rect.h},
                trim: trimmed ? {x: frameData.spriteSourceSize!.x, y: frameData.spriteSourceSize!.y} : null,
                orig: source ? {width: source.w, height: source.h} : null
            });
        }

        return this._textures;
    }

    destroy(destroyBase: boolean = false): void
    {
        this._textures = {};

        if(destroyBase) this._baseTexture.destroy(true);
    }
}

/**
 * PixiJS's global asset cache. Only `BitmapFileLoader` reaches for it, and only to fetch a
 * standalone image; there is no cache to keep coherent here, so `unload` is a no-op.
 */
export const Assets = {
    async load<T = Texture>(url: string): Promise<T>
    {
        const image = await loadImage(url);

        return Texture.from(image) as T;
    },

    async unload(_url: string): Promise<void>
    {
        // No cache to evict — `load()` returns a fresh texture every time.
    }
};

/**
 * ── The display-object surface ────────────────────────────────────────────────────────────
 *
 * Everything below exists so the *room* graph links, not so it runs. `tools/build.mjs`
 * rewrites every `pixi.js` import in the engine to this file, and the room pipeline —
 * `RoomObjectSpriteVisualization` and the 40-odd furniture visualizations reachable from
 * `RoomObjectVisualizationFactory` — imports `Container`, `Graphics`, `Sprite`, `Text`,
 * `Filter`, `ColorMatrixFilter`, `Rectangle` and `Ticker` alongside the four real classes
 * above. An import esbuild cannot resolve is a build failure, so each one needs to exist.
 *
 * None of them needs to *work*. The imager never calls the two methods that rasterize through
 * PixiJS — `RoomObjectSpriteVisualization.getImage()` and `RoomRenderingCanvas` — because both
 * end at `Vortex.instance.application.renderer.extract`, and there is no renderer here. It
 * reads `visualization.getSprite(i)` instead and composites the frames itself
 * (`render/composeSprites.ts`), which is what AS3's own `BitmapData.draw()` loop did before
 * PixiJS was in the picture.
 *
 * What *is* on the imager's path stays intact: the plane rasterizers paint to plain 2D
 * canvases (`document.createElement('canvas')`, shimmed in `shim/globals.ts`) and hand back
 * `Texture.from(canvas)`, and `RoomPlane` only ever touches `Graphics` to park a `zIndex` on
 * it. So these are deliberately inert rather than throwing: a stub that throws on construction
 * would take down `new RoomPlane()` itself, which the room render very much needs.
 */
export class Container
{
    children: unknown[] = [];
    zIndex: number = 0;
    visible: boolean = true;
    alpha: number = 1;
    x: number = 0;
    y: number = 0;
    parent: Container | null = null;

    addChild<T>(child: T): T
    {
        this.children.push(child);

        return child;
    }

    removeChild<T>(child: T): T
    {
        const index = this.children.indexOf(child);

        if(index >= 0) this.children.splice(index, 1);

        return child;
    }

    removeChildren(): unknown[]
    {
        return this.children.splice(0, this.children.length);
    }

    destroy(_options?: unknown): void
    {
        this.children.length = 0;
    }
}

export class Sprite extends Container
{
    texture: Texture | null;
    tint: number = 0xFFFFFF;
    blendMode: string = 'normal';
    anchor = {x: 0, y: 0, set: (x: number, y?: number): void => void (x + (y ?? x))};
    scale = {x: 1, y: 1, set: (x: number, y?: number): void => void (x + (y ?? x))};

    constructor(texture: Texture | null = null)
    {
        super();

        this.texture = texture;
    }

    static from(texture: Texture | null): Sprite
    {
        return new Sprite(texture);
    }
}

export class Text extends Container
{
    text: string = '';
    style: unknown = null;

    constructor(options?: { text?: string; style?: unknown })
    {
        super();

        this.text = options?.text ?? '';
        this.style = options?.style ?? null;
    }
}

/**
 * `RoomPlane` builds one in its constructor and only ever sets `zIndex` on it, so the chained
 * drawing API is here purely to keep any other caller from crashing on an undefined method.
 */
export class Graphics extends Container
{
    clear(): this
    {
        return this;
    }

    rect(): this
    {
        return this;
    }

    poly(): this
    {
        return this;
    }

    cut(): this
    {
        return this;
    }

    fill(): this
    {
        return this;
    }

    stroke(): this
    {
        return this;
    }
}

export class Filter
{
    padding: number = 0;
    resolution: number = 1;

    static from(_options: unknown): Filter
    {
        return new Filter();
    }
}

/**
 * The shader half of `@core/utils/GlowFilter`, which reaches the bundle through
 * `FurnitureFurniChestVisualization`. A filter is a GPU program; there is no GPU here, and the
 * filter list on a sprite is never read by `composeSprites.ts`, so the glow is simply absent
 * from a rendered chest — which is what it looks like in the client when it is not selected.
 */
export const defaultFilterVert = '';

export class GlProgram
{
    static from(_options: unknown): GlProgram
    {
        return new GlProgram();
    }
}

/**
 * Only `toArray()` is reachable (`GlowFilter` normalises a hex colour with it), but the whole
 * small surface is honest rather than stubbed: getting a colour subtly wrong is the kind of
 * thing that shows up as a tint nobody can explain.
 */
export class Color
{
    private _value: number;

    constructor(value: number | string = 0)
    {
        this._value = typeof value === 'string'
            ? Number.parseInt(value.replace(/^#/, ''), 16) || 0
            : value;
    }

    toNumber(): number
    {
        return this._value >>> 0;
    }

    toArray(): number[]
    {
        return [
            ((this._value >> 16) & 0xFF) / 255,
            ((this._value >> 8) & 0xFF) / 255,
            (this._value & 0xFF) / 255
        ];
    }

    toHex(): string
    {
        return `#${(this._value & 0xFFFFFF).toString(16).padStart(6, '0')}`;
    }
}

export class ColorMatrixFilter extends Filter
{
    matrix: number[] = [];

    reset(): void
    {
        this.matrix = [];
    }
}

export class Rectangle
{
    constructor(
        public x: number = 0,
        public y: number = 0,
        public width: number = 0,
        public height: number = 0
    )
    {}
}

/** Type-only in the engine (`takeScreenShot(renderer: Renderer)`), but esbuild still resolves it. */
export class Renderer
{}

/**
 * The engine reads `Ticker.shared.deltaMS` in a couple of visualizations. A server renders one
 * frame per request and advances animation with an explicit frame count instead, so a fixed
 * 60fps step is both what those readers expect and the only honest answer here.
 */
export class Ticker
{
    static shared: Ticker = new Ticker();

    deltaTime: number = 1;
    deltaMS: number = 1000 / 60;
    elapsedMS: number = 1000 / 60;
    lastTime: number = 0;

    add(): this
    {
        return this;
    }

    remove(): this
    {
        return this;
    }
}
