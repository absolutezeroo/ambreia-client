import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';

/** Everything AvatarRenderManager used to pull from the DI context and the configuration. */
export interface IAvatarRenderOptions
{
    /** Embedded XMLs (HabboAvatarGeometry, …PartSets, …Animation, …Figure, optional …Actions) and downloaded libraries. */
    assets: IAssetLibrary;
    /** `flash.dynamic.avatar.download.url`: base of the .nitro libraries, HabboAvatarActions.xml and effectmap.xml. */
    downloadUrl: string;
    /** `flash.dynamic.avatar.download.name.template`. */
    downloadNameTemplate: string;
    /** `flash.dynamic.avatar.download.configuration`: the figure map. */
    figureMapUrl: string;
    /** `external.figurepartlist.txt`: figure data; empty skips it. */
    figurePartListUrl?: string;
    /** Called when a mandatory library finishes — the client's loading bar. Was `Core.instance.updateLoadingProcess`. */
    onLibraryLoaded?(libraryName: string): void;
}
