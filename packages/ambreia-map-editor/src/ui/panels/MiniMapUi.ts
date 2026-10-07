import type {IDisplayObjectWrapper} from '@ambreia/ui/components/IDisplayObjectWrapper';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {EditorApp} from '../../app/EditorApp';
import {project, rhombus, tracePolygon} from '../../view/isoMath';

/**
 * The whole floor in miniature inside the owner's `minimap_slot`: tiles by height, mobis, the
 * door, the part the view shows; a press or drag on it moves the view there.
 */
export class MiniMapUi
{
    private readonly _canvas = document.createElement('canvas');
    private _map = {scale: 1, ox: 0, oy: 0};

    constructor(slot: IWindowContainer, build: (layout: string) => IWindow | null, private readonly _app: EditorApp)
    {
        const holder = build('vortex_map_editor_canvas_xml');
        const wrapper = ((holder as IWindowContainer | null)?.findChildByName('canvas_host') ?? holder) as IDisplayObjectWrapper | null;

        if(!wrapper) return;

        wrapper.x = 2;
        wrapper.y = 2;
        wrapper.width = slot.width - 4;
        wrapper.height = slot.height - 4;
        this._canvas.width = wrapper.width;
        this._canvas.height = wrapper.height;
        slot.addChildAt(wrapper, 0);
        wrapper.setDisplayObject(this._canvas);

        const jump = (e: unknown) =>
        {
            const {localX, localY} = e as {localX: number; localY: number};

            _app.view.centerOnWorld((localX - this._map.ox) / this._map.scale, (localY - this._map.oy) / this._map.scale);
        };

        wrapper.addEventListener('WME_DOWN', jump);
        wrapper.addEventListener('WME_MOVE', e => (e as unknown as {buttonDown: boolean}).buttonDown && jump(e));
    }

    draw(): void
    {
        const canvas = this._canvas;
        const ctx = canvas.getContext('2d')!;
        const doc = this._app.doc;
        const floor = doc.floor;
        const w = canvas.width;
        const h = canvas.height;
        const corners = [project(0, 0, 0), project(floor.width, 0, 0), project(0, floor.length, 0), project(floor.width, floor.length, 0)];
        const minX = Math.min(...corners.map(c => c[0]));
        const maxX = Math.max(...corners.map(c => c[0]));
        const minY = Math.min(...corners.map(c => c[1])) - 120;
        const maxY = Math.max(...corners.map(c => c[1]));
        const scale = Math.min(w / (maxX - minX + 20), h / (maxY - minY + 20));

        this._map = {scale, ox: w / 2 - (minX + maxX) / 2 * scale, oy: h / 2 - (minY + maxY) / 2 * scale};
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#0d1016';
        ctx.fillRect(0, 0, w, h);
        ctx.setTransform(scale, 0, 0, scale, this._map.ox, this._map.oy);

        floor.tiles.forEach((t, i) =>
        {
            if(t.hole) return;

            tracePolygon(ctx, rhombus(i % floor.width, Math.floor(i / floor.width), 1, 1, t.height ?? 0));
            ctx.fillStyle = t.walkable === false ? '#7a3b33' : `hsl(38, 25%, ${Math.max(35, 62 - (t.height ?? 0) * 3)}%)`;
            ctx.fill();
        });

        ctx.fillStyle = '#ffb74d';
        for(const o of doc.decor ?? [])
        {
            const [x, y] = project(o.x + 0.5, o.y + 0.5, o.z ?? 0);

            ctx.fillRect(x - 6, y - 6, 12, 12);
        }

        const [doorX, doorY] = project((floor.door.x ?? 0) + 0.5, (floor.door.y ?? 0) + 0.5, 0);

        ctx.fillStyle = '#ffd84a';
        ctx.beginPath();
        ctx.arc(doorX, doorY, 10, 0, Math.PI * 2);
        ctx.fill();

        const v = this._app.view.viewport;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / scale;
        ctx.strokeRect(v.x, v.y, v.width, v.height);
    }
}
