import type {IWindow} from '@ambreia/ui/IWindow';
import type {IHabboAvatarEditorHost} from '../IHabboAvatarEditorHost';
import type {IFigureData} from '../figuredata/IFigureData';

/** The editor-core surface required by `AvatarEditorView`. */
export interface IAvatarEditorViewHost
{
    readonly instanceId: number;

    readonly manager: IHabboAvatarEditorHost | null;

    readonly figureData: IFigureData | null;

    hasInvalidSellableItems(): boolean;

    stripInvalidSellableItems(): void;

    isDevelopmentEditor(): boolean;

    saveCurrentSelection(): void;

    toggleAvatarEditorPage(categoryId: string): void;

    getCategoryWindowContainer(categoryId: string): IWindow | null;

    activateCategory(categoryId: string): void;
}
