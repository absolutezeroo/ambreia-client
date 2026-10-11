import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemGridWindow} from '@ambreia/ui/components/IItemGridWindow';
import type {IScrollableGridWindow} from '@ambreia/ui/components/IScrollableGridWindow';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import type {IAvatarEditorGridView} from './ICategoryView';
import type {IAvatarEditorGridModel} from './IAvatarEditorGridModel';

/**
 * The one grid every tabbed page shares — thumbnails on top, up to two colour palettes below.
 *
 * There is a single instance for the whole editor, held by `AvatarEditorView`: switching page or
 * part type does not build a new grid, it re-fills this one from the page's `CategoryData`. That is
 * why `initFromList()` starts by emptying it and why `_partType` has to be remembered — a click
 * arrives with only a grid index, and the part type is what turns it back into a selection.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/common/AvatarEditorGridView.as
 */
export class AvatarEditorGridView implements IAvatarEditorGridView
{
    // AS3: .../avatar/common/AvatarEditorGridView.as::REMOVE_ITEM
    public static readonly REMOVE_ITEM: string = 'REMOVE_ITEM';

    // AS3: .../avatar/common/AvatarEditorGridView.as::GET_MORE
    public static readonly GET_MORE: string = 'GET_MORE';

    // AS3: .../avatar/common/AvatarEditorGridView.as::MAX_COLOR_LAYERS
    private static readonly MAX_COLOR_LAYERS: number = 2;

    // AS3: .../avatar/common/AvatarEditorGridView.as::PALETTE_GAP
    // Name DERIVED: the 10px AS3 uses inline, both as the gap between the two palettes and as the
    // amount subtracted before halving the width.
    private static readonly PALETTE_GAP: number = 10;

    // AS3: .../avatar/common/AvatarEditorGridView.as::_window
    // Name DERIVED (`_SafeStr_4550`): the `grid_container` handed in by `AvatarEditorView`.
    private _window: IWindowContainer | null;

    // AS3: .../avatar/common/AvatarEditorGridView.as::_model
    // Name DERIVED (`_SafeStr_4570`): the page whose parts are currently in the grid.
    private _model: IAvatarEditorGridModel | null = null;

    // AS3: .../avatar/common/AvatarEditorGridView.as::_thumbs
    // Name DERIVED (`_SafeStr_5336`).
    private _thumbs: IItemGridWindow | null;

    // AS3: .../avatar/common/AvatarEditorGridView.as::_palettes
    // Name DERIVED (`_SafeStr_5376`): exactly two, looked up once by name.
    private _palettes: (IItemGridWindow | null)[] | null;

    // AS3: .../avatar/common/AvatarEditorGridView.as::_partType
    // Name DERIVED (`_SafeStr_7619`): what a grid index means. See the class note.
    private _partType: string = '';

    // AS3: .../avatar/common/AvatarEditorGridView.as::_notification
    // Name DERIVED (`_SafeStr_6873`): the "nothing here" text, shown only for an empty page.
    private _notification: IWindow | null;

    // AS3: .../avatar/common/AvatarEditorGridView.as::_title
    // Name DERIVED (`_SafeStr_5263`): its heading, shown and hidden with it.
    private _title: IWindow | null;

    // AS3: .../avatar/common/AvatarEditorGridView.as::AvatarEditorGridView()
    constructor(window: IWindowContainer | null)
    {
        this._window = window;
        this._thumbs = (window?.findChildByName('thumbs') as IItemGridWindow | null) ?? null;
        this._palettes = [
            (window?.findChildByName('palette0') as IItemGridWindow | null) ?? null,
            (window?.findChildByName('palette1') as IItemGridWindow | null) ?? null
        ];
        this._notification = window?.findChildByName('content_notification') ?? null;
        this._title = window?.findChildByName('content_title') ?? null;

        if(this._notification !== null) this._notification.visible = false;
        if(this._title !== null) this._title.visible = false;
    }

    // AS3: .../avatar/common/AvatarEditorGridView.as::get window()
    // Reports null for a **disposed** window as well as an absent one, which is what lets
    // `AvatarEditorView.setViewToCategory()` hide it without checking.
    public get window(): IWindowContainer | null
    {
        if(this._window === null) return null;

        if(this._window.disposed) return null;

        return this._window;
    }

    /**
     * Refills the grid from one page's data for one part type.
     *
     * An empty page shows the notification and hides both palettes; a populated one wires a click
     * listener onto every thumbnail and hands the palettes a `procedure` instead — two different
     * event routes, because a thumbnail is identified by the grid it sits in while a swatch has to
     * be searched for across both palettes.
     */
    // AS3: .../avatar/common/AvatarEditorGridView.as::initFromList()
    public initFromList(model: IAvatarEditorGridModel, partType: string): void
    {
        const data = model.getCategoryData(partType);

        if(data === null) return;

        if(this._window !== null) this._window.visible = true;

        this._model = model;
        this._partType = partType;
        this._thumbs?.removeGridItems();

        const parts = data.parts ?? [];

        if(parts.length === 0)
        {
            if(this._title !== null) this._title.visible = true;
            if(this._notification !== null) this._notification.visible = true;

            this.showPalettes(0);

            return;
        }

        if(this._title !== null) this._title.visible = false;
        if(this._notification !== null) this._notification.visible = false;

        for(const palette of this._palettes ?? []) palette?.removeGridItems();

        for(const part of parts)
        {
            if(part === null) continue;

            const view = part.view;

            if(view === null) continue;

            this._thumbs?.addGridItem(view);
            view.addEventListener(WindowMouseEvent.CLICK, this.onGridItemClicked);

            // The selected part decides how many palettes are visible — so a two-layer garment
            // reveals the second one as soon as the page is filled, without a click.
            if(part.isSelected) this.showPalettes(part.colorLayerCount);
        }

        for(let layer = 0; layer < AvatarEditorGridView.MAX_COLOR_LAYERS; layer++)
        {
            const colours = data.getPalette(layer);
            const grid = this._palettes?.[layer] ?? null;

            if(colours === null || grid === null) continue;

            for(const colour of colours)
            {
                const view = colour?.view ?? null;

                if(view === null) continue;

                grid.addGridItem(view);
                view.procedure = this.paletteEventProc;
            }
        }
    }

    /**
     * Lays the palettes out for a part with `count` dye layers: none hides both, one stretches the
     * first across the full thumbnail width, two splits that width in half with a gap between.
     *
     * The widths are measured off the **thumbnail grid**, not off the container — the palettes are
     * sized to line up under the thumbnails rather than to fill their own row.
     */
    // AS3: .../avatar/common/AvatarEditorGridView.as::showPalettes()
    public showPalettes(count: number): void
    {
        const first = (this._window?.findChildByName('palette0') as IScrollableGridWindow | null) ?? null;
        const second = (this._window?.findChildByName('palette1') as IScrollableGridWindow | null) ?? null;

        if(first === null || second === null) return;

        const full = Math.trunc(this._thumbs?.width ?? 0);
        const half = ((this._thumbs?.width ?? 0) - AvatarEditorGridView.PALETTE_GAP) / 2;

        if(count <= 0)
        {
            first.visible = false;
            second.visible = false;

            return;
        }

        if(count === 1)
        {
            first.width = full;
            first.visible = true;
            second.visible = false;

            return;
        }

        first.width = half;
        second.width = half;
        second.x = first.right + AvatarEditorGridView.PALETTE_GAP;
        first.visible = true;
        second.visible = true;
    }

    /**
     * Assigns the replacement to a **local**, so the grid is never actually changed — the item at
     * `index` is fetched, discarded if absent, and then the parameter is written over the local
     * that held it. Dead in AS3, kept as-is: nothing in the client calls it.
     */
    // AS3: .../avatar/common/AvatarEditorGridView.as::updatePart()
    public updatePart(index: number, replacement: IWindowContainer | null): void
    {
        const item = this._thumbs?.getGridItemAt(index) ?? null;

        if(item === null) return;

        void replacement;
    }

    /**
     * Disposes the grids **and** the container, then drops the palette array — so a second call
     * would find everything already null. Note the palette loop nulls its own loop variable, which
     * does nothing in AS3 either; only the `dispose()` has an effect.
     */
    // AS3: .../avatar/common/AvatarEditorGridView.as::dispose()
    public dispose(): void
    {
        if(this._thumbs !== null)
        {
            this._thumbs.dispose();
            this._thumbs = null;
        }

        if(this._palettes !== null)
        {
            for(const palette of this._palettes) palette?.dispose();

            this._palettes = null;
        }

        this._model = null;

        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
        }
    }

    /**
     * A thumbnail click, dispatched by name.
     *
     * The two synthetic tiles are named on the **grid item window itself** — `HabboAvatarEditor`
     * assigns `REMOVE_ITEM` / `GET_MORE` to the cloned template before wrapping it — so the name is
     * readable straight off the event. `REMOVE_ITEM` deliberately shares the default branch: it is
     * selected by index like any other part, and its index is what makes the figure drop the piece.
     * Only `GET_MORE` peels off, to open the clothes catalogue.
     *
     * AS3 reads the name off `event.target` and the index off `event.window`; both accessors return
     * the same field in AS3 and in this port, so the distinction is cosmetic.
     */
    // AS3: .../avatar/common/AvatarEditorGridView.as::onGridItemClicked()
    private onGridItemClicked = (event: WindowMouseEvent): void =>
    {
        switch(event.target?.name)
        {
            case AvatarEditorGridView.GET_MORE:
            {
                const model = this._model;

                if(model !== null) model.openCatalogPage(model.getProperty('catalog.clothes.page'));

                return;
            }

            case AvatarEditorGridView.REMOVE_ITEM:
            default:
            {
                const window = event.window;

                if(window === null) return;

                this._model?.selectPart(this._partType, this._thumbs?.getGridItemIndex(window as IWindow) ?? -1);

                return;
            }
        }
    };

    /**
     * A swatch click. The swatch does not know which palette it belongs to, so both are searched
     * and the **layer** falls out of which one contains it — that is how one handler serves two
     * grids.
     */
    // AS3: .../avatar/common/AvatarEditorGridView.as::paletteEventProc()
    private paletteEventProc = (event: WindowEvent): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        const window = event.window;

        if(window === null) return;

        for(let layer = 0; layer < AvatarEditorGridView.MAX_COLOR_LAYERS; layer++)
        {
            if((this._palettes?.length ?? 0) <= layer) continue;

            const grid = this._palettes?.[layer] ?? null;
            const index = grid?.getGridItemIndex(window as IWindow) ?? -1;

            if(index > -1)
            {
                this._model?.selectColor(this._partType, index, layer);

                return;
            }
        }
    };
}
