import type {IWindow} from '@ambreia/ui/IWindow';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {IAnchorSource} from './IAnchorSource';

/** A monster's yell (M1c) stays over it this long, fading in its last quarter. */
const YELL_MS = 4000;
const YELL_HALF = 120;

interface IYell
{
    window: ITextWindow;
    born: number;
}

/** A monster's yell (RpgMonsterYell): its text over it, a newer yell replacing it. */
export class YellLines
{
    private readonly _yells = new Map<number, IYell>();

    constructor(private readonly _build: (layout: string) => IWindow | null) {}

    yell(objectId: number, text: string, now: number): void
    {
        let yell = this._yells.get(objectId);

        if(!yell)
        {
            const window = this._build('vortex_combat_yell_xml') as ITextWindow | null;

            if(!window) return;

            yell = {window, born: 0};
            this._yells.set(objectId, yell);
        }

        yell.window.caption = text;
        yell.window.visible = false;
        yell.born = now;
    }

    /** Follows the anchors and fades the yells out; true while one remains. */
    tick(anchors: IAnchorSource | null, point: {x: number; y: number}, now: number): boolean
    {
        for(const [objectId, yell] of this._yells)
        {
            const age = now - yell.born;

            if(age >= YELL_MS)
            {
                this.remove(objectId);
                continue;
            }

            const shown = anchors !== null && anchors.getRpgAnchor(objectId, point);

            yell.window.visible = shown;
            if(!shown) continue;

            yell.window.x = Math.round(point.x - YELL_HALF);
            yell.window.y = Math.round(point.y - 52);
            yell.window.blend = Math.min(1, 4 * (1 - age / YELL_MS));
        }

        return this._yells.size > 0;
    }

    ids(): IterableIterator<number>
    {
        return this._yells.keys();
    }

    remove(objectId: number): void
    {
        this._yells.get(objectId)?.window.destroy();
        this._yells.delete(objectId);
    }

    clear(): void
    {
        for(const yell of this._yells.values()) yell.window.destroy();
        this._yells.clear();
    }
}
