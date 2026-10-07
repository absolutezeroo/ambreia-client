import {PetCustomPart} from './PetCustomPart';

/**
 * Parses and stores pet figure data from a pet figure string.
 *
 * @see sources/win63_version/habbo/avatar/pets/PetFigureData.as
 */
export class PetFigureData
{
    constructor(figureString: string)
    {
        this._typeId = this.parseTypeId(figureString);
        this._paletteId = this.parsePaletteId(figureString);
        this._color = this.parseColor(figureString);
        this._headOnly = this.parseHeadOnly(figureString);

        const customData = this.parseCustomData(figureString);

        this._customLayerIds = this.extractCustomLayerIds(customData);
        this._customPartIds = this.extractCustomPartIds(customData);
        this._customPaletteIds = this.extractCustomPaletteIds(customData);

        this._customParts = [];

        for(let i = 0; i < this._customLayerIds.length; i++)
        {
            this._customParts.push(new PetCustomPart(
                this._customLayerIds[i],
                this._customPartIds[i],
                this._customPaletteIds[i]
            ));
        }
    }

    private _typeId: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetFigureData.as::get typeId()
    public get typeId(): number
    {
        return this._typeId;
    }

    private _paletteId: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetFigureData.as::get paletteId()
    public get paletteId(): number
    {
        return this._paletteId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetFigureData.as::_color
    private _color: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetFigureData.as::get color()
    public get color(): number
    {
        return this._color;
    }

    private _customParts: PetCustomPart[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetFigureData.as::get customParts()
    public get customParts(): PetCustomPart[]
    {
        return this._customParts;
    }

    private _customLayerIds: number[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetFigureData.as::get customLayerIds()
    public get customLayerIds(): number[]
    {
        return this._customLayerIds;
    }

    private _customPartIds: number[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetFigureData.as::get customPartIds()
    public get customPartIds(): number[]
    {
        return this._customPartIds;
    }

    private _customPaletteIds: number[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetFigureData.as::get customPaletteIds()
    public get customPaletteIds(): number[]
    {
        return this._customPaletteIds;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetFigureData.as::_headOnly
    private _headOnly: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetFigureData.as::get headOnly()
    public get headOnly(): boolean
    {
        return this._headOnly;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetFigureData.as::get hasCustomParts()
    public get hasCustomParts(): boolean
    {
        return this._customLayerIds != null && this._customLayerIds.length > 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetFigureData.as::get figureString()
    public get figureString(): string
    {
        let result = this._typeId + ' ' + this._paletteId + ' ' + this._color.toString(16);

        result += ' ' + this._customParts.length;

        for(const part of this._customParts)
        {
            result += ' ' + part.layerId + ' ' + part.partId + ' ' + part.paletteId;
        }

        return result;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetFigureData.as::getCustomPart()
    public getCustomPart(layerId: number): PetCustomPart | null
    {
        if(this._customParts)
        {
            for(const part of this._customParts)
            {
                if(part.layerId === layerId) return part;
            }
        }

        return null;
    }

    private parseCustomData(figureString: string): string[]
    {
        if(!figureString) return [];

        const parts = figureString.split(' ');
        const headOffset = this._headOnly ? 1 : 0;
        const startIndex = 4 + headOffset;

        if(parts.length > startIndex)
        {
            const countIndex = 3 + headOffset;
            const count = parseInt(parts[countIndex]);

            return parts.slice(startIndex, startIndex + count * 3);
        }

        return [];
    }

    private extractCustomLayerIds(data: string[]): number[]
    {
        const result: number[] = [];

        for(let i = 0; i < data.length; i += 3)
        {
            result.push(parseInt(data[i]));
        }

        return result;
    }

    private extractCustomPartIds(data: string[]): number[]
    {
        const result: number[] = [];

        for(let i = 0; i < data.length; i += 3)
        {
            result.push(parseInt(data[i + 1]));
        }

        return result;
    }

    private extractCustomPaletteIds(data: string[]): number[]
    {
        const result: number[] = [];

        for(let i = 0; i < data.length; i += 3)
        {
            result.push(parseInt(data[i + 2]));
        }

        return result;
    }

    private parseTypeId(figureString: string): number
    {
        if(figureString)
        {
            const parts = figureString.split(' ');

            if(parts.length >= 1) return parseInt(parts[0]);
        }

        return 0;
    }

    private parsePaletteId(figureString: string): number
    {
        if(figureString)
        {
            const parts = figureString.split(' ');

            if(parts.length >= 2) return parseInt(parts[1]);
        }

        return 0;
    }

    private parseColor(figureString: string): number
    {
        if(figureString)
        {
            const parts = figureString.split(' ');

            if(parts.length >= 3) return parseInt(parts[2], 16);
        }

        return 0xFFFFFF;
    }

    private parseHeadOnly(figureString: string): boolean
    {
        if(figureString)
        {
            const parts = figureString.split(' ');

            if(parts.length >= 4) return parts[3] === 'head';
        }

        return false;
    }
}
