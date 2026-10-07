import type {IAsset} from '@ambreia/common/assets/IAsset';
import type EventEmitter from 'eventemitter3';
import type {AnimationManager} from './animation/AnimationManager';
import type {IAvatarFigureContainer} from './IAvatarFigureContainer';
import type {IAvatarImage} from './IAvatarImage';
import type {IAvatarImageListener} from './IAvatarImageListener';
import type {IAvatarEffectListener} from './IAvatarEffectListener';
import type {IFigureData} from './structure/IFigureData';
import type {IGraphicAsset} from '@room/object/visualization/utils/IGraphicAsset';

/**
 * Interface for the avatar render manager component.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/IAvatarRenderManager.as
 */
export interface IAvatarRenderManager
{
    /**
     * `gender` is `param3:String = null` in the AS3 (`_SafeCls_581.as`), and passing nothing is a
     * meaningful choice, not an omission: a gender makes the manager run `validateAvatarFigure()`,
     * which completes the figure with every mandatory part. A caller rendering a single garment —
     * `AvatarEditor`'s thumbnails — wants the garment alone and passes null.
     */
    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::createAvatarImage()
    createAvatarImage(
        figureString: string,
        scale: string,
        gender: string | null,
        listener: IAvatarImageListener | null,
        effectListener: IAvatarEffectListener | null
    ): IAvatarImage | null;

    /**
     * The renderer's own asset library, by name.
     *
     * AS3's `_SafeCls_582` extends `Component`, so `getAssetByName()` comes from the base and any
     * holder of the interface can call it — which `AvatarEditorGridPartItem` does, to composite a
     * clothing thumbnail out of the individual body-part sprites. The port keeps that library
     * private to `AvatarRenderManager`, so it has to be exposed deliberately.
     */
    // Derived name: `getAssetByName` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::getAssetByName()
    getAssetByName(name: string): IAsset | null;

    /**
     * Resolves an avatar **sprite** by its figure name, e.g. `h_std_ch_3216_2_0`.
     *
     * TS-only: AS3 needs no such method — Flash's asset library is flat, so
     * `getAssetByName("h_std_…")` finds the sprite directly and that is exactly what
     * `AvatarEditorGridPartItem` calls. This port's `.nitro` bundles register their spritesheet
     * frames **library-prefixed** (`hh_human_shirt_h_std_ch_210_0_0`) and carry a separate `assets`
     * map of unprefixed names, offsets and `source` aliases — so the equivalent lookup is the one
     * the room renderer already uses, `AssetAliasCollection.getAsset()`, which resolves both.
     *
     * Calling `getAssetByName()` with a sprite name returns null instead, which is why every
     * clothing thumbnail came up as the download icon.
     */
    // TS-only: see the note above — AS3 has no counterpart because its library is flat.
    getSpriteAsset(name: string): IGraphicAsset | null;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::getFigureData()
    getFigureData(): IFigureData;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::getFigureStringWithFigureIds()
    getFigureStringWithFigureIds(figureString: string, gender: string, figureIds: number[]): string;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::isValidFigureSetForGender()
    isValidFigureSetForGender(setId: number, gender: string): boolean;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::getMandatoryAvatarPartSetIds()
    getMandatoryAvatarPartSetIds(gender: string, clubLevel: number): string[];

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::createFigureContainer()
    createFigureContainer(figureString: string): IAvatarFigureContainer;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/_SafeCls_581.as::resolveClubLevel()
    resolveClubLevel(container: IAvatarFigureContainer, gender: string, partTypes?: string[] | null): number;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::isFigureReady()
    isFigureReady(figure: IAvatarFigureContainer): boolean;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::downloadFigure()
    downloadFigure(figure: IAvatarFigureContainer, listener: IAvatarImageListener | null): void;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::injectFigureData()
    injectFigureData(data: any): void;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::get isReady()
    get isReady(): boolean;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::get events()
    get events(): EventEmitter;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::get effectMap()
    get effectMap(): Map<string, any>;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::getItemIds()
    getItemIds(): string[];

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::getAnimationManager()
    getAnimationManager(): AnimationManager | null;

    /**
	 * Clears the two caches, which are not the same cache
	 *
	 * `resetAllCaches()` drops what each live avatar has rendered; `resetAssetManager()` drops the
	 * alias table behind those renders; `purgeAssets()` drops the downloaded libraries themselves.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::resetAllCaches()
    resetAllCaches(): void;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::resetAssetManager()
    resetAssetManager(): void;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::purgeAssets()
    purgeAssets(): void;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::get mode()
    get mode(): string;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::set mode()
    set mode(value: string);

    /**
	 * The silhouette shown in place of a user this client is blocking.
	 *
	 * The figure string is accepted and discarded — the image always renders `hd-99999-99999`,
	 * so a blocked user's real look never reaches the screen.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_581.as::createBlockedAvatarImage()
    createBlockedAvatarImage(figureString: string, scale: string): IAvatarImage;
}
