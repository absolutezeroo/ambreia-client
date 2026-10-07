import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {ZoneAction, ZoneCondition, ZoneTrigger, ZoneTriggerType} from '@ambreia/map-editor-core/zone/Zone.generated';
import type {EditorApp} from '../../app/EditorApp';
import {CheckBinding, child, ChoiceBinding, NumberBinding, setEnabled, TextBinding} from '../bind';
import type {EditorTexts} from '../EditorTexts';
import {RuleListUi} from '../forms/RuleListUi';
import type {IPanelUi} from '../IPanelUi';

const TYPES: readonly ZoneTriggerType[] = ['EnterZone', 'LeaveZone', 'Interact', 'Timer', 'MonsterKilled', 'QuestState', 'PlayerLevel', 'ItemOwned'];
/** Triggers the server runs now (plan D11); the others wait for the RPG. */
const LIVE = new Set<ZoneTriggerType>(['EnterZone', 'LeaveZone', 'Interact', 'Timer']);
const PERIODS: readonly (readonly [string, string])[] = [['10', 'Toutes les 10 s'], ['30', 'Toutes les 30 s'], ['60', 'Toutes les minutes'], ['300', 'Toutes les 5 min'], ['3600', 'Toutes les heures']];
const FIELDS = ['trigger_type', 'trigger_target', 'add_condition', 'add_action', 'trigger_cooldown', 'trigger_active', 'trigger_debug'];

/**
 * "Propriétés du trigger" (vortex_map_editor_inspect_trigger_xml): what it listens to (type and
 * target), its conditions, its actions, its cooldown, active, visible in debug.
 */
export class TriggerInspectorUi implements IPanelUi
{
    private readonly _parts: {render(): void}[];
    private readonly _target: ChoiceBinding<string>;
    private readonly _conditions: RuleListUi<ZoneCondition>;
    private readonly _actions: RuleListUi<ZoneAction>;

    constructor(private readonly _window: IWindow, private readonly _app: EditorApp, private readonly _texts: EditorTexts, build: (layout: string) => IWindow | null)
    {
        const app = _app;
        const trigger = (): ZoneTrigger | null => app.world.current('triggers');
        const set = (patch: Partial<ZoneTrigger>) => app.world.update('triggers', patch);
        const typeLabel = (t: ZoneTriggerType) =>
            `${_texts.has(`vortex.mapeditor.trigger.${t}`) ? _texts.get(`vortex.mapeditor.trigger.${t}`) : t}${LIVE.has(t) ? '' : ' (RPG)'}`;

        this._target = new ChoiceBinding(_window, 'trigger_target', () => trigger()?.target ?? '', target => set({target: target || null}));
        this._parts = [
            new TextBinding(_window, 'trigger_id', () => trigger()?.id ?? '', () => undefined),
            new ChoiceBinding<ZoneTriggerType>(_window, 'trigger_type', () => trigger()?.type ?? 'EnterZone', type => set({type, target: null}))
                .options(TYPES.map(t => [t, typeLabel(t)] as const)),
            new NumberBinding(_window, 'trigger_cooldown', () => trigger()?.cooldownMs ?? 0, cooldownMs => set({cooldownMs}), 0, 86_400_000, 500),
            new CheckBinding(_window, 'trigger_active', () => trigger()?.active !== false, active => set({active})),
            new CheckBinding(_window, 'trigger_debug', () => !!trigger()?.visibleInDebug, visibleInDebug => set({visibleInDebug}))
        ];
        this._conditions = new RuleListUi<ZoneCondition>(child<IItemListWindow>(_window, 'condition_list'), app, _texts, 'conditions', build,
            () => trigger()?.conditions ?? [], conditions => set({conditions}));
        this._actions = new RuleListUi<ZoneAction>(child<IItemListWindow>(_window, 'action_list'), app, _texts, 'actions', build,
            () => trigger()?.actions ?? [], actions => set({actions}));
        this._conditions.bindAdd(_window, 'add_condition');
        this._actions.bindAdd(_window, 'add_action');
    }

    render(): void
    {
        const app = this._app;
        const trigger = app.world.current('triggers');

        for(const name of FIELDS) setEnabled(child(this._window, name), !!trigger);
        this._target.options(this.targets(trigger?.type ?? 'EnterZone')).render();
        for(const part of this._parts) part.render();
        this._conditions.render();
        this._actions.render();
    }

    /** What the trigger can listen to: an area for Enter/Leave, a mobi for Interact, a period for Timer. */
    private targets(type: ZoneTriggerType): (readonly [string, string])[]
    {
        const doc = this._app.doc;

        switch(type)
        {
            case 'EnterZone':
            case 'LeaveZone': return [['', 'Aire ?'], ...(doc.zones ?? []).map(z => [z.id, z.name || z.id] as const)];
            case 'Interact': return [['', 'Mobi ?'], ...(doc.decor ?? []).map(d => [d.id, `${d.id} (${d.class})`] as const)];
            case 'Timer': return [['', 'Période ?'], ...PERIODS];
            default: return [['', '(système RPG)']];
        }
    }
}
