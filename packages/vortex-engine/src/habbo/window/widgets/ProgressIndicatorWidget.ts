import type {IProgressIndicatorWidget} from '@ambreia/ui/kit/widgets/IProgressIndicatorWidget';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import {PropertyStruct} from '@ambreia/ui/utils/PropertyStruct';
import {ProgressIndicatorMode} from '@ambreia/ui/kit/enum/ProgressIndicatorMode';
import {ProgressIndicatorStyle} from '@ambreia/ui/kit/enum/ProgressIndicatorStyle';
import type {IIterator} from '@ambreia/ui/utils/IIterator';
import {EmptyIterator} from '@ambreia/ui/iterators/EmptyIterator';

/**
 * Progress bar widget.
 *
 * Displays a row of progress indicator disks that can operate in
 * "position" mode (single active disk) or "progress" mode (filled bar).
 * Supports configurable size, style, and position.
 *
 * In the AS3 version, uses IItemListWindow with IStaticBitmapWrapperWindow
 * items. In the TypeScript port, progress state is stored for the UI layer.
 *
 * @see sources/win63_version/habbo/window/widgets/ProgressIndicatorWidget.as
 */
export class ProgressIndicatorWidget implements IProgressIndicatorWidget
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::TYPE
    public static readonly TYPE: string = 'progress_indicator';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::STYLE_KEY
    private static readonly STYLE_KEY: string = 'progress_indicator:style';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::SIZE_KEY
    private static readonly SIZE_KEY: string = 'progress_indicator:size';
    private static readonly POSITION_KEY: string = 'progress_indicator:position';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::MODE_KEY
    private static readonly MODE_KEY: string = 'progress_indicator:mode';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::MAXIMUM_SIZE
    private static readonly MAXIMUM_SIZE: number = 1000;

    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    private _root: IItemListWindow | null = null;

    constructor(window: IWidgetWindow, windowManager: IHabboWindowManager)
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        const root = this._windowManager.buildWidgetLayout('progress_indicator_xml') as IItemListWindow | null;

        if(root)
        {
            this._root = root;
            this._size = root.numListItems;
        }

        this._widgetWindow.setParamFlag(147456);
        this._widgetWindow.rootWindow = this._root;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::_style
    private _style: string = ProgressIndicatorStyle.FLAT;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::get style()
    public get style(): string
    {
        return this._style;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::set style()
    public set style(value: string)
    {
        this._style = value;
        this.refresh();
    }

    private _size: number = 1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::get size()
    public get size(): number
    {
        return this._root ? this._root.numListItems : this._size;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::set size()
    public set size(value: number)
    {
        const newSize = Math.min(Math.max(Math.floor(value), 1), ProgressIndicatorWidget.MAXIMUM_SIZE);

        if(!this._root)
        {
            this._size = newSize;

            return;
        }

        if(newSize === this.size) return;

        while(newSize < this.size)
        {
            this._root.removeListItemAt(this.size - 1);
        }

        while(newSize > this.size)
        {
            const template = this._root.getListItemAt(0);

            if(!template) break;

            this._root.addListItem(template.clone());
        }

        this._size = this.size;
        this.refresh();
    }

    private _position: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::get position()
    public get position(): number
    {
        return this._position;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::set position()
    public set position(value: number)
    {
        this._position = value;
        this.refresh();
    }

    private _mode: string = ProgressIndicatorMode.POSITION;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::get mode()
    public get mode(): string
    {
        return this._mode;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::set mode()
    public set mode(value: string)
    {
        this._mode = value;
        this.refresh();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::get properties()
    public get properties(): PropertyStruct[]
    {
        if(this._disposed) return [];

        return [
            new PropertyStruct(ProgressIndicatorWidget.STYLE_KEY, this._style, PropertyStruct.STRING, false, ProgressIndicatorStyle.ALL),
            new PropertyStruct(ProgressIndicatorWidget.SIZE_KEY, this.size, PropertyStruct.UINT),
            new PropertyStruct(ProgressIndicatorWidget.POSITION_KEY, this._position, PropertyStruct.UINT),
            new PropertyStruct(ProgressIndicatorWidget.MODE_KEY, this._mode, PropertyStruct.STRING, false, ProgressIndicatorMode.ALL),
        ];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::set properties()
    public set properties(values: PropertyStruct[])
    {
        for(const prop of values)
        {
            switch(prop.key)
            {
                case ProgressIndicatorWidget.STYLE_KEY:
                    this.style = String(prop.value);
                    break;
                case ProgressIndicatorWidget.SIZE_KEY:
                    this.size = Number(prop.value);
                    break;
                case ProgressIndicatorWidget.POSITION_KEY:
                    this.position = Number(prop.value);
                    break;
                case ProgressIndicatorWidget.MODE_KEY:
                    this.mode = String(prop.value);
                    break;
            }
        }
    }

    /**
	 * Get the active state of each disk for rendering.
	 *
	 * @returns Array of booleans, one per disk
	 */
    public getDiskStates(): boolean[]
    {
        const states: boolean[] = [];

        for(let i = 0; i < this.size; i++)
        {
            states.push(this.isDiskActive(i));
        }

        return states;
    }

    /**
	 * Get the asset name for a disk at the given index.
	 */
    public getDiskAssetName(index: number): string
    {
        const active = this.isDiskActive(index);

        return 'progress_disk_' + this._style + (active ? '_on' : '_off');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::refresh()
    private refresh(): void
    {
        if(!this._root) return;

        for(let i = 0; i < this.size; i++)
        {
            const item = this._root.getListItemAt(i) as IStaticBitmapWrapperWindow | null;

            if(!item) continue;

            item.assetUri = this.getDiskAssetName(i);

            const bitmap = item.bitmapData;

            if(bitmap)
            {
                item.width = bitmap.width;
                item.height = bitmap.height;
                this._root.height = bitmap.height;
            }
        }
    }

    private isDiskActive(index: number): boolean
    {
        switch(this._mode)
        {
            case ProgressIndicatorMode.POSITION:
                return index + 1 === this._position;
            case ProgressIndicatorMode.PROGRESS:
                return index < this._position;
            default:
                return false;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProgressIndicatorWidget.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        if(this._root)
        {
            this._root.dispose();
            this._root = null;
        }

        if(this._widgetWindow)
        {
            this._widgetWindow.rootWindow = null;
            this._widgetWindow = null;
        }

        this._windowManager = null;
        this._disposed = true;
    }
}
