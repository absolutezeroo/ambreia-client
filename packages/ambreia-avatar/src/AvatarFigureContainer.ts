import type {IAvatarFigureContainer} from './IAvatarFigureContainer';

/**
 * Container for avatar figure data, parsed from a figure string.
 * A figure string follows the format: "hd-180-1.ch-210-66.lg-270-82"
 * where each segment is "type-setId-colorId1-colorId2...".
 *
 * @see sources/win63_version/habbo/avatar/AvatarFigureContainer.as
 */
export class AvatarFigureContainer implements IAvatarFigureContainer
{
    private _parts: Map<string, { type: string; setId: number; colorIds: number[] }>;

    constructor(figure: string)
    {
        this._parts = new Map();
        this._parseFigureString(figure);
    }

    /**
	 * Gets all part type identifiers present in this figure.
	 *
	 * @returns An array of part type strings
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarFigureContainer.as::getPartTypeIds()
    public getPartTypeIds(): string[]
    {
        return Array.from(this._parts.keys());
    }

    /**
	 * Checks whether this figure contains a part of the given type.
	 *
	 * @param type - The part type identifier
	 * @returns True if the part type exists
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarFigureContainer.as::hasPartType()
    public hasPartType(type: string): boolean
    {
        return this._parts.has(type);
    }

    /**
	 * Gets the set id for a given part type.
	 *
	 * @param type - The part type identifier
	 * @returns The set id, or 0 if the part type is not found
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarFigureContainer.as::getPartSetId()
    public getPartSetId(type: string): number
    {
        const part = this._parts.get(type);

        if(part)
        {
            return part.setId;
        }

        return 0;
    }

    /**
	 * Gets the color ids for a given part type.
	 *
	 * @param type - The part type identifier
	 * @returns The color id array, or null if not found
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarFigureContainer.as::getPartColorIds()
    public getPartColorIds(type: string): number[] | null
    {
        const part = this._parts.get(type);

        if(part)
        {
            return part.colorIds;
        }

        return null;
    }

    /**
	 * Updates or adds a part with the given type, set id, and color ids.
	 *
	 * @param type - The part type identifier
	 * @param setId - The set id
	 * @param colorIds - The color id array
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarFigureContainer.as::updatePart()
    public updatePart(type: string, setId: number, colorIds: number[]): void
    {
        this._parts.set(type, {type, setId, colorIds});
    }

    /**
	 * Removes a part by its type identifier.
	 *
	 * @param type - The part type identifier to remove
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarFigureContainer.as::removePart()
    public removePart(type: string): void
    {
        this._parts.delete(type);
    }

    /**
	 * Serializes the figure data back into a figure string.
	 *
	 * @returns The figure string representation
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarFigureContainer.as::getFigureString()
    public getFigureString(): string
    {
        const segments: string[] = [];

        for(const type of this._parts.keys())
        {
            const parts: (string | number)[] = [];
            parts.push(type);
            parts.push(this.getPartSetId(type));

            const colorIds = this.getPartColorIds(type);
            if(colorIds)
            {
                for(const colorId of colorIds)
                {
                    parts.push(colorId);
                }
            }

            segments.push(parts.join('-'));
        }

        return segments.join('.');
    }

    /**
	 * Parses a figure string into part data entries.
	 *
	 * @param figure - The figure string to parse
	 */
    private _parseFigureString(figure: string): void
    {
        if(!figure)
        {
            figure = '';
        }

        const sets = figure.split('.');

        for(const set of sets)
        {
            const parts = set.split('-');

            if(parts.length >= 2)
            {
                const type = String(parts[0]);
                const setId = parseInt(parts[1]) || 0;
                const colorIds: number[] = [];

                for(let i = 2; i < parts.length; i++)
                {
                    colorIds.push(parseInt(parts[i]) || 0);
                }

                this.updatePart(type, setId, colorIds);
            }
        }
    }
}
