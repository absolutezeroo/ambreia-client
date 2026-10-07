import type {ISetType} from './figure/ISetType';
import type {IFigurePartSet} from './figure/IFigurePartSet';
import type {IPalette} from './figure/IPalette';

/**
 * Interface for figure data providing access to set types, palettes, and part sets.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/_SafeCls_2201.as (IFigureData)
 */
export interface IFigureData
{
    getSetType(type: string): ISetType | null;

    getPalette(id: number): IPalette | null;

    getFigurePartSet(id: number): IFigurePartSet | null;
}
