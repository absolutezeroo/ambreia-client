import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import type {CategoryData} from './CategoryData';

/**
 * Model surface consumed by the editor's shared thumbnail grids.
 *
 * It deliberately contains no `controller` back-reference. The grids only need selection commands
 * plus the rendering/window services used to paint their cells, so depending on this role keeps the
 * model/view boundary one-way.
 */
export interface IAvatarEditorGridModel
{
    readonly avatarRenderManager: IAvatarRenderManager | null;

    readonly windowManager: IHabboWindowManager | null;

    getAssetBitmap(name: string): ImageBitmap | null;

    getProperty(key: string): string;

    openCatalogPage(pageName: string): void;

    getCategoryData(partType: string): CategoryData | null;

    selectPart(partType: string, index: number): void;

    selectColor(partType: string, index: number, layer: number): void;
}
