import type {WindowBits} from '../../../ui/kit/WindowBits';
import {SELECTED_MS} from '../../../ui/kit/hudRules';
import type {IActionSlot} from '../../hud/IHud';
import {barSkill, type RpgSkillSession} from '../RpgSkillSession';
import type {IHudWriter} from './IHudWriter';

/**
 * A bar slot used (its key 1–6 or a click): the skill is cast on the current target, or, for a
 * ground skill, once the player picked a floor tile (RoomEngine.pickRpgTile()). Escape gives up the
 * pick or the player's own cast.
 */
export class SkillUse
{
    /** A ground skill waits for a floor click. */
    private _picking = false;

    /**
     * @param flash - marks a slot as taken (PlayerHudState.setSlot('skills', …))
     * @param pickTile - waits for a floor tile, null to give up waiting
     * @param casting - the player's own cast is under way
     */
    constructor(
        private readonly _session: Pick<RpgSkillSession, 'bar' | 'definition' | 'cast' | 'cancel'>,
        private readonly _hud: () => IHudWriter | null,
        private readonly _texts: () => Pick<WindowBits, 'text' | 'contentName'>,
        private readonly _flash: (slot: number, values: Partial<IActionSlot>) => void,
        private readonly _pickTile: (picked: ((x: number, y: number) => void) | null) => void,
        private readonly _targetId: () => number,
        private readonly _casting: () => boolean
    ) {}

    use(slot: number): void
    {
        const skillId = barSkill(this._session.bar[slot] ?? '');

        if(skillId === null) return;

        // The slot shows it was taken, briefly (mock-up: « sélectionné »).
        this._flash(slot, {selected: true});
        setTimeout(() => this._flash(slot, {selected: false}), SELECTED_MS);

        if(this._session.definition(skillId)?.target === 'ground')
        {
            const text = this._texts();

            this._hud()?.update({alert: text.text('vortex.skill.ground.pick', 'skill', text.contentName(`${skillId}.name`, skillId))});
            this._picking = true;
            this._pickTile((x, y) =>
            {
                this._picking = false;
                this._hud()?.update({alert: null});
                this._session.cast(skillId, 0, x, y);
            });

            return;
        }

        // The server reads the target by the skill's mode (M1b §6.6): ignored for self and around the caster.
        this._session.cast(skillId, this._targetId());
    }

    /** Escape: gives up the tile pick or the player's own cast; false when there was neither (the key goes on). */
    escape(): boolean
    {
        const casting = this._casting();

        if(!this._picking && !casting) return false;

        if(this._picking) this.stopPicking();
        if(casting) this._session.cancel();

        return true;
    }

    /** No tile pick any more (Escape, a zone left). */
    stopPicking(): void
    {
        const was = this._picking;

        this._picking = false;
        this._pickTile(null);
        if(was) this._hud()?.update({alert: null});
    }
}
