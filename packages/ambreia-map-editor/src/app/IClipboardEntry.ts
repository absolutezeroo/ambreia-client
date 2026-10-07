import type {ZoneDecorObject} from '@ambreia/map-editor-core/zone/Zone.generated';

/** What Copier holds: the objects and the cell they were copied from, so Coller lands under the pointer. */
export interface IClipboardEntry
{
    readonly objects: readonly ZoneDecorObject[];
    readonly originX: number;
    readonly originY: number;
}
