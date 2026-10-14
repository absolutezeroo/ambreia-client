import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {ZoneCondition, ZoneNpc} from '@ambreia/map-editor-core/zone/Zone.generated';
import type {EditorApp} from '../../app/EditorApp';
import {CheckBinding, child, ChoiceBinding, NumberBinding, setEnabled, setText, TextBinding} from '../bind';
import type {EditorTexts} from '../EditorTexts';
import {DIRECTIONS} from '../forms/DIRECTIONS';
import {RuleListUi} from '../forms/RuleListUi';
import type {IPanelUi} from '../IPanelUi';
import {contentOptions} from './contentLabels';

const SERVICES = ['talk', 'shop', 'quest', 'bank', 'teleport'] as const;
const ANIMATIONS: readonly (readonly [string, string])[] = [['', 'Aucune'], ['idle', 'Repos'], ['wave', 'Salue'], ['sit', 'Assis'], ['dance', 'Danse']];
const ICONS: readonly (readonly [string, string])[] = [['', 'Aucune'], ['talk', 'Bulle'], ['quest', 'Quête'], ['shop', 'Boutique'], ['bank', 'Banque']];
const FIELDS = [
    'npc_template', 'npc_name', 'npc_look', 'npc_x', 'npc_y', 'npc_rotation', ...SERVICES.map(s => `npc_${s}`),
    'npc_dialogue', 'npc_animation', 'npc_icon', 'add_condition'
];

/**
 * "Propriétés du PNJ" (vortex_map_editor_inspect_npc_xml): the selected NPC's template, name,
 * look, place, direction, services, dialogue, animation, icon and the conditions it appears under.
 * Dialogues are chosen from the content (M2a §5); templates and looks stay typed ids until their
 * systems exist (RPG).
 */
export class NpcInspectorUi implements IPanelUi
{
    private readonly _parts: {render(): void}[];
    private readonly _conditions: RuleListUi<ZoneCondition>;
    private readonly _dialogue: ChoiceBinding<string>;

    constructor(private readonly _window: IWindow, private readonly _app: EditorApp, texts: EditorTexts, build: (layout: string) => IWindow | null)
    {
        const app = _app;
        const npc = (): ZoneNpc | null => app.world.current('npcs');
        const set = (patch: Partial<ZoneNpc>) => app.world.update('npcs', patch);
        const services = () => npc()?.interactions ?? [];

        this._dialogue = new ChoiceBinding(_window, 'npc_dialogue', () => npc()?.dialogue ?? '', dialogue => set({dialogue: dialogue || null}));

        this._parts = [
            new TextBinding(_window, 'npc_template', () => npc()?.template ?? '', template => set({template: template.trim()})),
            new TextBinding(_window, 'npc_name', () => npc()?.name ?? '', name => set({name: name.trim() || null})),
            new TextBinding(_window, 'npc_look', () => npc()?.look ?? '', look => set({look: look.trim() || null})),
            new NumberBinding(_window, 'npc_x', () => npc()?.cell.x ?? 0, x => set({cell: {...npc()!.cell, x}}), 0, app.doc.floor.width - 1),
            new NumberBinding(_window, 'npc_y', () => npc()?.cell.y ?? 0, y => set({cell: {...npc()!.cell, y}}), 0, app.doc.floor.length - 1),
            new ChoiceBinding(_window, 'npc_rotation', () => String(npc()?.rotation ?? 2), r => set({rotation: Number(r)})).options(DIRECTIONS),
            ...SERVICES.map(service => new CheckBinding(_window, `npc_${service}`, () => services().includes(service),
                on => set({interactions: on ? [...services(), service] : services().filter(s => s !== service)}))),
            this._dialogue,
            new ChoiceBinding(_window, 'npc_animation', () => npc()?.animation ?? '', animation => set({animation: animation || null})).options(ANIMATIONS),
            new ChoiceBinding(_window, 'npc_icon', () => npc()?.icon ?? '', icon => set({icon: icon || null})).options(ICONS)
        ];

        this._conditions = new RuleListUi<ZoneCondition>(child<IItemListWindow>(_window, 'condition_list'), app, texts, 'conditions', build,
            () => npc()?.appearWhen ?? [], appearWhen => set({appearWhen}));
        this._conditions.bindAdd(_window, 'add_condition');

        // Templates and looks come from systems that do not exist yet (RPG): typed ids.
        for(const name of ['npc_template_choose', 'npc_look_choose']) setEnabled(child(_window, name), false);
    }

    render(): void
    {
        const npc = this._app.world.current('npcs');

        for(const name of FIELDS) setEnabled(child(this._window, name), !!npc);
        setText(this._window, 'npc_title', npc ? npc.name || npc.id : 'Aucun PNJ sélectionné');
        setText(this._window, 'npc_id', npc ? npc.id : 'Choisissez un PNJ dans la liste.');
        setText(this._window, 'npc_faction', '');
        setText(this._window, 'npc_state_txt', npc ? (npc.template ? 'Prêt' : 'À compléter') : '');

        this._dialogue.options([['', 'Aucun'], ...contentOptions(this._app.dialogues, [npc?.dialogue ?? ''], this._app.texts)]);
        for(const part of this._parts) part.render();
        this._conditions.render();
    }
}
