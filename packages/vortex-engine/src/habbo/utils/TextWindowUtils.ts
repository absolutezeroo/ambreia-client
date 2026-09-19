import type {ITextWindow} from '@core/window/components/ITextWindow';

/**
 * Styling helpers for HTML text windows.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/TextWindowUtils.as
 */
export class TextWindowUtils
{
    /**
     * AS3: .../habbo/utils/TextWindowUtils.as::setHTMLLinkStyle()
     *
     * Builds Flash's four link styles — `a:link`, `a:hover`, `a:active` and `.visited` — and
     * assigns them to the text window's `styleSheet`.
     *
     * Only `a:link` reaches a pixel: `HTMLTextController` paints its anchors with it. The other
     * three are states this port cannot be in — nothing tracks a visited link, and hover/active
     * would need per-anchor mouse tracking the text layout does not do — but they are assembled
     * anyway so the rule set stays whole rather than trimmed to what is read today.
     *
     * Callers: `PhoneNumberCollectView.createWindow()` (`collect_summary`) and
     * `LocalizationCatalogWidget.setLinkStyle()`, which passes the catalog's darker palette.
     */
    // AS3: .../src/com/sulake/habbo/utils/TextWindowUtils.as::setHTMLLinkStyle()
    public static setHTMLLinkStyle(
        textWindow: ITextWindow | null,
        hoverColor: number,
        linkColor: number,
        activeColor: number,
        underlineLinks: boolean = true
    ): void
    {
        if(!textWindow)
        {
            return;
        }

        const link = (underlineLinks ? 'text-decoration: underline; ' : '')
            + `color: ${TextWindowUtils.toHexString(linkColor)};`;

        textWindow.styleSheet = [
            `a:link { ${link} }`,
            `a:hover { color: ${TextWindowUtils.toHexString(hoverColor)}; }`,
            `a:active { color: ${TextWindowUtils.toHexString(activeColor)}; }`,
            '.visited { text-decoration: underline; }',
        ].join(' ');
    }

    /**
     * AS3: .../habbo/utils/TextWindowUtils.as::toHexString()
     *
     * Zero-pads to six digits so `0x0033ff` does not come out as `#33ff`.
     */
    // AS3: .../src/com/sulake/habbo/utils/TextWindowUtils.as::toHexString()
    public static toHexString(color: number): string
    {
        let hex = color.toString(16);

        while(hex.length < 6)
        {
            hex = '0' + hex;
        }

        return '#' + hex;
    }
}
