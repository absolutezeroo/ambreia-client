import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemGridWindow} from '@ambreia/ui/components/IItemGridWindow';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {ICategoryView} from '../common/ICategoryView';
import type {HotLooksModel} from './HotLooksModel';

/**
 * The hot-looks page: a grid of outfits the hotel is currently showing off.
 *
 * One of the two pages that implement `ICategoryView` **directly** instead of extending
 * `CategoryBaseView` — it has no tabs, no part type and no palettes, so three of the interface's
 * five methods are empty here.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/hotlooks/HotLooksView.as
 */
export class HotLooksView implements ICategoryView
{
    // AS3: .../avatar/hotlooks/HotLooksView.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: .../avatar/hotlooks/HotLooksView.as::_model
    // Name DERIVED (`_SafeStr_4570`).
    private _model: HotLooksModel | null;

    // AS3: .../avatar/hotlooks/HotLooksView.as::_grid
    // Name DERIVED (`_SafeStr_6333`).
    private _grid: IItemGridWindow | null = null;

    // AS3: .../avatar/hotlooks/HotLooksView.as::HotLooksView()
    constructor(model: HotLooksModel | null)
    {
        this._model = model;
    }

    /**
     * AS3: .../avatar/hotlooks/HotLooksView.as::init()
     *
     * Empties the grid **before** the window lookup, which on the first call is a no-op because the
     * grid does not exist yet. On later calls it clears the tiles that `update()` is about to
     * re-add — the same list, so nothing changes visibly.
     */
    // AS3: .../avatar/hotlooks/HotLooksView.as::init()
    public init(): void
    {
        this._grid?.removeGridItems();

        if(this._window === null)
        {
            this._window = (this._model?.controller?.view?.getCategoryContainer('hotlooks') as IWindowContainer | null) ?? null;
            this._grid = (this._window?.findChildByName('hotlooks') as IItemGridWindow | null) ?? null;

            if(this._window !== null) this._window.visible = false;
        }

        this.update();
    }

    /**
     * AS3: .../avatar/hotlooks/HotLooksView.as::update()
     *
     * Re-deals the model's outfits for the **current gender** — the model's `hotLooks` getter is
     * keyed by it, so switching sex swaps the whole grid.
     *
     * The procedure goes on the tile's own container, and the click handler climbs to
     * `window.parent` because the event arrives on whichever child was hit.
     */
    // AS3: .../avatar/hotlooks/HotLooksView.as::update()
    public update(): void
    {
        this._grid?.removeGridItems();

        for(const outfit of this._model?.hotLooks ?? [])
        {
            const window = outfit?.view?.window ?? null;

            if(window === null) continue;

            this._grid?.addGridItem(window);
            window.procedure = this.hotLooksEventProc;
        }
    }

    // AS3: .../avatar/hotlooks/HotLooksView.as::getWindowContainer()
    public getWindowContainer(): IWindowContainer | null
    {
        return this._window;
    }

    // AS3: .../avatar/hotlooks/HotLooksView.as::switchCategory()
    // Empty — this page has no part types.
    public switchCategory(_partType: string): void
    {
    }

    // AS3: .../avatar/hotlooks/HotLooksView.as::showPalettes()
    // Empty — an outfit has no colours to pick.
    public showPalettes(_partType: string, _count: number): void
    {
    }

    // AS3: .../avatar/hotlooks/HotLooksView.as::reset()
    // Empty. A gender change therefore does **not** repopulate the grid through the usual reset
    // path; only re-entering the page does, via `init()`. AS3's; kept.
    public reset(): void
    {
    }

    // AS3: .../avatar/hotlooks/HotLooksView.as::dispose()
    // Drops the window without disposing it — it belongs to `AvatarEditorView`'s content area.
    public dispose(): void
    {
        this._grid?.removeGridItems();
        this._window = null;
        this._model = null;
    }

    /**
     * AS3: .../avatar/hotlooks/HotLooksView.as::hotLooksEventProc()
     *
     * The window argument is optional in AS3 and falls back to `event.target`; both accessors
     * return the same field, so the fallback can never differ. Kept.
     */
    // AS3: .../avatar/hotlooks/HotLooksView.as::hotLooksEventProc()
    private hotLooksEventProc = (event: WindowEvent, window: IWindow | null = null): void =>
    {
        const target = window ?? event.target;

        if(target === null) return;
        if(event.type !== 'WME_CLICK') return;

        const parent = target.parent;

        if(parent === null) return;

        this._model?.selectHotLook(this._grid?.getGridItemIndex(parent) ?? -1);
    };
}
