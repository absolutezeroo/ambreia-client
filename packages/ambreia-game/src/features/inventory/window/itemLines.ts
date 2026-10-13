import type {IRpgItemEntry} from '@ambreia/protocol/incoming/rpg/items/IRpgItemEntry';
import {itemKind} from '../items';
import type {IItemTexts} from './IItemTexts';

/** `1 234 567`; an amount the server has not sent reads 0. */
export function thousands(value: number | null): string
{
    return String(value ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function itemName(texts: IItemTexts, item: IRpgItemEntry): string
{
    return texts.contentName(`${item.definitionId}.name`, item.definitionId);
}

/** `Arme · Lié · Durabilité 50`. */
export function itemKindLine(texts: IItemTexts, item: IRpgItemEntry): string
{
    const kind = itemKind(item.definitionId);
    const parts = [texts.contentName(`vortex.inventory.kind.${kind}`, kind)];

    if(item.bound) parts.push(texts.text('vortex.inventory.bound'));
    if(item.durability >= 0) parts.push(texts.text('vortex.inventory.durability', 'value', String(item.durability)));

    return parts.join(' · ');
}
