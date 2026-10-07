import type {IWindow} from '../IWindow';
import type {Motion} from './Motion';

/**
 * Static motion scheduler.
 *
 * Manages a collection of running motions, ticking them each frame via
 * requestAnimationFrame. Motions are started when added and removed
 * when complete or explicitly stopped.
 *
 * In AS3 this was `class_3596` — a static class with a Timer-based
 * tick loop. Here we use requestAnimationFrame instead.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/motion/Motions.as
 */
export class Motions
{
    private static _active: Motion[] = [];
    private static _pending: Motion[] = [];
    private static _removing: Motion[] = [];
    private static _rafId: number = 0;

    private static _isUpdating: boolean = false;

    /**
	 * Whether the scheduler is currently inside its tick loop.
	 */
    public static get isUpdating(): boolean
    {
        return Motions._isUpdating;
    }

    /**
	 * Whether the scheduler has any running motions.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/motion/Motions.as::get isRunning()
    public static get isRunning(): boolean
    {
        return Motions._rafId !== 0;
    }

    /**
	 * Run a motion. Starts it immediately (or defers if currently ticking).
	 *
	 * @param motion The motion to run
	 * @returns The same motion, for chaining (e.g. `.tag = ...`)
	 */
    public static runMotion(motion: Motion): Motion
    {
        if(Motions._active.indexOf(motion) !== -1 || Motions._pending.indexOf(motion) !== -1)
        {
            return motion;
        }

        if(Motions._isUpdating)
        {
            Motions._pending.push(motion);
        }
        else
        {
            Motions._active.push(motion);
            motion.start();
        }

        Motions.startLoop();

        return motion;
    }

    /**
	 * Remove a motion from the scheduler.
	 *
	 * @param motion The motion to remove
	 */
    public static removeMotion(motion: Motion): void
    {
        let idx = Motions._active.indexOf(motion);

        if(idx > -1)
        {
            if(Motions._isUpdating)
            {
                if(Motions._removing.indexOf(motion) === -1)
                {
                    Motions._removing.push(motion);
                }
            }
            else
            {
                Motions._active.splice(idx, 1);

                if(motion.running)
                {
                    motion.stop();
                }

                if(Motions._active.length === 0)
                {
                    Motions.stopLoop();
                }
            }
        }
        else
        {
            idx = Motions._pending.indexOf(motion);

            if(idx > -1)
            {
                Motions._pending.splice(idx, 1);
            }
        }
    }

    /**
	 * Find a running motion by its tag.
	 *
	 * @param tag The tag to search for
	 * @returns The motion, or null
	 */
    public static getMotionByTag(tag: string): Motion | null
    {
        for(const m of Motions._active)
        {
            if(m.tag === tag) return m;
        }

        for(const m of Motions._pending)
        {
            if(m.tag === tag) return m;
        }

        return null;
    }

    /**
	 * Find a running motion by its target window.
	 *
	 * @param target The target window to search for
	 * @returns The motion, or null
	 */
    public static getMotionByTarget(target: IWindow): Motion | null
    {
        for(const m of Motions._active)
        {
            if(m.target === target) return m;
        }

        for(const m of Motions._pending)
        {
            if(m.target === target) return m;
        }

        return null;
    }

    /**
	 * Find a running motion by tag AND target.
	 *
	 * @param tag The tag to search for
	 * @param target The target window
	 * @returns The motion, or null
	 */
    public static getMotionByTagAndTarget(tag: string, target: IWindow): Motion | null
    {
        for(const m of Motions._active)
        {
            if(m.tag === tag && m.target === target) return m;
        }

        for(const m of Motions._pending)
        {
            if(m.tag === tag && m.target === target) return m;
        }

        return null;
    }

    /**
	 * RAF tick handler. Processes pending/removing queues, then ticks all
	 * active motions, removing any that complete.
	 */
    private static onTick(timestamp: number): void
    {
        Motions._isUpdating = true;

        // Flush pending → active
        let m: Motion | null;

        while((m = Motions._pending.pop() ?? null) !== null)
        {
            Motions._active.push(m);
            m.start();
        }

        // Flush removing
        while((m = Motions._removing.pop() ?? null) !== null)
        {
            const idx = Motions._active.indexOf(m);

            if(idx > -1)
            {
                Motions._active.splice(idx, 1);

                if(m.running)
                {
                    m.stop();
                }
            }
        }

        // Tick all active motions
        for(const motion of Motions._active)
        {
            if(motion.running)
            {
                motion.tick(timestamp);

                if(motion.complete)
                {
                    Motions.removeMotion(motion);
                }
            }
            else
            {
                Motions.removeMotion(motion);
            }
        }

        if(Motions._active.length === 0)
        {
            Motions.stopLoop();
        }

        Motions._isUpdating = false;
    }

    /**
	 * Start the RAF loop if not already running.
	 */
    private static startLoop(): void
    {
        if(Motions._rafId !== 0) return;

        const loop = (timestamp: number): void =>
        {
            Motions.onTick(timestamp);

            if(Motions._rafId !== 0)
            {
                Motions._rafId = requestAnimationFrame(loop);
            }
        };

        Motions._rafId = requestAnimationFrame(loop);
    }

    /**
	 * Stop the RAF loop.
	 */
    private static stopLoop(): void
    {
        if(Motions._rafId !== 0)
        {
            cancelAnimationFrame(Motions._rafId);
            Motions._rafId = 0;
        }
    }
}
