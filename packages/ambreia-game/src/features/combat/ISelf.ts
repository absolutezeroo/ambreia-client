import type {IDeathState} from './IDeathState';

/** The player's own state in the fight. */
export interface ISelf
{
    readonly inCombat: boolean;
    /** The server's word (RpgAutoAttackState), never the click. */
    readonly autoAttacking: boolean;
    readonly death: IDeathState;
}
