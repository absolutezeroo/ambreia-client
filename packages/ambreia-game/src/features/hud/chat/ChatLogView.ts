import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import {WindowBits} from '../../../ui/kit/WindowBits';
import {CHAT_CHANNELS, chatLinesOf, PLAIN_COLOR, splitEmoticons, TEXT_SIZES, type IChatLine} from '../../../ui/kit/chatModel';
import type {HudPanelsState, IHudPanels} from '../HudPanelsState';

/** `[item:item.weapon.rusted_sword]` in a chat line (F3c §10.3). */
const ITEM_LINK = /\[item:([^\]]+)\]/g;
/** The texts of vortex_hud_chat_line_xml, resized with the text size setting. */
const LINE_TEXTS = ['time_txt', 'channel_txt', 'author_txt', 'message_txt'];

/** The lines of the open tab (vortex_hud_chat_line_xml), newest last; a name opens a whisper with them. */
export class ChatLogView
{
    /** What the log was last built from. */
    private _from: unknown[] = [];
    private readonly _rows = new Map<IWindow, IChatLine>();

    /**
     * @param onNewLine - a line arrived (it wakes an idle chat up)
     * @param openWhisper - a name in the log was clicked
     */
    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _state: HudPanelsState,
        private readonly _onNewLine: () => void,
        private readonly _openWhisper: (name: string) => void
    ) {}

    render(window: IWindowContainer, value: Readonly<IHudPanels>): void
    {
        const settings = value.chatSettings;
        const tab = this._state.openTab;
        const from = [value.chat, tab, settings];
        const log = window.findChildByName('chat_log') as IItemListWindow | null;

        if(!log || from.every((item, i) => item === this._from[i])) return;

        if(value.chat !== this._from[0] && this._from.length > 0) this._onNewLine();

        this._from = from;
        log.destroyListItems();
        this._rows.clear();

        for(const line of chatLinesOf(value.chat, tab, settings))
        {
            const row = this._windows.buildWidgetLayout('vortex_hud_chat_line_xml') as IWindowContainer | null;

            if(!row) return;

            const channel = CHAT_CHANNELS[line.channel];
            const color = settings.colors ? channel.color : PLAIN_COLOR;
            const message = line.message.replace(ITEM_LINK, (_link, id: string) => `[${this._bits.contentName(`${id}.name`, id)}]`);

            this._bits.setText(row, 'time_txt', settings.time ? `[${line.time}] ` : '');
            this._bits.setText(row, 'channel_txt', `[${this._bits.text(channel.key)}] `);
            this._bits.setTextColor(row, 'channel_txt', color);
            this._bits.setText(row, 'author_txt', line.author === '' ? '' : `${line.author} : `);
            this._bits.setTextColor(row, 'author_txt', color);
            const texts = LINE_TEXTS.map(name => row.findChildByName(name) as ITextWindow | null);

            this.fillMessage(row, message, texts);

            for(const text of texts) if(text && text.fontSize !== TEXT_SIZES[settings.textSize]) text.fontSize = TEXT_SIZES[settings.textSize];

            // A scrollable list answers its items' events itself: the row carries the log's.
            row.procedure = this._onRowEvent;
            this._rows.set(row, line);
            log.addListItem(row);
        }

        // The newest line at the bottom, in view.
        log.scrollV = 1;
    }

    /**
     * The message into message_txt, then, at each emoticon of the palette, its icon and a new text
     * piece after it in the row (an itemlist): the pixel font has no emoji. Adds the pieces to `texts`.
     */
    private fillMessage(row: IWindowContainer, message: string, texts: Array<ITextWindow | null>): void
    {
        let first = true;

        for(const piece of splitEmoticons(message))
        {
            if('text' in piece && first)
            {
                this._bits.setText(row, 'message_txt', piece.text);
            }
            else if('text' in piece)
            {
                const text = this._windows.buildWidgetLayout('vortex_hud_chat_piece_xml') as ITextWindow | null;

                if(!text) break;

                text.caption = piece.text;
                texts.push(text);
                (row as unknown as IItemListWindow).addListItem(text);
            }
            else
            {
                const icon = this._windows.buildWidgetLayout('vortex_hud_chat_inline_emoji_xml') as IStaticBitmapWrapperWindow | null;

                if(!icon) break;

                icon.assetUri = piece.icon;
                (row as unknown as IItemListWindow).addListItem(icon);
            }

            first = false;
        }
    }

    /** A name in the log (author_txt takes the mouse: params 17) opens a whisper tab with that player. */
    private readonly _onRowEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK' || window.name !== 'author_txt') return;

        const row = WindowBits.ancestor(window, 'chat_line');
        const line = row ? this._rows.get(row) ?? null : null;

        // For a whisper, the other one of the conversation, whoever wrote the line.
        if(line && line.author !== '') this._openWhisper(line.channel === 'whisper' && line.target ? line.target : line.author);
    };

    dispose(): void
    {
        this._rows.clear();
    }
}
