import type {WindowBits} from '../../../ui/kit/WindowBits';
import {SKILL_SLOTS, type IActionSlot, type ISlotTip} from '../../hud/IHud';
import {barSkill, type RpgSkillSession} from '../RpgSkillSession';

/** The HUD's six skill slots (M1b §10.3): the bar's icons, each with the end of its cooldown, its cost and its tooltip. */
export class SkillBarHud
{
    /**
     * @param icon - a skill's icon, from the content
     * @param write - the HUD's skill slots (PlayerHudState.setSlots('skills', …))
     * @param now - the model's monotonic clock; `wallNow` the HUD's
     */
    constructor(
        private readonly _book: Pick<RpgSkillSession, 'bar' | 'readyAt' | 'definition'>,
        private readonly _texts: () => Pick<WindowBits, 'text' | 'textOr' | 'contentName'>,
        private readonly _icon: (skillId: string) => string,
        private readonly _write: (slots: readonly Partial<IActionSlot>[]) => void,
        private readonly _now: () => number,
        private readonly _wallNow: () => number = Date.now
    ) {}

    render(): void
    {
        this._write(Array.from({length: SKILL_SLOTS}, (_, i) =>
        {
            const skillId = barSkill(this._book.bar[i] ?? '');

            if(skillId === null) return {icon: null, cooldownEnd: undefined, cost: undefined, tip: undefined};

            return {icon: this._icon(skillId), cooldownEnd: this.wallClock(this._book.readyAt(skillId)), cost: this._book.definition(skillId)?.cost, tip: this.tip(skillId, i + 1)};
        }));
    }

    /** A deadline of the model's monotonic clock, as the HUD's slots count it (the wall clock); 0 when over. */
    private wallClock(deadline: number): number
    {
        const left = deadline - this._now();

        return left > 0 ? this._wallNow() + left : 0;
    }

    /** A slot's tooltip (vortex_hud_slot_tip_xml): name, rank, cost and cooldown, description, key. */
    private tip(skillId: string, key: number): ISlotTip
    {
        const text = this._texts();
        const definition = this._book.definition(skillId);
        const meta = [text.text('vortex.skill.rank.short', 'level', '1')];

        if(definition) meta.push(`${text.text('vortex.skill.mana_cost')} : ${definition.cost}`, `${text.text('vortex.skill.cooldown.short')} : ${(definition.cooldownMs / 1000).toFixed(definition.cooldownMs % 1000 ? 1 : 0)} s`);

        return {
            title: text.contentName(`${skillId}.name`, skillId), tag: '', meta: meta.join(' · '),
            text: text.textOr(`${skillId}.description`, ''), effect: '', shortcut: text.text('vortex.hud.shortcut', 'key', String(key))
        };
    }
}
