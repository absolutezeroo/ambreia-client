import type {ToolName} from './ToolName';

/** Toolbar order, icon, label and shortcut. Shift reverses a floor brush (fill a hole, unblock). */
export const TOOLS: readonly {readonly name: ToolName; readonly icon: string; readonly label: string; readonly key: string}[] = [
    {name: 'select', icon: '⬚', label: 'Sélection — clic, Maj+clic, glisser', key: '1'},
    {name: 'raise', icon: '⬆', label: 'Monter le sol', key: '2'},
    {name: 'lower', icon: '⬇', label: 'Descendre le sol', key: '3'},
    {name: 'hole', icon: '◌', label: 'Trou (Maj : boucher)', key: '4'},
    {name: 'block', icon: '⛔', label: 'Non marchable (Maj : marchable)', key: '5'},
    {name: 'door', icon: '🚪', label: 'Porte', key: '6'},
    {name: 'place', icon: '🪑', label: 'Poser le meuble choisi', key: '7'}
];
