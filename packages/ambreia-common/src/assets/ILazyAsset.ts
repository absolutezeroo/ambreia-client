import type {IAsset} from './IAsset';

/**
 * ILazyAsset Interface
 *
 * Based on AS3: com.sulake.core.assets.ILazyAsset
 *
 * Extends IAsset to support lazy content loading.
 */
export interface ILazyAsset extends IAsset
{
    // AS3: .../src/com/sulake/core/assets/ILazyAsset.as::prepareLazyContent()
    prepareLazyContent(): void;
}
