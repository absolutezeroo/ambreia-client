/**
 * What the engine packages ask of their host: the browser by default, Node in tools (spec §3 rule 1).
 * `fetch` is not here: Node has it natively since 18.
 */
export interface ICanvas2D
{
    width: number;
    height: number;
    getContext(type: '2d', settings?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
}

export interface IPlatform
{
    createCanvas(width: number, height: number): ICanvas2D;
    decodeImage(bytes: Uint8Array, mimeType: string): Promise<CanvasImageSource>;
    parseXml(text: string): Document;
}

export const BROWSER_PLATFORM: IPlatform = {
    createCanvas: (width, height) => typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(width, height)
        : Object.assign(document.createElement('canvas'), {width, height}),
    decodeImage: (bytes, mimeType) => createImageBitmap(new Blob([bytes as Uint8Array<ArrayBuffer>], {type: mimeType})),
    parseXml: text => new DOMParser().parseFromString(text, 'text/xml')
};

let current: IPlatform = BROWSER_PLATFORM;

/** The platform every engine package reads. Set it once, before the first load (a tool's first line). */
export function platform(): IPlatform
{
    return current;
}

export function setPlatform(value: IPlatform): void
{
    current = value;
}

/**
 * A platform canvas typed as the OffscreenCanvas the compositing code was written against. Node's
 * canvas implements the members that code uses (getContext('2d'), width, height, drawImage source).
 */
export function createOffscreenCanvas(width: number, height: number): OffscreenCanvas
{
    return current.createCanvas(width, height) as unknown as OffscreenCanvas;
}
