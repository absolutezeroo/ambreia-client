import {Logger} from '@ambreia/common/utils/Logger';
import type {IFigureData} from '@ambreia/avatar/structure/IFigureData';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IRpgCharacterListEntry} from '@ambreia/protocol/incoming/rpg/characters/IRpgCharacterListEntry';
import {RpgCharacterResultMessage} from '@ambreia/protocol/incoming/rpg/characters/RpgCharacterResultMessage';
import {RpgCharacterCreateMessage} from '@ambreia/protocol/outgoing/rpg/characters/RpgCharacterCreateMessage';
import {RpgCharacterChooseClassMessage} from '@ambreia/protocol/outgoing/rpg/characters/RpgCharacterChooseClassMessage';
import {RpgEnterWorldMessage} from '@ambreia/protocol/outgoing/rpg/characters/RpgEnterWorldMessage';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import type {IRpgCharacterSession} from './IRpgCharacterSession';
import {CharacterCreateView, type ICharacterDraft} from './CharacterCreateView';
import {WindowBits} from './WindowBits';

const log = Logger.getLogger('habbo.features.character.CharacterScreen');

const LAYER = 1;
const SELECTED = 0xffcfe3f4;
const IDLE = 0xfff2f2ec;

/**
 * The characters screen (F3a §6.4, vortex_character_select_xml): the account's characters, the
 * one selected in full, "create" and "enter the world". A character still in the starter class
 * chooses its class first, through the creation wizard. Follows the session's list and results;
 * the feature hides it once the player is in a room.
 */
export class CharacterScreen
{
    private _window: IWindowContainer | null = null;
    private _create: CharacterCreateView | null = null;
    private _selected = 0;
    /** The class to give the character being created, once the server says it exists. */
    private _pendingClass: string | null = null;
    private _disposed = false;

    private readonly _onResize = (): void => this.place();
    private readonly _onCharacters = (): void => this.render();
    private readonly _onResult = (result: RpgCharacterResultMessage): void => this.onResult(result);

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _session: IRpgCharacterSession,
        private readonly _figureData: () => IFigureData | null
    )
    {
        _session.events.on('characters', this._onCharacters);
        _session.events.on('result', this._onResult);
    }

    get visible(): boolean
    {
        return this._window?.visible ?? false;
    }

    show(): void
    {
        if(this._disposed || !this.build()) return;

        this._window!.visible = true;
        this.render();
    }

    hide(): void
    {
        this.closeCreate();
        if(this._window) this._window.visible = false;
    }

    private build(): boolean
    {
        if(this._window) return true;

        const desktop = this._windows.getDesktop(LAYER) as IWindowContainer | null;

        this._window = this._windows.buildWidgetLayout('vortex_character_select_xml', LAYER) as IWindowContainer | null;

        if(!this._window || !desktop)
        {
            log.error('the characters screen (vortex_character_select_xml) did not build — no way into the world');
            this._window?.destroy();
            this._window = null;

            return false;
        }

        // Not in the F3a contract: no deletion, no zone, play time or dates yet.
        this._bits.setVisible(this._window, false, 'selected_zone', 'selected_details');
        desktop.addChild(this._window);
        this._window.procedure = this._onEvent;

        // A frame hides on its header X (FrameController.close()); on a screen that is the only way
        // forward the X is taken out instead of left dead.
        const headerClose = this._window.findChildByName('header_button_close');

        if(headerClose) headerClose.visible = false;
        this._window.addEventListener('WE_PARENT_RESIZED', this._onResize);
        this.place();

        return true;
    }

    private place(): void
    {
        const desktop = this._windows.getDesktop(LAYER);

        if(!desktop || !this._window) return;

        this._window.x = Math.round((desktop.width - this._window.width) / 2);
        this._window.y = Math.round((desktop.height - this._window.height) / 2);
    }

    private render(): void
    {
        const window = this._window;
        const list = this._session.characters;

        if(!window || !window.visible || !list) return;

        const characters = list.characters;

        if(!characters.some(entry => entry.playerId === this._selected)) this._selected = characters[0]?.playerId ?? 0;

        const rows = window.findChildByName('character_list') as IItemListWindow | null;

        rows?.destroyListItems();

        for(const entry of characters)
        {
            const row = this._windows.buildWidgetLayout('vortex_character_select_row_xml') as IWindowContainer | null;

            if(!row || !rows) break;

            row.id = entry.playerId;
            row.color = entry.playerId === this._selected ? SELECTED : IDLE;
            this._bits.avatar(row, 'avatar_image', entry.figure, 2, true);
            this._bits.setText(row, 'character_name', entry.name);
            this._bits.setText(row, 'character_level', this._bits.text('vortex.ui.level.long', 'level', String(entry.level)));
            this._bits.setText(row, 'character_class', ` · ${this.className(entry)}`);
            this._bits.setText(row, 'character_zone', '');
            this._bits.setVisible(row, false, 'delete_button');
            (row.findChildByName('character_line') as IItemListWindow | null)?.arrangeListItems();
            // A scrollable list answers its items' events itself: the row carries the screen's.
            row.procedure = this._onEvent;
            rows.addListItem(row);
        }

        this._bits.setText(window, 'slot_count', this._bits.text('vortex.charselect.slots', 'count', String(characters.length), 'max', String(list.maxCharacters)));

        const create = window.findChildByName('create_character_button');

        if(create)
        {
            if(characters.length < list.maxCharacters) create.enable();
            else create.disable();
        }

        this.renderSelected();
    }

    private renderSelected(): void
    {
        const window = this._window!;
        const entry = this.selected();
        const play = window.findChildByName('play_button');

        this._bits.setText(window, 'selected_name', entry?.name ?? this._bits.text('vortex.charselect.empty'));
        this._bits.setText(window, 'selected_info', entry ? `${this._bits.text('vortex.ui.level.long', 'level', String(entry.level))} · ${this.className(entry)}` : '');
        this._bits.setVisible(window, entry !== null, 'selected_avatar');
        if(entry) this._bits.avatar(window, 'selected_avatar', entry.figure, 2);

        if(play)
        {
            play.caption = this._bits.text(entry?.starter ? 'vortex.charselect.choose_class' : 'vortex.charselect.play');
            if(entry) play.enable();
            else play.disable();
        }

        const rows = window.findChildByName('character_list') as IItemListWindow | null;

        for(let i = 0; rows && i < rows.numListItems; i++)
        {
            const row = rows.getListItemAt(i);

            if(row) row.color = row.id === this._selected ? SELECTED : IDLE;
        }
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        const row = WindowBits.ancestor(window, 'character_row');

        if(row)
        {
            this._selected = row.id;
            this.renderSelected();

            return;
        }

        if(window.name === 'create_character_button') this.openCreate(null);
        else if(window.name === 'play_button') this.play();
    };

    private play(): void
    {
        const entry = this.selected();

        if(!entry) return;

        if(entry.starter)
        {
            this.openCreate(entry);

            return;
        }

        log.info(`entering the world as ${entry.name} (${entry.playerId})`);
        this._window?.findChildByName('play_button')?.disable();
        this._session.send(new RpgEnterWorldMessage(entry.playerId));
    }

    private openCreate(existing: IRpgCharacterListEntry | null): void
    {
        if(!this._window || this._create) return;

        this._create = new CharacterCreateView(
            this._windows,
            this._bits,
            this._figureData(),
            this._session.classes?.classes ?? [],
            {submit: draft => this.submit(draft), cancel: () => this.closeCreate()},
            existing
        );

        const desktop = this._windows.getDesktop(LAYER) as IWindowContainer | null;

        if(!desktop || !this._create.show(desktop))
        {
            this.closeCreate();

            return;
        }

        this._window.visible = false;
    }

    private closeCreate(): void
    {
        this._create?.dispose();
        this._create = null;
        this._pendingClass = null;

        if(this._window && !this._disposed)
        {
            this._window.visible = true;
            this.render();
        }
    }

    /** A new character is created first, then given its class: two requests, two answers. */
    private submit(draft: ICharacterDraft): void
    {
        if(draft.playerId > 0)
        {
            this._session.send(new RpgCharacterChooseClassMessage(draft.playerId, draft.classId));

            return;
        }

        this._pendingClass = draft.classId;
        this._session.send(new RpgCharacterCreateMessage(draft.name, draft.figure, draft.gender));
    }

    private onResult(result: RpgCharacterResultMessage): void
    {
        const ok = result.code === 'ok';

        if(result.action === RpgCharacterResultMessage.ACTION_CREATE && this._create)
        {
            if(ok && this._pendingClass && result.playerId > 0)
            {
                this._selected = result.playerId;
                this._session.send(new RpgCharacterChooseClassMessage(result.playerId, this._pendingClass));
                this._pendingClass = null;

                return;
            }

            if(!ok)
            {
                this._create.refused(result.code);
                if(result.code !== 'character.name_taken' && result.code !== 'character.name_invalid') this.alert(result.code);
            }

            return;
        }

        if(result.action === RpgCharacterResultMessage.ACTION_CHOOSE_CLASS && this._create)
        {
            if(!ok) this.alert(result.code);
            if(result.playerId > 0) this._selected = result.playerId;
            // Created but still classless on a refusal: the list offers to choose again.
            this.closeCreate();

            return;
        }

        if(result.action === RpgCharacterResultMessage.ACTION_ENTER_WORLD && !ok)
        {
            this.alert(result.code);
            this._window?.findChildByName('play_button')?.enable();
        }
    }

    private alert(code: string): void
    {
        log.info(`refused: ${code}`);
        this._windows.alert(this._bits.text('vortex.charselect.title'), this._bits.text(`vortex.charselect.error.${code}`), 0, null);
    }

    private selected(): IRpgCharacterListEntry | null
    {
        return this._session.characters?.characters.find(entry => entry.playerId === this._selected) ?? null;
    }

    private className(entry: IRpgCharacterListEntry): string
    {
        return this._bits.contentName(`vortex.${entry.classId}`, entry.classId);
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._session.events.off('characters', this._onCharacters);
        this._session.events.off('result', this._onResult);
        this._create?.dispose();
        this._window?.destroy();
        this._create = null;
        this._window = null;
    }
}
