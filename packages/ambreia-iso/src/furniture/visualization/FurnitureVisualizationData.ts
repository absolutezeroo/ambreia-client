/**
 * FurnitureVisualizationData
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureVisualizationData
 *
 * Implements IRoomObjectVisualizationData for furniture. Manages SizeData per scale.
 * LAYER_NAMES = ['a'..'z']. Parses Nitro JSON visualization data.
 */
import type {IRoomObjectVisualizationData} from '../../object/visualization/IRoomObjectVisualizationData';
import {SizeData} from '../../scene/object/visualization/data/SizeData';

export class FurnitureVisualizationData implements IRoomObjectVisualizationData
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::LAYER_LIMIT
    public static readonly LAYER_LIMIT: number = 1000;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::LAYER_NAMES
    public static readonly LAYER_NAMES: string[] = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
    ];

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::_sizes
    private _sizes: Map<number, SizeData> = new Map();
    private _sortedSizes: number[] = [];
    private _cachedSizeData: SizeData | null = null;
    private _cachedSizeId: number = -1;
    private _cachedSize: number = -1;
    private _cachedSizeScale: number = -1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::_type
    private _type: string = '';
    private _disposed: boolean = false;

    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        for(const sizeData of this._sizes.values())
        {
            if(sizeData !== null)
            {
                sizeData.dispose();
            }
        }

        this._sizes.clear();
        this._sortedSizes = [];
        this._cachedSizeData = null;
    }

    /**
	 * Initialize from Nitro JSON asset bundle.
	 *
	 * Expected format:
	 * ```json
	 * {
	 *   "type": "furniture_name",
	 *   "visualizations": [
	 *     { "size": 64, "layerCount": 3, "angle": 45,
	 *       "layers": { ... }, "directions": { ... }, "colors": { ... }, "animations": { ... }
	 *     }
	 *   ]
	 * }
	 * ```
	 */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::initialize()
    initialize(data: unknown): boolean
    {
        this.reset();

        if(data === null || data === undefined)
        {
            return false;
        }

        const vizData = data as Record<string, unknown>;

        // Nitro bundle: 'name' = specific furniture name (e.g. "table_silo_med"),
        // 'type' = generic category (e.g. "furniture"). Use 'name' first.
        const type = (vizData['name'] as string) || (vizData['type'] as string);

        if(!type || type.length === 0)
        {
            return false;
        }

        this._type = type;

        if(!this.defineVisualizations(vizData))
        {
            this.reset();

            return false;
        }

        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::getType()
    getType(): string
    {
        return this._type;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::getSize()
    getSize(scale: number): number
    {
        if(scale === this._cachedSizeScale)
        {
            return this._cachedSize;
        }

        const index = this.getSizeIndex(scale);

        let size = -1;

        if(index < this._sortedSizes.length)
        {
            size = this._sortedSizes[index];
        }

        this._cachedSizeScale = scale;
        this._cachedSize = size;

        return size;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::getLayerCount()
    getLayerCount(scale: number): number
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData !== null)
        {
            return sizeData.layerCount;
        }

        return 0;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::getDirectionValue()
    getDirectionValue(scale: number, direction: number): number
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData !== null)
        {
            return sizeData.getDirectionValue(direction);
        }

        return 0;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::getTag()
    getTag(scale: number, direction: number, layerIndex: number): string
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData !== null)
        {
            return sizeData.getTag(direction, layerIndex);
        }

        return '';
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::getInk()
    getInk(scale: number, direction: number, layerIndex: number): number
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData !== null)
        {
            return sizeData.getInk(direction, layerIndex);
        }

        return 0;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::getAlpha()
    getAlpha(scale: number, direction: number, layerIndex: number): number
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData !== null)
        {
            return sizeData.getAlpha(direction, layerIndex);
        }

        return 255;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::getColor()
    getColor(scale: number, layerIndex: number, colorId: number): number
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData !== null)
        {
            return sizeData.getColor(layerIndex, colorId);
        }

        return 0xFFFFFF;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::getIgnoreMouse()
    getIgnoreMouse(scale: number, direction: number, layerIndex: number): boolean
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData !== null)
        {
            return sizeData.getIgnoreMouse(direction, layerIndex);
        }

        return false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::getXOffset()
    getXOffset(scale: number, direction: number, layerIndex: number): number
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData !== null)
        {
            return sizeData.getXOffset(direction, layerIndex);
        }

        return 0;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::getYOffset()
    getYOffset(scale: number, direction: number, layerIndex: number): number
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData !== null)
        {
            return sizeData.getYOffset(direction, layerIndex);
        }

        return 0;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::getZOffset()
    getZOffset(scale: number, direction: number, layerIndex: number): number
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData !== null)
        {
            return sizeData.getZOffset(direction, layerIndex);
        }

        return 0;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::reset()
    protected reset(): void
    {
        this._type = '';

        for(const sizeData of this._sizes.values())
        {
            if(sizeData !== null)
            {
                sizeData.dispose();
            }
        }

        this._sizes.clear();
        this._sortedSizes = [];
        this._cachedSizeData = null;
        this._cachedSizeId = -1;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::defineVisualizations()
    protected defineVisualizations(data: Record<string, unknown>): boolean
    {
        const visualizations = this.getVisualizationDefinitions(data);

        if(visualizations.length === 0)
        {
            return false;
        }

        for(const vizDef of visualizations)
        {
            let size = FurnitureVisualizationData.getNumber(vizDef, 'size', 0);
            const layerCount = FurnitureVisualizationData.getNumber(vizDef, 'layerCount', 0, 'layer_count');
            const angle = FurnitureVisualizationData.getNumber(vizDef, 'angle', 45);

            if(size < 1) size = 1;

            if(this._sizes.has(size))
            {
                return false;
            }

            const sizeData = this.createSizeData(size, layerCount, angle);

            if(sizeData === null)
            {
                return false;
            }

            // Process all visualization elements
            if(!this.processVisualizationElements(sizeData, vizDef))
            {
                sizeData.dispose();
                return false;
            }

            this._sizes.set(size, sizeData);
            this._sortedSizes.push(size);
            this._sortedSizes.sort((a, b) => a - b);
        }

        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::createSizeData()
    protected createSizeData(_size: number, layerCount: number, angle: number): SizeData
    {
        return new SizeData(layerCount, angle);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::processVisualizationElement()
    protected processVisualizationElement(sizeData: SizeData, elementName: string, elementData: Record<string, unknown>): boolean
    {
        if(sizeData === null)
        {
            return false;
        }

        switch(elementName)
        {
            case 'layers':
                if(!sizeData.defineLayers(elementData))
                {
                    return false;
                }
                break;
            case 'directions':
                if(!sizeData.defineDirections(elementData))
                {
                    return false;
                }
                break;
            case 'colors':
                if(!sizeData.defineColors(elementData))
                {
                    return false;
                }
                break;
        }

        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::getSizeData()
    protected getSizeData(scale: number): SizeData | null
    {
        if(scale === this._cachedSizeId)
        {
            return this._cachedSizeData;
        }

        const index = this.getSizeIndex(scale);

        if(index < this._sortedSizes.length)
        {
            this._cachedSizeData = this._sizes.get(this._sortedSizes[index]) || null;
        }
        else
        {
            this._cachedSizeData = null;
        }

        this._cachedSizeId = scale;

        return this._cachedSizeData;
    }

    // AS3 walks the visualization node's *actual children* and hands each one to
    // processVisualizationElement(), which reads the name off the node itself. This port used a
    // hard-coded `['layers', 'directions', 'colors', 'animations']` instead - a furniture-only list
    // that no subclass could extend, so AnimatedPetVisualizationData's 'postures'/'gestures' cases
    // were unreachable dead code. With no postures parsed a pet had no animation, hence no frame
    // offsets, and its head and tail rendered detached from the body.
    //
    // Iterating the real keys is safe: an unrecognised name falls through the switch and returns
    // true, in this port exactly as in AS3 - neither has a `default: return false`.
    //
    // 'layers' must still be processed first, which the old hard-coded list happened to guarantee
    // and AS3 gets for free: defineDirections() seeds every direction from _defaultDirection, and
    // only defineLayers() fills that, so a direction parsed first copies an empty base and loses
    // every layer offset it does not override itself. AS3 reads XML children in document order,
    // where <layers> always precedes <directions>; JSON object keys carry no such guarantee, so
    // hoist it explicitly rather than trusting the bundle's key order. The rest keep their natural
    // order - nothing else here depends on it.
    private processVisualizationElements(sizeData: SizeData, vizDef: Record<string, unknown>): boolean
    {
        const elementNames = Object.keys(vizDef);
        const orderedNames = elementNames.includes('layers')
            ? ['layers', ...elementNames.filter(name => name !== 'layers')]
            : elementNames;

        for(const name of orderedNames)
        {
            const elementData = (vizDef[name] ?? null) as Record<string, unknown> | null;

            if(elementData && typeof elementData === 'object')
            {
                if(!this.processVisualizationElement(sizeData, name, elementData))
                {
                    return false;
                }
            }
        }

        return true;
    }

    private getVisualizationDefinitions(data: Record<string, unknown>): Record<string, unknown>[]
    {
        const direct = data['visualizations'] ?? data['visualization'] ?? null;
        const graphics = FurnitureVisualizationData.asRecord(data['graphics']);
        const graphicsVisualizations = graphics !== null ? graphics['visualizations'] ?? graphics['visualization'] ?? null : null;
        const source = direct ?? graphicsVisualizations ?? data;

        if(Array.isArray(source))
        {
            return source.filter(FurnitureVisualizationData.isVisualizationDefinition);
        }

        const sourceRecord = FurnitureVisualizationData.asRecord(source);

        if(sourceRecord === null)
        {
            return [];
        }

        if(FurnitureVisualizationData.isVisualizationDefinition(sourceRecord))
        {
            return [sourceRecord];
        }

        const visualizations: Record<string, unknown>[] = [];

        for(const value of Object.values(sourceRecord))
        {
            if(FurnitureVisualizationData.isVisualizationDefinition(value))
            {
                visualizations.push(value);
            }
        }

        return visualizations;
    }

    private static isVisualizationDefinition(value: unknown): value is Record<string, unknown>
    {
        const record = FurnitureVisualizationData.asRecord(value);

        return record !== null && (
            record['size'] !== undefined ||
			record['layerCount'] !== undefined ||
			record['layer_count'] !== undefined
        );
    }

    private static asRecord(value: unknown): Record<string, unknown> | null
    {
        if(value === null || value === undefined || typeof value !== 'object' || Array.isArray(value))
        {
            return null;
        }

        return value as Record<string, unknown>;
    }

    private static getNumber(data: Record<string, unknown>, key: string, defaultValue: number, fallbackKey: string | null = null): number
    {
        let value = data[key];

        if((value === null || value === undefined) && fallbackKey !== null)
        {
            value = data[fallbackKey];
        }

        if(typeof value === 'number')
        {
            return value;
        }

        if(typeof value === 'string' && value.length > 0)
        {
            const parsed = Number(value);

            if(!Number.isNaN(parsed))
            {
                return parsed;
            }
        }

        return defaultValue;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVisualizationData.as::getSizeIndex()
    private getSizeIndex(scale: number): number
    {
        let bestIndex = 0;

        if(scale > 0)
        {
            for(let i = 1; i < this._sortedSizes.length; i++)
            {
                if(this._sortedSizes[i] > scale)
                {
                    if(this._sortedSizes[i] / scale < scale / this._sortedSizes[i - 1])
                    {
                        bestIndex = i;
                    }

                    break;
                }

                bestIndex = i;
            }
        }

        return bestIndex;
    }
}
