import type {LayerName} from '@ambreia/map-editor-core/layers/LayerName';
import {LayerState} from '@ambreia/map-editor-core/layers/LayerState';
import type {EditorApp} from '../app/EditorApp';
import {project, rhombus, tracePolygon} from '../view/isoMath';
import {$, esc} from './html';

const LAYERS: Record<LayerName, {readonly label: string; readonly color: string}> = {
    floor: {label: 'Sol', color: '#4caf50'},
    door: {label: 'Porte et spawns', color: '#e84d4d'},
    decor: {label: 'Mobis', color: '#f08a24'},
    wallDecor: {label: 'Mobis muraux', color: '#a46ee8'}
};

/** The bottom strip of the mock-ups: Mini-carte, Calques, Informations, Journal / Historique. */
export class BottomPanels
{
    private readonly _mini: HTMLCanvasElement;
    private _tab: 'journal' | 'history' = 'journal';
    /** World pixels → mini-map pixels, from the last draw. */
    private _map = {scale: 1, ox: 0, oy: 0};

    constructor(private readonly _root: HTMLElement, private readonly _app: EditorApp)
    {
        _root.innerHTML = `
            <section class="minimap"><h2 class="panel-title">Mini-carte</h2><div class="mini-wrap"><canvas></canvas></div></section>
            <section><h2 class="panel-title">Calques</h2><div class="layers"></div></section>
            <section><h2 class="panel-title">Informations</h2><dl class="info"></dl></section>
            <section>
                <h2 class="panel-title tabs-title"><button data-tab="journal">Journal d'activités</button><button data-tab="history">Historique</button></h2>
                <ol class="journal"></ol>
            </section>`;

        this._mini = $<HTMLCanvasElement>(_root, '.minimap canvas');

        const jump = (e: PointerEvent) =>
        {
            if(!(e.buttons & 1)) return;

            const r = this._mini.getBoundingClientRect();

            _app.view.centerOnWorld((e.clientX - r.left - this._map.ox) / this._map.scale, (e.clientY - r.top - this._map.oy) / this._map.scale);
        };

        this._mini.addEventListener('pointerdown', e =>
        {
            this._mini.setPointerCapture(e.pointerId);
            jump(e);
        });
        this._mini.addEventListener('pointermove', jump);
        new ResizeObserver(() => this.renderMiniMap()).observe($(_root, '.mini-wrap'));

        $(_root, '.layers').addEventListener('change', e =>
        {
            const input = e.target as HTMLInputElement;
            const layer = input.dataset.layer as LayerName;

            if(input.dataset.kind === 'visible') _app.layers.setVisible(layer, input.checked);
            else _app.layers.setLocked(layer, input.checked);
            _app.refresh();
        });
        _root.addEventListener('click', e =>
        {
            const target = e.target as HTMLElement;
            const tab = target.closest<HTMLElement>('[data-tab]')?.dataset.tab;
            const steps = target.closest<HTMLElement>('[data-steps]')?.dataset.steps;

            if(tab)
            {
                this._tab = tab as 'journal' | 'history';
                this.render();
            }
            if(steps) _app.travel(Number(steps));
        });
    }

    render(): void
    {
        this.renderMiniMap();
        this.renderLayers();
        this.renderInfo();
        this.renderJournal();
    }

    renderMiniMap(): void
    {
        const canvas = this._mini;
        const wrap = canvas.parentElement!;
        const dpr = window.devicePixelRatio || 1;
        const doc = this._app.doc;
        const floor = doc.floor;

        canvas.width = Math.max(1, wrap.clientWidth * dpr);
        canvas.height = Math.max(1, wrap.clientHeight * dpr);
        canvas.style.width = `${wrap.clientWidth}px`;
        canvas.style.height = `${wrap.clientHeight}px`;

        const ctx = canvas.getContext('2d')!;
        const corners = [project(0, 0, 0), project(floor.width, 0, 0), project(0, floor.length, 0), project(floor.width, floor.length, 0)];
        const minX = Math.min(...corners.map(c => c[0]));
        const maxX = Math.max(...corners.map(c => c[0]));
        const minY = Math.min(...corners.map(c => c[1])) - 120;
        const maxY = Math.max(...corners.map(c => c[1]));
        const scale = Math.min(wrap.clientWidth / (maxX - minX + 20), wrap.clientHeight / (maxY - minY + 20));

        this._map = {scale, ox: wrap.clientWidth / 2 - (minX + maxX) / 2 * scale, oy: wrap.clientHeight / 2 - (minY + maxY) / 2 * scale};
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = '#0d1016';
        ctx.fillRect(0, 0, wrap.clientWidth, wrap.clientHeight);
        ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * this._map.ox, dpr * this._map.oy);

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

        const {x: dx = 0, y: dy = 0} = floor.door;
        const [doorX, doorY] = project(dx + 0.5, dy + 0.5, 0);

        ctx.fillStyle = '#ffd84a';
        ctx.beginPath();
        ctx.arc(doorX, doorY, 10, 0, Math.PI * 2);
        ctx.fill();

        const v = this._app.view.viewport;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / scale;
        ctx.strokeRect(v.x, v.y, v.width, v.height);
    }

    private renderLayers(): void
    {
        const layers = this._app.layers;

        $(this._root, '.layers').innerHTML = LayerState.NAMES.map(l => `
            <div class="layer ${layers.isVisible(l) ? '' : 'hidden-layer'}">
                <label title="Visible"><input type="checkbox" data-layer="${l}" data-kind="visible" ${layers.isVisible(l) ? 'checked' : ''}><span class="eye">👁</span></label>
                <span class="swatch" style="background:${LAYERS[l].color}"></span>
                <span class="name">${LAYERS[l].label}</span>
                <label title="Verrouillé"><input type="checkbox" data-layer="${l}" data-kind="locked" ${layers.isLocked(l) ? 'checked' : ''}><span>🔒</span></label>
            </div>`).join('');
    }

    private renderInfo(): void
    {
        const app = this._app;
        const doc = app.doc;
        const floor = doc.floor;
        const used = floor.tiles.filter(t => !t.hole);
        const max = used.reduce((m, t) => Math.max(m, t.height ?? 0), 0);
        const rows: [string, string | number][] = [
            ['Taille de la salle', `${floor.width} × ${floor.length} cases`],
            ['Cases', `${floor.tiles.length} (utilisées : ${used.length})`],
            ['Hauteur max', max],
            ['Mobis placés', (doc.decor ?? []).length],
            ['Mobis sélectionnés', app.selection.ids.size],
            ['Spawns joueur', (doc.entries ?? []).filter(e => e.kind === 'arrival').length],
            ['Zones', (doc.zones ?? []).length],
            ['Triggers', (doc.triggers ?? []).length],
            ['Position', app.hover ? `X : ${app.hover.x} · Y : ${app.hover.y}` : '—']
        ];

        $(this._root, '.info').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
    }

    private renderJournal(): void
    {
        const app = this._app;
        const list = $(this._root, '.journal');

        this._root.querySelectorAll<HTMLElement>('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === this._tab));

        if(this._tab === 'journal')
        {
            list.innerHTML = app.journal.map(e => `
                <li class="${e.level}"><span class="time">${e.time}</span>${esc(e.text)}</li>`).join('') || '<li class="muted">Rien encore.</li>';

            return;
        }

        const done = app.history.done;
        const undone = app.history.undone;

        list.innerHTML = [
            ...undone.map((label, i) => ({label, steps: i + 1, cls: 'undone'})).reverse(),
            ...done.map((label, i) => ({label, steps: i + 1 - done.length, cls: i === done.length - 1 ? 'current' : ''})).reverse(),
            {label: 'Ouverture', steps: -done.length, cls: 'muted'}
        ].map(e => `<li class="clickable ${e.cls}" data-steps="${e.steps}">${esc(e.label)}</li>`).join('');
    }
}
