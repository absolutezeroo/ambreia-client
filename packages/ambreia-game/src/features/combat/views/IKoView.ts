import type {IKoPlayer} from './IKoPlayer';

/** The KO screen (vortex_death_xml), as DeathScreens drives it. */
export interface IKoView
{
    /** `timerMs`: to the auto-release; null once the player waits. */
    show(player: IKoPlayer, timerMs: number | null, waiting: boolean): void;
    hide(): void;
}
