import type {IDisposable} from '@core/runtime';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {RoomChatInputView} from '../RoomChatInputView';
import {ChatStyleGridView} from './ChatStyleGridView';
import {ChatStyleGridEntry} from './ChatStyleGridEntry';

/** AS3: ChatStyleSelector.as::MAX_GRID_COLUMNS */
export const MAX_GRID_COLUMNS = 6;

function isWindowInTree(window: IWindow | null, ancestor: IWindow | null): boolean 
{
    let current = window;

    while(current) 
    {
        if(current === ancestor) return true;

        current = current.parent as IWindow | null;
    }

    return false;
}

function clampFontSize(value: number): number 
{
    return value < 0 ? 0 : (value > 4 ? 4 : value);
}

/**
 * ChatStyleSelector
 *
 * The chat-style/font-size picker popup anchored to the chat input bar's
 * "styles" button. Grid entries arrive pre-filtered (RoomChatInputView owns
 * the isHcOnly/isAmbassadorOnly/isStaffOverrideable/purchasable/NFT-ownership
 * gating - this class never sees a locked style, so there's no lock-icon UI
 * here, matching AS3).
 *
 * Two deliberate deviations from upstream AS3 bugs (present identically in
 * all three source trees checked):
 *  - `_selected`/`_styleRequiresUpdate` are per-instance fields here, not
 *    AS3's class-`static` ones (there's no reason for "which style is
 *    selected" to leak across different chat input instances).
 *  - `dispose()` fully clears `_entries` instead of AS3's
 *    `while(length>1) pop()`, which always leaves one stray entry behind.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as
 */
export class ChatStyleSelector implements IDisposable 
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::FONT_SIZE_LABELS
    private static readonly FONT_SIZE_LABELS = ['S', 'M', 'L', 'XL', 'XXL'];

    private static readonly HOVER_COLOR = 4291875024;

    private static readonly DEFAULT_COLOR = 4294967295;

    private static readonly SELECTED_LABEL_COLOR = 3355443;

    private static readonly UNSELECTED_LABEL_COLOR = 10066329;

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::_container
    private _container: IWindowContainer | null;
    private _gridView: ChatStyleGridView | null;
    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::_entries
    private _entries: ChatStyleGridEntry[] = [];
    private _styleTemplateWindow: IWindow | null;
    private _fontSizeTemplateWindow: IWindow | null;
    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::_styleRequiresUpdate
    private _styleRequiresUpdate: boolean = false;
    private _fontSizeMode: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::ChatStyleSelector()
    constructor(chatInputView: RoomChatInputView, container: IWindowContainer | null) 
    {
        this._chatInputView = chatInputView;
        this._gridView = new ChatStyleGridView(chatInputView);
        this._styleTemplateWindow = this.buildTemplateWindow('chatinput_chatstyle_template_xml');
        this._fontSizeTemplateWindow = this.buildTemplateWindow('chatinput_chatfontsize_template_xml');
        this._container = container;

        if(this._container) this._container.procedure = this.windowProc;

        const gridWindow = this._gridView.window;
        const menuContainer = chatInputView.chatStyleMenuContainer;

        if(gridWindow && menuContainer) 
        {
            menuContainer.addChild(gridWindow);
            gridWindow.x = 0;
            gridWindow.y = 0;
        }

        if(menuContainer) menuContainer.visible = false;

        this.createFontSizeOptions();
    }

    private _chatInputView: RoomChatInputView | null;

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::get chatInputView()
    get chatInputView(): RoomChatInputView | null 
    {
        return this._chatInputView;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::get disposed()
    get disposed(): boolean 
    {
        return this._gridView === null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::get visible()
    get visible(): boolean 
    {
        return !!this._chatInputView?.chatStyleMenuContainer?.visible;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::get selectedStyleId()
    get selectedStyleId(): number 
    {
        if(this._styleRequiresUpdate && this.selected) 
        {
            this._styleRequiresUpdate = false;

            return this.selected.id;
        }

        return -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::get selectedStyleBitmap()
    get selectedStyleBitmap(): ImageBitmap | null 
    {
        return this.selected?.bitmap ?? null;
    }

    // itself or any other ItemGridController consumer.
    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::set gridColumns()
    set gridColumns(columns: number) 
    {
        const grid = this._gridView?.grid;

        if(!this._styleTemplateWindow || !grid) return;

        const cellWidth = this._styleTemplateWindow.width;
        const width = columns > 1 ? (columns - 1) * (cellWidth + 1) + cellWidth : cellWidth + 16;

        // TS-only addition: pins limits.maxWidth to the same value. The itemgrid_vertical layout
        // node carries resize_on_item_update="true" (real AS3 layout data, not invented here),
        // which grows the grid's own width by one cell every time addGridItem() creates a new
        // column - so the wrap check in ItemGridController.resolveColumnForNextItem()
        // (`... <= this._width`) was comparing against a width that had just grown to fit one more
        // column, and every style landed in a single ever-widening row instead of wrapping.
        // Capping maxWidth freezes the ceiling this property is meant to express without touching
        // resize_on_item_update.
        //
        // Raise the limit BEFORE assigning width: WindowController.setRectangle() clamps against
        // the current limits.maxWidth on every write, so assigning first (against the old, smaller
        // default) truncated the grid, and raising the limit afterwards was too late.
        grid.limits.maxWidth = width;
        grid.width = width;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::_selected
    private _selected: ChatStyleGridEntry | null = null;

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::get selected()
    private get selected(): ChatStyleGridEntry | null 
    {
        if(!this._selected && this._entries.length > 0) this._selected = this._entries[this._entries.length - 1];

        return this._selected;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::dispose()
    dispose(): void 
    {
        this._entries = [];

        if(this._container) this._container.procedure = null;

        this._gridView?.dispose();
        this._gridView = null;
        this._container = null;
        this._fontSizeTemplateWindow = null;
        this._styleTemplateWindow = null;
        this._chatInputView = null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::hide()
    hide(): void 
    {
        const menuContainer = this._chatInputView?.chatStyleMenuContainer;

        if(menuContainer) menuContainer.visible = false;
        if(this._gridView?.window) this._gridView.window.visible = false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::containsWindow()
    containsWindow(window: IWindow | null): boolean 
    {
        return isWindowInTree(window, this._container)
            || isWindowInTree(window, this._chatInputView?.chatStyleMenuContainer ?? null)
            || isWindowInTree(window, this._gridView?.window ?? null);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::addItem()
    addItem(styleId: number, preview: ImageBitmap): void
    {
        if(!this._gridView?.grid || !this._styleTemplateWindow) return;

        this._entries.push(new ChatStyleGridEntry(styleId, preview));

        const wrapper = this.getGridItemWindowWrapper(preview);

        if(!wrapper) return;

        this._gridView.grid.addGridItem(wrapper);

        const background = wrapper.findChildByName('background_color');

        if(background) background.visible = false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::clear()
    clear(): void 
    {
        this._entries = [];
        this._gridView?.grid?.removeGridItems();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::initSelection()
    initSelection(): void 
    {
        if(this._entries.length === 0) 
        {
            this._styleRequiresUpdate = false;

            return;
        }

        // Re-reads the getter, which lazily defaults to the last entry - see `selected` getter.
        this.setSelected(this.selected);
        this._styleRequiresUpdate = false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::initFontSizeSelection()
    initFontSizeSelection(mode: number): void 
    {
        this._fontSizeMode = clampFontSize(mode);
        this.updateFontSizeSelectionHighlight();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::alignMenuToSelector()
    alignMenuToSelector(): void 
    {
        if(this._gridView?.window?.visible) this._gridView.alignToSelector(this._container);
    }

    /**
     * AS3: .../src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::set selected()
     *
     * AS3 continues past these two assignments to tint and mask a live "chat_bg_preview" bubble
     * background behind the input box, then recolours the input text. Both are skipped here for
     * the same reason AS3 skips them: its very next statement is
     * `if(window.findChildByName("chat_bg_preview") == null) return;`, and chatinput_window_new —
     * checked against the raw layout XML, not the compiled asset — declares no such child. The
     * early return lands before setInputFieldColor() too, so picking a style has no visible
     * side effect on the input field in this layout either. Faithful, not reduced.
     */
    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::set selected()
    private setSelected(entry: ChatStyleGridEntry | null): void
    {
        if(!entry) return;

        this._selected = entry;
        this._styleRequiresUpdate = true;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::getGridItemWindowWrapper()
    private getGridItemWindowWrapper(preview: ImageBitmap): IWindowContainer | null 
    {
        if(!this._styleTemplateWindow) return null;

        const clone = this._styleTemplateWindow.clone() as IWindowContainer;
        const bubblePreview = clone.findChildByName('bubble_preview') as IBitmapWrapperWindow | null;

        if(bubblePreview) bubblePreview.bitmap = preview;

        clone.procedure = this.gridItemWindowProc;

        return clone;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::createFontSizeOptions()
    private createFontSizeOptions(): void 
    {
        const fontSizeList = this._gridView?.fontSizeList;

        if(!fontSizeList || !this._fontSizeTemplateWindow) return;

        for(let i = 0; i < ChatStyleSelector.FONT_SIZE_LABELS.length; i++) 
        {
            const item = this.getFontSizeItemWindowWrapper(ChatStyleSelector.FONT_SIZE_LABELS[i], i);

            if(item) fontSizeList.addListItem(item);
        }

        this.updateFontSizeSelectionHighlight();
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::getFontSizeItemWindowWrapper()
    private getFontSizeItemWindowWrapper(label: string, id: number): IWindowContainer | null 
    {
        if(!this._fontSizeTemplateWindow) return null;

        const clone = this._fontSizeTemplateWindow.clone() as IWindowContainer;

        clone.id = id;

        const labelWindow = clone.findChildByName('label') as ITextWindow | null;

        if(labelWindow) labelWindow.caption = label;

        clone.procedure = this.fontSizeItemWindowProc;

        return clone;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::buildTemplateWindow()
    private buildTemplateWindow(assetName: string): IWindow | null 
    {
        return this._chatInputView?.widget?.windowManager.buildWidgetLayout(assetName) ?? null;
    }

    // DEVIATION: AS3 also hides the habbicon selector when this menu opens; the RPG fork removed
    //   Habbicons.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::windowProc()
    // WIN63-202607011411-782849652 (primary source) leaves the popup open after picking a
    // style - only font-size selection, re-clicking the toggle, or a click-away close it.
    // win63_version/PRODUCTION-201601012205-226667486 auto-close on style pick instead; this ports the primary
    // tree's behavior.
    private windowProc = (event: WindowEvent, window: IWindow): void => 
    {
        if(event.type === 'WME_CLICK_AWAY') 
        {
            this.hideIfClickAway(event.related);

            return;
        }

        if(event.type === 'WME_CLICK') 
        {
            const container = this._chatInputView?.widget?.handler.container;
            const chatFontSizeMode = container?.freeFlowChat?.chatFontSizeMode ?? 0;

            this._fontSizeMode = clampFontSize(chatFontSizeMode);
            this.updateFontSizeSelectionHighlight();

            const menuContainer = this._chatInputView?.chatStyleMenuContainer;
            const nextVisible = !menuContainer?.visible;

            if(menuContainer) menuContainer.visible = nextVisible;
            if(this._gridView?.window) this._gridView.window.visible = nextVisible;

            this.alignMenuToSelector();
        }

        void window;
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::gridItemWindowProc()
    private gridItemWindowProc = (event: WindowEvent, window: IWindow): void => 
    {
        if(event.type === 'WME_CLICK_AWAY') 
        {
            this.hideIfClickAway(event.related);

            return;
        }

        if(event.type === 'WME_CLICK') 
        {
            const grid = this._gridView?.grid;
            const index = grid ? grid.getGridItemIndex(window) : -1;

            this.showBackgroundOnlyForItem(window);

            if(index >= 0 && index < this._entries.length) this.setSelected(this._entries[index]);
        }

        if(event.type === 'WME_OVER') 
        {
            const background = (window as IWindowContainer).findChildByName('background_color');

            if(background) background.color = ChatStyleSelector.HOVER_COLOR;
        }

        if(event.type === 'WME_OUT') 
        {
            const background = (window as IWindowContainer).findChildByName('background_color');

            if(background) background.color = ChatStyleSelector.DEFAULT_COLOR;
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::fontSizeItemWindowProc()
    private fontSizeItemWindowProc = (event: WindowEvent, window: IWindow): void => 
    {
        if(event.type === 'WME_CLICK_AWAY') 
        {
            this.hideIfClickAway(event.related);

            return;
        }

        const item = this.resolveFontSizeItem(window);

        if(!item) return;

        if(event.type === 'WME_CLICK') 
        {
            this._fontSizeMode = clampFontSize(item.id);

            const container = this._chatInputView?.widget?.handler.container;

            if(container?.freeFlowChat) container.freeFlowChat.chatFontSizeMode = this._fontSizeMode;

            this.updateFontSizeSelectionHighlight();
        }

        if(event.type === 'WME_OVER') 
        {
            const background = item.findChildByName('background_color');

            if(background) background.color = ChatStyleSelector.HOVER_COLOR;
        }

        if(event.type === 'WME_OUT') 
        {
            const background = item.findChildByName('background_color');

            if(background) background.color = ChatStyleSelector.DEFAULT_COLOR;
        }
    };

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::hideIfClickAway()
    private hideIfClickAway(related: IWindow | null): void 
    {
        if(this.visible && !this.containsWindow(related)) this.hide();
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::showBackgroundOnlyForItem()
    private showBackgroundOnlyForItem(item: IWindow): void 
    {
        const grid = this._gridView?.grid;

        if(!grid) return;

        for(let i = 0; i < grid.numGridItems; i++) 
        {
            const background = (grid.getGridItemAt(i) as IWindowContainer | null)?.findChildByName('background_color');

            if(background) background.visible = false;
        }

        const selectedBackground = (item as IWindowContainer).findChildByName('background_color');

        if(selectedBackground) selectedBackground.visible = true;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::updateFontSizeSelectionHighlight()
    private updateFontSizeSelectionHighlight(): void 
    {
        const fontSizeList = this._gridView?.fontSizeList;

        if(!fontSizeList) return;

        for(let i = 0; i < fontSizeList.numListItems; i++) 
        {
            const item = fontSizeList.getListItemAt(i) as IWindowContainer | null;

            if(!item) continue;

            const background = item.findChildByName('background_color');
            const label = item.findChildByName('label') as ITextWindow | null;
            const isSelected = item.id === this._fontSizeMode;

            if(background) background.visible = isSelected;
            if(label) label.textColor = isSelected ? ChatStyleSelector.SELECTED_LABEL_COLOR : ChatStyleSelector.UNSELECTED_LABEL_COLOR;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/styleselector/ChatStyleSelector.as::resolveFontSizeItem()
    private resolveFontSizeItem(window: IWindow): IWindowContainer | null 
    {
        const fontSizeList = this._gridView?.fontSizeList;
        let current: IWindow | null = window;

        while(current?.parent && (current.parent as IWindow).parent !== fontSizeList) 
        {
            current = current.parent as IWindow | null;
        }

        return current as IWindowContainer | null;
    }
}
