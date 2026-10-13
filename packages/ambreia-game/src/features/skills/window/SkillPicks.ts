import type {IWindow} from '@ambreia/ui/IWindow';

/** The tiles and list rows the window drew, to the skill each shows: what a click or a press picks. */
export class SkillPicks
{
    private readonly _skills = new Map<IWindow, string>();

    set(window: IWindow, skillId: string): void
    {
        this._skills.set(window, skillId);
    }

    /** The tile or row `window` is in: its skill, or null. */
    of(window: IWindow): string | null
    {
        for(let at: IWindow | null = window; at; at = at.parent)
        {
            const skillId = this._skills.get(at);

            if(skillId !== undefined) return skillId;
        }

        return null;
    }

    clear(): void
    {
        this._skills.clear();
    }
}
