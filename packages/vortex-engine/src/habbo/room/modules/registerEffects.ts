import {AvatarVisualization} from '@habbo/room/object/visualization/avatar/AvatarVisualization';
import {AvatarAdditionFactory} from '@habbo/room/object/visualization/avatar/additions/AvatarAdditionFactory';
import {FurnitureFireworksVisualization} from '@habbo/room/object/visualization/furniture/FurnitureFireworksVisualization';
import {FurnitureParticleSystem} from '@habbo/room/object/visualization/furniture/FurnitureParticleSystem';
import type {IIsoRegistries} from '@room/object/IIsoRegistries';

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
