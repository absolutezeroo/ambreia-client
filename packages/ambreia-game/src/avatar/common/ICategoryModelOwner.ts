import type {IAvatarImage} from '@ambreia/avatar/IAvatarImage';
import type {IAvatarImageListener} from '@ambreia/avatar/IAvatarImageListener';
import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import type {IAvatarEffect} from '../IAvatarEffect';
import type {IFigureData} from '../figuredata/IFigureData';
import type {IAvatarEditorView} from '../view/IAvatarEditorView';
import type {CategoryData} from './CategoryData';
import type {IAvatarEditorGridModel} from './IAvatarEditorGridModel';
import type {IFigureSetOwnership} from './IFigureSetOwnership';

/**
 * Editor-core surface consumed by category models and their views.
 *
 * The old port exposed the whole avatar-editor manager here. That made every page depend back on
 * the editor host and closed one large model/view cycle. The members below are the exact services
 * pages already used through that manager, flattened at the owner boundary.
 */
export interface ICategoryModelOwner
{
    readonly figureData: IFigureData | null;

    readonly view: IAvatarEditorView | null;

    readonly inventory: IFigureSetOwnership | null;

    readonly avatarRenderManager: IAvatarRenderManager | null;

    readonly windowManager: IHabboWindowManager | null;

    readonly connection: IConnection | null;

    readonly effectInventory: {
        setEffectSelected(effectType: number): void;

        deselectAllEffects(force: boolean): void;

        getAvatarEffects(): IAvatarEffect[];
    } | null;

    gender: string;

    readonly clubMemberLevel: number;

    generateDataContent(model: IAvatarEditorGridModel, partType: string): CategoryData | null;

    openHabboClubAdWindow(): void;

    setAvatarEffectType(effectType: number): void;

    loadAvatarInEditor(figure: string, gender: string, clubLevel?: number): void;

    getAssetBitmap(name: string): ImageBitmap | null;

    getProperty(key: string): string;

    getBoolean(key: string): boolean;

    openCatalogPage(pageName: string): void;

    createAvatarImage(
        figureString: string,
        scale: string,
        gender: string | null,
        listener: IAvatarImageListener | null,
        effectListener?: unknown
    ): IAvatarImage | null;
}
