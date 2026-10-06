import {EventEmitter} from 'eventemitter3';
import {Logger} from '@core/utils/Logger';
import {AssetLibrary} from '@core/assets/AssetLibrary';
import {AssetLoaderEventType} from '@core/assets/loaders/AssetLoaderEvent';
import {Core} from '@core/Core';
import {FurnitureData} from './FurnitureData';

import type {AssetLoaderEvent} from '@core/assets/loaders/AssetLoaderEvent';
import type {IContext} from '@core/runtime/IContext';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IFurnitureData} from './IFurnitureData';

const log = Logger.getLogger('habbo.session.furniture.FurnitureDataParser');

/**
 * The event name the parser raises once furnidata is in.
 *
 * Dead in AS3 in the sense that nothing reads it — `dispatchEvent(new Event(...))` and
 * `SessionDataManager`'s listener calls all spell the literal out — but it is a real public
 * constant of the class, and it is the same string, so declaring it costs nothing and gives
 * callers a symbol to use instead of a fifth copy of the literal.
 */
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::READY
export const FURNITURE_DATA_PARSER_READY = 'FDP_furniture_data_ready';

export interface IFurnitureDataParserEvents
{
    FDP_furniture_data_ready: [];
    FDP_furniture_data_error: [error: Error];
}

/**
 * Parses furnidata into AS3-compatible furniture maps.
 *
 * @see sources/win63_version/habbo/session/furniture/FurnitureDataParser.as
 */
export class FurnitureDataParser
{
    // AS3: .../src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::_floorItems
    private _floorItems: Map<number, IFurnitureData>;
    // AS3: .../src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::_wallItems
    private _wallItems: Map<number, IFurnitureData>;
    private _floorItemsByName: Map<string, number[]>;
    private _wallItemsByName: Map<string, number[]>;
    // AS3: .../src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::_localization
    private _localization: IHabboLocalizationManager | null;
    private _critical: boolean;
    private _events: EventEmitter<IFurnitureDataParserEvents> = new EventEmitter();
    private _disposed: boolean = false;
    /**
     * The library the download runs through, and the reason dispose() can stop it.
     *
     * The port used to `await fetch(url)` with nothing owning the request, so a parser replaced by
     * SessionDataManager.initFurnitureData() resumed after its await and wrote into the maps its
     * own dispose() had just nulled — `TypeError: Cannot read properties of null (reading 'set')`
     * out of storeItem(), and the manager left with no furniture data at all.
     */
    // Name recovered, not derived: the primary tree obfuscates this field to
    //   `private var _SafeStr_6050:AssetLibrary` (l.33), and PRODUCTION's own FurnitureDataParser
    //   declares it `private var _assetLib:AssetLibrary` (l.22) — same class, same single
    //   assignment of `new AssetLibrary("FurniDataParserAssetLib")`.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::_assetLib
    private _assetLib: AssetLibrary | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::MAX_DOWNLOAD_RETRIES
    private static readonly MAX_DOWNLOAD_RETRIES: number = 2;
    // Name derived, and PRODUCTION cannot recover it: the field is `private var _SafeStr_8577:String`
    //   (l.37) in the primary tree, and the 2016 build has no retry path at all — its `loadData(k)`
    //   passes the url straight to loadAssetFromFile() and stores nothing. Named here from the only
    //   thing this field does: hold that url for retryLoadIfPossible().
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::_url
    private _url: string | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::_downloadRetriesLeft
    private _downloadRetriesLeft: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::FurnitureDataParser()
    constructor(
        floorItems: Map<number, IFurnitureData>,
        wallItems: Map<number, IFurnitureData>,
        floorItemsByName: Map<string, number[]>,
        wallItemsByName: Map<string, number[]>,
        localization: IHabboLocalizationManager | null,
        critical: boolean = true
    )
    {
        this._floorItems = floorItems;
        this._wallItems = wallItems;
        this._floorItemsByName = floorItemsByName;
        this._wallItemsByName = wallItemsByName;
        this._localization = localization;
        this._critical = critical;
        // AS3: `_SafeStr_6050 = new AssetLibrary("FurniDataParserAssetLib")`. The port's
        // AssetLibrary is a Component and needs the context AS3's does not.
        this._assetLib = new AssetLibrary(Core.instance as IContext, 'FurniDataParserAssetLib');
    }

    /**
     * AS3 is a static helper on the class; same here.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::appendRetryParam()
    private static appendRetryParam(url: string, retry: number): string
    {
        if(url.indexOf('?') > 0)
        {
            return url + '&retry=' + retry;
        }

        return url + '?retry=' + retry;
    }

    get events(): EventEmitter<IFurnitureDataParserEvents>
    {
        return this._events;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::loadData()
    loadData(url: string): void
    {
        this._url = url;
        this._downloadRetriesLeft = FurnitureDataParser.MAX_DOWNLOAD_RETRIES;

        this.requestData(url);
    }

    /**
     * AS3 drops any "furnidata" asset already in the library before loading the next one, which is
     * what makes a retry — and a second loadData() on the same parser — legal: without it
     * loadAssetFromFile() would throw on the name it registered the first time.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::requestData()
    private requestData(url: string): void
    {
        if(this._assetLib === null) return;

        // `hasAsset()` rather than `getAssetByName()`: the latter warns on a miss, and a miss is the
        // expected answer on the first request.
        if(this._assetLib.hasAsset('furnidata'))
        {
            const existing = this._assetLib.getAssetByName('furnidata');

            if(existing !== null)
            {
                const removed = this._assetLib.removeAsset(existing);

                if(removed !== null) removed.dispose();
            }
        }

        const downloadStart = performance.now();
        const loader = this._assetLib.loadAssetFromFile('furnidata', url, 'text/plain');

        // AS3 registers two listeners on the AssetLoaderStruct, one per event type, and drops both
        // in removeLoaderListeners(). This port's struct emits every type under one `event` name,
        // so the pair is a single handler split on `event.type`, retired by one `off()`.
        const onEvent = (event: AssetLoaderEvent): void =>
        {
            if(event.type !== AssetLoaderEventType.COMPLETE && event.type !== AssetLoaderEventType.ERROR) return;

            // AS3: parseFurnitureData()/furnitureDataError() both open with removeLoaderListeners().
            loader.events.off('event', onEvent);

            // Disposing the library takes the loader with it, but an event already queued can still
            // land. Flash severs the dispatcher on disposal so AS3 never sees one; this guard is the
            // port's, and it is what stops a replaced parser writing into its own nulled maps.
            if(this._disposed) return;

            if(event.type === AssetLoaderEventType.ERROR)
            {
                this.onMalformedData(event.status);
                return;
            }

            const content = this._assetLib?.getAssetByName('furnidata')?.content ?? null;
            const data = typeof content === 'string' ? content : null;

            if(data === null || data.length === 0)
            {
                this.onMalformedData(event.status);
                return;
            }

            log.info(`Furnidata downloaded in ${Math.round(performance.now() - downloadStart)} ms`);

            if(!this.parseFurnitureData(data))
            {
                this.onMalformedData(event.status);
                return;
            }

            log.info(`Parsed ${this._floorItems.size} floor items, ${this._wallItems.size} wall items`);
            this._events.emit('FDP_furniture_data_ready');
        };

        loader.events.on('event', onEvent);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::retryLoadIfPossible()
    private retryLoadIfPossible(): boolean
    {
        if(this._url === null || this._downloadRetriesLeft <= 0)
        {
            return false;
        }

        const url = FurnitureDataParser.appendRetryParam(this._url, this._downloadRetriesLeft);

        this._downloadRetriesLeft--;
        this.requestData(url);

        return true;
    }

    /**
     * AS3 also calls `HabboWebTools.logEventLog("furnituredata malformed data " + status)` here.
     * That reports to Habbo's own telemetry endpoint and has no counterpart to report to.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::onMalformedData()
    private onMalformedData(status: number): void
    {
        if(this.retryLoadIfPossible())
        {
            return;
        }

        const err = new Error(`XML furni data was malformed (status ${status})`);

        Core.error('XML furni data was malformed', this._critical, 12);
        this._events.emit('FDP_furniture_data_error', err);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::parseFurnitureData()
    private parseFurnitureData(data: string): boolean
    {
        // AS3 returns Boolean from parseXmlFormat() alone and routes a false to onMalformedData();
        // the JSON branch is the port's, so it answers the same way rather than throwing out of the
        // loader callback where nothing would catch it.
        if(data.charAt(0) === '<')
        {
            return this.parseXmlFormat(data);
        }

        const trimmed = data.trim();

        if(trimmed.charAt(0) === '{' || trimmed.charAt(0) === '[')
        {
            try
            {
                this.parseJsonFormat(JSON.parse(trimmed) as Record<string, unknown>);
            }
            catch
            {
                return false;
            }

            return true;
        }

        this.parseLingoFormat(data);

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::parseXmlFormat()
    private parseXmlFormat(data: string): boolean
    {
        // This runs synchronously on the main thread (as AS3's does), so its cost is a frozen
        // client — worth being able to attribute. The download time is logged by requestData().
        const domStart = performance.now();
        const document = new DOMParser().parseFromString(data, 'text/xml');

        // AS3 wraps `new XML(param1)` in try/catch and returns false, which sends the caller to
        // onMalformedData() and its two retries. Throwing here instead skipped the retries.
        if(document.getElementsByTagName('parsererror').length > 0)
        {
            return false;
        }

        const buildStart = performance.now();

        for(const item of Array.from(document.querySelectorAll('roomitemtypes > furnitype')))
        {
            const furnitureData = this.parseXmlFloorItem(item);
            this.storeItem(furnitureData);
            this.registerFurnitureLocalization(furnitureData);
        }

        for(const item of Array.from(document.querySelectorAll('wallitemtypes > furnitype')))
        {
            const furnitureData = this.parseXmlWallItem(item);
            this.storeItem(furnitureData);
            this.registerFurnitureLocalization(furnitureData);
        }

        const done = performance.now();

        log.info(`Furnidata XML: ${(data.length / 1048576).toFixed(1)} MB, `
            + `DOM parse ${Math.round(buildStart - domStart)} ms, `
            + `item build ${Math.round(done - buildStart)} ms`);

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::parseFloorItem()
    private parseXmlFloorItem(item: Element): FurnitureData
    {
        const id = this.getAttributeNumber(item, 'id', 0);
        const colours = this.parseXmlColours(item);
        const fullName = this.getAttributeString(item, 'classname');
        const nameParts = fullName.split('*');
        const className = nameParts[0];
        const colourIndex = nameParts.length > 1 ? parseInt(nameParts[1], 10) : 0;
        const hasIndexedColor = nameParts.length > 1;
        const values = this.readChildStrings(item);

        return new FurnitureData(
            's',
            id,
            fullName,
            className,
            this.childString(values, 'name'),
            '',
            this.childNumber(values, 'revision', 0),
            this.childNumber(values, 'xdim', 0),
            this.childNumber(values, 'ydim', 0),
            0,
            colours,
            hasIndexedColor,
            colourIndex,
            this.childString(values, 'adurl'),
            this.childNumber(values, 'offerid', 0),
            this.childString(values, 'buyout') === '1',
            this.childNumber(values, 'rentofferid', 0),
            this.childString(values, 'rentbuyout') === '1',
            this.childString(values, 'customparams'),
            this.childNumber(values, 'specialtype', 0),
            this.childString(values, 'canstandon') === '1',
            this.childString(values, 'cansiton') === '1',
            this.childString(values, 'canlayon') === '1',
            this.childString(values, 'excludeddynamic') === '1',
            this.childString(values, 'furniline'),
            this.childString(values, 'tradeable') === '1',
            this.furniDataCategory(item, values),
            this.childString(values, 'canputstuffon') === '1',
            this.childNumber(values, 'height', 0),
            // AS3 reads this as "not explicitly disabled": an absent field means recyclable.
            this.childString(values, 'recyclable') !== '0'
        );
    }

    /**
	 * The furnidata's category, which appears as a child element on some items and an attribute on
	 * others — AS3 prefers the element and falls back to the attribute.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::parseFloorItem()
    private furniDataCategory(item: Element, values: Map<string, string>): string
    {
        const child = this.childString(values, 'category');

        return child.length > 0 ? child : this.getAttributeString(item, 'category');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::parseWallItem()
    private parseXmlWallItem(item: Element): FurnitureData
    {
        const id = this.getAttributeNumber(item, 'id', 0);
        const className = this.getAttributeString(item, 'classname');
        const values = this.readChildStrings(item);

        return new FurnitureData(
            'i',
            id,
            className,
            className,
            this.childString(values, 'name'),
            '',
            this.childNumber(values, 'revision', 0),
            0,
            0,
            0,
            null,
            false,
            0,
            this.childString(values, 'adurl'),
            this.childNumber(values, 'offerid', 0),
            this.childString(values, 'buyout') === '1',
            this.childNumber(values, 'rentofferid', 0),
            this.childString(values, 'rentbuyout') === '1',
            null,
            this.childNumber(values, 'specialtype', 0),
            false,
            false,
            false,
            this.childString(values, 'excludeddynamic') === '1',
            this.childString(values, 'furniline'),
            this.childString(values, 'tradeable') === '1',
            this.furniDataCategory(item, values),
            // A wall item is never stacked on and has no stacking height; AS3 passes both as
            // false/0 here and reads only `recyclable` from the data.
            false,
            0,
            this.childString(values, 'recyclable') !== '0'
        );
    }

    private parseJsonFormat(data: Record<string, unknown>): void
    {
        // Same reason as parseXmlFormat(): this blocks the main thread for as long as it runs,
        // so the cost is a frozen client and worth attributing. JSON.parse() itself already
        // happened in parseFurnitureData(), hence "item build" only.
        const buildStart = performance.now();
        const roomItemTypes = this.asRecord(data['roomitemtypes']);
        const wallItemTypes = this.asRecord(data['wallitemtypes']);

        for(const item of this.asRecordArray(roomItemTypes?.['furnitype'] ?? null))
        {
            const furnitureData = this.parseJsonFloorItem(item);
            this.storeItem(furnitureData);
            this.registerFurnitureLocalization(furnitureData);
        }

        for(const item of this.asRecordArray(wallItemTypes?.['furnitype'] ?? null))
        {
            const furnitureData = this.parseJsonWallItem(item);
            this.storeItem(furnitureData);
            this.registerFurnitureLocalization(furnitureData);
        }

        log.info(`Furnidata JSON: item build ${Math.round(performance.now() - buildStart)} ms`);
    }

    private parseJsonFloorItem(item: Record<string, unknown>): FurnitureData
    {
        const fullName = this.getRawString(item, 'classname', 'className');
        const nameParts = fullName.split('*');
        const className = nameParts[0];
        const colourIndex = nameParts.length > 1 ? parseInt(nameParts[1], 10) : 0;
        const hasIndexedColor = nameParts.length > 1;

        return new FurnitureData(
            's',
            this.getRawNumber(item, 0, 'id'),
            fullName,
            className,
            this.getRawString(item, 'name'),
            this.getRawString(item, 'description'),
            this.getRawNumber(item, 0, 'revision'),
            this.getRawNumber(item, 0, 'xdim'),
            this.getRawNumber(item, 0, 'ydim'),
            0,
            this.parseJsonColours(item['partcolors']),
            hasIndexedColor,
            colourIndex,
            this.getRawString(item, 'adurl'),
            this.getRawNumber(item, 0, 'offerid'),
            this.getRawBoolean(item, 'buyout'),
            this.getRawNumber(item, 0, 'rentofferid'),
            this.getRawBoolean(item, 'rentbuyout'),
            this.getRawString(item, 'customparams'),
            this.getRawNumber(item, 0, 'specialtype'),
            this.getRawBoolean(item, 'canstandon'),
            this.getRawBoolean(item, 'cansiton'),
            this.getRawBoolean(item, 'canlayon'),
            this.getRawBoolean(item, 'excludeddynamic'),
            this.getRawString(item, 'furniline'),
            this.getRawBoolean(item, 'tradeable'),
            this.getRawString(item, 'category'),
            this.getRawBoolean(item, 'canputstuffon'),
            this.getRawNumber(item, 0, 'height'),
            // Absent means recyclable, as in the XML branch.
            item['recyclable'] === undefined || this.getRawBoolean(item, 'recyclable')
        );
    }

    private parseJsonWallItem(item: Record<string, unknown>): FurnitureData
    {
        const className = this.getRawString(item, 'classname', 'className');

        return new FurnitureData(
            'i',
            this.getRawNumber(item, 0, 'id'),
            className,
            className,
            this.getRawString(item, 'name'),
            this.getRawString(item, 'description'),
            this.getRawNumber(item, 0, 'revision'),
            0,
            0,
            0,
            null,
            false,
            0,
            this.getRawString(item, 'adurl'),
            this.getRawNumber(item, 0, 'offerid'),
            this.getRawBoolean(item, 'buyout'),
            this.getRawNumber(item, 0, 'rentofferid'),
            this.getRawBoolean(item, 'rentbuyout'),
            null,
            this.getRawNumber(item, 0, 'specialtype'),
            false,
            false,
            false,
            this.getRawBoolean(item, 'excludeddynamic'),
            this.getRawString(item, 'furniline'),
            this.getRawBoolean(item, 'tradeable'),
            this.getRawString(item, 'category'),
            false,
            0,
            item['recyclable'] === undefined || this.getRawBoolean(item, 'recyclable')
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::parseLingoFormat()
    private parseLingoFormat(data: string): void
    {
        const lineRegex = /\n\r{1,}|\n{1,}|\r{1,}/gm;
        const bracketRegex = /\[+?((.)*?)\]/g;
        const lines = data.split(lineRegex);

        for(const line of lines)
        {
            const matches = line.match(bracketRegex);

            if(matches === null)
            {
                continue;
            }

            for(const match of matches)
            {
                const values = this.parseLingoEntry(match);

                if(values.length < 18)
                {
                    throw new Error('Lingo furni data was malformed');
                }

                const type = values[0];
                const id = parseInt(values[1], 10);
                const fullName = String(values[2]);
                const nameParts = fullName.split('*');
                const className = nameParts[0];
                const colourIndex = nameParts.length > 1 ? parseInt(nameParts[1], 10) : 0;
                const hasIndexedColor = nameParts.length > 1;
                const colours = this.parseColourList(values[7].split(','));
                const isWallItem = type === 'i';
                let canStandOn = false;
                let canSitOn = false;
                let canLayOn = false;
                let excludedFromDynamic: boolean;

                if(isWallItem)
                {
                    excludedFromDynamic = values.length >= 19 && values[18] === '1';
                }
                else
                {
                    canStandOn = values[18] === '1';
                    canSitOn = values[19] === '1';
                    canLayOn = values[20] === '1';
                    excludedFromDynamic = values.length >= 22 && values[21] === '1';
                }

                const furnitureData = new FurnitureData(
                    type,
                    id,
                    fullName,
                    className,
                    values[8],
                    values[9],
                    parseInt(values[3], 10),
                    parseInt(values[4], 10),
                    parseInt(values[5], 10),
                    parseInt(values[6], 10),
                    colours,
                    hasIndexedColor,
                    colourIndex,
                    values[10],
                    parseInt(values[11], 10),
                    values[12] === 'true',
                    parseInt(values[13], 10),
                    values[14] === 'true',
                    values[15],
                    parseInt(values[16], 10),
                    canStandOn,
                    canSitOn,
                    canLayOn,
                    excludedFromDynamic,
                    '',
                    // The legacy Lingo format predates furniLine/tradeable - neither is encoded in it.
                    false
                );

                this.storeItem(furnitureData);
                this.registerFurnitureLocalization(furnitureData);
            }
        }
    }

    private parseLingoEntry(entry: string): string[]
    {
        let value = entry.replace(/\[{1,}/gm, '');
        value = value.replace(/\]{1,}/gm, '');

        const values = value.split('"');
        this.removePatternFrom(values, ', ');
        this.removePatternFrom(values, ',');
        values.splice(0, 1);
        values.splice(values.length - 1, 1);

        return values;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::storeItem()
    private storeItem(item: FurnitureData): void
    {
        let nameMap: Map<string, number[]> | null = null;

        if(item.type === 's')
        {
            this._floorItems.set(item.id, item);
            nameMap = this._floorItemsByName;
        }
        else if(item.type === 'i')
        {
            this._wallItems.set(item.id, item);
            nameMap = this._wallItemsByName;
        }

        if(nameMap === null)
        {
            return;
        }

        let ids = nameMap.get(item.className) ?? null;

        if(ids === null)
        {
            ids = [];
            nameMap.set(item.className, ids);
        }

        ids[item.colourIndex] = item.id;
    }

    /**
	 * Publishes one item's name and description as localization keys.
	 *
	 * This is where every `roomItem.name.<id>` / `wallItem.name.<id>` in the client
	 * comes from — they exist in no text file, not even Habbo's. GroupItem and Offer
	 * read them back to name furniture in the inventory and the catalog; the
	 * infostand skips them and reads furnitureData.localizedName directly, which is
	 * why it kept working while both of the others showed nothing.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::registerFurnitureLocalization()
    private registerFurnitureLocalization(item: FurnitureData): void
    {
        // AS3 guards identically (`if(_localization != null)`), so the guard itself is
        // faithful — but it is silent in both, and silence is what makes a missing
        // manager cost hours instead of seconds. Logging is the deviation, deliberately:
        // if this ever fires, the symptom is every furniture name in the client going
        // blank, and that should not have to be diagnosed from scratch again.
        if(this._localization === null)
        {
            log.error('No localization manager: furniture names will be empty everywhere. '
                + 'SessionDataManager must inject it before furnidata parses.');

            return;
        }

        if(item.type === 's')
        {
            this._localization.updateLocalization(`roomItem.name.${item.id}`, item.localizedName);
            this._localization.updateLocalization(`roomItem.desc.${item.id}`, item.description);
        }
        else if(item.type === 'i')
        {
            this._localization.updateLocalization(`wallItem.name.${item.id}`, item.localizedName);
            this._localization.updateLocalization(`wallItem.desc.${item.id}`, item.description);
        }
    }

    private parseXmlColours(item: Element): number[]
    {
        const partColors = item.getElementsByTagName('partcolors')[0] ?? null;

        if(partColors === null)
        {
            return [];
        }

        const values: string[] = [];

        for(const color of Array.from(partColors.getElementsByTagName('color')))
        {
            values.push(color.textContent ?? '');
        }

        return this.parseColourList(values);
    }

    private parseJsonColours(partColors: unknown): number[]
    {
        const record = this.asRecord(partColors);

        if(record === null)
        {
            return [];
        }

        const color = record['color'];
        const values: string[] = [];

        if(Array.isArray(color))
        {
            for(const value of color)
            {
                values.push(String(value));
            }
        }
        else if(color !== null && color !== undefined)
        {
            values.push(String(color));
        }

        return this.parseColourList(values);
    }

    private parseColourList(values: string[]): number[]
    {
        const colours: number[] = [];

        for(const value of values)
        {
            let color = value;

            if(color.charAt(0) === '#')
            {
                color = color.replace('#', '');
                colours.push(parseInt(color, 16));
            }
            else
            {
                colours.push(-parseInt(color, 10));
            }
        }

        return colours;
    }

    // AS3: .../src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::removePatternFrom()
    private removePatternFrom(values: string[], pattern: string): void
    {
        let index = 0;

        while(index < values.length)
        {
            if(values[index] === pattern)
            {
                values.splice(index, 1);
                index--;
            }

            index++;
        }
    }

    /**
     * Reads every direct child element of a `<furnitype>` once, keyed by tag name.
     *
     * getChildString() rescans element.children from the start for each field, and a floor
     * item reads 19 of them — so the whole furnidata cost 19 linear walks per item over a live
     * HTMLCollection. Measured in Chromium on a synthetic 54,927-item furnidata: 1790 ms that
     * way against 351 ms for this single pass, byte-identical results. E4X (`param1.name`) has
     * the same first-match-wins semantics, which is why the first writer wins here too.
     */
    private readChildStrings(element: Element): Map<string, string>
    {
        const values = new Map<string, string>();
        const children = element.children;

        for(let index = 0; index < children.length; index++)
        {
            const child = children[index];

            if(!values.has(child.tagName))
            {
                values.set(child.tagName, child.textContent ?? '');
            }
        }

        return values;
    }

    private childString(values: Map<string, string>, name: string): string
    {
        return values.get(name) ?? '';
    }

    private childNumber(values: Map<string, string>, name: string, defaultValue: number): number
    {
        const value = this.childString(values, name);

        if(value.length === 0)
        {
            return defaultValue;
        }

        const parsed = Number(value);

        return Number.isNaN(parsed) ? defaultValue : parsed;
    }

    private getChildString(element: Element, name: string): string
    {
        for(let index = 0; index < element.children.length; index++)
        {
            const child = element.children[index];

            if(child.tagName === name)
            {
                return child.textContent ?? '';
            }
        }

        return '';
    }

    private getChildNumber(element: Element, name: string, defaultValue: number): number
    {
        const value = this.getChildString(element, name);

        if(value.length === 0)
        {
            return defaultValue;
        }

        const parsed = Number(value);

        return Number.isNaN(parsed) ? defaultValue : parsed;
    }

    private getAttributeString(element: Element, name: string): string
    {
        return element.getAttribute(name) ?? '';
    }

    private getAttributeNumber(element: Element, name: string, defaultValue: number): number
    {
        const value = this.getAttributeString(element, name);

        if(value.length === 0)
        {
            return defaultValue;
        }

        const parsed = Number(value);

        return Number.isNaN(parsed) ? defaultValue : parsed;
    }

    private getRawString(data: Record<string, unknown>, ...keys: string[]): string
    {
        for(const key of keys)
        {
            const value = data[key];

            if(value !== null && value !== undefined)
            {
                return String(value);
            }
        }

        return '';
    }

    private getRawNumber(data: Record<string, unknown>, defaultValue: number, ...keys: string[]): number
    {
        const value = this.getRawString(data, ...keys);

        if(value.length === 0)
        {
            return defaultValue;
        }

        const parsed = Number(value);

        return Number.isNaN(parsed) ? defaultValue : parsed;
    }

    private getRawBoolean(data: Record<string, unknown>, key: string): boolean
    {
        const value = data[key];

        if(typeof value === 'boolean')
        {
            return value;
        }

        if(typeof value === 'number')
        {
            return value !== 0;
        }

        if(typeof value === 'string')
        {
            const lower = value.toLowerCase();

            return lower === '1' || lower === 'true';
        }

        return false;
    }

    private asRecord(value: unknown): Record<string, unknown> | null
    {
        if(value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value))
        {
            return value as Record<string, unknown>;
        }

        return null;
    }

    private asRecordArray(value: unknown): Record<string, unknown>[]
    {
        if(Array.isArray(value))
        {
            return value.filter((item): item is Record<string, unknown> => this.asRecord(item) !== null);
        }

        const record = this.asRecord(value);

        return record !== null ? [record] : [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/FurnitureDataParser.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        // Set before the library goes, so the loader callback can tell "replaced on purpose" from
        // a real failure if one is already queued.
        this._disposed = true;

        // AS3: `if(_SafeStr_6050){ _SafeStr_6050.dispose(); _SafeStr_6050 = null; }` — this is what
        // stops the download. Nothing else in this method could.
        if(this._assetLib !== null)
        {
            this._assetLib.dispose();
            this._assetLib = null;
        }

        this._events.removeAllListeners();
        this._floorItems = null as unknown as Map<number, IFurnitureData>;
        this._wallItems = null as unknown as Map<number, IFurnitureData>;
        this._floorItemsByName = null as unknown as Map<string, number[]>;
        this._wallItemsByName = null as unknown as Map<string, number[]>;
        this._localization = null;
    }
}
