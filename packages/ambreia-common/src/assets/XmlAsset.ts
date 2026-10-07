import type {ILazyAsset} from './ILazyAsset';
import type {IAsset} from './IAsset';
import type {AssetTypeDeclaration} from './AssetTypeDeclaration';

/**
 * XmlAsset
 *
 * Based on AS3: com.sulake.core.assets.XmlAsset
 *
 * Asset that holds XML content. Supports lazy loading.
 */
export class XmlAsset implements ILazyAsset
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/XmlAsset.as::_unknown
    private _unknown: unknown = null;
    private readonly _declaration: AssetTypeDeclaration;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/XmlAsset.as::_url
    private readonly _url: string;

    constructor(declaration: AssetTypeDeclaration, url: string = '')
    {
        this._declaration = declaration;
        this._url = url;
    }

    // AS3: .../src/com/sulake/core/assets/XmlAsset.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/core/assets/XmlAsset.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/core/assets/XmlAsset.as::_content
    private _content: Document | null = null;

    // AS3: .../src/com/sulake/core/assets/XmlAsset.as::get content()
    get content(): Document | null
    {
        if(!this._content)
        {
            this.prepareLazyContent();
        }

        return this._content;
    }

    // AS3: .../src/com/sulake/core/assets/XmlAsset.as::get url()
    get url(): string
    {
        return this._url;
    }

    // AS3: .../src/com/sulake/core/assets/XmlAsset.as::get declaration()
    get declaration(): AssetTypeDeclaration
    {
        return this._declaration;
    }

    // AS3: .../src/com/sulake/core/assets/XmlAsset.as::dispose()
    dispose(): void
    {
        if(!this._disposed)
        {
            this._disposed = true;
            this._content = null;
            this._unknown = null;
        }
    }

    // AS3: .../src/com/sulake/core/assets/XmlAsset.as::setUnknownContent()
    setUnknownContent(content: unknown): void
    {
        this._content = null;
        this._unknown = content;
    }

    // AS3: .../src/com/sulake/core/assets/XmlAsset.as::prepareLazyContent()
    prepareLazyContent(): void
    {
        if(this._unknown === null)
        {
            return;
        }

        const parser = new DOMParser();
        let xmlString: string;

        if(typeof this._unknown === 'string')
        {
            xmlString = this._unknown;
        }
        else if(this._unknown instanceof ArrayBuffer)
        {
            const decoder = new TextDecoder('utf-8');
            xmlString = decoder.decode(this._unknown);
        }
        else if(this._unknown instanceof Uint8Array)
        {
            const decoder = new TextDecoder('utf-8');
            xmlString = decoder.decode(this._unknown);
        }
        else if(this._unknown instanceof Document)
        {
            this._content = this._unknown;
            this._unknown = null;
            return;
        }
        else if(this._unknown instanceof XmlAsset)
        {
            this._content = this._unknown._content;
            this._unknown = null;
            return;
        }
        else
        {
            xmlString = String(this._unknown);
        }

        this._content = parser.parseFromString(xmlString, 'text/xml');
        this._unknown = null;
    }

    // AS3: .../src/com/sulake/core/assets/XmlAsset.as::setFromOtherAsset()
    setFromOtherAsset(asset: IAsset): void
    {
        if(asset instanceof XmlAsset)
        {
            this._content = asset._content;
            return;
        }

        throw new Error('Provided asset is not of type XmlAsset');
    }

    // AS3: .../src/com/sulake/core/assets/XmlAsset.as::setParamsDesc()
    setParamsDesc(_params: Map<string, string>): void
    {
    }

    // AS3: .../src/com/sulake/core/assets/XmlAsset.as::toString()
    toString(): string
    {
        return `[XmlAsset url=${this._url}]`;
    }
}
