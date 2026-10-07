import type {ToolName} from './ToolName';

/** The floor tools' shortcuts, as the owner's layout shows them (tool_key), plus door, spawn, block. */
export const TOOL_KEYS: Readonly<Record<string, ToolName>> = {
    s: 'select',
    a: 'tile-add',
    d: 'tile-remove',
    r: 'raise',
    f: 'lower',
    c: 'rect',
    b: 'fill',
    h: 'hole',
    p: 'door',
    j: 'spawn',
    w: 'block'
};
