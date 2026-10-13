import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import {buildFrame} from '../../../ui/kit/buildFrame';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {ILogEntry} from '../ILogEntry';
import {LOG_FILTERS, logFilterOf, logLine} from './combatLogLines';
import type {ILogFilter} from './ILogFilter';
import type {ILogNames} from './ILogNames';

/** The chips' spacing and the active one's tint (the owner's mock-up of the log). */
const CHIP_STEP = 96;
const CHIP_ACTIVE = 0x2a6aa0;
/** Lines kept on screen, as the model keeps them. */
const MAX_LINES = 200;
/** Above the action bar, centred. */
const BOTTOM_MARGIN = 96;

/**
 * The combat log (the owner's vortex_hud_combat_log_xml, M1d §4): the model's lines, filtered by
 * the chips, newest last. Opened and closed by its key; it keeps the lines while closed.
 */
export class CombatLogPanel
{
    private _window: IWindowContainer | null = null;
    private _filter: ILogFilter = 'all';
    private readonly _chips = new Map<IWindow, ILogFilter>();
    private _chipColor = 0;
    private _entries: readonly ILogEntry[] = [];

    constructor(private readonly _windows: () => IHabboWindowManager | null, private readonly _bits: WindowBits, private readonly _names: ILogNames, private readonly _clock: (at: number) => string) {}

    get visible(): boolean
    {
        return this._window?.visible === true;
    }

    /** Opens it with the model's lines, or closes it. */
    toggle(entries: readonly ILogEntry[]): void
    {
        if(this.visible)
        {
            this._window!.visible = false;

            return;
        }

        const window = this._window ??= this.build();

        if(!window) return;

        window.visible = true;
        this._entries = entries;
        this.refill();
    }

    /** A new line of the model: shown at once when it passes the filter. */
    add(entry: ILogEntry, entries: readonly ILogEntry[]): void
    {
        this._entries = entries;

        if(!this.visible || !this.passes(entry)) return;

        const list = this.list();

        if(!list) return;

        this.append(list, entry);
        while(list.numListItems > MAX_LINES) list.removeListItemAt(0)?.destroy();
    }

    /** The zone was left: its lines with it. */
    clear(): void
    {
        this._entries = [];
        this.list()?.destroyListItems();
    }

    private build(): IWindowContainer | null
    {
        const windows = this._windows();
        const window = windows ? buildFrame(windows, 'vortex_hud_combat_log_xml', this._onEvent) : null;

        if(!window || !windows) return null;

        const desktop = window.parent;

        if(desktop) window.y = Math.max(0, desktop.height - window.height - BOTTOM_MARGIN);

        const bar = window.findChildByName('filter_bar') as IWindowContainer | null;

        LOG_FILTERS.forEach(({filter, key}, i) =>
        {
            const chip = windows.buildWidgetLayout('vortex_hud_chip_xml') as IWindowContainer | null;

            if(!chip || !bar) return;

            chip.x = i * CHIP_STEP;
            this._bits.setText(chip, 'chip_txt', this._bits.text(key));
            this._chipColor = chip.findChildByName('chip')?.color ?? chip.color;
            this._chips.set(chip, filter);
            bar.addChild(chip);
        });

        this.paintChips();

        return window;
    }

    private refill(): void
    {
        const list = this.list();

        if(!list) return;

        list.destroyListItems();
        for(const entry of this._entries) if(this.passes(entry)) this.append(list, entry);
    }

    private append(list: IItemListWindow, entry: ILogEntry): void
    {
        const row = this._windows()?.buildWidgetLayout('vortex_hud_combat_log_line_xml') as IWindowContainer | null;

        if(!row) return;

        const line = logLine(entry, (key, ...params) => this._bits.text(key, ...params), this._names);
        const icon = row.findChildByName('line_icon') as IStaticBitmapWrapperWindow | null;

        this._bits.setText(row, 'time_txt', this._clock(entry.at));
        this._bits.setText(row, 'line_txt', line.text);
        this._bits.setTextColor(row, 'line_txt', line.color);

        if(icon)
        {
            if(icon.assetUri !== line.icon) icon.assetUri = line.icon;
            icon.color = line.color;
        }

        list.addListItem(row);
    }

    private passes(entry: ILogEntry): boolean
    {
        return this._filter === 'all' || logFilterOf(entry.kind) === this._filter;
    }

    private list(): IItemListWindow | null
    {
        return (this._window?.findChildByName('log_list') as IItemListWindow | null) ?? null;
    }

    private paintChips(): void
    {
        for(const [chip, filter] of this._chips)
        {
            const face = (chip as IWindowContainer).findChildByName('chip') ?? chip;

            face.color = filter === this._filter ? CHIP_ACTIVE : this._chipColor;
        }
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        // The clicked window or one of its parents is a chip.
        for(let at: IWindow | null = window; at !== null; at = at.parent)
        {
            const filter = this._chips.get(at);

            if(filter === undefined) continue;

            this._filter = filter;
            this.paintChips();
            this.refill();

            return;
        }
    };

    dispose(): void
    {
        this._window?.destroy();
        this._window = null;
        this._chips.clear();
    }
}
