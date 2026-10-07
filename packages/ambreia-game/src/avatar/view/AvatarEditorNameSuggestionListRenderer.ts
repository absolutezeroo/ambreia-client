import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {IHabboAvatarEditorHost} from '../IHabboAvatarEditorHost';

/**
 * Lays alternative names out as a wrapping row of chips inside a fixed 150px-tall box.
 *
 * The flow is hand-rolled rather than done by an item list: each chip is built, measured, and
 * either placed or **thrown away**. A name too wide for the box, or one that would spill past the
 * bottom, is disposed rather than clipped — so the box silently shows fewer suggestions than the
 * server sent.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/view/AvatarEditorNameSuggestionListRenderer.as
 */
export class AvatarEditorNameSuggestionListRenderer
{
    // AS3: .../avatar/view/AvatarEditorNameSuggestionListRenderer.as::MARGIN_X
    private static readonly MARGIN_X: number = 5;

    // AS3: .../avatar/view/AvatarEditorNameSuggestionListRenderer.as::MARGIN_Y
    // Declared separately from `MARGIN_X` but the same value, and AS3 writes the literal 5 at both
    // use sites rather than either constant.
    private static readonly MARGIN_Y: number = 5;

    // AS3: .../avatar/view/AvatarEditorNameSuggestionListRenderer.as::MAX_HEIGHT
    // Name DERIVED: the 150 AS3 forces onto the container's own rectangle before laying out, so the
    // box's declared height in the layout is ignored.
    private static readonly MAX_HEIGHT: number = 150;

    // AS3: .../avatar/view/AvatarEditorNameSuggestionListRenderer.as::MIN_ITEM_WIDTH
    // Name DERIVED: the 2 a chip must exceed to be placed at all — the layout's own `width_min`.
    private static readonly MIN_ITEM_WIDTH: number = 2;

    // AS3: .../avatar/view/AvatarEditorNameSuggestionListRenderer.as::LAYOUT_ASSET
    // Name DERIVED: `HabboAvatarEditorCom.avatar_editor_name_change_item`, referenced as a field
    // rather than by name lookup — the only place in the editor that does.
    private static readonly LAYOUT_ASSET: string = 'avatar_editor_name_change_item';

    // AS3: .../avatar/view/AvatarEditorNameSuggestionListRenderer.as::_manager
    // Name DERIVED (`_SafeStr_4571`).
    private _manager: IHabboAvatarEditorHost | null;

    // AS3: .../avatar/view/AvatarEditorNameSuggestionListRenderer.as::_offsetX
    private _offsetX: number = 0;

    // AS3: .../avatar/view/AvatarEditorNameSuggestionListRenderer.as::_offsetY
    private _offsetY: number = 0;

    // AS3: .../avatar/view/AvatarEditorNameSuggestionListRenderer.as::_rowCount
    // Name DERIVED (`_SafeStr_10185`): zeroed at the start of every `render()` and **never touched
    // again**. Kept so the reset is not silently dropped.
    private _rowCount: number = 0;

    // AS3: .../avatar/view/AvatarEditorNameSuggestionListRenderer.as::_bounds
    // Name DERIVED (`_SafeStr_7010`): the container's rectangle with its height overwritten by
    // `MAX_HEIGHT`.
    private _bounds: {x: number; y: number; width: number; height: number} | null = null;

    // AS3: .../avatar/view/AvatarEditorNameSuggestionListRenderer.as::AvatarEditorNameSuggestionListRenderer()
    constructor(manager: IHabboAvatarEditorHost | null)
    {
        this._manager = manager;
    }

    /**
     * AS3: .../avatar/view/AvatarEditorNameSuggestionListRenderer.as::render()
     *
     * Returns the **bottom edge of the last placed chip**, or 0 when nothing fitted — the caller
     * uses it to size the box. Note it reads that from the last child rather than from `_offsetY`,
     * so a final row that is shorter than its predecessors reports its own bottom.
     */
    // AS3: .../avatar/view/AvatarEditorNameSuggestionListRenderer.as::render()
    public render(names: string[], container: IWindowContainer | null): number
    {
        if(container === null) return 0;

        while(container.numChildren > 0)
        {
            const child = container.removeChildAt(0);

            child?.dispose();
        }

        container.parent?.invalidate();

        this._rowCount = 0;
        this._offsetX = 0;
        this._offsetY = 0;

        const rectangle = container.rectangle;

        this._bounds = {
            x: rectangle.x,
            y: rectangle.y,
            width: rectangle.width,
            height: AvatarEditorNameSuggestionListRenderer.MAX_HEIGHT
        };

        for(const name of names)
        {
            const item = this.createItem(name);

            if(item === null) continue;

            if(this.fit(item)) container.addChild(item);
            else item.dispose();
        }

        if(container.numChildren === 0) return 0;

        return container.getChildAt(container.numChildren - 1)?.bottom ?? 0;
    }

    // AS3: .../avatar/view/AvatarEditorNameSuggestionListRenderer.as::dispose()
    public dispose(): void
    {
        this._manager = null;
    }

    /**
     * AS3: .../avatar/view/AvatarEditorNameSuggestionListRenderer.as::fit()
     *
     * Places the chip and advances the cursor, or refuses it. A chip that does not fit the current
     * row wraps and **recurses** — which is also how a chip too tall for the remaining space is
     * rejected, on the second pass.
     *
     * The chip's `x`/`y` are *added to*, not assigned, so the layout's own 4px inset is preserved
     * on every one of them.
     */
    // AS3: .../avatar/view/AvatarEditorNameSuggestionListRenderer.as::fit()
    private fit(item: IWindow): boolean
    {
        const bounds = this._bounds;

        if(bounds === null) return false;

        if(item.width > bounds.width) return false;
        if(item.width < AvatarEditorNameSuggestionListRenderer.MIN_ITEM_WIDTH) return false;
        if(this._offsetY + item.height > bounds.height) return false;

        if(this._offsetX + item.width > bounds.width)
        {
            this._offsetX = 0;
            this._offsetY += item.height + AvatarEditorNameSuggestionListRenderer.MARGIN_Y;

            return this.fit(item);
        }

        item.x += this._offsetX;
        item.y += this._offsetY;
        this._offsetX += item.width + AvatarEditorNameSuggestionListRenderer.MARGIN_X;

        return true;
    }

    // AS3: .../avatar/view/AvatarEditorNameSuggestionListRenderer.as::createItem()
    private createItem(name: string): ITextWindow | null
    {
        const item = (this._manager?.windowManager?.buildWidgetLayout(
            AvatarEditorNameSuggestionListRenderer.LAYOUT_ASSET
        ) as ITextWindow | null) ?? null;

        if(item === null) return null;

        item.text = name;

        return item;
    }

    // TS-only: keeps the zeroed-but-unread AS3 field referenced.
    private get unused(): unknown
    {
        return this._rowCount;
    }
}
