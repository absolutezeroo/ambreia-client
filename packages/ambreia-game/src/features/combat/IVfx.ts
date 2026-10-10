// The shape of a combat visual, as the content describes it (content/skill/*.json → vfx): the one
// file of this feature another feature imports (the skills read their skill's vfx set through it).

export interface IVfxSheet
{
    /** The image's library name (`rpg/vfx/mage/energy-orb`). */
    readonly asset: string;
    readonly width: number;
    readonly height: number;
    readonly columns: number;
    readonly frames: number;
    readonly ms: number;
    readonly anchorX: number;
    readonly anchorY: number;
}

/**
 * Where a phase pins its sheet on an avatar (content `attach`): on its body's centre, at its feet
 * (both drawn over it), or on the ground under it (drawn behind it, like its shadow).
 */
export type VfxAttach = 'body' | 'feet' | 'ground';

/** One moment of a skill's visual, as the content declares it (the server's VfxPhase). */
export interface IVfxPhase
{
    /** `<folder>/<name>` under packages/vortex-client/spells/. */
    readonly sheet: string;
    readonly attach: VfxAttach;
    /** Played this long after its moment. */
    readonly delayMs: number;
}

/** A sheet that flies from the caster's body to the target's (the server's VfxProjectile). */
export interface IVfxProjectile
{
    readonly sheet: string;
    /** In the room's own pixels per second. */
    readonly speed: number;
}

/**
 * What the content draws for a skill or a basic attack, by moment (the server's SkillVfx): the
 * kits of a spell's visual as MMORPGs cut them, each one optional.
 */
export interface IVfxSet
{
    /** Looped on the caster from the cast's start to its end. */
    readonly cast: IVfxPhase | null;
    /** Once on the caster the moment the skill goes off. */
    readonly release: IVfxPhase | null;
    /** Flies to the target; the area, the hit and the numbers wait for it. */
    readonly projectile: IVfxProjectile | null;
    /** Once where it landed: under the target, or on the aimed cell. */
    readonly area: IVfxPhase | null;
    /** Once on each one it touched; nothing on a miss. */
    readonly hit: IVfxPhase | null;
}

/** What the content draws for a status (the server's StatusVfx): its aura, looped while it lasts. */
export interface IStatusVfx
{
    readonly aura: IVfxPhase | null;
}

/** Read by name at run time: decoded at load (IGameFeature.images). */
