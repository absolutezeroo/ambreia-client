import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';

/** Under the HUD (layer 1): the bars and numbers belong to the room. */
const LAYER = 0;
/** vortex_combat_bar_xml's fill at full health. */
const BAR_FILL = 36;
const BAR_HALF = 19;
/** A floating number rises and fades over this long. */
const NUMBER_MS = 1000;
const NUMBER_RISE = 28;
const NUMBER_HALF = 40;

const COLORS = {hit: 0xff5050, crit: 0xffc030, miss: 0xd0d0c8, heal: 0x60e060};

interface IBar
{
    window: IWindowContainer;
    fill: IWindow | null;
    /** A monster's bar always shows; a player's only while hurt (M1a §9.3). */
    always: boolean;
    hurt: boolean;
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
 * The combat over the room (M1a §9.3): a health bar above each monster and each hurt player, and
 * the damage numbers rising from whoever was hit (a crit bigger, « Raté » for a miss). Windows on
 * the room's layer, moved every frame while any is shown; the frame loop allocates nothing.
 */
export class CombatOverlay
{
    private readonly _bars = new Map<number, IBar>();
    private readonly _numbers: INumber[] = [];
    private readonly _spare: ITextWindow[] = [];
    private readonly _point = {x: 0, y: 0};
    private _frame: number | null = null;
    private _disposed = false;

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _anchors: () => IAnchorSource | null,
        private readonly _missText: () => string
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

    hit(objectId: number, amount: number, outcome: string): void
    {
        const window = this._spare.pop() ?? this.build('vortex_combat_number_xml') as ITextWindow | null;

        if(!window) return;

        const crit = outcome === 'crit';

        window.caption = outcome === 'miss' ? this._missText() : `-${amount}${crit ? ' !' : ''}`;
        window.textColor = outcome === 'miss' ? COLORS.miss : crit ? COLORS.crit : COLORS.hit;
        window.fontSize = crit ? 16 : 12;
        window.blend = 1;
        window.visible = false;
        this._numbers.push({window, objectId, born: performance.now()});
        this.run();
    }

    /** The object left the room (or died): its bar goes. */
    remove(objectId: number): void
    {
        this._bars.get(objectId)?.window.destroy();
        this._bars.delete(objectId);
    }

    clear(): void
    {
        for(const bar of this._bars.values()) bar.window.destroy();
        this._bars.clear();

        for(const number of this._numbers) number.window.destroy();
        this._numbers.length = 0;
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

        desktop.addChild(window);

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
        let again = this._numbers.length > 0;

        for(const [objectId, bar] of this._bars)
        {
            again ||= bar.always || bar.hurt;

            const shown = (bar.always || bar.hurt) && anchors !== null && anchors.getRpgAnchor(objectId, point);

            bar.window.visible = shown;
            if(!shown) continue;

            bar.window.x = Math.round(point.x - BAR_HALF);
            bar.window.y = Math.round(point.y - 10);
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
