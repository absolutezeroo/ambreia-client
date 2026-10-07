import {AvatarVisualization} from '../avatar/visualization/AvatarVisualization';
import {AvatarAdditionFactory} from './additions/AvatarAdditionFactory';
import {FurnitureFireworksVisualization} from '../furniture/visualization/FurnitureFireworksVisualization';
import {FurnitureParticleSystem} from './particles/FurnitureParticleSystem';
import type {IIsoRegistries} from '../object/IIsoRegistries';

/**
 * The effects drawn over the room's objects: the avatars' additions (typing, muted, guide and
 * number bubbles, sleeping Zs, hearts and the other expressions) and the fireworks' particles.
 * Without it, avatars and fireworks are drawn without them; nothing else changes.
 */
export function registerEffects(_registries: IIsoRegistries): void
{
    AvatarVisualization.additions = new AvatarAdditionFactory();
    FurnitureFireworksVisualization.particleSystems = (visualization) => new FurnitureParticleSystem(visualization);
}
