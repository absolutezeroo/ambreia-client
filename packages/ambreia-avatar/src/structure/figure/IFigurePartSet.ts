import type {IFigurePart} from './IFigurePart';

/**
 * Interface for a figure part set containing parts and metadata.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePartSet.as (IFigurePartSet)
 */
export interface IFigurePartSet
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePartSet.as::get type()
    readonly type: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePartSet.as::get id()
    readonly id: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePartSet.as::get gender()
    readonly gender: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePartSet.as::get clubLevel()
    readonly clubLevel: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePartSet.as::get isColorable()
    readonly isColorable: boolean;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePartSet.as::get isSelectable()
    readonly isSelectable: boolean;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePartSet.as::get isPreSelectable()
    readonly isPreSelectable: boolean;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePartSet.as::get isSellable()
    readonly isSellable: boolean;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePartSet.as::get parts()
    readonly parts: IFigurePart[];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePartSet.as::get hiddenLayers()
    readonly hiddenLayers: string[];

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePartSet.as::getPart()
    getPart(type: string, id: number): IFigurePart | null;
}
