import type {IAsset} from './IAsset';
import type {AssetTypeDeclaration} from './AssetTypeDeclaration';

/**
 * UnknownAsset
 *
 * Based on AS3: com.sulake.core.assets.UnknownAsset
 *
 * A fallback asset type for binary content.
 */
export class UnknownAsset implements IAsset
{
    private readonly _declaration: AssetTypeDeclaration;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/UnknownAsset.as::_url
    private readonly _url: string;

    constructor(declaration: AssetTypeDeclaration, url: string = '')
    {
        this._declaration = declaration;
        this._url = url;
    }

    // AS3: .../src/com/sulake/core/assets/UnknownAsset.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/core/assets/UnknownAsset.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/core/assets/UnknownAsset.as::_content
    private _content: unknown = null;

    // AS3: .../src/com/sulake/core/assets/UnknownAsset.as::get content()
    get content(): unknown
    {
        return this._content;
    }

    // AS3: .../src/com/sulake/core/assets/UnknownAsset.as::get url()
    get url(): string
    {
        return this._url;
    }

    // AS3: .../src/com/sulake/core/assets/UnknownAsset.as::get declaration()
    get declaration(): AssetTypeDeclaration
    {
        return this._declaration;
    }

    // AS3: .../src/com/sulake/core/assets/UnknownAsset.as::dispose()
    dispose(): void
    {
        if(!this._disposed)
        {
            this._disposed = true;
            this._content = null;
        }
    }

    // AS3: .../src/com/sulake/core/assets/UnknownAsset.as::setUnknownContent()
    setUnknownContent(content: unknown): void
    {
        this._content = content;
    }

    // AS3: .../src/com/sulake/core/assets/UnknownAsset.as::setFromOtherAsset()
    setFromOtherAsset(asset: IAsset): void
    {
        this._content = asset.content;
    }

    // AS3: .../src/com/sulake/core/assets/UnknownAsset.as::setParamsDesc()
    setParamsDesc(_params: Map<string, string>): void
    {
    }

    // AS3: .../src/com/sulake/core/assets/UnknownAsset.as::toString()
    toString(): string
    {
        return `[UnknownAsset: ${this._content}]`;
    }
}
