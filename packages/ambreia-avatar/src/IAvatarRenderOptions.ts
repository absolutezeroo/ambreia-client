import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {IAvatarData} from './AvatarData';

/** Everything AvatarRenderManager used to pull from the DI context and the configuration. */
export interface IAvatarRenderOptions
{
    /** Where the downloaded libraries go. */
    assets: IAssetLibrary;
    /** The shipped Ambreia*.xml files (readAvatarData()). */
    data: IAvatarData;
    /** `flash.dynamic.avatar.download.url`: base of the .nitro libraries. */
    downloadUrl: string;
    /** `flash.dynamic.avatar.download.name.template`. */
    downloadNameTemplate: string;
    /** Called when a mandatory library finishes — the client's loading bar. Was `Core.instance.updateLoadingProcess`. */
    onLibraryLoaded?(libraryName: string): void;
}
