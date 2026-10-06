/**
 * RoomDesktopLayoutManager
 *
 * @see sources/win63_version/habbo/ui/class_3019.as
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/_SafeCls_2850.as (clean
 *      cross-reference — win63_version's setLayout()/getWidgetContainer() are corrupted
 *      by decompiler artifacts: a `null.`-ref infinite loop and a dropped final
 *      return statement respectively)
 *
 * Manages the window layout for a room desktop. Builds the layout window tree
 * from JSON and provides access to named containers for widget placement.
 */
import {Logger} from '@core/utils/Logger';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IDisplayObjectWrapper} from '@core/window/components/IDisplayObjectWrapper';
import {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowParam} from '@core/window/enum/WindowParam';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';

const log = Logger.getLogger('habbo.ui.RoomDesktopLayoutManager');

export class RoomDesktopLayoutManager
{
    // AS3: sources/win63_version/habbo/ui/class_3019.as::ROOM_VIEW
    private static readonly ROOM_VIEW = 'room_view';

    // AS3: sources/win63_version/habbo/ui/class_3019.as::ROOM_NEW_CHAT
    private static readonly ROOM_NEW_CHAT = 'room_new_chat';

    // AS3: sources/win63_version/habbo/ui/class_3019.as::BOTTOM_MARGIN
    private static readonly BOTTOM_MARGIN = 47;

    // AS3: sources/win63_version/habbo/ui/class_3019.as::_layoutContainer
    private _layoutContainer: IWindowContainer | null = null;

    constructor()
    {
    }

    /**
	 * Builds the layout window tree from a JSON layout via the window manager.
	 *
	 * @param layoutName - The registered layout asset name (e.g. "room_desktop_layout")
	 * @param windowManager - The window manager to build the layout with
	 * @param _config - Configuration manager (unused for now, matches AS3 signature)
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/_SafeCls_2850.as::setLayout()
    public setLayout(layoutName: string, windowManager: IHabboWindowManager, _config: IHabboConfigurationManager | null): void
    {
        if(this._layoutContainer)
        {
            this._layoutContainer.dispose();
            this._layoutContainer = null;
        }

        const root = windowManager.buildWidgetLayout(layoutName, 0);

        if(!root)
        {
            log.warn(`Failed to build layout: ${layoutName}`);

            return;
        }

        this._layoutContainer = root as IWindowContainer;

        const desktop = this._layoutContainer.desktop;

        if(desktop)
        {
            this._layoutContainer.width = desktop.width;
            this._layoutContainer.height = desktop.height;

            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/_SafeCls_2850.as::setLayout()
            // buildWidgetLayout() no longer auto-attaches the built root to a desktop (that was a
            // bug of its own - see HabboWindowManager.buildFromXML()'s note); AS3 always did this
            // explicitly right here, this port was silently relying on that other bug for the
            // whole room desktop layout (room view, infostand, room tools, ...) to ever become
            // visible/interactive at all.
            (desktop as unknown as IWindowContainer).addChild(this._layoutContainer);
        }

        const infostandContainer = this._layoutContainer.findChildByTag('room_widget_infostand');

        if(infostandContainer)
        {
            infostandContainer.y -= RoomDesktopLayoutManager.BOTTOM_MARGIN;
        }

        for(let i = 0; i < this._layoutContainer.numChildren; i++)
        {
            const child = this._layoutContainer.getChildAt(i);

            if(child && child.testParamFlag(WindowParam.ON_ACCOMMODATE_ALIGN_BOTTOM))
            {
                child.addEventListener(WindowEvent.WE_CHILD_RESIZED, this.trimContainer);
            }
        }

        log.debug(`Layout built: ${layoutName}`);
    }

    /**
	 * Shrink-wraps a single-child widget slot container to match its child's
	 * size whenever that child resizes.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/_SafeCls_2850.as::trimContainer()
    private trimContainer = (event: WindowEvent): void =>
    {
        const window = event.window as IWindowContainer | null;

        if(!window) return;

        if(window.numChildren !== 1) return;

        const child = window.getChildAt(0);

        if(!child) return;

        window.width = child.width;
        window.height = child.height;
    };

    /**
	 * Gets the widget container for a given widget name.
	 */
    // DEVIATION: AS3 also files RWE_WORD_QUIZZ under `background_widgets`; the RPG fork removed the
    //   word quiz.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/_SafeCls_2850.as::getWidgetContainer()
    private getWidgetContainer(name: string, window: IWindow): IWindowContainer | null
    {
        if(!this._layoutContainer || !window) return null;

        // By *name*, not by tag: `room_desktop_layout_xml` declares this one container as
        // `name="background_widgets"` with no tags at all, and AS3 looks it up accordingly
        // (`getChildByName`). Searching by tag matched nothing, so the widget that lands here was
        // refused a container — "No container found for widget: RWE_HIGH_SCORE_DISPLAY".
        if(name === 'RWE_HIGH_SCORE_DISPLAY')
        {
            return this._layoutContainer.getChildByName('background_widgets') as IWindowContainer | null;
        }

        if(name === 'RWE_CHAT_INPUT_WIDGET')
        {
            return window.desktop as IWindowContainer | null;
        }

        let tag: string | null = null;

        for(const t of window.tags)
        {
            if(t.indexOf('room_widget') === 0)
            {
                tag = t;

                break;
            }
        }

        if(!tag) return null;

        return this._layoutContainer.getChildByTag(tag) as IWindowContainer | null;
    }

    /**
	 * Adds a widget window to the appropriate container in the layout.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/_SafeCls_2850.as::addWidgetWindow()
    public addWidgetWindow(name: string, window: IWindow): boolean
    {
        if(!window) return false;

        const container = this.getWidgetContainer(name, window);

        if(!container)
        {
            // AS3 returns false here without a word, and for most widgets that is
            // the ordinary answer rather than a fault: a window with no
            // `room_widget*` tag is not asking to dock at all. The me-menu is one
            // — `own_avatar_menu` declares no tags, it is a free bubble on the
            // desktop — and it warned on every open.
            //
            // The warning still earns its place for a window that IS asking:
            // that is how RWE_HIGH_SCORE_DISPLAY's missing container was caught
            // (see getWidgetContainer above). So it now fires only when a
            // `room_widget*` tag went unmatched.
            if(window.tags.some(tag => tag.indexOf('room_widget') === 0))
            {
                log.warn(`No container found for widget: ${name}`);
            }

            return false;
        }

        if(name === 'RWE_CHAT_INPUT_WIDGET')
        {
            container.addChild(window);

            return true;
        }

        window.x = 0;
        window.y = 0;
        container.addChild(window);
        container.width = window.width;
        container.height = window.height;

        return true;
    }

    /**
	 * Removes a widget window from its container.
	 */
    // AS3: sources/win63_version/habbo/ui/class_3019.as::removeWidgetWindow()
    public removeWidgetWindow(name: string, window: IWindow): void
    {
        const container = this.getWidgetContainer(name, window);

        if(container)
        {
            container.removeChild(window);
        }
    }

    /**
	 * Adds a room view window to the room_view container.
	 */
    // AS3: sources/win63_version/habbo/ui/class_3019.as::addRoomView()
    public addRoomView(window: IWindow): boolean
    {
        if(!this._layoutContainer) return false;

        const roomViewContainer = this._layoutContainer.findChildByTag(RoomDesktopLayoutManager.ROOM_VIEW) as IWindowContainer | null;

        if(!roomViewContainer)
        {
            log.warn('No room_view container in layout');

            return false;
        }

        roomViewContainer.addChild(window);

        return true;
    }

    /**
	 * Gets the room view window (the first child of the room_view container).
	 */
    // AS3: sources/win63_version/habbo/ui/class_3019.as::getRoomView()
    public getRoomView(): IWindow | null
    {
        if(!this._layoutContainer) return null;

        const roomViewContainer = this._layoutContainer.findChildByTag(RoomDesktopLayoutManager.ROOM_VIEW) as IWindowContainer | null;

        if(!roomViewContainer || roomViewContainer.numChildren === 0) return null;

        return roomViewContainer.getChildAt(0);
    }

    /**
	 * Gets the rectangle of the room view area.
	 */
    // AS3: sources/win63_version/habbo/ui/class_3019.as::get roomViewRect()
    public get roomViewRect(): { x: number; y: number; width: number; height: number } | null
    {
        if(!this._layoutContainer) return null;

        const roomViewContainer = this._layoutContainer.findChildByTag(RoomDesktopLayoutManager.ROOM_VIEW);

        if(!roomViewContainer) return null;

        // AS3: sources/win63_version/habbo/ui/class_3019.as::roomViewRect
        // Returns the room_view rectangle as-is. BOTTOM_MARGIN is not subtracted
        // from the canvas height in AS3; using it here shrinks the render/culling
        // viewport and makes the room disappear while panning.
        return {
            x: roomViewContainer.x + this._layoutContainer.x,
            y: roomViewContainer.y + this._layoutContainer.y,
            width: roomViewContainer.width,
            height: roomViewContainer.height
        };
    }

    /**
	 * Gets the chat container window - a "display_object_wrapper" element
	 * (room_desktop_layout_xml.json's "container_new_chat", tagged "room_new_chat"),
	 * so freeFlowChat's root display object can be mounted into it via
	 * setDisplayObject(), matching AS3's layoutManager.getChatContainer().setDisplayObject(...).
	 */
    // AS3: sources/win63_version/habbo/ui/class_3019.as::getChatContainer()
    public getChatContainer(): IDisplayObjectWrapper | null
    {
        if(!this._layoutContainer) return null;

        return this._layoutContainer.findChildByTag(RoomDesktopLayoutManager.ROOM_NEW_CHAT) as IDisplayObjectWrapper | null;
    }

    /**
	 * Gets the layout container.
	 */
    public get layoutContainer(): IWindowContainer | null
    {
        return this._layoutContainer;
    }

    // AS3: sources/win63_version/habbo/ui/class_3019.as::dispose()
    public dispose(): void
    {
        if(this._layoutContainer)
        {
            this._layoutContainer.dispose();
            this._layoutContainer = null;
        }
    }
}
