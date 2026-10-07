import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {ICategoryModel} from '../common/ICategoryModel';
import type {ICategoryView} from '../common/ICategoryView';
import {CategoryBaseView} from '../common/CategoryBaseView';
import {AvatarEditorGridViewEffects} from './AvatarEditorGridViewEffects';

/**
 * The effects page.
 *
 * The one page with **no tabs** — it owns a single part type, `effects`, so nothing here lights or
 * dims anything. Its whole job is to point the base class at the *effects* grid instead of the
 * clothing one, which it does by overriding `updateGridView()`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/effects/EffectsView.as
 */
export class EffectsView extends CategoryBaseView implements ICategoryView
{
    // AS3: .../avatar/effects/EffectsView.as::EffectsView()
    constructor(model: ICategoryModel | null)
    {
        super(model);
    }

    /**
     * AS3: .../avatar/effects/EffectsView.as::init()
     *
     * Does **not** set a window procedure, unlike every other page — the effect tiles carry their
     * own, set by `AvatarEditorGridViewEffects.addGridItem()`.
     *
     * Note the order: the model is asked to switch category *before* `_initialised` is set, so that
     * call re-enters `init()` through `switchCategory()`. The `if(!_window)` guard is what stops it
     * looping.
     */
    public override init(): void
    {
        if(this._window === null)
        {
            this._window = (this._model?.controller?.view?.getCategoryContainer('effects') as IWindowContainer | null) ?? null;

            if(this._window !== null) this._window.visible = false;
        }

        if(this._model !== null && this._currentPartType === '')
        {
            this._model.switchCategory(EffectsView.PART_TYPE);
        }

        this._initialised = true;

        this.updateGridView(this._currentPartType);
    }

    /**
     * AS3: .../avatar/effects/EffectsView.as::reset()
     *
     * Does **not** call the base `reset()`, so `_currentPartType` and `_initialised` survive.
     * Instead it repopulates the grid and re-runs the selection with index −1, which
     * `EffectsModel.selectPart()` reads as "restore whatever the figure is already wearing".
     */
    public override reset(): void
    {
        this.updateGridView(this._currentPartType);
        this._model?.selectPart(this._currentPartType, -1);
    }

    // AS3: .../avatar/effects/EffectsView.as::switchCategory()
    // No tab bookkeeping and no throw on an unknown part type — this page accepts anything.
    public switchCategory(partType: string): void
    {
        if(this._window === null || this._window.disposed) return;

        this._currentPartType = partType === '' ? this._currentPartType : partType;

        if(!this._initialised) this.init();

        this.updateGridView(this._currentPartType);
    }

    // AS3: .../avatar/effects/EffectsView.as::updateSelectionVisual()
    // The part type is accepted and discarded — the grid selects by index alone.
    public updateSelectionVisual(_partType: string, index: number, selected: boolean): void
    {
        this.effectsGrid?.updateSelection(index, selected);
    }

    // AS3: .../avatar/effects/EffectsView.as::getGridIndex()
    public getGridIndex(effectType: number): number
    {
        return this.effectsGrid?.getGridIndex(effectType) ?? -1;
    }

    // AS3: .../avatar/effects/EffectsView.as::updateGridView()
    // The override that makes this page the effects page: it fills `effectsGridView`, not
    // `gridView`. Both wrap the same container.
    protected override updateGridView(partType: string): void
    {
        const model = this._model;

        if(model === null) return;

        model.controller?.view?.effectsGridView?.initFromList(model, partType);
    }

    // AS3: .../avatar/effects/EffectsView.as::PART_TYPE
    // Name DERIVED: the "effects" `init()` opens on — the same string as
    // `EffectsModel.GRIDTYPE_EFFECTS`.
    private static readonly PART_TYPE: string = 'effects';

    // TS-only: AS3 casts `controller.view.effectsGridView` to the concrete class at each of its two
    // use sites, because the interface declares neither method. Hoisted into one accessor.
    private get effectsGrid(): AvatarEditorGridViewEffects | null
    {
        const grid = this._model?.controller?.view?.effectsGridView ?? null;

        return grid instanceof AvatarEditorGridViewEffects ? grid : null;
    }
}
