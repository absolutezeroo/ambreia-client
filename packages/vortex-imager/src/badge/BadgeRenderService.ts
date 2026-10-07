/**
 * Composites guild badges, porting `BadgeEditorPartItem` exactly.
 *
 * The client draws the badge editor's preview itself — five stacked layers, each a part image
 * positioned on a 3x3 grid and multiplied by its colour — so the badge an imager returns and
 * the badge the editor previews come from the same rules. Every constant and every step below
 * is that AS3 method; the only difference is that AS3 hands each layer to its own window and
 * this flattens them onto one canvas, which is the same picture.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/groups/badge/BadgeEditorPartItem.as
 */
import {createCanvas, loadImage} from '@napi-rs/canvas';
import type {Canvas, Image, SKRSContext2D} from '@napi-rs/canvas';
import {Logger} from '@ambreia/common/utils/Logger';
import type {IBadgeLayer} from './BadgeCode';
import {parseBadgeCode} from './BadgeCode';
import type {Database, IBadgePartRow} from '../db/Database';

const log = Logger.getLogger('imager.badge.BadgeRenderService');

// AS3: .../groups/badge/BadgeEditorPartItem.as::IMAGE_WIDTH
const IMAGE_WIDTH = 39;

// AS3: .../groups/badge/BadgeEditorPartItem.as::IMAGE_HEIGHT
const IMAGE_HEIGHT = 39;

// AS3: .../groups/badge/BadgeEditorPartItem.as::CELL_WIDTH
const CELL_WIDTH = 13;

// AS3: .../groups/badge/BadgeEditorPartItem.as::CELL_HEIGHT
const CELL_HEIGHT = 13;

interface IRgb
{
    red: number;
    green: number;
    blue: number;
}

export class BadgeRenderError extends Error {}

export class BadgeRenderService
{
    private _database: Database;

    /** `image.library.badgepart.url`, with a trailing slash. */
    private _partBaseUrl: string;

    private _parts: Map<string, IBadgePartRow> | null = null;
    private _colors: Map<number, string> | null = null;
    private _catalogue: Promise<void> | null = null;
    private _images: Map<string, Promise<Image | null>> = new Map();

    constructor(database: Database, partBaseUrl: string)
    {
        this._database = database;
        this._partBaseUrl = partBaseUrl.endsWith('/') ? partBaseUrl : `${partBaseUrl}/`;
    }

    /**
	 * Renders a badge code to a PNG.
	 *
	 * @param zoom integer nearest-neighbour magnification of the 39x39 result.
	 */
    async render(code: string, zoom: number = 1): Promise<Buffer>
    {
        await this.loadCatalogue();

        const layers = parseBadgeCode(code);
        const magnification = Math.max(1, Math.trunc(zoom));
        const canvas = createCanvas(IMAGE_WIDTH * magnification, IMAGE_HEIGHT * magnification);
        const context = canvas.getContext('2d');

        context.imageSmoothingEnabled = false;

        let drawn = 0;

        for(const layer of layers)
        {
            const composite = await this.renderLayer(layer);

            if(composite === null) continue;

            context.drawImage(composite, 0, 0, IMAGE_WIDTH * magnification, IMAGE_HEIGHT * magnification);
            drawn++;
        }

        if(drawn === 0)
        {
            throw new BadgeRenderError(`No badge part image resolved for "${code}"`);
        }

        return canvas.encode('png');
    }

    /** Drops the cached part catalogue and images so a palette change is picked up. */
    reset(): void
    {
        this._parts = null;
        this._colors = null;
        this._catalogue = null;
        this._images.clear();
    }

    /**
	 * One layer, drawn exactly as `BadgeEditorPartItem.getComposite()` does it: place the part,
	 * multiply the whole layer by the colour, then lay the mask on top *uncoloured* — that last
	 * step is what keeps the gold bases' frame gold whatever colour the shield behind it is.
	 */
    private async renderLayer(layer: IBadgeLayer): Promise<Canvas | null>
    {
        const part = this._parts?.get(`${layer.type}:${layer.partId}`) ?? null;

        if(part === null)
        {
            log.warn(`Unknown badge part ${layer.type} #${layer.partId}`);

            return null;
        }

        const image = await this.loadPartImage(part.fileName);

        if(image === null) return null;

        const canvas = createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
        const context = canvas.getContext('2d');
        const position = getPosition(layer, image.width, image.height);

        context.drawImage(image, position.x, position.y);

        this.applyColor(context, layer.colorId);

        if(part.maskFileName.length > 0)
        {
            const mask = await this.loadPartImage(part.maskFileName);

            if(mask !== null) context.drawImage(mask, position.x, position.y);
        }

        return canvas;
    }

    /**
	 * AS3 multiplies the layer by a `ColorTransform` built from the colour's channels over 255.
	 * Alpha is left alone, which is why a transparent pixel stays transparent no matter how
	 * dark the colour is.
	 */
    private applyColor(context: SKRSContext2D, colorId: number): void
    {
        const color = this.resolveColor(colorId);

        if(color === null) return;

        const redMultiplier = color.red / 255;
        const greenMultiplier = color.green / 255;
        const blueMultiplier = color.blue / 255;

        if(redMultiplier === 1 && greenMultiplier === 1 && blueMultiplier === 1) return;

        const pixels = context.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        const data = pixels.data;

        for(let i = 0; i < data.length; i += 4)
        {
            data[i] = Math.min(255, (data[i] * redMultiplier) | 0);
            data[i + 1] = Math.min(255, (data[i + 1] * greenMultiplier) | 0);
            data[i + 2] = Math.min(255, (data[i + 2] * blueMultiplier) | 0);
        }

        context.putImageData(pixels, 0, 0);
    }

    private resolveColor(colorId: number): IRgb | null
    {
        const hex = this._colors?.get(colorId) ?? null;

        if(hex === null)
        {
            log.warn(`Unknown badge colour #${colorId}`);

            return null;
        }

        const value = parseInt(hex.replace('#', ''), 16);

        if(!Number.isFinite(value)) return null;

        return {
            red: (value >> 16) & 0xFF,
            green: (value >> 8) & 0xFF,
            blue: value & 0xFF
        };
    }

    /**
	 * AS3 strips any extension the server sent and rebuilds the name as
	 * `<badgepart url>badgepart_<file>.png`, so a catalogue row saying `base_basic_1.gif` and
	 * one saying `base_basic_1` resolve to the same PNG.
	 */
    private loadPartImage(fileName: string): Promise<Image | null>
    {
        const name = fileName.replace('.gif', '').replace('.png', '');
        const cached = this._images.get(name);

        if(cached !== undefined) return cached;

        const url = `${this._partBaseUrl}badgepart_${name}.png`;
        const pending = (async (): Promise<Image | null> =>
        {
            try
            {
                const response = await fetch(url);

                if(!response.ok)
                {
                    log.warn(`Badge part image missing: ${url} (${response.status})`);

                    return null;
                }

                return await loadImage(Buffer.from(await response.arrayBuffer()));
            }
            catch (error)
            {
                log.warn(`Badge part image failed to load: ${url}`, error);

                return null;
            }
        })();

        this._images.set(name, pending);

        return pending;
    }

    private loadCatalogue(): Promise<void>
    {
        if(this._catalogue !== null) return this._catalogue;

        this._catalogue = (async (): Promise<void> =>
        {
            const [parts, colors] = await Promise.all([
                this._database.findBadgeParts(),
                this._database.findBadgeColors()
            ]);

            const byKey = new Map<string, IBadgePartRow>();

            for(const part of parts) byKey.set(`${part.type}:${part.partId}`, part);

            this._parts = byKey;
            this._colors = colors;

            log.debug(`Badge catalogue: ${byKey.size} parts, ${colors.size} colours`);
        })();

        this._catalogue.catch(() =>
        {
            // A failed load must not poison the cache — the next request retries.
            this._catalogue = null;
        });

        return this._catalogue;
    }
}

/**
 * Centres the part on its grid cell and pushes it back inside the badge if it overhangs.
 *
 * AS3: `BadgeEditorPartItem.getPosition()`. The base is 39x39 so it always clamps to (0,0),
 * which is why the editor hides the position picker on layer 0.
 */
function getPosition(layer: IBadgeLayer, width: number, height: number): { x: number; y: number }
{
    let x = CELL_WIDTH * layer.gridX + CELL_WIDTH / 2 - width / 2;
    let y = CELL_HEIGHT * layer.gridY + CELL_HEIGHT / 2 - height / 2;

    if(x < 0) x = 0;

    if(x + width > IMAGE_WIDTH) x = IMAGE_WIDTH - width;

    if(y < 0) y = 0;

    if(y + height > IMAGE_HEIGHT) y = IMAGE_HEIGHT - height;

    return {x: Math.floor(x), y: Math.floor(y)};
}
