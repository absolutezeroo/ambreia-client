import type {IWindow} from '../../IWindow';
import type {StrokeController} from '../../components/StrokeController';
import {SkinRenderer} from './SkinRenderer';
import {ShapeSkinRenderer} from './ShapeSkinRenderer';

/**
 * Draws a stroke-only outline, either as a single rounded-rect stroke
 * (when all sides are enabled and a corner radius is set) or as up to
 * four independent per-side filled strips (sharp corners).
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/StrokeSkinRenderer.as
 */
export class StrokeSkinRenderer extends SkinRenderer
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/StrokeSkinRenderer.as::SIDE_MASK_ALL
    private static readonly SIDE_MASK_ALL: number = 15;

    constructor(name: string)
    {
        super(name);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/StrokeSkinRenderer.as::draw()
    public override draw(
        window: IWindow,
        ctx: OffscreenCanvasRenderingContext2D,
        rect: { x: number; y: number; width: number; height: number },
        _state: number,
        _colorize: boolean
    ): void
    {
        const strokeWindow = window as unknown as StrokeController;

        if(!strokeWindow || !rect || rect.width <= 0 || rect.height <= 0)
        {
            return;
        }

        ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

        if(strokeWindow.strokeThickness <= 0)
        {
            return;
        }

        const sideMask = strokeWindow.sideMask;

        // AS3 does not draw the stroke itself: both branches call into
        // ShapeSkinRenderer, which owns the snapping and the corner clamp. The two
        // helpers were inlined here, so the same code lived twice and only one copy
        // snapped its edges.
        if(sideMask === StrokeSkinRenderer.SIDE_MASK_ALL && strokeWindow.radius > 0)
        {
            ShapeSkinRenderer.drawRoundRectStroke(
                ctx,
                rect.x,
                rect.y,
                rect.width,
                rect.height,
                strokeWindow.radius,
                strokeWindow.strokeThickness,
                window.color
            );

            return;
        }

        ShapeSkinRenderer.drawRectStrokeSides(
            ctx,
            rect.x,
            rect.y,
            rect.width,
            rect.height,
            strokeWindow.strokeThickness,
            window.color,
            (sideMask & 1) !== 0,
            (sideMask & 2) !== 0,
            (sideMask & 4) !== 0,
            (sideMask & 8) !== 0
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/StrokeSkinRenderer.as::isStateDrawable()
    public override isStateDrawable(_state: number): boolean
    {
        return true;
    }
}
