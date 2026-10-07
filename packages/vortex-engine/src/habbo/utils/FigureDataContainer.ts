import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.utils.FigureDataContainer');

/**
 * Avatar figure string parser and container.
 *
 * Parses Habbo figure strings (e.g. "hd-180-1.ch-255-66.lg-280-110")
 * into structured data with part set types, IDs, and colors.
 * Provides methods to query and modify figure data.
 *
 * @see source_as_win63/habbo/utils/FigureDataContainer.as
 */
export class FigureDataContainer
{
    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::MALE
    public static readonly MALE: string = 'M';
    public static readonly FEMALE: string = 'F';
    public static readonly UNISEX: string = 'U';
    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::SCALE
    public static readonly SCALE: string = 'h';
    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::ACTION
    public static readonly ACTION: string = 'std';
    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::DEFAULT_FRAME
    public static readonly DEFAULT_FRAME: string = '0';

    public static readonly HEAD: string = 'hd';
    // AS3: sources/win63_version/habbo/utils/FigureDataContainer.as::HAIR
    public static readonly HAIR: string = 'hr';
    // AS3: sources/win63_version/habbo/utils/FigureDataContainer.as::HAT
    public static readonly HAT: string = 'ha';
    // AS3: sources/win63_version/habbo/utils/FigureDataContainer.as::HEAD_ACCESSORIES
    public static readonly HEAD_ACCESSORIES: string = 'he';
    // AS3: sources/win63_version/habbo/utils/FigureDataContainer.as::EYE_ACCESSORIES
    public static readonly EYE_ACCESSORIES: string = 'ea';
    // AS3: sources/win63_version/habbo/utils/FigureDataContainer.as::FACE_ACCESSORIES
    public static readonly FACE_ACCESSORIES: string = 'fa';
    // AS3: sources/win63_version/habbo/utils/FigureDataContainer.as::JACKET
    public static readonly JACKET: string = 'cc';
    // AS3: sources/win63_version/habbo/utils/FigureDataContainer.as::SHIRT
    public static readonly SHIRT: string = 'ch';
    // AS3: sources/win63_version/habbo/utils/FigureDataContainer.as::CHEST_ACCESSORIES
    public static readonly CHEST_ACCESSORIES: string = 'ca';
    // AS3: sources/win63_version/habbo/utils/FigureDataContainer.as::CHEST_PRINTS
    public static readonly CHEST_PRINTS: string = 'cp';
    // AS3: sources/win63_version/habbo/utils/FigureDataContainer.as::TROUSERS
    public static readonly TROUSERS: string = 'lg';
    // AS3: sources/win63_version/habbo/utils/FigureDataContainer.as::SHOES
    public static readonly SHOES: string = 'sh';
    // AS3: sources/win63_version/habbo/utils/FigureDataContainer.as::TROUSER_ACCESSORIES
    public static readonly TROUSER_ACCESSORIES: string = 'wa';

    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::BLOCKED_FX_TYPES
    private static readonly BLOCKED_FX_TYPES: number[] = [28, 29, 30, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 68];

    private static readonly VALID_SET_TYPES: string[] = [
        'hd', 'hr', 'ha', 'he', 'ea', 'fa', 'ch', 'cc', 'ca', 'cp', 'lg', 'sh', 'wa'
    ];

    private _parts: Map<string, number> = new Map();
    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::_colors
    private _colors: Map<string, number[]> = new Map();
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/utils/FigureDataContainer.as::_gender
    private _gender: string = 'M';

    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::get gender()
    get gender(): string
    {
        return this._gender;
    }

    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    /**
	 * Check if an effect type is blocked.
	 *
	 * @param fxType The effect type ID
	 * @returns True if the effect type is blocked
	 */
    static isBlockedFxType(fxType: number): boolean
    {
        return FigureDataContainer.BLOCKED_FX_TYPES.indexOf(fxType) !== -1;
    }

    /**
	 * Load avatar data from a figure string and gender.
	 *
	 * @param figureString The figure string (e.g. "hd-180-1.ch-255-66")
	 * @param gender The gender code ("M", "F", or "U")
	 */
    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::loadAvatarData()
    loadAvatarData(figureString: string, gender: string): void
    {
        this._parts = new Map();
        this._colors = new Map();
        this._gender = gender;
        this.parseFigureString(figureString);
    }

    /**
	 * Check if the figure has a given set type.
	 *
	 * @param type The set type code (e.g. "hd", "hr")
	 * @returns True if the set type exists
	 */
    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::hasSetType()
    hasSetType(type: string): boolean
    {
        return this._parts.has(type);
    }

    /**
	 * Get the part set ID for a given set type.
	 *
	 * @param type The set type code
	 * @returns The part set ID, or -1 if not found
	 */
    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::getPartSetId()
    getPartSetId(type: string): number
    {
        const value = this._parts.get(type);

        if(value !== undefined)
        {
            return value;
        }

        return -1;
    }

    /**
	 * Get the colour IDs for a given set type.
	 *
	 * @param type The set type code
	 * @returns An array of colour IDs, or empty array if not found
	 */
    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::getColourIds()
    getColourIds(type: string): number[]
    {
        const value = this._colors.get(type);

        if(value !== undefined)
        {
            return value;
        }

        return [];
    }

    /**
	 * Reconstruct the figure string from the stored data.
	 *
	 * @returns The figure string
	 */
    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::getFigureString()
    getFigureString(): string
    {
        const figureParts: string[] = [];

        for(const [setType, partId] of this._parts)
        {
            if(partId !== null && partId !== undefined)
            {
                let part = setType + '-' + partId;
                const colors = this._colors.get(setType);

                if(colors)
                {
                    for(let i = 0; i < colors.length; i++)
                    {
                        part += '-' + colors[i];
                    }
                }

                figureParts.push(part);
            }
        }

        return figureParts.join('.');
    }

    /**
	 * Save part data (ID and colors) for a set type.
	 *
	 * @param type The set type code
	 * @param id The part set ID
	 * @param colors The colour ID array
	 * @param updateFigure Whether to trigger a figure update (reserved for future use)
	 */
    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::savePartData()
    savePartData(type: string, id: number, colors: number[], updateFigure: boolean = false): void
    {
        this.savePartSetId(type, id, updateFigure);
        this.savePartSetColourId(type, colors, updateFigure);
    }

    /**
	 * Save colour IDs for a given set type.
	 *
	 * @param type The set type code
	 * @param colors The colour ID array
	 * @param _updateFigure Reserved for future use
	 */
    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::savePartSetColourId()
    savePartSetColourId(type: string, colors: number[], _updateFigure: boolean = true): void
    {
        if(FigureDataContainer.VALID_SET_TYPES.indexOf(type) === -1)
        {
            log.warn('Unknown partset: ' + type + ', can not store color-ids');
            return;
        }

        this._colors.set(type, colors);
    }

    /**
	 * Get a figure string containing only the head set type with a replaced face ID.
	 *
	 * @param faceId The face part ID to use
	 * @returns The figure string with only the head set, using the given face ID
	 */
    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::getFigureStringWithFace()
    getFigureStringWithFace(faceId: number): string
    {
        const headTypes = ['hd'];
        const figureParts: string[] = [];

        for(const setType of headTypes)
        {
            const colors = this._colors.get(setType);

            if(colors)
            {
                let partId = this._parts.get(setType) ?? 0;

                if(setType === 'hd')
                {
                    partId = faceId;
                }

                let part = setType + '-' + partId;

                if(partId >= 0)
                {
                    for(let i = 0; i < colors.length; i++)
                    {
                        part += '-' + colors[i];
                    }
                }

                figureParts.push(part);
            }
        }

        return figureParts.join('.');
    }

    /**
	 * Dispose of this container and release resources.
	 */
    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._parts.clear();
        this._colors.clear();
        this._disposed = true;
    }

    /**
	 * Parse a figure string into parts and colors.
	 *
	 * Figure strings have the format: "setType-partId-color1-color2.setType2-partId2-color1"
	 *
	 * @param str The figure string to parse
	 */
    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::parseFigureString()
    private parseFigureString(str: string): void
    {
        if(str === null || str === undefined)
        {
            return;
        }

        const sets = str.split('.');

        for(const set of sets)
        {
            const parts = set.split('-');

            if(parts.length > 0)
            {
                const setType = parts[0];
                const partId = parseInt(parts[1]) || 0;
                const colors: number[] = [];

                for(let i = 2; i < parts.length; i++)
                {
                    colors.push(parseInt(parts[i]) || 0);
                }

                if(colors.length === 0)
                {
                    colors.push(0);
                }

                this.savePartSetId(setType, partId, false);
                this.savePartSetColourId(setType, colors, false);
            }
        }
    }

    /**
	 * Save a part set ID for a given set type.
	 *
	 * @param type The set type code
	 * @param id The part set ID
	 * @param _updateFigure Reserved for future use
	 */
    // AS3: .../src/com/sulake/habbo/utils/FigureDataContainer.as::savePartSetId()
    private savePartSetId(type: string, id: number, _updateFigure: boolean = true): void
    {
        if(FigureDataContainer.VALID_SET_TYPES.indexOf(type) === -1)
        {
            log.warn('Unknown partset: ' + type + ', can not store id: ' + id);
            return;
        }

        if(id >= 0)
        {
            this._parts.set(type, id);
        }
        else
        {
            this._parts.delete(type);
        }
    }
}
