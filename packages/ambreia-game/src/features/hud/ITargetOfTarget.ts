/** The target's own target, in the compact frame beside the target frame (M1d §4). */
export interface ITargetOfTarget
{
    readonly objectId: number;
    readonly name: string;
    /** Null when the client does not know it (another player's). */
    readonly level: number | null;
    readonly hp: number | null;
    readonly hpMax: number | null;
    /** It is the player: the target's aggro is on him. */
    readonly onPlayer: boolean;
}
