import type {Category} from '../app/Category';
import type {EditorApp} from '../app/EditorApp';
import {CatalogPanel} from './CatalogPanel';
import {FloorPanel} from './FloorPanel';
import {SettingsForm} from './SettingsForm';
import {ValidationPanel} from './ValidationPanel';

/** The column next to the rail: the panel of the chosen category, kept alive between switches. */
export class SidePanel
{
    private readonly _panels = new Map<Category, {readonly element: HTMLElement; render(): void}>();
    private _shown: Category | null = null;

    constructor(private readonly _root: HTMLElement, private readonly _app: EditorApp)
    {
    }

    render(): void
    {
        const category = this._app.category;
        let panel = this._panels.get(category);

        if(!panel)
        {
            panel = this.create(category);
            this._panels.set(category, panel);
        }

        if(this._shown !== category)
        {
            this._root.replaceChildren(panel.element);
            this._shown = category;
        }

        panel.render();
    }

    private create(category: Category): {readonly element: HTMLElement; render(): void}
    {
        const element = document.createElement('div');

        element.className = 'side-content';

        switch(category)
        {
            case 'floor': return new FloorPanel(element, this._app);
            case 'decor': return new CatalogPanel(element, this._app);
            case 'settings': return new SettingsForm(element, this._app, 'Paramètres de la salle');
            case 'validation': return new ValidationPanel(element, this._app);
            default:
                element.innerHTML = '<h2 class="panel-title">Bientôt</h2><p class="pad muted">Ce calque arrive avec les calques RPG (lot B).</p>';

                return {element, render: () => undefined};
        }
    }
}
