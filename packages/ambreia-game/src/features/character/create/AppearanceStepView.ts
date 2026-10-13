import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import {WindowBits} from '../../../ui/kit/WindowBits';
import {partColor, withPartColor, withPartSet} from '../CharacterLook';
import type {ICharacterDraft} from './ICharacterDraft';
import type {StarterWardrobe} from './StarterWardrobe';
import {ACTIVE, IDLE, SWATCHES, TILES} from './wizardLook';

/** Appearance tabs: 0 whole looks, then one part type each (face, hair, top, bottom). */
const CATEGORY_PARTS = [null, 'hd', 'hr', 'ch', 'lg'] as const;

/**
 * The look step: a tab per part, its tiles (whole looks or one part's sets), the hair and skin
 * swatches, the preview that turns. A pick changes the draft's figure.
 */
export class AppearanceStepView
{
    private _category = 0;
    /** The preview's direction, the summary's too. */
    direction = 2;

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _wardrobe: StarterWardrobe,
        private readonly _onEvent: (event: WindowEvent, window: IWindow) => void
    ) {}

    render(page: IWindowContainer, draft: Readonly<ICharacterDraft>): void
    {
        for(let i = 0; i < CATEGORY_PARTS.length; i++) this._bits.setColor(page, `category_${i}`, i === this._category ? ACTIVE.tab : IDLE.tab);

        this.fillTiles(page.findChildByName('preset_grid') as IWindowContainer | null, draft);
        this.fillSwatches(page.findChildByName('hair_grid') as IWindowContainer | null, 'hr', draft);
        this.fillSwatches(page.findChildByName('skin_grid') as IWindowContainer | null, 'hd', draft);
        // A Habbo figure has no eye colour to pick.
        this._bits.setVisible(page, false, 'eyes_palette');
        this._bits.avatar(page, 'preview_avatar', draft.figure, this.direction);
    }

    /** A click on a tab, a tile or a swatch changes the tab or the draft; false when it was none of them. */
    pick(window: IWindow, draft: ICharacterDraft): boolean
    {
        const tab = /^category_(\d)$/.exec(this.tabName(window));

        if(tab)
        {
            this._category = Number(tab[1]);

            return true;
        }

        const tile = WindowBits.ancestor(window, 'preset_tile');

        if(tile)
        {
            const type = CATEGORY_PARTS[this._category];

            if(type === null)
            {
                const preset = this._wardrobe.presets()[tile.id];

                if(preset)
                {
                    draft.figure = preset.figure;
                    draft.gender = preset.gender;
                }
            }
            else
            {
                const setId = this._wardrobe.partSets(type, draft.gender)[tile.id];

                if(setId !== undefined) draft.figure = withPartSet(draft.figure, type, setId, this._wardrobe.colors(type)[0] ?? 1);
            }

            return true;
        }

        const swatch = WindowBits.ancestor(window, 'swatch');

        if(swatch && swatch.tags.length > 0)
        {
            draft.figure = withPartColor(draft.figure, swatch.tags[swatch.tags.length - 1], swatch.id);

            return true;
        }

        return false;
    }

    /** Turns the preview. */
    rotate(page: IWindowContainer | null, figure: string, by: number): void
    {
        this.direction = (this.direction + by + 8) % 8;
        if(page) this._bits.avatar(page, 'preview_avatar', figure, this.direction);
    }

    private fillTiles(grid: IWindowContainer | null, draft: Readonly<ICharacterDraft>): void
    {
        if(!grid) return;

        while(grid.numChildren > 0) grid.getChildAt(0)?.destroy();

        const type = CATEGORY_PARTS[this._category];
        const looks = type === null
            ? this._wardrobe.presets().map(preset => preset.figure)
            : this._wardrobe.partSets(type, draft.gender).map(setId => withPartSet(draft.figure, type, setId, this._wardrobe.colors(type)[0] ?? 1));

        looks.slice(0, TILES.count).forEach((figure, i) =>
        {
            const tile = this._windows.buildWidgetLayout('vortex_character_create_preset_xml') as IWindowContainer | null;

            if(!tile) return;

            tile.id = i;
            tile.x = (i % TILES.columns) * (TILES.size + TILES.gap);
            tile.y = Math.floor(i / TILES.columns) * (TILES.size + TILES.gap);
            tile.color = figure === draft.figure ? ACTIVE.card : IDLE.card;
            this._bits.avatar(tile, 'preset_image', figure, 2, type !== 'ch' && type !== 'lg');
            tile.procedure = this._onEvent;
            grid.addChild(tile);
        });
    }

    private fillSwatches(grid: IWindowContainer | null, type: string, draft: Readonly<ICharacterDraft>): void
    {
        if(!grid) return;

        while(grid.numChildren > 0) grid.getChildAt(0)?.destroy();

        const current = partColor(draft.figure, type);

        this._wardrobe.colors(type).slice(0, SWATCHES.count).forEach((colorId, i) =>
        {
            const swatch = this._windows.buildWidgetLayout('vortex_character_create_swatch_xml') as IWindowContainer | null;

            if(!swatch) return;

            swatch.id = colorId;
            swatch.tags.push(type);
            swatch.x = (i % SWATCHES.columns) * (SWATCHES.size + SWATCHES.gap);
            swatch.y = Math.floor(i / SWATCHES.columns) * (SWATCHES.size + SWATCHES.rowGap);
            swatch.color = colorId === current ? 0xff2a8fd6 : 0xffffffff;
            this._bits.setColor(swatch, 'swatch_color', 0xff000000 | this._wardrobe.rgb(type, colorId));
            swatch.procedure = this._onEvent;
            grid.addChild(swatch);
        });
    }

    /** The `category_<n>` tab a click landed in (its icon or its border), or ''. */
    private tabName(window: IWindow): string
    {
        for(let at: IWindow | null = window; at; at = at.parent) if(/^category_\d$/.test(at.name)) return at.name;

        return '';
    }
}
