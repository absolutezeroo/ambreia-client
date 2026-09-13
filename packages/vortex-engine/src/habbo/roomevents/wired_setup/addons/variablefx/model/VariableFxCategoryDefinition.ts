import type {VariableFxStyleDefinition} from './VariableFxStyleDefinition';

/**
 * One effect category and the styles inside it.
 *
 * `getStyle()` falls back to the FIRST style rather than returning null, which is what lets
 * `sanitize()` repair a config naming a style this build does not have — the effect degrades to
 * the category's first style instead of refusing to open.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/model/VariableFxCategoryDefinition.as
 */
export class VariableFxCategoryDefinition
{
    // AS3: .../model/VariableFxCategoryDefinition.as::id
    id: number;

    // AS3: .../model/VariableFxCategoryDefinition.as::runtimeCategory
    runtimeCategory: string;

    // AS3: .../model/VariableFxCategoryDefinition.as::styles
    styles: VariableFxStyleDefinition[];

    // AS3: .../model/VariableFxCategoryDefinition.as::VariableFxCategoryDefinition()
    constructor(id: number, runtimeCategory: string, styles: VariableFxStyleDefinition[])
    {
        this.id = id;
        this.runtimeCategory = runtimeCategory;
        this.styles = styles;
    }

    // AS3: .../model/VariableFxCategoryDefinition.as::getStyle()
    getStyle(id: number): VariableFxStyleDefinition
    {
        for(const style of this.styles)
        {
            if(style.id === id) return style;
        }

        return this.styles[0];
    }
}
