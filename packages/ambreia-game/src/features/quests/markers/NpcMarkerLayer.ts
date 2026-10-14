import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IAnchors} from './IAnchors';
import {markerLook} from './markerLook';

/** Half the marker's width, and how far above the head anchor it floats. */
const HALF = 12;
const ABOVE = 34;
const DIM = 0.45;

/**
 * « ! » and « ? » over the zone's NPCs (vortex_npc_marker_xml, M2a §4.4), following the camera while
 * any is shown. A marker for a unit the room does not know yet waits hidden until it has an anchor.
 */
export class NpcMarkerLayer
{
    private readonly _marks = new Map<number, IWindowContainer>();
    private readonly _point = {x: 0, y: 0};
    private _frame: number | null = null;
    private _disposed = false;

    constructor(private readonly _build: () => IWindowContainer | null, private readonly _anchors: () => IAnchors | null) {}

    set(markers: ReadonlyMap<number, string>): void
    {
        for(const [objectId, mark] of this._marks)
        {
            if(markerLook(markers.get(objectId) ?? '') === null)
            {
                mark.destroy();
                this._marks.delete(objectId);
            }
        }

        for(const [objectId, marker] of markers)
        {
            const look = markerLook(marker);

            if(!look) continue;

            let mark = this._marks.get(objectId);

            if(!mark)
            {
                const built = this._build();

                if(!built) return;

                mark = built;
                mark.visible = false;
                this._marks.set(objectId, mark);
            }

            const icon = mark.findChildByName('marker_icon') as IStaticBitmapWrapperWindow | null;

            if(icon && icon.assetUri !== look.icon) icon.assetUri = look.icon;
            const talk = mark.findChildByName('talk_icon');

            if(talk) talk.visible = false;
            mark.blend = look.dim ? DIM : 1;
        }

        this.run();
    }

    clear(): void
    {
        for(const mark of this._marks.values()) mark.destroy();
        this._marks.clear();
    }

    private run(): void
    {
        if(this._frame !== null || this._disposed || this._marks.size === 0 || typeof requestAnimationFrame === 'undefined') return;

        this._frame = requestAnimationFrame(this._tick);
    }

    private readonly _tick = (): void =>
    {
        this._frame = null;

        const anchors = this._anchors();

        for(const [objectId, mark] of this._marks)
        {
            const shown = anchors !== null && anchors.getRpgAnchor(objectId, this._point);

            mark.visible = shown;
            if(!shown) continue;

            mark.x = Math.round(this._point.x - HALF);
            mark.y = Math.round(this._point.y - ABOVE);
        }

        this.run();
    };

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        if(this._frame !== null && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this._frame);
        this.clear();
    }
}
