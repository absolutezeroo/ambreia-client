import type {IScopedTimer} from '@ambreia/kernel/feature/FeatureScope';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {expiring} from '../../../ui/kit/hudRules';
import type {ICombatModel} from '../../combat/ICombatModel';
import {statusTime} from '../RpgSkillSession';
import type {IHudWriter} from './IHudWriter';
import {WhileTicker} from './WhileTicker';

/** The player's effects panel: each status's icon with its time left, ticking every second while one has an end. */
export class OwnEffectsPanel
{
    private readonly _ticker: WhileTicker;

    /** @param self - the player's object id */
    constructor(
        private readonly _hud: () => IHudWriter | null,
        private readonly _model: Pick<ICombatModel, 'statusesOf'>,
        private readonly _self: () => number,
        private readonly _icon: (statusId: string) => string,
        private readonly _texts: () => Pick<WindowBits, 'text' | 'contentName'>,
        private readonly _now: () => number,
        interval: (run: () => void, ms: number) => IScopedTimer
    )
    {
        this._ticker = new WhileTicker(interval, () => this.render(), 1000);
    }

    render(): void
    {
        const now = this._now();
        const own = this._model.statusesOf(this._self()).filter(status => status.endsAt === null || status.endsAt > now);
        const text = this._texts();

        this._hud()?.update({
            buffs: own.map(status => this._icon(status.statusId)),
            buffTimes: own.map(status => status.endsAt === null ? '' : statusTime(status.endsAt - now)),
            buffExpiring: own.map(status => expiring(status.endsAt === null ? null : status.endsAt - now)),
            buffTips: own.map(status => text.contentName(`${status.statusId}.name`, status.statusId)
                + (status.endsAt === null ? '' : `\n${text.text('vortex.hud.remaining', 'seconds', String(Math.ceil((status.endsAt - now) / 1000)))}`))
        });

        this._ticker.sync(own.some(status => status.endsAt !== null));
    }

    /** The zone was left: no effect shows. */
    clear(): void
    {
        this._ticker.stop();
        this._hud()?.update({buffs: [], buffTimes: [], buffExpiring: [], buffTips: []});
    }
}
