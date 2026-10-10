import {Logger} from '@ambreia/common/utils/Logger';
import type {WindowManager} from '@ambreia/ui/kit/WindowManager';
import type {EditorApiClient} from '@ambreia/map-editor-core/api/EditorApiClient';
import type {IZoneSummary} from '@ambreia/map-editor-core/api/IZoneSummary';
import {IsoBackdrop} from '../view/IsoBackdrop';
import {project, STEP} from '../view/isoMath';

/** The detail panel's preview (detail_preview) and a row's thumbnail (thumb), in pixels. */
const FULL = {width: 312, height: 170};
const THUMB = {width: 96, height: 60};
/** The walls' height above the floor, as the editor's view frames a room (IsoView.fit). */
const WALL_HEIGHT = 3.6 * STEP;
const BACKGROUND = '#10131a';

const log = Logger.getLogger('map-editor.ZonePreviews');

export interface IZonePreview
{
    /** Asset names registered with the window manager, for a static_bitmap's assetUri. */
    readonly full: string;
    readonly thumb: string;
}

/**
 * Zone previews for the browser, drawn as the game draws the room: the newest document through
 * the editor's own @ambreia/iso stage (IsoBackdrop), one zone at a time, kept per version. That
 * stage is the editor's too: pause() before a zone opens, resume() back in the browser.
 */
export class ZonePreviews
{
    private readonly _done = new Map<string, IZonePreview | null>();
    private _queue: Promise<void> = Promise.resolve();
    private _paused = false;

    constructor(private readonly _api: EditorApiClient, private readonly _manager: WindowManager, private readonly _ready: () => void)
    {
    }

    /** The zone's preview, or null while it renders, for a zone never saved, or when it cannot draw. Asks once per version. */
    get(zone: IZoneSummary): IZonePreview | null
    {
        const id = `zone-preview/${zone.key}@${zone.latestVersion}`;

        if(this._done.has(id)) return this._done.get(id) ?? null;

        this._done.set(id, null);
        if(zone.latestVersion > 0)
        {
            this._queue = this._queue.then(() => this.render(zone, id)).catch((error: unknown) =>
            {
                // The row keeps its empty thumb: say why, once per version.
                log.warn(`no preview for ${zone.key}`, error);
            });
        }

        return null;
    }

    pause(): void
    {
        this._paused = true;
    }

    resume(): void
    {
        this._paused = false;
    }

    private async render(zone: IZoneSummary, id: string): Promise<void>
    {
        // A render cut short is forgotten: the next get() back in the browser asks again.
        if(this._paused) return this.forget(id);

        const backdrop = await IsoBackdrop.shared();
        const doc = backdrop && await this._api.latestDocument(zone.key);

        // Checked again after each wait: an opening zone owns the stage from then on.
        if(!backdrop || !doc || this._paused) return this.forget(id);

        // The last editor's view still listens to the stage: nothing to redraw now.
        backdrop.onChange = () => undefined;
        backdrop.setDocument(doc);
        await backdrop.settled();

        if(this._paused) return this.forget(id);

        const {width, length} = doc.floor;
        const [cx, cy] = project(width / 2, length / 2, 0);
        const span = width + length;
        const zoom = Math.min(1, FULL.width / (span * 34), FULL.height / (span * 18 + WALL_HEIGHT));
        const draw = () => backdrop.render(FULL.width, FULL.height, zoom, FULL.width / 2 - cx * zoom, FULL.height / 2 - (cy - WALL_HEIGHT / 3) * zoom);

        // The first frame builds the furni's sprites, the next one draws them.
        draw();
        await new Promise(resolve => setTimeout(resolve, 50));

        const room = draw();

        if(!room || this._paused) return this.forget(id);

        const full = await createImageBitmap(room);
        const thumb = await createImageBitmap(contain(room, THUMB));
        const preview = {full: `${id}/full`, thumb: `${id}/thumb`};

        this._manager.registerAsset(preview.full, full);
        this._manager.registerAsset(preview.thumb, thumb);
        this._done.set(id, preview);
        this._ready();
    }

    private forget(id: string): void
    {
        this._done.delete(id);
    }
}

/** source scaled down into size, centred on the view's background. */
function contain(source: HTMLCanvasElement, size: {width: number; height: number}): OffscreenCanvas
{
    const out = new OffscreenCanvas(size.width, size.height);
    const ctx = out.getContext('2d')!;
    const scale = Math.min(size.width / source.width, size.height / source.height);
    const w = source.width * scale;
    const h = source.height * scale;

    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, size.width, size.height);
    ctx.drawImage(source, (size.width - w) / 2, (size.height - h) / 2, w, h);

    return out;
}
