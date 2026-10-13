import type {IVfxSheet, VfxAttach} from '../IVfx';

/** What the choreography asks of CombatVfx: a sheet played once, flown, or looped. */
export interface IVfxPlayer
{
    burst(sheet: IVfxSheet, objectId: number, attach: VfxAttach): void;
    burstAt(sheet: IVfxSheet, x: number, y: number): void;
    /** Returns the flight's duration; `land` runs when it lands. */
    shoot(sheet: IVfxSheet, speed: number, fromId: number, toId: number, land: () => void): number;
    /** Returns what stops the loop. */
    loop(sheet: IVfxSheet, objectId: number, attach: VfxAttach): () => void;
}
