import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import {CastBars} from './overlay/CastBars';
import {FloatingNumbers} from './overlay/FloatingNumbers';
import {HealthBars} from './overlay/HealthBars';
import {HoldMarks} from './overlay/HoldMarks';
import type {IAnchorSource} from './overlay/IAnchorSource';
import {YellLines} from './overlay/YellLines';

/**
 * The HUD's layer, at the bottom of it (build()): on the room's own layer (0) a click activates the
 * room view, which comes to the front and covered the bars.
 */
const LAYER = 1;

/**
 * The combat over the room (M1a §9.3): a health bar above each monster and each hurt player, a
 * cast bar under it while one casts (M1b §10.3), the numbers rising from whoever was hit or healed,
 * a monster's yell, the mark of what holds one back. Each is its own layer (overlay/); this one
 * builds their windows on the HUD's layer and moves them every frame while any is shown. The frame
 * loop allocates nothing.
 */
export class CombatOverlay
{
    private readonly _bars: HealthBars;
    private readonly _casts: CastBars;
    private readonly _numbers: FloatingNumbers;
    private readonly _yells: YellLines;
    private readonly _marks: HoldMarks;
    private readonly _point = {x: 0, y: 0};
    private _frame: number | null = null;
    private _disposed = false;

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _anchors: () => IAnchorSource | null,
        /** A translated text: `vortex.combat.miss`… */
        text: (key: string) => string
    )
    {
        const build = (layout: string): IWindow | null => this.build(layout);

        this._bars = new HealthBars(build);
        this._casts = new CastBars(build);
        this._numbers = new FloatingNumbers(build, text);
        this._yells = new YellLines(build);
        this._marks = new HoldMarks(build);
    }

    setHealth(objectId: number, health: number, maxHealth: number, always: boolean): void
    {
        this._bars.set(objectId, health, maxHealth, always);
        this.run();
    }

    /**
     * `hit`, `crit`, `miss` (M1a), `dodge`, `heal` (M1b), `immune` (M1c); `absorbed`: what a shield
     * took; `delayMs`: the number waits this long (a projectile's flight) before rising.
     */
    hit(objectId: number, amount: number, outcome: string, absorbed = 0, delayMs = 0): void
    {
        this._numbers.add(objectId, amount, outcome, absorbed, delayMs, performance.now());
        this.run();
    }

    /** A monster yells (RpgMonsterYell): the text over it, a newer yell replacing it. */
    yell(objectId: number, text: string): void
    {
        this._yells.yell(objectId, text, performance.now());
        this.run();
    }

    /** The icon of what holds this object back (a slow, a stun) beside its bar; null takes it away. */
    mark(objectId: number, icon: string | null): void
    {
        this._marks.set(objectId, icon);
        if(icon !== null) this.run();
    }

    /** A cast or a channel began over this object (RpgCastStart). */
    startCast(objectId: number, durationMs: number, channel: boolean): void
    {
        this._casts.start(objectId, durationMs, channel, performance.now());
        this.run();
    }

    endCast(objectId: number): void
    {
        this._casts.end(objectId);
    }

    /** The object left the room (or died): its bars go. */
    remove(objectId: number): void
    {
        this._bars.remove(objectId);
        this._casts.end(objectId);
        this._yells.remove(objectId);
        this._marks.set(objectId, null);
    }

    /** Drops what belongs to objects no longer in the room (`alive` says which still are). */
    prune(alive: (objectId: number) => boolean): void
    {
        for(const objectId of [...this._bars.ids(), ...this._casts.ids(), ...this._yells.ids(), ...this._marks.ids()])
        {
            if(!alive(objectId)) this.remove(objectId);
        }
    }

    clear(): void
    {
        this._bars.clear();
        this._casts.clear();
        this._numbers.clear();
        this._yells.clear();
        this._marks.clear();
    }

    private build(layout: string): IWindow | null
    {
        const desktop = this._windows.getDesktop(LAYER) as IWindowContainer | null;
        const window = this._windows.buildWidgetLayout(layout, LAYER);

        if(!window || !desktop)
        {
            window?.destroy();

            return null;
        }

        // Under the HUD's panels, which come later and stay above.
        desktop.addChildAt(window, 0);

        return window;
    }

    private run(): void
    {
        if(this._frame !== null || this._disposed || typeof requestAnimationFrame === 'undefined') return;

        this._frame = requestAnimationFrame(this._tick);
    }

    private readonly _tick = (): void =>
    {
        this._frame = null;

        const anchors = this._anchors();
        const point = this._point;
        const now = performance.now();
        // Every layer moves, then: while anything is on screen, bars follow walking avatars and numbers rise.
        const bars = this._bars.tick(anchors, point);
        const casts = this._casts.tick(anchors, point, now);
        const numbers = this._numbers.tick(anchors, point, now);
        const marks = this._marks.tick(anchors, point);
        const yells = this._yells.tick(anchors, point, now);

        if(bars || casts || numbers || marks || yells) this.run();
    };

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        if(this._frame !== null && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this._frame);
        this.clear();
        this._numbers.dispose();
    }
}
