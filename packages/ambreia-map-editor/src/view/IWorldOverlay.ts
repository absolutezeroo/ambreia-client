import type {LayerKey} from '@ambreia/map-editor-core/zone/LayerKey';
import type {IElementRef} from '../app/IElementRef';

type Cell = {readonly x: number; readonly y: number};

/** What the view needs to draw the world layers' editing state. */
export interface IWorldOverlay
{
    /** The layer the current category edits (its elements are drawn on top), or null. */
    readonly layer: LayerKey | null;
    readonly element: IElementRef | null;
    /** Points of the polygon being drawn. */
    readonly polygon: readonly Cell[];
    /** Cells of the rectangle being drawn. */
    readonly preview: readonly Cell[];
    /** The selected element being dragged by. */
    readonly dragOffset: {readonly dx: number; readonly dy: number} | null;
}
