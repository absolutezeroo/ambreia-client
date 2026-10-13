import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import {buildFrame} from '../../../ui/kit/buildFrame';
import {WindowBits} from '../../../ui/kit/WindowBits';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {ILevelUp} from '../ILevelUp';
import {levelUpRows} from './levelUpRows';

/** The stat rows' width in vortex_levelup_xml's stat_list, and an unlock tile's, as the owner's mock-up sets them. */
const STAT_ROW_WIDTH = 246;
const UNLOCK_WIDTH = 126;
/** A learned skill's tile tint (the mock-up's « Sorts » purple). */
const SKILL_TINT = 0x8a3ad0;

/** What the panel shows of a learned skill. */
export type SkillLook = (skillId: string) => {name: string; icon: string};

/**
 * The level-up panel (the owner's vortex_levelup_xml, M1d §4): « Niveau N ! », the player's
 * figure, the stats that rose and the skills learned; Continue closes it. A second level-up while it
 * is open replaces its content.
 */
export class LevelUpPanel
{
    private _window: IWindowContainer | null = null;

    constructor(private readonly _windows: () => IHabboWindowManager | null, private readonly _bits: WindowBits, private readonly _skill: SkillLook) {}

    show(up: ILevelUp, figure: string): void
    {
        const windows = this._windows();

        this._window ??= windows ? buildFrame(windows, 'vortex_levelup_xml', this._onEvent) : null;

        const window = this._window;

        if(!window || !windows) return;

        const bits = this._bits;

        window.visible = true;
        bits.setText(window, 'level_title', bits.text('vortex.levelup.level', 'level', String(up.toLevel)));
        bits.avatar(window, 'head_image', figure, 2, false);

        const stats = window.findChildByName('stat_list') as IItemListWindow | null;

        stats?.destroyListItems();
        for(const row of levelUpRows(up.statsBefore, up.statsAfter))
        {
            const line = windows.buildWidgetLayout('vortex_inventory_compare_row_xml') as IWindowContainer | null;

            if(!line || !stats) continue;

            line.width = STAT_ROW_WIDTH;
            bits.setText(line, 'stat_name', bits.text(row.key));
            bits.setText(line, 'stat_value', '');
            bits.setText(line, 'stat_delta', row.delta);
            this.icon(line, 'stat_icon', row.icon, row.color);
            stats.addListItem(line);
        }

        const unlocks = window.findChildByName('unlock_list') as IItemListWindow | null;

        unlocks?.destroyListItems();
        for(const skillId of up.skillsLearned)
        {
            const tile = windows.buildWidgetLayout('vortex_unlock_row_xml') as IWindowContainer | null;

            if(!tile || !unlocks) continue;

            const skill = this._skill(skillId);

            tile.width = UNLOCK_WIDTH;
            bits.setText(tile, 'unlock_txt', skill.name);
            this.icon(tile, 'unlock_icon', skill.icon, SKILL_TINT);
            unlocks.addListItem(tile);
        }
    }

    hide(): void
    {
        if(this._window) this._window.visible = false;
    }

    private icon(container: IWindowContainer, name: string, icon: string, color: number): void
    {
        const bitmap = container.findChildByName(name) as IStaticBitmapWrapperWindow | null;

        if(!bitmap) return;

        if(bitmap.assetUri !== icon) bitmap.assetUri = icon;
        bitmap.color = color;
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WME_CLICK' && WindowBits.ancestor(window, 'continue_button')) this.hide();
    };

    dispose(): void
    {
        this._window?.destroy();
        this._window = null;
    }
}
