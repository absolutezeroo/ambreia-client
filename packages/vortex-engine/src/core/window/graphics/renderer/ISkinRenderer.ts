import type {IWindow} from '../../IWindow';
import type {IDisposable} from "@ambreia/common/IDisposable";
import type {SkinLayout} from './SkinLayout';
import type {SkinTemplate} from './SkinTemplate';

/**
 * Interface for skin renderers.
 *
 * A skin renderer draws a window's visual background using bitmap templates
 * (9-slice), solid fills, or other techniques. Each element type+style
 * combination has one ISkinRenderer registered in the SkinContainer.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as
 */
export interface ISkinRenderer extends IDisposable
{
    /**
	 * The renderer name.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::get name()
    readonly name: string;

    /**
	 * Draws the window skin onto the given canvas context.
	 *
	 * @param window - The window to render
	 * @param ctx - The 2D rendering context
	 * @param rect - The target rectangle
	 * @param state - The resolved window state
	 * @param colorize - Whether to apply colorization
	 */
    /**
	 * Feeds this renderer its own skin description.
	 *
	 * AS3 takes (asset, XMLList of states, asset library) and lets each renderer
	 * parse its embedded XML; this port hands renderers their already-parsed data
	 * (BitmapSkinParser.parse()), so the only subclass that still needs the raw
	 * source is TextSkinRenderer, which takes the stylesheet text.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::parse()
    parse(source?: string): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::draw()
    draw(
        window: IWindow,
        ctx: OffscreenCanvasRenderingContext2D,
        rect: { x: number; y: number; width: number; height: number },
        state: number,
        colorize: boolean
    ): void;

    /**
	 * Tests whether a given state has drawable content.
	 *
	 * @param state - The window state flags
	 * @returns True if the state can be drawn
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::isStateDrawable()
    isStateDrawable(state: number): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::addLayout()
    addLayout(layout: SkinLayout): SkinLayout;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::getLayoutByName()
    getLayoutByName(name: string): SkinLayout | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::removeLayout()
    removeLayout(layout: SkinLayout): SkinLayout | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::getLayoutByState()
    getLayoutByState(state: number): SkinLayout | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::registerLayoutForRenderState()
    registerLayoutForRenderState(state: number, layoutName: string): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::removeLayoutFromRenderState()
    removeLayoutFromRenderState(state: number): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::hasLayoutForState()
    hasLayoutForState(state: number): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::addTemplate()
    addTemplate(template: SkinTemplate): SkinTemplate;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::getTemplateByName()
    getTemplateByName(name: string): SkinTemplate | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::removeTemplate()
    removeTemplate(template: SkinTemplate): SkinTemplate | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::getTemplateByState()
    getTemplateByState(state: number): SkinTemplate | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::registerTemplateForRenderState()
    registerTemplateForRenderState(state: number, templateName: string): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::removeTemplateFromRenderState()
    removeTemplateFromRenderState(state: number): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinRenderer.as::hasTemplateForState()
    hasTemplateForState(state: number): boolean;
}
