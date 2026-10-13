import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import {BAR_FILL, BAR_HALF} from './barGeometry';
import type {IAnchorSource} from './IAnchorSource';

/** A cast fills, a channel empties (M1b §6.3); the bar sits under the health bar. */
const CAST_COLOR = 0xe8b830;
const CHANNEL_COLOR = 0x5aa0e8;
const CAST_DROP = 8;
/** A cast whose RpgCastEnd never came goes this long after its end. */
const CAST_GRACE_MS = 1000;

interface ICast
{
    window: IWindowContainer;
    fill: IWindow | null;
    born: number;
    duration: number;
    channel: boolean;
}

/** A cast bar under the health bar of whoever casts (M1b §10.3), from its RpgCastStart to its RpgCastEnd. */
export class CastBars
{
    private readonly _casts = new Map<number, ICast>();

    constructor(private readonly _build: (layout: string) => IWindow | null) {}

    start(objectId: number, durationMs: number, channel: boolean, now: number): void
    {
        this.end(objectId);

        const window = this._build('vortex_combat_bar_xml') as IWindowContainer | null;
        const fill = window?.findChildByName('fill') ?? null;

        if(!window) return;

        if(fill) fill.color = channel ? CHANNEL_COLOR : CAST_COLOR;
        this._casts.set(objectId, {window, fill, born: now, duration: Math.max(1, durationMs), channel});
    }

    end(objectId: number): void
    {
        this._casts.get(objectId)?.window.destroy();
        this._casts.delete(objectId);
    }

    /** Fills or empties the bars; true while one remains. */
    tick(anchors: IAnchorSource | null, point: {x: number; y: number}, now: number): boolean
    {
        for(const [objectId, cast] of this._casts)
        {
            const age = now - cast.born;

            if(age >= cast.duration + CAST_GRACE_MS)
            {
                // Deleting the current entry while iterating a Map is safe.
                this.end(objectId);
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

        return this._casts.size > 0;
    }

    ids(): IterableIterator<number>
    {
        return this._casts.keys();
    }

    clear(): void
    {
        for(const cast of this._casts.values()) cast.window.destroy();
        this._casts.clear();
    }
}
