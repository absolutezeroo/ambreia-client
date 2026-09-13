/**
 * The four Flash blend modes the VariableFx renderers use, and what Canvas2D calls them.
 *
 * Counted rather than guessed — a grep over every renderer and rendering helper in the AIR dump
 * gives normal (72), layer (24), add (22), multiply (19) and nothing else. A mode outside that set
 * would silently draw as `source-over`, so it is logged instead.
 *
 * `layer` is the one with no counterpart: in Flash it forces the display object onto its own
 * temporary surface before compositing, which is a rendering hint rather than a formula. Every use
 * of it here is a plain overlay onto a scratch bitmap the renderer already owns, so `source-over`
 * IS the behaviour — the isolation Flash needed is already there.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/rendering/VariableFxBitmapComposer.as
 */
import {Logger} from '@core/utils/Logger';

const log = Logger.getLogger('habbo.room.object.visualization.variablefx.rendering.VariableFxBlendMode');

const MODES = new Map<string, GlobalCompositeOperation>([
    ['normal', 'source-over'],
    ['layer', 'source-over'],
    ['add', 'lighter'],
    ['multiply', 'multiply']
]);

export function toCanvasBlendMode(blendMode: string): GlobalCompositeOperation
{
    const mode = MODES.get(blendMode);

    if(mode === undefined)
    {
        log.warn(`Unmapped VariableFx blend mode "${blendMode}" — drawing it as normal`);

        return 'source-over';
    }

    return mode;
}
