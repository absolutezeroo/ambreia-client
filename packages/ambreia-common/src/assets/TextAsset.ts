import type {IAsset} from './IAsset';
import type {AssetTypeDeclaration} from './AssetTypeDeclaration';

/**
 * TextAsset
 *
 * Based on AS3: com.sulake.core.assets.TextAsset
 *
 * Asset that holds text content.
 */
export class TextAsset implements IAsset
{
    private readonly _declaration: AssetTypeDeclaration;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/TextAsset.as::_url
    private readonly _url: string;

    constructor(declaration: AssetTypeDeclaration, url: string = '')
    {
        this._declaration = declaration;
        this._url = url;
    }

    // AS3: .../src/com/sulake/core/assets/TextAsset.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/core/assets/TextAsset.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/core/assets/TextAsset.as::_content
    private _content: string = '';

    // AS3: .../src/com/sulake/core/assets/TextAsset.as::get content()
    get content(): string
    {
        return this._content;
    }

    // AS3: .../src/com/sulake/core/assets/TextAsset.as::get url()
    get url(): string
    {
        return this._url;
    }

    // AS3: .../src/com/sulake/core/assets/TextAsset.as::get declaration()
    get declaration(): AssetTypeDeclaration
    {
        return this._declaration;
    }

    // AS3: .../src/com/sulake/core/assets/TextAsset.as::dispose()
    dispose(): void
    {
        if(!this._disposed)
        {
            this._disposed = true;
            this._content = '';
        }
    }

    // AS3: .../src/com/sulake/core/assets/TextAsset.as::setUnknownContent()
    setUnknownContent(content: unknown): void
    {
        if(typeof content === 'string')
        {
            this._content = content;
            return;
        }

        if(content instanceof ArrayBuffer)
        {
            const decoder = new TextDecoder('utf-8');
            this._content = decoder.decode(content);
            return;
        }

        if(content instanceof Uint8Array)
        {
            const decoder = new TextDecoder('utf-8');
            this._content = decoder.decode(content);
            return;
        }

        if(content instanceof TextAsset)
        {
            this._content = content._content;
            return;
        }

        this._content = content ? String(content) : '';
    }

    // AS3: .../src/com/sulake/core/assets/TextAsset.as::setFromOtherAsset()
    setFromOtherAsset(asset: IAsset): void
    {
        if(asset instanceof TextAsset)
        {
            this._content = asset._content;
            return;
        }

        throw new Error('Provided asset is not of type TextAsset');
    }

    // AS3: .../src/com/sulake/core/assets/TextAsset.as::setParamsDesc()
    setParamsDesc(_params: Map<string, string>): void
    {
    }
}
