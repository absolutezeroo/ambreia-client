import {Logger} from '@ambreia/common/utils/Logger';
import type {IFigureData} from '@ambreia/avatar/structure/IFigureData';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IRpgCharacterListEntry} from '@ambreia/protocol/incoming/rpg/characters/IRpgCharacterListEntry';
import {RpgCharacterResultMessage} from '@ambreia/protocol/incoming/rpg/characters/RpgCharacterResultMessage';
import {RpgEnterWorldMessage} from '@ambreia/protocol/outgoing/rpg/characters/RpgEnterWorldMessage';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import {pinWindow} from '../../ui/kit/pinWindow';
import type {IRpgCharacterSession} from './IRpgCharacterSession';
import {CharacterCreateView} from './CharacterCreateView';
import {WindowBits} from '../../ui/kit/WindowBits';
import {CharacterListView} from './select/CharacterListView';
import {CreationFlow} from './select/CreationFlow';
import {SelectedCharacterView} from './select/SelectedCharacterView';

const log = Logger.getLogger('habbo.features.character.CharacterScreen');

const LAYER = 1;

/**
 * The characters screen (F3a §6.4, vortex_character_select_xml): the account's characters, the
 * one selected in full, "create" and "enter the world". A character still in the starter class
 * chooses its class first, through the creation wizard. Follows the session's list and results;
 * the feature hides it once the player is in a room. This one builds the screen, keeps the selection
 * and routes; the list, the selected character and the wizard's requests are their own units (select/).
 */
export class CharacterScreen
{
    private _window: IWindowContainer | null = null;
    private _create: CharacterCreateView | null = null;
    private _selected = 0;
    private readonly _list: CharacterListView;
    private readonly _detail: SelectedCharacterView;
    private readonly _flow: CreationFlow;
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
        const className = (entry: IRpgCharacterListEntry): string => _bits.contentName(`vortex.${entry.classId}`, entry.classId);

        this._list = new CharacterListView(_windows, _bits, className, this._onEvent);
        this._detail = new SelectedCharacterView(_bits, className);
        this._flow = new CreationFlow(message => _session.send(message));
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
        pinWindow(this._window);
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

        this._list.render(window, characters, this._selected);
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
        this._detail.render(this._window!, this.selected());
        this._list.highlight(this._window!, this._selected);
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
            {submit: draft => this._flow.submit(draft), cancel: () => this.closeCreate()},
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
        this._flow.reset();

        if(this._window && !this._disposed)
        {
            this._window.visible = true;
            this.render();
        }
    }

    private onResult(result: RpgCharacterResultMessage): void
    {
        if(this._create && result.action !== RpgCharacterResultMessage.ACTION_ENTER_WORLD)
        {
            const outcome = this._flow.result(result);

            if(outcome.kind === 'classing')
            {
                this._selected = outcome.playerId;
            }
            else if(outcome.kind === 'refused')
            {
                this._create.refused(outcome.code);
                if(outcome.alert) this.alert(outcome.code);
            }
            else if(outcome.kind === 'done')
            {
                if(outcome.refusal) this.alert(outcome.refusal);
                if(outcome.playerId > 0) this._selected = outcome.playerId;
                this.closeCreate();
            }

            return;
        }

        if(result.action === RpgCharacterResultMessage.ACTION_ENTER_WORLD && result.code !== 'ok')
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
