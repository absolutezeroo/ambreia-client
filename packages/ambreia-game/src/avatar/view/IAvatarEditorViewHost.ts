import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IHabboAvatarEditorHost} from '../IHabboAvatarEditorHost';
import type {IFigureData} from '../figuredata/IFigureData';

/** The editor-core surface required by `AvatarEditorView`. */
export interface IAvatarEditorViewHost
{
    readonly instanceId: number;

    readonly manager: IHabboAvatarEditorHost | null;

    readonly figureData: IFigureData | null;

    isSideContentEnabled(): boolean;

    hasInvalidClubItems(): boolean;

    stripClubItems(): void;

    disableClubClothing(): void;

    hasInvalidSellableItems(): boolean;

    stripInvalidSellableItems(): void;

    isDevelopmentEditor(): boolean;

    openHabboClubAdWindow(): void;

    saveCurrentSelection(): void;

    toggleAvatarEditorPage(categoryId: string): void;

    getSideContentWindowContainer(name: string): IWindowContainer | null;

    getCategoryWindowContainer(categoryId: string): IWindow | null;

    activateCategory(categoryId: string): void;
}
