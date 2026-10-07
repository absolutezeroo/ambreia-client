import type {IDisposable} from '../IDisposable';
import type {IAsset} from './IAsset';
import type {AssetTypeDeclaration} from './AssetTypeDeclaration';
import type {AssetLoaderStruct} from './AssetLoaderStruct';

/**
 * IAssetLibrary Interface
 *
 * Based on AS3: com.sulake.core.assets.IAssetLibrary
 *
 * A library that manages a collection of assets.
 */
export interface IAssetLibrary extends IDisposable
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::get url()
    readonly url: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::get name()
    readonly name: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::get isReady()
    readonly isReady: boolean;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::get numAssets()
    readonly numAssets: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::get manifest()
    readonly manifest: object | null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::get nameArray()
    readonly nameArray: string[];

    loadFromUrl(url: string, isReady?: boolean): Promise<void>;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::loadFromResource()
    loadFromResource(manifest: object, resourceData: unknown): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::unload()
    unload(): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::loadAssetFromFile()
    loadAssetFromFile(name: string, url: string, mimeType?: string, id?: number): AssetLoaderStruct;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::getAssetByName()
    getAssetByName(name: string): IAsset | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::getAssetByContent()
    getAssetByContent(content: unknown): IAsset | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::getAssetByIndex()
    getAssetByIndex(index: number): IAsset | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::getAssetIndex()
    getAssetIndex(asset: IAsset): number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::hasAsset()
    hasAsset(name: string): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::setAsset()
    setAsset(name: string, asset: IAsset, overwrite?: boolean): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::createAsset()
    createAsset(name: string, declaration: AssetTypeDeclaration): IAsset | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::removeAsset()
    removeAsset(asset: IAsset): IAsset | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::registerAssetTypeDeclaration()
    registerAssetTypeDeclaration(declaration: AssetTypeDeclaration, isShared?: boolean): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::getAssetTypeDeclarationByMimeType()
    getAssetTypeDeclarationByMimeType(mimeType: string, checkShared?: boolean): AssetTypeDeclaration | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::getAssetTypeDeclarationByClass()
    getAssetTypeDeclarationByClass(assetClass: new (...args: unknown[]) => IAsset, checkShared?: boolean): AssetTypeDeclaration | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/IAssetLibrary.as::getAssetTypeDeclarationByFileName()
    getAssetTypeDeclarationByFileName(fileName: string, checkShared?: boolean): AssetTypeDeclaration | null;
}
