import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import {Logger} from '@core/utils/Logger';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IItemGridWindow} from '@core/window/components/IItemGridWindow';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';

import type {FishSpeciesDefinition} from '../definitions/FishSpeciesDefinition';
import {seasonForDate} from '../definitions/FishingSeason';
import type {HabboFishing} from '../HabboFishing';

import {ProgressBarView} from './ProgressBarView';

const log = Logger.getLogger('habbo.vortex.fishing.ui.FishopediaHubView');

const LAYOUT = 'vortex_fishopedia_hub_xml';

/** The layer the room widgets sit on; the hub belongs with them, as the book does. */
const LAYER = 1;

/** Tab ids, matching the `id` attributes on the layout's three `tab_button`s. */
const TAB_FISH = 0;
const TAB_RODS = 1;
const TAB_RECORDS = 2;

/** The three tab bodies, indexed by the id above. */
const TAB_CONTAINERS = ['fish_container', 'rods_container', 'records_container'];

/**
 * Species artwork is keyed on the last segment of the localisation key — `fishpedia_<slug>_preview`,
 * the same derivation `FishingPediaView.drawFish()` uses. Kept identical on purpose: one naming rule
 * for one set of files.
 */
const ASSET_FISH_PREFIX = 'fishpedia_';
const ASSET_FISH_SUFFIX = '_preview';

const ASSET_STAR_FILLED = 'fishpedia_star_filled';
const ASSET_STAR_EMPTY = 'fishpedia_star_empty';

/** `renderFishRarity` draws five, and `rarityStars` is 1..5. */
const MAX_STARS = 5;

/**
 * The rod table travels as integers, and both columns are scaled.
 *
 * `FishingOperationContracts.cs`: "the multipliers are thousandths", and `FishingSessionGrain`
 * settles it at the point of use — `multiplier = rod?.CatchMultiplier ?? 1000` and
 * `Random.Shared.Next(1000) < rod.HookHavocChance`. So 1000 is ×1.0 and 20 is 2.0%. Printing the
 * raw integers read as "×1000" and "2000 %", which is not a rounding slip but a missing unit.
 */
const MULTIPLIER_SCALE = 1000;
const CHANCE_PER_MILLE_TO_PERCENT = 10;

/** The tile a species is drawn into, from the layout's `fish_tile_template`. */
const TILE_ART = 40;

/** The species panel's own preview box. */
const DETAIL_ART_WIDTH = 60;
const DETAIL_ART_HEIGHT = 60;

/** The record row's, at the layout's 1.90 aspect. */
const RECORD_ART_WIDTH = 44;
const RECORD_ART_HEIGHT = 23;

/**
 * Flat grey for a species nobody has caught — the shade Origins uses, sampled off `fishpedia_gray`.
 * Same constant as the book's, for the same reason.
 */
const UNCAUGHT_GREY = 0x86;

/** `activeHours` is a 24-bit mask, one bit per hour. */
const HOURS_IN_DAY = 24;
const HOURS_STRIP_WIDTH = 134;

/**
 * 12px of bar, the rest the 00/06/12/18 scale. Matches the slot's height in the layout.
 *
 * Measured, not chosen: at 9px the scale's glyphs occupy rows 13.5–20.25 of these 22 when anchored
 * to the bottom edge. Raising the bar past 12 walks the gridlines into the digits.
 */
const HOURS_STRIP_HEIGHT = 22;
const HOURS_BAR_HEIGHT = 12;

const HOURS_STRIP_ON = '#54a8e8';
const HOURS_STRIP_OFF = '#c8be8d';

/** Gridlines and scale, and the marker for the hour it is now. */
const HOURS_STRIP_TICK = '#6b6b5f';
const HOURS_STRIP_NOW = '#c30000';

/**
 * The scale's type. Volter is the hotel's own face and is loaded by `loadWebFonts()` before anything
 * renders, so it is available to an OffscreenCanvas; the fallback is there because a canvas that
 * silently misses its font draws nothing rather than substituting.
 */
const HOURS_STRIP_FONT = '9px Volter, monospace';

const KEY_UNKNOWN = 'vortex.fishing.book.unknown';
const KEY_DETAIL_PROMPT = 'vortex.fishing.book.detail_prompt';
const KEY_LEVEL_REQUIRED = 'vortex.fishing.book.level_required';
const KEY_CAUGHT = 'vortex.fishing.book.caught';
const KEY_XP_PROGRESS = 'vortex.fishing.hub.xp_progress';
const KEY_XP_MAX = 'vortex.fishing.hub.xp_max';
const KEY_TOKENS = 'vortex.fishing.hub.tokens';
const KEY_ROD_THRESHOLD = 'vortex.fishing.hub.rod_threshold';
const KEY_WEIGHT = 'vortex.fishing.hub.value.weight';
const KEY_WEIGHT_RANGE = 'vortex.fishing.hub.value.weight_range';
const KEY_MULTIPLIER = 'vortex.fishing.hub.value.multiplier';
const KEY_PERCENT = 'vortex.fishing.hub.value.percent';
const KEY_WEIGHT_UNIT = 'vortex.fishing.derby.weight_unit';
const KEY_HOURS = 'vortex.fishing.book.detail_hours';
const KEY_ANY_TIME = 'vortex.fishing.book.any_time';

/**
 * The Fish-O-Pedia as an album: a zone rail, a species grid, a species panel, and tabs for rods and
 * personal records.
 *
 * NOT ported from AS3 — fishing is an Origins feature written in Lingo, and Origins has no such
 * window: its Fish-O-Pedia is the two-page book that {@link FishingPediaView} reproduces. This is a
 * second face for the same data, laid out in the visual language of an emoticon album the RPG fork
 * removed, and the layout `vortex_fishopedia_hub_xml` carries the note explaining which of the two
 * is authoritative.
 *
 * **It computes nothing and stores nothing.** Species, zones, rod tiers and the hour mask come from
 * `FishingDefinitions`; level, XP, rod quality and the purse from `HabboFishing.playerState`;
 * whether a species is caught is `getRecord()` answering non-null. Reopening the window rebuilds
 * every list from those, so a catch that lands while it is shut is simply there next time.
 *
 * **The progress bars are `ProgressBarView`.** That class is generic — it finds `progress`,
 * `fill` and `highlight` by name inside whatever container it is handed — and this layout uses those
 * names because it was derived from the album's. `setRatio(r, false)` snaps and renders on the spot,
 * so no frame loop is wired: nothing here animates, and a bar that is never updated is therefore
 * correct rather than stuck at zero.
 */
export class FishopediaHubView
{
    // TS-only: Vortex-only view — no AS3 counterpart for any member here.
    private readonly _windowManager: IHabboWindowManager;

    // TS-only: see above.
    private readonly _assets: IAssetLibrary | null;

    // TS-only: see above.
    private readonly _localizations: IHabboLocalizationManager | null;

    // TS-only: see above.
    private readonly _fishing: HabboFishing;

    // TS-only: see above.
    private _window: IWindowContainer | null = null;

    /**
     * The templates, each REMOVED from its list and kept.
     *
     * A template left in the list is a phantom row that no data ever fills, and the first rebuild
     * would push real rows below it. Removing it means every clone is a row the list has never
     * owned — the same discipline that album's set rail followed.
     */
    // TS-only: Vortex-only view.
    private _zoneRowTemplate: IWindowContainer | null = null;

    // TS-only: see above.
    private _fishTileTemplate: IWindowContainer | null = null;

    // TS-only: see above.
    private _rodRowTemplate: IWindowContainer | null = null;

    // TS-only: see above.
    private _recordRowTemplate: IWindowContainer | null = null;

    /**
     * The empty-grid filler. Nothing clones it — it is extracted because REMOVING it is the point:
     * left in the grid it is a phantom tile in front of every real species. The layout keeps
     * declaring it because the album it was derived from pads its last row with it, which this grid
     * does not do.
     */
    // TS-only: Vortex-only view.
    private _emptyTileTemplate: IWindowContainer | null = null;

    // TS-only: Vortex-only view.
    private _xpBar: ProgressBarView | null = null;

    // TS-only: Vortex-only view.
    private _zoneBar: ProgressBarView | null = null;

    /** The bars belonging to live zone rows, disposed with them on every rebuild. */
    // TS-only: Vortex-only view.
    private _zoneRowBars: ProgressBarView[] = [];

    // TS-only: Vortex-only view.
    private _tab: number = TAB_FISH;

    // TS-only: Vortex-only view.
    private _selectedZoneId: number = -1;

    // TS-only: Vortex-only view.
    private _selectedSpeciesId: number = -1;

    // TS-only: Vortex-only view.
    private readonly _onDesktopResized: () => void = () => this._window?.center();

    // TS-only: Vortex-only view.
    constructor(
        windowManager: IHabboWindowManager,
        assets: IAssetLibrary | null,
        localizations: IHabboLocalizationManager | null,
        fishing: HabboFishing
    )
    {
        this._windowManager = windowManager;
        this._assets = assets;
        this._localizations = localizations;
        this._fishing = fishing;
    }

    /**
     * Builds on first use, then shows and refreshes.
     *
     * `buildWidgetLayout` returns the root DETACHED, faithful to AS3, so the desktop has to adopt it
     * or the window has no graphic context and never draws.
     */
    // TS-only: Vortex-only view.
    public open(): void
    {
        if(this._window === null)
        {
            this._window = this._windowManager.buildWidgetLayout(LAYOUT, LAYER) as IWindowContainer | null;

            if(this._window === null)
            {
                log.warn(`${LAYOUT} is not registered; the Fish-O-Pedia hub cannot open.`);

                return;
            }

            const desktop = this._windowManager.getDesktop(LAYER) as unknown as IWindowContainer | null;

            if(desktop === null || typeof desktop.addChild !== 'function')
            {
                log.warn(`No desktop on layer ${LAYER}; the Fish-O-Pedia hub cannot be shown.`);

                return;
            }

            desktop.addChild(this._window);

            this._window.addEventListener(WindowEvent.WE_PARENT_RESIZED, this._onDesktopResized);

            this.extractTemplates();
            this.bindBars();
            this.bind();
        }

        // A zone the player has since outgrown, or a species from a definition push that has been
        // replaced, must not survive into this opening: both are re-picked by `refresh()`.
        this._selectedSpeciesId = -1;

        this._window.center();
        this._window.visible = true;

        this.selectTab(TAB_FISH);
    }

    // TS-only: Vortex-only view.
    public close(): void
    {
        if(this._window !== null) this._window.visible = false;
    }

    /** Pulls each template out of its list and keeps it. See the field comment. */
    // TS-only: Vortex-only view.
    private extractTemplates(): void
    {
        this._zoneRowTemplate = this.takeListTemplate('zone_rail_list', 'zone_row_template');
        this._fishTileTemplate = this.takeGridTemplate('fish_tile_template');
        this._emptyTileTemplate = this.takeGridTemplate('empty_tile_template');
        this._rodRowTemplate = this.takeListTemplate('rod_list', 'rod_row_template');
        this._recordRowTemplate = this.takeListTemplate('records_list', 'record_row_template');
    }

    // TS-only: Vortex-only view.
    private takeListTemplate(listName: string, templateName: string): IWindowContainer | null
    {
        const list = this.list(listName);
        const template = list?.getListItemByName(templateName) ?? null;

        if(list === null || template === null)
        {
            log.warn(`${listName}/${templateName} is missing from ${LAYOUT}; that section stays empty.`);

            return null;
        }

        return list.removeListItem(template) as unknown as IWindowContainer | null;
    }

    /**
     * The same, for the grid — which needs its own method rather than a name argument.
     *
     * `scrollable_itemgrid_vertical` builds a `ScrollableItemGridWindow`, and that is a GRID, not a
     * list: it exposes `addGridItem`/`getGridItemByName`/`destroyGridItems` and none of the
     * `*ListItem*` family, exactly as `ScrollableItemGridWindow.as` does. Casting it to
     * `IItemListWindow` compiles and throws "getListItemByName is not a function" the first time the
     * window is opened, which is how this was found.
     */
    // TS-only: Vortex-only view.
    private takeGridTemplate(templateName: string): IWindowContainer | null
    {
        const grid = this.grid();
        const template = grid?.getGridItemByName(templateName) ?? null;

        if(grid === null || template === null)
        {
            log.warn(`fish_grid/${templateName} is missing from ${LAYOUT}; the species grid stays empty.`);

            return null;
        }

        return grid.removeGridItem(template) as unknown as IWindowContainer | null;
    }

    /** The two bars that belong to the window itself rather than to a row. */
    // TS-only: Vortex-only view.
    private bindBars(): void
    {
        this._xpBar = new ProgressBarView(this.child('xp_progress_bar') as IWindowContainer | null);
        this._zoneBar = new ProgressBarView(this.child('zone_progress_bar') as IWindowContainer | null);
    }

    // TS-only: Vortex-only view.
    private bind(): void
    {
        this.child('tab_fish')?.addEventListener(WindowMouseEvent.CLICK, () => this.selectTab(TAB_FISH));
        this.child('tab_rods')?.addEventListener(WindowMouseEvent.CLICK, () => this.selectTab(TAB_RODS));
        this.child('tab_records')?.addEventListener(WindowMouseEvent.CLICK, () => this.selectTab(TAB_RECORDS));

        // A frame's X emits no WE_CLOSE — that event is DropBaseController's. The close button is a
        // child named by the shipped frame layout, so it is bound by name like any other.
        this.child('header_button_close')?.addEventListener(WindowMouseEvent.CLICK, () => this.close());
    }

    // TS-only: Vortex-only view.
    private selectTab(tab: number): void
    {
        this._tab = tab;

        for(let i = 0; i < TAB_CONTAINERS.length; i++)
        {
            this.setVisible(TAB_CONTAINERS[i], i === tab);
        }

        this.refresh();
    }

    /** The header is on every tab, so it is refreshed whichever one is showing. */
    // TS-only: Vortex-only view.
    private refresh(): void
    {
        this.refreshHeader();

        if(this._tab === TAB_FISH)
        {
            this.refreshZones();
            this.refreshPage();
        }
        else if(this._tab === TAB_RODS) this.refreshRods();
        else if(this._tab === TAB_RECORDS) this.refreshRecords();
    }

    // TS-only: Vortex-only view.
    private refreshHeader(): void
    {
        const state = this._fishing.playerState;
        const definitions = this._fishing.definitions;

        this.setCaption('level_value', String(state.fishingLevel));

        const rod = definitions.rodQualityForXp(state.rodXp);

        this.setCaption('rod_value', rod === null ? this.translate(KEY_UNKNOWN) : this.translate(rod.nameKey));

        this.setCaption(
            'pedia_subtitle',
            this.translate(
                KEY_CAUGHT,
                'caught', String(this._fishing.caughtSpeciesCount),
                'total', String(definitions.allSpecies.length)
            )
        );

        // The level table is a list of thresholds, so "progress to the next level" is the span
        // between the current threshold and the next one — not fishingXp against the next alone,
        // which would show a bar that never empties after level 1.
        //
        // **The next level is the next THRESHOLD, not `level + 1`.** The seeded table runs
        // 1, 5, 10, 15, 20, 25, 30, 40, 50… so asking for level 2 finds nothing, and the empty span
        // that follows printed "157 / 0 XP" over a full bar for a level-1 player. `allFishingLevels`
        // is sorted by threshold, so the first entry above the current XP is the next tier whatever
        // the operator numbered it.
        const levels = definitions.allFishingLevels;
        const current = definitions.fishingLevelForXp(state.fishingXp);
        const next = levels.find((level) => level.xpThreshold > state.fishingXp) ?? null;

        const floor = current?.xpThreshold ?? 0;
        const earned = Math.max(0, state.fishingXp - floor);

        if(next === null)
        {
            // Genuinely at the top of the table: show the XP held, not a span of zero.
            this.setCaption('xp_progress_text', this.translate(KEY_XP_MAX, 'current', String(state.fishingXp)));
            this._xpBar?.setRatio(1, false);
        }
        else
        {
            const span = next.xpThreshold - floor;

            this.setCaption(
                'xp_progress_text',
                this.translate(KEY_XP_PROGRESS, 'current', String(earned), 'next', String(Math.max(0, span)))
            );

            this._xpBar?.setRatio(span > 0 ? earned / span : 0, false);
        }

        this.setCaption(
            'currency_value',
            this.translate(
                KEY_TOKENS,
                'amount', String(state.currency),
                'today', String(state.currencyEarnedToday),
                'cap', String(state.dailyCap)
            )
        );
    }

    // TS-only: Vortex-only view.
    private refreshZones(): void
    {
        const list = this.list('zone_rail_list');

        this.clearZoneRowBars();
        list?.destroyListItems();

        if(list === null || this._zoneRowTemplate === null) return;

        const zones = this._fishing.definitions.allZones;

        // Nothing was picked, or the picked zone is gone from a newer definition push.
        if(zones.find((zone) => zone.id === this._selectedZoneId) === undefined)
        {
            this._selectedZoneId = zones.length > 0 ? zones[0].id : -1;
        }

        for(const zone of zones)
        {
            const row = this._zoneRowTemplate.clone() as IWindowContainer;
            const species = this._fishing.definitions.getSpeciesForZone(zone.id);
            const caught = species.filter((entry) => this._fishing.getRecord(entry.id) !== null).length;
            const locked = this._fishing.playerState.fishingLevel < zone.requiredLevel;

            this.setChildCaption(row, 'zone_row_title', this.translate(zone.nameKey));
            this.setChildCaption(row, 'zone_row_progress_text', `${caught}/${species.length}`);

            // A zone above the player's level shows what it wants instead of a progress bar: its
            // fish are all unreachable, so a 0/12 bar would say nothing useful.
            this.setChildCaption(
                row,
                'zone_row_requirement',
                this.translate(KEY_LEVEL_REQUIRED, 'level', String(zone.requiredLevel))
            );
            this.setChildVisible(row, 'zone_row_requirement', locked);
            this.setChildVisible(row, 'zone_row_progress_bar', !locked);
            this.setChildVisible(row, 'zone_row_progress_text', !locked);

            if(!locked)
            {
                const bar = new ProgressBarView(
                    row.findChildByName('zone_row_progress_bar') as IWindowContainer | null
                );

                bar.setRatio(species.length > 0 ? caught / species.length : 0, false);
                this._zoneRowBars.push(bar);
            }

            const zoneId = zone.id;

            row.addEventListener(WindowMouseEvent.CLICK, () => this.selectZone(zoneId));

            list.addListItem(row as unknown as IWindow);
        }
    }

    // TS-only: Vortex-only view.
    private selectZone(zoneId: number): void
    {
        if(this._selectedZoneId === zoneId) return;

        this._selectedZoneId = zoneId;
        this._selectedSpeciesId = -1;

        this.refreshPage();
    }

    /** The zone header and the species grid, which change together. */
    // TS-only: Vortex-only view.
    private refreshPage(): void
    {
        const zone = this._fishing.definitions.getZone(this._selectedZoneId);

        this.setCaption('zone_title', zone === null ? this.translate(KEY_UNKNOWN) : this.translate(zone.nameKey));

        // FishingZoneDefinition has no description column: the key is the zone's own name key with
        // `.desc` appended, which is the convention the locale override file documents.
        this.setCaption('zone_description', zone === null ? '' : this.translate(`${zone.nameKey}.desc`));

        const species = zone === null ? [] : this._fishing.definitions.getSpeciesForZone(zone.id);
        const caught = species.filter((entry) => this._fishing.getRecord(entry.id) !== null).length;

        this.setCaption('zone_progress_text', `${caught} / ${species.length}`);
        this._zoneBar?.setRatio(species.length > 0 ? caught / species.length : 0, false);

        this.refreshGrid(species);
        this.refreshDetail();
    }

    // TS-only: Vortex-only view.
    private refreshGrid(species: FishSpeciesDefinition[]): void
    {
        const grid = this.grid();

        grid?.destroyGridItems();

        if(grid === null || this._fishTileTemplate === null) return;

        const now = new Date();
        const season = seasonForDate(now);

        for(const entry of species)
        {
            const tile = this._fishTileTemplate.clone() as IWindowContainer;
            const known = this._fishing.getRecord(entry.id) !== null;

            this.drawSpecies(tile.findChildByName('bitmap'), entry, TILE_ART, TILE_ART, !known);
            this.setChildVisible(tile, 'locked_overlay', !known);

            // `isActiveAt` is the species' own hour/weekday/season test — the single most useful
            // thing the pedia can say, so it is a marker on the tile and not buried in the panel.
            this.setChildVisible(tile, 'biting_now_icon', entry.isActiveAt(now, season));

            const speciesId = entry.id;

            tile.addEventListener(WindowMouseEvent.CLICK, () => this.selectSpecies(speciesId));

            grid.addGridItem(tile as unknown as IWindow);
        }
    }

    // TS-only: Vortex-only view.
    private selectSpecies(speciesId: number): void
    {
        this._selectedSpeciesId = speciesId;

        this.refreshDetail();
    }

    // TS-only: Vortex-only view.
    private refreshDetail(): void
    {
        const entry = this._fishing.definitions.getSpecies(this._selectedSpeciesId);

        // Nothing picked yet: the panel invites a pick rather than showing a blank table.
        if(entry === null)
        {
            this.setCaption('fish_detail_name', this.translate(KEY_DETAIL_PROMPT));
            this.setVisible('fish_detail_stats', false);
            this.setVisible('fish_detail_stars', false);
            this.setVisible('fish_detail_hours_label', false);
            this.setVisible('fish_detail_hours_strip', false);
            this.drawSpecies(this.child('fish_detail_preview'), null, DETAIL_ART_WIDTH, DETAIL_ART_HEIGHT, false);

            return;
        }

        const record = this._fishing.getRecord(entry.id);
        const known = record !== null;

        this.setVisible('fish_detail_stats', true);
        this.setVisible('fish_detail_stars', true);
        this.setVisible('fish_detail_hours_label', true);
        this.setVisible('fish_detail_hours_strip', true);

        // An uncaught species keeps its silhouette and its name hidden, exactly as the book does.
        this.setCaption('fish_detail_name', known ? this.translate(entry.nameKey) : this.translate(KEY_UNKNOWN));
        this.drawSpecies(this.child('fish_detail_preview'), entry, DETAIL_ART_WIDTH, DETAIL_ART_HEIGHT, !known);
        this.drawStars(entry.rarityStars);

        const unit = this.translate(KEY_WEIGHT_UNIT);

        this.setStatValue('stat_row_level', String(entry.requiredLevel));
        this.setStatValue(
            'stat_row_weight',
            this.translate(
                KEY_WEIGHT_RANGE,
                'min', String(entry.minWeight),
                'max', String(entry.maxWeight),
                'unit', unit
            )
        );
        this.setStatValue('stat_row_xp', `+${entry.xpReward}`);
        this.setStatValue('stat_row_tokens', `+${entry.currencyReward}`);
        this.setStatValue(
            'stat_row_best',
            known ? this.translate(KEY_WEIGHT, 'amount', String(record.bestWeight), 'unit', unit) : '—'
        );
        this.setStatValue('stat_row_caught', known ? String(record.caughtCount) : '0');

        this.setCaption('fish_detail_hours_label', this.describeHours(entry.activeHours));
        this.drawHours(entry.activeHours);
    }

    // TS-only: Vortex-only view.
    private refreshRods(): void
    {
        const list = this.list('rod_list');

        list?.destroyListItems();

        if(list === null || this._rodRowTemplate === null) return;

        const equipped = this._fishing.playerState.rodQuality;

        for(const rod of this._fishing.definitions.allRodLevels)
        {
            const row = this._rodRowTemplate.clone() as IWindowContainer;

            this.setChildCaption(row, 'rod_name', this.translate(rod.nameKey));
            this.setChildCaption(
                row,
                'rod_threshold',
                this.translate(KEY_ROD_THRESHOLD, 'xp', String(rod.xpThreshold))
            );

            this.setPillValue(row, 'rod_catch_stat', this.translate(KEY_MULTIPLIER, 'factor', this.decimal(rod.catchMultiplier / MULTIPLIER_SCALE)));
            this.setPillValue(row, 'rod_golden_stat', this.translate(KEY_MULTIPLIER, 'factor', this.decimal(rod.goldenMultiplier / MULTIPLIER_SCALE)));
            this.setPillValue(row, 'rod_havoc_stat', this.translate(KEY_PERCENT, 'percent', this.decimal(rod.hookHavocChance / CHANCE_PER_MILLE_TO_PERCENT)));

            this.setChildVisible(row, 'rod_current_marker', rod.quality === equipped);

            list.addListItem(row as unknown as IWindow);
        }
    }

    // TS-only: Vortex-only view.
    private refreshRecords(): void
    {
        const list = this.list('records_list');

        list?.destroyListItems();

        if(list === null || this._recordRowTemplate === null) return;

        const unit = this.translate(KEY_WEIGHT_UNIT);

        for(const record of this._fishing.allRecords)
        {
            const entry = this._fishing.definitions.getSpecies(record.speciesId);

            // A record for a species this client has no definition for — an older catch against a
            // newer table. It is still the player's record, so it is listed under the unknown name
            // rather than dropped.
            const row = this._recordRowTemplate.clone() as IWindowContainer;

            this.setChildCaption(row, 'record_name', entry === null ? this.translate(KEY_UNKNOWN) : this.translate(entry.nameKey));
            this.setChildCaption(row, 'record_best', this.translate(KEY_WEIGHT, 'amount', String(record.bestWeight), 'unit', unit));
            this.setChildCaption(row, 'record_count', String(record.caughtCount));
            this.setChildCaption(row, 'record_date', this.formatDate(record.bestAt));

            this.drawSpecies(row.findChildByName('record_preview'), entry, RECORD_ART_WIDTH, RECORD_ART_HEIGHT, false);

            list.addListItem(row as unknown as IWindow);
        }
    }

    /**
     * Draws a species into a bitmap slot, greyed when it is not yet known.
     *
     * The art is centred rather than stretched: previews differ in size and a stretch makes the
     * small ones look wrong next to the large. `null` clears the slot.
     */
    // TS-only: Vortex-only view.
    private drawSpecies(
        target: IWindow | null,
        entry: FishSpeciesDefinition | null,
        width: number,
        height: number,
        grey: boolean
    ): void
    {
        const slot = target as IBitmapWrapperWindow | null;

        if(slot === null) return;

        // Every slot this writes to is a `<bitmap>` in the layout, deliberately: `static_bitmap` has
        // no `bitmap` setter, so writing one is silently a no-op and only its `asset_uri` ever
        // shows. That cost two rounds — first every record row wearing the layout's placeholder
        // fish, then, once the uri was cleared, no fish at all.
        const slug = entry?.nameKey.split('.').pop() ?? '';
        const sprite = entry === null ? null : this.sprite(`${ASSET_FISH_PREFIX}${slug}${ASSET_FISH_SUFFIX}`);

        if(sprite === null)
        {
            slot.bitmap = null;
            slot.invalidate();

            return;
        }

        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext('2d');

        if(context === null) return;

        // A preview wider than its slot is scaled down to fit; anything smaller keeps its own size.
        const scale = Math.min(1, width / sprite.width, height / sprite.height);
        const drawWidth = Math.round(sprite.width * scale);
        const drawHeight = Math.round(sprite.height * scale);

        context.imageSmoothingEnabled = false;
        context.drawImage(
            sprite,
            Math.floor((width - drawWidth) / 2),
            Math.floor((height - drawHeight) / 2),
            drawWidth,
            drawHeight
        );

        if(grey)
        {
            const pixels = context.getImageData(0, 0, width, height);

            for(let i = 0; i < pixels.data.length; i += 4)
            {
                if(pixels.data[i + 3] === 0) continue;

                pixels.data[i] = UNCAUGHT_GREY;
                pixels.data[i + 1] = UNCAUGHT_GREY;
                pixels.data[i + 2] = UNCAUGHT_GREY;
            }

            context.putImageData(pixels, 0, 0);
        }

        slot.bitmap = canvas.transferToImageBitmap();
        slot.invalidate();
    }

    /** Five slots, `rarityStars` of them filled. */
    // TS-only: Vortex-only view.
    private drawStars(filled: number): void
    {
        for(let i = 1; i <= MAX_STARS; i++)
        {
            const star = this.child(`star_${i}`) as IBitmapWrapperWindow | null;

            if(star === null) continue;

            star.bitmap = this.sprite(i <= filled ? ASSET_STAR_FILLED : ASSET_STAR_EMPTY);
            star.invalidate();
        }
    }

    /**
     * The 24-hour clock as a picture: a bar per hour, a scale under it, and where "now" falls.
     *
     * Twenty-four anonymous blocks are unreadable — you cannot tell hour 6 from hour 9 by counting
     * 5px columns — so the numbers are drawn INTO the bitmap, under their own columns. That is the
     * whole reason this is a painted slot and not four windows in the layout.
     */
    // TS-only: Vortex-only view.
    private drawHours(mask: number): void
    {
        const target = this.child('fish_detail_hours_strip') as IBitmapWrapperWindow | null;

        if(target === null) return;

        const canvas = new OffscreenCanvas(HOURS_STRIP_WIDTH, HOURS_STRIP_HEIGHT);
        const context = canvas.getContext('2d');

        if(context === null) return;

        const column = HOURS_STRIP_WIDTH / HOURS_IN_DAY;
        const left = (hour: number): number => Math.round(hour * column);

        for(let hour = 0; hour < HOURS_IN_DAY; hour++)
        {
            const lit = (mask & (1 << hour)) !== 0;

            context.fillStyle = lit ? HOURS_STRIP_ON : HOURS_STRIP_OFF;
            // A lit hour is full height and a dark one is inset, so the shape reads even in
            // greyscale and even for someone who cannot separate the two blues.
            context.fillRect(left(hour), lit ? 0 : 4, left(hour + 1) - left(hour) - 1, lit ? HOURS_BAR_HEIGHT : HOURS_BAR_HEIGHT - 8);
        }

        // Gridlines every six hours, drawn over the bars so they read as a scale.
        context.fillStyle = HOURS_STRIP_TICK;

        for(let hour = 6; hour < HOURS_IN_DAY; hour += 6)
        {
            context.fillRect(left(hour) - 1, 0, 1, HOURS_BAR_HEIGHT + 1);
        }

        // The hour it is now, so "is it biting?" is answerable without reading the sentence above
        // and then checking a clock.
        const nowHour = new Date().getUTCHours();

        context.fillStyle = HOURS_STRIP_NOW;
        context.fillRect(left(nowHour), 0, Math.max(2, left(nowHour + 1) - left(nowHour) - 1), 2);

        // The scale. Only 00/06/12/18 fit at this width; anchoring each label to its own column's
        // left edge is what ties a number to the bar above it.
        //
        // **Baseline `bottom`, drawn at the canvas edge — not `top` at a computed y.** With `top`
        // the glyphs run DOWN from the anchor, so a 9px face at y=16 needs ~27px of a 22px canvas
        // and the digits are cut off inside the bitmap. Moving the window does nothing about that,
        // which is exactly what happened: the layout moved 3px and the render was identical.
        // Anchoring to the bottom edge makes the fit independent of the face's metrics.
        context.fillStyle = HOURS_STRIP_TICK;
        context.font = HOURS_STRIP_FONT;
        context.textBaseline = 'bottom';

        for(const hour of [0, 6, 12, 18])
        {
            context.textAlign = hour === 0 ? 'left' : 'center';
            context.fillText(this.hour(hour), hour === 0 ? 0 : left(hour), HOURS_STRIP_HEIGHT);
        }

        context.textAlign = 'right';
        context.fillText(this.hour(0), HOURS_STRIP_WIDTH, HOURS_STRIP_HEIGHT);

        target.bitmap = canvas.transferToImageBitmap();
        target.invalidate();
    }

    /**
     * The hour mask as a sentence.
     *
     * **The day is a circle, not a line.** A night feeder sets bits at both ends — 21,22,23,0,1,2 —
     * and bounding it by the first and last set bit prints "0–23", which reads as "any time" and is
     * the opposite of the truth. Runs are therefore closed across midnight: that mask is one run,
     * `21–02`, not two.
     *
     * Every bit set is "any time"; several separate runs are listed, because a species that bites at
     * dawn and at dusk is two windows and saying so is the whole point of the line.
     */
    // TS-only: Vortex-only view.
    private describeHours(mask: number): string
    {
        const on = (hour: number): boolean => (mask & (1 << (((hour % HOURS_IN_DAY) + HOURS_IN_DAY) % HOURS_IN_DAY))) !== 0;

        let count = 0;

        for(let hour = 0; hour < HOURS_IN_DAY; hour++) if(on(hour)) count++;

        if(count === 0 || count === HOURS_IN_DAY) return this.translate(KEY_ANY_TIME);

        const runs: string[] = [];

        for(let hour = 0; hour < HOURS_IN_DAY; hour++)
        {
            // A run starts at an hour that is on and whose predecessor is off — on the circle, so
            // hour 0 only starts a run when hour 23 is off.
            if(!on(hour) || on(hour - 1)) continue;

            let end = hour;

            while(on(end + 1) && end - hour < HOURS_IN_DAY) end++;

            runs.push(`${this.hour(hour)}–${this.hour(end)}`);
        }

        return this.translate(KEY_HOURS, 'hours', runs.join(', '));
    }

    /** An hour of the circular day, two digits, so `2` reads as `02` next to `21`. */
    // TS-only: Vortex-only view.
    private hour(value: number): string
    {
        return String(((value % HOURS_IN_DAY) + HOURS_IN_DAY) % HOURS_IN_DAY).padStart(2, '0');
    }

    /**
     * A scaled number, at the precision it actually carries and in the viewer's own notation.
     *
     * Two decimals, not one: the rod table holds ×1.25, and `toFixed(1)` rounds that to "1.3" —
     * a wrong number rather than a short one. Trailing zeros are dropped, so ×1.0 prints "1".
     * `toLocaleString` because the decimal separator is text like any other: a French client says
     * "1,25", and a `.` there is as wrong as an untranslated label.
     */
    // TS-only: Vortex-only view.
    private decimal(value: number): string
    {
        return value.toLocaleString(undefined, {maximumFractionDigits: 2});
    }

    /** The runtime's own locale formats a date; there is no key for it. */
    // TS-only: Vortex-only view.
    private formatDate(unixSeconds: number): string
    {
        if(unixSeconds <= 0) return '';

        return new Date(unixSeconds * 1000).toLocaleDateString();
    }

    // TS-only: Vortex-only view.
    private setStatValue(rowName: string, value: string): void
    {
        const row = this.child(rowName) as IWindowContainer | null;

        this.setChildCaption(row, 'value', value);
    }

    /** A header pill's value line — the label is the layout's and never changes. */
    // TS-only: Vortex-only view.
    private setPillValue(row: IWindowContainer | null, pillName: string, value: string): void
    {
        const pill = row?.findChildByName(pillName) as IWindowContainer | null;

        this.setChildCaption(pill, 'value', value);
    }

    // TS-only: Vortex-only view.
    private setChildCaption(parent: IWindowContainer | null, name: string, caption: string): void
    {
        const child = parent?.findChildByName(name) ?? null;

        if(child !== null) child.caption = caption;
    }

    // TS-only: Vortex-only view.
    private setChildVisible(parent: IWindowContainer | null, name: string, visible: boolean): void
    {
        const child = parent?.findChildByName(name) ?? null;

        if(child !== null) child.visible = visible;
    }

    // TS-only: Vortex-only view.
    private list(name: string): IItemListWindow | null
    {
        return (this._window?.findChildByName(name) as IItemListWindow | null) ?? null;
    }

    /** The species grid. See {@link takeGridTemplate} for why it is not reached through `list()`. */
    // TS-only: Vortex-only view.
    private grid(): IItemGridWindow | null
    {
        return (this._window?.findChildByName('fish_grid') as IItemGridWindow | null) ?? null;
    }

    // TS-only: Vortex-only view.
    private sprite(assetName: string): ImageBitmap | null
    {
        const bitmap = (this._assets?.getAssetByName(assetName)?.content ?? null) as ImageBitmap | null;

        if(bitmap === null) log.warn(`${assetName} is not in the asset library.`);

        return bitmap;
    }

    // TS-only: Vortex-only view.
    private child(name: string): IWindow | null
    {
        return this._window?.findChildByName(name) ?? null;
    }

    // TS-only: Vortex-only view.
    private setCaption(name: string, caption: string): void
    {
        const child = this.child(name);

        if(child !== null) child.caption = caption;
    }

    // TS-only: Vortex-only view.
    private setVisible(name: string, visible: boolean): void
    {
        const child = this.child(name);

        if(child !== null) child.visible = visible;
    }

    /** Name/value pairs, not positional values — see `FishingSpotWidget.translate()`. */
    // TS-only: Vortex-only view.
    private translate(key: string, ...params: string[]): string
    {
        return this._localizations?.getLocalizationWithParams(key, key, ...params) ?? key;
    }

    // TS-only: Vortex-only view.
    private clearZoneRowBars(): void
    {
        for(const bar of this._zoneRowBars) bar.dispose();

        this._zoneRowBars.length = 0;
    }

    // TS-only: Vortex-only view.
    public dispose(): void
    {
        this.clearZoneRowBars();

        this._xpBar?.dispose();
        this._zoneBar?.dispose();
        this._xpBar = null;
        this._zoneBar = null;

        // The templates are outside their lists, so nothing else will ever free them.
        (this._zoneRowTemplate as unknown as IWindow | null)?.dispose();
        (this._fishTileTemplate as unknown as IWindow | null)?.dispose();
        (this._emptyTileTemplate as unknown as IWindow | null)?.dispose();
        (this._rodRowTemplate as unknown as IWindow | null)?.dispose();
        (this._recordRowTemplate as unknown as IWindow | null)?.dispose();
        this._zoneRowTemplate = null;
        this._fishTileTemplate = null;
        this._emptyTileTemplate = null;
        this._rodRowTemplate = null;
        this._recordRowTemplate = null;

        this._window?.removeEventListener(WindowEvent.WE_PARENT_RESIZED, this._onDesktopResized);
        this._window?.dispose();
        this._window = null;

        this._selectedZoneId = -1;
        this._selectedSpeciesId = -1;
    }
}
