import type {IHudPanels} from '../../hud/IHud';
import type {ICombatModel} from '../ICombatModel';
import {targetOfTarget, type WhoIs} from './targetOfTarget';

/** What this binding writes. */
export interface ITargetOfTargetPanel
{
    update(values: Partial<IHudPanels>): void;
}

/** The compact frame beside the target follows whom the target aims at (M1d §4). */
export class TargetOfTargetBinding
{
    private readonly _render = (): void => this._panels.update({targetOfTarget: targetOfTarget(this._model, this._who)});

    constructor(private readonly _model: ICombatModel, private readonly _panels: ITargetOfTargetPanel, private readonly _who: WhoIs)
    {
        _model.events.on('target', this._render);
        _model.events.on('targets', this._render);
        _model.events.on('vitals', this._render);
    }

    dispose(): void
    {
        this._model.events.off('target', this._render);
        this._model.events.off('targets', this._render);
        this._model.events.off('vitals', this._render);
    }
}
