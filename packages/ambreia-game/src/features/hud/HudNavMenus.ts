import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowBits} from '../../ui/kit/WindowBits';
import type {HudMenu} from './HudMenu';
import type {IMenuItem} from './IMenuItem';

/** The HUD's two menus that open windows: the bottom bar's « plus » and the + above the effects. */
export class HudNavMenus
{
    /** @param onNav - a menu entry asks for a window (`nav_inventory`), as the bar's buttons do */
    constructor(private readonly _menu: HudMenu, private readonly _bits: Pick<WindowBits, 'text'>, private readonly _onNav: (name: string) => void) {}

    /** The « plus » menu of the bottom bar: profile, settings, help, log out. */
    more(anchor: IWindow): void
    {
        const text = (key: string): string => this._bits.text(key);
        const soon = (label: string): IMenuItem => ({label: `${label} (${text('vortex.chat.soon')})`, icon: null, color: 0xffffff, checked: false, enabled: false, pick: () => undefined});

        this._menu.toggle('more', anchor, [
            {label: text('vortex.hud.menu.profile'), icon: 'rpg/ui-icons/travel_person_people_three_icon', color: 0x6aa0e0, checked: false, enabled: true, pick: () => this._onNav('nav_character')},
            soon(text('vortex.hud.menu.settings')),
            soon(text('vortex.hud.menu.help')),
            // Back to the login: the page without its session ticket.
            {label: text('vortex.hud.menu.logout'), icon: 'rpg/ui-icons/map_markers_doorway_enterance_exit_open_icon', color: 0xd04040, checked: false, enabled: true, pick: () => globalThis.location?.assign(globalThis.location.pathname)}
        ], false);
    }

    /** The + button above the effects: the character's upgrades, each a window. */
    plus(anchor: IWindow): void
    {
        const text = (key: string): string => this._bits.text(key);
        const entry = (label: string, icon: string, color: number, nav: string): IMenuItem => ({label, icon, color, checked: false, enabled: true, pick: () => this._onNav(nav)});

        this._menu.toggle('plus', anchor, [
            entry(text('vortex.character.stats.attributes'), 'rpg/ui-icons/rpg_stat_strength_fist_melee_attack_icon', 0xe09a60, 'nav_character'),
            entry(text('vortex.skill.title'), 'rpg/ui-icons/misc_religion_christianity_bible_book_cross_tome_libram_icon', 0xd0a040, 'nav_skills'),
            entry(text('vortex.hud.nav.inventory'), 'rpg/ui-icons/rpg_loot_bag_money_coins_purse_icon', 0xd8a060, 'nav_inventory')
        ], false);
    }
}
