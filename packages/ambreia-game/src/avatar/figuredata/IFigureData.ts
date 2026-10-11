/**
 * Mutable figure state exposed to the avatar editor's pages.
 *
 * TS-only: the concrete `FigureData` owns serialization and preview plumbing too, while category
 * models only need the state and edit operations below. Keeping that surface here prevents the
 * page contracts from depending on the concrete figure implementation.
 */
export interface IFigureData
{
    readonly gender: string;

    avatarEffectType: number;

    direction: number;

    loadAvatarData(figureString: string, gender: string): void;

    getPartSetId(partType: string): number;

    getColourIds(partType: string): number[];

    getFigureString(): string;

    getFigureStringWithFace(setId: number): string;

    savePartData(partType: string, setId: number, colourIds: number[], update?: boolean): void;

    savePartSetColourId(partType: string, colourIds: number[], update?: boolean): void;

    updateView(): void;
}
