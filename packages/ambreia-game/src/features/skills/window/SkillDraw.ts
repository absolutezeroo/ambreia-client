import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {FALLBACK_SKILL, iconOf} from '../contentIcons';
import type {ISkillBook} from './ISkillBook';
import {TILE, TILE_SELECTED} from './skillColors';

/** What the skills window's parts draw alike: a skill's icon and name, a bar slot. */
export class SkillDraw
{
    constructor(private readonly _bits: WindowBits, private readonly _book: Pick<ISkillBook, 'definition'>) {}

    /** A skill's name as the player reads it. */
    name(skillId: string): string
    {
        return this._bits.contentName(`${skillId}.name`, skillId);
    }

    /** `<name>` shows the skill's icon from the content; hidden for none. */
    icon(container: IWindowContainer, name: string, skillId: string | null): void
    {
        const icon = container.findChildByName(name) as IStaticBitmapWrapperWindow | null;

        if(!icon) return;

        icon.visible = skillId !== null;
        if(skillId !== null) icon.assetUri = iconOf(this._book.definition(skillId), FALLBACK_SKILL);
    }

    /** A bar slot: its skill's icon, else the « + » of an empty slot (states_skills.png). */
    slot(slot: IWindowContainer, skillId: string | null, selected: boolean): void
    {
        const box = slot.findChildByName('slot_box') as IWindowContainer | null;

        this.icon(slot, 'slot_icon', skillId);
        if(!box) return;

        box.color = selected ? TILE_SELECTED : TILE;

        // The « + » has no name of its own.
        for(let i = 0; i < box.numChildren; i++)
        {
            const child = box.getChildAt(i);

            if(child?.caption === '+') child.visible = skillId === null;
        }
    }
}
