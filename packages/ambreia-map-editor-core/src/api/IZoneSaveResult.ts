import type {IZoneFinding} from '../validation/IZoneFinding';

/** What a save or a publication did; findings say why not when it did not. */
export interface IZoneSaveResult
{
    readonly saved: boolean;
    readonly version: number | null;
    readonly published: boolean;
    readonly findings: readonly IZoneFinding[];
}
