import {EventEmitter} from 'eventemitter3';
import {Logger} from '@ambreia/common/utils/Logger';
import {AssetLibrary} from '@ambreia/common/assets/AssetLibrary';
import {AssetLoaderEventType} from '@ambreia/common/assets/loaders/AssetLoaderEvent';
import {Core} from '@ambreia/kernel/Core';
import {ProductData} from './ProductData';

import type {AssetLoaderEvent} from '@ambreia/common/assets/loaders/AssetLoaderEvent';
import type {IProductData} from './IProductData';

const log = Logger.getLogger('habbo.session.product.ProductDataParser');

/**
 * Events emitted by ProductDataParser
 */
/**
 * The event name the parser raises once product data is in.
 *
 * Unread in AS3 — every dispatch and listener spells the literal out — but a real public constant
 * of the class, and the same string. See `FURNITURE_DATA_PARSER_READY` for the twin.
 */
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/product/ProductDataParser.as::READY
export const PRODUCT_DATA_PARSER_READY = 'PDP_product_data_ready';

export interface IProductDataParserEvents
{
    PDP_product_data_ready: [];
    PDP_product_data_error: [error: Error];
}

/**
 * Parses product data from JSON (modern Habbo format).
 *
 * Receives products dictionary by reference and fills it during parsing.
 * Emits `PDP_product_data_ready` when parsing is complete.
 *
 * @see source_as_win63/habbo/session/product/ProductDataParser.as
 */
export class ProductDataParser
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/product/ProductDataParser.as::_products
    private _products: Map<string, IProductData>;
    private _disposed: boolean = false;
    /**
     * The library the download runs through — disposing it is how AS3 (and now this) stops a
     * request when SessionDataManager.initProductData() replaces the parser. The port used to
     * `await fetch(url)` with nothing owning it, so a replaced parser still finished and refilled
     * the map a newer one already owned. See FurnitureDataParser, where the same gap crashed.
     */
    // Name recovered, not derived: the primary tree obfuscates this field to
    //   `private var _SafeStr_6050:AssetLibrary` (l.24), and PRODUCTION's own ProductDataParser
    //   declares it `private var _assetLib:AssetLibrary` (l.18).
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/product/ProductDataParser.as::_assetLib
    private _assetLib: AssetLibrary | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/product/ProductDataParser.as::MAX_DOWNLOAD_RETRIES
    private static readonly MAX_DOWNLOAD_RETRIES: number = 2;
    // Name derived, and PRODUCTION cannot recover it: the field is `private var _SafeStr_8577:String`
    //   (l.26) in the primary tree, and the 2016 build has no retry path at all — its constructor
    //   passes the url straight to loadAssetFromFile() and stores nothing. Named here from the only
    //   thing this field does: hold that url for retryLoadIfPossible().
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/product/ProductDataParser.as::_url
    private _url: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/product/ProductDataParser.as::_downloadRetriesLeft
    private _downloadRetriesLeft: number;

    constructor(url: string, products: Map<string, IProductData>)
    {
        this._products = products;
        this._assetLib = new AssetLibrary('ProductDataParserAssetLib');
        this._url = url;
        this._downloadRetriesLeft = ProductDataParser.MAX_DOWNLOAD_RETRIES;

        this.requestData(url);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/product/ProductDataParser.as::appendRetryParam()
    private static appendRetryParam(url: string, retry: number): string
    {
        if(url.indexOf('?') > 0)
        {
            return url + '&retry=' + retry;
        }

        return url + '?retry=' + retry;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/product/ProductDataParser.as::retryLoadIfPossible()
    private retryLoadIfPossible(): boolean
    {
        if(this._downloadRetriesLeft <= 0)
        {
            return false;
        }

        const url = ProductDataParser.appendRetryParam(this._url, this._downloadRetriesLeft);

        this._downloadRetriesLeft--;
        this.requestData(url);

        return true;
    }

    /**
     * AS3 also calls `HabboWebTools.logEventLog("productdata malformed data " + status)`, which
     * reports to Habbo's telemetry and has no counterpart here. Note its `true`: product data is
     * unconditionally critical, where furnidata's criticality is a constructor flag.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/product/ProductDataParser.as::onMalformedData()
    private onMalformedData(status: number): void
    {
        if(this.retryLoadIfPossible())
        {
            return;
        }

        Core.error('XML Product data was malformed', true, 7);
        this._events.emit('PDP_product_data_error', new Error(`XML Product data was malformed (status ${status})`));
    }

    private _events: EventEmitter<IProductDataParserEvents> = new EventEmitter();

    get events(): EventEmitter<IProductDataParserEvents>
    {
        return this._events;
    }

    /**
	 * Dispose the parser
	 */
    // AS3: .../src/com/sulake/habbo/session/product/ProductDataParser.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        // AS3: `if(_SafeStr_6050){ _SafeStr_6050.dispose(); _SafeStr_6050 = null; }` — the request
        // goes with the library.
        if(this._assetLib !== null)
        {
            this._assetLib.dispose();
            this._assetLib = null;
        }

        this._events.removeAllListeners();
    }

    /**
	 * Load and parse product data from URL
	 * @see source_as_win63/habbo/session/product/ProductDataParser.as constructor
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/product/ProductDataParser.as::requestData()
    private requestData(url: string): void
    {
        if(this._assetLib === null) return;

        // `hasAsset()` first: getAssetByName() warns on a miss, and a miss is the expected answer
        // until a retry re-requests under the same name.
        if(this._assetLib.hasAsset('productdata'))
        {
            const existing = this._assetLib.getAssetByName('productdata');

            if(existing !== null)
            {
                const removed = this._assetLib.removeAsset(existing);

                if(removed !== null) removed.dispose();
            }
        }

        const loader = this._assetLib.loadAssetFromFile('productdata', url, 'text/plain');

        // One handler for AS3's two listeners; this port's struct emits every type under `event`.
        const onEvent = (event: AssetLoaderEvent): void =>
        {
            if(event.type !== AssetLoaderEventType.COMPLETE && event.type !== AssetLoaderEventType.ERROR) return;

            // AS3: removeLoaderListeners(), first line of both handlers.
            loader.events.off('event', onEvent);

            if(this._disposed) return;

            if(event.type === AssetLoaderEventType.ERROR)
            {
                this.onMalformedData(event.status);
                return;
            }

            const content = this._assetLib?.getAssetByName('productdata')?.content ?? null;
            const body = typeof content === 'string' ? content : null;

            if(body === null)
            {
                this.onMalformedData(event.status);
                return;
            }

            this.parseBody(url, body);
        };

        loader.events.on('event', onEvent);
    }

    /**
     * The body of AS3's parseProductsData() after it has pulled the text off the loader — split out
     * because the port reads that text from the library instead of from an AssetLoaderStruct.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/product/ProductDataParser.as::parseProductsData()
    private parseBody(url: string, body: string): void
    {
        try
        {
            // AS3 reads the body as text and dispatches on its first non-space
            // character — the format is never assumed from the URL or a header.
            // Calling response.json() outright meant Habbo's own productdata.txt
            // parsed as zero products.
            const trimmed = body.replace(/^\s+/, '');

            if(trimmed.length === 0)
            {
                this.onMalformedData(0);
                return;
            }

            if(trimmed.charAt(0) === '<')
            {
                this.parseXmlFormat(trimmed);
            }
            else if(trimmed.charAt(0) === '{')
            {
                // Port-specific: AS3 has no JSON branch, but this client has shipped
                // JSON productdata, so both have to keep working.
                //
                // '{' only, never '['. The Lingo format is `[["code","name",""],...]`,
                // which is itself valid JSON — so treating '[' as JSON parses it
                // successfully, finds no `productdata.product` in an array, and reports
                // zero products having understood nothing. AS3 tests for '<' and sends
                // everything else to Lingo; the narrower this branch, the better.
                this.parseJsonFormat(JSON.parse(body) as Record<string, unknown>);
            }
            else
            {
                this.parseLingoFormat(body);
            }

            // "Parsed 0 products" on its own is unactionable: it cannot distinguish a
            // format nobody handles from a URL serving something else entirely. Say
            // what actually arrived when nothing came of it.
            if(this._products.size === 0)
            {
                log.error(`Parsed 0 products from ${url} — ${body.length} bytes, `
                    + `starts with: ${JSON.stringify(trimmed.slice(0, 120))}`);
            }
            else
            {
                log.info(`Parsed ${this._products.size} products`);
            }

            this._events.emit('PDP_product_data_ready');
        }
        catch (error)
        {
            // A body that arrived but would not parse is AS3's malformed case: retry twice, then
            // Core.error. Throwing out of the loader callback would reach nothing.
            log.warn(`Failed to parse product data: ${error instanceof Error ? error.message : String(error)}`);
            this.onMalformedData(0);
        }
    }

    /**
	 * Parses the XML productdata format — `<product code="..."><name>...</name>`.
	 *
	 * AS3 reads the code off the attribute and the name off the child element; the
	 * two are not interchangeable.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/product/ProductDataParser.as::parseXmlFormat()
    private parseXmlFormat(data: string): void
    {
        const document = new DOMParser().parseFromString(data, 'text/xml');

        if(document.getElementsByTagName('parsererror').length > 0)
        {
            throw new Error('XML product data was malformed');
        }

        for(const item of Array.from(document.getElementsByTagName('product')))
        {
            const code = item.getAttribute('code') ?? '';
            const name = item.getElementsByTagName('name').item(0)?.textContent ?? '';

            this._products.set(code, new ProductData(code, name));
        }
    }

    /**
	 * Parses the classic Lingo productdata — Habbo's own `productdata.txt`.
	 *
	 * The format is bracket groups, any number per line:
	 * `[["code","name"],["code2","name2"]]`. AS3 strips every quote first, then
	 * takes each `[...]` group, splits on commas and shifts the first two fields —
	 * code, then name. Anything after them is ignored, which is why shift() is used
	 * rather than indexing.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/product/ProductDataParser.as::parseLingoFormat()
    private parseLingoFormat(data: string): void
    {
        const lines = data.replace(/"{1,}/gm, '').split(/\n\r{1,}|\n{1,}|\r{1,}/gm);

        for(const line of lines)
        {
            const groups = line.match(/\[+?((.)*?)\]/g);

            if(!groups) continue;

            for(const group of groups)
            {
                const fields = group.replace(/\[{1,}/gm, '').replace(/\]{1,}/gm, '').split(',');
                const code = fields.shift();
                const name = fields.shift();

                if(code === undefined || name === undefined) continue;

                this._products.set(code, new ProductData(code, name));
            }
        }
    }

    /**
	 * Parses the JSON productdata this client has shipped.
	 *
	 * Port-specific: AS3 has no JSON branch. Kept alongside the two real formats so
	 * both keep working.
	 */
    private parseJsonFormat(data: Record<string, unknown>): void
    {
        const productdata = (data.productdata ?? null) as Record<string, unknown> | null;

        if(!productdata?.product) return;

        const products = productdata.product as unknown[];

        for(const item of products)
        {
            const raw = item as Record<string, unknown>;
            if(!raw) continue;

            const code = String(raw.code || '');
            const name = String(raw.name || '');
            const description = String(raw.description || '');

            this._products.set(code, new ProductData(code, name, description));
        }
    }
}
