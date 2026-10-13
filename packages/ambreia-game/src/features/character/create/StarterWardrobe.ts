import type {IFigureData} from '@ambreia/avatar/structure/IFigureData';
import {TILES} from './wizardLook';

/** What a new character may wear, from the figure data: free selectable sets, selectable colours, whole looks. */
export class StarterWardrobe
{
    constructor(private readonly _figureData: IFigureData | null) {}

    /** Whole looks for both genders, each from the first starter sets of the figure data. */
    presets(): Array<{figure: string; gender: 'M' | 'F'}>
    {
        const looks: Array<{figure: string; gender: 'M' | 'F'}> = [];

        for(const gender of ['M', 'F'] as const)
        {
            const sets = (['hd', 'hr', 'ch', 'lg'] as const).map(type => ({type, sets: this.partSets(type, gender), colors: this.colors(type)}));

            for(let i = 0; i < TILES.count / 2; i++)
            {
                if(sets.some(part => part.sets.length === 0)) break;

                looks.push({
                    gender,
                    figure: sets.map(part => `${part.type}-${part.sets[i % part.sets.length]}-${part.colors[(i * 3) % Math.max(1, part.colors.length)] ?? 1}`).join('.')
                });
            }
        }

        return looks;
    }

    /** The sets a new character may wear on a part type: free, selectable, of its gender. */
    partSets(type: string, gender: string): number[]
    {
        const setType = this._figureData?.getSetType(type);

        if(!setType) return [];

        return [...setType.partSets.values()]
            .filter(set => set.isSelectable && !set.isSellable && (set.gender === gender || set.gender === 'U'))
            .map(set => set.id)
            .slice(0, TILES.count);
    }

    palette(type: string): ReturnType<IFigureData['getPalette']>
    {
        const setType = this._figureData?.getSetType(type);

        return setType ? this._figureData!.getPalette(setType.paletteID) : null;
    }

    /** A part type's selectable colours. */
    colors(type: string): number[]
    {
        const palette = this.palette(type);

        return palette ? [...palette.colors.values()].filter(color => color.isSelectable).map(color => color.id) : [];
    }

    /** A colour's RGB, 0 when unknown. */
    rgb(type: string, colorId: number): number
    {
        return this.palette(type)?.getColor(colorId)?.rgb ?? 0;
    }
}
