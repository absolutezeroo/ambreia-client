import type {Category} from '../../app/Category';

/** The text of each category, the same keys the rail rows of the owner's layout use. */
export const CATEGORY_LABEL_KEYS: Readonly<Record<Category, string>> = {
    floor: 'vortex.mapeditor.layer.floor',
    walls: 'vortex.mapeditor.layer.walls',
    decor: 'vortex.mapeditor.layer.decor',
    entries: 'vortex.mapeditor.layer.entries',
    passages: 'vortex.mapeditor.layer.passages',
    zones: 'vortex.mapeditor.layer.zones',
    npcs: 'vortex.mapeditor.layer.npcs',
    spawns: 'vortex.mapeditor.layer.spawns',
    resources: 'vortex.market.category.resources',
    chests: 'vortex.mapeditor.layer.chests',
    interactives: 'vortex.mapeditor.layer.interactives',
    bosses: 'vortex.hud.boss',
    events: 'vortex.guild.channel.events',
    triggers: 'vortex.mapeditor.layer.triggers',
    ambience: 'vortex.mapeditor.layer.ambience',
    settings: 'vortex.guild.tab.settings',
    items: 'vortex.mapeditor.content.rail.items',
    vfx: 'vortex.mapeditor.content.rail.vfx',
    sfx: 'vortex.mapeditor.content.rail.sfx',
    quests: 'vortex.mapeditor.content.rail.quests'
};
