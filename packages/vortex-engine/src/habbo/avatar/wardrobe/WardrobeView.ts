import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {ISideContentView} from '../common/ISideContent';
import type {WardrobeModel} from './WardrobeModel';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.avatar.wardrobe.WardrobeView');

/**
 * The wardrobe panel: a horizontal list of columns, each a vertical list of seven slots.
 *
 * The layout ships one column and one slot as templates. Both are **detached in the constructor**
 * and kept by reference — the column is cloned once per column needed, and the slot template is
 * handed to `WardrobeModel`, which clones it once per slot. Nothing in the layout survives as a
 * live child except the two lists themselves.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/wardrobe/WardrobeView.as
 */
export class WardrobeView implements ISideContentView
{
    // AS3: .../avatar/wardrobe/WardrobeView.as::SLOTS_PER_COL
    public static readonly SLOTS_PER_COL: number = 7;

    // AS3: .../avatar/wardrobe/WardrobeView.as::LAYOUT_ASSET
    // Name DERIVED: the asset name AS3 passes to `getAssetByName()`.
    private static readonly LAYOUT_ASSET: string = 'avatareditor_wardrobe_base';

    // AS3: .../avatar/wardrobe/WardrobeView.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: .../avatar/wardrobe/WardrobeView.as::_model
    // Name DERIVED (`_SafeStr_4570`).
    private _model: WardrobeModel | null;

    // AS3: .../avatar/wardrobe/WardrobeView.as::_columnsList
    // Name DERIVED (`_SafeStr_5799`): the horizontal list the cloned columns go into.
    private _columnsList: IItemListWindow | null = null;

    // AS3: .../avatar/wardrobe/WardrobeView.as::_columnTemplate
    // Name DERIVED (`_SafeStr_6253`): detached from the list, then cloned per column.
    private _columnTemplate: IItemListWindow | null = null;

    // AS3: .../avatar/wardrobe/WardrobeView.as::_slotTemplate
    // Name DERIVED (`_SafeStr_7483`): detached with its column; `WardrobeModel` clones it per slot.
    private _slotTemplate: IWindow | null = null;

    /**
     * AS3: .../avatar/wardrobe/WardrobeView.as::WardrobeView()
     *
     * The column count is `(slots + 7 - 1) / 7` assigned to an `int`, i.e. truncated — the usual
     * integer-ceiling idiom, and it is exact: 7 → 1, 10 → 2, 14 → 2, 15 → 3, all probe-confirmed.
     * The truncation is load-bearing rather than a bug, because AS3's `/` is floating-point.
     *
     * The panel is built **hidden**; `AvatarEditorView.setSideContent()` is what shows it.
     */
    constructor(model: WardrobeModel | null)
    {
        this._model = model;

        const windowManager = model?.controller?.manager?.windowManager ?? null;

        this._window = (windowManager?.buildWidgetLayout(WardrobeView.LAYOUT_ASSET) as IWindowContainer | null) ?? null;

        if(this._window === null)
        {
            log.error(`${WardrobeView.LAYOUT_ASSET} layout is missing — the wardrobe cannot be built`);

            return;
        }

        this._columnsList = this._window.findChildByName('slots_columns_list') as IItemListWindow | null;
        this._columnTemplate = (this._columnsList?.findChildByName('slots_column_template') as IItemListWindow | null) ?? null;
        this._slotTemplate = this._columnTemplate?.findChildByName('slot_template') ?? null;

        this._columnTemplate?.removeListItems();
        this._columnsList?.removeListItems();

        const columns = Math.trunc(((model?.availableSlots ?? 0) + WardrobeView.SLOTS_PER_COL - 1) / WardrobeView.SLOTS_PER_COL);

        for(let index = 0; index < columns; index++)
        {
            const column = this._columnTemplate?.clone() as IItemListWindow | null;

            if(column !== null && column !== undefined) this._columnsList?.addListItem(column);
        }

        this._window.visible = false;
    }

    // AS3: .../avatar/wardrobe/WardrobeView.as::get slotTemplate()
    public get slotTemplate(): IWindow | null
    {
        return this._slotTemplate;
    }

    // AS3: .../avatar/wardrobe/WardrobeView.as::getWindowContainer()
    public getWindowContainer(): IWindowContainer | null
    {
        return this._window;
    }

    /**
     * Empties every column and re-deals the model's slots into them, seven per column.
     *
     * A slot whose column does not exist is silently dropped — which is how the truncated column
     * count above can lose the tail of an over-long wardrobe rather than throwing.
     */
    // AS3: .../avatar/wardrobe/WardrobeView.as::update()
    public update(): void
    {
        if(this._columnsList === null) return;

        for(let index = 0; index < this._columnsList.numListItems; index++)
        {
            (this._columnsList.getListItemAt(index) as IItemListWindow | null)?.removeListItems();
        }

        const slots = this._model?.slots ?? [];

        for(let index = 0; index < slots.length; index++)
        {
            const slot = slots[index];

            if(slot === null || slot === undefined) continue;

            const column = this._columnsList.getListItemAt(
                Math.trunc(index / WardrobeView.SLOTS_PER_COL)
            ) as IItemListWindow | null;

            if(column === null || column === undefined) continue;

            const view = slot.view;

            if(view === null) continue;

            column.addListItem(view);
            view.visible = true;
        }
    }

    /**
     * AS3: .../avatar/wardrobe/WardrobeView.as::dispose()
     *
     * The two templates are disposed **inside** the `if(_window)` branch, so a view whose window
     * was never built leaks them — and they are the two things that exist even then. Kept.
     */
    // AS3: .../avatar/wardrobe/WardrobeView.as::dispose()
    public dispose(): void
    {
        this._model = null;

        if(this._window === null) return;

        this._window.dispose();
        this._window = null;
        this._columnsList = null;
        this._columnTemplate?.dispose();
        this._columnTemplate = null;
        this._slotTemplate?.dispose();
        this._slotTemplate = null;
    }
}
