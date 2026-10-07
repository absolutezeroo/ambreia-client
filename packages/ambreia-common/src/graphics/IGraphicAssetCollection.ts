/**
 * IGraphicAssetCollection
 *
 * @see com.sulake.room.object.visualization.utils.class_3367
 *
 * Interface for managing collections of graphic assets with palette support and reference counting.
 */
import type {Texture} from 'pixi.js';
import type {IDisposable} from '../IDisposable';
import type {IGraphicAsset} from './IGraphicAsset';

export interface IGraphicAssetCollection extends IDisposable
{
    // AS3: sources/win63_version/room/object/visualization/utils/class_1805.as::addReference()
    addReference(): void;

    // AS3: sources/win63_version/room/object/visualization/utils/class_1805.as::removeReference()
    removeReference(): void;

    // AS3: sources/win63_version/room/object/visualization/utils/class_1805.as::getReferenceCount()
    getReferenceCount(): number;

    getLastReferenceTimestamp(): number;

    // AS3: sources/win63_version/room/object/visualization/utils/class_1805.as::define()
    define(data: Record<string, unknown>): boolean;

    // AS3: sources/win63_version/room/object/visualization/utils/class_1805.as::getAsset()
    getAsset(name: string): IGraphicAsset | null;

    // AS3: sources/win63_version/room/object/visualization/utils/class_1805.as::getAssetWithPalette()
    getAssetWithPalette(name: string, paletteName: string): IGraphicAsset | null;

    // AS3: sources/win63_version/room/object/visualization/utils/class_1805.as::getPaletteNames()
    getPaletteNames(): string[];

    // AS3: sources/win63_version/room/object/visualization/utils/class_1805.as::getPaletteColors()
    getPaletteColors(paletteName: string): [number, number] | null;

    // AS3: sources/win63_version/room/object/visualization/utils/class_1805.as::getPaletteXML()
    getPaletteXML(paletteName: string): Record<string, unknown> | null;

    // AS3: sources/win63_version/room/object/visualization/utils/class_1805.as::addAsset()
    addAsset(name: string, texture: Texture, override: boolean, offsetX?: number, offsetY?: number, flipH?: boolean, flipV?: boolean): boolean;

    // AS3: sources/win63_version/room/object/visualization/utils/class_1805.as::disposeAsset()
    disposeAsset(name: string): void;
}
