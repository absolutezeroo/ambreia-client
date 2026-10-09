import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {AmbreiaDirectory} from '@ambreia/common/assets/pack/AmbreiaDirectory';
import type {IAvatarData} from './AvatarData';

/** Everything AvatarRenderManager used to pull from the DI context and the configuration. */
export interface IAvatarRenderOptions
{
    /** Where the downloaded libraries go. */
    assets: IAssetLibrary;
    /** The shipped Ambreia*.xml files (readAvatarData()). */
    data: IAvatarData;
    /** The clothing family's .ambreia directory: every figure-map library is a piece of it. */
    clothing: AmbreiaDirectory;
    /** The effects family's directory: every effect-map library is a piece of it. */
    effects: AmbreiaDirectory;
    /** Called when a mandatory library finishes — the client's loading bar. Was `Core.instance.updateLoadingProcess`. */
    onLibraryLoaded?(libraryName: string): void;
}
