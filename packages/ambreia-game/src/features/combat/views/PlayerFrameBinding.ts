import type {IPlayerHud} from '../../hud/IHud';
import type {ICombatModel} from '../ICombatModel';
import type {ISelf} from '../ISelf';
import type {IVitals} from '../IVitals';

/** What this binding writes into the player frame. */
export interface IPlayerFrameTarget
{
    update(values: Partial<Omit<IPlayerHud, 'skills' | 'items'>>): void;
}

/**
 * The player frame follows the model (spec §3.3): health and mana from the own vitals, the « in
 * combat » colour from the self state. The only writer of the frame's current health and mana: the
 * character's stats give the maxima, never the current values.
 */
export class PlayerFrameBinding
{
    private readonly _onVitals = (vitals: IVitals): void => this._frame.update({hp: vitals.health, hpMax: vitals.maxHealth, mana: vitals.mana, manaMax: vitals.maxMana});
    private readonly _onSelf = (self: ISelf): void => this._frame.update({inCombat: self.inCombat});

    constructor(private readonly _model: ICombatModel, private readonly _frame: IPlayerFrameTarget)
    {
        _model.events.on('ownVitals', this._onVitals);
        _model.events.on('self', this._onSelf);
    }

    dispose(): void
    {
        this._model.events.off('ownVitals', this._onVitals);
        this._model.events.off('self', this._onSelf);
    }
}
