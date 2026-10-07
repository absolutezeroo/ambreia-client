import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IBitmapWrapperWindow} from './IBitmapWrapperWindow';
import {BitmapDataController} from './BitmapDataController';
import type {PropertyStruct} from '../utils/PropertyStruct';
import type {WindowEvent} from '../events/WindowEvent';

/**
 * Controller for bitmap wrapper windows.
 *
 * Extends BitmapDataController with programmatic bitmap setting.
 * Used for dynamic bitmaps set by code (e.g. avatar rendering).
 *
 * @see sources/win63_version/core/window/components/BitmapWrapperController.as
 */
export class BitmapWrapperController extends BitmapDataController implements IBitmapWrapperWindow
{
    constructor(
        name: string,
        type: number,
        style: number,
        param: number,
        context: IWindowContext,
        rect: { x: number; y: number; width: number; height: number },
        parent: IWindow | null = null,
        procedure: ((event: WindowEvent, window: IWindow) => void) | null = null,
        tags: string[] | null = null,
        properties: unknown[] | null = null,
        id: number = 0,
        dynamicStyle: string = ''
    )
    {
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id, dynamicStyle);
    }

    private _disposesBitmap: boolean = false;

    /**
	 * Whether this window owns the bitmap and should dispose it.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapWrapperController.as::get disposesBitmap()
    public get disposesBitmap(): boolean
    {
        return this._disposesBitmap;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapWrapperController.as::set disposesBitmap()
    public set disposesBitmap(value: boolean)
    {
        this._disposesBitmap = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapWrapperController.as::_bitmapAssetName
    private _bitmapAssetName: string = '';

    /**
	 * The asset name used to reference this bitmap.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapWrapperController.as::get bitmapAssetName()
    public get bitmapAssetName(): string
    {
        return this._bitmapAssetName;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapWrapperController.as::set bitmapAssetName()
    public set bitmapAssetName(value: string)
    {
        this._bitmapAssetName = value;
    }

    /**
	 * The programmatic bitmap for this window.
	 * Disposes the old bitmap if `_disposesBitmap` is true.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapWrapperController.as::get bitmap()
    public get bitmap(): ImageBitmap | null
    {
        return this._bitmapData;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapWrapperController.as::set bitmap()
    public set bitmap(value: ImageBitmap | null)
    {
        if(this._disposesBitmap && this._bitmapData && this._bitmapData !== value)
        {
            this._bitmapData.close();
        }

        this._bitmapData = value;

        this.fitSize();
        this._context.invalidate(this, null, 1);
    }

    /**
	 * Overrides bitmapData setter to delegate to bitmap setter.
	 */
    public override get bitmapData(): ImageBitmap | null
    {
        return this._bitmapData;
    }

    public override set bitmapData(value: ImageBitmap | null)
    {
        this.bitmap = value;
    }

    public override get properties(): unknown[]
    {
        const props = super.properties;

        props.unshift(this.createProperty('handle_bitmap_disposing', this._disposesBitmap));
        props.unshift(this.createProperty('bitmap_asset_name', this._bitmapAssetName));

        return props;
    }

    public override set properties(value: unknown[])
    {
        for(const item of value)
        {
            const prop = item as PropertyStruct;

            switch(prop.key)
            {
                case 'handle_bitmap_disposing':
                    this._disposesBitmap = !!prop.value;
                    break;
                case 'bitmap_asset_name':
                    this._bitmapAssetName = (prop.value as string) ?? '';
                    break;
            }
        }

        super.properties = value;
    }

    public override clone(): IWindow
    {
        const cloned = super.clone() as BitmapWrapperController;

        cloned._disposesBitmap = false;
        cloned._bitmapAssetName = this._bitmapAssetName;

        return cloned;
    }

    public override dispose(): void
    {
        if(this._disposed) return;

        if(this._bitmapData)
        {
            if(this._disposesBitmap)
            {
                this._bitmapData.close();
            }

            this._bitmapData = null;
        }

        super.dispose();
    }
}
