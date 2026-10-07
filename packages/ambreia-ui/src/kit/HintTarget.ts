import type {IWindow} from '../IWindow';

/**
 * Data container for a hint target.
 *
 * @see sources/win63_version/habbo/window/HintTarget.as
 */
export class HintTarget
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintTarget.as::HintTarget()
    constructor(window: IWindow, key: string, style: number)
    {
        this._window = window;
        this._key = key;
        this._style = style;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintTarget.as::_key
    private _key: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintTarget.as::get key()
    public get key(): string
    {
        return this._key;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintTarget.as::set key()
    public set key(value: string)
    {
        this._key = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintTarget.as::_window
    private _window: IWindow;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintTarget.as::get window()
    public get window(): IWindow
    {
        return this._window;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintTarget.as::set window()
    public set window(value: IWindow)
    {
        this._window = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintTarget.as::_style
    private _style: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintTarget.as::get style()
    public get style(): number
    {
        return this._style;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintTarget.as::set style()
    public set style(value: number)
    {
        this._style = value;
    }
}
