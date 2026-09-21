import type {IGameDataResources} from './IGameDataResources';

interface IHashEntry {
    name: string;
    url: string;
    hash: string;
}

interface IHashesData {
    hashes: IHashEntry[];
}

/**
 * Game data resources containing hashes for external files
 *
 * Based on AS3 sources/win63_version/core/localization/class_2118.as
 */
// AS3: sources/win63_version/core/localization/class_2118.as::class_2118()
export class GameDataResources implements IGameDataResources 
{
    private _externalVariablesUrl: string = '';

    // AS3: sources/win63_version/core/localization/class_2118.as::getExternalVariablesUrl()
    get externalVariablesUrl(): string 
    {
        return this._externalVariablesUrl;
    }

    // AS3: sources/win63_version/core/localization/class_2118.as::_externalVariablesHash
    private _externalVariablesHash: string = '';

    // AS3: sources/win63_version/core/localization/class_2118.as::getExternalVariablesHash()
    get externalVariablesHash(): string 
    {
        return this._externalVariablesHash;
    }

    private _externalTextsUrl: string = '';

    // AS3: sources/win63_version/core/localization/class_2118.as::getExternalTextsUrl()
    get externalTextsUrl(): string 
    {
        return this._externalTextsUrl;
    }

    // AS3: sources/win63_version/core/localization/class_2118.as::_externalTextsHash
    private _externalTextsHash: string = '';

    // AS3: sources/win63_version/core/localization/class_2118.as::getExternalTextsHash()
    get externalTextsHash(): string 
    {
        return this._externalTextsHash;
    }

    private _furniDataUrl: string = '';

    // AS3: sources/win63_version/core/localization/class_2118.as::getFurniDataUrl()
    get furniDataUrl(): string 
    {
        return this._furniDataUrl;
    }

    private _furniDataHash: string = '';

    // AS3: sources/win63_version/core/localization/class_2118.as::getFurniDataHash()
    get furniDataHash(): string 
    {
        return this._furniDataHash;
    }

    private _productDataUrl: string = '';

    // AS3: sources/win63_version/core/localization/class_2118.as::getProductDataUrl()
    get productDataUrl(): string 
    {
        return this._productDataUrl;
    }

    // AS3: sources/win63_version/core/localization/class_2118.as::_productDataHash
    private _productDataHash: string = '';

    // AS3: sources/win63_version/core/localization/class_2118.as::getProductDataHash()
    get productDataHash(): string 
    {
        return this._productDataHash;
    }

    /**
     * Parse game data resources from JSON string
     */
    // AS3: sources/win63_version/core/localization/class_2118.as::parse()
    static parse(data: string): GameDataResources 
    {
        let parsed: IHashesData;
        try 
        {
            parsed = JSON.parse(data) as IHashesData;
        }
        catch
        {
            throw new Error('[GameDataResources] Failed to parse game data JSON');
        }
        const resources = new GameDataResources();

        for(const entry of parsed.hashes)
        {
            const url = entry.url;

            // The primary tree keys everything by name and exposes only getResourceUrl/Hash; the
            // four named pairs below are the ones this port already had accessors for, and keeping
            // both shapes means a caller can ask for a resource the switch does not know about.
            resources._resourceUrls.set(entry.name, url);
            resources._resourceHashes.set(entry.name, entry.hash);

            switch(entry.name)
            {
                case 'external_texts':
                    resources._externalTextsUrl = url;
                    resources._externalTextsHash = entry.hash;
                    break;
                case 'external_variables':
                    resources._externalVariablesUrl = url;
                    resources._externalVariablesHash = entry.hash;
                    break;
                case 'furnidata':
                    resources._furniDataUrl = url;
                    resources._furniDataHash = entry.hash;
                    break;
                case 'productdata':
                    resources._productDataUrl = url;
                    resources._productDataHash = entry.hash;
                    break;
            }
        }

        return resources;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/localization/GameDataResources.as::_resourceUrls
    private _resourceUrls: Map<string, string> = new Map();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/localization/GameDataResources.as::_resourceHashes
    private _resourceHashes: Map<string, string> = new Map();

    /**
	 * Any resource in the manifest, by the name it was published under
	 *
	 * The named accessors above cover the four the client always needs; this pair reaches the rest
	 * without the switch having to know them. Empty when the manifest has no such entry — AS3
	 * returns `undefined` from its dictionary, which its callers treat the same way.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/localization/GameDataResources.as::getResourceUrl()
    getResourceUrl(name: string): string
    {
        return this._resourceUrls.get(name) ?? '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/localization/GameDataResources.as::getResourceHash()
    getResourceHash(name: string): string
    {
        return this._resourceHashes.get(name) ?? '';
    }

    /**
     * Every resource whose published name starts with `prefix`, in manifest order
     *
     * No AS3 counterpart: the official client loads exactly one texts file per language. Splitting
     * the texts by domain is ours, and the order matters — the files land in one key store, so a
     * key present in two of them keeps the value from the one listed last.
     */
    getResourceNames(prefix: string): string[]
    {
        const names: string[] = [];

        for(const name of this._resourceUrls.keys())
        {
            if(name.startsWith(prefix)) names.push(name);
        }

        return names;
    }

    // AS3: sources/win63_version/core/localization/class_2118.as::isValid()
    isValid(): boolean
    {
        return !!(
            this._externalTextsUrl &&
            this._externalTextsHash &&
            this._externalVariablesUrl &&
            this._externalVariablesHash &&
            this._furniDataUrl &&
            this._furniDataHash &&
            this._productDataUrl &&
            this._productDataHash
        );
    }
}