// Typed against the concrete manager rather than `IHabboWindowManager`, as AS3 is
// (`HabboWindowManagerComponent`): the viewer needs `context`, `assets` and `getProperty()`, and
// the interface declares none of the three. Type-only, so the import cycle is erased at build.
import type {HabboWindowManager} from '../../HabboWindowManager';
import type {IWindow} from '@core/window/IWindow';
import type {IFrameWindow} from '@core/window/components/IFrameWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IScrollbarWindow} from '@core/window/components/IScrollbarWindow';
import type {ILinkEventTracker} from '@core/runtime/events/ILinkEventTracker';
import type {AssetLoaderStruct} from '@ambreia/common/assets/AssetLoaderStruct';
import {AssetLoaderEvent} from '@ambreia/common/assets/loaders/AssetLoaderEvent';
import {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {HabboWebTools} from '@habbo/utils/HabboWebTools';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.window.utils.habbopedia.HabboPagesViewer');

/**
 * The in-client help pages — "habbopedia".
 *
 * A link-event tracker on `habbopages/`: `createLinkEvent('habbopages/camera')` anywhere in the
 * client lands in {@link linkReceived}, which downloads the page from `habbopages.url` and shows it
 * in an HTML text window. The camera's help button, the toolbar's help entry and
 * `HabboWindowManager.openHelpPage()` all reach it that way.
 *
 * The downloaded file's **first line is the window caption** and the rest is the body — AS3 splits
 * on any newline, shifts the first element off and rejoins the remainder with no separator, which
 * is why the body's own line breaks have to be `<br>` tags rather than newlines.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/habbopedia/HabboPagesViewer.as
 */
export class HabboPagesViewer implements ILinkEventTracker
{
    /**
	 * The two layouts, by the names the asset build ships them under.
	 *
	 * They are `[Embed]`ed on this class as `Class` fields and instantiated as a `ByteArray` rather
	 * than fetched from the library, so they have no `getAssetByName()` name in AS3 at all; the
	 * build tool names them by their embed linkage, the same way it does the floor-plan editor's
	 * (see `DIRECT_EMBED_SOURCES` in `tools/build-window-assets.mjs`).
	 */
    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::habbopedia_window_layout
    private static readonly WINDOW_LAYOUT: string = 'habbopedia_xml';

    /**
	 * Declared and never built, in AS3 too — `habbopedia_edit_layout` has no reader anywhere in the
	 * primary tree. Public rather than private so it is not an unused member: it is the name the
	 * asset build ships the second embed under, and that is worth recording where the first one is.
	 */
    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::habbopedia_edit_layout
    public static readonly EDIT_LAYOUT: string = 'habbopedia_edit_xml';

    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::_windowManager
    private _windowManager: HabboWindowManager | null;

    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::_window
    private _window: IFrameWindow | null = null;

    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::HabboPagesViewer()
    constructor(windowManager: HabboWindowManager)
    {
        this._windowManager = windowManager;
        this._windowManager.context?.addLinkEventTracker(this);
    }

    /**
	 * Builds the window on first show and keeps it.
	 *
	 * DEVIATION: AS3 also parses `habbopedia_css` into a `flash.text.StyleSheet` and assigns it to
	 *   the content field, twice — here and again in `parseAndSetHtml()`. There is no
	 *   `StyleSheet.parseCSS()` to port to: `HTMLTextController` carries its own rule list and
	 *   resolves styles itself, and the CSS embed is a `ByteArray` the asset build does not ship
	 *   (it ships XML layouts and PNG skins, not stylesheets). The pages render with the
	 *   controller's own link/paragraph styling instead of habbopedia's.
	 */
    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::styleSheet
    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::set visible()
    private set visible(value: boolean)
    {
        if(this._window === null || this._window.disposed)
        {
            this._window = this.createWindow(HabboPagesViewer.WINDOW_LAYOUT);

            if(this._window === null) return;

            const content = this._window.findChildByName('content') as ITextWindow | null;

            content?.addEventListener(WindowEvent.WE_CHANGE, this.onChanged);
        }

        this._window.visible = value;
    }

    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::get visible()
    private get visible(): boolean
    {
        return this._window !== null && this._window.visible;
    }

    /**
	 * A new page starts at the top: the scrollbar keeps the previous page's offset otherwise.
	 */
    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::onChanged()
    private onChanged = (_event: WindowEvent): void =>
    {
        const scroller = this._window?.findChildByName('scroller') as IScrollbarWindow | null;

        if(scroller) scroller.scrollV = 0;
    };

    /**
	 * DEVIATION: AS3 takes the layout's embed `Class`, instantiates it as a `ByteArray` and parses
	 *   the XML out of it. The layouts ship as files here, so the name is what identifies them and
	 *   `buildWidgetLayout()` is the same operation with the embed step removed.
	 */
    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::createWindow()
    private createWindow(layout: string): IFrameWindow | null
    {
        const window = this._windowManager?.buildWidgetLayout(layout, 1) as IFrameWindow | null ?? null;

        if(window === null)
        {
            log.warn(`${layout} is not in the layout registry`);

            return null;
        }

        window.procedure = this.windowProcedure;

        return window;
    }

    /**
	 * Both close paths do the same thing; AS3 spells them separately and only the first falls
	 * through `set visible`, which is why this keeps the two cases rather than merging them.
	 */
    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::windowProcedure()
    private windowProcedure = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== WindowMouseEvent.CLICK) return;

        switch(window.name)
        {
            case 'header_button_close':
                this.visible = false;
                break;

            case 'close':
                if(this._window) this._window.visible = false;
                break;
        }
    };

    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::parseAndSetHtml()
    private parseAndSetHtml(html: string, caption: string): void
    {
        if(this._window === null) return;

        this._window.caption = caption;

        const content = this._window.findChildByName('content') as ITextWindow | null;

        if(content) content.htmlText = html;
    }

    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::get linkPattern()
    get linkPattern(): string
    {
        return 'habbopages/';
    }

    /**
	 * `habbopages/<page>` — everything after the first segment is the page, slashes included, so
	 * `habbopages/help/camera` opens `help/camera`.
	 */
    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::linkReceived()
    linkReceived(link: string): void
    {
        const parts = link.split('/');

        if(parts.length < 2) return;

        parts.shift();

        this.openPage(parts.join('/'));
    }

    /**
	 * Downloads a page and shows it.
	 *
	 * The cached asset is dropped first when there is one: AS3 wants the current text every time
	 * the page is opened, not the copy from the last visit.
	 */
    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::openPage()
    openPage(page: string): void
    {
        const windowManager = this._windowManager;

        if(windowManager === null) return;

        const assets = windowManager.assets;

        if(!assets) return;

        const base = windowManager.getProperty('habbopages.url');
        const url = base + page;

        if(assets.hasAsset(url))
        {
            log.debug(`reload page: ${url}`);

            const cached = assets.getAssetByName(url);

            if(cached) assets.removeAsset(cached);
        }

        const request = assets.loadAssetFromFile(url, url, 'text/plain');

        request.addEventListener(AssetLoaderEvent.COMPLETE, this.onDownloadComplete);
        request.addEventListener(AssetLoaderEvent.ERROR, this.onDownloadError);
    }

    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::onDownloadError()
    private onDownloadError = (...args: unknown[]): void =>
    {
        const status = (args[0] as {status?: number} | null)?.status ?? 0;

        HabboWebTools.logEventLog(`habbopages download error ${status}`);
    };

    /**
	 * First line is the caption, the rest is the body.
	 *
	 * The remainder is rejoined with the empty string, not with a newline — AS3's
	 * `_loc6_.join("")` — so a page's own layout has to come from its markup.
	 */
    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::onDownloadComplete()
    private onDownloadComplete = (...args: unknown[]): void =>
    {
        const struct = (args[0] as {target?: AssetLoaderStruct} | null)?.target ?? null;
        const content = struct?.assetLoader?.content ?? null;

        if(typeof content !== 'string') return;

        const lines = content.split(/\n\r|\n|\r/gm);
        const caption = lines.shift() ?? '';

        this.visible = true;
        this.parseAndSetHtml(lines.join(''), caption);
        this._window?.activate();
    };

    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::get disposed()
    get disposed(): boolean
    {
        return this._windowManager === null;
    }

    // AS3: .../habbo/window/utils/habbopedia/HabboPagesViewer.as::dispose()
    dispose(): void
    {
        if(this.disposed) return;

        this._windowManager?.context?.removeLinkEventTracker(this);
        this._windowManager = null;
    }
}
