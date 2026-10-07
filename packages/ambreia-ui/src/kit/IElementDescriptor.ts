/**
 * Interfaces for element descriptor data structures.
 *
 * These describe the parsed element-description XML asset (see the client's
 * WindowXmlAssetParser). Each descriptor defines the defaults, states, and rendering info
 * for a particular element type + style combination.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/graphics/SkinContainer.as
 */

/**
 * Default attribute values for an element type+style.
 */
export interface IElementDefaults {
    threshold: number;
    background: boolean;
    blend: number;
    color: number;
    widthMin: number;
    widthMax: number;
    heightMin: number;
    heightMax: number;
}

/**
 * A visual state entry linking a state name to layout+template names.
 */
export interface IElementState {
    name: string;
    layout: string;
    template: string;
}

/**
 * Describes how a single element type+style should be rendered.
 */
export interface IElementDescriptor {
    /** Element type tag name (e.g. "button", "frame") */
    type: string;

    /** Resolved numeric type ID */
    typeId: number;

    /** Intent string */
    intent: string;

    /** Numeric style (0 = default) */
    style: number;

    /** Renderer class name */
    renderer: string;

    /** Skin asset name */
    asset: string;

    /** Layout name */
    layout: string;

    /** Window layout reference */
    windowLayout: string;

    /** Default attribute values */
    defaults: IElementDefaults;

    /** Visual states */
    states: IElementState[];
}

/**
 * Top-level element description structure as produced by the build tool.
 */
export interface IElementDescriptionData {
    id: string;
    source: string;
    elements: IElementDescriptor[];
}
