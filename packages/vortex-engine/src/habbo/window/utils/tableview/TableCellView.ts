import {Logger} from '@ambreia/common/utils/Logger';
import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IRegionWindow} from '@core/window/components/IRegionWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import type {ITextFieldWindow} from '@core/window/components/ITextFieldWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import {WindowKeyboardEvent} from '@core/window/events/WindowKeyboardEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';

import type {CellTemplate} from './CellTemplate';
import {TableCell} from './TableCell';
import type {TableColumn} from './TableColumn';
import type {TableRowView} from './TableRowView';
import type {TableView} from './TableView';
import {WindowEvent} from '@core/window/events/WindowEvent';

const log = Logger.getLogger('habbo.window.utils.tableview.TableCellView');

/**
 * TableCellView — the window view for one cell of one row. Renders either a plain-text element or a
 * link element (per TableCell.type), lazily materializes the input/link/extra-button sub-windows from
 * the shared CellTemplate on demand, handles inline editing (double-click → input field) and the
 * cell-change highlight fade.
 *
 * Port note: AS3 drives the highlight fade with a repeating flash.utils.Timer(16ms, steps); the port
 * uses setInterval with a tick counter (same easeInOutCubic curve). The AS3 input-field focus() has no
 * equivalent on the port's ITextFieldWindow, so it is called duck-typed (no-op if absent).
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/tableview/TableCellView.as
 */
export class TableCellView implements IDisposable
{
    // AS3: TableCellView.as::_disposed
    private _disposed: boolean = false;

    // AS3: TableCellView.as::_SafeStr_5262 (name derived: parent table view)
    private _tableView: TableView;

    // AS3: TableCellView.as::_SafeStr_5675 (name derived: parent row view)
    private _rowView: TableRowView;

    // AS3: TableCellView.as::_SafeStr_6870 (name derived: column id)
    private _columnId: string;

    // AS3: TableCellView.as::_SafeStr_4625 (name derived: the cell data)
    private _cell: TableCell | null;

    // AS3: TableCellView.as::_container
    private _container: IRegionWindow;

    // AS3: TableCellView.as::_transitionTimer (the highlight fade timer — setInterval handle in the port)
    private _transitionHandle: ReturnType<typeof setInterval> | null = null;
    private _transitionCount: number = 0;
    private _transitionRunning: boolean = false;

    // AS3: TableCellView.as::TableCellView()
    constructor(tableView: TableView, rowView: TableRowView, columnId: string, cell: TableCell | null)
    {
        this._tableView = tableView;
        this._rowView = rowView;
        this._columnId = columnId;
        this._cell = cell;
        this._container = this.template.clone();
        this.updateWidth();
        this.initializeView();
        this._container.addEventListener('WME_DOUBLE_CLICK', this._onDoubleClick);
        this._container.addEventListener(WindowMouseEvent.DOWN, rowView.onDown);
        this._container.addEventListener(WindowMouseEvent.OVER, rowView.onHoverOver);
        this._container.addEventListener(WindowMouseEvent.OUT, rowView.onHoverOut);
        this._container.addEventListener(WindowMouseEvent.CLICK_AWAY, rowView.onClickAway);
        this._container.mouseThreshold = 0;
    }

    // AS3: TableCellView.as::easeInOutCubic()
    private static easeInOutCubic(t: number, start: number, delta: number, duration: number): number
    {
        const ratio = t / duration;
        const eased = -(ratio * 1.75 - 0.7) * (ratio * 1.75 - 0.7) + 1;
        return start + delta * eased;
    }

    // AS3: TableCellView.as::reuse()
    reuse(cell: TableCell | null): void
    {
        this._cell = cell;
        this.initializeView();
    }

    // AS3: TableCellView.as::update()
    update(cell: TableCell | null): void
    {
        this._cell = cell;
        const input = this.getInputElement(false);

        if(input != null && input.visible)
        {
            this.updateContents();
        }
        else
        {
            this.initializeView();

            if(cell?.highlightOnChange)
            {
                this.highlight();
            }
        }
    }

    // AS3: TableCellView.as::setAllInvisible()
    private setAllInvisible(): void
    {
        this.turnInvisible(this.getTextElement(false));
        this.turnInvisible(this.getInputElement(false));
        this.turnInvisible(this.getLinkRegion(false));
        this.turnInvisible(this.getExtraButtonRegion(false));
    }

    // AS3: TableCellView.as::turnInvisible()
    private turnInvisible(window: IWindow | null): void
    {
        if(window != null)
        {
            window.visible = false;
        }
    }

    // AS3: TableCellView.as::onLinkClick()
    private _onLinkClick = (_event: WindowMouseEvent): void =>
    {
        if(this._cell != null && this._cell.linkClickCallback != null)
        {
            this._cell.linkClickCallback();
        }
    };

    // AS3: TableCellView.as::onExtraButtonClick()
    private _onExtraButtonClick = (_event: WindowMouseEvent): void =>
    {
        if(this._cell != null && this._cell.extraBtnCallback != null)
        {
            this._cell.extraBtnCallback();
        }
    };

    /**
     * AS3 dereferences `_cell` here with no guard, and gets away with it because every
     * `ITableObject.getTableCell()` covers every column its table declares — the null its default
     * branch returns is unreachable in practice. This port hit it anyway, from a text input's
     * `WE_UNFOCUS`, and an unguarded deref there is not a blank cell: it throws inside the window
     * manager's update receiver and takes the frame with it.
     *
     * So a null cell renders as an empty cell (`setAllInvisible()` has already run) and says which
     * column produced it, rather than crashing. If this ever fires, the fix belongs in that row
     * object's `getTableCell()`, not here — the warning exists to name it.
     */
    // AS3: TableCellView.as::initializeView()
    private initializeView(): void
    {
        this.setAllInvisible();

        if(this._cell == null)
        {
            log.warn(
                `No table cell for column "${this._columnId}"`
                + ` from ${this._rowView.object?.constructor.name ?? 'an unknown row object'}`
                + ' — the cell renders empty'
            );

            return;
        }

        if(this._cell.type === TableCell.TYPE_LINK)
        {
            this.getLinkRegion(true)!.visible = true;
        }
        else if(this._cell!.type === TableCell.TYPE_TEXT)
        {
            this.getTextElement(true)!.visible = true;
        }

        this.updateContents();
    }

    // AS3: TableCellView.as::updateContents()
    private updateContents(): void
    {
        // Reachable on its own from update(), which does not go through initializeView() when the
        // cell's input is open — see initializeView() for why a null cell is not fatal here.
        if(this._cell == null) return;

        let textElement: ITextWindow | null = null;

        if(this._cell.type === TableCell.TYPE_LINK)
        {
            this.getLinkElement(true)!.text = this._cell!.contents as string;
        }
        else if(this._cell!.type === TableCell.TYPE_TEXT)
        {
            textElement = this.getTextElement(true);
            textElement!.textColor = this._cell!.textColor;
            textElement!.autoSize = this.column.alignment;
            textElement!.text = this._cell!.contents as string;
        }

        let tooltip = '';

        if(this._cell!.tooltipText != null)
        {
            tooltip = this._cell!.tooltipText;
        }
        else if(this._cell!.type === TableCell.TYPE_TEXT && textElement != null && textElement.isOverflown)
        {
            tooltip = this._cell!.contents as string;
        }

        (this._container as unknown as {toolTipCaption: string}).toolTipCaption = tooltip;

        let extraButtonRegion = this.getExtraButtonRegion(false);

        if(this._cell!.extraBtn != null)
        {
            extraButtonRegion = this.getExtraButtonRegion(true);
            extraButtonRegion!.visible = true;
            this.getExtraButton(true)!.assetUri = this._cell!.extraBtn;
            extraButtonRegion!.interactiveCursorDisabled = this._cell!.extraBtnCallback == null;
        }
        else if(extraButtonRegion != null)
        {
            extraButtonRegion.visible = false;
        }
    }

    // AS3: TableCellView.as::get column()
    private get column(): TableColumn
    {
        return this._tableView.getColumnById(this._columnId);
    }

    // AS3: TableCellView.as::updateWidth()
    updateWidth(): void
    {
        this._container.width = this._tableView.getCellWidth(this._columnId);
    }

    // AS3: TableCellView.as::get container()
    get container(): IWindowContainer
    {
        return this._container as unknown as IWindowContainer;
    }

    // AS3: TableCellView.as::onInputEdit()
    private _onInputEdit = (event: WindowKeyboardEvent): void =>
    {
        if(event == null)
        {
            return;
        }

        const input = this.getInputElement(false);

        if(event.keyCode === 13 && this._cell?.isEditable)
        {
            this._tableView.onEnterNewCellValue(input!.text, this._rowView.object!, this._columnId);
            this.initializeView();
        }
        else if(event.keyCode === 27)
        {
            this.initializeView();
        }
    };

    // AS3: TableCellView.as::onInputFocusOut()
    private _onInputFocusOut = (_event: WindowKeyboardEvent): void =>
    {
        this.initializeView();
    };

    // AS3: TableCellView.as::onDoubleClick()
    private _onDoubleClick = (_event: WindowMouseEvent): void =>
    {
        if(this._cell != null && (this._cell.isInspectable || this._cell.isEditable))
        {
            this.setAllInvisible();
            const input = this.getInputElement(true)!;
            input.visible = true;
            input.text = this._cell.textFieldValue ?? '';
            input.editable = this._cell.isEditable;
            input.focus();
        }
    };

    // AS3: TableCellView.as::recycle()
    recycle(): void
    {
        this._cell = null;
    }

    // AS3: TableCellView.as::dispose()
    dispose(): void
    {
        if(this._disposed)
        {
            return;
        }

        this._container.dispose();
        this._columnId = null as unknown as string;
        this._tableView = null as unknown as TableView;
        this._container = null as unknown as IRegionWindow;
        this._cell = null;
        this._disposed = true;
        this.clearTransition();
    }

    // AS3: TableCellView.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: TableCellView.as::getTextElement()
    private getTextElement(create: boolean): ITextWindow | null
    {
        const existing = this._container.findChildByName('element_text') as unknown as ITextWindow | null;

        if(existing == null && create)
        {
            return this.template.createElementText(this._container as unknown as IWindowContainer);
        }

        return existing;
    }

    // AS3: TableCellView.as::getInputElement()
    private getInputElement(create: boolean): ITextFieldWindow | null
    {
        const existing = this._container.findChildByName('element_input') as unknown as ITextFieldWindow | null;

        if(existing == null && create)
        {
            const input = this.template.createElementInput(this._container as unknown as IWindowContainer);
            input.addEventListener(WindowKeyboardEvent.KEY_DOWN, this._onInputEdit);
            input.addEventListener(WindowKeyboardEvent.KEY_UP, this._onInputEdit);
            input.addEventListener(WindowEvent.WE_UNFOCUS, this._onInputFocusOut);
            input.addEventListener(WindowMouseEvent.CLICK_AWAY, this._rowView.onClickAway);
            return input;
        }

        return existing;
    }

    // AS3: TableCellView.as::getLinkRegion()
    private getLinkRegion(create: boolean): IRegionWindow | null
    {
        const existing = this._container.findChildByName('link_container') as unknown as IRegionWindow | null;

        if(existing == null && create)
        {
            const region = this.template.createLinkContainer(this._container as unknown as IWindowContainer);
            region.addEventListener(WindowMouseEvent.DOWN, this._rowView.onDown);
            region.addEventListener(WindowMouseEvent.OVER, this._rowView.onHoverOver);
            region.addEventListener(WindowMouseEvent.OUT, this._rowView.onHoverOut);
            region.addEventListener(WindowMouseEvent.CLICK_AWAY, this._rowView.onClickAway);
            region.addEventListener(WindowMouseEvent.CLICK, this._onLinkClick);
            region.mouseThreshold = 0;
            return region;
        }

        return existing;
    }

    // AS3: TableCellView.as::getLinkElement()
    private getLinkElement(create: boolean): ITextWindow | null
    {
        const region = this.getLinkRegion(create);

        if(region == null)
        {
            return null;
        }

        return region.findChildByName('element_link') as unknown as ITextWindow | null;
    }

    // AS3: TableCellView.as::getHighlightBorder()
    private getHighlightBorder(create: boolean): IWindowContainer | null
    {
        const existing = this._container.findChildByName('highlight_border') as unknown as IWindowContainer | null;

        if(existing == null && create)
        {
            return this.template.createHighlightBorder(this._container as unknown as IWindowContainer);
        }

        return existing;
    }

    // AS3: TableCellView.as::getExtraButtonRegion()
    private getExtraButtonRegion(create: boolean): IRegionWindow | null
    {
        const existing = this._container.findChildByName('extra_button') as unknown as IRegionWindow | null;

        if(existing == null && create)
        {
            const region = this.template.createExtraButton(this._container as unknown as IWindowContainer);
            region.addEventListener(WindowMouseEvent.CLICK, this._onExtraButtonClick);
            region.addEventListener(WindowMouseEvent.OVER, this._rowView.onHoverOver);
            region.addEventListener(WindowMouseEvent.OUT, this._rowView.onHoverOut);
            return region;
        }

        return existing;
    }

    // AS3: TableCellView.as::getExtraButton()
    private getExtraButton(create: boolean): IStaticBitmapWrapperWindow | null
    {
        const region = this.getExtraButtonRegion(create);

        if(region == null)
        {
            return null;
        }

        return region.findChildByName('extra_button_bitmap') as unknown as IStaticBitmapWrapperWindow | null;
    }

    // AS3: TableCellView.as::get template()
    private get template(): CellTemplate
    {
        return this._tableView.cellTemplate;
    }

    // AS3: TableCellView.as::highlight()
    private highlight(): void
    {
        if(this._transitionRunning)
        {
            return;
        }

        const highlightBorder = this.getHighlightBorder(true)!;
        const transitionDuration = 500;
        const delay = 16;
        const steps = Math.floor(transitionDuration / delay);
        const minValue = 0;
        const maxValue = 0.35;
        highlightBorder.visible = true;
        (highlightBorder as unknown as {blend: number}).blend = 0;

        this.clearTransition();
        this._transitionCount = 0;
        this._transitionRunning = true;
        this._transitionHandle = setInterval(() =>
        {
            this._transitionCount++;
            (highlightBorder as unknown as {blend: number}).blend = TableCellView.easeInOutCubic(this._transitionCount, minValue, maxValue - minValue, steps);

            if(this._transitionCount >= steps)
            {
                highlightBorder.visible = false;
                this.clearTransition();
            }
        }, delay);
    }

    // Port helper: stop + clear the highlight-fade interval (replaces Timer.reset()).
    private clearTransition(): void
    {
        if(this._transitionHandle !== null)
        {
            clearInterval(this._transitionHandle);
            this._transitionHandle = null;
        }

        this._transitionRunning = false;
    }
}
