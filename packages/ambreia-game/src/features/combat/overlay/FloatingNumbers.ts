import type {IWindow} from '@ambreia/ui/IWindow';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {IAnchorSource} from './IAnchorSource';

/** A floating number rises and fades over this long. */
const NUMBER_MS = 1000;
const NUMBER_RISE = 28;
const NUMBER_HALF = 40;
const COLORS = {hit: 0xff5050, crit: 0xffc030, miss: 0xd0d0c8, heal: 0x60e060};

interface INumber
{
    window: ITextWindow;
    objectId: number;
    born: number;
}

/** The numbers rising from whoever was hit or healed (a crit bigger, « Raté » for a miss); their windows are reused. */
export class FloatingNumbers
{
    private readonly _numbers: INumber[] = [];
    private readonly _spare: ITextWindow[] = [];

    /** @param text - a translated text: `vortex.combat.miss`… */
    constructor(private readonly _build: (layout: string) => IWindow | null, private readonly _text: (key: string) => string) {}

    /**
     * `hit`, `crit`, `miss` (M1a), `dodge`, `heal` (M1b), `immune` (M1c); `absorbed`: what a shield
     * took; `delayMs`: the number waits this long (a projectile's flight) before rising.
     */
    add(objectId: number, amount: number, outcome: string, absorbed: number, delayMs: number, now: number): void
    {
        const window = this._spare.pop() ?? this._build('vortex_combat_number_xml') as ITextWindow | null;

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
        this._numbers.push({window, objectId, born: now + delayMs});
    }

    /** Rises and fades the numbers; true while one remains. */
    tick(anchors: IAnchorSource | null, point: {x: number; y: number}, now: number): boolean
    {
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

            // Not born yet: its blow is still flying.
            if(age < 0)
            {
                number.window.visible = false;
                continue;
            }

            number.window.visible = true;
            number.window.x = Math.round(point.x - NUMBER_HALF);
            number.window.y = Math.round(point.y - 30 - (age / NUMBER_MS) * NUMBER_RISE);
            number.window.blend = 1 - age / NUMBER_MS;
        }

        return this._numbers.length > 0;
    }

    clear(): void
    {
        for(const number of this._numbers) number.window.destroy();
        this._numbers.length = 0;
    }

    dispose(): void
    {
        this.clear();
        for(const window of this._spare) window.destroy();
        this._spare.length = 0;
    }
}
