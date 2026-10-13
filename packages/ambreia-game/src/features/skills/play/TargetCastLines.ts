import type {IScopedTimer} from '@ambreia/kernel/feature/FeatureScope';
import type {ICombatModel} from '../../combat/ICombatModel';
import type {IStatusEntry} from '../../combat/IStatusEntry';
import type {IHudCast} from '../../hud/IHud';
import type {IHudWriter} from './IHudWriter';
import {WhileTicker} from './WhileTicker';

/** How often the target frame's cast bar moves while its target casts. */
const CAST_TICK_MS = 100;

/** The target frame's effects and cast line, and the boss frame's cast line, moving while they cast. */
export class TargetCastLines
{
    private readonly _ticker: WhileTicker;

    /**
     * @param targetId - the player's target, 0 for none
     * @param name - a skill's name; `skillIcon` its icon, `statusIcon` a status's
     */
    constructor(
        private readonly _hud: () => IHudWriter | null,
        private readonly _model: Pick<ICombatModel, 'castOf' | 'statusesOf'>,
        private readonly _targetId: () => number,
        private readonly _skillIcon: (skillId: string) => string,
        private readonly _statusIcon: (statusId: string) => string,
        private readonly _name: (skillId: string) => string,
        private readonly _now: () => number,
        interval: (run: () => void, ms: number) => IScopedTimer
    )
    {
        this._ticker = new WhileTicker(interval, () => this.render(), CAST_TICK_MS);
    }

    render(): void
    {
        const hud = this._hud();
        const target = hud?.value.target ?? null;
        const boss = hud?.value.boss ?? null;
        const id = this._targetId();
        let casting = false;

        if(hud && target && id !== 0)
        {
            const own = this.castOf(id);

            hud.update({target: {...target, debuffs: this.icons(this._model.statusesOf(id)), cast: own.cast}});
            casting ||= own.casting;
        }

        if(hud && boss?.objectId !== undefined)
        {
            const own = this.castOf(boss.objectId);

            if(own.cast !== null || boss.cast) hud.update({boss: {...boss, cast: own.cast}});
            casting ||= own.casting;
        }

        this._ticker.sync(casting);
    }

    stop(): void
    {
        this._ticker.stop();
    }

    /** What `objectId` casts right now for a frame's cast line, and whether it is still going. */
    private castOf(objectId: number): {cast: IHudCast | null; casting: boolean}
    {
        const cast = this._model.castOf(objectId);
        const elapsed = cast ? Math.min(cast.durationMs, this._now() - cast.startedAt) / 1000 : 0;

        return {
            cast: cast && {icon: this._skillIcon(cast.skillId), name: this._name(cast.skillId), elapsed, duration: cast.durationMs / 1000},
            casting: cast !== null && elapsed < cast.durationMs / 1000
        };
    }

    private icons(statuses: readonly IStatusEntry[]): string[]
    {
        return statuses.map(status => this._statusIcon(status.statusId));
    }
}
