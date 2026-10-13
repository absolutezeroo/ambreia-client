import type {IWindow} from '@ambreia/ui/IWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import {BAR_HALF} from './barGeometry';
import type {IAnchorSource} from './IAnchorSource';

/** A status icon beside the health bar of whoever is slowed or stunned (M1c, vortex_combat_mark_xml). */
export class HoldMarks
{
    private readonly _marks = new Map<number, IStaticBitmapWrapperWindow>();

    constructor(private readonly _build: (layout: string) => IWindow | null) {}

    /** The icon of what holds this object back; null takes it away. */
    set(objectId: number, icon: string | null): void
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
            const window = this._build('vortex_combat_mark_xml') as IStaticBitmapWrapperWindow | null;

            if(!window) return;

            mark = window;
            mark.visible = false;
            this._marks.set(objectId, mark);
        }

        if(mark.assetUri !== icon) mark.assetUri = icon;
    }

    /** Follows the anchors; true while a mark remains. */
    tick(anchors: IAnchorSource | null, point: {x: number; y: number}): boolean
    {
        for(const [objectId, mark] of this._marks)
        {
            const shown = anchors !== null && anchors.getRpgAnchor(objectId, point);

            mark.visible = shown;
            if(!shown) continue;

            mark.x = Math.round(point.x + BAR_HALF + 2);
            mark.y = Math.round(point.y - 14);
        }

        return this._marks.size > 0;
    }

    ids(): IterableIterator<number>
    {
        return this._marks.keys();
    }

    clear(): void
    {
        for(const mark of this._marks.values()) mark.destroy();
        this._marks.clear();
    }
}
