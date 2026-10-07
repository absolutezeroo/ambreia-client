import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';

/**
 * Pet figure/appearance data.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2554/_SafeCls_3943.as
 * (obfuscated in the primary and secondary dumps — `class_2486` in the latter — but the real name
 * survives unobfuscated in
 * sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/inventory/pets/PetFigureData.as,
 * with the identical constructor.)
 *
 * AS3 parses itself out of the wrapper in its constructor; this port keeps an explicit-field
 * constructor because several call sites build it from an already-split figure string, and exposes
 * the AS3 constructor as the static parse() below.
 */
export class PetFigureData
{
    constructor(
        typeId: number,
        paletteId: number,
        color: string,
        breedId: number,
        customPartCount: number,
        customParts: number[]
    )
    {
        this._typeId = typeId;
        this._paletteId = paletteId;
        this._color = color;
        this._breedId = breedId;
        this._customPartCount = customPartCount;
        this._customParts = customParts;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2554/_SafeCls_3943.as::_SafeCls_3943()
    // The AS3 constructor, which reads typeId, paletteId, color, breedId, then customPartCount
    // followed by three ints per part.
    static parse(wrapper: IMessageDataWrapper): PetFigureData
    {
        const typeId = wrapper.readInt();
        const paletteId = wrapper.readInt();
        const color = wrapper.readString();
        const breedId = wrapper.readInt();
        const customPartCount = wrapper.readInt();
        const customParts: number[] = [];

        for(let i = 0; i < customPartCount; i++)
        {
            customParts.push(wrapper.readInt());
            customParts.push(wrapper.readInt());
            customParts.push(wrapper.readInt());
        }

        return new PetFigureData(typeId, paletteId, color, breedId, customPartCount, customParts);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/inventory/pets/PetFigureData.as::_typeId
    private _typeId: number;

    // AS3: .../src/unknowns/_SafePkg_2554/_SafeCls_3943.as::get typeId()
    get typeId(): number
    {
        return this._typeId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/inventory/pets/PetFigureData.as::_paletteId
    private _paletteId: number;

    // AS3: .../src/unknowns/_SafePkg_2554/_SafeCls_3943.as::get paletteId()
    get paletteId(): number
    {
        return this._paletteId;
    }

    // AS3: .../src/unknowns/_SafePkg_2554/_SafeCls_3943.as::_color
    private _color: string;

    // AS3: .../src/unknowns/_SafePkg_2554/_SafeCls_3943.as::get color()
    get color(): string
    {
        return this._color;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/inventory/pets/PetFigureData.as::_breedId
    private _breedId: number;

    // AS3: .../src/unknowns/_SafePkg_2554/_SafeCls_3943.as::get breedId()
    get breedId(): number
    {
        return this._breedId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/inventory/pets/PetFigureData.as::_customPartCount
    private _customPartCount: number;

    // AS3: .../src/unknowns/_SafePkg_2554/_SafeCls_3943.as::get customPartCount()
    get customPartCount(): number
    {
        return this._customPartCount;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/inventory/pets/PetFigureData.as::_customParts
    private _customParts: number[];

    // AS3: .../src/unknowns/_SafePkg_2554/_SafeCls_3943.as::get customParts()
    get customParts(): number[]
    {
        return this._customParts;
    }

    /**
	 * Generate figure string for rendering
	 */
    // AS3: .../src/unknowns/_SafePkg_2554/_SafeCls_3943.as::get figureString()
    get figureString(): string
    {
        let result = `${this._typeId} ${this._paletteId} ${this._color}`;

        result += ` ${this._customPartCount}`;

        for(const part of this._customParts)
        {
            result += ` ${part}`;
        }

        return result;
    }
}
