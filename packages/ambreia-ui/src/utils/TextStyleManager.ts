import {TextStyle} from './TextStyle';

/**
 * Static registry for named text styles.
 *
 * Initializes with 3 base defaults (regular, italic, bold) and parses
 * the embedded Habbo CSS to register ~60 additional named styles.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyleManager.as
 */
export class TextStyleManager 
{
    /**
    * Embedded Habbo text styles CSS.
    *
    * Source: HabboWindowManagerCom_text_styles_css.bin
    */
    private static readonly HABBO_TEXT_STYLES_CSS = `
u_regular {
    font-family: Ubuntu;
    font-size: 12;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
u_bold {
    font-family: Ubuntu;
    font-size: 12;
    font-weight: bold;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
u_italic {
    font-family: Ubuntu;
    font-size: 12;
    font-style: italic;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
u_bold_italic {
    font-family: Ubuntu;
    font-size: 12;
    font-style: italic;
    font-weight: bold;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
u_small {
    font-family: Ubuntu;
    font-size: 10;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
u_button_tab {
    font-family: Ubuntu;
    font-size: 12;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
u_headline_small {
    font-family: Ubuntu;
    font-weight: bold;
    font-size: 14;
    kerning: true;
    anti-alias-type: advanced;
}
u_headline_medium {
    font-family: Ubuntu;
    font-weight: bold;
    font-size: 16;
    kerning: true;
    anti-alias-type: advanced;
}
u_headline_big {
    font-family: Ubuntu;
    font-weight: bold;
    font-size: 18;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
u_frame_title {
    font-family: Ubuntu;
    font-weight: bold;
    font-size: 12;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
u_chat_name {
    font-family: Ubuntu;
    font-weight: bold;
    font-size: 12;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
u_chat_name_whisper {
    font-family: Ubuntu;
    font-weight: bold;
    font-style: italic;
    font-size: 12;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
u_chat_speak {
    font-family: Ubuntu;
    font-size: 12;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
u_chat_shout {
    font-family: Ubuntu;
    font-weight: bold;
    font-size: 12;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
u_chat_whisper {
    font-family: Ubuntu;
    font-size: 12;
    kerning: true;
    font-style: italic;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
u_tool_tip {
    font-family: Ubuntu;
    font-size: 11;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
}
u_tag {
    font-family: Ubuntu;
    font-size: 10;
    font-style: italic;
    kerning: true;
    anti-alias-type: advanced;
}
ubuntu_condensed_regular {
    font-family: UbuntuCondensed;
    font-size: 11;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
ubuntu_condensed_title {
    font-family: UbuntuCondensed;
    font-size: 18;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: 200;
}
il_regular {
    font-family: Ubuntu;
    font-size: 11;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
    etching-color: #b2ffffff;
    etching-position: bottom;
}
il_regular_white {
    font-family: Ubuntu;
    font-size: 11;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
il_small {
    font-family: Ubuntu;
    font-size: 9;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
    etching-color: #b2ffffff;
    etching-position: bottom;
}
il_small_white {
    font-family: Ubuntu;
    font-size: 9;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
il_heading_title {
    font-family: Ubuntu;
    font-size: 18;
    font-weight: bold;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
    etching-color: #b2ffffff;
    etching-position: bottom;
}
il_heading_1 {
    font-family: Ubuntu;
    font-size: 14;
    font-weight: bold;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
    etching-color: #b2ffffff;
    etching-position: bottom;
}
il_heading_2 {
    font-family: Ubuntu;
    font-size: 12;
    font-weight: bold;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
    etching-color: #b2ffffff;
    etching-position: bottom;
}
il_heading_3 {
    font-family: Ubuntu;
    font-size: 10;
    font-weight: bold;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
    etching-color: #b2ffffff;
    etching-position: bottom;
}
il_button {
    font-family: Ubuntu;
    font-size: 10;
    font-weight: bold;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
    etching-color: #b2ffffff;
    etching-position: bottom;
}
il_border {
    font-family: Ubuntu;
    font-size: 10;
    font-weight: bold;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
    etching-color: #b2ffffff;
    etching-position: bottom;
}
il_frame_title {
    font-family: Ubuntu;
    font-size: 10;
    font-weight: bold;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
    etching-color: #b2ffffff;
    etching-position: bottom;
}
il_frame_modal_title {
    font-family: Ubuntu;
    font-size: 24;
    font-weight: bold;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
il_link_regular {
    font-family: Ubuntu;
    font-size: 11;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
    etching-color: #b2ffffff;
    etching-position: bottom;
    text-decoration: underline;
}
il_link_strong {
    font-family: Ubuntu;
    font-size: 11;
    font-weight: bold;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
    etching-color: #b2ffffff;
    etching-position: bottom;
    text-decoration: underline;
}
id_regular {
    font-family: Ubuntu;
    font-size: 11;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
id_small {
    font-family: Ubuntu;
    font-size: 9;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
id_heading_title {
    font-family: Ubuntu;
    font-size: 18;
    font-weight: bold;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
id_heading_1 {
    font-family: Ubuntu;
    font-size: 14;
    font-weight: bold;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
id_heading_2 {
    font-family: Ubuntu;
    font-size: 12;
    font-weight: bold;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
id_heading_3 {
    font-family: Ubuntu;
    font-size: 10;
    font-weight: bold;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
id_button {
    font-family: Ubuntu;
    font-size: 10;
    font-weight: bold;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
id_border {
    font-family: Ubuntu;
    font-size: 10;
    font-weight: bold;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
id_frame_title {
    font-family: UbuntuCondensed;
    font-size: 12;
    font-weight: bold;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
id_frame_modal_title {
    font-family: Ubuntu;
    font-size: 24;
    font-weight: bold;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
}
id_link_regular {
    font-family: Ubuntu;
    font-size: 11;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
    text-decoration: underline;
}
id_link_strong {
    font-family: Ubuntu;
    font-size: 11;
    font-weight: bold;
    color: #ffffff;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
    text-decoration: underline;
}
regular {
    font-family: Volter;
    font-size: 9;
    anti-alias-type: normal;
}
italic {
    font-family: Volter;
    font-size: 9;
    font-style: italic;
    anti-alias-type: normal;
}
bold {
    font-family: Volter Bold;
    font-size: 9;
    anti-alias-type: normal;
}
small {
    font-family: Volter;
    font-size: 9;
    anti-alias-type: normal;
}
bold_italic {
    font-family: Volter Bold;
    font-size: 9;
    font-style: italic;
    anti-alias-type: normal;
}
button_regular {
    font-family: Volter;
    font-size: 9;
    anti-alias-type: normal;
}
button_bold {
    font-family: Volter Bold;
    font-size: 9;
    anti-alias-type: normal;
}
button_shiny_regular {
    font-family: Ubuntu;
    font-size: 12;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
button_shiny_bold {
    font-family: Ubuntu;
    font-weight: bold;
    font-size: 12;
    kerning: true;
    anti-alias-type: advanced;
    sharpness: 80;
    thickness: -15;
}
button_tab {
    font-family: Volter;
    font-size: 9;
    anti-alias-type: normal;
}
frame_title {
    font-family: Volter Bold;
    font-size: 9;
    color: #ffffff;
    anti-alias-type: normal;
}
headline_big {
    font-family: Volter Bold;
    font-size: 18;
    anti-alias-type: normal;
}
headline_medium {
    font-family: Volter Bold;
    font-size: 9;
    anti-alias-type: normal;
}
headline_small {
    font-family: Volter Bold;
    font-size: 9;
    anti-alias-type: normal;
}
chat_name {
    font-family: Volter Bold;
    font-size: 9;
    anti-alias-type: normal;
}
chat_speak {
    font-family: Volter;
    font-size: 9;
    anti-alias-type: normal;
}
chat_shout {
    font-family: Volter Bold;
    font-size: 9;
    anti-alias-type: normal;
}
chat_whisper {
    font-family: Volter;
    font-size: 9;
    anti-alias-type: normal;
}
tool_tip {
    font-family: Volter;
    font-size: 9;
    color: #ffffff;
    anti-alias-type: normal;
}
tag {
    font-family: Volter;
    font-size: 9;
    anti-alias-type: normal;
}
`;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyleManager.as::REGULAR
    public static readonly REGULAR: string = 'regular';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyleManager.as::ITALIC
    public static readonly ITALIC: string = 'italic';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyleManager.as::BOLD
    public static readonly BOLD: string = 'bold';

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyleManager.as::TAG_OPEN
    private static readonly TAG_OPEN: string = '{';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyleManager.as::TAG_CLOSE
    private static readonly TAG_CLOSE: string = '}';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyleManager.as::CMT_OPEN
    private static readonly CMT_OPEN: string = '/*';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyleManager.as::CMT_CLOSE
    private static readonly CMT_CLOSE: string = '*/';

    private static _styles: Map<string, TextStyle> = new Map();
    private static _styleNames: string[] = [];
    private static _initialized: boolean = false;

    /**
     * Ensures the style registry is initialized.
     *
     * Called automatically on first access. Registers 3 base defaults
     * then parses the embedded Habbo CSS to register all named styles.
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyleManager.as::init()
    public static init(): void 
    {
        if(TextStyleManager._initialized) return;

        TextStyleManager._initialized = true;

        // Base defaults (AS3 lines 38-64)
        let style = new TextStyle();

        style.name = TextStyleManager.REGULAR;
        style.color = 0;
        style.fontSize = 9;
        style.fontFamily = 'Ubuntu, Arial, sans-serif';
        style.fontStyle = 'normal';
        style.fontWeight = 'normal';
        TextStyleManager._styles.set(style.name, style);
        TextStyleManager._styleNames.push(style.name);

        style = new TextStyle();
        style.name = TextStyleManager.ITALIC;
        style.color = 0;
        style.fontSize = 9;
        style.fontFamily = 'Ubuntu, Arial, sans-serif';
        style.fontStyle = 'italic';
        style.fontWeight = 'normal';
        TextStyleManager._styles.set(style.name, style);
        TextStyleManager._styleNames.push(style.name);

        style = new TextStyle();
        style.name = TextStyleManager.BOLD;
        style.color = 0;
        style.fontSize = 9;
        style.fontFamily = 'Ubuntu, Arial, sans-serif';
        style.fontStyle = 'normal';
        style.fontWeight = 'bold';
        TextStyleManager._styles.set(style.name, style);
        TextStyleManager._styleNames.push(style.name);

        // Parse and register the embedded Habbo text styles CSS
        const embeddedStyles = TextStyleManager.parseCSS(TextStyleManager.HABBO_TEXT_STYLES_CSS);

        TextStyleManager.setStyles(embeddedStyles);
    }

    /**
     * Retrieves a registered style by name.
     *
     * @param name - The style name (e.g. `"u_regular"`, `"id_frame_title"`)
     * @returns The style, or null if not found
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyleManager.as::getStyle()
    public static getStyle(name: string): TextStyle | null 
    {
        TextStyleManager.init();

        return TextStyleManager._styles.get(name) ?? null;
    }

    /**
     * Registers or overwrites a named style.
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyleManager.as::setStyle()
    public static setStyle(name: string, style: TextStyle): void 
    {
        TextStyleManager.init();

        style.name = name;
        TextStyleManager._styles.set(name, style);

        if(TextStyleManager._styleNames.indexOf(name) === -1) 
        {
            TextStyleManager._styleNames.push(name);
        }
    }

    /**
     * Batch-registers an array of styles.
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyleManager.as::setStyles()
    public static setStyles(styles: TextStyle[]): void 
    {
        TextStyleManager.init();

        for(const s of styles) 
        {
            TextStyleManager._styles.set(s.name, s);

            if(TextStyleManager._styleNames.indexOf(s.name) === -1) 
            {
                TextStyleManager._styleNames.push(s.name);
            }
        }
    }

    /**
     * Parses a CSS-like string into an array of TextStyle objects.
     *
     * The format is a simplified CSS variant where selectors are style names
     * (no `.` prefix) and properties use Habbo-specific names like
     * `etching-color`, `anti-alias-type`, etc.
     *
     * @param css - The CSS text to parse
     * @returns Array of parsed TextStyle objects
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyleManager.as::parseCSS()
    public static parseCSS(css: string): TextStyle[] 
    {
        const names = TextStyleManager.parseStyleNamesFromCSS(css);
        const blocks = TextStyleManager.parseCSSBlocks(css);
        const result: TextStyle[] = [];

        for(let i = 0; i < names.length; i++) 
        {
            const name = names[i];
            const block = blocks[i] || '';
            const style = new TextStyle();

            style.name = name;

            const props = TextStyleManager.parseProperties(block);

            if(props['color'] != null) 
            {
                style.color = parseInt(String(props['color']).replace('#', '0x'), 16);
            }

            if(props['font-family'] != null) 
            {
                const rawFamily = String(props['font-family']).trim();

                style.fontFamily = TextStyleManager.mapFontFamily(rawFamily);

                // "Volter Bold" is a separate font-family in AS3 — infer bold weight.
                // Shared with the layout path (`TextController.set fontFace()`), which used to
                // have no such inference at all; `Ubuntu bold` is the other name that occurs.
                if(style.fontWeight == null && TextStyleManager.isBoldFontName(rawFamily))
                {
                    style.fontWeight = 'bold';
                }
            }

            if(props['font-size'] != null) 
            {
                style.fontSize = parseInt(String(props['font-size']));
            }

            if(props['font-style'] != null) 
            {
                style.fontStyle = String(props['font-style']).trim();
            }

            if(props['font-weight'] != null) 
            {
                style.fontWeight = String(props['font-weight']).trim();
            }

            if(props['kerning'] != null) 
            {
                style.kerning = String(props['kerning']).trim() === 'true';
            }

            if(props['leading'] != null) 
            {
                style.leading = parseInt(String(props['leading']));
            }

            if(props['letter-spacing'] != null) 
            {
                style.letterSpacing = parseInt(String(props['letter-spacing']));
            }

            if(props['text-decoration'] != null) 
            {
                style.textDecoration = String(props['text-decoration']).trim();
            }

            if(props['text-indent'] != null) 
            {
                style.textIndent = parseInt(String(props['text-indent']));
            }

            if(props['anti-alias-type'] != null) 
            {
                style.antiAliasType = String(props['anti-alias-type']).trim();
            }

            if(props['sharpness'] != null) 
            {
                style.sharpness = parseInt(String(props['sharpness']));
            }

            if(props['thickness'] != null) 
            {
                style.thickness = parseInt(String(props['thickness']));
            }

            if(props['etching-color'] != null) 
            {
                style.etchingColor = parseInt(String(props['etching-color']).replace('#', '0x'), 16);
            }

            if(props['etching-position'] != null) 
            {
                style.etchingPosition = String(props['etching-position']).trim();
            }

            result.push(style);
        }

        return result;
    }

    /**
     * Finds a registered style whose properties match a CSS snippet.
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyleManager.as::findMatchingTextStyle()
    public static findMatchingTextStyle(css: string): TextStyle | null 
    {
        TextStyleManager.init();

        const parsed = TextStyleManager.parseCSS(css);

        if(parsed.length === 0) return null;

        const candidate = parsed[0];
        const existing = TextStyleManager._styles.get(candidate.name);

        if(existing && existing.equals(candidate)) 
        {
            return existing;
        }

        return null;
    }

    /**
     * Returns all registered style names.
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyleManager.as::enumerateStyleNames()
    public static enumerateStyleNames(): string[] 
    {
        TextStyleManager.init();

        return [...TextStyleManager._styleNames];
    }

    /**
     * Maps AS3 font family names to web-safe equivalents.
     *
     * Public because the stylesheet is no longer the only way a Flash font
     * name reaches a window: a layout's `font_face` variable carries one too,
     * and until both paths resolve it the same way the field means one thing
     * on one path and another on the other.
     */
    // TS-only: AS3 hands the Flash font name straight to `TextFormat.font` and the player
    // resolves it against the SWF's embedded fonts; a browser has no such registry, so the
    // name has to be translated to a CSS family list. No AS3 counterpart.
    public static mapFontFamily(family: string): string
    {
        switch(family) 
        {
            case 'Ubuntu':
                return 'Ubuntu, Arial, sans-serif';
            case 'UbuntuCondensed':
                return 'Ubuntu Condensed, Ubuntu, Arial, sans-serif';
            case 'Volter':
                return 'Volter (Goldfish), Ubuntu, Arial, sans-serif';
            case 'Volter Bold':
                return 'Volter (Goldfish), Ubuntu, Arial, sans-serif';
            case 'Ubuntu bold':
                return 'Ubuntu, Arial, sans-serif';
            // Both fields that ask for it hold text laid out in columns — the floor plan's tile
            // grid (`floor_plan_export_import_xml`) and the wiki source editor
            // (`habbopedia_edit_xml`) — and both were being handed Ubuntu, a proportional face,
            // which takes the grid apart. No monospace font ships, so this is the system one: the
            // glyph atlas declines an unregistered family and the field falls back to
            // `fillText()`, which is the right trade for a field whose columns have to line up.
            case 'Courier':
                return '"Courier New", Courier, monospace';
            default:
                return family + ', Arial, sans-serif';
        }
    }

    /**
     * Whether a Flash font name carries its weight in the name.
     *
     * Flash embeds "Volter Bold" as a font of its own, so a layout that wants bold says so by
     * naming that font and nothing else — 113 of the 115 `font_face="Volter Bold"` windows in the
     * shipped layouts carry no `bold` var at all. A CSS family cannot work that way: the port
     * ships the same file as the *bold weight* of family `Volter (Goldfish)`, so the name has to
     * be split into family plus weight, and this is the weight half.
     */
    // TS-only: Flash has no counterpart — it looks the name up in its own font table.
    public static isBoldFontName(family: string): boolean
    {
        return /\bbold$/i.test(family.trim());
    }

    /**
     * Extracts style names from CSS text.
     *
     * Port of AS3 TextStyleManager.parseStyleNamesFromCSS().
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextStyleManager.as::parseStyleNamesFromCSS()
    private static parseStyleNamesFromCSS(css: string): string[] 
    {
        const names: string[] = [];
        const cleaned = css.replace(/\t/g, '').replace(/\n/g, '').replace(/\r/g, '');

        const segments = cleaned.split(TextStyleManager.TAG_CLOSE);

        for(let seg of segments) 
        {
            // Strip leading comments
            while(seg.indexOf(TextStyleManager.CMT_OPEN) === 0) 
            {
                const closeIdx = seg.indexOf(TextStyleManager.CMT_CLOSE);

                if(closeIdx === -1) break;

                seg = seg.substring(closeIdx + 2);
            }

            const openIdx = seg.indexOf(TextStyleManager.TAG_OPEN);

            if(openIdx === -1) continue;

            const name = seg.substring(0, openIdx).replace(/\s/g, '');

            if(name.length > 0) 
            {
                names.push(name);
            }
        }

        return names;
    }

    /**
     * Extracts the property blocks (content between `{` and `}`) from CSS.
     */
    private static parseCSSBlocks(css: string): string[] 
    {
        const blocks: string[] = [];
        const regex = /\{([^}]*)\}/g;
        let match: RegExpExecArray | null;

        while((match = regex.exec(css)) !== null) 
        {
            blocks.push(match[1]);
        }

        return blocks;
    }

    /**
     * Parses `property: value;` pairs from a CSS block string.
     */
    private static parseProperties(block: string): Record<string, string> 
    {
        const result: Record<string, string> = {};
        const declarations = block.split(';');

        for(const decl of declarations) 
        {
            const colonIdx = decl.indexOf(':');

            if(colonIdx === -1) continue;

            const key = decl.substring(0, colonIdx).trim();
            const value = decl.substring(colonIdx + 1).trim();

            if(key.length > 0 && value.length > 0) 
            {
                result[key] = value;
            }
        }

        return result;
    }
}
