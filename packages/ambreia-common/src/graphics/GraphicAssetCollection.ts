/**
 * GraphicAssetCollection
 *
 * @see com.sulake.room.object.visualization.utils.GraphicAssetCollection
 *
 * Manages a collection of graphic assets parsed from Nitro JSON asset bundles.
 * Supports palette colorization and reference counting.
 */
import type {Texture} from 'pixi.js';
import {platform} from '../platform/Platform';
import {textureFromCanvas} from './textureFromCanvas';
import type {IGraphicAsset} from './IGraphicAsset';
import type {IGraphicAssetCollection} from './IGraphicAssetCollection';
import {GraphicAsset} from './GraphicAsset';
import {GraphicAssetPalette} from './GraphicAssetPalette';

export class GraphicAssetCollection implements IGraphicAssetCollection
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::PALETTE_ASSET_DISPOSE_THRESHOLD
    private static readonly PALETTE_ASSET_DISPOSE_THRESHOLD: number = 10;

    // DEVIATION: AS3's asset library is a lazy, name-keyed lookup
    //   (`getAssetByName()`/`setAsset()`) that defineAssets()/definePalettes()/addAsset() resolve
    //   each asset through one at a time, which is why the collection holds a reference to it.
    //   `defineFromSpritesheet()` here takes a `Map<string, Texture>` already resolved — a .nitro
    //   bundle's spritesheet is decoded up front — so every texture is in hand before the
    //   collection is built and there is no round trip left to keep a library for.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::set assetLibrary
    private _name: string = '';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::_assets
    private _assets: Map<string, GraphicAsset> = new Map();
    private _palettes: Map<string, GraphicAssetPalette> = new Map();
    // Name DERIVED from what it holds; the AS3 field is obfuscated in every tree.
    // AS3: sources/win63_version/room/object/visualization/utils/GraphicAssetCollection.as::var_2811
    private _paletteXML: Map<string, Record<string, unknown>> = new Map();
    private _paletteAssetNames: string[] = [];
    private _textures: Map<string, Texture> = new Map();
    private _referenceCount: number = 0;
    private _lastReferenceTimestamp: number = 0;
    private _disposed: boolean = false;

    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::dispose()
    dispose(): void
    {
        if(this._disposed)
        {
            return;
        }

        this._disposed = true;

        for(const palette of this._palettes.values())
        {
            if(palette !== null)
            {
                palette.dispose();
            }
        }

        this._palettes.clear();
        this._paletteXML.clear();
        this.disposePaletteAssets();

        for(const asset of this._assets.values())
        {
            if(asset !== null)
            {
                asset.recycle();
            }
        }

        this._assets.clear();
        this._textures.clear();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::addReference()
    addReference(): void
    {
        this._referenceCount++;
        this._lastReferenceTimestamp = Date.now();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::removeReference()
    removeReference(): void
    {
        this._referenceCount--;

        if(this._referenceCount <= 0)
        {
            this._referenceCount = 0;
            this._lastReferenceTimestamp = Date.now();
            this.disposePaletteAssets(false);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::getReferenceCount()
    getReferenceCount(): number
    {
        return this._referenceCount;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::getLastReferenceTimeStamp()
    getLastReferenceTimestamp(): number
    {
        return this._lastReferenceTimestamp;
    }

    /**
	 * Define assets from a Nitro JSON asset bundle.
	 *
	 * Expected data format (from Nitro bundles):
	 * ```json
	 * {
	 *   "assets": { "name": { "source": "...", "x": 0, "y": 0, "flipH": 1, "flipV": 0, "usesPalette": 0 } },
	 *   "palettes": { "id": { "source": "...", "color1": "FFFFFF", "color2": "FFFFFF" } }
	 * }
	 * ```
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::define()
    define(data: Record<string, unknown>): boolean
    {
        if(data === null)
        {
            return false;
        }

        const palettes = (data['palettes'] ?? data['palette'] ?? null) as Record<string, Record<string, unknown>> | null;

        if(palettes)
        {
            this.definePalettes(palettes);
        }

        const assets = data['assets'] ?? data['asset'] ?? null;

        if(!assets)
        {
            return false;
        }

        this.defineAssets(assets);

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::getAsset()
    getAsset(name: string): IGraphicAsset | null
    {
        const existing = this._assets.get(name);

        if(existing)
        {
            return existing;
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::getAssetWithPalette()
    getAssetWithPalette(name: string, paletteName: string): IGraphicAsset | null
    {
        const key = name + '@' + paletteName;
        let asset = this.getAsset(key);

        if(asset === null)
        {
            const original = this.getAsset(name);

            if(original === null || !original.usesPalette)
            {
                return original;
            }

            const palette = this._palettes.get(paletteName);

            if(!palette)
            {
                return original;
            }

            // For palette colorization, we would need to create a new texture
            // by applying the palette to the original texture's pixels.
            // For now, return the original asset as palette support requires
            // canvas-based pixel manipulation at runtime.
            const libraryKey = original.libraryAssetName + '@' + paletteName;
            let palettizedTexture: Texture | null = this._textures.get(libraryKey) ?? null;

            if(!palettizedTexture && original.texture)
            {
                palettizedTexture = this.colorizePalette(original.texture, palette);

                if(palettizedTexture)
                {
                    this._textures.set(libraryKey, palettizedTexture);
                }
            }

            if(palettizedTexture)
            {
                this._paletteAssetNames.push(key);

                const paletteAsset = GraphicAsset.allocate(
                    key,
                    libraryKey,
                    palettizedTexture,
                    original.flipH,
                    original.flipV,
                    original.originalOffsetX,
                    original.originalOffsetY,
                    false
                );

                this._assets.set(key, paletteAsset);
                asset = paletteAsset;
            }
        }

        return asset;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::getPaletteNames()
    getPaletteNames(): string[]
    {
        return Array.from(this._palettes.keys());
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::getPaletteColors()
    getPaletteColors(paletteName: string): [number, number] | null
    {
        const palette = this._palettes.get(paletteName);

        if(palette !== null && palette !== undefined)
        {
            return [palette.primaryColor, palette.secondaryColor];
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::getPaletteXML()
    getPaletteXML(paletteName: string): Record<string, unknown> | null
    {
        return this._paletteXML.get(paletteName) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::addAsset()
    addAsset(
        name: string,
        texture: Texture,
        override: boolean,
        offsetX: number = 0,
        offsetY: number = 0,
        flipH: boolean = false,
        flipV: boolean = false
    ): boolean
    {
        if(name === null || texture === null)
        {
            return false;
        }

        const existing = this._textures.get(name);

        if(!existing)
        {
            this._textures.set(name, texture);

            return this.createAsset(name, name, texture, flipH, flipV, offsetX, offsetY, false);
        }

        if(override)
        {
            this._textures.set(name, texture);
            return true;
        }

        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::disposeAsset()
    disposeAsset(name: string): void
    {
        const asset = this._assets.get(name);

        if(asset !== null && asset !== undefined)
        {
            this._assets.delete(name);
            this._textures.delete(asset.libraryAssetName);
            asset.recycle();
        }
    }

    /**
	 * Define assets from Nitro JSON spritesheet data and register textures.
	 *
	 * @param textures Textures from spritesheet (keys prefixed with libraryName)
	 * @param assetData Asset definitions from bundle JSON
	 * @param libraryName The library/collection name used to prefix texture lookups
	 */
    // `palettes` is not optional in practice: RoomContentLoader takes this path for every .nitro
    // bundle and returns before ever reaching define(), which used to be the only place palettes
    // were parsed. Without them, palette-swapped libraries (pets above all) loaded all their
    // sprites and none of their colours, and rendered greyscale.
    //
    // Palettes are defined before assets, matching define()'s own order.
    defineFromSpritesheet(
        textures: Map<string, Texture>,
        assetData: unknown,
        libraryName: string = '',
        palettes: Record<string, Record<string, unknown>> | null = null
    ): void
    {
        this._name = libraryName;

        for(const [name, texture] of textures)
        {
            this._textures.set(name, texture);
        }

        if(palettes)
        {
            this.definePalettes(palettes);
        }

        if(assetData)
        {
            this.defineAssets(assetData);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::defineAssets()
    private defineAssets(assets: unknown): void
    {
        for(const [name, assetDef] of GraphicAssetCollection.getAssetDefinitions(assets))
        {
            if(name.length === 0)
            {
                continue;
            }

            let source = GraphicAssetCollection.getString(assetDef, 'source');
            const flipH = GraphicAssetCollection.getNumber(assetDef, 'flipH', 0, 'flip_h') > 0 && source.length > 0;
            const flipV = GraphicAssetCollection.getNumber(assetDef, 'flipV', 0, 'flip_v') > 0 && source.length > 0;
            const usesPalette = GraphicAssetCollection.getNumber(assetDef, 'usesPalette', 0, 'uses_palette') !== 0;
            const offsetX = -GraphicAssetCollection.getNumber(assetDef, 'x', 0);
            const offsetY = -GraphicAssetCollection.getNumber(assetDef, 'y', 0);

            if(source.length === 0)
            {
                source = name;
            }

            // Nitro bundle spritesheet frames are prefixed with the library name:
            // e.g., frame = "table_silo_med_table_silo_med_64_a_0_0"
            // while asset source = "table_silo_med_64_a_0_0"
            // So we prepend the library name when looking up textures.
            let textureName = source;

            if(this._name.length > 0)
            {
                textureName = this._name + '_' + source;
            }

            // Some spritesheets key their frames with the original file extension
            // (e.g. "tile_cursor_tile_cursor_64_a_0_0.png") while asset definitions
            // never include it — try both forms.
            const texture = this._textures.get(textureName)
				|| this._textures.get(textureName + '.png')
				|| this._textures.get(source)
				|| this._textures.get(source + '.png')
				|| null;

            if(texture !== null)
            {
                if(!this.createAsset(name, source, texture, flipH, flipV, offsetX, offsetY, usesPalette))
                {
                    const existing = this.getAsset(name);

                    if(existing !== null && existing.assetName !== existing.libraryAssetName)
                    {
                        this.replaceAsset(name, source, texture, flipH, flipV, offsetX, offsetY, usesPalette);
                    }
                }
            }
        }
    }

    private static getAssetDefinitions(assets: unknown): Array<[string, Record<string, unknown>]>
    {
        const definitions: Array<[string, Record<string, unknown>]> = [];

        if(Array.isArray(assets))
        {
            for(const value of assets)
            {
                const assetDef = GraphicAssetCollection.asRecord(value);

                if(assetDef === null)
                {
                    continue;
                }

                const name = GraphicAssetCollection.getString(assetDef, 'name');

                if(name.length > 0)
                {
                    definitions.push([name, assetDef]);
                }
            }

            return definitions;
        }

        const assetRecord = GraphicAssetCollection.asRecord(assets);

        if(assetRecord === null)
        {
            return definitions;
        }

        const directName = GraphicAssetCollection.getString(assetRecord, 'name');

        if(directName.length > 0)
        {
            definitions.push([directName, assetRecord]);

            return definitions;
        }

        const nestedAssets = assetRecord['asset'];

        if(Array.isArray(nestedAssets))
        {
            return GraphicAssetCollection.getAssetDefinitions(nestedAssets);
        }

        for(const name in assetRecord)
        {
            const assetDef = GraphicAssetCollection.asRecord(assetRecord[name]);

            if(assetDef !== null)
            {
                definitions.push([name, assetDef]);
            }
        }

        return definitions;
    }

    private static asRecord(value: unknown): Record<string, unknown> | null
    {
        if(value === null || value === undefined || typeof value !== 'object' || Array.isArray(value))
        {
            return null;
        }

        return value as Record<string, unknown>;
    }

    private static getString(data: Record<string, unknown>, key: string): string
    {
        const value = data[key];

        if(typeof value === 'string')
        {
            return value;
        }

        if(value !== null && value !== undefined)
        {
            return String(value);
        }

        return '';
    }

    private static getNumber(data: Record<string, unknown>, key: string, defaultValue: number, fallbackKey: string | null = null): number
    {
        let value = data[key];

        if((value === null || value === undefined) && fallbackKey !== null)
        {
            value = data[fallbackKey];
        }

        if(typeof value === 'number')
        {
            return value;
        }

        // .nitro bundles encode flags as real JSON booleans (`"usesPalette": true`), where the XML
        // this originally parsed used "1"/"0". Without this branch such a flag silently falls
        // through to defaultValue - which for usesPalette meant every palette-swapped sprite
        // reported "no palette" and getAssetWithPalette() returned it uncolourised.
        if(typeof value === 'boolean')
        {
            return value ? 1 : 0;
        }

        if(typeof value === 'string' && value.length > 0)
        {
            const parsed = Number(value);

            if(!Number.isNaN(parsed))
            {
                return parsed;
            }
        }

        return defaultValue;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::definePalettes()
    private definePalettes(palettes: Record<string, Record<string, unknown>>): void
    {
        for(const id in palettes)
        {
            if(this._palettes.has(id))
            {
                continue;
            }

            const paletteDef = palettes[id];
            const source = paletteDef['source'] as string;

            if(!source)
            {
                continue;
            }

            // .nitro bundles store `rgb` as an array of [r, g, b] triplets, not a flat byte run.
            // GraphicAssetPalette walks its input three bytes at a time, so the triplets must be
            // flattened first: `new Uint8Array([[0,0,0],[209,0,0]])` coerces each sub-array to a
            // number, yields NaN -> 0, and produces a two-entry all-black palette. Flat input is
            // still accepted, since nothing guarantees every bundle uses the nested shape.
            const rawPalette = (paletteDef['rgb'] ?? null) as number[] | number[][] | null;

            if(!rawPalette || rawPalette.length === 0)
            {
                continue;
            }

            const paletteData: number[] = Array.isArray(rawPalette[0])
                ? (rawPalette as number[][]).flat()
                : (rawPalette as number[]);

            let primaryColor = 0xFFFFFF;
            let secondaryColor = 0xFFFFFF;

            const color1 = paletteDef['color1'] as string;

            if(color1 && color1.length > 0)
            {
                primaryColor = parseInt(color1, 16);
                secondaryColor = primaryColor;
            }

            const color2 = paletteDef['color2'] as string;

            if(color2 && color2.length > 0)
            {
                secondaryColor = parseInt(color2, 16);
            }

            const bytes = new Uint8Array(paletteData);
            const palette = new GraphicAssetPalette(bytes, primaryColor, secondaryColor);

            this._palettes.set(id, palette);
            this._paletteXML.set(id, paletteDef);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::createAsset()
    private createAsset(
        name: string,
        libraryName: string,
        texture: Texture,
        flipH: boolean,
        flipV: boolean,
        offsetX: number,
        offsetY: number,
        usesPalette: boolean
    ): boolean
    {
        if(this._assets.has(name))
        {
            return false;
        }

        const asset = GraphicAsset.allocate(name, libraryName, texture, flipH, flipV, offsetX, offsetY, usesPalette);
        this._assets.set(name, asset);

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::replaceAsset()
    private replaceAsset(
        name: string,
        libraryName: string,
        texture: Texture,
        flipH: boolean,
        flipV: boolean,
        offsetX: number,
        offsetY: number,
        usesPalette: boolean
    ): boolean
    {
        const existing = this._assets.get(name);

        if(existing)
        {
            this._assets.delete(name);
            existing.recycle();
        }

        return this.createAsset(name, libraryName, texture, flipH, flipV, offsetX, offsetY, usesPalette);
    }

    private colorizePalette(texture: Texture, palette: GraphicAssetPalette): Texture | null
    {
        try
        {
            const w = texture.width;
            const h = texture.height;
            const canvas = platform().createCanvas(w, h);

            const ctx = canvas.getContext('2d');

            if(!ctx)
            {
                return null;
            }

            // `texture.source.resource` is the whole spritesheet, not this sprite: every asset in a
            // .nitro library is a frame inside one atlas. Blitting it at 0,0 into a frame-sized
            // canvas colourised whatever happened to sit in the atlas's top-left corner, which is
            // why palettised pets came out as scrambled fragments. Copy just this texture's frame.
            const source = texture.source;

            if(source && source.resource)
            {
                const frame = texture.frame;

                ctx.drawImage(
                    source.resource as CanvasImageSource,
                    frame.x, frame.y, frame.width, frame.height,
                    0, 0, frame.width, frame.height
                );
            }
            else
            {
                return null;
            }

            const imageData = ctx.getImageData(0, 0, w, h);
            palette.colorizePixels(imageData);
            ctx.putImageData(imageData, 0, 0);

            return textureFromCanvas(canvas);
        }
        catch
        {
            return null;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/utils/GraphicAssetCollection.as::disposePaletteAssets()
    private disposePaletteAssets(force: boolean = true): void
    {
        if(this._paletteAssetNames !== null)
        {
            if(force || this._paletteAssetNames.length > GraphicAssetCollection.PALETTE_ASSET_DISPOSE_THRESHOLD)
            {
                for(const name of this._paletteAssetNames)
                {
                    this.disposeAsset(name);
                }

                this._paletteAssetNames = [];
            }
        }
    }
}
