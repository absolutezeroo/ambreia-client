import type {IRpgItemEntry} from '@ambreia/protocol/incoming/rpg/items/IRpgItemEntry';
import type {IRpgStatBlock} from '@ambreia/protocol/incoming/rpg/characters/IRpgStatBlock';

/**
 * The equipment slots by their server number (Objets §17.3): the index is the slot sent in
 * RpgItemUnequip and received in RpgInventory, the value the `slot_<key>` of
 * vortex_character_sheet_xml.
 */
export const EQUIPMENT_SLOTS = ['head', 'chest', 'legs', 'feet', 'hands', 'weapon', 'offhand', 'neck', 'ring1', 'ring2'] as const;

/** The inventory window's tabs, by the name of their tab_button (vortex_inventory_xml). */
export type InventoryTab = 'tab_equipment' | 'tab_items' | 'tab_resources' | 'tab_quests';

const EQUIPMENT_KINDS = new Set(['head', 'chest', 'legs', 'feet', 'hands', 'weapon', 'offhand', 'neck', 'ring']);

/**
 * The kind of a definition, read from its id (`item.weapon.rusted_sword` → `weapon`).
 * ponytail: RpgInventory carries no category, and the content ids follow `item.<kind>.<name>`;
 * read the category from the content once the server sends definitions.
 */
export function itemKind(definitionId: string): string
{
    return definitionId.split('.')[1] ?? '';
}

/** The tab an item is listed under: equipment, resources (materials), quests, the rest under items. */
export function itemTab(definitionId: string): InventoryTab
{
    const kind = itemKind(definitionId);

    if(EQUIPMENT_KINDS.has(kind)) return 'tab_equipment';
    if(kind === 'material') return 'tab_resources';
    if(kind === 'quest') return 'tab_quests';

    return 'tab_items';
}

export function isEquipment(definitionId: string): boolean
{
    return EQUIPMENT_KINDS.has(itemKind(definitionId));
}

const ICONS: Readonly<Record<string, string>> = {
    'item.weapon.rusted_sword': 'rpg/weapons/icon_00',
    'item.weapon.short_bow': 'rpg/weapons/icon_08',
    'item.weapon.apprentice_staff': 'rpg/weapons/icon_24',
    'item.weapon.oak_mace': 'rpg/weapons/icon_20',
    'item.offhand.wooden_shield': 'rpg/armor/icon_07',
    'item.head.leather_cap': 'rpg/armor/icon_01',
    'item.chest.padded_vest': 'rpg/armor/icon_10',
    'item.legs.cloth_trousers': 'rpg/armor/icon_35',
    'item.feet.worn_boots': 'rpg/armor/icon_16',
    'item.hands.work_gloves': 'rpg/armor/icon_22',
    'item.neck.amber_pendant': 'rpg/fish-loot/icon_25',
    'item.ring.copper_ring': 'rpg/gems-materials/icon_19',
    'item.material.amber_shard': 'rpg/gems-materials/icon_07',
    'item.consumable.minor_potion': 'rpg/consumables-potions/icon_00',
    'item.quest.sealed_letter': 'rpg/fish-loot/icon_35',
    'item.furniture.amber_throne': 'rpg/fish-loot/icon_45'
};

const KIND_ICONS: Readonly<Record<string, string>> = {
    weapon: 'rpg/weapons/icon_00', offhand: 'rpg/armor/icon_04', head: 'rpg/armor/icon_01', chest: 'rpg/armor/icon_08',
    legs: 'rpg/armor/icon_32', feet: 'rpg/armor/icon_16', hands: 'rpg/armor/icon_22', neck: 'rpg/fish-loot/icon_25',
    ring: 'rpg/gems-materials/icon_19', material: 'rpg/gems-materials/icon_08', consumable: 'rpg/consumables-potions/icon_00',
    quest: 'rpg/fish-loot/icon_37'
};

const DEFAULT_ICON = 'rpg/fish-loot/icon_45';

/**
 * The icon of a definition: its own, else its kind's, else a chest.
 * ponytail: the content has no icon in V1 (Objets §17.3, "the client shows the name"); the name
 * shows as the slot's tooltip and in the details. Move this table into the content when items get one.
 */
export function itemIcon(definitionId: string): string
{
    return ICONS[definitionId] ?? KIND_ICONS[itemKind(definitionId)] ?? DEFAULT_ICON;
}

/** Every icon itemIcon() can return: set at run time, so decoded at load (IGameFeature.images). */
export const ITEM_ICONS: readonly string[] = [...new Set([...Object.values(ICONS), ...Object.values(KIND_ICONS), DEFAULT_ICON])];

/** A line of a stat list: its text key, icon and colour, and how to read its value. */
export interface IStatLine
{
    key: string;
    icon: string;
    color: number;
    value(stats: IRpgStatBlock): string;
}

const UI = 'rpg/ui-icons/';
/** 620 basis points → `6.2 %`. */
const percent = (basisPoints: number): string => `${Number((basisPoints / 100).toFixed(1))} %`;

export const STATS = {
    strength: {key: 'vortex.stat.strength', icon: `${UI}rpg_stat_strength_fist_melee_attack_icon`, color: 0xe09a60, value: s => String(s.strength)},
    agility: {key: 'vortex.stat.agility', icon: `${UI}rpg_stat_dexterity_agility_boots_movement_speed_icon`, color: 0xc08850, value: s => String(s.agility)},
    intelligence: {key: 'vortex.stat.intelligence', icon: `${UI}rpg_stat_intelligence_intellect_brain_wisdom_thinking_iq_icon`, color: 0xe070a0, value: s => String(s.intelligence)},
    power: {key: 'vortex.stat.power', icon: `${UI}rpg_crossed_swords_duel_pvp_combat_battle_war_icon`, color: 0xd06040, value: s => String(s.power)},
    critical: {key: 'vortex.stat.critical_chance', icon: `${UI}rpg_stat_accuracy_ranged_target_icon`, color: 0xe0b030, value: s => percent(s.critBp)},
    armor: {key: 'vortex.stat.armor', icon: `${UI}boardgames_card_defense_shield_icon`, color: 0x5080c0, value: s => String(s.armor)},
    dodge: {key: 'vortex.stat.dodge', icon: `${UI}rpg_stat_luck_four_leaf_clover_icon`, color: 0x50a050, value: s => percent(s.dodgeBp)},
    speed: {key: 'vortex.stat.move_speed', icon: `${UI}rpg_stat_dexterity_agility_boots_movement_speed_icon`, color: 0x8080a0, value: s => `${s.speedPercent} %`},
    health: {key: 'vortex.stat.health', icon: `${UI}rpg_stat_hp_health_heart_icon`, color: 0xe03030, value: s => String(s.maxHealth)},
    mana: {key: 'vortex.stat.mana', icon: `${UI}rpg_stat_mp_mana_star_icon`, color: 0x3080e0, value: s => String(s.maxMana)}
} satisfies Record<string, IStatLine>;

export const STAT_ICONS: readonly string[] = [...new Set(Object.values(STATS).map(line => line.icon))];

/**
 * The cases of a tab, in bag order: its items that `matches` keeps (the search), then the bag's
 * free cases (null), as the mock-ups fill the grid.
 */
export function bagView(items: readonly IRpgItemEntry[], bagSize: number, tab: InventoryTab, matches: (item: IRpgItemEntry) => boolean): Array<IRpgItemEntry | null>
{
    const bag = items.filter(item => item.container === 0).sort((a, b) => a.slot - b.slot);
    const free = Math.max(0, bagSize - bag.length);

    return [...bag.filter(item => itemTab(item.definitionId) === tab && matches(item)), ...new Array<null>(free).fill(null)];
}

/** `key=value` lines, as the server's content texts come (`/api/public/content/texts/{language}`). */
export function parseTexts(body: string): Record<string, string>
{
    const texts: Record<string, string> = {};

    for(const line of body.split(/\r?\n/))
    {
        const at = line.indexOf('=');

        if(at > 0 && !line.startsWith('#')) texts[line.slice(0, at).trim()] = line.slice(at + 1).trim();
    }

    return texts;
}
