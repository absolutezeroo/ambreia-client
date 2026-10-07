import type {IWindow} from '../IWindow';
import type {ISkinRenderer} from '../graphics/renderer/ISkinRenderer';
import {STATE_NAME_TO_VALUE, WindowState} from '../enum/WindowState';

export interface ISkinPreviewFrame
{
    stateName: string;
    state: number;
    canvas: OffscreenCanvas;
}

/**
 * Dev-only tooling for the visual window debugger (vortex-engine/src/core/window/debugger).
 * Renders every drawable state of a skin renderer into standalone canvases.
 * No AS3 equivalent — production draws skins directly into a window's own
 * draw buffer via WindowRendererItem, never in isolation.
 */
export class SkinPreviewRenderer
{
    // draw() only ever reads window.color/window.background (and, for
    // ShapeSkinRenderer, an optional strokeHsvShade) — a minimal stub is
    // enough to preview any renderer without spawning a real IWindow.
    private static readonly _previewWindow = {color: 0xffffff, background: false} as unknown as IWindow;

    public static renderStates(renderer: ISkinRenderer): ISkinPreviewFrame[]
    {
        const frames: ISkinPreviewFrame[] = [];

        for(const [stateName, state] of Object.entries(STATE_NAME_TO_VALUE))
        {
            if(state === WindowState.DESTROYING || !renderer.isStateDrawable(state))
            {
                continue;
            }

            const layout = renderer.getLayoutByState(state);

            if(!layout) continue;

            const width = Math.max(1, layout.width);
            const height = Math.max(1, layout.height);
            const canvas = new OffscreenCanvas(width, height);
            const ctx = canvas.getContext('2d');

            if(!ctx) continue;

            ctx.imageSmoothingEnabled = false;
            renderer.draw(SkinPreviewRenderer._previewWindow, ctx, {x: 0, y: 0, width, height}, state, true);

            frames.push({stateName, state, canvas});
        }

        return frames;
    }
}
