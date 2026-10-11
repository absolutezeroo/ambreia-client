import type {Renderer} from 'pixi.js';

/**
 * The application-shell services VortexMain needs while booting and running the game layer.
 *
 * Keeping this boundary explicit prevents the orchestrator from reaching back into the concrete
 * Vortex singleton. The shell still owns Pixi, lifecycle events and crash/login telemetry.
 */
export interface IVortexMainHost
{
    getRenderer(): Renderer | null;

    trackLoginStep(step: string, extra?: string): void;

    reportCrash(message: string, category: string, isFatal: boolean, error?: Error): void;

    emitLifecycle(event: 'heartbeat' | 'reboot'): void;
}
