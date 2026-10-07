import type {Texture} from 'pixi.js';
import type {IAvatarDataContainer} from './animation/IAvatarDataContainer';
import type {IAnimationLayerData} from './animation/IAnimationLayerData';
import type {ISpriteDataContainer} from './animation/ISpriteDataContainer';
import type {IAvatarFigureContainer} from './IAvatarFigureContainer';
import type {IPartColor} from './structure/figure/IPartColor';
import type {IAvatarPartSpriteSet} from './AvatarPartSprite';
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';
import type {RoomObjectSpriteData} from '@ambreia/common/graphics/RoomObjectSpriteData';

/**
 * Interface for avatar images that can be rendered.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/IAvatarImage.as (IAvatarImage)
 */
export interface IAvatarImage
{
    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::get avatarSpriteData()
    readonly avatarSpriteData: IAvatarDataContainer | null;
    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::get animationHasResetOnToggle()
    readonly animationHasResetOnToggle: boolean;
    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::get mainAction()
    readonly mainAction: string;
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::get disposed()
    disposed?: boolean;

    /**
     * AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::getCroppedImage()
     *
     * AS3 returns a `BitmapData`; this port returns a PixiJS `Texture` over an `OffscreenCanvas`.
     * Typed rather than `any` because the difference matters at every call site — a texture handed
     * to `drawImage()` or to `IBitmapWrapperWindow.bitmap` fails at runtime, not at build time.
     * Convert with `AvatarTextureUtils`.
     */
    getCroppedImage(setType: string, scale?: number): Texture | null;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::getImage()
    // Same `Texture`-not-`BitmapData` caveat as `getCroppedImage()` above.
    getImage(setType: string, hightlight: boolean, scale?: number): Texture | null;

    /**
     * The same avatar as independent parts rather than one composed texture, or null when it cannot
     * be expressed that way and the caller should use `getImage()`.
     */
    // TS-only: no AS3 counterpart; see `AvatarRenderMode`.
    getPartSprites(setType: string): IAvatarPartSpriteSet | null;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::getServerRenderData()
    getServerRenderData(): RoomObjectSpriteData[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/_SafeCls_1793.as::getHeadRegPoints()
    getHeadRegPoints(scale: string): { x: number; y: number };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/_SafeCls_1793.as::getFaceOffset()
    getFaceOffset(scale: string): { x: number; y: number };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/_SafeCls_1793.as::isBlocked()
    isBlocked(): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImage.as::resetCache()
    // Not part of AS3's own IAvatarImage-equivalent (_SafeCls_1793.as) - AS3's caller
    // (AvatarRenderManager.resetAllCaches()) holds concrete AvatarImage references, not
    // the interface. Added here because this port stores AvatarImage as IAvatarImage.
    resetCache(): void;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::setDirection()
    setDirection(setType: string, direction: number): void;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::setDirectionAngle()
    setDirectionAngle(setType: string, angle: number): void;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::updateAnimationByFrames()
    updateAnimationByFrames(frames?: number): void;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::getScale()
    getScale(): string;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::getSprites()
    getSprites(): ISpriteDataContainer[];

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::getLayerData()
    getLayerData(sprite: ISpriteDataContainer): IAnimationLayerData | null;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::getAsset()
    getAsset(name: string): IGraphicAsset | null;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::getDirection()
    getDirection(): number;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::getFigure()
    getFigure(): IAvatarFigureContainer;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::getPartColor()
    getPartColor(partType: string): IPartColor | null;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::isAnimating()
    isAnimating(): boolean;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::getCanvasOffsets()
    getCanvasOffsets(): number[];

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::initActionAppends()
    initActionAppends(): void;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::endActionAppends()
    endActionAppends(): void;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::appendAction()
    appendAction(actionType: string, ...args: any[]): boolean;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::isPlaceholder()
    isPlaceholder(): boolean;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::forceActionUpdate()
    forceActionUpdate(): void;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::resetAnimationFrameCounter()
    resetAnimationFrameCounter(): void;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_1793.as::disposeInactiveActionCache()
    disposeInactiveActionCache(): void;

    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::dispose()
    dispose(): void;
}
