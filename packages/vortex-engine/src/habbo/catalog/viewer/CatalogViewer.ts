import {Logger} from '@core/utils/Logger';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {HabboCatalog} from '../HabboCatalog';
import type {IHabboCatalog} from '../IHabboCatalog';
import type {IPurchasableOffer} from '../IPurchasableOffer';
import type {ICatalogPage} from './ICatalogPage';
import type {ICatalogViewer} from './ICatalogViewer';
import type {IPageLocalization} from './IPageLocalization';
import {CatalogPage} from './CatalogPage';
import {PageLocalization} from './PageLocalization';

const log = Logger.getLogger('habbo.catalog.viewer.CatalogViewer');

/**
 * Owns the currently-shown catalog page window and its container.
 *
 * @see sources/win63_version/habbo/catalog/viewer/CatalogViewer.as
 */
export class CatalogViewer implements ICatalogViewer
{
    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::_catalog
    private _catalog: HabboCatalog | null;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::_container
    private _container: IWindowContainer | null;

    private _currentPage: ICatalogPage | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::_forceRefresh
    private _forceRefresh: boolean = false;

    private _previousPageId: number = 0;

    private _catalogType: string | null = null;

    constructor(catalog: HabboCatalog, container: IWindowContainer, catalogType: string)
    {
        this._catalog = catalog;
        this._container = container;
        this._catalogType = catalogType;
    }

    /**
	 * The catalog type this viewer belongs to.
	 *
	 * Read by CatalogPage to pick the widgets it builds, and by
	 * LocalizationCatalogWidget to find the right navigator.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::get catalogType()
    get catalogType(): string | null
    {
        return this._catalogType;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::get roomEngine()
    get roomEngine(): IRoomEngine
    {
        return this._catalog!.roomEngine!;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::get mainContainer()
    // The catalog page window's parent — the same value showCatalogPage() computes inline via
    // `this._container!.parent!.width` when it sizes/positions the page window.
    get mainContainer(): IWindowContainer | null
    {
        return this._container === null ? null : (this._container.parent as IWindowContainer | null);
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::dispose()
    dispose(): void
    {
        if(this._currentPage)
        {
            this._currentPage.dispose();
            this._currentPage = null;
        }

        this._catalog = null;
        this._container = null;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::get catalog()
    get catalog(): IHabboCatalog
    {
        return this._catalog!;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::showCatalogPage()
    showCatalogPage(
        pageId: number,
        layoutCode: string,
        localization: IPageLocalization,
        offers: IPurchasableOffer[],
        offerId: number,
        acceptSeasonCurrencyAsCredits: boolean
    ): void
    {
        log.debug(`Show Catalog Page: ${[pageId, layoutCode, offers.length, offerId]}`);

        if(this._currentPage != null)
        {
            if(!this._forceRefresh && this._currentPage.pageId === pageId)
            {
                if(offerId > -1)
                {
                    this._currentPage.selectOffer(offerId);
                }

                return;
            }

            this.disposeCurrentPage();
        }

        const page = new CatalogPage(this, pageId, layoutCode, localization, offers, this._catalog!, acceptSeasonCurrencyAsCredits);

        this._currentPage = page;
        this._previousPageId = pageId > -12345678 ? pageId : this._previousPageId;

        if(page.window != null)
        {
            this._container!.addChild(page.window);
            page.window.height = this._container!.height;
            this._container!.width = page.window.width;
            this._container!.x = this._container!.parent!.width - this._container!.width - 8;

            this._catalog!.setLeftPaneVisibility(this._container!.x >= 130);
        }
        else
        {
            log.warn(`No window for page: ${layoutCode}`);
        }

        this._container!.visible = true;
        this._forceRefresh = false;
        page.selectOffer(offerId);
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::disposeCurrentPage()
    disposeCurrentPage(): void
    {
        if(this._currentPage != null)
        {
            this._container!.removeChild(this._currentPage.window);
            this._currentPage.dispose();
            this._container!.invalidate();
        }
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::catalogWindowClosed()
    catalogWindowClosed(): void
    {
        if(this._currentPage != null)
        {
            this._currentPage.closed();
        }
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::dispatchWidgetEvent()
    dispatchWidgetEvent(event: unknown): boolean
    {
        return this._currentPage!.dispatchWidgetEvent(event);
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::getCurrentLayoutCode()
    getCurrentLayoutCode(): string
    {
        if(this._currentPage == null) return '';

        return this._currentPage.layoutCode;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::get currentPage()
    get currentPage(): ICatalogPage | null
    {
        return this._currentPage;
    }

    /**
     * Replaces whatever the viewer is showing with a synthetic page of search results.
     *
     * The page has id -1 and is built by hand rather than fetched: there is no such page on the
     * server. Its layout is the plain `default_3x3` grid and its header text is
     * `${catalog.search.results}`, whose `count` and `needle` parameters `HabboCatalog` registers
     * just before calling this.
     */
    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::showSearchResults()
    showSearchResults(results: IPurchasableOffer[]): void
    {
        // AS3 dereferences `_catalog` unguarded; the viewer cannot exist without one.
        if(this._catalog === null) return;

        if(this._currentPage !== null)
        {
            if(this._currentPage.window !== null) this._container?.removeChild(this._currentPage.window);

            this._currentPage.dispose();
        }

        const page = new CatalogPage(
            this,
            -1,
            'default_3x3',
            new PageLocalization(
                ['catalog_header_roombuilder', 'credits_v3_teaser'],
                ['${catalog.search.results}']
            ),
            results,
            this._catalog,
            false,
            1
        );

        this._currentPage = page;

        if(page.window !== null)
        {
            this._container?.addChild(page.window);

            if(this._container !== null)
            {
                page.window.width = this._container.width;
                page.window.height = this._container.height;
            }
        }
        else
        {
            log.warn('[CatalogViewer] No window for page: <SEARCH>');
        }

        if(this._container !== null) this._container.visible = true;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::get viewerTags()
    get viewerTags(): string[]
    {
        return this._container ? this._container.tags : [];
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::setForceRefresh()
    setForceRefresh(): void
    {
        this._forceRefresh = true;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogViewer.as::get previousPageId()
    get previousPageId(): number
    {
        return this._previousPageId;
    }
}
