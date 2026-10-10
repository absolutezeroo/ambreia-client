import type {LayerKey} from '@ambreia/map-editor-core/zone/LayerKey';
import type {ZoneDocument} from '@ambreia/map-editor-core/zone/Zone.generated';
import {AREA_KINDS} from '../forms/AREA_KINDS';
import {ENTRY_KINDS} from '../forms/ENTRY_KINDS';

const label = (options: readonly (readonly [string, string])[], value: string) => options.find(o => o[0] === value)?.[1] ?? value;

/**
 * An element's line in a list: title, detail, and whether it is complete enough to play (a
 * spawn with no monster, a passage with no destination… show an orange dot).
 */
export function describeElement(
    layer: LayerKey,
    element: Record<string, unknown>,
    doc: ZoneDocument,
    /** A monster id's French name (monsterLabels.monsterName()). */
    monster: (id: string) => string = id => id
): {title: string; sub: string; complete: boolean}
{
    const id = String(element.id);
    const at = (c: unknown) =>
    {
        const cell = (c ?? null) as {x?: number; y?: number} | null;

        return cell ? `(${cell.x ?? 0}, ${cell.y ?? 0})` : '';
    };
    const length = (list: unknown) => Array.isArray(list) ? list.length : 0;
    const count = (cells: unknown) => `${length(cells)} cases`;

    switch(layer)
    {
        case 'npcs': return {title: String(element.name || id), sub: `${element.template || 'modèle ?'} - ${at(element.cell)}`, complete: !!element.template};
        case 'spawns': return {title: id, sub: `${element.monster ? monster(String(element.monster)) : 'monstre ?'} x${element.min ?? 1}-${element.max ?? 1} - ${count(element.area)}`, complete: !!element.monster};
        case 'zones': return {title: String(element.name || id), sub: `${label(AREA_KINDS, String(element.kind))} - priorité ${element.priority ?? 0}`, complete: true};
        case 'entries': return {title: id, sub: `${label(ENTRY_KINDS, String(element.kind))} - ${at(element.cell)}`, complete: true};
        case 'passages': return {
            title: id,
            sub: `vers ${element.destinationZone || '?'} / ${element.destinationEntry || '?'}`,
            complete: !!element.destinationZone && !!element.destinationEntry
        };
        case 'triggers':
        {
            const target = String(element.target ?? '');
            // The triggers the server runs need their target: an area, a mobi, or a period.
            const needsTarget = ['EnterZone', 'LeaveZone', 'Interact', 'Timer'].includes(String(element.type));
            const known = target
                ? doc.zones?.some(z => z.id === target) || doc.decor?.some(d => d.id === target) || !Number.isNaN(Number(target))
                : !needsTarget;

            return {
                title: id,
                sub: `${element.type} ${target ? `-> ${target}` : ''} - ${length(element.actions)} action(s)`,
                complete: element.active !== false && known && length(element.actions) > 0
            };
        }
        case 'resources': return {title: id, sub: `${element.template || 'modèle ?'} - ${at(element.cell)}`, complete: !!element.template};
        case 'chests': return {title: id, sub: `${element.decor || 'mobi ?'} - ${element.lootTable || 'butin ?'}`, complete: !!element.decor};
        case 'interactives': return {title: id, sub: `${element.interaction} - ${element.decor || 'mobi ?'}`, complete: !!element.decor};
        case 'bosses': return {title: id, sub: `${element.encounter || 'rencontre ?'} - arène ${count(element.arena)}`, complete: !!element.encounter};
        case 'events': return {title: id, sub: `${element.definition || 'définition ?'} - ${count(element.area)}`, complete: !!element.definition};
        default: return {title: id, sub: '', complete: true};
    }
}
