/**
 * The server's ZoneType values as the zone browser shows them: label, icon (the owner's side
 * panels' own), and the side panels' captions that mean that type. A caption no type claims
 * (Ville, Événement, Quête / PNJ…) has no field behind it yet.
 */
export const ZONE_TYPES: Readonly<Record<string, {readonly text: string; readonly icon: string; readonly labels: readonly string[]}>> = {
    World: {
        text: 'vortex.mapeditor.zonetype.World',
        icon: 'map_markers_tree_forest_icon',
        labels: ['vortex.mapeditor.zonetype.World', 'vortex.mapeditor.browser.kind.outdoor', 'vortex.mapeditor.browser.group.forest_nature']
    },
    Dungeon: {
        text: 'vortex.dungeon.finder.dungeon',
        icon: 'map_markers_cave_cavern_enterance_exit_icon',
        labels: ['vortex.dungeon.finder.dungeon', 'vortex.dungeon.tab.dungeons']
    },
    Lobby: {
        text: 'vortex.mapeditor.zonetype.Lobby',
        icon: 'map_markers_buildings_houses_homes_village_town_icon',
        labels: []
    },
    Housing: {
        text: 'vortex.mapeditor.zonetype.Housing',
        icon: 'map_markers_building_home_house_icon',
        labels: ['vortex.mapeditor.browser.kind.interior', 'vortex.mapeditor.browser.group.house_interior', 'vortex.mapeditor.browser.group.interiors']
    },
    Guild: {
        text: 'vortex.character.guild',
        icon: 'map_markers_banner_heraldry_icon',
        labels: ['vortex.character.guild', 'vortex.mapeditor.browser.group.guilds']
    },
    Arena: {
        text: 'vortex.mapeditor.zonetype.Arena',
        icon: 'rpg_crossed_swords_duel_pvp_combat_battle_war_icon',
        labels: ['vortex.mapeditor.zonetype.Arena', 'vortex.mapeditor.browser.group.arena_pvp']
    }
};
