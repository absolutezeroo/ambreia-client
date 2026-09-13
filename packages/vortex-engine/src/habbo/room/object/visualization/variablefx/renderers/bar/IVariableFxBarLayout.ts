import type {VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';

/**
 * A bar's measurements, derived once from its background artwork and its configured width.
 *
 * AS3 passes this around as an untyped `Object`; written down here because six methods read it and
 * a typo in one of them would be a silently misplaced fill.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/bar/ClassicProgressBarRenderer.as::resolveLayout()
 */
export interface IVariableFxBarLayout
{
    /** Total bar width, from the config's size name. */
    width: number;
    /** Total bar height — the background artwork's, not a constant. */
    height: number;
    /** Where the fill starts inside the bar, i.e. the border thickness. */
    fillX: number;
    fillY: number;
    /** The fillable area: the bar minus its border on both sides. */
    fillWidth: number;
    fillHeight: number;
    /** Nine-slice caps for the FILL artwork. The background's are computed separately. */
    sliceLeftWidth: number;
    sliceRightWidth: number;
}

/** One blended pass over the fill — a darkening or a lighting layer. */
export interface IVariableFxBarOverlay
{
    blendMode: string;
    layer: VariableFxDrawable;
}

/** The artwork a bar renderer draws with, resolved once per config. */
export interface IVariableFxBarAssets
{
    background: VariableFxDrawable;
    bar: VariableFxDrawable;
    /** Only for a metallic paint colour; null otherwise. */
    metallic: VariableFxDrawable | null;
    overlays: IVariableFxBarOverlay[];
}

/** The asset NAMES a bar renderer family uses — the one thing the mini bar overrides. */
export interface IVariableFxBarAssetNames
{
    background: string;
    bar: string;
    darkening: string;
    lighting: string;
    metallic: string | null;
}
