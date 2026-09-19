/**
 * FurnitureFireworksVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureFireworksVisualization
 *
 * Fireworks furniture that delegates particle effects to FurnitureParticleSystem.
 */
import {AnimatedFurnitureVisualization} from './AnimatedFurnitureVisualization';
import {FurnitureParticleSystem} from './FurnitureParticleSystem';
import type {IParticleSystemData} from './FurnitureParticleSystem';
import {RoomObjectVariableEnum} from '@habbo/room/object/RoomObjectVariableEnum';
import {Logger} from '@core/utils/Logger';

const log = Logger.getLogger('habbo.room.object.visualization.furniture.FurnitureFireworksVisualization');

export class FurnitureFireworksVisualization extends AnimatedFurnitureVisualization
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureFireworksVisualization.as::_particleSystems
    private _particleSystems: Map<number, FurnitureParticleSystem> | null = null;
    private _activeParticleSystem: FurnitureParticleSystem | null = null;

    override dispose(): void
    {
        super.dispose();
        this._activeParticleSystem = null;

        if(this._particleSystems !== null)
        {
            for(const system of this._particleSystems.values())
            {
                system.dispose();
            }

            this._particleSystems = null;
        }
    }

    protected override updateObject(scale: number, geometryDirection: number): boolean
    {
        if(super.updateObject(scale, geometryDirection))
        {
            if(this._particleSystems === null)
            {
                this.readDefinition();

                const systems = this._particleSystems as Map<number, FurnitureParticleSystem> | null;

                if(systems !== null)
                {
                    this._activeParticleSystem = systems.get(scale) || null;
                }
            }
            else if(this._particleSystems.get(scale) !== this._activeParticleSystem)
            {
                const newSystem = this._particleSystems.get(scale) || null;

                if(newSystem !== null && this._activeParticleSystem !== null)
                {
                    newSystem.copyStateFrom(this._activeParticleSystem);
                }

                if(this._activeParticleSystem !== null)
                {
                    this._activeParticleSystem.reset();
                }

                this._activeParticleSystem = newSystem;
            }

            return true;
        }

        return false;
    }

    protected override updateSprites(scale: number, fullUpdate: boolean, animatedLayers: number): void
    {
        super.updateSprites(scale, fullUpdate, animatedLayers);

        if(this._activeParticleSystem !== null)
        {
            this._activeParticleSystem.updateSprites();
        }
    }

    protected override updateAnimation(scale: number): number
    {
        if(this._activeParticleSystem !== null)
        {
            this._activeParticleSystem.updateAnimation();
        }

        return super.updateAnimation(scale);
    }

    protected override setAnimation(animationId: number): void
    {
        if(this._activeParticleSystem !== null)
        {
            this._activeParticleSystem.setAnimation(animationId);
        }

        super.setAnimation(animationId);
    }

    protected override getSpriteYOffset(scale: number, direction: number, layerIndex: number): number
    {
        if(this._activeParticleSystem !== null && this._activeParticleSystem.controlsSprite(layerIndex))
        {
            return this._activeParticleSystem.getSpriteYOffset(scale, direction, layerIndex);
        }

        return super.getSpriteYOffset(scale, direction, layerIndex);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureFireworksVisualization.as::readDefinition()
    private readDefinition(): void
    {
        const roomObject = this.object;

        if(roomObject === null)
        {
            return;
        }

        const model = roomObject.getModel();

        if(model === null)
        {
            return;
        }

        const dataStr = model.getString(RoomObjectVariableEnum.FURNITURE_FIREWORKS_DATA);

        if(dataStr === null || dataStr.length === 0)
        {
            log.debug('No particle system data found');

            return;
        }

        let systems: IParticleSystemData[];

        try
        {
            // `FurnitureFireworksLogic` stores the bundle's `logic.particleSystems` array as
            // JSON, which is what AS3 stores as the XML text of the same node list.
            systems = JSON.parse(dataStr) as IParticleSystemData[];
        }
        catch (error)
        {
            log.warn(`Particle system data is not readable: ${String(error)}`);

            return;
        }

        if(!Array.isArray(systems)) return;

        this._particleSystems = new Map();

        for(const systemData of systems)
        {
            if(systemData.size === undefined)
            {
                log.warn('Particle system does not have size property!');

                continue;
            }

            const system = new FurnitureParticleSystem(this);

            system.parseData(systemData);
            this._particleSystems.set(Number(systemData.size), system);
        }
    }
}
