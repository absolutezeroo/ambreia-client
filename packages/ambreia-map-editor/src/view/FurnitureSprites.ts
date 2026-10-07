import type {IFurnitureSprite} from './IFurnitureSprite';

const IMAGING = '/habbo-imaging';
/** The imager loads a furni's assets on first use and can time out: a failure is retried a few times. */
const RETRIES = 3;
const RETRY_MS = 4000;

/**
 * Real furni images from vortex-imager (the client's own pipeline), one per class, direction and
 * state, fetched once. Until one arrives — or when the imager is not running — the view draws a box.
 */
export class FurnitureSprites
{
    /** Called each time an image arrives, so the view can redraw. */
    onLoad: () => void = () => undefined;

    private readonly _cache = new Map<string, IFurnitureSprite | 'loading' | 'missing'>();
    private readonly _failures = new Map<string, number>();

    get(className: string, direction: number, state: number): IFurnitureSprite | null
    {
        const key = `${className}|${direction}|${state}`;
        const entry = this._cache.get(key);

        if(entry === undefined)
        {
            this._cache.set(key, 'loading');
            void this.load(key, className, direction, state);
        }

        return typeof entry === 'object' ? entry : null;
    }

    /** The catalogue's small picture of a furni. */
    static thumbnail(className: string): string
    {
        return `${IMAGING}/furniture?class=${encodeURIComponent(className)}&size=s`;
    }

    /** The inspector's picture of a furni. */
    static picture(className: string, direction = 2, state = 0): string
    {
        return `${IMAGING}/furniture?class=${encodeURIComponent(className)}&direction=${direction}&state=${state}`;
    }

    private async load(key: string, className: string, direction: number, state: number): Promise<void>
    {
        const query = `class=${encodeURIComponent(className)}&direction=${direction}&state=${state}`;

        try
        {
            const [anchor, image] = await Promise.all([
                fetch(`${IMAGING}/furniture-anchor?${query}`).then(r => r.ok ? r.json() as Promise<{x: number; y: number}> : null),
                new Promise<HTMLImageElement>((resolve, reject) =>
                {
                    const img = new Image();

                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = `${IMAGING}/furniture?${query}`;
                })
            ]);

            if(!anchor) throw new Error('no anchor');

            const canvas = document.createElement('canvas');

            canvas.width = image.width;
            canvas.height = image.height;

            const ctx = canvas.getContext('2d', {willReadFrequently: true})!;

            ctx.drawImage(image, 0, 0);

            const data = ctx.getImageData(0, 0, image.width, image.height).data;
            const alpha = new Uint8ClampedArray(image.width * image.height);

            for(let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];

            this._cache.set(key, {image, anchorX: anchor.x, anchorY: anchor.y, alpha});
            this.onLoad();
        }
        catch
        {
            // No imager, a class it does not know, or assets still loading: the box stands in,
            // and a later draw asks again until the retries run out.
            const failures = (this._failures.get(key) ?? 0) + 1;

            this._failures.set(key, failures);
            this._cache.set(key, 'missing');
            if(failures < RETRIES) setTimeout(() => this._cache.delete(key), RETRY_MS);
        }
    }
}
