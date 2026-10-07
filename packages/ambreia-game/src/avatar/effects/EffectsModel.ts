import type {IAvatarEffect} from '../IAvatarEffect';
import type {ICategoryModel} from '../common/ICategoryModel';
import type {ICategoryModelOwner} from '../common/ICategoryModelOwner';
import {CategoryBaseModel} from '../common/CategoryBaseModel';
import {EffectsParamView} from './EffectsParamView';
import {EffectsView} from './EffectsView';

/**
 * The effects page's model.
 *
 * It builds **no `CategoryData`** — there is nothing to filter or colour, so `initCategory()` is
 * never called and every inherited method that walks `_categories` finds it empty. The grid comes
 * straight from the inventory instead, and this class exists mostly to own `selectPart()`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/effects/EffectsModel.as
 */
export class EffectsModel extends CategoryBaseModel implements ICategoryModel
{
    // AS3: .../avatar/effects/EffectsModel.as::GRIDTYPE_EFFECTS
    public static readonly GRIDTYPE_EFFECTS: string = 'effects';

    // AS3: .../avatar/effects/EffectsModel.as::NO_EFFECT
    // Name DERIVED: the −1 that means "wearing nothing", both as a figure value and as the
    // "restore what is worn" sentinel `selectPart()` takes.
    private static readonly NO_EFFECT: number = -1;

    // AS3: .../avatar/effects/EffectsModel.as::_selectedIndices
    // Name DERIVED (`_SafeStr_5221`): part type → the grid index last selected for it. A one-entry
    // map in practice, since this page has a single part type.
    private _selectedIndices: Map<string, number> = new Map();

    // AS3: .../avatar/effects/EffectsModel.as::_paramView
    // Name DERIVED (`_SafeStr_8677`).
    private _paramView: EffectsParamView | null = null;

    // AS3: .../avatar/effects/EffectsModel.as::EffectsModel()
    constructor(controller: ICategoryModelOwner | null)
    {
        super(controller);
    }

    /**
     * AS3: .../avatar/effects/EffectsModel.as::get effects()
     *
     * Straight from the inventory, unfiltered and unsorted — an empty array when there is no
     * inventory at all.
     */
    // AS3: .../avatar/effects/EffectsModel.as::get effects()
    public get effects(): IAvatarEffect[]
    {
        const inventory = this._controller?.manager?.effectInventory ?? null;

        if(inventory === null) return [];

        return inventory.getAvatarEffects();
    }

    /**
     * AS3: .../avatar/effects/EffectsModel.as::selectPart()
     *
     * Grid index 0 is the "wear nothing" tile, so a real effect sits at its inventory index **plus
     * one** — see `AvatarEditorGridViewEffects.initFromList()`, which leads with the null tile.
     *
     * Index −1 is the sentinel `EffectsView.reset()` passes: restore whatever the figure already
     * wears. It resolves to that effect's grid position and marks it selected **without** calling
     * `setAvatarEffectType()`, because nothing changed.
     *
     * Note the previous selection is un-highlighted first, using the index remembered for this part
     * type. On the very first call AS3 reads a missing `Dictionary` entry, gets `undefined`, and
     * coerces it to **0** at the `int` parameter — so the first selection always deselects the
     * "wear nothing" tile, whether or not it was lit. Reproduced with `?? 0`.
     */
    public override selectPart(partType: string, index: number): void
    {
        const view = this._view as EffectsView | null;

        this.setSelectionVisual(partType, this._selectedIndices.get(partType) ?? 0, false);

        const currentType = this._controller?.figureData?.avatarEffectType ?? EffectsModel.NO_EFFECT;
        let effect: IAvatarEffect | null = null;
        let resolved = index;

        if(index === EffectsModel.NO_EFFECT && currentType !== EffectsModel.NO_EFFECT)
        {
            resolved = view?.getGridIndex(currentType) ?? EffectsModel.NO_EFFECT;

            for(const candidate of this.effects)
            {
                if(candidate.type !== currentType) continue;

                effect = candidate;
                effect.isSelected = true;
                break;
            }
        }
        else if((index === EffectsModel.NO_EFFECT && currentType === EffectsModel.NO_EFFECT) || index === 0)
        {
            resolved = 0;
            this._controller?.setAvatarEffectType?.(EffectsModel.NO_EFFECT);
            this._paramView?.updateView(null);
        }
        else
        {
            effect = this.effects[index - 1] ?? null;

            if(effect !== null)
            {
                effect.isSelected = true;
                this._controller?.setAvatarEffectType?.(effect.type);
            }
        }

        this._selectedIndices.set(partType, resolved);
        this.setSelectionVisual(partType, resolved, true);
        this._paramView?.updateView(effect);
    }

    /**
     * AS3: .../avatar/effects/EffectsModel.as::init()
     *
     * The `_initialised` flag is set **first**, before either view exists — `EffectsView.init()`
     * calls back through `switchCategory()`, and the flag is what stops that re-entering here.
     *
     * `EffectsParamView` is built between the two, and its constructor reads
     * `controller.view.effectsParamViewContainer` — so the editor's window has to exist by now,
     * which it does: `HabboAvatarEditor.init()` builds it before any page.
     */
    protected override init(): void
    {
        super.init();

        this._initialised = true;

        if(this._view !== null) return;

        this._view = new EffectsView(this);
        this._paramView = new EffectsParamView(this, this._controller?.manager?.windowManager ?? null);
        this._view.init();
    }

    // AS3: .../avatar/effects/EffectsModel.as::setSelectionVisual()
    private setSelectionVisual(partType: string, index: number, selected: boolean): void
    {
        (this._view as EffectsView | null)?.updateSelectionVisual(partType, index, selected);
    }
}
