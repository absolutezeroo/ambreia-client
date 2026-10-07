import {Logger} from '@ambreia/common/utils/Logger';
import type {BCFloorPlanEditor} from './BCFloorPlanEditor';
import type {FloorPlanCache, IPlanPoint} from './FloorPlanCache';

const log = Logger.getLogger('habbo.window.utils.floorplaneditor.FloorPlanPreviewer');

/**
 * FloorPlanPreviewer — the small isometric render of the plan being edited.
 *
 * Seventeen sprites: sixteen for the sixteen ways a tile's four corners can be raised, plus the
 * door. Which one a tile gets is a **4-bit mask of where its neighbours are exactly one level
 * higher** — bit 0 for the north corner, 1 east, 2 west, 3 south, each set when any of the three
 * neighbours touching that corner sits at `height + 1`. A tile surrounded on all four (mask 15)
 * falls back to 0: it is fully enclosed, so none of its edges is visible.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/floorplaneditor/FloorPlanPreviewer.as
 */
export class FloorPlanPreviewer
{
    /**
     * The tile sprites in AS3's own push order — `0`-`9` then `a`-`f`, with the door last, so the
     * index is the corner mask and `length - 1` is the door.
     */
    // AS3: FloorPlanPreviewer.as::tile_preview_0 … tile_preview_f, tile_preview_entry
    private static readonly TILE_ASSETS: string[] = [
        'tile_preview_0', 'tile_preview_1', 'tile_preview_2', 'tile_preview_3',
        'tile_preview_4', 'tile_preview_5', 'tile_preview_6', 'tile_preview_7',
        'tile_preview_8', 'tile_preview_9', 'tile_preview_a', 'tile_preview_b',
        'tile_preview_c', 'tile_preview_d', 'tile_preview_e', 'tile_preview_f',
        'tile_preview_entry',
    ];

    /** AS3's `BitmapData` constructor throws above this; the preview is clamped to it instead. */
    // AS3: FloorPlanPreviewer.as::updatePreview() (the literal 4095)
    private static readonly MAX_DIMENSION: number = 4095;

    // AS3: FloorPlanPreviewer.as::_bcFloorPlanEditor
    private _bcFloorPlanEditor: BCFloorPlanEditor;

    // AS3: FloorPlanPreviewer.as::_tileImages
    private _tileImages: (ImageBitmap | null)[] = [];

    // AS3: FloorPlanPreviewer.as::_floorPlan
    private _floorPlan: FloorPlanCache;

    // AS3: FloorPlanPreviewer.as::FloorPlanPreviewer()
    constructor(bcFloorPlanEditor: BCFloorPlanEditor)
    {
        this._bcFloorPlanEditor = bcFloorPlanEditor;
        this._floorPlan = bcFloorPlanEditor.floorPlanCache;

        // AS3 instantiates seventeen [Embed]ed classes and has them all before it draws. This port
        // has to ask for each — see `BCFloorPlanEditor.requestEmbeddedAsset()`, and the blank panel
        // that reading the synchronous cache instead produced.
        this._tileImages = FloorPlanPreviewer.TILE_ASSETS.map(() => null);

        FloorPlanPreviewer.TILE_ASSETS.forEach((name, index) =>
        {
            bcFloorPlanEditor.requestEmbeddedAsset(name, (bitmap) =>
            {
                this._tileImages[index] = bitmap;

                this.updatePreview();
            });
        });
    }

    /**
     * AS3: FloorPlanPreviewer.as::getCanvasPoint()
     *
     * The isometric projection, with height lifting the tile 8px per level.
     */
    // AS3: FloorPlanPreviewer.as::getCanvasPoint()
    private static getCanvasPoint(x: number, y: number, height: number): IPlanPoint
    {
        return {x: 8 * (x - y), y: 4 * (x + y) - 8 * height};
    }

    // AS3: FloorPlanPreviewer.as::updatePreview()
    updatePreview(): void
    {
        const placements: {point: IPlanPoint; type: number}[] = [];

        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;

        for(let y = 0; y < this._floorPlan.floorHeight; y++)
        {
            for(let x = 0; x < this._floorPlan.floorWidth; x++)
            {
                const height = this._floorPlan.getHeightAt(x, y);

                if(height < 0) continue;

                const point = FloorPlanPreviewer.getCanvasPoint(x, y, height);

                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);

                const above = height + 1;
                const nw = this._floorPlan.getHeightAt(x - 1, y - 1);
                const n = this._floorPlan.getHeightAt(x, y - 1);
                const ne = this._floorPlan.getHeightAt(x + 1, y - 1);
                const w = this._floorPlan.getHeightAt(x - 1, y);
                const e = this._floorPlan.getHeightAt(x + 1, y);
                const sw = this._floorPlan.getHeightAt(x - 1, y + 1);
                const s = this._floorPlan.getHeightAt(x, y + 1);
                const se = this._floorPlan.getHeightAt(x + 1, y + 1);

                let type = (nw === above || n === above || w === above ? 1 : 0)
                    | (ne === above || n === above || e === above ? 2 : 0)
                    | (sw === above || s === above || w === above ? 4 : 0)
                    | (se === above || s === above || e === above ? 8 : 0);

                // Raised on every side: nothing of this tile's edges shows, so it draws flat.
                if(type === 15) type = 0;

                if(this._floorPlan.isEntryPoint(x, y)) type = this._tileImages.length - 1;

                placements.push({point, type});
            }
        }

        if(placements.length === 0) return;

        const width = Math.min(maxX - minX + 18, FloorPlanPreviewer.MAX_DIMENSION);
        const height = Math.min(maxY - minY + 18, FloorPlanPreviewer.MAX_DIMENSION);
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext('2d');

        if(context === null)
        {
            log.warn('no 2d context for the floor plan preview');

            return;
        }

        // AS3 constructs the BitmapData opaque and white (0xFFFFFFFF); a canvas starts transparent,
        // so the fill is explicit.
        context.imageSmoothingEnabled = false;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);

        // A tile still on its way is skipped, not waited for: `requestEmbeddedAsset()` redraws the
        // whole preview as each one lands, so the first open paints in over a frame or two. It
        // warns by name for a tile that can never arrive, which is why nothing is said here.
        for(const placement of placements)
        {
            const image = this._tileImages[placement.type];

            if(image === null) continue;

            context.drawImage(image, placement.point.x - minX, placement.point.y - minY);
        }

        this._bcFloorPlanEditor.updatePreviewBitmap(canvas.transferToImageBitmap());
    }
}
