import type {IFurniturePaletteEntry} from '@ambreia/map-editor-core/api/IFurniturePaletteEntry';
import type {LayerState} from '@ambreia/map-editor-core/layers/LayerState';
import type {ZoneDocument} from '@ambreia/map-editor-core/zone/Zone.generated';

/** Everything the view draws, rebuilt by the app after each change. */
export interface IViewModel
{
    readonly doc: ZoneDocument;
    readonly furniture: (definition: number) => IFurniturePaletteEntry | null;
    readonly layers: LayerState;
    readonly selectedIds: ReadonlySet<string>;
    /** Tile indexes (y * width + x). */
    readonly selectedCells: ReadonlySet<number>;
    readonly strokeCells: ReadonlySet<number>;
    readonly hover: {readonly x: number; readonly y: number} | null;
    /** Cells the selected objects are being dragged by. */
    readonly dragOffset: {readonly dx: number; readonly dy: number} | null;
    /** The furniture the place tool would put under the pointer. */
    readonly ghost: IFurniturePaletteEntry | null;
}
