import type {LayerName} from '@ambreia/map-editor-core/layers/LayerName';
import {elementCells} from '@ambreia/map-editor-core/zone/elementCells';
import type {LayerKey} from '@ambreia/map-editor-core/zone/LayerKey';
import type {ZoneCell, ZoneDocument} from '@ambreia/map-editor-core/zone/Zone.generated';
import {tileAt} from '@ambreia/map-editor-core/zone/zoneGeometry';
import type {IViewModel} from './IViewModel';
import {HALF_H, project, rhombus, tracePolygon} from './isoMath';

type Rgb = readonly [number, number, number];

/** Which bottom-panel layer shows each world layer. */
const SHOWN_BY: Readonly<Record<LayerKey, LayerName>> = {
    entries: 'floor', passages: 'zones', zones: 'zones', npcs: 'npcs', spawns: 'spawns', bosses: 'spawns',
    events: 'spawns', resources: 'decor', chests: 'decor', interactives: 'decor', triggers: 'triggers'
};

const COLORS: Readonly<Record<LayerKey, Rgb>> = {
    entries: [76, 175, 80], passages: [164, 110, 232], zones: [242, 201, 76], npcs: [63, 127, 208], spawns: [232, 77, 77],
    bosses: [150, 30, 30], events: [240, 138, 36], resources: [38, 166, 154], chests: [214, 168, 40], interactives: [80, 200, 230],
    triggers: [164, 110, 232]
};

/**
 * An area's colour follows its kind (S§20.1): safe green, PvP red, hostile orange, restricted grey,
 * town blue, quest yellow, boss dark red.
 */
const AREA_COLORS: Readonly<Record<string, Rgb>> = {
    Safe: [76, 175, 80], PvP: [232, 77, 77], Town: [63, 127, 208], City: [63, 127, 208], Quest: [242, 201, 76],
    Boss: [150, 30, 30], Dungeon: [120, 80, 160], NoCombat: [120, 200, 120], Hostile: [230, 126, 34],
    Restricted: [110, 110, 120], NoMount: [160, 120, 80], Gathering: [140, 190, 60], Audio: [80, 190, 200],
    Event: [220, 100, 190]
};

const LAYERS: readonly LayerKey[] = ['zones', 'passages', 'events', 'bosses', 'spawns', 'entries', 'resources', 'chests', 'interactives', 'triggers', 'npcs'];

/**
 * The world layers over the floor: every element of every visible layer, the current
 * category's on top and the selected one outlined, plus the shape being drawn.
 */
export class WorldOverlayPainter
{
    constructor(private readonly _ctx: CanvasRenderingContext2D)
    {
    }

    draw(model: IViewModel, zoom: number): void
    {
        const world = model.world;
        const doc = model.doc;
        const order = world.layer ? [...LAYERS.filter(l => l !== world.layer), world.layer] : LAYERS;

        for(const layer of order)
        {
            if(!model.layers.isVisible(SHOWN_BY[layer])) continue;

            const active = layer === world.layer;

            for(const element of (doc[layer] ?? []) as {id: string; kind?: string; name?: string | null}[])
            {
                const selected = world.element?.layer === layer && world.element.id === element.id;
                const offset = selected ? world.dragOffset : null;
                const cells = this.cellsOf(layer, element, doc).map(c => ({x: (c.x ?? 0) + (offset?.dx ?? 0), y: (c.y ?? 0) + (offset?.dy ?? 0)}));
                const color = layer === 'zones' ? AREA_COLORS[element.kind ?? ''] ?? [160, 160, 160] : COLORS[layer];

                this.drawElement(layer, element, cells, color, active, selected, doc, zoom);
            }
        }

        for(const c of world.preview) this.cell(doc, c, [255, 255, 255], 0.35, 1, zoom);
        this.drawPolygon(doc, world.polygon, zoom);
    }

    private cellsOf(layer: LayerKey, element: object, doc: ZoneDocument): ZoneCell[]
    {
        if(layer !== 'triggers') return elementCells(element, doc);

        // A trigger shows where it listens: the area or the mobi it targets.
        const target = (element as {target?: string | null}).target;
        const area = doc.zones?.find(z => z.id === target);
        const decor = doc.decor?.find(d => d.id === target);

        return area ? elementCells(area, doc) : decor ? [{x: decor.x, y: decor.y}] : [];
    }

    private drawElement(
        layer: LayerKey, element: {id: string; name?: string | null}, cells: readonly ZoneCell[], color: Rgb,
        active: boolean, selected: boolean, doc: ZoneDocument, zoom: number
    ): void
    {
        if(!cells.length) return;

        const alpha = selected ? 0.55 : active ? 0.38 : 0.2;
        const marker = layer === 'npcs' || layer === 'entries' || layer === 'resources';

        if(marker) for(const c of cells) this.marker(doc, c, color, alpha + 0.3, selected, zoom);
        else for(const c of cells) this.cell(doc, c, color, alpha, selected ? 2.5 : active ? 1.2 : 0, zoom);

        if(!active && !selected) return;

        const label = element.name || element.id;
        const centre = cells.reduce<{x: number; y: number}>((acc, c) => ({x: acc.x + (c.x ?? 0) / cells.length, y: acc.y + (c.y ?? 0) / cells.length}), {x: 0, y: 0});
        const h = tileAt(doc.floor, Math.round(centre.x), Math.round(centre.y))?.height ?? 0;
        const [sx, sy] = project(centre.x + 0.5, centre.y + 0.5, h);

        this.label(label, sx, sy - (marker ? 34 : 0), zoom, selected);
    }

    private cell(doc: ZoneDocument, c: ZoneCell, [r, g, b]: Rgb, alpha: number, stroke: number, zoom: number): void
    {
        const ctx = this._ctx;
        const h = tileAt(doc.floor, c.x ?? 0, c.y ?? 0)?.height ?? 0;

        tracePolygon(ctx, rhombus(c.x ?? 0, c.y ?? 0, 1, 1, h));
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();
        if(stroke)
        {
            ctx.strokeStyle = stroke > 2 ? '#ffffff' : `rgb(${r}, ${g}, ${b})`;
            ctx.lineWidth = stroke / zoom;
            ctx.stroke();
        }
    }

    /** A standing marker (NPC, entry, resource): a coloured disc on the cell and a stem. */
    private marker(doc: ZoneDocument, c: ZoneCell, [r, g, b]: Rgb, alpha: number, selected: boolean, zoom: number): void
    {
        const ctx = this._ctx;
        const h = tileAt(doc.floor, c.x ?? 0, c.y ?? 0)?.height ?? 0;
        const [x, y] = project((c.x ?? 0) + 0.5, (c.y ?? 0) + 0.5, h);

        ctx.beginPath();
        ctx.ellipse(x, y, 18, 9, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, alpha)})`;
        ctx.fill();
        ctx.fillRect(x - 2, y - 30, 4, 30);
        ctx.beginPath();
        ctx.arc(x, y - 32, 7, 0, Math.PI * 2);
        ctx.fill();
        if(selected)
        {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5 / zoom;
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(x, y, 18, 9, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    private drawPolygon(doc: ZoneDocument, points: readonly ZoneCell[], zoom: number): void
    {
        if(!points.length) return;

        const ctx = this._ctx;
        const at = (c: ZoneCell) => project((c.x ?? 0) + 0.5, (c.y ?? 0) + 0.5, tileAt(doc.floor, c.x ?? 0, c.y ?? 0)?.height ?? 0);

        ctx.beginPath();
        points.forEach((p, i) =>
        {
            const [x, y] = at(p);

            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([6 / zoom, 4 / zoom]);
        ctx.stroke();
        ctx.setLineDash([]);
        for(const p of points)
        {
            const [x, y] = at(p);

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - 3 / zoom, y - 3 / zoom, 6 / zoom, 6 / zoom);
        }
    }

    private label(text: string, x: number, y: number, zoom: number, selected: boolean): void
    {
        const ctx = this._ctx;

        ctx.font = `${selected ? 'bold ' : ''}${Math.max(9, 12 / zoom)}px "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3 / zoom;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeText(text, x, y - HALF_H / 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, x, y - HALF_H / 2);
    }
}
