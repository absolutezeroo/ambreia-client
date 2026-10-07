import type {IWindow} from '@ambreia/ui/IWindow';
import {editTiles} from '@ambreia/map-editor-core/commands/editTiles';
import {moveDoor} from '@ambreia/map-editor-core/commands/moveDoor';
import {updateSettings} from '@ambreia/map-editor-core/commands/updateSettings';
import type {ZoneCell, ZoneTile, ZoneType} from '@ambreia/map-editor-core/zone/Zone.generated';
import {tileAt} from '@ambreia/map-editor-core/zone/zoneGeometry';
import type {EditorApp} from '../../app/EditorApp';
import {CheckBinding, child, ChoiceBinding, NumberBinding, setEnabled, TextBinding} from '../bind';
import type {EditorTexts} from '../EditorTexts';
import type {IPanelUi} from '../IPanelUi';
import {MUSIC} from './MUSIC';
import {TileZoneChoice} from './TileZoneChoice';
import {REGIONS} from './REGIONS';
import {WEATHER} from './WEATHER';

const TYPES: readonly ZoneType[] = ['World', 'Dungeon', 'Lobby', 'Housing', 'Guild', 'Arena'];

/**
 * "Propriétés de la case" and "Paramètres de la zone" (vortex_map_editor_inspect_tile_xml): the
 * selected cells (height, walkable, hole, door, area, note) and the zone's own settings.
 */
export class TileInspectorUi implements IPanelUi
{
    private readonly _parts: {render(): void}[];
    private readonly _tileFields: string[] = ['tile_height', 'tile_walkable', 'tile_hole', 'tile_door', 'tile_zone', 'tile_note'];

    constructor(private readonly _window: IWindow, private readonly _app: EditorApp, texts: EditorTexts)
    {
        const app = _app;
        const cells = () => app.selection.cells;
        const first = (): ZoneTile => tileAt(app.doc.floor, cells()[0]?.x ?? 0, cells()[0]?.y ?? 0) ?? {};
        const edit = (label: string, change: (t: ZoneTile) => ZoneTile) => app.execute(editTiles(label, cells(), change));
        const settings = () => app.doc.settings;
        const set = (patch: Parameters<typeof updateSettings>[0]) => app.execute(updateSettings(patch));
        const none = texts.get('vortex.mapeditor.field.none');

        this._parts = [
            new NumberBinding(_window, 'tile_x', () => cells()[0]?.x ?? 0, () => undefined),
            new NumberBinding(_window, 'tile_y', () => cells()[0]?.y ?? 0, () => undefined),
            new NumberBinding(_window, 'tile_height', () => first().height ?? 0, h => edit(`Hauteur ${h}`, t => ({...t, height: h})), 0, 32),
            new CheckBinding(_window, 'tile_walkable', () => first().walkable !== false, on => edit(on ? 'Rendre marchable' : 'Bloquer', t => ({...t, walkable: on}))),
            new CheckBinding(_window, 'tile_hole', () => !!first().hole, on => edit(on ? 'Creuser' : 'Boucher', t => ({...t, hole: on}))),
            new CheckBinding(_window, 'tile_door', () => this.isDoor(cells()[0] ?? null), on => on && cells()[0] && app.execute(moveDoor(cells()[0].x ?? 0, cells()[0].y ?? 0))),
            new TileZoneChoice(_window, app, none, () => first().zone ?? '', zone => edit('Aire de la case', t => ({...t, zone: zone || null}))),
            new TextBinding(_window, 'tile_note', () => first().note ?? '', note => edit('Note de la case', t => ({...t, note: note.trim() || null}))),

            new TextBinding(_window, 'zone_id', () => settings().id, () => undefined),
            new TextBinding(_window, 'zone_name', () => settings().name, name => name.trim() && set({name: name.trim()})),
            new ChoiceBinding(_window, 'zone_region', () => settings().region ?? '', region => set({region: region || undefined}))
                .options([['', none], ...REGIONS.map(r => [r, r] as const)]),
            new ChoiceBinding<ZoneType>(_window, 'zone_type', () => settings().type ?? 'World', type => set({type}))
                .options(TYPES.map(t => [t, texts.has(`vortex.mapeditor.zonetype.${t}`) ? texts.get(`vortex.mapeditor.zonetype.${t}`) : t] as const)),
            new NumberBinding(_window, 'zone_capacity', () => settings().capacity ?? 50, capacity => set({capacity}), 1, 500),
            new NumberBinding(_window, 'zone_level', () => settings().recommendedLevel ?? 1, recommendedLevel => set({recommendedLevel}), 1, 200),
            new ChoiceBinding(_window, 'zone_music', () => settings().music ?? '', music => set({music: music || undefined}))
                .options([['', none], ...MUSIC.map(m => [m, m] as const)]),
            new ChoiceBinding(_window, 'zone_weather', () => settings().weather ?? '', weather => set({weather: weather || undefined}))
                .options([['', none], ...WEATHER]),
            new CheckBinding(_window, 'zone_pvp', () => !!settings().pvpAllowed, pvpAllowed => set({pvpAllowed}))
        ];
    }

    render(): void
    {
        const hasCells = this._app.selection.cells.length > 0;

        for(const name of this._tileFields) setEnabled(child(this._window, name), hasCells);
        for(const part of this._parts) part.render();
    }

    private isDoor(cell: ZoneCell | null): boolean
    {
        const door = this._app.doc.floor.door;

        return !!cell && (door.x ?? 0) === cell.x && (door.y ?? 0) === cell.y;
    }
}
