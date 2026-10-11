import type {IPartColor} from '@ambreia/avatar/structure/figure/IPartColor';
import type {IFigureSetOwnership} from './IFigureSetOwnership';
import type {IAvatarEditorGridColorItem, IAvatarEditorGridPartItem} from './IAvatarEditorGridItem';

/**
 * One category's grid: its clothing thumbnails, its colour palettes, and which of each is selected.
 *
 * There are **two** palettes, not one — a part may be dyed in two independent layers, and the same
 * colour list is built twice so each layer has its own selection. `getSelectedColorIds()` then
 * trims the pair down to however many layers the *selected part* actually wears.
 *
 * This is the pure selection model. It owns no windows: the thumbnails and swatches it drives are
 * injected, so the class is complete and testable before the view layer exists.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/common/CategoryData.as
 */
export class CategoryData
{
    // AS3: .../avatar/common/CategoryData.as::MAX_PALETTES
    // An *instance* constant in AS3, not static — but never read: every loop over the palettes
    // uses `_palettes.length` instead. The 2 that matters is the one `HabboAvatarEditor` uses when
    // it builds the pair.
    private static readonly MAX_PALETTES: number = 2;

    // AS3: .../avatar/common/CategoryData.as::_parts
    // Name DERIVED (`_SafeStr_4939`): the field behind `get parts()`.
    private _parts: IAvatarEditorGridPartItem[] | null;

    // AS3: .../avatar/common/CategoryData.as::_palettes
    // One colour list per dye layer — the same colours twice, with independent selections.
    private _palettes: IAvatarEditorGridColorItem[][] | null;

    // AS3: .../avatar/common/CategoryData.as::_selectedPartIndex
    // Name DERIVED (`_SafeStr_5974`): the field behind `get selectedPartIndex()`.
    private _selectedPartIndex: number = -1;

    // AS3: .../avatar/common/CategoryData.as::_paletteIndexes
    // The selected swatch index per layer. Re-created by `selectColorIds()`, so its length tracks
    // the *incoming* colour list rather than the palette count.
    private _paletteIndexes: number[] | null;

    // AS3: .../avatar/common/CategoryData.as::CategoryData()
    constructor(parts: IAvatarEditorGridPartItem[], palettes: IAvatarEditorGridColorItem[][])
    {
        this._parts = parts;
        this._palettes = palettes;
        this._paletteIndexes = [];
    }

    // AS3: .../avatar/common/CategoryData.as::get parts()
    public get parts(): IAvatarEditorGridPartItem[] | null
    {
        return this._parts;
    }

    // AS3: .../avatar/common/CategoryData.as::get selectedPartIndex()
    public get selectedPartIndex(): number
    {
        return this._selectedPartIndex;
    }

    // AS3: .../avatar/common/CategoryData.as::getPalette()
    public getPalette(layer: number): IAvatarEditorGridColorItem[] | null
    {
        if(this._paletteIndexes === null) return null;
        if(this._palettes === null) return null;
        if(this._palettes.length <= layer) return null;

        return this._palettes[layer];
    }

    /**
     * Indexes unguarded — with nothing selected `_selectedPartIndex` is −1 and AS3 reads
     * `_parts[-1]`, which is `undefined` there and `undefined` here. Every caller null-checks the
     * result, so the behaviour is the same; kept rather than made safe, because a guard would
     * change `getSelectedColorIds()` from returning null to returning a list.
     */
    // AS3: .../avatar/common/CategoryData.as::getCurrentPart()
    public getCurrentPart(): IAvatarEditorGridPartItem | null
    {
        return this._parts?.[this._selectedPartIndex] ?? null;
    }

    // AS3: .../avatar/common/CategoryData.as::selectPartId()
    // Finds the thumbnail carrying that set id and selects it by index; an unknown id selects
    // nothing and leaves the previous selection standing.
    public selectPartId(id: number): void
    {
        if(this._parts === null) return;

        for(let index = 0; index < this._parts.length; index++)
        {
            if(this._parts[index].id === id)
            {
                this.selectPartIndex(index);

                return;
            }
        }
    }

    // AS3: .../avatar/common/CategoryData.as::selectPartIndex()
    // Deselects the previous thumbnail before selecting the new one, and only records the new
    // index if that thumbnail actually exists.
    public selectPartIndex(index: number): IAvatarEditorGridPartItem | null
    {
        if(this._parts === null) return null;

        if(this._selectedPartIndex >= 0 && this._parts.length > this._selectedPartIndex)
        {
            const previous = this._parts[this._selectedPartIndex];

            if(previous !== null && previous !== undefined) previous.isSelected = false;
        }

        if(this._parts.length > index)
        {
            const part = this._parts[index];

            if(part !== null && part !== undefined)
            {
                part.isSelected = true;
                this._selectedPartIndex = index;

                return part;
            }
        }

        return null;
    }

    /**
     * Selects one colour per layer, by colour **id**.
     *
     * A layer with no id supplied falls back to the *first swatch in that layer's palette*, not to
     * a default colour. And `_paletteIndexes` is re-created at the incoming list's length — so
     * passing fewer ids than there are layers shortens it, which is what later makes
     * `getSelectedColorIds()` return a shorter list.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/common/CategoryData.as::selectColorIds()
    public selectColorIds(colourIds: number[] | null): void
    {
        if(this._palettes === null) return;
        if(colourIds === null) return;

        this._paletteIndexes = new Array<number>(colourIds.length);

        for(let layer = 0; layer < this._palettes.length; layer++)
        {
            const palette = this.getPalette(layer);

            if(palette === null) continue;

            let wanted: number;

            if(colourIds.length > layer)
            {
                wanted = colourIds[layer];
            }
            else
            {
                const first = palette[0];

                wanted = first?.partColor?.id ?? 0;
            }

            for(let index = 0; index < palette.length; index++)
            {
                const swatch = palette[index];

                // AS3 dereferences `partColor` unguarded here, unlike everywhere else in the class.
                if(swatch.partColor?.id === wanted)
                {
                    this._paletteIndexes[layer] = index;
                    swatch.isSelected = true;
                }
                else
                {
                    swatch.isSelected = false;
                }
            }
        }

        this.updatePartColors();
    }

    // AS3: .../avatar/common/CategoryData.as::selectColorIndex()
    public selectColorIndex(index: number, layer: number): IAvatarEditorGridColorItem | null
    {
        const palette = this.getPalette(layer);

        if(palette === null) return null;
        if(palette.length <= index) return null;

        this.deselectColorIndex(this._paletteIndexes?.[layer] ?? 0, layer);

        if(this._paletteIndexes !== null) this._paletteIndexes[layer] = index;

        const swatch = palette[index];

        if(swatch === null || swatch === undefined) return null;

        swatch.isSelected = true;
        this.updatePartColors();

        return swatch;
    }

    // AS3: .../avatar/common/CategoryData.as::getCurrentColorIndex()
    // Falls back to 0, not −1 — a layer never selected still points at its first swatch.
    public getCurrentColorIndex(layer: number): number
    {
        if(this._paletteIndexes === null) return 0;
        if(this._paletteIndexes.length <= layer) return 0;

        return this._paletteIndexes[layer];
    }

    // AS3: .../avatar/common/CategoryData.as::getSelectedColor()
    public getSelectedColor(layer: number): IAvatarEditorGridColorItem | null
    {
        const palette = this.getPalette(layer);
        const index = this._paletteIndexes?.[layer] ?? 0;

        if(palette === null || palette.length <= index) return null;

        return palette[index] ?? null;
    }

    // AS3: .../avatar/common/CategoryData.as::getCurrentColorId()
    // Falls back to 0, which is a real colour id — not −1.
    public getCurrentColorId(layer: number): number
    {
        return this.getSelectedColor(layer)?.partColor?.id ?? 0;
    }

    /**
     * The colour ids to write into the figure, trimmed to the layers the selected part wears.
     *
     * Four separate ways to bail with **null**: no palette indexes, no palettes, an empty first
     * palette, or no selected part. Each means "there is nothing to save", and the caller writes
     * no colours at all rather than writing defaults.
     *
     * The `_loc7_.length <= _loc8_` guard in AS3 compares a *palette's* length against the **layer
     * index** — almost certainly meant to be the palette index it reads two lines later. Kept: it
     * only skips a layer whose palette is shorter than its own index, which for the real
     * two-layer, many-swatch palettes never happens.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/common/CategoryData.as::getSelectedColorIds()
    public getSelectedColorIds(): number[] | null
    {
        if(this._paletteIndexes === null || this._paletteIndexes.length === 0) return null;
        if(this._palettes === null || this._palettes.length === 0) return null;

        const firstPalette = this._palettes[0];

        if(firstPalette === undefined || firstPalette.length === 0) return null;

        const firstSwatch = firstPalette[0];

        if(firstSwatch === undefined || firstSwatch.partColor === null) return null;

        const fallbackId = firstSwatch.partColor.id;
        const ids: number[] = [];

        for(let layer = 0; layer < this._paletteIndexes.length; layer++)
        {
            const palette = this._palettes[layer];

            if(palette === undefined || palette.length <= layer) continue;

            if(palette.length > this._paletteIndexes[layer])
            {
                const swatch = palette[this._paletteIndexes[layer]];

                ids.push(swatch?.partColor?.id ?? fallbackId);
            }
            else
            {
                ids.push(fallbackId);
            }
        }

        const part = this.getCurrentPart();

        if(part === null) return null;

        return ids.slice(0, Math.max(part.colorLayerCount, 1));
    }

    // AS3: .../avatar/common/CategoryData.as::hasInvalidSellableItems()
    // Only the *selected* part is checked, not the whole grid.
    public hasInvalidSellableItems(inventory: IFigureSetOwnership | null): boolean
    {
        const partSet = this.getCurrentPart()?.partSet ?? null;

        if(partSet === null) return false;

        return partSet.isSellable && !(inventory?.hasFigureSetIdInInventory(partSet.id) ?? false);
    }

    // AS3: .../avatar/common/CategoryData.as::stripInvalidSellableItems()
    // Unowned sellable appearance parts fall back to the first available entry.
    public stripInvalidSellableItems(inventory: IFigureSetOwnership | null): boolean
    {
        const partSet = this.getCurrentPart()?.partSet ?? null;

        if(partSet === null) return false;
        if(!partSet.isSellable) return false;
        if(inventory?.hasFigureSetIdInInventory(partSet.id) ?? false) return false;

        const fallback = this.selectPartIndex(0);

        if(fallback !== null && fallback.partSet === null) this.selectPartIndex(1);

        return true;
    }

    // AS3: .../avatar/common/CategoryData.as::dispose()
    // Disposes every thumbnail and every swatch of every palette, then drops the lot.
    public dispose(): void
    {
        if(this._parts !== null)
        {
            for(const part of this._parts) part.dispose();

            this._parts = null;
        }

        if(this._palettes !== null)
        {
            for(const palette of this._palettes)
            {
                if(palette === null || palette === undefined) continue;

                for(const swatch of palette) swatch.dispose();
            }

            this._palettes = null;
        }

        this._selectedPartIndex = -1;
        this._paletteIndexes = null;

        void CategoryData.MAX_PALETTES;
    }

    // AS3: .../avatar/common/CategoryData.as::getSelectedColors()
    // One entry per *palette index*, null where that layer has no selectable swatch.
    private getSelectedColors(): (IPartColor | null)[]
    {
        const colors: (IPartColor | null)[] = [];

        for(let layer = 0; layer < (this._paletteIndexes?.length ?? 0); layer++)
        {
            colors.push(this.getSelectedColor(layer)?.partColor ?? null);
        }

        return colors;
    }

    // AS3: .../avatar/common/CategoryData.as::deselectColorIndex()
    private deselectColorIndex(index: number, layer: number): void
    {
        const palette = this.getPalette(layer);

        if(palette === null) return;
        if(palette.length <= index) return;

        const swatch = palette[index];

        if(swatch === null || swatch === undefined) return;

        swatch.isSelected = false;
    }

    // AS3: .../avatar/common/CategoryData.as::updatePartColors()
    // Pushes the current selection into *every* thumbnail, so the whole grid redraws in the
    // chosen colours rather than only the selected one.
    private updatePartColors(): void
    {
        const colors = this.getSelectedColors();

        for(const part of this._parts ?? [])
        {
            if(part !== null && part !== undefined) part.colors = colors;
        }
    }
}
