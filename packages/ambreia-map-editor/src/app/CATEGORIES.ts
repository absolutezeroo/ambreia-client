import type {Category} from './Category';

/** Rail order, icon and label. The RPG layers (lot B) are listed and greyed until their panels exist. */
export const CATEGORIES: readonly {readonly id: Category; readonly icon: string; readonly label: string; readonly ready: boolean}[] = [
    {id: 'floor', icon: '🟫', label: 'Sol', ready: true},
    {id: 'decor', icon: '🪑', label: 'Mobis', ready: true},
    {id: 'npc', icon: '🧑', label: 'PNJ', ready: false},
    {id: 'spawns', icon: '🐺', label: 'Spawns', ready: false},
    {id: 'zones', icon: '🟨', label: 'Zones', ready: false},
    {id: 'triggers', icon: '⚙️', label: 'Triggers', ready: false},
    {id: 'audio', icon: '🔊', label: 'Audio', ready: false},
    {id: 'settings', icon: '🛠️', label: 'Paramètres', ready: true},
    {id: 'validation', icon: '✅', label: 'Validation', ready: true}
];
