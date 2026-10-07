/**
 * Describes the visual formatting for text in a window element.
 *
 * Port of AS3's TextStyle data class. Each property is nullable so that
 * only explicitly-set values override inherited defaults.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as
 */
export class TextStyle 
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::NORMAL
    public static readonly NORMAL: string = 'normal';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::ITALIC
    public static readonly ITALIC: string = 'italic';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::BOLD
    public static readonly BOLD: string = 'bold';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::UNDERLINE
    public static readonly UNDERLINE: string = 'underline';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::NONE
    public static readonly NONE: string = 'none';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::ADVANCED
    public static readonly ADVANCED: string = 'advanced';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::TOP_LEFT
    public static readonly TOP_LEFT: string = 'top-left';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::TOP
    public static readonly TOP: string = 'top';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::TOP_RIGHT
    public static readonly TOP_RIGHT: string = 'top-right';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::LEFT
    public static readonly LEFT: string = 'left';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::RIGHT
    public static readonly RIGHT: string = 'right';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::BOTTOM_LEFT
    public static readonly BOTTOM_LEFT: string = 'bottom-left';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::BOTTOM
    public static readonly BOTTOM: string = 'bottom';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::BOTTOM_RIGHT
    public static readonly BOTTOM_RIGHT: string = 'bottom-right';

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::name
    public name: string = '';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::color
    public color: number | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::fontFamily
    public fontFamily: string | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::fontSize
    public fontSize: number | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::fontStyle
    public fontStyle: string | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::fontWeight
    public fontWeight: string | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::kerning
    public kerning: boolean | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::leading
    public leading: number | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::letterSpacing
    public letterSpacing: number | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::textDecoration
    public textDecoration: string | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::textIndent
    public textIndent: number | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::antiAliasType
    public antiAliasType: string | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::sharpness
    public sharpness: number | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::thickness
    public thickness: number | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::etchingColor
    public etchingColor: number | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::etchingPosition
    public etchingPosition: string | null = null;

    /**
     * Compares all style properties (excluding name) for equality.
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::equals()
    public equals(other: TextStyle): boolean 
    {
        return this.color === other.color
            && this.fontFamily === other.fontFamily
            && this.fontSize === other.fontSize
            && this.fontStyle === other.fontStyle
            && this.fontWeight === other.fontWeight
            && this.kerning === other.kerning
            && this.leading === other.leading
            && this.letterSpacing === other.letterSpacing
            && this.textDecoration === other.textDecoration
            && this.textIndent === other.textIndent
            && this.antiAliasType === other.antiAliasType
            && this.sharpness === other.sharpness
            && this.thickness === other.thickness
            && this.etchingColor === other.etchingColor
            && this.etchingPosition === other.etchingPosition;
    }

    /**
     * Creates a deep copy of this style.
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::clone()
    public clone(): TextStyle 
    {
        const copy = new TextStyle();

        copy.name = this.name;
        copy.color = this.color;
        copy.fontFamily = this.fontFamily;
        copy.fontSize = this.fontSize;
        copy.fontStyle = this.fontStyle;
        copy.fontWeight = this.fontWeight;
        copy.kerning = this.kerning;
        copy.leading = this.leading;
        copy.letterSpacing = this.letterSpacing;
        copy.textDecoration = this.textDecoration;
        copy.textIndent = this.textIndent;
        copy.antiAliasType = this.antiAliasType;
        copy.sharpness = this.sharpness;
        copy.thickness = this.thickness;
        copy.etchingColor = this.etchingColor;
        copy.etchingPosition = this.etchingPosition;

        return copy;
    }

    /**
     * Returns a CSS-like string representation for debugging.
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyle.as::toString()
    public toString(): string 
    {
        let out = this.name + ' {\n';

        if(this.color != null) out += `\tcolor: #${this.color.toString(16).padStart(6, '0')};\n`;
        if(this.fontFamily != null) out += `\tfont-family: ${this.fontFamily};\n`;
        if(this.fontSize != null) out += `\tfont-size: ${this.fontSize};\n`;
        if(this.fontStyle != null) out += `\tfont-style: ${this.fontStyle};\n`;
        if(this.fontWeight != null) out += `\tfont-weight: ${this.fontWeight};\n`;
        if(this.kerning != null) out += `\tkerning: ${this.kerning};\n`;
        if(this.leading != null) out += `\tleading: ${this.leading};\n`;
        if(this.letterSpacing != null) out += `\tletter-spacing: ${this.letterSpacing};\n`;
        if(this.textDecoration != null) out += `\ttext-decoration: ${this.textDecoration};\n`;
        if(this.textIndent != null) out += `\ttext-indent: ${this.textIndent};\n`;
        if(this.antiAliasType != null) out += `\tanti-alias-type: ${this.antiAliasType};\n`;
        if(this.sharpness != null) out += `\tsharpness: ${this.sharpness};\n`;
        if(this.thickness != null) out += `\tthickness: ${this.thickness};\n`;
        if(this.etchingColor != null) out += `\tetching-color: #${this.etchingColor.toString(16).padStart(8, '0')};\n`;
        if(this.etchingPosition != null) out += `\tetching-position: ${this.etchingPosition};\n`;

        out += '}';

        return out;
    }
}
