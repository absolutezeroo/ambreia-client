import type {IWindow} from '../../IWindow';
import type {ISkinRenderer} from './ISkinRenderer';
import type {SkinLayout} from './SkinLayout';
import type {SkinTemplate} from './SkinTemplate';

/**
 * A single etching offset, in pixels, from `SkinRenderer.ETCHING_POSITION`.
 */
export interface IEtchingOffset
{
    x: number;
    y: number;
}

/**
 * Base skin renderer with template and layout storage.
 *
 * Manages named templates and layouts, and their mapping to window states.
 * Subclasses implement the actual draw() method.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as
 */
export class SkinRenderer implements ISkinRenderer
{
    /**
	 * Pixel offset of the etched (embossed) copy of a window's content, by
	 * etching-position name.
	 *
	 * Lives on the base class in AS3 too — `TextSkinRenderer` and
	 * `LabelRenderer` both read it via inheritance, which is why it is
	 * `protected static` rather than private to either.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::ETCHING_POSITION
    protected static readonly ETCHING_POSITION: Readonly<Record<string, IEtchingOffset>> =
        {
            'top-left': {x: -1, y: -1},
            'top': {x: 0, y: -1},
            'top-right': {x: 1, y: -1},
            'left': {x: -1, y: 0},
            'right': {x: 1, y: 0},
            'bottom-left': {x: -1, y: 1},
            'bottom': {x: 0, y: 1},
            'bottom-right': {x: 1, y: 1}
        };

    /** Templates by name. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::_templatesByName
    protected _templatesByName: Map<string, SkinTemplate> = new Map();
    /** Templates by window state flag. */
    protected _templatesByState: Map<number, SkinTemplate> = new Map();
    /** Layouts by name. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::_layoutsByName
    protected _layoutsByName: Map<string, SkinLayout> = new Map();
    /** Layouts by window state flag. */
    protected _layoutsByState: Map<number, SkinLayout> = new Map();

    constructor(name: string)
    {
        this._name = name;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::_name
    protected _name: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::get name()
    public get name(): string
    {
        return this._name;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::_disposed
    protected _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    /**
     * Parses a skin XML description into this renderer's templates/layouts.
     *
     * AS3 does this at runtime from an embedded XML asset; this port compiles
     * skin XML to JSON ahead of time (see BitmapSkinParser.parse()), so this
     * base implementation is a no-op, matching AS3's own empty base method.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::parse()
    public parse(_source?: string): void
    {
        // Override in subclasses; base AS3 implementation is also empty.
    }

    /**
     * Registers a template by name.
     *
     * @param template - The template to register
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::addTemplate()
    public addTemplate(template: SkinTemplate): SkinTemplate
    {
        this._templatesByName.set(template.name, template);

        return template;
    }

    /**
     * Returns a template by name.
     *
     * @param name - The template name
     * @returns The template, or null
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::getTemplateByName()
    public getTemplateByName(name: string): SkinTemplate | null
    {
        return this._templatesByName.get(name) ?? null;
    }

    /**
     * Removes a template (looked up by its name) from this renderer, unmapping
     * it from any render states it was registered for.
     *
     * @param template - The template to remove
     * @returns The removed template, or null if it wasn't registered
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::removeTemplate()
    public removeTemplate(template: SkinTemplate): SkinTemplate | null
    {
        const resolved = this._templatesByName.get(template.name);

        if(!resolved) return null;

        for(const [state, mapped] of this._templatesByState)
        {
            if(mapped === resolved)
            {
                this.removeTemplateFromRenderState(state);
            }
        }

        this._templatesByName.delete(resolved.name);

        return resolved;
    }

    /**
     * Maps a window state to a template by name.
     *
     * @param state - The window state flag
     * @param templateName - The template name
     * @throws If no template with that name is registered
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::registerTemplateForRenderState()
    public registerTemplateForRenderState(state: number, templateName: string): void
    {
        const template = this._templatesByName.get(templateName);

        if(!template)
        {
            throw new Error(`Template "${templateName}" not found in renderer!`);
        }

        this._templatesByState.set(state, template);
    }

    /**
     * Unmaps a window state from its template.
     *
     * @param state - The window state flag
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::removeTemplateFromRenderState()
    public removeTemplateFromRenderState(state: number): void
    {
        this._templatesByState.delete(state);
    }

    /**
     * Returns the template mapped to a state.
     *
     * @param state - The window state flag
     * @returns The template, or null
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::getTemplateByState()
    public getTemplateByState(state: number): SkinTemplate | null
    {
        return this._templatesByState.get(state) ?? null;
    }

    /**
     * Tests whether a state has a template mapped.
     *
     * @param state - The window state flag
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::hasTemplateForState()
    public hasTemplateForState(state: number): boolean
    {
        return this._templatesByState.has(state);
    }

    /**
     * Registers a layout by name.
     *
     * @param layout - The layout to register
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::addLayout()
    public addLayout(layout: SkinLayout): SkinLayout
    {
        this._layoutsByName.set(layout.name, layout);

        return layout;
    }

    /**
     * Returns a layout by name.
     *
     * @param name - The layout name
     * @returns The layout, or null
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::getLayoutByName()
    public getLayoutByName(name: string): SkinLayout | null
    {
        return this._layoutsByName.get(name) ?? null;
    }

    /**
     * Removes a layout (looked up by its name) from this renderer, unmapping
     * it from any render states it was registered for.
     *
     * @param layout - The layout to remove
     * @returns The removed layout, or null if it wasn't registered
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::removeLayout()
    public removeLayout(layout: SkinLayout): SkinLayout | null
    {
        const resolved = this._layoutsByName.get(layout.name);

        if(!resolved) return null;

        for(const [state, mapped] of this._layoutsByState)
        {
            if(mapped === resolved)
            {
                this.removeLayoutFromRenderState(state);
            }
        }

        this._layoutsByName.delete(resolved.name);

        return resolved;
    }

    /**
     * Maps a window state to a layout by name.
     *
     * @param state - The window state flag
     * @param layoutName - The layout name
     * @throws If no layout with that name is registered
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::registerLayoutForRenderState()
    public registerLayoutForRenderState(state: number, layoutName: string): void
    {
        const layout = this._layoutsByName.get(layoutName);

        if(!layout)
        {
            throw new Error(`Layout "${layoutName}" not found in renderer!`);
        }

        this._layoutsByState.set(state, layout);
    }

    /**
     * Unmaps a window state from its layout.
     *
     * @param state - The window state flag
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::removeLayoutFromRenderState()
    public removeLayoutFromRenderState(state: number): void
    {
        this._layoutsByState.delete(state);
    }

    /**
     * Returns the layout mapped to a state.
     *
     * @param state - The window state flag
     * @returns The layout, or null
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::getLayoutByState()
    public getLayoutByState(state: number): SkinLayout | null
    {
        return this._layoutsByState.get(state) ?? null;
    }

    /**
     * Tests whether a state has a layout mapped.
     *
     * @param state - The window state flag
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::hasLayoutForState()
    public hasLayoutForState(state: number): boolean
    {
        return this._layoutsByState.has(state);
    }

    /**
     * Tests whether a state has drawable content.
     *
     * The base renderer draws nothing, so no state is drawable — subclasses
     * that do draw say so themselves. This is what makes `renderer="unknown"`
     * (which AS3 maps to this class directly) a descriptor that resolves to a
     * real object and still never renders.
     *
     * @returns Always false
     * @param _state
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::isStateDrawable()
    public isStateDrawable(_state: number): boolean
    {
        return false;
    }

    /**
     * Draws the skin. Override in subclasses.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::draw()
    public draw(
        _window: IWindow,
        _ctx: OffscreenCanvasRenderingContext2D,
        _rect: { x: number; y: number; width: number; height: number },
        _state: number,
        _colorize: boolean
    ): void
    {
        // Override in subclasses
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinRenderer.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._templatesByName.clear();
        this._templatesByState.clear();
        this._layoutsByName.clear();
        this._layoutsByState.clear();
    }
}
