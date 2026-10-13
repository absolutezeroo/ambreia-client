import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IRpgClassEntry} from '@ambreia/protocol/incoming/rpg/characters/IRpgClassEntry';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {partColor} from '../CharacterLook';
import type {ICharacterDraft} from './ICharacterDraft';
import type {StarterWardrobe} from './StarterWardrobe';
import {SWATCHES} from './wizardLook';

/** The summary: name, class, the character turned as the preview was, its hair and skin colours. */
export class ConfirmStepView
{
    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _classes: readonly IRpgClassEntry[],
        private readonly _wardrobe: StarterWardrobe
    ) {}

    render(page: IWindowContainer, draft: Readonly<ICharacterDraft>, direction: number): void
    {
        const entry = this._classes.find(item => item.id === draft.classId);
        const summary = page.findChildByName('summary_list') as IItemListWindow | null;
        const values = [draft.name, entry ? this._bits.contentName(`vortex.${entry.id}`, entry.id) : ''];

        values.forEach((value, i) =>
        {
            const row = summary?.getListItemAt(i) as IWindowContainer | null;

            if(row) this._bits.setText(row, 'summary_value', value);
        });

        this._bits.avatar(page, 'final_avatar', draft.figure, direction);

        // The look in two swatches: hair and skin.
        const looks = page.findChildByName('look_list') as IWindowContainer | null;

        ['hr', 'hd'].forEach((type, i) =>
        {
            const colorId = partColor(draft.figure, type);
            const swatch = this._windows.buildWidgetLayout('vortex_character_create_swatch_xml') as IWindowContainer | null;

            if(!looks || !swatch || colorId === null) return;

            swatch.x = i * (SWATCHES.size + 6);
            this._bits.setColor(swatch, 'swatch_color', 0xff000000 | this._wardrobe.rgb(type, colorId));
            looks.addChild(swatch);
        });
    }
}
