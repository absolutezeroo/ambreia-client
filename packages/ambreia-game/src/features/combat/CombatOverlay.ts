import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';

/**
 * The HUD's layer, at the bottom of it (build()): on the room's own layer (0) a click activates the
 * room view, which comes to the front and covered the bars.
 */
const LAYER = 1;
/** vortex_combat_bar_xml's fill at full health. */
const BAR_FILL = 36;
const BAR_HALF = 19;
/** A floating number rises and fades over this long. */
const NUMBER_MS = 1000;
const NUMBER_RISE = 28;
const NUMBER_HALF = 40;
/** A monster's yell (M1c) stays over it this long, fading in its last quarter. */
const YELL_MS = 4000;
const YELL_HALF = 120;

const COLORS = {hit: 0xff5050, crit: 0xffc030, miss: 0xd0d0c8, heal: 0x60e060};
/** A cast fills, a channel empties (M1b §6.3); the bar sits under the health bar. */
const CAST_COLOR = 0xe8b830;
const CHANNEL_COLOR = 0x5aa0e8;
const CAST_DROP = 8;
/** A cast whose RpgCastEnd never came goes this long after its end. */
const CAST_GRACE_MS = 1000;

interface IBar
{
    window: IWindowContainer;
    fill: IWindow | null;
    /** A monster's bar always shows; a player's only while hurt (M1a §9.3). */
    always: boolean;
    hurt: boolean;
}

interface ICast
{
    window: IWindowContainer;
    fill: IWindow | null;
    born: number;
    duration: number;
    channel: boolean;
}

interface IYell
{
    window: ITextWindow;
    born: number;
}

interface INumber
{
    window: ITextWindow;
    objectId: number;
    born: number;
}

/** What the overlay needs of the room: where above an object to draw (RoomEngine.getRpgAnchor()). */
export interface IAnchorSource
{
    getRpgAnchor(objectId: number, out: {x: number; y: number}): boolean;
}

/**
 * The combat over the room (M1a §9.3): a health bar above each monster and each hurt player, a
 * cast bar under it while one casts (M1b §10.3), and the numbers rising from whoever was hit or
 * healed (a crit bigger, « Raté » for a miss). Windows on
 * the room's layer, moved every frame while any is shown; the frame loop allocates nothing.
 */
export class CombatOverlay
{
    private readonly _bars = new Map<number, IBar>();
    private readonly _casts = new Map<number, ICast>();
    private readonly _numbers: INumber[] = [];
    private readonly _yells = new Map<number, IYell>();
    /** A status icon beside the health bar of whoever is slowed or stunned (M1c). */
    private readonly _marks = new Map<number, IStaticBitmapWrapperWindow>();
    private readonly _spare: ITextWindow[] = [];
    private readonly _point = {x: 0, y: 0};
    private _frame: number | null = null;
    private _disposed = false;

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _anchors: () => IAnchorSource | null,
        /** A translated text: `vortex.combat.miss`… */
        private readonly _text: (key: string) => string
    ) {}

    setHealth(objectId: number, health: number, maxHealth: number, always: boolean): void
    {
        let bar = this._bars.get(objectId);

        if(!bar)
        {
            const window = this.build('vortex_combat_bar_xml') as IWindowContainer | null;

            if(!window) return;

            bar = {window, fill: window.findChildByName('fill'), always, hurt: false};
            this._bars.set(objectId, bar);
        }

        bar.always = bar.always || always;
        bar.hurt = health < maxHealth;
        if(bar.fill) bar.fill.width = maxHealth > 0 ? Math.max(0, Math.round(BAR_FILL * Math.min(1, health / maxHealth))) : 0;
        this.run();
    }

    /** `hit`, `crit`, `miss` (M1a), `dodge`, `heal` (M1b), `immune` (M1c); `absorbed`: what a shield took. */
    hit(objectId: number, amount: number, outcome: string, absorbed = 0): void
    {
        const window = this._spare.pop() ?? this.build('vortex_combat_number_xml') as ITextWindow | null;

        if(!window) return;

        const crit = outcome === 'crit';
        const missed = outcome === 'miss' || outcome === 'dodge' || outcome === 'immune';

        window.caption = missed ? this._text(`vortex.combat.${outcome}`)
            : outcome === 'heal' ? `+${amount}`
                : amount === 0 && absorbed > 0 ? this._text('vortex.combat.absorbed') : `-${amount}${crit ? ' !' : ''}`;
        window.textColor = missed || (amount === 0 && absorbed > 0) ? COLORS.miss : outcome === 'heal' ? COLORS.heal : crit ? COLORS.crit : COLORS.hit;
        window.fontSize = crit ? 16 : 12;
        window.blend = 1;
        window.visible = false;
        this._numbers.push({window, objectId, born: performance.now()});
        this.run();
    }

    /** A monster yells (RpgMonsterYell): the text over it, a newer yell replacing it. */
    yell(objectId: number, text: string): void
    {
        let yell = this._yells.get(objectId);

        if(!yell)
        {
            const window = this.build('vortex_combat_yell_xml') as ITextWindow | null;

            if(!window) return;

            yell = {window, born: 0};
            this._yells.set(objectId, yell);
        }

        yell.window.caption = text;
        yell.window.visible = false;
        yell.born = performance.now();
        this.run();
    }

    /** The icon of what holds this object back (a slow, a stun) beside its bar; null takes it away. */
    mark(objectId: number, icon: string | null): void
    {
        let mark = this._marks.get(objectId);

        if(icon === null)
        {
            mark?.destroy();
            this._marks.delete(objectId);

            return;
        }

        if(!mark)
        {
            const window = this.build('vortex_combat_mark_xml') as IStaticBitmapWrapperWindow | null;

            if(!window) return;

            mark = window;
            mark.visible = false;
            this._marks.set(objectId, mark);
        }

        if(mark.assetUri !== icon) mark.assetUri = icon;
        this.run();
    }

    /** A cast or a channel began over this object (RpgCastStart). */
    startCast(objectId: number, durationMs: number, channel: boolean): void
    {
        this.endCast(objectId);

        const window = this.build('vortex_combat_bar_xml') as IWindowContainer | null;
        const fill = window?.findChildByName('fill') ?? null;

        if(!window) return;

        if(fill) fill.color = channel ? CHANNEL_COLOR : CAST_COLOR;
        this._casts.set(objectId, {window, fill, born: performance.now(), duration: Math.max(1, durationMs), channel});
        this.run();
    }

    endCast(objectId: number): void
    {
        this._casts.get(objectId)?.window.destroy();
        this._casts.delete(objectId);
    }

    /** The object left the room (or died): its bars go. */
    remove(objectId: number): void
    {
        this._bars.get(objectId)?.window.destroy();
        this._bars.delete(objectId);
        this.endCast(objectId);
        this._yells.get(objectId)?.window.destroy();
        this._yells.delete(objectId);
        this.mark(objectId, null);
    }

    clear(): void
    {
        for(const bar of this._bars.values()) bar.window.destroy();
        this._bars.clear();

        for(const cast of this._casts.values()) cast.window.destroy();
        this._casts.clear();

        for(const number of this._numbers) number.window.destroy();
        this._numbers.length = 0;

        for(const yell of this._yells.values()) yell.window.destroy();
        this._yells.clear();

        for(const mark of this._marks.values()) mark.destroy();
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
        let again = this._numbers.length > 0 || this._casts.size > 0 || this._yells.size > 0 || this._marks.size > 0;

        for(const [objectId, bar] of this._bars)
        {
            again ||= bar.always || bar.hurt;

            const shown = (bar.always || bar.hurt) && anchors !== null && anchors.getRpgAnchor(objectId, point);

            bar.window.visible = shown;
            if(!shown) continue;

            bar.window.x = Math.round(point.x - BAR_HALF);
            bar.window.y = Math.round(point.y - 10);
        }

        for(const [objectId, cast] of this._casts)
        {
            const age = now - cast.born;

            if(age >= cast.duration + CAST_GRACE_MS)
            {
                // Deleting the current entry while iterating a Map is safe.
                this.endCast(objectId);
                continue;
            }

            const shown = anchors !== null && anchors.getRpgAnchor(objectId, point);

            cast.window.visible = shown;
            if(!shown) continue;

            const done = Math.min(1, age / cast.duration);

            if(cast.fill) cast.fill.width = Math.max(1, Math.round(BAR_FILL * (cast.channel ? 1 - done : done)));
            cast.window.x = Math.round(point.x - BAR_HALF);
            cast.window.y = Math.round(point.y - 10 + CAST_DROP);
        }

        for(let i = this._numbers.length - 1; i >= 0; i--)
        {
            const number = this._numbers[i];
            const age = now - number.born;

            if(age >= NUMBER_MS || anchors === null || !anchors.getRpgAnchor(number.objectId, point))
            {
                number.window.visible = false;
                this._spare.push(number.window);
                // Swap-remove: splice() would allocate the removed slice, every frame.
                this._numbers[i] = this._numbers[this._numbers.length - 1];
                this._numbers.pop();
                continue;
            }

            number.window.visible = true;
            number.window.x = Math.round(point.x - NUMBER_HALF);
            number.window.y = Math.round(point.y - 30 - (age / NUMBER_MS) * NUMBER_RISE);
            number.window.blend = 1 - age / NUMBER_MS;
        }

        for(const [objectId, mark] of this._marks)
        {
            const shown = anchors !== null && anchors.getRpgAnchor(objectId, point);

            mark.visible = shown;
            if(!shown) continue;

            mark.x = Math.round(point.x + BAR_HALF + 2);
            mark.y = Math.round(point.y - 14);
        }

        for(const [objectId, yell] of this._yells)
        {
            const age = now - yell.born;

            if(age >= YELL_MS)
            {
                yell.window.destroy();
                this._yells.delete(objectId);
                continue;
            }

            const shown = anchors !== null && anchors.getRpgAnchor(objectId, point);

            yell.window.visible = shown;
            if(!shown) continue;

            yell.window.x = Math.round(point.x - YELL_HALF);
            yell.window.y = Math.round(point.y - 52);
            yell.window.blend = Math.min(1, 4 * (1 - age / YELL_MS));
        }

        // While anything is on screen: bars follow walking avatars, numbers rise.
        if(again) this.run();
    };

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        if(this._frame !== null && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this._frame);
        this.clear();
        for(const window of this._spare) window.destroy();
        this._spare.length = 0;
    }
}
