import {Texture} from 'pixi.js';
import type {ILazyAsset} from './ILazyAsset';
import type {IAsset} from './IAsset';
import type {AssetTypeDeclaration} from './AssetTypeDeclaration';
import {Logger} from '../utils/Logger';

const log = Logger.getLogger('core.assets.BitmapDataAsset');

/**
 * IPoint structure for offset
 */
export interface IPoint
{
    x: number;
    y: number;
}

/**
 * IRectangle structure for region
 */
export interface IRectangle
{
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * BitmapDataAsset
 *
 * Based on AS3: com.sulake.core.assets.BitmapDataAsset
 *
 * Asset that holds bitmap/image data. Supports lazy loading.
 * Uses PixiJS Texture instead of AS3 BitmapData.
 */
export class BitmapDataAsset implements ILazyAsset
{
    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::name
    public name: string = '';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/BitmapDataAsset.as::_unknown
    private _unknown: unknown = null;
    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::_bitmap
    private _bitmap: Texture | null = null;
    private readonly _declaration: AssetTypeDeclaration;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/BitmapDataAsset.as::_url
    private readonly _url: string;

    constructor(declaration: AssetTypeDeclaration, url: string = '')
    {
        this._declaration = declaration;
        this._url = url;
        BitmapDataAsset._instances++;
    }

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::_instances
    private static _instances: number = 0;

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::get instances()
    static get instances(): number
    {
        return BitmapDataAsset._instances;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/BitmapDataAsset.as::_allocatedByteCount
    private static _allocatedByteCount: number = 0;

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::get allocatedByteCount()
    static get allocatedByteCount(): number
    {
        return BitmapDataAsset._allocatedByteCount;
    }

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::_offset
    private _offset: IPoint = {x: 0, y: 0};

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::get offset()
    get offset(): IPoint
    {
        return this._offset;
    }

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::_rectangle
    private _rectangle: IRectangle | null = null;

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::get rectangle()
    get rectangle(): IRectangle | null
    {
        if(!this._rectangle && this._bitmap)
        {
            this._rectangle = {
                x: 0,
                y: 0,
                width: this._bitmap.width,
                height: this._bitmap.height,
            };
        }

        return this._rectangle;
    }

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::_flipH
    private _flipH: boolean = false;

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::get flipH()
    get flipH(): boolean
    {
        return this._flipH;
    }

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::_flipV
    private _flipV: boolean = false;

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::get flipV()
    get flipV(): boolean
    {
        return this._flipV;
    }

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::get url()
    get url(): string
    {
        return this._url;
    }

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::get content()
    get content(): Texture | null
    {
        if(!this._bitmap)
        {
            this.prepareLazyContent();
        }

        return this._bitmap;
    }

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::get declaration()
    get declaration(): AssetTypeDeclaration
    {
        return this._declaration;
    }

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::dispose()
    dispose(): void
    {
        if(!this._disposed)
        {
            BitmapDataAsset._instances--;

            if(this._bitmap)
            {
                try
                {
                    BitmapDataAsset._allocatedByteCount -= this._bitmap.width * this._bitmap.height * 4;
                    this._bitmap.destroy(true);
                }
                catch (_e)
                {
                    log.debug('Texture.destroy() failed (already destroyed?)', _e);
                }
            }

            this._unknown = null;
            this._bitmap = null;
            this._rectangle = null;
            this._disposed = true;
        }
    }

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::setUnknownContent()
    setUnknownContent(content: unknown): void
    {
        if(content === null)
        {
            return;
        }

        if(this._bitmap && this._bitmap === content)
        {
            return;
        }

        if(this._bitmap)
        {
            this._bitmap.destroy(true);
            this._bitmap = null;
        }

        this._unknown = content;
    }

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::prepareLazyContent()
    prepareLazyContent(): void
    {
        if(this._unknown === null)
        {
            return;
        }

        if(this._unknown instanceof Texture)
        {
            this._bitmap = this._unknown;
            this._unknown = null;
            return;
        }

        if(this._unknown instanceof BitmapDataAsset)
        {
            const other = this._unknown;
            this._bitmap = other._bitmap;
            this._offset = {...other._offset};
            this._flipH = other._flipH;
            this._flipV = other._flipV;
            this._unknown = null;
            return;
        }

        if(typeof HTMLImageElement !== 'undefined' && this._unknown instanceof HTMLImageElement)
        {
            this._bitmap = Texture.from(this._unknown);
            this._unknown = null;
            return;
        }

        if(typeof ImageBitmap !== 'undefined' && this._unknown instanceof ImageBitmap)
        {
            this._bitmap = Texture.from(this._unknown);
            this._unknown = null;
            return;
        }

        if(typeof HTMLCanvasElement !== 'undefined' && this._unknown instanceof HTMLCanvasElement)
        {
            this._bitmap = Texture.from(this._unknown);
            this._unknown = null;
            return;
        }

        log.warn('Unknown content type:', typeof this._unknown);
        this._unknown = null;
    }

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::setFromOtherAsset()
    setFromOtherAsset(asset: IAsset): void
    {
        if(asset instanceof BitmapDataAsset)
        {
            this._bitmap = asset._bitmap;
            this._offset = {...asset._offset};
            return;
        }

        throw new Error('Provided asset should be of type BitmapDataAsset');
    }

    // AS3: .../src/com/sulake/core/assets/BitmapDataAsset.as::setParamsDesc()
    setParamsDesc(params: Map<string, string>): void
    {
        for(const [key, value] of params)
        {
            switch(key)
            {
                case 'offset':
                {
                    const parts = value.split(',');
                    this._offset.x = parseInt(parts[0], 10) || 0;
                    this._offset.y = parseInt(parts[1], 10) || 0;
                    break;
                }

                case 'region':
                {
                    const parts = value.split(',');
                    this._rectangle = {
                        x: parseInt(parts[0], 10) || 0,
                        y: parseInt(parts[1], 10) || 0,
                        width: parseInt(parts[2], 10) || 0,
                        height: parseInt(parts[3], 10) || 0,
                    };
                    break;
                }

                case 'flipH':
                    this._flipH = value === '1' || value === 'true';
                    break;

                case 'flipV':
                    this._flipV = value === '1' || value === 'true';
                    break;
            }
        }
    }
}
