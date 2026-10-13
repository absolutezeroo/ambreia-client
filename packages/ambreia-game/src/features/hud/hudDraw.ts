import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {WindowBits} from '../../ui/kit/WindowBits';
import {barFill} from './PlayerHudState';

/** `<name>` shows `icon`; hidden for none. */
export function drawIcon(container: IWindowContainer, name: string, icon: string | null): void
{
    const bitmap = container.findChildByName(name) as IStaticBitmapWrapperWindow | null;

    if(!bitmap) return;

    bitmap.visible = icon !== null;
    if(icon !== null && bitmap.assetUri !== icon) bitmap.assetUri = icon;
}

/** `<name>` holds `bg`, `fill` and `value`: the fill's width follows value / max, the label is `value / max` unless given. */
export function drawBar(bits: Pick<WindowBits, 'setText'>, container: IWindowContainer, name: string, value: number | null, max: number | null, label: string | null = null): void
{
    const bar = container.findChildByName(name) as IWindowContainer | null;
    const background = bar?.findChildByName('bg');
    const fill = bar?.findChildByName('fill');

    if(!bar || !background || !fill) return;

    const width = barFill(value, max, background.width);

    fill.visible = width > 0;
    if(width > 0) fill.width = width;
    bits.setText(bar, 'value', label ?? (value === null || max === null ? '' : `${value} / ${max}`));
}
