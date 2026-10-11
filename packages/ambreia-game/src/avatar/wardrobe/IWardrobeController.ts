import type {IAvatarImage} from '@ambreia/avatar/IAvatarImage';
import type {IAvatarImageListener} from '@ambreia/avatar/IAvatarImageListener';
import type {ISessionDataManager} from '../../session/ISessionDataManager';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import type {IAvatarEditorMessageHandler} from '../IAvatarEditorMessageHandler';
import type {IFigureData} from '../figuredata/IFigureData';

/** Editor-core surface used by the wardrobe side panel and its slots. */
export interface IWardrobeController
{
    readonly handler: IAvatarEditorMessageHandler | null;

    readonly figureData: IFigureData | null;

    readonly clubMemberLevel: number;

    readonly windowManager: IHabboWindowManager | null;

    readonly sessionData: ISessionDataManager | null;

    gender: string;

    getBoolean(key: string): boolean;

    getInteger(key: string, defaultValue: number): number;

    verifyClubLevel(): boolean;

    loadAvatarInEditor(figure: string, gender: string, clubLevel?: number): void;

    getAssetBitmap(name: string): ImageBitmap | null;

    createAvatarImage(
        figureString: string,
        scale: string,
        gender: string | null,
        listener: IAvatarImageListener | null,
        effectListener?: unknown
    ): IAvatarImage | null;
}
