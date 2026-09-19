import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IHTMLTextWindow} from './IHTMLTextWindow';
import {TextFieldController} from './TextFieldController';
import {InteractiveController} from './InteractiveController';
import type {WindowEvent} from '../events/WindowEvent';
import type {PropertyStruct} from '../utils/PropertyStruct';
import type {WindowController} from '../WindowController';
import {WindowLinkEvent} from '../events/WindowLinkEvent';
import {WindowMouseEvent} from '../events/WindowMouseEvent';

/**
 * Controller for HTML text windows with link support.
 *
 * Extends TextFieldController with HTML rendering, link event handling,
 * and CSS stylesheet support. In AS3, this is the richest text controller.
 *
 * @see sources/win63_version/core/window/components/HTMLTextController.as
 */
export class HTMLTextController extends TextFieldController implements IHTMLTextWindow
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/HTMLTextController.as::HTML_STYLESHEET_KEY
    private static readonly HTML_STYLESHEET_KEY: string = 'html_stylesheet';

    /** The `a:link` colour `initializeLinkStyle()` sets, used when the stylesheet names none. */
    private static readonly DEFAULT_LINK_COLOR: number = 0x006DE0;

    private _htmlContent: string = '';

    /**
	 * TS-only: where the `<a>` runs ended up in the plain text `_text` holds.
	 *
	 * Flash renders `htmlText` itself and reports a click through a `TextEvent` carrying the href.
	 * This port lays out plain strings, so the anchors have to be remembered as ranges over that
	 * string: the same ranges drive both the link colouring (through `setTextFormat()`) and the
	 * hit test in `update()`.
	 */
    private _linkRuns: Array<{start: number; end: number; href: string}> = [];

    constructor(
        name: string,
        type: number,
        style: number,
        param: number,
        context: IWindowContext,
        rect: { x: number; y: number; width: number; height: number },
        parent: IWindow | null = null,
        procedure: ((event: WindowEvent, window: IWindow) => void) | null = null,
        tags: string[] | null = null,
        properties: unknown[] | null = null,
        id: number = 0,
        dynamicStyle: string = ''
    )
    {
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id, dynamicStyle);

        this.immediateClickMode = true;
    }

    private static _defaultLinkTarget: string = 'default';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/HTMLTextController.as::get defaultLinkTarget()
    public static get defaultLinkTarget(): string
    {
        return HTMLTextController._defaultLinkTarget;
    }

    /**
	 * The default link target for all HTMLTextController instances.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/HTMLTextController.as::set defaultLinkTarget()
    public static set defaultLinkTarget(value: string)
    {
        HTMLTextController._defaultLinkTarget = value;
    }

    /**
	 * The HTML content.
	 */
    public get html(): string
    {
        return this._htmlContent;
    }

    public set html(value: string)
    {
        if(value === null) return;

        this._htmlContent = value;
    }

    private _linkTarget: string = 'default';

    /**
	 * The link target for hyperlinks in this window.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/HTMLTextController.as::get linkTarget()
    public get linkTarget(): string
    {
        return this._linkTarget === 'default' ? HTMLTextController._defaultLinkTarget : this._linkTarget;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/HTMLTextController.as::set linkTarget()
    public set linkTarget(value: string)
    {
        this._linkTarget = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/HTMLTextController.as::_htmlStyleSheetString
    private _htmlStyleSheetString: string | null = null;

    /**
	 * The CSS stylesheet string for HTML rendering.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/HTMLTextController.as::get htmlStyleSheetString()
    public get htmlStyleSheetString(): string | null
    {
        return this._htmlStyleSheetString;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/HTMLTextController.as::set htmlStyleSheetString()
    public set htmlStyleSheetString(value: string | null)
    {
        this._htmlStyleSheetString = value;
    }

    /**
	 * The standard blue link styling — four states, exactly the colours AS3 sets.
	 *
	 * AS3 builds a `flash.text.StyleSheet` and assigns it to the field the text engine reads. This
	 * port has no `StyleSheet` type, and `htmlStyleSheetString` is the field that stands in for it,
	 * so the same four rules are written there as CSS text — and `linkColor` below reads `a:link`
	 * back out of them, which is what makes calling this change a pixel.
	 *
	 * Only `a:link` is applied. The other three are states this port cannot be in: nothing tracks
	 * a visited link, and hover/active would need per-run mouse tracking the layout does not do.
	 * They are stored so the rule set stays whole rather than edited down to what is used.
	 *
	 * Note `.visited` is a plain class rather than the `a:visited` pseudo-class its three siblings
	 * use, and carries an underline but no colour. That asymmetry is AS3's, transcribed as found.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/HTMLTextController.as::initializeLinkStyle()
    public initializeLinkStyle(): void
    {
        this.styleSheet = [
            'a:link { text-decoration: underline; color: #006de0; }',
            'a:hover { color: #0051a4; }',
            'a:active { color: #0053ad; }',
            '.visited { text-decoration: underline; }',
        ].join(' ');
    }

    /**
	 * The colour anchors are painted in: `a:link`'s from the stylesheet, or Habbo's blue.
	 *
	 * TS-only: Flash resolves this inside the text engine from the assigned StyleSheet, so no AS3
	 * member corresponds. Parsed rather than stored because `htmlStyleSheetString` also arrives
	 * from a layout's `html_stylesheet` property, not only from `initializeLinkStyle()`.
	 */
    private get linkColor(): number
    {
        // `styleSheet` is what code assigns (initializeLinkStyle(), TextWindowUtils); the
        // `html_stylesheet` layout property lands in `_htmlStyleSheetString` instead. Code wins,
        // matching AS3, where a later `styleSheet =` replaces whatever the layout set.
        const sheet = this._styleSheet ?? this._htmlStyleSheetString;

        if(sheet === null) return HTMLTextController.DEFAULT_LINK_COLOR;

        const match = /a:link[^}]*color\s*:\s*#([0-9a-f]{6})/i.exec(sheet);

        return match === null ? HTMLTextController.DEFAULT_LINK_COLOR : parseInt(match[1], 16);
    }

    /**
	 * Sets text content as HTML with link conversion.
	 */
    public override get text(): string
    {
        return super.text;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/HTMLTextController.as::set text()
    public override set text(value: string)
    {
        if(value == null) return;

        if(this._localized)
        {
            this.removeLocalizationListenerForCaption();
            this._localized = false;
        }

        this._caption = value;

        if(!this._displayRaw && this.isLocalizationKey(this._caption))
        {
            this._localized = true;
            this.registerLocalizationListenerForCaption();

            return;
        }

        this._htmlContent = value;

        this.applyHtml(value);
    }

    /**
	 * The raw markup, assigned from code rather than from a layout caption.
	 *
	 * AS3 needs no override here: `TextController.setHtmlText()` ends in `_field.htmlText = ...`
	 * and Flash's TextField parses the markup itself, anchors included. This port has no such
	 * field — `parseHtml()` is what turns `<a href>` into link ranges — so the inherited setter,
	 * which stores its argument straight into `_text`, put the markup on screen verbatim and left
	 * `_linkRuns` empty, i.e. the text unclickable too.
	 *
	 * That is exactly what the group-forum shortcut row showed: `updateUnreadForumsCount()`
	 * assigns `groupforum.view.shortcuts.my` this way and it read
	 * `<a href="event:groupforum/list/my">My Forums</a>` in full, while `active` and `popular` —
	 * same window type, but filled from their layout caption — were fine.
	 *
	 * The getter is redeclared with the setter on purpose: overriding one accessor of a pair in
	 * TypeScript shadows the other, and `htmlText` would read back undefined.
	 */
    // TS-only: AS3 delegates this to flash.text.TextField, which has no counterpart here.
    public override get htmlText(): string
    {
        return super.htmlText;
    }

    public override set htmlText(value: string)
    {
        if(value == null) return;

        if(this._localized)
        {
            this.removeLocalizationListenerForCaption();
            this._localized = false;
        }

        this._caption = value;

        if(!this._displayRaw && this.isLocalizationKey(this._caption))
        {
            this._localized = true;
            this.registerLocalizationListenerForCaption();

            return;
        }

        this._htmlContent = value;

        this.applyHtml(value);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/HTMLTextController.as::set localization()
    public override set localization(value: string)
    {
        if(value == null) return;

        this._htmlContent = value;

        this.applyHtml(this.limitStringLength(value));
    }

    /**
	 * Reduces markup to the plain string the layout engine can lay out, and paints the anchors.
	 *
	 * The order matters: `setTextFormat()` records ranges over `_text`, and assigning `_text`
	 * clears them (Flash resets character formatting on content replacement, and this port copies
	 * that), so the runs have to be applied *after* the assignment.
	 */
    // TS-only: Flash assigns `_field.htmlText` and the text engine does all of this.
    private applyHtml(html: string): void
    {
        const parsed = HTMLTextController.parseHtml(HTMLTextController.convertLinksToEvents(html));

        this._linkRuns = parsed.links;
        this._text = parsed.text;
        this._htmlText = parsed.text;

        const color = this.linkColor;

        for(const run of parsed.links)
        {
            this.setTextFormat({color, underline: true}, run.start, run.end);
        }

        this.refreshTextImage();
    }

    public override get properties(): unknown[]
    {
        const props = InteractiveController.writeInteractiveWindowProperties(this, super.properties);

        props.push(this.createProperty('editable', this.editable));
        props.push(this.createProperty('selectable', this.selectable));
        props.push(this.createProperty('display_as_password', this.displayAsPassword));
        props.push(this.createProperty('link_target', this._linkTarget));

        return props;
    }

    public override set properties(value: unknown[])
    {
        for(const item of value)
        {
            const prop = item as PropertyStruct;

            switch(prop.key)
            {
                case 'link_target':
                    this._linkTarget = prop.value as string;
                    break;
                case 'html_stylesheet':
                    this.htmlStyleSheetString = prop.value as string;
                    break;
            }
        }

        super.properties = value;
    }

    /**
	 * Converts link URLs to event: protocol for internal handling.
	 *
	 * In AS3, this replaced `<a href="http://...">` with `<a href="event:http://...">`.
	 */
    // DEVIATION: AS3's two regexes capture the link text with a GREEDY `(.*)`, so a string with
    //   two links matches from the first `<a` to the LAST `</a>` and both are swallowed into one
    //   mangled anchor. This port uses `(.*?)`. It is a fix, not a transcription, and it is here
    //   because Flash hid it: the catalog and help texts that reach this method carry one link
    //   each, so the bug never had two to eat.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/HTMLTextController.as::convertLinksToEvents()
    private static convertLinksToEvents(html: string): string
    {
        html = html.replace(/<a[^>]+(http:\/\/[^"']+)['"][^>]*>(.*?)<\/a>/gi, "<a href='event:$1'>$2</a>");
        html = html.replace(/<a[^>]+(https:\/\/[^"']+)['"][^>]*>(.*?)<\/a>/gi, "<a href='event:$1'>$2</a>");

        return html;
    }

    // TS-only: in AS3, `_field.htmlText = ...` hands the markup to Flash's
    // native TextField, which renders <br>/<b>/<a> as real rich text. Our
    // TextController only lays out plain strings (splitting on literal "\n" —
    // see TextController.ts::buildMeasureLines()), so HTML has to be reduced
    // to that before it reaches _text, or tags show up as literal characters.
    //
    // The anchors are the one tag whose position has to survive that reduction: their character
    // ranges over the stripped string are what `applyHtml()` colours and `update()` hit-tests.
    private static parseHtml(html: string): {text: string; links: Array<{start: number; end: number; href: string}>}
    {
        const links: Array<{start: number; end: number; href: string}> = [];
        const tag = /<(\/?)([a-z]+)([^>]*)>/gi;

        let text = '';
        let cursor = 0;
        let openHref: string | null = null;
        let openStart = 0;
        let match: RegExpExecArray | null;

        while((match = tag.exec(html)) !== null)
        {
            text += html.substring(cursor, match.index);
            cursor = match.index + match[0].length;

            const closing = match[1] === '/';
            const name = match[2].toLowerCase();

            if(name === 'br')
            {
                text += '\n';
                continue;
            }

            if(name !== 'a') continue;

            if(!closing)
            {
                const href = /href\s*=\s*["']([^"']*)["']/i.exec(match[3]);
                const raw = href === null ? '' : href[1];

                // Stored without the scheme, because that is what AS3 receives: Flash hands
                // `TextEvent.text` whatever FOLLOWS `event:`, and every consumer downstream was
                // written against that. `GroupForumController.linkPattern` is `groupforum/`, so an
                // href kept as `event:groupforum/list/my` matched no tracker and the click died
                // silently. `HabboNotifications` strips the same six characters off its own
                // `linkUrl` for the same reason.
                //
                // It is also what makes convertLinksToEvents() coherent: it rewrites `http://x`
                // into `event:http://x` precisely so the scheme comes back off here as `http://x`.
                openHref = raw.startsWith('event:') ? raw.substring(6) : raw;
                openStart = text.length;
            }
            else if(openHref !== null)
            {
                // A zero-length anchor is dropped: it would colour nothing and can never be hit.
                if(text.length > openStart) links.push({start: openStart, end: text.length, href: openHref});

                openHref = null;
            }
        }

        text += html.substring(cursor);

        return {text, links};
    }

    /**
	 * Empty, exactly as AS3 wrote it — an HTMLTextController never releases.
	 *
	 * Both trees agree the override has no body (WIN63 l.314, win63_version
	 * l.312), so it deliberately swallows TextController.dispose(): no
	 * localization listener removed, no margins disposed, no
	 * WindowController.dispose() and therefore no detach from the parent and no
	 * graphic-context release. Kept faithful rather than "fixed" — if HTML text
	 * windows ever show up as ghosts or as leaked buffers, this is the line, and
	 * the client shipped it this way.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/HTMLTextController.as::dispose()
    public override dispose(): void
    {
    }

    /**
     * Turns a click that landed on an `<a>` run into a link event.
     *
     * AS3 gets here from Flash's own `TextEvent`, which already knows which anchor was hit; this
     * port has to find it, which is what `_linkRuns` plus `getCharIndexAtPoint()` are for.
     *
     * The three consumers AS3 feeds are all kept: any listener on the window, every
     * `linkEventTracker` whose `linkPattern` prefixes the href (a tracker with an empty pattern
     * takes everything), and the window's own `procedure` — the last two both gated on nothing
     * having called `preventWindowOperation()` first. Opening an external web page is the one
     * thing left out: AS3's `openWebPage()` has no port.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/HTMLTextController.as::immediateClickHandler()
    public override update(source: WindowController, event: WindowEvent): boolean
    {
        const result = super.update(source, event);

        if(event.type !== WindowMouseEvent.CLICK || source !== (this as unknown as WindowController)) return result;

        const mouse = event as WindowMouseEvent;
        const href = this.linkAtPoint(mouse.localX, mouse.localY);

        if(href === null) return result;

        const linkEvent = WindowLinkEvent.allocateLink(href, this, null);

        this._eventDispatcher?.dispatchEvent(linkEvent);

        for(const tracker of this._context.linkEventTrackers)
        {
            if(tracker.linkPattern.length === 0 || href.substring(0, tracker.linkPattern.length) === tracker.linkPattern)
            {
                tracker.linkReceived(href);
            }
        }

        if(!linkEvent.isWindowOperationPrevented())
        {
            this.procedure?.(linkEvent, this);
        }

        linkEvent.recycle();

        return result;
    }

    /**
     * The href of the anchor under a point in this window's own coordinates, or null.
     *
     * `getCharIndexAtPoint()` answers -1 past the end of a line, so a click in the empty space
     * after the last word of a line correctly hits nothing.
     */
    // TS-only: Flash's TextField reports the anchor itself; see update()'s note.
    private linkAtPoint(localX: number, localY: number): string | null
    {
        if(this._linkRuns.length === 0) return null;

        const index = this.getCharIndexAtPoint(localX, localY);

        if(index < 0) return null;

        for(const run of this._linkRuns)
        {
            if(index >= run.start && index < run.end) return run.href;
        }

        return null;
    }
}
