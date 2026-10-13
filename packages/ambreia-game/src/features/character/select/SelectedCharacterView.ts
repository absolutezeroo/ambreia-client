import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IRpgCharacterListEntry} from '@ambreia/protocol/incoming/rpg/characters/IRpgCharacterListEntry';
import type {WindowBits} from '../../../ui/kit/WindowBits';

/** The selected character in full (stage and character_detail): its look, name, level and class, and « Entrer en jeu » (« Choisir une classe » for a starter). */
export class SelectedCharacterView
{
    constructor(private readonly _bits: WindowBits, private readonly _className: (entry: IRpgCharacterListEntry) => string) {}

    render(window: IWindowContainer, entry: IRpgCharacterListEntry | null): void
    {
        const play = window.findChildByName('play_button');

        this._bits.setText(window, 'selected_name', entry?.name ?? this._bits.text('vortex.charselect.empty'));
        this._bits.setText(window, 'selected_info', entry ? `${this._bits.text('vortex.ui.level.long', 'level', String(entry.level))} · ${this._className(entry)}` : '');
        this._bits.setVisible(window, entry !== null, 'selected_avatar');
        if(entry) this._bits.avatar(window, 'selected_avatar', entry.figure, 2);

        if(!play) return;

        play.caption = this._bits.text(entry?.starter ? 'vortex.charselect.choose_class' : 'vortex.charselect.play');
        if(entry) play.enable();
        else play.disable();
    }
}
