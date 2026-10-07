import type {ToolName} from './ToolName';

/** "Outils de sol" of mock-up 3, with their shortcut. */
export const FLOOR_TOOLS: readonly {readonly tool: ToolName; readonly icon: string; readonly label: string; readonly key: string}[] = [
    {tool: 'select', icon: '⬚', label: 'Sélection', key: 'S'},
    {tool: 'tile-add', icon: '🟫', label: 'Ajouter case', key: 'A'},
    {tool: 'tile-remove', icon: '❌', label: 'Supprimer case', key: 'D'},
    {tool: 'raise', icon: '⬆️', label: 'Monter (+1)', key: 'R'},
    {tool: 'lower', icon: '⬇️', label: 'Descendre (−1)', key: 'F'},
    {tool: 'rect', icon: '▭', label: 'Rectangle', key: 'C'},
    {tool: 'fill', icon: '🪣', label: 'Remplir', key: 'B'},
    {tool: 'block', icon: '⛔', label: 'Non marchable (Maj : marchable)', key: 'W'},
    {tool: 'door', icon: '🚪', label: 'Porte', key: 'P'},
    {tool: 'spawn', icon: '📍', label: 'Spawn joueur', key: 'J'}
];
