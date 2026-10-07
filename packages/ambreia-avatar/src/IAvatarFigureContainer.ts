/**
 * Interface for avatar figure container that manages figure part sets and colors.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/IAvatarFigureContainer.as (IAvatarFigureContainer)
 */
export interface IAvatarFigureContainer
{
    getPartTypeIds(): string[];

    hasPartType(type: string): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/IAvatarFigureContainer.as::getPartSetId()
    getPartSetId(type: string): number;

    getPartColorIds(type: string): number[] | null;

    updatePart(type: string, setId: number, colorIds: number[]): void;

    removePart(type: string): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/IAvatarFigureContainer.as::getFigureString()
    getFigureString(): string;
}
