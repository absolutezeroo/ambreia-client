import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {RpgDialogueMessage} from '@ambreia/protocol/incoming/rpg/quests/RpgDialogueMessage';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import {WindowBits} from '../../../ui/kit/WindowBits';
import {buildFrame} from '../../../ui/kit/buildFrame';
import {ChoiceRows} from './ChoiceRows';

/**
 * An NPC's dialogue (vortex_npc_dialog_xml, M2a §4.2): its portrait, name and role, what it says, the
 * choices. A choice is sent by its position; the server answers with the next node or closes it.
 * The quest box, rewards and the action button have nothing on the wire yet: hidden.
 */
export class DialogueWindow
{
    private _window: IWindowContainer | null = null;
    private readonly _rows: ChoiceRows;
    private _disposed = false;

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _figureOf: (objectId: number) => string | null,
        private readonly _actions: {choose(position: number): void; closed(): void}
    )
    {
        this._rows = new ChoiceRows(_windows, _bits);
    }

    get visible(): boolean
    {
        return this._window?.visible ?? false;
    }

    show(message: RpgDialogueMessage): void
    {
        if(this._disposed || !this.build()) return;

        const window = this._window!;
        const figure = this._figureOf(message.npcObjectId);
        const list = window.findChildByName('choice_list') as IItemListWindow | null;

        this._bits.setText(window, 'npc_name', this._bits.textOr(message.speaker, ''));
        this._bits.setText(window, 'npc_role', this._bits.textOr(message.speaker.replace(/\.name$/, '.description'), ''));
        this._bits.setText(window, 'dialog_txt', this._bits.textOr(message.text, message.text));
        this._bits.setVisible(window, figure !== null, 'npc_image');
        if(figure) this._bits.avatar(window, 'npc_image', figure, 2, true);
        if(list) this._rows.fill(list, message.choices, this._onEvent);

        window.visible = true;
        window.activate();
    }

    hide(): void
    {
        if(this._window) this._window.visible = false;
    }

    private build(): boolean
    {
        if(this._window) return true;

        this._window = buildFrame(this._windows, 'vortex_npc_dialog_xml', this._onEvent);

        if(!this._window) return false;

        this._bits.setVisible(this._window, false, 'status_badge', 'objective_box', 'reward_list', 'action_button');

        return true;
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        if(window.name === 'header_button_close')
        {
            this.hide();
            this._actions.closed();

            return;
        }

        const row = WindowBits.ancestor(window, 'npc_choice');

        if(row) this._actions.choose(row.id);
    };

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._window?.destroy();
        this._window = null;
    }
}
