/**
 * Interfaces for window layout data structures.
 *
 * These describe a parsed window-layout XML asset (see the client's
 * WindowXmlAssetParser). A layout is a tree of nodes, each representing a window element.
 *
 * @see sources/win63_version/habbo/window/HabboWindowManagerComponent.as
 */

/**
 * Attributes on a layout node — corresponds to XML attributes.
 */
export interface IWindowLayoutAttributes
{
    name?: string;
    x?: string;
    y?: string;
    width?: string;
    height?: string;
    style?: string;
    caption?: string;
    visible?: string;
    tags?: string;
    clipping?: string;
    blend?: string;
    color?: string;
    background?: string;
    widget?: string;

    // `| undefined`, not the house `| null`: an index signature must be a supertype of every
    // declared property, and the optional ones above are `string | undefined`.
    // eslint-disable-next-line no-restricted-syntax
    [key: string]: string | undefined;
}

/**
 * A single node in the layout tree.
 */
export interface IWindowLayoutNode
{
    /** Element tag name (e.g. "frame", "button", "container") */
    tag: string;

    /** Resolved type ID (-1 if unknown) */
    typeId: number;

    /** Attribute key/value pairs */
    attributes: IWindowLayoutAttributes;

    /** Child nodes */
    children: IWindowLayoutNode[];

    /** Resolved param flags (bitwise OR of WindowParam values) */
    params?: number;
}

/**
 * A filter applied to the layout (e.g. DropShadowFilter).
 */
export interface IWindowLayoutFilter
{
    type: string;
    attributes: Record<string, string>;
}

/**
 * Top-level layout structure as produced by the build tool.
 */
export interface IWindowLayout
{
    /** Layout name (used as identifier) */
    name: string;

    /** Source file path (for debugging) */
    source?: string;

    /** Root window node */
    window: IWindowLayoutNode;

    /** Variable definitions for $var substitution */
    vars: Record<string, unknown>;

    /** Filters to apply */
    filters: IWindowLayoutFilter[];
}
