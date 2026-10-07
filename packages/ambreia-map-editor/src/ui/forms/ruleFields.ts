import type {ZoneAction, ZoneCondition} from '@ambreia/map-editor-core/zone/Zone.generated';
import type {EditorApp} from '../../app/EditorApp';
import type {IFieldSpec} from './IFieldSpec';
import {RULE_KINDS} from './RULE_KINDS';

type Rule = ZoneCondition | ZoneAction;

/**
 * The fields of one condition or action: its sort, then the parameters of that sort (the names
 * the owner's texts use: %zone%, %min%…). Changing the sort starts from that sort's defaults.
 */
export function ruleFields(app: EditorApp, family: 'conditions' | 'actions', rule: Rule, commit: (rule: Rule) => void): IFieldSpec[]
{
    const kinds = RULE_KINDS[family];
    const kind = rule.kind ?? kinds[0].kind;
    const r = rule as unknown as Record<string, unknown>;
    const set = (key: string) => (v: string | number | boolean) => commit({...rule, [key]: v} as Rule);
    const text = (key: string, label: string): IFieldSpec => ({kind: 'text', label, get: () => String(r[key] ?? ''), set: set(key)});
    const number = (key: string, label: string, min: number, max: number): IFieldSpec =>
        ({kind: 'number', label, get: () => Number(r[key] ?? 0), set: v => commit({...rule, [key]: Number(v)} as Rule), min, max});
    const choice = (key: string, label: string, options: readonly (readonly [string, string])[]): IFieldSpec =>
        ({kind: 'select', label, get: () => String(r[key] ?? ''), set: set(key), options: [['', '—'], ...options]});
    const areas = (app.doc.zones ?? []).map(z => [z.id, z.name || z.id] as const);
    const decor = (app.doc.decor ?? []).map(d => [d.id, `${d.id} (${d.class})`] as const);
    const zones = app.zones.map(z => [z.key, z.name] as const);
    const spawns = (app.doc.spawns ?? []).map(s => [s.id, s.id] as const);

    const params: IFieldSpec[] = (() =>
    {
        switch(kind)
        {
            case 'PlayerLevel': return [number('min', 'Niveau min', 1, 200), number('max', 'Niveau max', 1, 200)];
            case 'QuestState': return [text('quest', 'Quête'), text('state', 'État')];
            case 'TimeOfDay': return [number('from', 'De (heure)', 0, 23), number('to', 'À (heure)', 0, 23)];
            case 'HasItem': return [text('item', 'Objet'), number('count', 'Nombre', 1, 9999)];
            case 'Faction': return [text('faction', 'Faction')];
            case 'ZoneActive':
            case 'ActivateZone':
            case 'DeactivateZone': return [choice('zone', 'Aire', areas)];
            case 'StartQuest': return [text('quest', 'Quête')];
            case 'ShowDialogue': return [{kind: 'area', label: 'Texte ou clé', get: () => String(r.dialogue ?? ''), set: set('dialogue')}];
            case 'Teleport': return [choice('zone', 'Zone', zones), text('entry', 'Entrée')];
            case 'SpawnGroup': return [choice('spawn', 'Spawn', spawns)];
            case 'PlaySound': return [text('sound', 'Son')];
            case 'OpenDoor': return [choice('decor', 'Mobi', decor)];
            default: return [];
        }
    })();

    return [
        {
            kind: 'select',
            label: 'Sorte',
            get: () => kind,
            set: v => commit({...kinds.find(k => k.kind === v)!.defaults} as unknown as Rule),
            options: kinds.map(k => [k.kind, `${k.label}${k.rpg ? ' (RPG)' : ''}`] as const)
        },
        ...params
    ];
}
