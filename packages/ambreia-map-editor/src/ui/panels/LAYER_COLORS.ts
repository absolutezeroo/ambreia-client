import type {LayerName} from '@ambreia/map-editor-core/layers/LayerName';

/** The colour of each layer's swatch (ARGB), the same the view uses for its overlays. */
export const LAYER_COLORS: Readonly<Record<LayerName, number>> = {
    floor: 0xff4caf50,
    decor: 0xfff08a24,
    npcs: 0xff3f7fd0,
    spawns: 0xffe84d4d,
    zones: 0xfff2c94c,
    triggers: 0xffa46ee8,
    ambience: 0xff26a69a
};
