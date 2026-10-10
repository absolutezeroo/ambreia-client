import {VFX_SHEETS} from './vfxSheets.generated';

/**
 * A sprite sheet: `frames` cells of `width`×`height` px, `columns` per row, left to right then
 * down, `ms` each; the anchor is the pixel of a cell that lands on the spot.
 */
export type {IVfxSheet, VfxAttach, IVfxPhase, IVfxProjectile, IVfxSet, IStatusVfx} from './IVfx';
import type {IVfxSheet} from './IVfx';

export const VFX_IMAGES: readonly string[] = Object.keys(VFX_SHEETS).map(key => `rpg/vfx/${key}`);

/** The sheet the content names (`mage/energy-orb`), or null when the client ships no such art. */
export function vfxSheet(key: string): IVfxSheet | null
{
    const sheet = (VFX_SHEETS as Record<string, Omit<IVfxSheet, 'asset'>>)[key];

    return sheet ? {asset: `rpg/vfx/${key}`, ...sheet} : null;
}

/** Where each frame sits in the sheet's image. */
export function sheetFrames(sheet: IVfxSheet): {x: number; y: number}[]
{
    return Array.from({length: sheet.frames}, (_, i) => ({x: (i % sheet.columns) * sheet.width, y: Math.floor(i / sheet.columns) * sheet.height}));
}

/** How long the sheet plays once. */
export const sheetMs = (sheet: IVfxSheet): number => sheet.frames * sheet.ms;
