import {Logger} from '@ambreia/common/utils/Logger';
import type {IFigureData} from '@ambreia/avatar/structure/IFigureData';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemGridWindow} from '@ambreia/ui/components/IItemGridWindow';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import type {IRpgClassEntry} from '@ambreia/protocol/incoming/rpg/characters/IRpgClassEntry';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import {nameRules, partColor, withPartColor, withPartSet} from './CharacterLook';
import {WindowBits} from './WindowBits';

const log = Logger.getLogger('habbo.features.character.CharacterCreateView');

/** The steps, in the mock-up's order (vortex_character_create_xml's step list). */
const STEPS = ['class', 'appearance', 'name', 'confirm'] as const;
type Step = typeof STEPS[number];
const STEP_LAYOUTS: Record<Step, string> = {
    class: 'vortex_character_create_step_class_xml',
    appearance: 'vortex_character_create_step_appearance_xml',
    name: 'vortex_character_create_step_name_xml',
    confirm: 'vortex_character_create_step_confirm_xml'
};

/** Appearance tabs: 0 whole looks, then one part type each (face, hair, top, bottom). */
const CATEGORY_PARTS = [null, 'hd', 'hr', 'ch', 'lg'] as const;
/** preset_grid holds 4 × 3 tiles of 50 px; a palette grid 7 × 2 swatches of 22 px. */
const TILES = {columns: 4, count: 12, size: 50, gap: 6};
const SWATCHES = {columns: 7, count: 14, size: 22, gap: 1, rowGap: 8};

const ACTIVE = {row: 0xffcfe3f4, badge: 0xff2a8fd6, tab: 0xffcfe3f4, card: 0xffcfe3f4};
const IDLE = {row: 0xfff2f2ec, badge: 0xffd0d0c8, tab: 0xffe4e4dc, card: 0xfff2f2ec};
const RULE_OK = 0x40b030;
const RULE_BAD = 0xd04030;
const RULE_UNKNOWN = 0xa0a0a0;

/** What the wizard hands back: a new character, or only the class of an existing starter one. */
export interface ICharacterDraft
{
    /** The existing character whose class is being chosen; 0 for a new one. */
    playerId: number;
    name: string;
    figure: string;
    gender: 'M' | 'F';
    classId: string;
}

/**
 * The character creation wizard (vortex_character_create_xml and its four steps): class, look,
 * name, then a summary. For a character still in the starter class it only asks the class. The
 * wizard says what was chosen; the characters screen sends it and reports the server's answer back.
 */
export class CharacterCreateView
{
    private _window: IWindowContainer | null = null;
    private _page: IWindowContainer | null = null;
    private _step: Step = 'class';
    private _category = 0;
    private _direction = 2;
    private _nameTaken = false;
    private _busy = false;
    private readonly _draft: ICharacterDraft;
    private _disposed = false;

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _figureData: IFigureData | null,
        private readonly _classes: readonly IRpgClassEntry[],
        private readonly _actions: {submit(draft: ICharacterDraft): void; cancel(): void},
        existing: {playerId: number; name: string; figure: string; gender: string} | null = null
    )
    {
        const gender = existing?.gender === 'F' ? 'F' : 'M';

        this._draft = {
            playerId: existing?.playerId ?? 0,
            name: existing?.name ?? '',
            figure: existing?.figure ?? this.presets().find(preset => preset.gender === gender)?.figure ?? '',
            gender,
            classId: ''
        };
    }

    /** Only the class is asked: the character exists, in the starter class. */
    private get classOnly(): boolean
    {
        return this._draft.playerId > 0;
    }

    show(parent: IWindowContainer): boolean
    {
        this._window = this._windows.buildWidgetLayout('vortex_character_create_xml') as IWindowContainer | null;

        if(!this._window)
        {
            log.error('the creation wizard (vortex_character_create_xml) did not build');

            return false;
        }

        parent.addChild(this._window);
        this._window.x = Math.round((parent.width - this._window.width) / 2);
        this._window.y = Math.round((parent.height - this._window.height) / 2);
        this._window.procedure = this._onEvent;

        // A frame hides on its header X (FrameController.close()); on a screen that is the only way
        // forward the X is taken out instead of left dead.
        const headerClose = this._window.findChildByName('header_button_close');

        if(headerClose) headerClose.visible = false;
        this.goTo('class');

        return true;
    }

    /** The server refused: back to the step that can fix it, or just usable again. */
    refused(code: string): void
    {
        this._busy = false;
        this._window?.enable();

        if(code === 'character.name_taken')
        {
            this._nameTaken = true;
            this.goTo('name');
        }
        else if(code === 'character.name_invalid')
        {
            this.goTo('name');
        }
    }

    private goTo(step: Step): void
    {
        const window = this._window;
        const slot = window?.findChildByName('step_slot') as IWindowContainer | null;

        if(!window || !slot) return;

        this._page?.destroy();
        this._page = this._windows.buildWidgetLayout(STEP_LAYOUTS[step]) as IWindowContainer | null;
        this._step = step;

        if(!this._page)
        {
            log.error(`the ${step} step (${STEP_LAYOUTS[step]}) did not build`);

            return;
        }

        slot.addChild(this._page);

        const steps = window.findChildByName('step_list') as IItemListWindow | null;

        STEPS.forEach((name, i) =>
        {
            const row = steps?.getListItemAt(i) as IWindowContainer | null;

            if(!row) return;

            row.color = name === step ? ACTIVE.row : IDLE.row;
            this._bits.setColor(row, 'step_badge', name === step ? ACTIVE.badge : IDLE.badge);
            this._bits.setText(row, 'step_number', String(i + 1));
            // The mock-up draws step 1 as the current one: its colours move with the step.
            this._bits.setTextColor(row, 'step_number', name === step ? 0xffffff : 0x777777);
            this._bits.setTextColor(row, 'step_label', name === step ? 0x000000 : 0x999999);
            this._bits.setText(row, 'step_label', this._bits.text(['vortex.character.class', 'vortex.charcreate.step.appearance', 'vortex.mapeditor.field.name', 'vortex.charcreate.step.confirm'][i]));
            if(this.classOnly && (name === 'appearance' || name === 'name')) row.visible = false;
        });
        steps?.arrangeListItems();

        if(step === 'class') this.renderClasses();
        else if(step === 'appearance') this.renderAppearance();
        else if(step === 'name') this.renderName();
        else this.renderConfirm();

        this.renderButtons();
    }

    private renderButtons(): void
    {
        const window = this._window!;
        const last = this._step === 'confirm';

        this._bits.setVisible(window, this._step !== 'class', 'previous_button');
        this._bits.setVisible(window, !last, 'next_button');
        this._bits.setVisible(window, last, 'create_button');

        const next = window.findChildByName('next_button');

        if(next)
        {
            if(this.stepDone()) next.enable();
            else next.disable();
        }
    }

    private stepDone(): boolean
    {
        if(this._step === 'class') return this._draft.classId.length > 0;

        if(this._step === 'name')
        {
            const rules = nameRules(this._draft.name);

            return rules.length && rules.chars && rules.spaces && !this._nameTaken;
        }

        return true;
    }

    private renderClasses(): void
    {
        const grid = this._page!.findChildByName('class_grid') as IItemGridWindow | null;

        if(!grid) return;

        for(const entry of this._classes)
        {
            if(entry.starter) continue;

            const card = this._windows.buildWidgetLayout('vortex_character_create_class_card_xml') as IWindowContainer | null;

            if(!card) break;

            const key = `vortex.${entry.id}`;

            card.id = this._classes.indexOf(entry);
            card.color = entry.id === this._draft.classId ? ACTIVE.card : IDLE.card;
            this._bits.avatar(card, 'avatar_image', this._draft.figure);
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

    private renderAppearance(): void
    {
        const page = this._page!;

        for(let i = 0; i < CATEGORY_PARTS.length; i++) this._bits.setColor(page, `category_${i}`, i === this._category ? ACTIVE.tab : IDLE.tab);

        this.fillTiles(page.findChildByName('preset_grid') as IWindowContainer | null);
        this.fillSwatches(page.findChildByName('hair_grid') as IWindowContainer | null, 'hr');
        this.fillSwatches(page.findChildByName('skin_grid') as IWindowContainer | null, 'hd');
        // A Habbo figure has no eye colour to pick.
        this._bits.setVisible(page, false, 'eyes_palette');
        this._bits.avatar(page, 'preview_avatar', this._draft.figure, this._direction);
    }

    private fillTiles(grid: IWindowContainer | null): void
    {
        if(!grid) return;

        while(grid.numChildren > 0) grid.getChildAt(0)?.destroy();

        const type = CATEGORY_PARTS[this._category];
        const looks = type === null
            ? this.presets().map(preset => preset.figure)
            : this.partSets(type, this._draft.gender).map(setId => withPartSet(this._draft.figure, type, setId, this.colors(type)[0] ?? 1));

        looks.slice(0, TILES.count).forEach((figure, i) =>
        {
            const tile = this._windows.buildWidgetLayout('vortex_character_create_preset_xml') as IWindowContainer | null;

            if(!tile) return;

            tile.id = i;
            tile.x = (i % TILES.columns) * (TILES.size + TILES.gap);
            tile.y = Math.floor(i / TILES.columns) * (TILES.size + TILES.gap);
            tile.color = figure === this._draft.figure ? ACTIVE.card : IDLE.card;
            this._bits.avatar(tile, 'preset_image', figure, 2, type !== 'ch' && type !== 'lg');
            tile.procedure = this._onEvent;
            grid.addChild(tile);
        });
    }

    private fillSwatches(grid: IWindowContainer | null, type: string): void
    {
        if(!grid) return;

        while(grid.numChildren > 0) grid.getChildAt(0)?.destroy();

        const current = partColor(this._draft.figure, type);
        const palette = this.palette(type);

        this.colors(type).slice(0, SWATCHES.count).forEach((colorId, i) =>
        {
            const swatch = this._windows.buildWidgetLayout('vortex_character_create_swatch_xml') as IWindowContainer | null;
            const rgb = palette?.getColor(colorId)?.rgb ?? 0;

            if(!swatch) return;

            swatch.id = colorId;
            swatch.tags.push(type);
            swatch.x = (i % SWATCHES.columns) * (SWATCHES.size + SWATCHES.gap);
            swatch.y = Math.floor(i / SWATCHES.columns) * (SWATCHES.size + SWATCHES.rowGap);
            swatch.color = colorId === current ? 0xff2a8fd6 : 0xffffffff;
            this._bits.setColor(swatch, 'swatch_color', 0xff000000 | rgb);
            swatch.procedure = this._onEvent;
            grid.addChild(swatch);
        });
    }

    private renderName(): void
    {
        const page = this._page!;
        const input = page.findChildByName('name_input') as ITextFieldWindow | null;

        if(input && input.text !== this._draft.name) input.text = this._draft.name;

        this.renderNameRules();
    }

    private renderNameRules(): void
    {
        const page = this._page!;
        const rules = nameRules(this._draft.name);
        const list = page.findChildByName('rule_list') as IItemListWindow | null;
        const typed = this._draft.name.length > 0;
        const states = [rules.length, rules.chars, rules.spaces, this._nameTaken ? false : null];

        states.forEach((ok, i) =>
        {
            const line = list?.getListItemAt(i) as IWindowContainer | null;

            if(line) this._bits.setColor(line, 'rule_icon', !typed || ok === null ? RULE_UNKNOWN : ok ? RULE_OK : RULE_BAD);
        });

        const status = page.findChildByName('name_status') as IWindowContainer | null;

        if(status)
        {
            status.visible = this._nameTaken;
            this._bits.setColor(status, 'status_icon', RULE_BAD);
            this._bits.setText(status, 'status_txt', this._bits.text('vortex.auth.field.taken'));
        }
    }

    private renderConfirm(): void
    {
        const page = this._page!;
        const entry = this._classes.find(item => item.id === this._draft.classId);
        const summary = page.findChildByName('summary_list') as IItemListWindow | null;
        const values = [this._draft.name, entry ? this._bits.contentName(`vortex.${entry.id}`, entry.id) : ''];

        values.forEach((value, i) =>
        {
            const row = summary?.getListItemAt(i) as IWindowContainer | null;

            if(row) this._bits.setText(row, 'summary_value', value);
        });

        this._bits.avatar(page, 'final_avatar', this._draft.figure, this._direction);

        // The look in two swatches: hair and skin.
        const looks = page.findChildByName('look_list') as IWindowContainer | null;

        ['hr', 'hd'].forEach((type, i) =>
        {
            const colorId = partColor(this._draft.figure, type);
            const swatch = this._windows.buildWidgetLayout('vortex_character_create_swatch_xml') as IWindowContainer | null;

            if(!looks || !swatch || colorId === null) return;

            swatch.x = i * (SWATCHES.size + 6);
            this._bits.setColor(swatch, 'swatch_color', 0xff000000 | (this.palette(type)?.getColor(colorId)?.rgb ?? 0));
            looks.addChild(swatch);
        });
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WE_CHANGE' && window.name === 'name_input')
        {
            this._draft.name = (window as ITextFieldWindow).text.trim();
            this._nameTaken = false;
            this.renderNameRules();
            this.renderButtons();

            return;
        }

        if(event.type !== 'WME_CLICK' || this._busy) return;

        if(this.onPicked(window)) return;

        switch(window.name)
        {
            case 'cancel_button': this._actions.cancel(); break;
            case 'previous_button': this.goTo(this.neighbour(-1)); break;
            case 'next_button': if(this.stepDone()) this.goTo(this.neighbour(1)); break;
            case 'create_button': this.submit(); break;
            case 'rotate_left': this.rotate(1); break;
            case 'rotate_right': this.rotate(-1); break;
        }
    };

    /** A click on a class card, a tab, a tile or a swatch; false when it was none of them. */
    private onPicked(window: IWindow): boolean
    {
        const card = WindowBits.ancestor(window, 'class_card');

        if(card)
        {
            this._draft.classId = this._classes[card.id]?.id ?? '';
            this.goTo('class');

            return true;
        }

        const tab = /^category_(\d)$/.exec(this.tabName(window));

        if(tab)
        {
            this._category = Number(tab[1]);
            this.renderAppearance();

            return true;
        }

        const tile = WindowBits.ancestor(window, 'preset_tile');

        if(tile)
        {
            const type = CATEGORY_PARTS[this._category];

            if(type === null)
            {
                const preset = this.presets()[tile.id];

                if(preset)
                {
                    this._draft.figure = preset.figure;
                    this._draft.gender = preset.gender;
                }
            }
            else
            {
                const setId = this.partSets(type, this._draft.gender)[tile.id];

                if(setId !== undefined) this._draft.figure = withPartSet(this._draft.figure, type, setId, this.colors(type)[0] ?? 1);
            }

            this.renderAppearance();

            return true;
        }

        const swatch = WindowBits.ancestor(window, 'swatch');

        if(swatch && swatch.tags.length > 0)
        {
            this._draft.figure = withPartColor(this._draft.figure, swatch.tags[swatch.tags.length - 1], swatch.id);
            this.renderAppearance();

            return true;
        }

        return false;
    }

    /** The `category_<n>` tab a click landed in (its icon or its border), or ''. */
    private tabName(window: IWindow): string
    {
        for(let at: IWindow | null = window; at; at = at.parent) if(/^category_\d$/.test(at.name)) return at.name;

        return '';
    }

    private neighbour(offset: 1 | -1): Step
    {
        const steps = this.classOnly ? STEPS.filter(step => step === 'class' || step === 'confirm') : [...STEPS];
        const at = steps.indexOf(this._step) + offset;

        return steps[Math.max(0, Math.min(steps.length - 1, at))];
    }

    private rotate(by: number): void
    {
        this._direction = (this._direction + by + 8) % 8;
        if(this._page) this._bits.avatar(this._page, 'preview_avatar', this._draft.figure, this._direction);
    }

    private submit(): void
    {
        if(this._busy || !this._draft.classId) return;

        this._busy = true;
        this._window?.disable();
        this._actions.submit({...this._draft});
    }

    /** Whole looks for both genders, each from the first starter sets of the figure data. */
    private presets(): Array<{figure: string; gender: 'M' | 'F'}>
    {
        const looks: Array<{figure: string; gender: 'M' | 'F'}> = [];

        for(const gender of ['M', 'F'] as const)
        {
            const sets = (['hd', 'hr', 'ch', 'lg'] as const).map(type => ({type, sets: this.partSets(type, gender), colors: this.colors(type)}));

            for(let i = 0; i < TILES.count / 2; i++)
            {
                if(sets.some(part => part.sets.length === 0)) break;

                looks.push({
                    gender,
                    figure: sets.map(part => `${part.type}-${part.sets[i % part.sets.length]}-${part.colors[(i * 3) % Math.max(1, part.colors.length)] ?? 1}`).join('.')
                });
            }
        }

        return looks;
    }

    /** The sets a new character may wear on a part type: free, selectable, of its gender. */
    private partSets(type: string, gender: string): number[]
    {
        const setType = this._figureData?.getSetType(type);

        if(!setType) return [];

        return [...setType.partSets.values()]
            .filter(set => set.isSelectable && set.clubLevel === 0 && !set.isSellable && (set.gender === gender || set.gender === 'U'))
            .map(set => set.id)
            .slice(0, TILES.count);
    }

    private palette(type: string): ReturnType<IFigureData['getPalette']>
    {
        const setType = this._figureData?.getSetType(type);

        return setType ? this._figureData!.getPalette(setType.paletteID) : null;
    }

    private colors(type: string): number[]
    {
        const palette = this.palette(type);

        return palette ? [...palette.colors.values()].filter(color => color.isSelectable && color.clubLevel === 0).map(color => color.id) : [];
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._page?.destroy();
        this._window?.destroy();
        this._page = this._window = null;
    }
}
