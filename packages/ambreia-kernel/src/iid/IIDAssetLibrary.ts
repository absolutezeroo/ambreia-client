import {createIID} from "../runtime/IID";
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';

/**
 * TS-only DI bridge for the shared AssetLibrary instance.
 *
 * No IIDAssetLibrary exists in any of the 3 AS3 source trees: AS3 does not manage
 * AssetLibrary as a DI-resolved service at all - every Component receives its own
 * asset library directly through its constructor parameter instead. This port
 * threads one shared AssetLibrary through the DI container (see VortexMain.ts and
 * habbo/avatar/AvatarRenderManager.ts) rather than passing it down every
 * constructor in the dependency graph, which AS3's simpler single-context
 * assumption doesn't require it to do.
 */
export const IID_AssetLibrary = createIID<IAssetLibrary>('IAssetLibrary');
