import type {IVfxSet} from '../combat/IVfx';

/** What the client reads of a class's definition (GET /api/public/content/definitions/class). */
export interface IClassDefinition
{
    readonly id: string;
    /** What the client draws for its basic attack; null for nothing. */
    readonly basicAttack: IVfxSet | null;
}
