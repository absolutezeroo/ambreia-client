import type {LayerItem} from '@ambreia/map-editor-core/zone/LayerItem';
import type {LayerKey} from '@ambreia/map-editor-core/zone/LayerKey';
import type {ZoneCell} from '@ambreia/map-editor-core/zone/Zone.generated';
import type {EditorApp} from '../../app/EditorApp';
import {DIRECTIONS} from './DIRECTIONS';
import {ENTRY_KINDS} from './ENTRY_KINDS';
import type {IFieldSpec} from './IFieldSpec';
import {AREA_KINDS} from './AREA_KINDS';

type Form = {readonly title: string; readonly hint: string; readonly fields: IFieldSpec[]};

const num = (v: string | number | boolean) => Number(v);
const str = (v: string | number | boolean) => String(v).trim();
const cellText = (c?: ZoneCell) => c ? `(${c.x ?? 0}, ${c.y ?? 0})` : '—';

/**
 * The form of one element of a world layer that has no layout of its own: entries, passages,
 * areas, resources, chests, interactives, boss arenas and events. Each field writes one property
 * through the generic layer commands (one undo step each).
 */
export function elementForm(app: EditorApp, layer: LayerKey): Form | null
{
    const world = app.world;
    const id = world.element?.layer === layer ? world.element.id : null;
    const decorOptions = (): (readonly [string, string])[] => [['', '—'], ...(app.doc.decor ?? []).map(d => [d.id, `${d.id} (${d.class})`] as const)];
    const zoneOptions = (): (readonly [string, string])[] => app.zones.map(z => [z.key, `${z.name} (${z.key})`] as const);
    const set = <K extends LayerKey>(l: K, patch: Partial<LayerItem<K>>) => world.update(l, patch);
    const common = (e: {id: string}): IFieldSpec[] => [{kind: 'text', label: 'Id', get: () => e.id, readOnly: true}];

    if(!id) return {title: 'Aucun élément', hint: 'Choisissez un élément dans la liste, ou « Ajouter » puis un clic dans la vue.', fields: []};

    switch(layer)
    {
        case 'entries':
        {
            const e = world.current('entries');

            return e && {
                title: `Entrée ${e.id}`,
                hint: 'Où arrive un joueur : « arrivée » est l\'entrée par défaut de la zone ; un passage ou un téléporteur vise une entrée par son id.',
                fields: [
                    ...common(e),
                    {kind: 'select', label: 'Sorte', get: () => e.kind, set: v => set('entries', {kind: str(v)}), options: ENTRY_KINDS},
                    {kind: 'text', label: 'Case', get: () => cellText(e.cell), readOnly: true},
                    {kind: 'select', label: 'Direction', get: () => String(e.direction ?? 2), set: v => set('entries', {direction: num(v)}), options: DIRECTIONS}
                ]
            };
        }
        case 'passages':
        {
            const e = world.current('passages');

            return e && {
                title: `Passage ${e.id}`,
                hint: 'Marcher sur une case du passage envoie le joueur vers l\'entrée choisie d\'une zone. Dessinez ses cases au rectangle ou au polygone.',
                fields: [
                    ...common(e),
                    {kind: 'text', label: 'Cases', get: () => String(e.area.length), readOnly: true},
                    {kind: 'select', label: 'Zone d\'arrivée', get: () => e.destinationZone, set: v => set('passages', {destinationZone: str(v)}), options: zoneOptions()},
                    {kind: 'text', label: 'Entrée d\'arrivée', get: () => e.destinationEntry, set: v => set('passages', {destinationEntry: str(v)})},
                    {kind: 'check', label: 'Fondu au noir', get: () => !!e.fade, set: v => set('passages', {fade: !!v})},
                    {kind: 'number', label: 'Attente (s)', get: () => e.cooldownSeconds ?? 0, set: v => set('passages', {cooldownSeconds: num(v)}), min: 0, max: 3600}
                ]
            };
        }
        case 'zones':
        {
            const e = world.current('zones');

            return e && {
                title: `Aire ${e.name || e.id}`,
                hint: 'Une aire de jeu (sûre, PvP, quartier…) dessinée au rectangle ou au polygone. La plus haute priorité gagne là où des aires se chevauchent.',
                fields: [
                    ...common(e),
                    {kind: 'text', label: 'Nom affiché', get: () => e.name ?? '', set: v => set('zones', {name: str(v)})},
                    {kind: 'select', label: 'Sorte', get: () => e.kind, set: v => set('zones', {kind: str(v)}), options: AREA_KINDS},
                    {kind: 'number', label: 'Priorité', get: () => e.priority ?? 0, set: v => set('zones', {priority: num(v)}), min: -100, max: 100},
                    {kind: 'number', label: 'Niveau conseillé', get: () => e.recommendedLevel ?? 0, set: v => set('zones', {recommendedLevel: num(v)}), min: 0, max: 200},
                    {kind: 'text', label: 'Musique', get: () => e.music ?? '', set: v => set('zones', {music: str(v) || undefined})},
                    {kind: 'text', label: 'Tags', get: () => (e.tags ?? []).join(', '), set: v => set('zones', {tags: str(v).split(',').map(t => t.trim()).filter(Boolean)})},
                    {kind: 'text', label: 'Points', get: () => String(e.polygon.length), readOnly: true}
                ]
            };
        }
        case 'resources':
        {
            const e = world.current('resources');

            return e && {
                title: `Ressource ${e.id}`,
                hint: 'Un point de récolte, lié de préférence au mobi qui le montre. Son effet arrive avec les métiers (RPG).',
                fields: [
                    ...common(e),
                    {kind: 'text', label: 'Modèle', get: () => e.template, set: v => set('resources', {template: str(v)})},
                    {kind: 'select', label: 'Mobi', get: () => e.decor ?? '', set: v => set('resources', {decor: str(v) || null}), options: decorOptions()},
                    {kind: 'text', label: 'Métier', get: () => e.profession ?? '', set: v => set('resources', {profession: str(v) || null})},
                    {kind: 'number', label: 'Niveau', get: () => e.level ?? 0, set: v => set('resources', {level: num(v)}), min: 0, max: 200},
                    {kind: 'number', label: 'Repousse (s)', get: () => e.respawnSeconds ?? 0, set: v => set('resources', {respawnSeconds: num(v)}), min: 0, max: 86400}
                ]
            };
        }
        case 'chests':
        {
            const e = world.current('chests');

            return e && {
                title: `Coffre ${e.id}`,
                hint: 'Un coffre est un mobi de la zone ; son butin arrive avec le système d\'objets (RPG).',
                fields: [
                    ...common(e),
                    {kind: 'select', label: 'Mobi', get: () => e.decor, set: v => set('chests', {decor: str(v)}), options: decorOptions()},
                    {kind: 'text', label: 'Table de butin', get: () => e.lootTable, set: v => set('chests', {lootTable: str(v)})},
                    {kind: 'number', label: 'Réapparition (s)', get: () => e.respawnSeconds ?? 0, set: v => set('chests', {respawnSeconds: num(v)}), min: 0, max: 86400},
                    {kind: 'check', label: 'Un par joueur', get: () => !!e.perPlayer, set: v => set('chests', {perPlayer: !!v})}
                ]
            };
        }
        case 'interactives':
        {
            const e = world.current('interactives');

            return e && {
                title: `Interactif ${e.id}`,
                hint: 'Ce que fait un mobi quand un joueur l\'utilise : porte, levier, panneau, téléporteur. Un trigger « Interaction » peut l\'écouter.',
                fields: [
                    ...common(e),
                    {kind: 'select', label: 'Mobi', get: () => e.decor, set: v => set('interactives', {decor: str(v)}), options: decorOptions()},
                    {kind: 'select', label: 'Effet', get: () => e.interaction, set: v => set('interactives', {interaction: str(v)}),
                        options: [['door', 'Porte'], ['lever', 'Levier'], ['sign', 'Panneau'], ['teleport', 'Téléporteur']]}
                ]
            };
        }
        case 'bosses':
        {
            const e = world.current('bosses');

            return e && {
                title: `Boss ${e.id}`,
                hint: 'Les repères d\'une rencontre : l\'arène (rectangle ou polygone), l\'apparition du boss. La rencontre elle-même arrive avec le RPG.',
                fields: [
                    ...common(e),
                    {kind: 'text', label: 'Rencontre', get: () => e.encounter, set: v => set('bosses', {encounter: str(v)})},
                    {kind: 'text', label: 'Arène (cases)', get: () => String(e.arena.length), readOnly: true},
                    {kind: 'text', label: 'Apparition', get: () => cellText(e.spawn), readOnly: true}
                ]
            };
        }
        case 'events':
        {
            const e = world.current('events');

            return e && {
                title: `Événement ${e.id}`,
                hint: 'Le terrain d\'un événement du monde ; sa définition arrive avec le RPG.',
                fields: [
                    ...common(e),
                    {kind: 'text', label: 'Définition', get: () => e.definition, set: v => set('events', {definition: str(v)})},
                    {kind: 'number', label: 'Durée (s)', get: () => e.durationSeconds ?? 0, set: v => set('events', {durationSeconds: num(v)}), min: 0, max: 86400},
                    {kind: 'number', label: 'Attente (s)', get: () => e.cooldownSeconds ?? 0, set: v => set('events', {cooldownSeconds: num(v)}), min: 0, max: 86400}
                ]
            };
        }
        default:
            return null;
    }
}
