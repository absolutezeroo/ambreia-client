import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemGridWindow} from '@ambreia/ui/components/IItemGridWindow';
import type {IRpgClassEntry} from '@ambreia/protocol/incoming/rpg/characters/IRpgClassEntry';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import {WindowBits} from '../../../ui/kit/WindowBits';
import type {ICharacterDraft} from './ICharacterDraft';
import {ACTIVE, IDLE} from './wizardLook';

/** The class step (vortex_character_create_class_card_xml per class): role, main stat, range; the starter class is not offered. */
export class ClassStepView
{
    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _classes: readonly IRpgClassEntry[],
        private readonly _onEvent: (event: WindowEvent, window: IWindow) => void
    ) {}

    render(page: IWindowContainer, draft: Readonly<ICharacterDraft>): void
    {
        const grid = page.findChildByName('class_grid') as IItemGridWindow | null;

        if(!grid) return;

        for(const entry of this._classes)
        {
            if(entry.starter) continue;

            const card = this._windows.buildWidgetLayout('vortex_character_create_class_card_xml') as IWindowContainer | null;

            if(!card) break;

            const key = `vortex.${entry.id}`;

            card.id = this._classes.indexOf(entry);
            card.color = entry.id === draft.classId ? ACTIVE.card : IDLE.card;
            this._bits.avatar(card, 'avatar_image', draft.figure);
            this._bits.setText(card, 'class_name', this._bits.contentName(key, entry.id));
            this._bits.setText(card, 'class_desc', this._bits.textOr(`${key}.desc`, ''));
            this._bits.setText(card, 'class_stat_0', this._bits.contentName(`vortex.role.${entry.role}`, entry.role));
            this._bits.setText(card, 'class_stat_1', this._bits.contentName(`vortex.stat.${entry.primaryStat}`, entry.primaryStat));
            this._bits.setText(card, 'class_stat_2', this._bits.text('vortex.charcreate.class.range', 'range', String(entry.range)));
            // Its own procedure: a scrollable grid answers its items' events itself, never the wizard's.
            card.procedure = this._onEvent;
            grid.addGridItem(card);
        }
    }

    /** The class of the card `window` is in; null off the cards. */
    classAt(window: IWindow): string | null
    {
        const card = WindowBits.ancestor(window, 'class_card');

        return card ? this._classes[card.id]?.id ?? '' : null;
    }
}
