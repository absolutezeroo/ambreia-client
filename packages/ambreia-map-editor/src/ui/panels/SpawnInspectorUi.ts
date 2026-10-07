import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {ZoneCondition, ZoneSpawn} from '@ambreia/map-editor-core/zone/Zone.generated';
import type {EditorApp} from '../../app/EditorApp';
import {CheckBinding, child, ChoiceBinding, NumberBinding, setEnabled, setText, TextBinding} from '../bind';
import type {EditorTexts} from '../EditorTexts';
import {RuleListUi} from '../forms/RuleListUi';
import type {IPanelUi} from '../IPanelUi';
import {MONSTERS} from './MONSTERS';

const FIELDS = [
    'spawn_monster', 'spawn_min', 'spawn_max', 'spawn_respawn', 'spawn_wander', 'spawn_aggro', 'spawn_level_min',
    'spawn_level_max', 'spawn_group', 'spawn_aoi', 'add_condition'
];

/**
 * "Propriétés du spawn" (vortex_map_editor_inspect_spawn_xml): the monster, how many, how often,
 * how far it wanders and aggroes, its levels, its group, AOI activation and its conditions. Saved
 * and validated now; monsters come alive with the RPG.
 */
export class SpawnInspectorUi implements IPanelUi
{
    private readonly _parts: {render(): void}[];
    private readonly _monster: ChoiceBinding<string>;
    private readonly _conditions: RuleListUi<ZoneCondition>;

    constructor(private readonly _window: IWindow, private readonly _app: EditorApp, texts: EditorTexts, build: (layout: string) => IWindow | null)
    {
        const app = _app;
        const spawn = (): ZoneSpawn | null => app.world.current('spawns');
        const set = (patch: Partial<ZoneSpawn>) => app.world.update('spawns', patch);

        this._monster = new ChoiceBinding(_window, 'spawn_monster', () => spawn()?.monster ?? '', monster => set({monster}));
        this._parts = [
            new TextBinding(_window, 'spawn_id', () => spawn()?.id ?? '', () => undefined),
            new NumberBinding(_window, 'spawn_min', () => spawn()?.min ?? 1, min => set({min}), 0, 100),
            new NumberBinding(_window, 'spawn_max', () => spawn()?.max ?? 1, max => set({max}), 0, 100),
            new NumberBinding(_window, 'spawn_respawn', () => spawn()?.respawnSeconds ?? 30, respawnSeconds => set({respawnSeconds}), 0, 86400, 5),
            new NumberBinding(_window, 'spawn_wander', () => spawn()?.wanderRadius ?? 3, wanderRadius => set({wanderRadius}), 0, 64),
            new NumberBinding(_window, 'spawn_aggro', () => spawn()?.aggroRadius ?? 5, aggroRadius => set({aggroRadius}), 0, 64),
            new NumberBinding(_window, 'spawn_level_min', () => spawn()?.levelMin ?? 1, levelMin => set({levelMin}), 1, 200),
            new NumberBinding(_window, 'spawn_level_max', () => spawn()?.levelMax ?? 1, levelMax => set({levelMax}), 1, 200),
            new TextBinding(_window, 'spawn_group', () => spawn()?.group ?? '', group => set({group: group.trim() || null})),
            new CheckBinding(_window, 'spawn_aoi', () => spawn()?.aoiActivation ?? false, aoiActivation => set({aoiActivation}))
        ];
        this._conditions = new RuleListUi<ZoneCondition>(child<IItemListWindow>(_window, 'condition_list'), app, texts, 'conditions', build,
            () => spawn()?.conditions ?? [], conditions => set({conditions}));
        this._conditions.bindAdd(_window, 'add_condition');
    }

    render(): void
    {
        const spawn = this._app.world.current('spawns');
        const used = (this._app.doc.spawns ?? []).map(s => s.monster).filter(Boolean);
        const monsters = [...new Set([...MONSTERS, ...used])];

        for(const name of FIELDS) setEnabled(child(this._window, name), !!spawn);
        setText(this._window, 'spawn_title', spawn ? spawn.id : 'Aucun spawn sélectionné');
        setText(this._window, 'spawn_area', spawn ? `${spawn.area.length} cases - outil Rectangle ou Polygone pour les dessiner` : 'Choisissez un spawn dans la liste.');
        this._monster.options([['', 'Monstre ?'], ...monsters.map(m => [m, m] as const)]).render();
        for(const part of this._parts) part.render();
        this._conditions.render();
    }
}
