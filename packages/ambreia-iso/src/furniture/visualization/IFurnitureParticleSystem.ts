/**
 * The particles of a fireworks furni, as FurnitureFireworksVisualization drives them. The effects
 * module provides them (FurnitureParticleSystem); without it the furni is drawn without particles.
 */
export interface IFurnitureParticleSystem
{
    parseData(data: IParticleSystemData): void;
    copyStateFrom(source: IFurnitureParticleSystem): void;
    reset(): void;
    setAnimation(animationId: number): void;
    getSpriteYOffset(scale: number, direction: number, layerIndex: number): number;
    controlsSprite(layerIndex: number): boolean;
    updateSprites(): void;
    updateAnimation(): void;
    dispose(): void;
}

/**
 * One `particlesystem` as the furni bundle carries it, under `logic.particleSystems`.
 *
 * Verified against every fireworks furni in the shipped set (30 of them, 2,504 systems): these
 * are all the keys that occur, the numbers are numbers and `isEmitter`/`fade` are booleans.
 * `bgColor` occurs nowhere, which is why the AS3 default matters.
 */
// TS-only: AS3 reads an `XML` here; the port's asset pipeline delivers the same tree as JSON.
export interface IParticleSystemData
{
    size?: number;
    canvasId?: number;
    offsetY?: number;
    blend?: number;
    bgColor?: string;
    emitters?: Array<{
        id?: number;
        name?: string;
        spriteId?: number;
        maxNumParticles?: number;
        particlesPerFrame?: number;
        burstPulse?: number;
        fuseTime?: number;
        simulation?: {
            force?: number;
            direction?: number;
            gravity?: number;
            airFriction?: number;
            shape?: string;
            energy?: number;
        };
        particles?: Array<{
            lifeTime?: number;
            isEmitter?: boolean;
            fade?: boolean;
            frames?: string[];
        }>;
    }>;
}
