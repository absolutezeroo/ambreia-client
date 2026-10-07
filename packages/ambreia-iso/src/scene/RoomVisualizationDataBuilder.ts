import type {Texture} from 'pixi.js';
import {Logger} from '@ambreia/common/utils/Logger';
import {createOffscreenCanvas} from '@ambreia/common/platform/Platform';
import {GraphicAssetCollection} from '@ambreia/common/graphics/GraphicAssetCollection';
import type {NitroAsset} from '@ambreia/common/assets/NitroAsset';
import {extractCanvas} from '../renderer/TextureExtractor';
import {RoomVisualizationData} from './object/visualization/room/RoomVisualizationData';
import type {IAssetRoomVisualizationData} from './object/visualization/room/rasterizer/basic/PlaneRasterizerTypes';

const log = Logger.getLogger('iso.scene.RoomVisualizationDataBuilder');

/** The content type of the room bundle (HabboRoomContent.nitro). */
const ROOM_CONTENT = 'room';

/**
 * The floor, wall and landscape materials of the room bundle, as the room planes read them:
 * RoomEngine.onRoomContentReady() without the engine. Each texture is cut out of its sheet onto a
 * canvas of the platform (a browser canvas, @napi-rs/canvas in Node); one the host cannot blit is
 * read back through its renderer (extractCanvas), or skipped.
 */
export function buildRoomVisualizationData(asset: NitroAsset | null): RoomVisualizationData | null
{
    const json = (asset?.jsonData ?? null) as Record<string, unknown> | null;
    const visualization = (json?.roomVisualization ?? null) as IAssetRoomVisualizationData | null;

    if(!asset || !json || !visualization)
    {
        log.warn('The room bundle has no roomVisualization: floors and walls render untextured');

        return null;
    }

    const data = new RoomVisualizationData();

    data.initialize(visualization);

    const canvases = new Map<string, HTMLCanvasElement>();
    const prefix = `${ROOM_CONTENT}_`;

    for(const [name, texture] of asset.textures)
    {
        const canvas = textureToCanvas(texture);

        if(canvas === null) continue;

        canvases.set(name, canvas);

        if(name.startsWith(prefix)) canvases.set(name.slice(prefix.length), canvas);
    }

    const masks = new GraphicAssetCollection();

    masks.defineFromSpritesheet(asset.textures, json.assets ?? null, ROOM_CONTENT);
    data.initializeAssetCollection(canvases, masks);

    return data;
}

/**
 * A sheet frame on a canvas of its own, at its untrimmed size with the frame at its trim offset
 * (the J2 fix for trimmed Nitro parts). Rotated frames go through the renderer.
 */
function textureToCanvas(texture: Texture): HTMLCanvasElement | null
{
    const frame = texture.frame;
    const resource = (texture.source as unknown as {resource?: unknown} | null)?.resource;

    if(frame.width < 1 || frame.height < 1) return null;

    if(!resource || (texture.rotate ?? 0) !== 0) return extractCanvas(texture);

    const trim = texture.trim ?? {x: 0, y: 0};
    const orig = texture.orig ?? {width: frame.width, height: frame.height};
    const canvas = createOffscreenCanvas(Math.ceil(orig.width), Math.ceil(orig.height));
    const context = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;

    if(!context) return extractCanvas(texture);

    context.imageSmoothingEnabled = false;

    try
    {
        context.drawImage(resource as CanvasImageSource, frame.x, frame.y, frame.width, frame.height, trim.x, trim.y, frame.width, frame.height);
    }
    catch
    {
        return extractCanvas(texture);
    }

    return canvas as unknown as HTMLCanvasElement;
}
