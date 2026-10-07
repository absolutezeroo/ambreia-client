import {elementCells} from './elementCells';
import type {LayerItem} from './LayerItem';
import type {LayerKey} from './LayerKey';
import type {ZoneDocument} from './Zone.generated';

/** The topmost (last) element of the layer standing on (x, y), or null. */
export function elementAt<K extends LayerKey>(doc: ZoneDocument, layer: K, x: number, y: number): (LayerItem<K> & {id: string}) | null
{
    const items = (doc[layer] ?? []) as (LayerItem<K> & {id: string})[];

    for(let i = items.length - 1; i >= 0; i--)
    {
        if(elementCells(items[i], doc).some(c => c.x === x && c.y === y)) return items[i];
    }

    return null;
}
