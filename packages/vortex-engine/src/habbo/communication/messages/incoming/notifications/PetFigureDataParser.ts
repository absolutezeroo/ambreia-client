import {PetFigureData} from '@habbo/communication/messages/parser/room/pet/PetFigureData';
import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';

/**
 * Helper to parse PetFigureData from a message wrapper
 *
 * Reads the figure data fields in the order specified by the AS3 class_1657 constructor.
 *
 * @see source_as_win63/habbo/communication/messages/parser/inventory/pets/class_1657.as
 */
export function parsePetFigureData(wrapper: IMessageDataWrapper): PetFigureData
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

/**
 * Parses pet info (class_1679) from wrapper: id, name, figureData, level
 *
 * @see source_as_win63/habbo/communication/messages/parser/inventory/pets/class_1679.as
 */
export interface IPetInfoData
{
    id: number;
    name: string;
    figureData: PetFigureData;
    level: number;
}

export function parsePetInfoData(wrapper: IMessageDataWrapper): IPetInfoData
{
    const id = wrapper.readInt();
    const name = wrapper.readString();
    const figureData = parsePetFigureData(wrapper);
    const level = wrapper.readInt();

    return {id, name, figureData, level};
}
