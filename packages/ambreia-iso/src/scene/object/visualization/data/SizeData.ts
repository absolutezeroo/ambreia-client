/**
 * SizeData
 *
 * @see com.sulake.habbo.room.object.visualization.data.SizeData
 *
 * Core visualization data per scale. Manages layer count, angle, directions, and colors.
 * Adapted from AS3 XML to Nitro JSON format.
 */
import {ColorData} from './ColorData';
import {DirectionData} from './DirectionData';
import {LayerData} from './LayerData';

export class SizeData
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::LAYER_LIMIT
    public static readonly LAYER_LIMIT: number = 1000;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::DEFAULT_DIRECTION
    public static readonly DEFAULT_DIRECTION: number = 0;
    private _angle: number = 360;
    private _defaultDirection: DirectionData;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::_directions
    private _directions: Map<number, DirectionData> = new Map();
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::_colors
    private _colors: Map<string, ColorData> = new Map();
    private _cachedDirection: DirectionData | null = null;
    private _cachedDirectionId: number = -1;

    constructor(layerCount: number, angle: number)
    {
        if(layerCount < 0) layerCount = 0;
        if(layerCount > SizeData.LAYER_LIMIT) layerCount = SizeData.LAYER_LIMIT;

        this._layerCount = layerCount;

        if(angle < 1) angle = 1;
        if(angle > 360) angle = 360;

        this._angle = angle;
        this._defaultDirection = new DirectionData(layerCount);
    }

    private _layerCount: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::get layerCount()
    get layerCount(): number
    {
        return this._layerCount;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::dispose()
    dispose(): void
    {
        if(this._defaultDirection !== null)
        {
            this._defaultDirection.dispose();
        }

        for(const direction of this._directions.values())
        {
            if(direction !== null)
            {
                direction.dispose();
            }
        }

        this._directions.clear();
        this._cachedDirection = null;

        for(const colorData of this._colors.values())
        {
            if(colorData !== null)
            {
                colorData.dispose();
            }
        }

        this._colors.clear();
    }

    /**
	 * Define layer properties from Nitro JSON data.
	 *
	 * JSON format: `{ "layers": { "0": { "tag": "...", "ink": "ADD", "alpha": 128, ... } } }`
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::defineLayers()
    defineLayers(data: Record<string, unknown>): boolean
    {
        if(data === null || data === undefined)
        {
            return false;
        }

        const layers = this.getLayerDefinitions(data);

        return this.defineDirection(this._defaultDirection, layers);
    }

    /**
	 * Define direction overrides from Nitro JSON data.
	 *
	 * JSON format: `{ "0": { "layers": { "0": { ... } } }, "2": { ... } }`
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::defineDirections()
    defineDirections(data: Record<string, unknown>): boolean
    {
        if(data === null || data === undefined)
        {
            return false;
        }

        const directions = this.getNamedDefinitions(data, 'direction');

        for(const [dirId, dirDef] of directions)
        {
            if(this._directions.has(dirId))
            {
                return false;
            }

            const directionData = new DirectionData(this._layerCount);
            directionData.copyValues(this._defaultDirection);

            const layersContainer = dirDef['layers'] ?? dirDef['layer'] ?? null;
            const layers = this.getLayerDefinitions(layersContainer);

            if(layers.length > 0)
            {
                this.defineDirection(directionData, layers);
            }

            this._directions.set(dirId, directionData);
            this._cachedDirectionId = -1;
            this._cachedDirection = null;
        }

        return true;
    }

    /**
	 * Define colors from Nitro JSON data.
	 *
	 * JSON format: `{ "1": { "layers": { "0": { "color": "FF0000" }, ... } } }`
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::defineColors()
    defineColors(data: Record<string, unknown>): boolean
    {
        if(data === null || data === undefined)
        {
            return true;
        }

        const colors = this.getNamedDefinitions(data, 'color');

        for(const [colorId, colorDef] of colors)
        {
            const colorKey = String(colorId);

            if(this._colors.has(colorKey))
            {
                return false;
            }

            const colorData = new ColorData(this._layerCount);
            const layersContainer = colorDef['layers'] ?? colorDef['colorLayer'] ?? colorDef['color_layer'] ?? null;
            const layers = this.getLayerDefinitions(layersContainer);

            if(layers.length > 0)
            {
                for(const [layerIndex, layerDef] of layers)
                {
                    const color = SizeData.getColorValue(layerDef, 'color');

                    if(color !== null)
                    {
                        colorData.setColor(color, layerIndex);
                    }
                }
            }

            this._colors.set(colorKey, colorData);
        }

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::getDirectionValue()
    getDirectionValue(direction: number): number
    {
        const normalizedDir = ((direction % 360) + 360 + Math.floor(this._angle / 2)) % 360;
        const dirIndex = Math.floor(normalizedDir / this._angle);

        if(this._directions.has(dirIndex))
        {
            return dirIndex;
        }

        const rawDir = ((direction % 360) + 360) % 360;
        let bestDist = -1;
        let bestIndex = -1;

        const dirKeys = Array.from(this._directions.keys());

        for(let i = 0; i < dirKeys.length; i++)
        {
            const angle = dirKeys[i] * this._angle;
            let dist = (angle - rawDir + 360) % 360;

            if(dist > 180)
            {
                dist = 360 - dist;
            }

            if(dist < bestDist || bestDist < 0)
            {
                bestDist = dist;
                bestIndex = i;
            }
        }

        if(bestIndex >= 0)
        {
            return dirKeys[bestIndex];
        }

        return 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::getTag()
    getTag(direction: number, layerIndex: number): string
    {
        const dirData = this.getDirectionData(direction);

        if(dirData !== null)
        {
            return dirData.getTag(layerIndex);
        }

        return LayerData.DEFAULT_TAG;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::getInk()
    getInk(direction: number, layerIndex: number): number
    {
        const dirData = this.getDirectionData(direction);

        if(dirData !== null)
        {
            return dirData.getInk(layerIndex);
        }

        return LayerData.DEFAULT_INK;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::getAlpha()
    getAlpha(direction: number, layerIndex: number): number
    {
        const dirData = this.getDirectionData(direction);

        if(dirData !== null)
        {
            return dirData.getAlpha(layerIndex);
        }

        return LayerData.DEFAULT_ALPHA;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::getColor()
    getColor(layerIndex: number, colorId: number): number
    {
        const colorData = this._colors.get(String(colorId));

        if(colorData !== null && colorData !== undefined)
        {
            return colorData.getColor(layerIndex);
        }

        return ColorData.DEFAULT_COLOR;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::getIgnoreMouse()
    getIgnoreMouse(direction: number, layerIndex: number): boolean
    {
        const dirData = this.getDirectionData(direction);

        if(dirData !== null)
        {
            return dirData.getIgnoreMouse(layerIndex);
        }

        return LayerData.DEFAULT_IGNORE_MOUSE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::getXOffset()
    getXOffset(direction: number, layerIndex: number): number
    {
        const dirData = this.getDirectionData(direction);

        if(dirData !== null)
        {
            return dirData.getXOffset(layerIndex);
        }

        return LayerData.DEFAULT_X_OFFSET;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::getYOffset()
    getYOffset(direction: number, layerIndex: number): number
    {
        const dirData = this.getDirectionData(direction);

        if(dirData !== null)
        {
            return dirData.getYOffset(layerIndex);
        }

        return LayerData.DEFAULT_Y_OFFSET;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::getZOffset()
    getZOffset(direction: number, layerIndex: number): number
    {
        const dirData = this.getDirectionData(direction);

        if(dirData !== null)
        {
            return dirData.getZOffset(layerIndex);
        }

        return LayerData.DEFAULT_Z_OFFSET;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::defineDirection()
    private defineDirection(directionData: DirectionData, layers: Array<[number, Record<string, unknown>]>): boolean
    {
        if(directionData === null || layers === null)
        {
            return false;
        }

        for(const [layerIndex, layerDef] of layers)
        {
            if(isNaN(layerIndex) || layerIndex < 0 || layerIndex >= this._layerCount)
            {
                continue;
            }

            const tag = (layerDef['tag'] ?? null) as string | null;

            if(tag && tag.length > 0)
            {
                directionData.setTag(layerIndex, tag);
            }

            const ink = (layerDef['ink'] ?? null) as string | null;

            if(ink)
            {
                switch(ink.toUpperCase())
                {
                    case 'ADD':
                        directionData.setInk(layerIndex, LayerData.INK_ADD);
                        break;
                    case 'SUBTRACT':
                        directionData.setInk(layerIndex, LayerData.INK_SUBTRACT);
                        break;
                    case 'DARKEN':
                        directionData.setInk(layerIndex, LayerData.INK_DARKEN);
                        break;
                    case 'DIFFERENCE':
                        directionData.setInk(layerIndex, LayerData.INK_DIFFERENCE);
                        break;
                    case 'MULTIPLY':
                        directionData.setInk(layerIndex, LayerData.INK_MULTIPLY);
                        break;
                    case 'INVERT':
                        directionData.setInk(layerIndex, LayerData.INK_INVERT);
                        break;
                    case 'SCREEN':
                        directionData.setInk(layerIndex, LayerData.INK_SCREEN);
                        break;
                }
            }

            const alpha = SizeData.getNumber(layerDef, 'alpha', null);

            if(alpha !== null)
            {
                directionData.setAlpha(layerIndex, alpha);
            }

            const ignoreMouse = SizeData.getValue(layerDef, 'ignoreMouse', 'ignore_mouse');

            if(ignoreMouse !== null)
            {
                directionData.setIgnoreMouse(layerIndex, SizeData.toBooleanNumber(ignoreMouse));
            }

            const x = SizeData.getNumber(layerDef, 'x', null);

            if(x !== null)
            {
                directionData.setXOffset(layerIndex, x);
            }

            const y = SizeData.getNumber(layerDef, 'y', null);

            if(y !== null)
            {
                directionData.setYOffset(layerIndex, y);
            }

            const z = SizeData.getNumber(layerDef, 'z', null);

            if(z !== null)
            {
                directionData.setZOffset(layerIndex, z / -1000);
            }
        }

        return true;
    }

    private getLayerDefinitions(data: unknown): Array<[number, Record<string, unknown>]>
    {
        const source = SizeData.unwrapContainer(data, 'layer');
        const definitions: Array<[number, Record<string, unknown>]> = [];

        if(Array.isArray(source))
        {
            for(const value of source)
            {
                const layerDef = SizeData.asRecord(value);

                if(layerDef === null)
                {
                    continue;
                }

                const id = SizeData.getNumber(layerDef, 'id', NaN);

                if(id !== null && !Number.isNaN(id))
                {
                    definitions.push([id, layerDef]);
                }
            }

            return definitions;
        }

        const sourceRecord = SizeData.asRecord(source);

        if(sourceRecord === null)
        {
            return definitions;
        }

        const directId = SizeData.getNumber(sourceRecord, 'id', null);

        if(directId !== null && !Number.isNaN(directId))
        {
            definitions.push([directId, sourceRecord]);

            return definitions;
        }

        for(const idStr in sourceRecord)
        {
            const layerDef = SizeData.asRecord(sourceRecord[idStr]);

            if(layerDef === null)
            {
                continue;
            }

            const fallbackId = Number(idStr);
            const id = SizeData.getNumber(layerDef, 'id', fallbackId);

            if(id !== null && !Number.isNaN(id))
            {
                definitions.push([id, layerDef]);
            }
        }

        return definitions;
    }

    private getNamedDefinitions(data: unknown, containerKey: string): Array<[number, Record<string, unknown>]>
    {
        const source = SizeData.unwrapContainer(data, containerKey);
        const definitions: Array<[number, Record<string, unknown>]> = [];

        if(Array.isArray(source))
        {
            for(const value of source)
            {
                const definition = SizeData.asRecord(value);

                if(definition === null)
                {
                    continue;
                }

                const id = SizeData.getNumber(definition, 'id', NaN);

                if(id !== null && !Number.isNaN(id))
                {
                    definitions.push([id, definition]);
                }
            }

            return definitions;
        }

        const sourceRecord = SizeData.asRecord(source);

        if(sourceRecord === null)
        {
            return definitions;
        }

        const directId = SizeData.getNumber(sourceRecord, 'id', null);

        if(directId !== null && !Number.isNaN(directId))
        {
            definitions.push([directId, sourceRecord]);

            return definitions;
        }

        for(const idStr in sourceRecord)
        {
            const definition = SizeData.asRecord(sourceRecord[idStr]);

            if(definition === null)
            {
                continue;
            }

            const fallbackId = Number(idStr);
            const id = SizeData.getNumber(definition, 'id', fallbackId);

            if(id !== null && !Number.isNaN(id))
            {
                definitions.push([id, definition]);
            }
        }

        return definitions;
    }

    private static unwrapContainer(data: unknown, key: string): unknown
    {
        const record = SizeData.asRecord(data);

        if(record === null)
        {
            return data;
        }

        return record[key] ?? data;
    }

    private static asRecord(value: unknown): Record<string, unknown> | null
    {
        if(value === null || value === undefined || typeof value !== 'object' || Array.isArray(value))
        {
            return null;
        }

        return value as Record<string, unknown>;
    }

    private static getValue(data: Record<string, unknown>, key: string, fallbackKey: string): unknown | null
    {
        const value = data[key];

        if(value !== null && value !== undefined)
        {
            return value;
        }

        return data[fallbackKey] ?? null;
    }

    private static getNumber(data: Record<string, unknown>, key: string, defaultValue: number | null): number | null
    {
        const value = data[key];

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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::defineColors()
    // reads @color off an XML attribute, so it is always a hex string there ("4A90D9") and AS3's
    // parseInt(x, 16) is right. The JSON bundles carry a colour as an already-decoded RGB integer,
    // where that same parseInt would re-read the decimal digits as hex and yield garbage
    // (16777215 -> 0x16777215 -> #777215, an olive green instead of white). A JSON number is the
    // RGB value as-is; only the string form needs AS3's base-16 parse. Reading it as a number also
    // keeps a legitimate 0x000000 layer, which the previous truthiness check silently dropped.
    private static getColorValue(data: Record<string, unknown>, key: string): number | null
    {
        const value = data[key];

        if(typeof value === 'number')
        {
            return value;
        }

        if(typeof value === 'string' && value.length > 0)
        {
            const parsed = parseInt(value, 16);

            if(!Number.isNaN(parsed))
            {
                return parsed;
            }
        }

        return null;
    }

    private static toBooleanNumber(value: unknown): boolean
    {
        if(typeof value === 'boolean')
        {
            return value;
        }

        if(typeof value === 'number')
        {
            return value !== 0;
        }

        if(typeof value === 'string' && value.length > 0)
        {
            return Number(value) !== 0;
        }

        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/SizeData.as::getDirectionData()
    private getDirectionData(direction: number): DirectionData
    {
        if(direction === this._cachedDirectionId && this._cachedDirection !== null)
        {
            return this._cachedDirection;
        }

        let dirData = this._directions.get(direction) || null;

        if(dirData === null)
        {
            dirData = this._defaultDirection;
        }

        this._cachedDirectionId = direction;
        this._cachedDirection = dirData;

        return this._cachedDirection;
    }
}
