import type {IPartColor} from './IPartColor';
import type {IPalette} from './IPalette';
import {PartColor} from './PartColor';
import {getXmlAttribute, getXmlChildElements, getXmlRoot} from '../AvatarXmlUtils';

/**
 * Represents a color palette for avatar figure parts, parsed from AS3 XML.
 *
 * @see sources/win63_version/habbo/avatar/structure/figure/Palette.as
 */
export class Palette implements IPalette
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/Palette.as::Palette()
    constructor(data: any)
    {
        const element = getXmlRoot(data);

        this._id = parseInt(element ? getXmlAttribute(element, 'id') : data.id) || 0;
        this._colors = new Map();
        this.append(data);
    }

    private _id: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/Palette.as::get id()
    public get id(): number
    {
        return this._id;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/Palette.as::_colors
    private _colors: Map<number, IPartColor>;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/Palette.as::get colors()
    public get colors(): Map<number, IPartColor>
    {
        return this._colors;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/Palette.as::append()
    public append(data: any): void
    {
        const element = getXmlRoot(data);

        if(element)
        {
            for(const colorElement of getXmlChildElements(element, 'color'))
            {
                const id = parseInt(getXmlAttribute(colorElement, 'id')) || 0;
                this._colors.set(id, new PartColor(colorElement));
            }

            return;
        }

        const rawColors = data.colors?.color || data.colors || data.color;

        if(!rawColors) return;

        const colors: any[] = Array.isArray(rawColors) ? rawColors : [rawColors];

        for(const colorData of colors)
        {
            const id = parseInt(colorData.id) || 0;
            this._colors.set(id, new PartColor(colorData));
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/Palette.as::getColor()
    public getColor(colorId: number): IPartColor | null
    {
        return this._colors.get(colorId) ?? null;
    }
}