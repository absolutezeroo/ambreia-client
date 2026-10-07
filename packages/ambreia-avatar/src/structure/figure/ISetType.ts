import type {IFigurePartSet} from './IFigurePartSet';

/**
 * Interface for a figure set type containing part sets and mandatory configuration.
 *
 * @see sources/win63_version/habbo/avatar/structure/figure/ISetType.as
 */
export interface ISetType
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/ISetType.as::get type()
    readonly type: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/ISetType.as::get paletteID()
    readonly paletteID: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/ISetType.as::get partSets()
    readonly partSets: Map<string, IFigurePartSet>;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/ISetType.as::getPartSet()
    getPartSet(id: number): IFigurePartSet | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/ISetType.as::isMandatory()
    isMandatory(gender: string, clubLevel: number): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/ISetType.as::optionalFromClubLevel()
    optionalFromClubLevel(gender: string): number;
}
