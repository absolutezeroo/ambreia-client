import type {IWindow} from '../../IWindow';
import {SkinRenderer} from './SkinRenderer';

/**
 * Fills the target rectangle with the window's color.
 *
 * Used for simple backgrounds and solid color fills where no bitmap
 * skin is needed (renderer type "fill" in element descriptions).
 *
 * @see sources/win63_version/core/window/graphics/renderer/FillSkinRenderer.as
 */
export class FillSkinRenderer extends SkinRenderer
{
    constructor(name: string)
    {
        super(name);
    }

    /**
	 * Fills the target rectangle with the window color.
	 *
	 * Equivalent of AS3 `param2.fillRect(param3, param1.color)`.
	 *
	 * @param window - The window to render
	 * @param ctx - The canvas context to draw into
	 * @param rect - The target rectangle
	 * @param _state - The resolved window state (unused)
	 * @param _colorize - Colorization flag (unused)
	 */
    public override draw(
        window: IWindow,
        ctx: OffscreenCanvasRenderingContext2D,
        rect: { x: number; y: number; width: number; height: number },
        _state: number,
        _colorize: boolean
    ): void
    {
        const color = window.color;
        const a = ((color >> 24) & 0xFF) / 255;
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;

        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }
}
