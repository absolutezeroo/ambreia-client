import {attackSlotState} from '../../../ui/kit/hudRules';
import type {IPlayerHud} from '../../hud/IHud';
import type {ICombatModel} from '../ICombatModel';
import {DoubleSelect} from './DoubleSelect';

/** A second click this soon after the first on the same monster attacks it. */
const DOUBLE_CLICK_MS = 400;

/** What this binding writes into the action bar. */
export interface IAttackSlotTarget
{
    update(values: Partial<Omit<IPlayerHud, 'skills' | 'items'>>): void;
}

/**
 * The auto-attack as an act (M1d §2.3): the button and the T key toggle it, a double click on a
 * monster starts it. It only asks (`send`); the button shows the model's state, which is the
 * server's answer (RpgAutoAttackState), never the click.
 */
export class AttackBinding
{
    private readonly _double = new DoubleSelect(DOUBLE_CLICK_MS);
    private readonly _render = (): void => this._slot.update({
        attack: attackSlotState({autoAttacking: this._model.self.autoAttacking, hasMonsterTarget: this.monsterTargeted()})
    });

    constructor(private readonly _model: ICombatModel, private readonly _slot: IAttackSlotTarget, private readonly _send: (active: boolean) => void)
    {
        _model.events.on('self', this._render);
        _model.events.on('target', this._render);
    }

    /** The button, the key: start on a monster target, stop when attacking. */
    toggle(): void
    {
        if(this._model.self.death.kind !== 'alive') return;

        if(this._model.self.autoAttacking) this._send(false);
        else if(this.monsterTargeted()) this._send(true);
    }

    /** A room object was selected (a click): the second click on a monster attacks it. */
    selected(objectId: number, monster: boolean, now: number): void
    {
        if(!this._double.select(objectId, now) || !monster) return;
        if(this._model.self.death.kind === 'alive' && !this._model.self.autoAttacking) this._send(true);
    }

    private monsterTargeted(): boolean
    {
        return this._model.target?.kind === 'monster';
    }

    dispose(): void
    {
        this._model.events.off('self', this._render);
        this._model.events.off('target', this._render);
    }
}
