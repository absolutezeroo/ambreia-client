import type {LayerName} from './LayerName';

/** Visible and locked per layer: editor state, never saved in the document. */
export class LayerState
{
    static readonly NAMES: readonly LayerName[] = ['floor', 'decor', 'npcs', 'spawns', 'zones', 'triggers', 'ambience'];

    private readonly _hidden = new Set<LayerName>();
    private readonly _locked = new Set<LayerName>();

    isVisible(layer: LayerName): boolean
    {
        return !this._hidden.has(layer);
    }

    isLocked(layer: LayerName): boolean
    {
        return this._locked.has(layer);
    }

    /** A hidden or locked layer takes no clicks. */
    isEditable(layer: LayerName): boolean
    {
        return this.isVisible(layer) && !this.isLocked(layer);
    }

    setVisible(layer: LayerName, visible: boolean): void
    {
        if(visible) this._hidden.delete(layer);
        else this._hidden.add(layer);
    }

    setLocked(layer: LayerName, locked: boolean): void
    {
        if(locked) this._locked.add(layer);
        else this._locked.delete(layer);
    }
}
