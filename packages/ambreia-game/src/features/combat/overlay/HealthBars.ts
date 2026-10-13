import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import {BAR_FILL, BAR_HALF} from './barGeometry';
import type {IAnchorSource} from './IAnchorSource';

interface IBar
{
    window: IWindowContainer;
    fill: IWindow | null;
    /** A monster's bar always shows; a player's only while hurt (M1a §9.3). */
    always: boolean;
    hurt: boolean;
}

/** A health bar above each monster and each hurt player (vortex_combat_bar_xml). */
export class HealthBars
{
    private readonly _bars = new Map<number, IBar>();

    constructor(private readonly _build: (layout: string) => IWindow | null) {}

    set(objectId: number, health: number, maxHealth: number, always: boolean): void
    {
        let bar = this._bars.get(objectId);

        if(!bar)
        {
            const window = this._build('vortex_combat_bar_xml') as IWindowContainer | null;

            if(!window) return;

            bar = {window, fill: window.findChildByName('fill'), always, hurt: false};
            this._bars.set(objectId, bar);
        }

        bar.always = bar.always || always;
        bar.hurt = health < maxHealth;
        if(bar.fill) bar.fill.width = maxHealth > 0 ? Math.max(0, Math.round(BAR_FILL * Math.min(1, health / maxHealth))) : 0;
    }

    /** Follows the anchors; true while a bar shows. */
    tick(anchors: IAnchorSource | null, point: {x: number; y: number}): boolean
    {
        let showing = false;

        for(const [objectId, bar] of this._bars)
        {
            showing ||= bar.always || bar.hurt;

            const shown = (bar.always || bar.hurt) && anchors !== null && anchors.getRpgAnchor(objectId, point);

            bar.window.visible = shown;
            if(!shown) continue;

            bar.window.x = Math.round(point.x - BAR_HALF);
            bar.window.y = Math.round(point.y - 10);
        }

        return showing;
    }

    ids(): IterableIterator<number>
    {
        return this._bars.keys();
    }

    remove(objectId: number): void
    {
        this._bars.get(objectId)?.window.destroy();
        this._bars.delete(objectId);
    }

    clear(): void
    {
        for(const bar of this._bars.values()) bar.window.destroy();
        this._bars.clear();
    }
}
