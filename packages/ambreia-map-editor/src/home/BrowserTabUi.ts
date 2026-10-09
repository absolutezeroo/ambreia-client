import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IZoneSummary} from '@ambreia/map-editor-core/api/IZoneSummary';
import {CheckBinding, child, children, ChoiceBinding, onClick, onWindowClick, SearchField, setEnabled, setImage, setText, setVisible} from '../ui/bind';
import type {EditorTexts} from '../ui/EditorTexts';
import {BROWSER_TABS, type BrowserAction, type BrowserTab} from './BROWSER_TABS';
import type {ZoneMarks} from './ZoneMarks';

const B = 'vortex.mapeditor.browser';
const DAY = 24 * 60 * 60 * 1000;
const SELECTED = 0xffffeeb0;
const STAR_ON = 0xfff0c030;
const STAR_OFF = 0xffc8c8c0;
const PUBLISHED = {pill: 0xffc8eab0, dot: 0xff4caa30, text: `${B}.status.published`};
const DRAFT = {pill: 0xfff6e3b0, dot: 0xfff0a020, text: `${B}.status.draft`};
const ACTION_GAP = 6;

const ACTIONS: Readonly<Record<BrowserAction, {text: string; icon: string}>> = {
    create_zone: {text: `${B}.action.create_zone`, icon: 'software_signs_maths_plus_addition_bonus_add_new_icon'},
    create_map: {text: `${B}.action.create_map`, icon: 'software_signs_maths_plus_addition_bonus_add_new_icon'},
    use_template: {text: `${B}.action.use_template`, icon: 'software_file_document_page_plus_add_new_icon'},
    edit: {text: `${B}.action.edit`, icon: 'map_markers_travel_map_folded_icon'},
    refresh: {text: `${B}.action.refresh`, icon: 'arrows_reload_refresh_rotate_clockwise_icon'},
    unfavorite: {text: `${B}.action.unfavorite`, icon: 'rpg_stat_mp_mana_star_icon'},
    forget: {text: `${B}.action.forget`, icon: 'arrows_recycle_triangle_trash_garbage_rubbish_reuse_icon'}
};

type Predicate = (zone: IZoneSummary, marks: ZoneMarks) => boolean;

const startOfDay = (): number => new Date().setHours(0, 0, 0, 0);
const openedSince = (from: () => number, to: () => number = () => Infinity): Predicate =>
    (z, marks) =>
    {
        const at = marks.openedAt(z.key);

        return at !== null && at >= from() && at < to();
    };
const draft: Predicate = z => z.publishedVersion === null;
const published: Predicate = z => z.publishedVersion !== null;

/**
 * The side panels' groups (category_row) the server's data can answer, by their caption's key.
 * The others (regions, themes, guilds…) need fields the zone list does not carry yet: shown disabled.
 */
const GROUPS: Readonly<Record<string, Predicate>> = {
    [`${B}.group.all_templates`]: () => true,
    [`${B}.group.all_projects`]: () => true,
    [`${B}.group.favorite_maps`]: () => true,
    [`${B}.group.drafts`]: draft,
    [`${B}.group.published`]: published,
    'vortex.market.history.today': openedSince(startOfDay),
    [`${B}.group.yesterday`]: openedSince(() => startOfDay() - DAY, startOfDay),
    [`${B}.group.this_week`]: openedSince(() => Date.now() - 7 * DAY),
    [`${B}.group.this_month`]: openedSince(() => Date.now() - 30 * DAY)
};

/** The filters (filter_row) the data can answer: a status unticked hides its zones. */
const STATUS_FILTERS: Readonly<Record<string, Predicate>> = {
    [`${B}.status.draft`]: draft,
    [`${B}.status.published`]: published
};
/** Ticked, these keep only the favourites. */
const FAVORITE_FILTERS = new Set([`${B}.filter.favorites_only`, 'vortex.mapeditor.decor.favourites']);

const keyOf = (window: IWindow | null): string => /^\$\{(.+)\}$/.exec(window?.caption ?? '')?.[1] ?? '';

const date = (ms: number): string => new Date(ms).toLocaleDateString('fr-FR');
const time = (ms: number): string => new Date(ms).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});

export interface IBrowserHost
{
    readonly zones: readonly IZoneSummary[];
    readonly marks: ZoneMarks;
    act(action: BrowserAction, zone: IZoneSummary | null): void;
    /** Something the tabs show changed (a favourite): every tab re-reads. */
    changed(): void;
}

/**
 * One tab of the zone browser: its body (vortex_map_editor_browser_body_xml) with the tab's side
 * panel, search, sort, the zone rows, the selected zone's details and the tab's actions. Built
 * once, kept while the browser lives: switching back finds it as it was left.
 */
export class BrowserTabUi
{
    readonly window: IWindowContainer;

    private readonly _list: IItemListWindow | null;
    private readonly _search: SearchField;
    private readonly _sort: ChoiceBinding<'name' | 'opened'>;
    private readonly _filters: {binding: CheckBinding; row: IWindow; count: (zones: IZoneSummary[]) => number}[] = [];
    private readonly _detailActions: {action: BrowserAction; button: IWindow | null}[] = [];
    private readonly _hidden = new Set<string>();
    private _sortValue: 'name' | 'opened';
    private _favoritesOnly = false;
    private _group: {key: string; row: IWindow; color: number} | null = null;
    private _groupRows: {key: string; row: IWindow; color: number}[] = [];
    private _rows: {key: string; window: IWindow; color: number}[] = [];
    private _shown = '';
    private _detailShown = '';
    private _selected: string | null = null;

    constructor(
        private readonly _tab: BrowserTab,
        private readonly _host: IBrowserHost,
        private readonly _texts: EditorTexts,
        private readonly _build: (layout: string) => IWindow | null
    )
    {
        const spec = BROWSER_TABS[_tab];
        const body = _build('vortex_map_editor_browser_body_xml') as IWindowContainer | null;

        if(!body) throw new Error('vortex_map_editor_browser_body_xml is not registered');

        this.window = body;
        this._list = child<IItemListWindow>(body, 'map_list');
        this._sortValue = _tab === 'recent' ? 'opened' : 'name';

        // The hint is the tab's: set before SearchField reads it as the hint.
        const input = child<ITextFieldWindow>(body, 'search_input');

        if(input) input.text = _texts.get(spec.search);
        this._search = new SearchField(body, 'search_input', () => this.render());
        this._sort = new ChoiceBinding<'name' | 'opened'>(body, 'sort_menu', () => this._sortValue, value =>
        {
            this._sortValue = value;
            this.render();
        }).options([['name', _texts.get(spec.column)], ['opened', _texts.get(`${B}.sort.opened`)]]);

        setText(body, 'col_name', _texts.get(spec.column));
        setText(body, 'col_date', _texts.get(`${B}.sort.opened`));
        setVisible(body, 'sort_icon', false);

        this.mountSide();
        this.placeActions(child<IWindowContainer>(body, 'toolbar_actions'), spec.toolbar, true);
        this.placeActions(child<IWindowContainer>(body, 'detail_actions'), spec.detail, false);
        onClick(body, 'detail_favorite', () => this.toggleFavorite(this._selected));
    }

    /** The zones the tab lists, filtered and sorted, as the rows show them. */
    get visible(): IZoneSummary[]
    {
        const {zones, marks} = this._host;
        const query = this._search.query.toLowerCase();
        const group = this._group ? GROUPS[this._group.key] : null;
        const hits = BROWSER_TABS[this._tab].zones(zones, marks).filter(z =>
            (!query || `${z.key} ${z.name}`.toLowerCase().includes(query))
            && (!group || group(z, marks))
            && (!this._favoritesOnly || marks.isFavorite(z.key))
            && ![...this._hidden].some(status => STATUS_FILTERS[status](z, marks)));

        if(this._sortValue === 'opened') return hits.sort((a, b) => (marks.openedAt(b.key) ?? 0) - (marks.openedAt(a.key) ?? 0));

        return this._tab === 'recent' && !query ? hits : hits.sort((a, b) => a.name.localeCompare(b.name));
    }

    get selected(): IZoneSummary | null
    {
        return this._host.zones.find(z => z.key === this._selected) ?? null;
    }

    /** The status bar's left text: count, and the group filtering the list. */
    get summary(): string
    {
        const count = this._texts.get(BROWSER_TABS[this._tab].count, {count: this.visible.length});
        const group = this._group ? this._texts.get(this._group.key) : null;

        return group ? `${count} | ${this._texts.get(`${B}.active_filter`, {filter: group})}` : count;
    }

    render(): void
    {
        const zones = this.visible;
        const marks = this._host.marks;

        this._sort.render();
        for(const filter of this._filters)
        {
            filter.binding.render();
            setText(filter.row, 'filter_count', `(${filter.count(BROWSER_TABS[this._tab].zones(this._host.zones, marks))})`);
        }
        for(const g of this._groupRows)
        {
            setText(g.row, 'category_count', `(${BROWSER_TABS[this._tab].zones(this._host.zones, marks).filter(z => GROUPS[g.key](z, marks)).length})`);

            const color = g === this._group ? SELECTED : g.color;

            if(g.row.color !== color) g.row.color = color;
        }

        this.fillRows(zones);
        this.fillDetail();
    }

    private fillRows(zones: IZoneSummary[]): void
    {
        const list = this._list;
        const marks = this._host.marks;
        const key = JSON.stringify(zones.map(z => [z, marks.isFavorite(z.key), marks.openedAt(z.key)]));

        if(list && key !== this._shown)
        {
            this._shown = key;
            this._rows = [];
            list.destroyListItems();

            for(const zone of zones)
            {
                const row = this._build('vortex_map_editor_browser_map_row_xml');

                if(!row) break;
                this.fillRow(row, zone);
                this._rows.push({key: zone.key, window: row, color: row.color});
            }

            // All at once: the list lays its rows out on populate, not on each add.
            list.populate(this._rows.map(r => r.window));
        }

        for(const row of this._rows)
        {
            const color = row.key === this._selected ? SELECTED : row.color;

            if(row.window.color !== color) row.window.color = color;
        }
    }

    private fillRow(row: IWindow, zone: IZoneSummary): void
    {
        const opened = this._host.marks.openedAt(zone.key);
        const status = zone.publishedVersion === null ? DRAFT : PUBLISHED;
        const star = child(row, 'favorite_icon');

        setText(row, 'map_name', zone.name);
        setText(row, 'map_desc', `${zone.key} · room ${zone.roomId}${zone.lockedByAccountId ? ' · verrouillée' : ''}`);
        // The zone list has no type, size nor author yet (server ZoneSummary): left blank.
        for(const name of ['type_icon', 'type_txt', 'admin_icon']) setVisible(row, name, false);
        for(const name of ['size_txt', 'cells_txt', 'author_name']) setText(row, name, '');
        setText(row, 'date_txt', opened === null ? '' : date(opened));
        setText(row, 'time_txt', opened === null ? '' : time(opened));
        setText(row, 'status_txt', this._texts.get(status.text));
        if(star) star.color = this._host.marks.isFavorite(zone.key) ? STAR_ON : STAR_OFF;
        Object.assign(child(row, 'status_pill') ?? {}, {color: status.pill});
        Object.assign(child(row, 'status_dot') ?? {}, {color: status.dot});

        onClick(row, 'favorite_button', () => this.toggleFavorite(zone.key));
        onWindowClick(row, () => this.select(zone.key));
        row.addEventListener('WME_DOUBLE_CLICK', () => this._host.act('edit', zone));
    }

    private fillDetail(): void
    {
        const body = this.window;
        const zone = this.selected;
        const list = child<IItemListWindow>(body, 'detail_list');
        const star = child(body, 'detail_favorite_icon');
        const opened = zone ? this._host.marks.openedAt(zone.key) : null;

        setText(body, 'detail_name', zone?.name ?? '');
        setVisible(body, 'detail_favorite', !!zone);
        if(star && zone) star.color = this._host.marks.isFavorite(zone.key) ? STAR_ON : STAR_OFF;
        for(const {action, button} of this._detailActions) setEnabled(button, !!zone && (action !== 'use_template' || zone.publishedVersion !== null));

        const rows: [string, string][] = zone ? [
            [`${B}.detail.map_id`, zone.key],
            [`${B}.detail.validation`, zone.publishedVersion === null
                ? `${this._texts.get(DRAFT.text)} (v${zone.latestVersion})`
                : `${this._texts.get(PUBLISHED.text)} v${zone.publishedVersion} · dernière v${zone.latestVersion}`],
            [`${B}.detail.source`, `Room ${zone.roomId}${zone.lockedByAccountId ? ` · verrouillée par le compte ${zone.lockedByAccountId}` : ''}`],
            [`${B}.detail.opened`, opened === null ? '-' : `${date(opened)} ${time(opened)}`]
        ] : [];
        const key = JSON.stringify(rows);

        if(!list || key === this._detailShown) return;

        this._detailShown = key;
        list.destroyListItems();
        list.populate(rows.map(([label, value]) =>
        {
            const row = this._build('vortex_map_editor_browser_detail_row_xml');

            if(row)
            {
                setText(row, 'detail_label', this._texts.get(label));
                setText(row, 'detail_value', value);
                setVisible(row, 'detail_icon', false);
            }

            return row;
        }).filter((r): r is IWindow => !!r));
    }

    /** The tab's side panel in side_slot, its groups and filters bound where the data allows. */
    private mountSide(): void
    {
        const slot = child<IWindowContainer>(this.window, 'side_slot');
        const side = this._build(`vortex_map_editor_browser_side_${this._tab}_xml`);

        if(!slot || !side) return;

        slot.addChild(side);

        for(const row of children(side, 'category_row'))
        {
            const key = keyOf(child(row, 'category_label'));

            setVisible(row, 'expand_icon', false);
            if(!GROUPS[key])
            {
                setEnabled(row, false);
                setText(row, 'category_count', '');
                continue;
            }

            const group = {key, row, color: row.color};

            this._groupRows.push(group);
            onWindowClick(row, () =>
            {
                this._group = this._group === group ? null : group;
                this.render();
            });
        }

        for(const row of children(side, 'filter_row'))
        {
            const key = keyOf(child(row, 'filter_label'));
            const status = STATUS_FILTERS[key];

            if(status)
            {
                const binding = new CheckBinding(row, 'filter_check', () => !this._hidden.has(key), checked =>
                {
                    if(checked) this._hidden.delete(key);
                    else this._hidden.add(key);
                    this.render();
                });

                this._filters.push({binding, row, count: zones => zones.filter(z => status(z, this._host.marks)).length});
            }
            else if(FAVORITE_FILTERS.has(key))
            {
                const binding = new CheckBinding(row, 'filter_check', () => this._favoritesOnly, checked =>
                {
                    this._favoritesOnly = checked;
                    this.render();
                });

                this._filters.push({binding, row, count: zones => zones.filter(z => this._host.marks.isFavorite(z.key)).length});
            }
            else
            {
                setEnabled(row, false);
                setText(row, 'filter_count', '');
            }
        }

        for(const menu of children(side, 'size_menu')) setEnabled(menu, false);
    }

    /** One action button per action: the toolbar's right-aligned in a row, the details' two per row. */
    private placeActions(container: IWindowContainer | null, actions: readonly BrowserAction[], toolbar: boolean): void
    {
        if(!container) return;

        actions.forEach((action, i) =>
        {
            const window = this._build('vortex_map_editor_browser_action_xml');

            if(!window) return;

            const button = child(window, 'action_button');

            if(button) button.caption = this._texts.get(ACTIONS[action].text);
            setImage(window, 'action_icon', `rpg/ui-icons/${ACTIONS[action].icon}`);
            onClick(window, 'action_button', () => this._host.act(action, this.selected));

            if(toolbar) window.x = container.width - (actions.length - i) * (window.width + ACTION_GAP) + ACTION_GAP;
            else
            {
                // Half the details' width each, no icon: their texts are longer than the toolbar's
                // and the centred caption would run under it.
                setVisible(window, 'action_icon', false);

                const width = Math.floor((container.width - ACTION_GAP) / 2);

                Object.assign(window, {width, x: (i % 2) * (width + ACTION_GAP), y: Math.floor(i / 2) * (window.height + ACTION_GAP)});
                if(button)
                {
                    // The layout pins the button to 140 (width_min/max): lifted for these.
                    button.limits.maxWidth = button.limits.minWidth = width;
                    button.width = width;
                }
            }

            container.addChild(window);
            if(!toolbar) this._detailActions.push({action, button});
        });
    }

    private select(key: string): void
    {
        this._selected = key;
        this.render();
    }

    private toggleFavorite(key: string | null): void
    {
        if(!key) return;

        this._host.marks.toggleFavorite(key);
        this._host.changed();
    }
}
