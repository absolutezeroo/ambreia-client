import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {CatalogViewer} from './viewer/CatalogViewer';
import type {ICatalogNavigator} from './navigation/ICatalogNavigator';
import {RequestedPage} from './navigation/RequestedPage';

/**
 * Everything the catalog owns once per catalog type.
 *
 * `HabboCatalog` keeps one of these per type (only "NORMAL" in the RPG fork) and
 * re-points its own flat `_mainWindow`/`_catalogViewer` fields at the active
 * one — AS3 holds the same flat fields and does the same re-pointing in
 * `setActiveCatalogState()`, so the flat fields are not a shortcut, the missing
 * per-type storage behind them was.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/CatalogWindowState.as
 */
export class CatalogWindowState
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/CatalogWindowState.as::catalogType
    public catalogType: string | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/CatalogWindowState.as::mainContainer
    public mainContainer: IWindowContainer | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/CatalogWindowState.as::catalogViewer
    public catalogViewer: CatalogViewer | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/CatalogWindowState.as::catalogNavigator
    public catalogNavigator: ICatalogNavigator | null = null;

    /**
	 * The page the user asked for before the navigator was ready.
	 *
	 * Name derived, not recovered: this field is obfuscated in every available
	 * tree, and CatalogWindowState postdates the 2016 build that carries real
	 * names. It is typed `RequestedPage` and read as `.requestByName` /
	 * `.requestById` / `.requestType`, and the flat field it replaces here was
	 * already called `_requestedPage`.
	 */
    public requestedPage: RequestedPage | null = new RequestedPage();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/CatalogWindowState.as::lastPageRequestId
    public lastPageRequestId: number = -1;

    constructor(catalogType: string)
    {
        this.catalogType = catalogType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/CatalogWindowState.as::dispose()
    public dispose(): void
    {
        if(this.catalogViewer != null)
        {
            this.catalogViewer.dispose();
            this.catalogViewer = null;
        }

        if(this.catalogNavigator != null)
        {
            this.catalogNavigator.dispose();
            this.catalogNavigator = null;
        }

        if(this.mainContainer != null)
        {
            this.mainContainer.dispose();
            this.mainContainer = null;
        }

        this.requestedPage = null;
        this.catalogType = null;
        this.lastPageRequestId = -1;
    }
}
