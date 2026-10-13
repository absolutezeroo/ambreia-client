import type {IVfxSet} from '../combat/IVfx';
import type {ISkillEffect} from './ISkillEffect';
import type {ISkillTelegraph} from './ISkillTelegraph';

/** What the client reads of a skill's definition (GET /api/public/content/definitions/skill, M1b §5.1). */
export interface ISkillDefinition
{
    readonly id: string;
    /** Empty for a monster's skill (M1c): no class learns it. */
    readonly classes: readonly string[];
    /** Learned on reaching this level. */
    readonly level: number;
    readonly effects: readonly ISkillEffect[];
    /** `self`, `ally`, `enemy`, `ground`, `around_caster`, `around_target`, `dead_ally`. */
    readonly target: string;
    readonly globalCooldown: boolean;
    /** `instant`, `cast` or `channel`. */
    readonly type: string;
    readonly cost: number;
    readonly castMs: number;
    readonly channelMs: number;
    /** Tiles; 0 for a skill on oneself or around oneself. */
    readonly range: number;
    readonly cooldownMs: number;
    /** The area a monster's skill warns of before it lands (M1c); null for the others. */
    readonly telegraph?: ISkillTelegraph | null;
    /** What the client draws for it, by moment; null for nothing. */
    readonly vfx: IVfxSet | null;
    /** The image the client shows for it (M1d §6.1); empty for the generic one. */
    readonly icon?: string;
}
