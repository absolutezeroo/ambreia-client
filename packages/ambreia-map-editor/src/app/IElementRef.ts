import type {LayerKey} from '@ambreia/map-editor-core/zone/LayerKey';

/** One element of a world layer, by its stable id. */
export interface IElementRef
{
    readonly layer: LayerKey;
    readonly id: string;
}
