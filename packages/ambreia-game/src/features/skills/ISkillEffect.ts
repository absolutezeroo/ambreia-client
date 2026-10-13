/** One effect of a skill (M1b §5.2): `damage`, `heal`, `apply_status`, `interrupt`, `dispel`, `threat`, `resurrect`. */
export interface ISkillEffect
{
    readonly kind: string;
    readonly base: number;
    readonly coefficient: number;
    readonly status: string | null;
}
