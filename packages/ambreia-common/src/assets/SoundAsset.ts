import type {IAsset} from './IAsset';
import type {AssetTypeDeclaration} from './AssetTypeDeclaration';

/**
 * SoundAsset
 *
 * Based on AS3: com.sulake.core.assets.SoundAsset
 *
 * Asset that holds audio content. Uses Web Audio API AudioBuffer.
 */
export class SoundAsset implements IAsset
{
    private readonly _declaration: AssetTypeDeclaration;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/SoundAsset.as::_url
    private readonly _url: string;

    constructor(declaration: AssetTypeDeclaration, url: string = '')
    {
        this._declaration = declaration;
        this._url = url;
    }

    // AS3: .../src/com/sulake/core/assets/SoundAsset.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/core/assets/SoundAsset.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/core/assets/SoundAsset.as::_content
    private _content: AudioBuffer | null = null;

    // AS3: .../src/com/sulake/core/assets/SoundAsset.as::get content()
    get content(): AudioBuffer | null
    {
        return this._content;
    }

    // AS3: .../src/com/sulake/core/assets/SoundAsset.as::get url()
    get url(): string
    {
        return this._url;
    }

    // AS3: .../src/com/sulake/core/assets/SoundAsset.as::get declaration()
    get declaration(): AssetTypeDeclaration
    {
        return this._declaration;
    }

    // AS3: .../src/com/sulake/core/assets/SoundAsset.as::dispose()
    dispose(): void
    {
        if(!this._disposed)
        {
            this._disposed = true;
            this._content = null;
        }
    }

    // AS3: .../src/com/sulake/core/assets/SoundAsset.as::setUnknownContent()
    setUnknownContent(content: unknown): void
    {
        if(content instanceof AudioBuffer)
        {
            this._content = content;
            return;
        }

        if(content instanceof SoundAsset)
        {
            this._content = content._content;
            return;
        }
    }

    // AS3: .../src/com/sulake/core/assets/SoundAsset.as::setFromOtherAsset()
    setFromOtherAsset(asset: IAsset): void
    {
        if(asset instanceof SoundAsset)
        {
            this._content = asset._content;
            return;
        }

        throw new Error('Provided asset is not of type SoundAsset');
    }

    // AS3: .../src/com/sulake/core/assets/SoundAsset.as::setParamsDesc()
    setParamsDesc(_params: Map<string, string>): void
    {
    }
}
