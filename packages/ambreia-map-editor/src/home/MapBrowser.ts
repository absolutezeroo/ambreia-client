import type {ISelectableWindow} from '@ambreia/ui/components/ISelectableWindow';
import type {ITabContextWindow} from '@ambreia/ui/components/ITabContextWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WindowManager} from '@ambreia/ui/kit/WindowManager';
import type {EditorApiClient} from '@ambreia/map-editor-core/api/EditorApiClient';
import type {IZoneSummary} from '@ambreia/map-editor-core/api/IZoneSummary';
import {describe} from '../panels/html';
import {child, setText, setVisible} from '../ui/bind';
import type {EditorTexts} from '../ui/EditorTexts';
import {BROWSER_TABS, type BrowserAction, type BrowserTab} from './BROWSER_TABS';
import {BrowserTabUi, type IBrowserHost} from './BrowserTabUi';
import type {HomeScreen} from './HomeScreen';
import {ZoneMarks} from './ZoneMarks';

const SYNC_OK = 0xff4cc040;
const SYNC_FAILED = 0xffd04030;

/**
 * "Choix de zone / cartes" (vortex_map_editor_browser_xml) in the home screen's slot: the five
 * tabs over the server's zone list, the status bar and the sync state. pick() resolves with the
 * zone to open — chosen, or just created.
 */
export class MapBrowser implements IBrowserHost
{
    readonly marks = new ZoneMarks();

    private readonly _window: IWindowContainer;
    private readonly _content: IWindowContainer | null;
    private readonly _tabs = new Map<BrowserTab, BrowserTabUi>();
    private _tab: BrowserTab = 'zones';
    private _zones: IZoneSummary[] = [];
    private _notice = '';
    private _resolve: ((zone: IZoneSummary) => void) | null = null;

    constructor(private readonly _manager: WindowManager, private readonly _home: HomeScreen, private readonly _api: EditorApiClient, private readonly _texts: EditorTexts)
    {
        const window = _manager.buildWidgetLayout('vortex_map_editor_browser_xml') as IWindowContainer | null;

        if(!window) throw new Error('vortex_map_editor_browser_xml is not registered');

        this._window = window;
        this._content = child<IWindowContainer>(window, 'tab_content');
        // The browser is the editor's home: nothing to close to.
        setVisible(window, 'header_button_close', false);

        for(const tab of Object.keys(BROWSER_TABS) as BrowserTab[])
        {
            child(window, BROWSER_TABS[tab].button)?.addEventListener('WE_SELECTED', () => this.showTab(tab));
        }

        // Selecting through the context's selector is what paints the tab button as active.
        const first = child(window, BROWSER_TABS.zones.button);

        child<ITabContextWindow>(window, 'tab_context')?.selector?.setSelected(first as unknown as ISelectableWindow);
        this.showTab('zones');
    }

    get zones(): readonly IZoneSummary[]
    {
        return this._zones;
    }

    /** Shows the browser until a zone is chosen; notice says why it came back (a load that failed…). */
    async pick(notice = ''): Promise<IZoneSummary>
    {
        this._home.mount(this._window);
        this._window.enable();
        await this.reload();
        this.notice(notice);

        return new Promise(resolve => this._resolve = resolve);
    }

    /** A message in the status bar until the next action ('' gives the tab's count back). */
    notice(text: string): void
    {
        this._notice = text;
        this.render();
    }

    act(action: BrowserAction, zone: IZoneSummary | null): void
    {
        switch(action)
        {
            case 'refresh': void this.reload(); break;
            case 'create_zone':
            case 'create_map': void this.create(null); break;
            case 'use_template': if(zone) void this.create(zone); break;
            case 'edit': if(zone) this.open(zone); break;
            case 'unfavorite':
                if(zone) this.marks.toggleFavorite(zone.key);
                this.changed();
                break;
            case 'forget':
                if(zone) this.marks.forget(zone.key);
                this.changed();
                break;
        }
    }

    changed(): void
    {
        this._notice = '';
        this.render();
    }

    dispose(): void
    {
        for(const tab of this._tabs.values()) tab.window.destroy();
        this._window.destroy();
    }

    private showTab(tab: BrowserTab): void
    {
        const content = this._content;
        let ui = this._tabs.get(tab);

        if(!content) return;
        if(!ui)
        {
            ui = new BrowserTabUi(tab, this, this._texts, layout => this._manager.buildWidgetLayout(layout));
            this._tabs.set(tab, ui);
        }

        const previous = this._tabs.get(this._tab);

        if(previous && previous !== ui) content.removeChild(previous.window);
        content.addChild(ui.window);
        this._tab = tab;
        this.changed();
    }

    private render(): void
    {
        const tab = this._tabs.get(this._tab);

        tab?.render();
        // The rows have a status_txt too: the status bar's is looked up in the bar.
        const bar = child(this._window, 'status_bar');

        if(bar) setText(bar, 'status_txt', this._notice || (tab?.summary ?? ''));
    }

    private async reload(): Promise<void>
    {
        const window = this._window;

        try
        {
            this._zones = await this._api.listZones();
            this._notice = '';
            setText(window, 'sync_txt', this._texts.get('vortex.mapeditor.browser.sync.ok', {date: new Date().toLocaleString('fr-FR')}));
            Object.assign(child(window, 'sync_dot') ?? {}, {color: SYNC_OK});
        }
        catch (error)
        {
            this._notice = describe(error);
            setText(window, 'sync_txt', this._texts.get('vortex.mapeditor.browser.sync.failed'));
            Object.assign(child(window, 'sync_dot') ?? {}, {color: SYNC_FAILED});
        }
        this.render();
    }

    /** A new zone, blank or a copy of template (a published zone); then it opens. */
    private async create(template: IZoneSummary | null): Promise<void>
    {
        const key = window.prompt(template ? `Nouvelle zone depuis « ${template.name} » : clé (a-z, 0-9, _)` : 'Clé de la nouvelle zone (a-z, 0-9, _) :')?.trim();

        if(!key) return;

        const name = window.prompt('Nom affiché :', template?.name ?? '')?.trim();

        if(!name) return;

        try
        {
            const zone = await this._api.createZone(key, name, template?.key);

            this.marks.created(zone.key);
            this.open(zone);
        }
        catch (error)
        {
            const code = (error as {code?: string}).code;

            this.notice(code === 'editor.zone_exists' ? 'Cette clé existe déjà.' : code === 'editor.zone_key_invalid' ? 'Clé invalide : minuscules, chiffres et _.' : describe(error));
        }
    }

    private open(zone: IZoneSummary): void
    {
        if(!this._resolve) return;

        this.marks.opened(zone.key);
        this._window.disable();
        this.notice(`Ouverture de ${zone.name}…`);
        this._resolve(zone);
        this._resolve = null;
    }
}
