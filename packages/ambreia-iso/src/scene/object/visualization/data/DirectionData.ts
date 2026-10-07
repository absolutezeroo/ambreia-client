/**
 * DirectionData
 *
 * @see com.sulake.habbo.room.object.visualization.data.DirectionData
 *
 * Array of LayerData per direction. Delegates get/set to individual LayerData.
 */
import {LayerData} from './LayerData';

export class DirectionData
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::USE_DEFAULT_DIRECTION
    public static readonly USE_DEFAULT_DIRECTION: number = -1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::_layers
    private _layers: LayerData[];

    constructor(layerCount: number)
    {
        this._layers = [];

        for(let i = 0; i < layerCount; i++)
        {
            this._layers.push(new LayerData());
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::get layerCount()
    get layerCount(): number
    {
        return this._layers.length;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::getTag()
    getTag(layerIndex: number): string
    {
        const layer = this.getLayer(layerIndex);

        if(layer !== null)
        {
            return layer.tag;
        }

        return LayerData.DEFAULT_TAG;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::setTag()
    setTag(layerIndex: number, value: string): void
    {
        const layer = this.getLayer(layerIndex);

        if(layer !== null)
        {
            layer.tag = value;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::getInk()
    getInk(layerIndex: number): number
    {
        const layer = this.getLayer(layerIndex);

        if(layer !== null)
        {
            return layer.ink;
        }

        return LayerData.DEFAULT_INK;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::setInk()
    setInk(layerIndex: number, value: number): void
    {
        const layer = this.getLayer(layerIndex);

        if(layer !== null)
        {
            layer.ink = value;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::getAlpha()
    getAlpha(layerIndex: number): number
    {
        const layer = this.getLayer(layerIndex);

        if(layer !== null)
        {
            return layer.alpha;
        }

        return LayerData.DEFAULT_ALPHA;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::setAlpha()
    setAlpha(layerIndex: number, value: number): void
    {
        const layer = this.getLayer(layerIndex);

        if(layer !== null)
        {
            layer.alpha = value;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::getIgnoreMouse()
    getIgnoreMouse(layerIndex: number): boolean
    {
        const layer = this.getLayer(layerIndex);

        if(layer !== null)
        {
            return layer.ignoreMouse;
        }

        return LayerData.DEFAULT_IGNORE_MOUSE;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::setIgnoreMouse()
    setIgnoreMouse(layerIndex: number, value: boolean): void
    {
        const layer = this.getLayer(layerIndex);

        if(layer !== null)
        {
            layer.ignoreMouse = value;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::getXOffset()
    getXOffset(layerIndex: number): number
    {
        const layer = this.getLayer(layerIndex);

        if(layer !== null)
        {
            return layer.xOffset;
        }

        return LayerData.DEFAULT_X_OFFSET;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::setXOffset()
    setXOffset(layerIndex: number, value: number): void
    {
        const layer = this.getLayer(layerIndex);

        if(layer !== null)
        {
            layer.xOffset = value;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::getYOffset()
    getYOffset(layerIndex: number): number
    {
        const layer = this.getLayer(layerIndex);

        if(layer !== null)
        {
            return layer.yOffset;
        }

        return LayerData.DEFAULT_Y_OFFSET;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::setYOffset()
    setYOffset(layerIndex: number, value: number): void
    {
        const layer = this.getLayer(layerIndex);

        if(layer !== null)
        {
            layer.yOffset = value;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::getZOffset()
    getZOffset(layerIndex: number): number
    {
        const layer = this.getLayer(layerIndex);

        if(layer !== null)
        {
            return layer.zOffset;
        }

        return LayerData.DEFAULT_Z_OFFSET;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::setZOffset()
    setZOffset(layerIndex: number, value: number): void
    {
        const layer = this.getLayer(layerIndex);

        if(layer !== null)
        {
            layer.zOffset = value;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::copyValues()
    copyValues(other: DirectionData): void
    {
        if(other === null)
        {
            return;
        }

        if(this.layerCount !== other.layerCount)
        {
            return;
        }

        for(let i = 0; i < this.layerCount; i++)
        {
            const thisLayer = this.getLayer(i);
            const otherLayer = other.getLayer(i);

            if(thisLayer !== null && otherLayer !== null)
            {
                thisLayer.copyValues(otherLayer);
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::getLayer()
    getLayer(index: number): LayerData | null
    {
        if(index < 0 || index >= this.layerCount)
        {
            return null;
        }

        return this._layers[index];
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/DirectionData.as::dispose()
    dispose(): void
    {
        this._layers = [];
    }
}
