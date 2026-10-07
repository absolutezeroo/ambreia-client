import type {IWindow} from '../IWindow';
import type {IWindowContainer} from '../IWindowContainer';
import type {IWindowContext} from '../IWindowContext';
import type {IFrameWindow} from './IFrameWindow';
import type {IHeaderWindow} from './IHeaderWindow';
import type {ILabelWindow} from './ILabelWindow';
import type {IScalerWindow} from './IScalerWindow';
import type {IMargins} from '../utils/IMargins';
import type {IIterator} from '../utils/IIterator';
import {ContainerController} from './ContainerController';
import {ContainerIterator} from '../iterators/ContainerIterator';
import {WindowController} from '../WindowController';
import type {WindowEvent} from '../events/WindowEvent';
import {PropertyStruct} from '../utils/PropertyStruct';
import {TextMargins} from '../utils/TextMargins';

/**
 * Controller for frame windows.
 *
 * A frame is a windowed container with a title bar (header),
 * content region, optional scaler for resizing, and margins.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/FrameController.as
 */
export class FrameController extends ContainerController implements IFrameWindow 
{
    // AS3: .../src/com/sulake/core/window/components/FrameController.as::TAG_TITLE_ELEMENT
    private static readonly TAG_TITLE_ELEMENT: string = '_TITLE';
    // AS3: .../src/com/sulake/core/window/components/FrameController.as::TAG_HEADER_ELEMENT
    private static readonly TAG_HEADER_ELEMENT: string = '_HEADER';
    // AS3: .../src/com/sulake/core/window/components/FrameController.as::TAG_CONTENT_ELEMENT
    private static readonly TAG_CONTENT_ELEMENT: string = '_CONTENT';
    // AS3: .../src/com/sulake/core/window/components/FrameController.as::TAG_SCALER_ELEMENT
    private static readonly TAG_SCALER_ELEMENT: string = '_SCALER';
    private _constructed: boolean = false;

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
        id: number = 0
    ) 
    {
        param = param | 0x01;
        param = param & (~0x10);

        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/FrameController.as::FrameController()
    // Moved out of the constructor: it reads `_HEADER`/`_SCALER`/named children built by
    // buildLayoutChildren(), which only runs later via completeConstruction() (see
    // WindowController.ts's phase-split) - at constructor time no children exist yet.
    protected override finalize(): void
    {
        super.finalize();

        this._constructed = true;
        this.activate();
        this.setupScaling();

        const helpButton = this.findChildByName('header_button_help');

        if(helpButton !== null)
        {
            helpButton.procedure = this.helpButtonProcedure.bind(this);
        }

        this.helpPage = this._helpPage;
        this.menuButtonVisible = false;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/FrameController.as::_title
    private _title: ILabelWindow | null = null;

    /**
     * Returns the title label window.
     */
    // AS3: .../src/com/sulake/core/window/components/FrameController.as::get title()
    public get title(): ILabelWindow 
    {
        if(!this._title) 
        {
            this._title = this.findChildByTag(FrameController.TAG_TITLE_ELEMENT) as unknown as ILabelWindow;
        }

        return this._title!;
    }

    // AS3: .../src/com/sulake/core/window/components/FrameController.as::_header
    private _header: IHeaderWindow | null = null;

    /**
     * Returns the header window.
     */
    // AS3: .../src/com/sulake/core/window/components/FrameController.as::get header()
    public get header(): IHeaderWindow 
    {
        if(!this._header) 
        {
            this._header = this.findChildByTag(FrameController.TAG_HEADER_ELEMENT) as unknown as IHeaderWindow;
        }

        return this._header!;
    }

    // AS3: .../src/com/sulake/core/window/components/FrameController.as::_content
    private _content: IWindowContainer | null = null;

    /**
     * Returns the content container window.
     */
    // AS3: .../src/com/sulake/core/window/components/FrameController.as::get content()
    public get content(): IWindowContainer 
    {
        if(!this._content) 
        {
            this._content = this.findChildByTag(FrameController.TAG_CONTENT_ELEMENT) as unknown as IWindowContainer;
        }

        return this._content!;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/FrameController.as::_margins
    private _margins: IMargins | null = null;

    /**
     * Returns the content margins.
     */
    // AS3: .../src/com/sulake/core/window/components/FrameController.as::get margins()
    public get margins(): IMargins 
    {
        if(!this._margins) 
        {
            this._margins = new TextMargins(
                this.content.left,
                this.content.top,
                this.content.right,
                this.content.bottom,
                this.marginsCallback.bind(this)
            );
        }

        return this._margins;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/FrameController.as::_helpPage
    private _helpPage: string = '';

    /**
     * Returns the help page identifier.
     */
    // AS3: .../src/com/sulake/core/window/components/FrameController.as::get helpPage()
    public get helpPage(): string 
    {
        return this._helpPage;
    }

    /**
     * Sets the help page identifier and updates help button visibility.
     */
    // AS3: .../src/com/sulake/core/window/components/FrameController.as::set helpPage()
    public set helpPage(value: string) 
    {
        this._helpPage = value;

        const helpButton = this.findChildByName('header_button_help');

        if(helpButton !== null) 
        {
            helpButton.visible = (this._helpPage !== '');
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/FrameController.as::_helpButtonAction
    private _helpButtonAction: ((helpPage: string) => void) | null = null;

    /**
     * Gets the help button action callback.
     */
    public get helpButtonAction(): (helpPage: string) => void
    {
        return this._helpButtonAction!;
    }

    /**
     * Sets the help button action callback.
     */
    // AS3: .../src/com/sulake/core/window/components/FrameController.as::set helpButtonAction()
    public set helpButtonAction(value: (helpPage: string) => void)
    {
        this._helpButtonAction = value;
    }

    /**
     * Returns the scaler window for frame resizing.
     */
    // AS3: .../src/com/sulake/core/window/components/FrameController.as::get scaler()
    public get scaler(): IScalerWindow 
    {
        return this.findChildByTag(FrameController.TAG_SCALER_ELEMENT) as unknown as IScalerWindow;
    }

    // AS3: .../src/com/sulake/core/window/components/FrameController.as::get menuButton()
    public get menuButton(): IWindow | null 
    {
        return this.findChildByName('header_button_menu');
    }

    // AS3: .../src/com/sulake/core/window/components/FrameController.as::get menuButtonVisible()
    public get menuButtonVisible(): boolean 
    {
        const menuButton = this.menuButton;

        return menuButton !== null && menuButton.visible;
    }

    // AS3: .../src/com/sulake/core/window/components/FrameController.as::set menuButtonVisible()
    public set menuButtonVisible(value: boolean) 
    {
        const menuButton = this.menuButton;

        if(menuButton !== null) 
        {
            menuButton.visible = value;
        }
    }

    public override get caption(): string 
    {
        return super.caption;
    }

    public override set caption(value: string) 
    {
        super.caption = value;

        try 
        {
            this.title.text = value;
        }
        catch (_e: unknown) 
        {
            // Ignored
        }
    }

    public override get color(): number 
    {
        return super.color;
    }

    public override set color(value: number) 
    {
        super.color = value;

        const colorized: IWindow[] = [];

        this.groupChildrenWithTag(WindowController.TAG_COLORIZE, colorized);

        for(const child of colorized) 
        {
            child.color = value;
        }
    }

    public override get properties(): unknown[] 
    {
        const props = super.properties;

        props.push(new PropertyStruct('help_page', this._helpPage));

        try 
        {
            const contentWin = this.content;

            if(contentWin) 
            {
                props.push(new PropertyStruct('margin_left', contentWin.left));
                props.push(new PropertyStruct('margin_top', contentWin.top));
                props.push(new PropertyStruct('margin_right', this._width - contentWin.right));
                props.push(new PropertyStruct('margin_bottom', this._height - contentWin.bottom));
            }
        }
        catch (_) 
        {
            // Content may not be available yet
        }

        return props;
    }

    public override set properties(value: unknown[]) 
    {
        for(const item of value) 
        {
            const prop = item as PropertyStruct;

            switch(prop.key) 
            {
                case 'help_page':
                    this.helpPage = prop.value as string;
                    break;
                case 'margin_left':
                    this.margins.left = prop.value as number;
                    break;
                case 'margin_top':
                    this.margins.top = prop.value as number;
                    break;
                case 'margin_right':
                    this.margins.right = this._width - (prop.value as number);
                    break;
                case 'margin_bottom':
                    this.margins.bottom = this._height - (prop.value as number);
                    break;
            }
        }

        super.properties = value;
    }

    /**
     * Redirects layout children to the content container.
     *
     * In AS3, FrameController.buildFromXML() passes `content` to
     * parseAndConstruct() instead of `this`, so that children defined
     * in the parent layout (e.g. navigator_frame_2) are added to the
     * content area, not directly to the frame.
     *
     * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/FrameController.as line 127
     */
    public override getLayoutChildTarget(): IWindow 
    {
        return (this.content as unknown as IWindow) ?? this;
    }

    public override iterator(): IIterator 
    {
        if(this.content !== null && this._constructed) 
        {
            const iterator = (this.content as unknown as ContainerController).iterator();

            if(iterator !== null) 
            {
                return iterator;
            }
        }

        return new ContainerIterator(this);
    }

    /**
     * Resizes the frame to fit its content children.
     */
    // AS3: .../src/com/sulake/core/window/components/FrameController.as::resizeToFitContent()
    public resizeToFitContent(): void 
    {
        WindowController.resizeToAccommodateChildren(this.content as unknown as WindowController);
    }

    public override setParamFlag(flag: number, value: boolean = true): void 
    {
        super.setParamFlag(flag, value);
        this.setupScaling();
    }

    /**
     * Configures the scaler visibility based on scaling param flags.
     */
    // AS3: .../src/com/sulake/core/window/components/FrameController.as::setupScaling()
    private setupScaling(): void 
    {
        const scalerWindow = this.scaler;
        const noScale = this.testParamFlag(0x10000);
        const scaleH = this.testParamFlag(0x2000);
        const scaleV = this.testParamFlag(0x1000);

        if(scalerWindow) 
        {
            scalerWindow.setParamFlag(0x2000, scaleH || noScale);
            scalerWindow.setParamFlag(0x1000, scaleV || noScale);
            scalerWindow.visible = (scaleH || scaleV || noScale);
        }
    }

    /**
     * Handles help button click events.
     */
    // AS3: .../src/com/sulake/core/window/components/FrameController.as::helpButtonProcedure()
    private helpButtonProcedure(event: WindowEvent, _window: IWindow): void 
    {
        if(event.type === 'WME_CLICK' && this._helpPage !== '' && this._helpButtonAction !== null) 
        {
            this._helpButtonAction(this._helpPage);
        }
    }

    /**
     * Called when margins change to update content rectangle.
     */
    // AS3: .../src/com/sulake/core/window/components/FrameController.as::marginsCallback()
    private marginsCallback(margins: IMargins): void 
    {
        const contentWindow = this.content;
        const savedParam = contentWindow.param;
        const anchorFlags = savedParam & (0xC0 | 0x0C00);

        if(anchorFlags) 
        {
            contentWindow.setParamFlag(0xC0 | 0x0C00, false);
        }

        const stretchFlags = savedParam & 0xC00000;

        if(stretchFlags) 
        {
            contentWindow.setParamFlag(0xC00000, false);
        }

        contentWindow.rectangle = {
            x: margins.left,
            y: margins.top,
            width: margins.right - margins.left,
            height: margins.bottom - margins.top
        };

        if(anchorFlags || stretchFlags) 
        {
            contentWindow.setParamFlag(0xFFFFFFFF, false);
            contentWindow.setParamFlag(savedParam, true);
        }
    }
}
