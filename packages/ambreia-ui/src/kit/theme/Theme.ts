import type {PropertyMap} from '../../theme/PropertyMap';

/**
 * Represents a named window theme with a base style range and property defaults.
 *
 * Each theme covers a contiguous range of styles from `baseStyle` to
 * `baseStyle + styleCount - 1`. The `isReal` flag distinguishes actual
 * visual themes (Volter, Ubuntu, Illumina) from virtual groupings
 * (None, Icon, Legacy border).
 *
 * @see sources/win63_version/habbo/window/theme/Theme.as
 */
export class Theme
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/theme/Theme.as::NONE
    public static readonly NONE: string = 'None';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/theme/Theme.as::ICON
    public static readonly ICON: string = 'Icon';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/theme/Theme.as::LEGACY_BORDER
    public static readonly LEGACY_BORDER: string = 'Legacy border';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/theme/Theme.as::VOLTER
    public static readonly VOLTER: string = 'Volter';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/theme/Theme.as::UBUNTU
    public static readonly UBUNTU: string = 'Ubuntu';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/theme/Theme.as::MISC
    public static readonly MISC: string = 'Misc';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/theme/Theme.as::ILLUMINA_LIGHT
    public static readonly ILLUMINA_LIGHT: string = 'Illumina Light';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/theme/Theme.as::ILLUMINA_DARK
    public static readonly ILLUMINA_DARK: string = 'Illumina Dark';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/theme/Theme.as::Theme()
    constructor(name: string, isReal: boolean, baseStyle: number, styleCount: number, propertyDefaults: PropertyMap)
    {
        this._name = name;
        this._isReal = isReal;
        this._baseStyle = baseStyle;
        this._styleCount = styleCount;
        this._propertyDefaults = propertyDefaults;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/theme/Theme.as::_name
    private _name: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/theme/Theme.as::get name()
    public get name(): string
    {
        return this._name;
    }

    // AS3: sources/win63_version/habbo/window/theme/Theme.as::var_4731
    private _isReal: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/theme/Theme.as::get isReal()
    public get isReal(): boolean
    {
        return this._isReal;
    }

    // AS3: sources/win63_version/habbo/window/theme/Theme.as::var_3117
    private _baseStyle: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/theme/Theme.as::get baseStyle()
    public get baseStyle(): number
    {
        return this._baseStyle;
    }

    // AS3: sources/win63_version/habbo/window/theme/Theme.as::var_3711
    private _styleCount: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/theme/Theme.as::get styleCount()
    public get styleCount(): number
    {
        return this._styleCount;
    }

    // AS3: sources/win63_version/habbo/window/theme/Theme.as::var_2210
    private _propertyDefaults: PropertyMap;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/theme/Theme.as::get propertyDefaults()
    public get propertyDefaults(): PropertyMap
    {
        return this._propertyDefaults;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/theme/Theme.as::coversStyle()
    public coversStyle(style: number): boolean
    {
        return style >= this._baseStyle && style < this._baseStyle + this._styleCount;
    }
}
