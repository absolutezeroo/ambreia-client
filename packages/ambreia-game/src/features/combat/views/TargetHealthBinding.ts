import type {IHudPanels} from '../../hud/IHud';
import type {ICombatModel} from '../ICombatModel';
import type {IVitals} from '../IVitals';

/** The target frame as this binding reads and patches it. */
export interface ITargetFrameState
{
    readonly value: Readonly<Pick<IHudPanels, 'target'>>;
    update(values: Partial<IHudPanels>): void;
}

/** The target frame's health bar follows its target's health in the model (spec §3.3). */
export class TargetHealthBinding
{
    private readonly _onVitals = (objectId: number, vitals: IVitals): void =>
    {
        const target = this._panels.value.target;

        if(target && this._model.target?.objectId === objectId) this._panels.update({target: {...target, hp: vitals.health, hpMax: vitals.maxHealth}});
    };

    constructor(private readonly _model: ICombatModel, private readonly _panels: ITargetFrameState)
    {
        _model.events.on('vitals', this._onVitals);
    }

    dispose(): void
    {
        this._model.events.off('vitals', this._onVitals);
    }
}
