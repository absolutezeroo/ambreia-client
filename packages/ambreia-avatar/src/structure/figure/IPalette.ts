import type {IPartColor} from './IPartColor';

/**
 * Interface for a color palette used in avatar figure parts.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IPalette.as (IPalette)
 */
export interface IPalette
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IPalette.as::get id()
    readonly id: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IPalette.as::get colors()
    readonly colors: Map<number, IPartColor>;

    getColor(colorId: number): IPartColor | null;
}
