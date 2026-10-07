import type {IDisposable} from '../../IDisposable';
import type {EventEmitter} from 'eventemitter3';

/**
 * IAssetLoader Interface
 *
 * Based on AS3: com.sulake.core.assets.loaders.class_36
 *
 * Interface for file loaders.
 */
export interface IAssetLoader extends IDisposable
{
    readonly events: EventEmitter;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/loaders/IAssetLoader.as::get url()
    readonly url: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/loaders/IAssetLoader.as::get content()
    readonly content: unknown;
    readonly bytes: ArrayBuffer | null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/loaders/IAssetLoader.as::get mimeType()
    readonly mimeType: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/loaders/IAssetLoader.as::get bytesLoaded()
    readonly bytesLoaded: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/loaders/IAssetLoader.as::get bytesTotal()
    readonly bytesTotal: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/loaders/IAssetLoader.as::get errorCode()
    readonly errorCode: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/loaders/IAssetLoader.as::get id()
    readonly id: number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/loaders/IAssetLoader.as::load()
    load(url: string): void;
}

/**
 * Error codes for asset loaders
 */
export const AssetLoaderErrorCodes = {
    NONE: 0,
    IO_ERROR: 1,
    SECURITY_ERROR: 2,
} as const;
