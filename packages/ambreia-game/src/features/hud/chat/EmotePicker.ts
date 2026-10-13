import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemGridWindow} from '@ambreia/ui/components/IItemGridWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import {WindowBits} from '../../../ui/kit/WindowBits';
import {EMOTICONS, RP_ACTIONS} from '../../../ui/kit/chatModel';
import {buildPopup} from '../placePopup';
import type {PopupSlot} from '../PopupSlot';

const OWNER = 'emotes';

/** The chat's palette (vortex_hud_chat_emotes_xml): the emoticons it types, the RP actions the avatar plays. */
export class EmotePicker
{
    /**
     * @param onEmote - an RP action (`wave`…) was picked
     * @param onEmoticon - an emoticon's text was picked
     */
    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _slot: PopupSlot,
        private readonly _layer: number,
        private readonly _onEmote: (emote: string) => void,
        private readonly _onEmoticon: (text: string) => void
    ) {}

    toggle(anchor: IWindow): void
    {
        if(this._slot.closeFor(OWNER)) return;

        const panel = buildPopup(this._windows, 'vortex_hud_chat_emotes_xml', this._layer, anchor);

        if(!panel) return;

        const grid = panel.findChildByName('emote_grid') as IItemGridWindow | null;
        const actions = panel.findChildByName('action_grid') as IItemGridWindow | null;

        EMOTICONS.forEach((emoticon, index) =>
        {
            const cell = grid ? this._windows.buildWidgetLayout('vortex_hud_chat_emote_xml') as IWindowContainer | null : null;
            const icon = cell?.findChildByName('emote_icon') as IStaticBitmapWrapperWindow | null;

            if(!cell || !grid) return;

            if(icon) icon.assetUri = emoticon.icon;
            cell.id = index;
            // A grid answers its items' events itself: the cell carries the panel's.
            cell.procedure = this._onEvent;
            grid.addGridItem(cell);
        });

        RP_ACTIONS.forEach((action, index) =>
        {
            const cell = actions ? this._windows.buildWidgetLayout('vortex_hud_chat_action_xml') as IWindowContainer | null : null;
            const icon = cell?.findChildByName('action_icon') as IStaticBitmapWrapperWindow | null;

            if(!cell || !actions) return;

            if(icon) icon.assetUri = action.icon;
            this._bits.setText(cell, 'action_label', this._bits.text(action.key));
            cell.id = index;
            cell.procedure = this._onEvent;
            actions.addGridItem(cell);
        });

        panel.procedure = this._onEvent;
        this._slot.hold(OWNER, panel);
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        if(WindowBits.ancestor(window, 'close_button'))
        {
            this._slot.close();

            return;
        }

        const action = WindowBits.ancestor(window, 'action_cell');

        if(action && RP_ACTIONS[action.id])
        {
            this._onEmote(RP_ACTIONS[action.id].emote);

            return;
        }

        const cell = WindowBits.ancestor(window, 'emote_cell');
        const emoticon = cell ? EMOTICONS[cell.id] : undefined;

        // The palette stays open: several at a time.
        if(emoticon) this._onEmoticon(emoticon.text);
    };
}
