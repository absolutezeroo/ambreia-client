import {EditorSelection} from '@ambreia/map-editor-core/selection/EditorSelection';
import type {EditorApp} from '../app/EditorApp';
import {esc} from './html';

/** The checks the panel always lists, green when no finding carries their code. */
const CHECKS: readonly [string, string][] = [
    ['DoorNotWalkable', 'La porte est sur une case marchable'],
    ['OutOfFloor', 'Aucun élément hors limites'],
    ['DuplicateId', 'Aucun identifiant en double'],
    ['UnknownFurniture', 'Tous les mobis existent'],
    ['BadRotation', 'Toutes les rotations sont permises'],
    ['Unreachable', 'Tout est accessible depuis la porte'],
    ['BrokenReference', 'Aucune référence cassée']
];

/** "Validation de la map" (mock-up 4): errors, warnings, and the checks that pass. */
export class ValidationPanel
{
    constructor(readonly element: HTMLElement, private readonly _app: EditorApp)
    {
        element.addEventListener('click', e =>
        {
            const target = e.target as HTMLElement;

            if(target.closest('.verify')) void _app.verify();

            const id = target.closest<HTMLElement>('[data-element]')?.dataset.element;
            const o = _app.doc.decor?.find(d => d.id === id);

            if(o)
            {
                _app.view.centerOn(o.x, o.y);
                _app.select(EditorSelection.of(o.id));
            }
        });
    }

    render(): void
    {
        const local = this._app.localFindings;
        const findings = [
            ...local,
            ...this._app.serverFindings.filter(s => !local.some(l => l.code === s.code && l.elementId === s.elementId))
        ];
        const codes = new Set(findings.map(f => f.code));

        this.element.innerHTML = `
            <h2 class="panel-title">Validation de la map <button class="verify">Vérifier la map</button></h2>
            <ul class="checks">
                ${findings.map(f => `
                    <li class="${f.severity === 'Error' ? 'error' : 'warning'}" ${f.elementId ? `data-element="${esc(f.elementId)}"` : ''}>
                        <span class="icon">${f.severity === 'Error' ? '⛔' : '⚠️'}</span><span>${esc(f.message)}</span><code>${esc(f.code)}</code>
                    </li>`).join('')}
                ${CHECKS.filter(([code]) => !codes.has(code)).map(([, label]) => `
                    <li class="ok"><span class="icon">✅</span><span>${label}</span></li>`).join('')}
            </ul>
            <p class="pad muted">Les vérifications locales suivent chaque modification ; « Vérifier la map » ajoute celles du serveur (accessibilité, références entre zones).</p>`;
    }
}
