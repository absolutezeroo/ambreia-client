// The Node side of @ambreia/common's platform: what the browser gives the engine, from
// @napi-rs/canvas and linkedom. A tool calls setPlatform(nodePlatform()) once, before the first load.
// fetch is not part of it: Node has it natively.
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { DOMParser } from 'linkedom';

export function nodePlatform()
{
    return {
        createCanvas: (width, height) => createCanvas(Math.max(1, width), Math.max(1, height)),
        decodeImage: bytes => loadImage(Buffer.from(bytes)),
        parseXml: text => new DOMParser().parseFromString(text, 'text/xml')
    };
}
