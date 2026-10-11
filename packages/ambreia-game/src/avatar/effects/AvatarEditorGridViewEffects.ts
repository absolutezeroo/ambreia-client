import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemGridWindow} from '@ambreia/ui/components/IItemGridWindow';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IAvatarEditorGridView} from '../common/ICategoryView';
import type {IAvatarEditorGridModel} from '../common/IAvatarEditorGridModel';
import type {IEffectsGridModel} from './IEffectsGridModel';
import {AvatarEditorGridItemEffect} from './AvatarEditorGridItemEffect';

/**
 * The effects page's grid — the same `grid_container` `AvatarEditorGridView` wraps, filled with a
 * different kind of item.
 *
 * Both grids exist side by side over one window and neither knows about the other; whichever page
 * is showing calls `initFromList()` on its own and the container is repopulated. That is why this
 * one hides both palettes unconditionally: an effect has no colours, and the previous page may have
 * left them up.
 *
 * It keeps its items in its own vector as well as in the grid, because selection and lookup are by
 * *effect type*, which the grid window knows nothing about.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/effects/AvatarEditorGridViewEffects.as
 */
export class AvatarEditorGridViewEffects implements IAvatarEditorGridView
{
    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::NOT_FOUND
    // Name DERIVED: the −1 `getGridIndex()` returns for an effect type not in the grid.
    private static readonly NOT_FOUND: number = -1;

    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::_window
    // Name DERIVED (`_SafeStr_4550`).
    private _window: IWindowContainer | null;

    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::_firstView
    // Name DERIVED (`_SafeStr_9655`): true until the first `initFromList()`. Read by `firstView`,
    // which nothing in the client calls.
    private _firstView: boolean = true;

    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::_model
    // Name DERIVED (`_SafeStr_4570`).
    private _model: IEffectsGridModel | null = null;

    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::_partType
    // Name DERIVED (`_SafeStr_7619`): always `effects`, but stored the same way as the clothing grid.
    private _partType: string = '';

    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::_thumbs
    // Name DERIVED (`_SafeStr_5336`).
    private _thumbs: IItemGridWindow | null;

    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::_effectItems
    private _effectItems: AvatarEditorGridItemEffect[] = [];

    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::_notification
    // Name DERIVED (`_SafeStr_6873`).
    private _notification: IWindow | null;

    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::_title
    // Name DERIVED (`_SafeStr_5263`).
    private _title: IWindow | null;

    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::AvatarEditorGridViewEffects()
    // Unlike `AvatarEditorGridView`, this does **not** hide the notification at build time — it is
    // left as the layout has it until the first `initFromList()`.
    constructor(window: IWindowContainer | null)
    {
        this._window = window;
        this._thumbs = (window?.findChildByName('thumbs') as IItemGridWindow | null) ?? null;
        this._notification = window?.findChildByName('content_notification') ?? null;
        this._title = window?.findChildByName('content_title') ?? null;
    }

    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::get window()
    // No disposed check here, where `AvatarEditorGridView.get window()` has one.
    public get window(): IWindowContainer | null
    {
        return this._window;
    }

    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::get firstView()
    public get firstView(): boolean
    {
        return this._firstView;
    }

    /**
     * AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::initFromList()
     *
     * The grid always leads with a **null-effect tile** — "wear nothing" — so every real effect
     * sits at its inventory index plus one. `EffectsModel.selectPart()` depends on that offset.
     *
     * Casting the model to `EffectsModel` to reach `effects` is AS3's; the interface has no such
     * member.
     */
    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::initFromList()
    public initFromList(model: IAvatarEditorGridModel, partType: string): void
    {
        const effectsModel = model as IEffectsGridModel;

        this._model = effectsModel;
        this._partType = partType;

        if(this._window !== null) this._window.visible = true;

        const effects = effectsModel.effects ?? [];

        this._thumbs?.removeGridItems();
        this._effectItems = [];

        if(effects.length === 0)
        {
            if(this._title !== null) this._title.visible = true;
            if(this._notification !== null) this._notification.visible = true;
        }
        else
        {
            if(this._notification !== null) this._notification.visible = false;
            if(this._title !== null) this._title.visible = false;

            const windowManager = effectsModel.windowManager;
            const assets = effectsModel;

            this.addGridItem(new AvatarEditorGridItemEffect(null, windowManager, assets));

            for(const effect of effects)
            {
                this.addGridItem(new AvatarEditorGridItemEffect(effect, windowManager, assets));
            }
        }

        this.showPalettes(0);
        this._firstView = false;
    }

    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::showPalettes()
    // Takes a count and **ignores it** — an effect has no colours, so both palettes always go.
    public showPalettes(_count: number): void
    {
        const first = this._window?.findChildByName('palette0') ?? null;
        const second = this._window?.findChildByName('palette1') ?? null;

        if(first !== null) first.visible = false;
        if(second !== null) second.visible = false;
    }

    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::updateSelection()
    public updateSelection(index: number, selected: boolean): void
    {
        if(index < 0 || index >= this._effectItems.length) return;

        this._effectItems[index].selected = selected;
    }

    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::getGridIndex()
    // Grid position of an effect **type**, or −1. The null tile reports type −1, so asking for −1
    // legitimately returns 0.
    public getGridIndex(effectType: number): number
    {
        for(let index = 0; index < this._effectItems.length; index++)
        {
            if(this._effectItems[index].effectType === effectType) return index;
        }

        return AvatarEditorGridViewEffects.NOT_FOUND;
    }

    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::dispose()
    // Disposes the grid and the container it shares with `AvatarEditorGridView` — whichever of the
    // two goes first takes the window with it.
    public dispose(): void
    {
        if(this._thumbs !== null)
        {
            this._thumbs.dispose();
            this._thumbs = null;
        }

        this._model = null;

        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
        }
    }

    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::addGridItem()
    private addGridItem(item: AvatarEditorGridItemEffect): void
    {
        const window = item.window;

        if(window === null) return;

        window.procedure = this.partEventProc;
        this._effectItems.push(item);
        this._thumbs?.addGridItem(window);
    }

    /**
     * AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::partEventProc()
     *
     * Fires on **`WME_DOWN`**, not on click — an effect is chosen the moment the button goes down,
     * unlike a garment. Kept.
     */
    // AS3: .../avatar/effects/AvatarEditorGridViewEffects.as::partEventProc()
    private partEventProc = (event: WindowEvent): void =>
    {
        if(event.type !== 'WME_DOWN') return;

        const window = event.window;

        if(window === null) return;

        this._model?.selectPart(this._partType, this._thumbs?.getGridItemIndex(window as IWindow) ?? -1);
    };
}
