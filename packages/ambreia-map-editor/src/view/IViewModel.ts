import type {IFurniturePaletteEntry} from '@ambreia/map-editor-core/api/IFurniturePaletteEntry';
import type {LayerState} from '@ambreia/map-editor-core/layers/LayerState';
import type {ZoneDocument} from '@ambreia/map-editor-core/zone/Zone.generated';
import type {FurnitureSprites} from './FurnitureSprites';
import type {IViewOptions} from './IViewOptions';
import type {IWorldOverlay} from './IWorldOverlay';

/** Everything the view draws, rebuilt by the app after each change. */
export interface IViewModel
{
    readonly doc: ZoneDocument;
    readonly furniture: (definition: number) => IFurniturePaletteEntry | null;
    readonly sprites: FurnitureSprites;
    readonly options: IViewOptions;
    readonly layers: LayerState;
    readonly selectedIds: ReadonlySet<string>;
    /** Tile indexes (y * width + x). */
    readonly selectedCells: ReadonlySet<number>;
    /** The cells of the floor stroke under way, past the floor's edges too (the tools that grow it). */
    readonly stroke: readonly {readonly x: number; readonly y: number}[];
    readonly hover: {readonly x: number; readonly y: number} | null;
    /** Cells the selected objects are being dragged by. */
    readonly dragOffset: {readonly dx: number; readonly dy: number} | null;
    /** The furniture the place tool would put under the pointer. */
    readonly ghost: IFurniturePaletteEntry | null;
    /** The world layers' editing state (selected element, shape being drawn). */
    readonly world: IWorldOverlay;
}
