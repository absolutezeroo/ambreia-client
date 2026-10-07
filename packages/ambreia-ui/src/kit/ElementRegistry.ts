import type {IElementDefaults, IElementDescriptionData, IElementDescriptor} from './IElementDescriptor';
import {WindowStyle} from './enum/WindowStyle';

/**
 * Registry of element descriptors indexed by [typeId][style].
 *
 * TS-only: not a direct AS3 class. Indexes the compiled `element-description.json`
 * data (typeId/style -> descriptor) that HabboWindowManager.loadElementDescription()
 * feeds into SkinContainer/HabboWidgetFactory/etc. The style-fallback-to-DEFAULT
 * lookup semantics mirror the real AS3 SkinContainer (see SkinContainer.ts),
 * which this registry doesn't replace.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/SkinContainer.as
 */
export class ElementRegistry
{
    /** [typeId] -> Map<style, IElementDescriptor> */
    private _descriptors: Map<number, Map<number, IElementDescriptor>> = new Map();

    /**
	 * Load element descriptors from compiled element-description.json data.
	 *
	 * @param data - The parsed element description JSON
	 */
    load(data: IElementDescriptionData): void
    {
        for(const element of data.elements)
        {
            const typeId = element.typeId;
            const style = element.style;

            if(typeId < 0) continue;

            let styleMap = this._descriptors.get(typeId);

            if(!styleMap)
            {
                styleMap = new Map();
                this._descriptors.set(typeId, styleMap);
            }

            styleMap.set(style, element);
        }
    }

    /**
	 * Get the element descriptor for a given type and style.
	 * Falls back to style 0 (DEFAULT) if the requested style is not found.
	 *
	 * @param typeId - The element type ID
	 * @param style - The style index (default 0)
	 * @returns The descriptor, or null if not found
	 */
    getDescriptor(typeId: number, style: number = WindowStyle.DEFAULT): IElementDescriptor | null
    {
        const styleMap = this._descriptors.get(typeId);

        if(!styleMap) return null;

        const descriptor = styleMap.get(style);

        if(descriptor) return descriptor;

        if(style !== WindowStyle.DEFAULT)
        {
            return styleMap.get(WindowStyle.DEFAULT) ?? null;
        }

        return null;
    }

    /**
	 * Get the default attributes for a given type and style.
	 *
	 * @param typeId - The element type ID
	 * @param style - The style index (default 0)
	 * @returns The defaults, or null if not found
	 */
    getDefaults(typeId: number, style: number = WindowStyle.DEFAULT): IElementDefaults | null
    {
        return this.getDescriptor(typeId, style)?.defaults ?? null;
    }

    /**
	 * Check if a descriptor exists for the given type and style.
	 */
    hasDescriptor(typeId: number, style: number = WindowStyle.DEFAULT): boolean
    {
        return this.getDescriptor(typeId, style) !== null;
    }

    /**
	 * Returns all descriptors that use the given skin asset name.
	 *
	 * @param assetName - The skin asset name (e.g. "habbo_skin_frame")
	 * @returns Array of matching descriptors
	 */
    getDescriptorsByAsset(assetName: string): IElementDescriptor[]
    {
        const results: IElementDescriptor[] = [];

        for(const styleMap of this._descriptors.values())
        {
            for(const descriptor of styleMap.values())
            {
                if(descriptor.asset === assetName)
                {
                    results.push(descriptor);
                }
            }
        }

        return results;
    }

    /**
	 * Returns every registered descriptor, across all types and styles.
	 *
	 * TS-only: used by dev tooling (the visual window debugger) to list
	 * every known type/style/skin combination — not part of the AS3 API.
	 */
    getAllDescriptors(): IElementDescriptor[]
    {
        const results: IElementDescriptor[] = [];

        for(const styleMap of this._descriptors.values())
        {
            for(const descriptor of styleMap.values())
            {
                results.push(descriptor);
            }
        }

        return results;
    }

    /**
	 * Dispose and clear all descriptors.
	 */
    // AS3: .../src/com/sulake/core/window/graphics/SkinContainer.as::dispose()
    dispose(): void
    {
        this._descriptors.clear();
    }
}
