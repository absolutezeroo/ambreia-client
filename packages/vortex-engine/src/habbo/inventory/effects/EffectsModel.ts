import type {EffectFilterType, IEffectsModel} from './IEffectsModel';
import type {Effect} from './Effect';
import type {IConnection} from '@core/communication/connection/IConnection';
import {AvatarEffectActivatedComposer} from '../../communication/messages/outgoing/inventory/AvatarEffectActivatedComposer';
import {AvatarEffectSelectedComposer} from '../../communication/messages/outgoing/inventory/AvatarEffectSelectedComposer';

/**
 * Owned avatar-effects data + activation/selection commands.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/effects/EffectsModel.as
 *
 * Faithful to the AS3 inventory EffectsModel for the parts the me-menu effects
 * widget uses: it holds the owned Effect list and SENDS the activate/select
 * composers itself (AS3 sends via `HabboInventory.communication.connection`).
 *
 * The AS3 model also owns an inventory-tab EffectsView + two
 * EffectListProxy instances and calls view.updateListViews()/updateActionView()
 * from refreshViews(). That inventory tab is legacy (no "effects" tab exists in
 * the modern inventory_xml layout), so it is intentionally not ported here; the
 * live UI (the me-menu EffectsWidget) refreshes via
 * HabboInventory.notifyChangedEffects() ("HIEE_EFFECTS_CHANGED") instead.
 */
import type {IInventoryModel} from '../IInventoryModel';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import {EffectListProxy} from './EffectListProxy';
import type {EffectsView} from './EffectsView';
import {EffectFilter} from './IEffectsModel';

export class EffectsModel implements IEffectsModel, IInventoryModel
{
    // AS3: EffectsModel.as::_communication (used as .connection.send(...))
    private _connection: IConnection | null;

    private _effects: Effect[] = [];

    // AS3: .../src/com/sulake/habbo/inventory/effects/EffectsModel.as::_disposed
    private _disposed: boolean = false;

    private _lastActivatedEffect: number = -1;

    constructor(connection: IConnection | null = null)
    {
        this._connection = connection;
    }

    // AS3: .../src/com/sulake/habbo/inventory/effects/EffectsModel.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/habbo/inventory/effects/EffectsModel.as::get lastActivatedEffect()
    get lastActivatedEffect(): number
    {
        return this._lastActivatedEffect;
    }

    // AS3: .../src/com/sulake/habbo/inventory/effects/EffectsModel.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        for(const effect of this._effects)
        {
            effect.dispose();
        }

        this._effects = [];
        this._connection = null;
        this._disposed = true;
    }

    // AS3: EffectsModel.as::addEffect() (icon load deferred to the widget in this port)
    addEffect(effect: Effect): boolean
    {
        const existing = this.getEffect(effect.type);

        if(existing)
        {
            existing.amountInInventory++;

            return false;
        }

        this._effects.push(effect);

        return true;
    }

    // AS3: EffectsModel.as::getEffect()
    getEffect(type: number): Effect | null
    {
        for(const effect of this._effects)
        {
            if(effect.type === type)
            {
                return effect;
            }
        }

        return null;
    }

    /**
	 * The same effect as getEffect(), under AS3's name for the interface-typed variant
	 *
	 * AS3 casts the concrete `Effect` to its read-only interface here so a caller cannot reach the
	 * mutators. This port has no separate effect interface — `Effect` is the only type — so the
	 * two methods return the same thing and the pair is kept because AS3's callers use both names.
	 */
    // AS3: .../src/com/sulake/habbo/inventory/effects/EffectsModel.as::getEffectInterface()
    getEffectInterface(type: number): Effect | null
    {
        return this.getEffect(type);
    }

    // AS3: EffectsModel.as::getEffects()
    getEffects(filter: EffectFilterType = EffectFilter.ALL): Effect[]
    {
        if(filter === EffectFilter.ALL)
        {
            return [...this._effects];
        }

        return this._effects.filter(e =>
        {
            if(filter === EffectFilter.ACTIVE)
            {
                return e.isActive;
            }

            return !e.isActive;
        });
    }

    // AS3: EffectsModel.as::getItemInIndex()
    getItemInIndex(index: number, filter: EffectFilterType = EffectFilter.ALL): Effect | null
    {
        const effects = this.getEffects(filter);

        if(index < 0 || index >= effects.length)
        {
            return null;
        }

        return effects[index];
    }

    // AS3: EffectsModel.as::requestEffectActivated() — sends the enable/activate composer (3022)
    requestEffectActivated(type: number): void
    {
        this._connection?.send(new AvatarEffectActivatedComposer(type));
    }

    // AS3: EffectsModel.as::setEffectActivated() — server-confirmed activation
    setEffectActivated(type: number): Effect | null
    {
        const effect = this.getEffect(type);

        if(!effect) return null;

        // AS3 passes (false,false): stop others WITHOUT sending a stop composer.
        this.stopUsingAllEffects(false, false);
        effect.isActive = true;
        effect.isInUse = true;

        return effect;
    }

    // AS3: EffectsModel.as::useEffect() — activate if needed, then wear (send select 2362)
    useEffect(type: number): void
    {
        this.stopUsingAllEffects(false, false, true);

        const effect = this.getEffect(type);

        if(!effect) return;

        if(!effect.isActive)
        {
            this.requestEffectActivated(effect.type);
        }

        if(!effect.isInUse)
        {
            effect.isInUse = true;
            this._connection?.send(new AvatarEffectSelectedComposer(type));
            this._lastActivatedEffect = type;
        }
    }

    // AS3: EffectsModel.as::stopUsingEffect()
    stopUsingEffect(type: number, sendStop: boolean = false): void
    {
        const effect = this.getEffect(type);

        if(!effect) return;

        if(effect.isInUse)
        {
            effect.isInUse = false;

            if(sendStop)
            {
                this._connection?.send(new AvatarEffectSelectedComposer(-1));
                this._lastActivatedEffect = -1;
            }
        }
    }

    // DEVIATION: `refresh` drives AS3's `refreshViews()`, which repaints the legacy inventory
    //   EffectsView this port deliberately does not carry (see the class doc). The live
    //   equivalent is not lost: the sole caller, `HabboInventory.deselectAllEffects()`, calls
    //   `notifyChangedEffects()` on the line after this one, which is what the me-menu widget
    //   listens to.
    // AS3: EffectsModel.as::stopUsingAllEffects()
    stopUsingAllEffects(sendStop: boolean = true, _refresh: boolean = true, clearLastActivated: boolean = false): void
    {
        for(const effect of this._effects)
        {
            effect.isInUse = false;
        }

        if(sendStop)
        {
            this._connection?.send(new AvatarEffectSelectedComposer(-1));
        }

        if(clearLastActivated)
        {
            this._lastActivatedEffect = -1;
        }
    }

    // AS3: EffectsModel.as::toggleEffectSelected()
    toggleEffectSelected(type: number): Effect | null
    {
        const effect = this.getEffect(type);

        if(!effect) return null;

        if(effect.isSelected)
        {
            effect.isSelected = false;
        }
        else
        {
            this.setAllEffectsDeselected();
            effect.isSelected = true;
        }

        return effect;
    }

    // AS3: EffectsModel.as::setEffectSelected()
    setEffectSelected(type: number): void
    {
        const effect = this.getEffect(type);

        if(!effect) return;

        this.setAllEffectsDeselected();
        effect.isSelected = true;
    }

    // AS3: EffectsModel.as::setEffectDeselected()
    setEffectDeselected(type: number): void
    {
        const effect = this.getEffect(type);

        if(effect)
        {
            effect.isSelected = false;
        }
    }

    // AS3: .../src/com/sulake/habbo/inventory/effects/EffectsModel.as::setAllEffectsDeselected()
    setAllEffectsDeselected(): void
    {
        for(const effect of this._effects)
        {
            effect.isSelected = false;
        }
    }

    // AS3: EffectsModel.as::getSelectedEffect()
    getSelectedEffect(filter: EffectFilterType = EffectFilter.ALL): Effect | null
    {
        const effects = this.getEffects(filter);

        for(const effect of effects)
        {
            if(effect.isSelected)
            {
                return effect;
            }
        }

        return null;
    }

    // AS3: EffectsModel.as::setEffectExpired()
    setEffectExpired(type: number): boolean
    {
        this._lastActivatedEffect = -1;

        const effect = this.getEffect(type);

        if(!effect) return false;

        if(effect.amountInInventory > 1)
        {
            effect.setOneEffectExpired();

            return false;
        }

        this.removeEffect(type);

        return true;
    }

    // AS3: EffectsModel.as::reactivateLastEffect()
    reactivateLastEffect(): void
    {
        if(this._lastActivatedEffect !== -1)
        {
            this.useEffect(this._lastActivatedEffect);
        }
    }

    // AS3: .../src/com/sulake/habbo/inventory/effects/EffectsModel.as::removeEffect()
    private removeEffect(type: number): void
    {
        for(let i = 0; i < this._effects.length; i++)
        {
            if(this._effects[i].type === type)
            {
                const effect = this._effects.splice(i, 1)[0];

                effect.dispose();

                return;
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/effects/EffectsModel.as::_activeListProxy
    // Derived name: obfuscated in the primary tree.
    private _activeListProxy: EffectListProxy = new EffectListProxy(this, EffectFilter.ACTIVE);
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/effects/EffectsModel.as::_inactiveListProxy
    // Derived name: obfuscated in the primary tree.
    private _inactiveListProxy: EffectListProxy = new EffectListProxy(this, EffectFilter.INACTIVE);

    /**
	 * Never assigned — and that is AS3's behaviour, not an omission.
	 *
	 * `EffectsModel.as` declares the field and never writes it, so `getWindowContainer()`
	 * answers null and `updateView()` does nothing in the 2026 client either: the effects UI
	 * moved to the me-menu widget and the inventory tab was left registered but empty.
	 * `EffectsView` is ported and ready if that is ever deliberately deviated from — assigning
	 * it here is the whole change — but the port does not invent a tab Sulake retired.
	 */
    // Derived name: obfuscated in the primary tree; named for what it holds.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/effects/EffectsModel.as::_view
    private _view: EffectsView | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/effects/EffectsModel.as::getWindowContainer()
    getWindowContainer(): IWindowContainer | null
    {
        return this._view ? this._view.getWindowContainer() : null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/effects/EffectsModel.as::requestInitialization()
    // Empty in AS3: the effects list arrives unsolicited.
    requestInitialization(): void
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/effects/EffectsModel.as::categorySwitch()
    // Empty in AS3.
    categorySwitch(_category: string): void
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/effects/EffectsModel.as::subCategorySwitch()
    // Empty in AS3.
    subCategorySwitch(_category: string): void
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/effects/EffectsModel.as::closingInventoryView()
    // Empty in AS3.
    closingInventoryView(): void
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/effects/EffectsModel.as::updateView()
    updateView(): void
    {
        if(this._view === null || this._view.disposed) return;

        this._view.updateListViews();
        this._view.updateActionView();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/effects/EffectsModel.as::selectItemById()
    selectItemById(itemId: string): void
    {
        this.setEffectSelected(parseInt(itemId, 10));
    }
}
