import type {IAvatarImage} from '../IAvatarImage';
import {GeometryItem} from './GeometryItem';
import type {Matrix4x4} from './Matrix4x4';
import {Node3D} from './Node3D';
import type {Vector3D} from './Vector3D';
import {getXmlAttribute, getXmlDescendants, getXmlRoot} from '../structure/AvatarXmlUtils';

/**
 * A geometry body part containing multiple geometry items, used for depth sorting.
 *
 * @see sources/win63_version/habbo/avatar/geometry/GeometryBodyPart.as
 */
export class GeometryBodyPart extends Node3D
{
    private _items: Map<string, GeometryItem>;
    private _dynamicItems: Map<IAvatarImage, Map<string, GeometryItem>>;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryBodyPart.as::GeometryBodyPart()
    constructor(data: any)
    {
        const element = getXmlRoot(data);
        const x = element ? getXmlAttribute(element, 'x') : data.x;
        const y = element ? getXmlAttribute(element, 'y') : data.y;
        const z = element ? getXmlAttribute(element, 'z') : data.z;

        super(
            parseFloat(x) || 0,
            parseFloat(y) || 0,
            parseFloat(z) || 0
        );

        this._radius = parseFloat(element ? getXmlAttribute(element, 'radius') : data.radius) || 0;
        this._id = element ? getXmlAttribute(element, 'id') : String(data.id);
        this._items = new Map();
        this._dynamicItems = new Map();

        if(element)
        {
            for(const itemElement of getXmlDescendants(element, 'item'))
            {
                const item = new GeometryItem(itemElement);

                this._items.set(getXmlAttribute(itemElement, 'id'), item);
            }
        }
        else if(data.items)
        {
            for(const itemData of data.items)
            {
                const item = new GeometryItem(itemData);

                this._items.set(String(itemData.id), item);
            }
        }
    }

    private _id: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryBodyPart.as::get id()
    public get id(): string
    {
        return this._id;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryBodyPart.as::_radius
    private _radius: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryBodyPart.as::get radius()
    public get radius(): number
    {
        return this._radius;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryBodyPart.as::getDynamicParts()
    public getDynamicParts(avatar: IAvatarImage): GeometryItem[]
    {
        const result: GeometryItem[] = [];
        const dynamicMap = this._dynamicItems.get(avatar);

        if(dynamicMap)
        {
            for(const item of dynamicMap.values())
            {
                if(item) result.push(item);
            }
        }

        return result;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryBodyPart.as::getPartIds()
    public getPartIds(avatar: IAvatarImage | null): string[]
    {
        const ids: string[] = [];

        for(const item of this._items.values())
        {
            if(item) ids.push(item.id);
        }

        if(avatar)
        {
            const dynamicMap = this._dynamicItems.get(avatar);

            if(dynamicMap)
            {
                for(const item of dynamicMap.values())
                {
                    if(item) ids.push(item.id);
                }
            }
        }

        return ids;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryBodyPart.as::removeDynamicParts()
    public removeDynamicParts(avatar: IAvatarImage): boolean
    {
        this._dynamicItems.delete(avatar);

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryBodyPart.as::addPart()
    public addPart(data: any, avatar: IAvatarImage): boolean
    {
        const element = getXmlRoot(data);
        const id = element ? getXmlAttribute(element, 'id') : String(data.id);

        if(this.hasPart(id, avatar)) return false;

        if(!this._dynamicItems.has(avatar))
        {
            this._dynamicItems.set(avatar, new Map());
        }

        this._dynamicItems.get(avatar)!.set(id, new GeometryItem(data, true));

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryBodyPart.as::hasPart()
    public hasPart(id: string, avatar: IAvatarImage): boolean
    {
        let item: GeometryItem | null = this._items.get(id) ?? null;

        if(!item)
        {
            const dynamicMap = this._dynamicItems.get(avatar);

            if(dynamicMap) item = dynamicMap.get(id) ?? null;
        }

        return item !== null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryBodyPart.as::getParts()
    public getParts(matrix: Matrix4x4, camera: Vector3D, _param: any[], avatar: IAvatarImage): string[]
    {
        const distances: [number, GeometryItem][] = [];

        for(const item of this._items.values())
        {
            if(item)
            {
                item.applyTransform(matrix);

                const dist = item.getDistance(camera);

                distances.push([dist, item]);
            }
        }

        const dynamicMap = this._dynamicItems.get(avatar);

        if(dynamicMap)
        {
            for(const item of dynamicMap.values())
            {
                if(item)
                {
                    item.applyTransform(matrix);

                    const dist = item.getDistance(camera);

                    distances.push([dist, item]);
                }
            }
        }

        distances.sort((a, b) => a[0] - b[0]);

        return distances.map(entry => entry[1].id);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/GeometryBodyPart.as::getDistance()
    public getDistance(camera: Vector3D): number
    {
        const near = Math.abs(camera.z - this.transformedLocation.z - this._radius);
        const far = Math.abs(camera.z - this.transformedLocation.z + this._radius);

        return Math.min(near, far);
    }
}