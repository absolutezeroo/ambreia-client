// What the HUD shows, as the other features describe it to it (host.made.hud / host.made.hudPlayer):
// the one file of this feature another feature imports (spec §3 rule 4, the feature wall).
import type {ChatChannel, IChatLine, IChatSettings, IChatTab} from '../../ui/kit/chatModel';

/** A quest the tracker follows: its icon, name, current objective and progress (`2 / 5`). */
export interface IQuestLine
{
    icon: string | null;
    title: string;
    objective: string;
    count: string;
}

/** A party member's frame: portrait, level, HP and the effects on them. */
export interface IPartyMember
{
    name: string;
    figure: string;
    level: number | null;
    hp: number | null;
    hpMax: number | null;
    /** Icons of the effects on them. */
    buffs: string[];
    dead: boolean;
}

/** What is being cast: icon, name, and how far along (seconds). */
export interface IHudCast
{
    icon: string | null;
    name: string;
    elapsed: number;
    duration: number;
}

/** A monster or player shown as the target or as the boss. */
export interface IHudUnit
{
    name: string;
    /** Asset name of the portrait. */
    portrait: string | null;
    /** A player's figure: the frame shows its head instead of the portrait. */
    figure?: string | null;
    level: number | null;
    /** The line under the name (`Niv. 35 · Boss`). */
    info: string;
    hp: number | null;
    hpMax: number | null;
    /** Icons of the effects on it. */
    debuffs: string[];
    /** `normal`, `elite` or `boss` (M1c): the target frame's border. */
    rank?: string;
    /** Its room object, for the casts the skills feature follows by caster. */
    objectId?: number;
    /** What it casts, when it does (the boss frame's cast line, the target frame's). */
    cast?: IHudCast | null;
}

export interface IHudPanels
{
    gold: number | null;
    gems: number | null;
    tokens: number | null;
    /** The "!" on the quests button: something new in the journal. */
    questAlert: boolean;
    zoneName: string;
    zonePlayers: number | null;
    quests: IQuestLine[];
    party: IPartyMember[];
    /** Icons of the effects on the player. */
    buffs: string[];
    /** Under each of `buffs`, its time left (`4 s`), or nothing for an effect without end; none: no times. */
    buffTimes?: string[];
    /** Under each of `buffs`, whether it ends within seconds (the red outline). */
    buffExpiring?: boolean[];
    /** Under each of `buffs`, its tooltip: the effect's name, then its time left on a second line. */
    buffTips?: string[];
    /** The party member whose frame is selected (their name), the target panel shows them. */
    partySelected: string | null;
    /** The bottom bar's button whose window is open (`nav_inventory`), for its active mark. */
    navOpen: string | null;
    target: (IHudUnit & {cast: IHudCast | null}) | null;
    boss: IHudUnit | null;
    /** The warning under the boss (`Frappe sismique dans 3 seconde(s) !`). */
    alert: string | null;
    chat: IChatLine[];
    /** The chat's tabs, « Général » first; `chatTab` is the open one's id. */
    chatTabs: IChatTab[];
    chatTab: string;
    /** Where what is typed in « Général » goes (the bubble button). */
    sayChannel: ChatChannel;
    chatSettings: Readonly<IChatSettings>;
}

/** The chat keeps this many lines; older ones scroll away for good. */
export interface IActionSlot
{
    /** Asset name of the icon (`rpg/skills/warrior_skill_icon_1`), null for an empty slot. */
    icon: string | null;
    key: string;
    count?: number;
    cooldownEnd?: number;
    /** Mana cost: the slot greys when the player cannot afford it (hudRules.unavailable()). */
    cost?: number;
    /** Outlined for a moment after its key or a click (hudRules.SELECTED_MS). */
    selected?: boolean;
    /** What its tooltip says (vortex_hud_slot_tip_xml); none: no tooltip. */
    tip?: ISlotTip;
}

/** The tooltip of a slot: a skill (tag, cost and cooldown, effect) or a consumable (quantity). */
export interface ISlotTip
{
    title: string;
    /** The pill at the right (« Attaque », « Soin »), empty for none. */
    tag: string;
    /** Under the title: rank, cost, cooldown, or the quantity. */
    meta: string;
    text: string;
    /** The highlighted line (an effect), empty for none. */
    effect: string;
    shortcut: string;
}

/**
 * What the HUD shows of the player (RPG spec §16.3: portrait, level, HP, mana, XP, action bar).
 * Null is "not known yet": the server sends these (stats are server-side, §5.2), the client never
 * makes them up — until the RPG network exists (F3) only the dev hook fills them.
 */
export interface IPlayerHud
{
    name: string;
    figure: string;
    level: number | null;
    hp: number | null;
    hpMax: number | null;
    mana: number | null;
    manaMax: number | null;
    xp: number | null;
    xpMax: number | null;
    /** Shown on the XP bar instead of "xp / max" (e.g. MAX at the maximum level). */
    xpLabel?: string | null;
    /** In combat (M1a §6.3): the frame turns red. */
    inCombat?: boolean;
    skills: IActionSlot[];
    items: IActionSlot[];
}

export type ActionBar = 'skills' | 'items';

/** Width of a bar's fill: proportional, clamped, empty while the maximum is unknown or zero. */
/** The skill slots of the bottom bar: keys 1–6. */
export const SKILL_SLOTS = 6;
