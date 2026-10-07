import {replaceFloor} from '@ambreia/map-editor-core/commands/replaceFloor';
import {FLOOR_TEMPLATES} from '@ambreia/map-editor-core/zone/FLOOR_TEMPLATES';
import type {ZoneFloor} from '@ambreia/map-editor-core/zone/Zone.generated';
import type {EditorApp} from '../app/EditorApp';
import {FLOOR_TOOLS} from '../app/FLOOR_TOOLS';
import type {ToolName} from '../app/ToolName';
import {rhombus, tracePolygon} from '../view/isoMath';
import {$} from './html';

/** "Outils de sol", "Hauteurs de sol" and "Modèles de salle" (mock-up 3). */
export class FloorPanel
{
    constructor(readonly element: HTMLElement, private readonly _app: EditorApp)
    {
        element.innerHTML = `
            <h2 class="panel-title">Outils de sol</h2>
            <div class="tool-list">${FLOOR_TOOLS.map(t => `
                <button data-tool="${t.tool}"><span class="icon">${t.icon}</span><span class="label">${t.label}</span><kbd>${t.key}</kbd></button>`).join('')}
            </div>
            <h2 class="panel-title">Hauteurs de sol</h2>
            <div class="heights">${Array.from({length: 8}, (_, h) => `
                <button data-height="${h}" title="Peindre à la hauteur ${h}"><canvas width="44" height="44"></canvas><span>${h}</span></button>`).join('')}
            </div>
            <label class="pad">Autre hauteur <input type="number" class="other-height" min="0" max="32" value="0"></label>
            <h2 class="panel-title">Modèles de salle</h2>
            <div class="templates">${FLOOR_TEMPLATES.map((t, i) => `
                <button data-template="${i}" title="Remplace tout le sol (annulable)"><canvas width="96" height="60"></canvas><span>${t.label}</span></button>`).join('')}
            </div>`;

        element.querySelectorAll<HTMLButtonElement>('[data-height]').forEach(b => drawBlock(b.querySelector('canvas')!, Number(b.dataset.height)));
        element.querySelectorAll<HTMLButtonElement>('[data-template]').forEach(b => drawFloor(b.querySelector('canvas')!, FLOOR_TEMPLATES[Number(b.dataset.template)].build()));

        element.addEventListener('click', e =>
        {
            const target = e.target as HTMLElement;
            const tool = target.closest<HTMLElement>('[data-tool]')?.dataset.tool;
            const height = target.closest<HTMLElement>('[data-height]')?.dataset.height;
            const template = target.closest<HTMLElement>('[data-template]')?.dataset.template;

            if(tool) _app.setTool(tool as ToolName);
            if(height !== undefined) _app.setPaintHeight(Number(height));
            if(template !== undefined)
            {
                const t = FLOOR_TEMPLATES[Number(template)];

                if(!window.confirm(`Remplacer le sol par « ${t.label} » ? (Annulable avec Ctrl+Z)`)) return;
                _app.execute(replaceFloor(t.label, t.build()));
                _app.log(`Modèle de salle « ${t.label} » appliqué.`);
                _app.view.fit();
                _app.refresh();
            }
        });
        $<HTMLInputElement>(element, '.other-height').addEventListener('change', e =>
            _app.setPaintHeight(Math.min(32, Math.max(0, Number((e.target as HTMLInputElement).value) || 0))));
    }

    render(): void
    {
        const app = this._app;

        this.element.querySelectorAll<HTMLElement>('[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === app.tool));
        this.element.querySelectorAll<HTMLElement>('[data-height]').forEach(b => b.classList.toggle('active', Number(b.dataset.height) === app.paintHeight));
        $<HTMLInputElement>(this.element, '.other-height').value = String(app.paintHeight);
    }
}

/** A tile raised to h, the picture of each height button. */
function drawBlock(canvas: HTMLCanvasElement, h: number): void
{
    const ctx = canvas.getContext('2d')!;
    const lift = Math.min(h, 7) * 3.2;

    ctx.translate(22, 30 - lift);
    ctx.scale(0.5, 0.5);
    tracePolygon(ctx, [-32, 16, 0, 32, 0, 32 + lift * 2, -32, 16 + lift * 2]);
    ctx.fillStyle = '#9c8a68';
    ctx.fill();
    tracePolygon(ctx, [0, 32, 32, 16, 32, 16 + lift * 2, 0, 32 + lift * 2]);
    ctx.fillStyle = '#7c6c50';
    ctx.fill();
    tracePolygon(ctx, [0, 0, 32, 16, 0, 32, -32, 16]);
    ctx.fillStyle = '#d9cfb8';
    ctx.fill();
    ctx.strokeStyle = '#6b5d44';
    ctx.stroke();
}

/** A template's floor from above, the picture of each template button. */
function drawFloor(canvas: HTMLCanvasElement, floor: ZoneFloor): void
{
    const ctx = canvas.getContext('2d')!;
    const span = floor.width + floor.length;
    const scale = Math.min(canvas.width / (span * 32), canvas.height / (span * 16 + 24));

    ctx.translate(canvas.width / 2 - (floor.width - floor.length) * 16 * scale, 14);
    ctx.scale(scale, scale);
    floor.tiles.forEach((t, i) =>
    {
        if(t.hole) return;

        tracePolygon(ctx, rhombus(i % floor.width, Math.floor(i / floor.width), 1, 1, t.height ?? 0));
        ctx.fillStyle = `hsl(38, 30%, ${Math.max(45, 78 - (t.height ?? 0) * 8)}%)`;
        ctx.fill();
    });
}
