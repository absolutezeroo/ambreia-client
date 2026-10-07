import type {IDisposable} from '../IDisposable';
import type {AssetTypeDeclaration} from './AssetTypeDeclaration';

/**
 * IAsset Interface
 *
 * Based on AS3: com.sulake.core.assets.IAsset
 *
 * Base interface for all asset types.
 */
export interface IAsset extends IDisposable
{
    // AS3: sources/win63_version/core/assets/IAsset.as::get url()
    readonly url: string;
    // AS3: sources/win63_version/core/assets/IAsset.as::get content()
    readonly content: unknown;
    // AS3: sources/win63_version/core/assets/IAsset.as::get declaration()
    readonly declaration: AssetTypeDeclaration;

    // AS3: sources/win63_version/core/assets/IAsset.as::setUnknownContent()
    setUnknownContent(content: unknown): void;

    // AS3: sources/win63_version/core/assets/IAsset.as::setFromOtherAsset()
    setFromOtherAsset(asset: IAsset): void;

    // AS3: sources/win63_version/core/assets/IAsset.as::setParamsDesc()
    setParamsDesc(params: Map<string, string>): void;
}
