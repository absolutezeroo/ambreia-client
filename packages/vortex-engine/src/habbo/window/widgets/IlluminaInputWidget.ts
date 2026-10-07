import type {IIlluminaInputWidget} from '@ambreia/ui/kit/widgets/IIlluminaInputWidget';
import type {IIlluminaInputHandler} from '@ambreia/ui/kit/widgets/IIlluminaInputHandler';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import {PropertyStruct} from '@ambreia/ui/utils/PropertyStruct';
import {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import {WindowKeyboardEvent} from '@ambreia/ui/events/WindowKeyboardEvent';
import type {IIterator} from '@ambreia/ui/utils/IIterator';
import {EmptyIterator} from '@ambreia/ui/iterators/EmptyIterator';

/**
 * Illumina input field widget.
 *
 * Provides a text input field with optional submit button, empty message
 * placeholder, and multiline support. Submit handler is called when
 * the user presses Enter or clicks the submit button.
 *
 * In the AS3 version, uses ITextFieldWindow, ILabelWindow, and handles
 * WindowKeyboardEvent for Enter key detection. In the TypeScript port,
 * input state is stored for the UI layer.
 *
 * @see sources/win63_version/habbo/window/widgets/IlluminaInputWidget.as
 */
export class IlluminaInputWidget implements IIlluminaInputWidget
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::TYPE
    public static readonly TYPE: string = 'illumina_input';

    private static readonly BUTTON_CAPTION_KEY: string = 'illumina_input:button_caption';
    private static readonly EMPTY_MESSAGE_KEY: string = 'illumina_input:empty_message';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::MULTILINE_KEY
    private static readonly MULTILINE_KEY: string = 'illumina_input:multiline';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::MAX_CHARS_KEY
    private static readonly MAX_CHARS_KEY: string = 'illumina_input:max_chars';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::SINGLE_LINE_HEIGHT
    private static readonly SINGLE_LINE_HEIGHT: number = 28;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::BUTTON_CAPTION_DEFAULT
    private static readonly BUTTON_CAPTION_DEFAULT: string = '${widgets.chatinput.say}';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::EMPTY_MESSAGE_DEFAULT
    private static readonly EMPTY_MESSAGE_DEFAULT: string = '';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::MULTILINE_DEFAULT
    private static readonly MULTILINE_DEFAULT: boolean = false;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::MAX_CHARS_DEFAULT
    private static readonly MAX_CHARS_DEFAULT: number = 0;

    /** AS3's `_SafeStr_4667.setParamFlag(2048, multiline)`. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::set multiline()
    private static readonly PARAM_FLAG_MULTILINE: number = 2048;
    private static readonly ENTER_KEY_CODE: number = 13;

    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;

    private _root: IWindowContainer | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::_submitButton
    private _submitButton: IWindow | null = null;
    private _input: IWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::_emptyMessageLabel
    private _emptyMessageLabel: IWindow | null = null;

    private _widgetProcedureBound: ((event: WindowEvent, window: IWindow) => void);

    constructor(window: IWidgetWindow, windowManager: IHabboWindowManager)
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        this._widgetProcedureBound = this.widgetProcedure.bind(this);

        const root = this._windowManager.buildWidgetLayout('illumina_input_xml') as IWindowContainer | null;

        if(root)
        {
            this._root = root;
            root.width = this._widgetWindow.width;

            this._submitButton = root.findChildByName('submit');
            this._input = root.findChildByName('input');
            this._emptyMessageLabel = root.findChildByName('empty_message');

            // Through the accessors, not the fields: AS3 assigns the four defaults by
            // property, and the setters are the only thing that reaches the submit
            // button, the placeholder label and the input. Writing the fields — as this
            // did — left the send button captionless, because `illumina_input:button_caption`
            // appears in no layout and the default here is its only source.
            this.buttonCaption = String(IlluminaInputWidget.BUTTON_CAPTION_DEFAULT);
            this.emptyMessage = IlluminaInputWidget.EMPTY_MESSAGE_DEFAULT;
            this.multiline = IlluminaInputWidget.MULTILINE_DEFAULT;
            this.maxChars = IlluminaInputWidget.MAX_CHARS_DEFAULT;

            this.refresh();

            root.procedure = this._widgetProcedureBound;
            this._widgetWindow.rootWindow = root as unknown as IWindow;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    private _message: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::get message()
    public get message(): string
    {
        return this._message;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::set message()
    public set message(value: string)
    {
        this._message = value;
    }

    private _submitHandler: IIlluminaInputHandler | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::get submitHandler()
    public get submitHandler(): IIlluminaInputHandler | null
    {
        return this._submitHandler;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::set submitHandler()
    public set submitHandler(value: IIlluminaInputHandler | null)
    {
        this._submitHandler = value;
    }

    private _buttonCaption: string = '${widgets.chatinput.say}';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::get buttonCaption()
    public get buttonCaption(): string
    {
        return this._buttonCaption;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::set buttonCaption()
    public set buttonCaption(value: string)
    {
        this._buttonCaption = value;

        if(this._submitButton)
        {
            this._submitButton.caption = value;
            this._submitButton.visible = value !== null && value.length > 0;
        }

        this.refresh();
    }

    private _emptyMessage: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::get emptyMessage()
    public get emptyMessage(): string
    {
        return this._emptyMessage;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::set emptyMessage()
    public set emptyMessage(value: string)
    {
        this._emptyMessage = value;

        if(this._emptyMessageLabel)
        {
            this._emptyMessageLabel.caption = value;
        }
    }

    private _multiline: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::get multiline()
    public get multiline(): boolean
    {
        return this._multiline;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::set multiline()
    public set multiline(value: boolean)
    {
        this._multiline = value;

        if(this._input !== null)
        {
            (this._input as unknown as ITextFieldWindow).multiline = value;
        }

        if(this._root !== null && this._widgetWindow !== null)
        {
            (this._root as unknown as IWindow).setParamFlag(IlluminaInputWidget.PARAM_FLAG_MULTILINE, value);
            (this._root as unknown as IWindow).height = value ? this._widgetWindow.height : IlluminaInputWidget.SINGLE_LINE_HEIGHT;
        }
    }

    private _maxChars: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::get maxChars()
    public get maxChars(): number
    {
        return this._maxChars;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::set maxChars()
    public set maxChars(value: number)
    {
        this._maxChars = value;

        if(this._input !== null)
        {
            (this._input as unknown as ITextFieldWindow).maxChars = value;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::get properties()
    public get properties(): PropertyStruct[]
    {
        if(this._disposed) return [];

        return [
            new PropertyStruct(IlluminaInputWidget.BUTTON_CAPTION_KEY, this._buttonCaption),
            new PropertyStruct(IlluminaInputWidget.EMPTY_MESSAGE_KEY, this._emptyMessage),
            new PropertyStruct(IlluminaInputWidget.MULTILINE_KEY, this._multiline),
            new PropertyStruct(IlluminaInputWidget.MAX_CHARS_KEY, this._maxChars),
        ];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::set properties()
    public set properties(values: PropertyStruct[])
    {
        for(const prop of values)
        {
            switch(prop.key)
            {
                case IlluminaInputWidget.BUTTON_CAPTION_KEY:
                    this.buttonCaption = String(prop.value);
                    break;
                case IlluminaInputWidget.EMPTY_MESSAGE_KEY:
                    this.emptyMessage = String(prop.value);
                    break;
                case IlluminaInputWidget.MULTILINE_KEY:
                    this.multiline = Boolean(prop.value);
                    break;
                case IlluminaInputWidget.MAX_CHARS_KEY:
                    this.maxChars = Number(prop.value);
                    break;
            }
        }
    }

    /**
	 * Submit the current message via the handler.
	 *
	 * Takes no argument: AS3 passes the widget window it was constructed with, so callers cannot
	 * submit on behalf of a different widget.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::submitMessage()
    public submitMessage(): void
    {
        if(this._submitHandler && this._widgetWindow)
        {
            this._submitHandler.onInput(this._widgetWindow, this._message);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        if(this._root)
        {
            this._root.procedure = null;
            this._root.dispose();
            this._root = null;
        }

        this._submitButton = null;
        this._input = null;
        this._emptyMessageLabel = null;

        if(this._widgetWindow)
        {
            this._widgetWindow.rootWindow = null;
        }

        this._widgetWindow = null;
        this._windowManager = null;
        this._submitHandler = null;
    }

    /**
	 * Widget procedure handling input events.
	 *
	 * Handles WE_CHANGE (input text changed), WKE_KEY_DOWN (Enter submits),
	 * and WME_CLICK on the submit button.
	 *
	 * @param event - The window event
	 * @param window - The source window
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::widgetProcedure()
    private widgetProcedure(event: WindowEvent, window: IWindow): void
    {
        if(this._disposed) return;

        switch(event.type)
        {
            case WindowEvent.WE_CHANGE:
            {
                if(window === this._input)
                {
                    this._message = window.caption ?? '';
                    this.refresh();
                }
                break;
            }
            case WindowKeyboardEvent.KEY_DOWN:
            {
                const keyEvent = event as WindowKeyboardEvent;

                if(keyEvent.keyCode === IlluminaInputWidget.ENTER_KEY_CODE && !this._multiline)
                {
                    if(this._submitHandler && this._message.length > 0)
                    {
                        this.submitMessage();
                        this._message = '';

                        if(this._input)
                        {
                            this._input.caption = '';
                        }

                        this.refresh();
                    }
                }
                break;
            }
            case WindowMouseEvent.CLICK:
            {
                if(window === this._submitButton)
                {
                    if(this._submitHandler && this._message.length > 0)
                    {
                        this.submitMessage();
                        this._message = '';

                        if(this._input)
                        {
                            this._input.caption = '';
                        }

                        this.refresh();
                    }
                }
                break;
            }
        }
    }

    /**
	 * Refresh the input widget layout.
	 *
	 * Shows/hides the empty message label based on input content,
	 * and updates the input field width.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaInputWidget.as::refresh()
    private refresh(): void
    {
        if(this._emptyMessageLabel)
        {
            this._emptyMessageLabel.visible = (this._message.length === 0);
        }

        // Without this the field runs the full width of the border and slides under the
        // submit button, so the tail of a long message is typed behind it.
        if(this._input !== null && this._root !== null)
        {
            const rightEdge = this._submitButton !== null && this._submitButton.visible
                ? this._submitButton.x
                : (this._root as unknown as IWindow).width;

            this._input.width = rightEdge - this._input.x * 2;
        }
    }
}
