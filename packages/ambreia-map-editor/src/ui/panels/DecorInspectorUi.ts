import type {IWindow} from '@ambreia/ui/IWindow';
import {moveDecor} from '@ambreia/map-editor-core/commands/moveDecor';
import {patchDecor} from '@ambreia/map-editor-core/commands/patchDecor';
import {setDecorLocked} from '@ambreia/map-editor-core/commands/setDecorLocked';
import {furnitureCategory} from '@ambreia/map-editor-core/palette/furnitureCategory';
import type {ZoneCollision, ZoneDecorObject} from '@ambreia/map-editor-core/zone/Zone.generated';
import type {EditorApp} from '../../app/EditorApp';
import {FurnitureSprites} from '../../view/FurnitureSprites';
import {CheckBinding, child, ChoiceBinding, NumberBinding, onClick, setEnabled, setImage, setText, TextBinding} from '../bind';
import type {IPanelUi} from '../IPanelUi';
import {CATALOG_CATEGORIES} from './CATALOG_CATEGORIES';
import {INTERACTIONS} from './INTERACTIONS';

const EDITABLE = [
    'decor_x', 'decor_y', 'decor_z', 'rotation_0', 'rotation_2', 'rotation_4', 'rotation_6', 'decor_walkable',
    'decor_blocks_sight', 'decor_seat', 'decor_locked', 'decor_state', 'decor_surface', 'decor_interaction', 'decor_tag',
    'duplicate_button', 'copy_button', 'lock_button', 'delete_button'
];

/** "Propriétés du mobi" (vortex_map_editor_inspect_decor_xml): the single selected furni. */
export class DecorInspectorUi implements IPanelUi
{
    private readonly _parts: {render(): void}[];
    private readonly _state: ChoiceBinding<number>;

    constructor(private readonly _window: IWindow, private readonly _app: EditorApp)
    {
        const app = _app;
        const o = (): ZoneDecorObject | null => app.doc.decor?.find(d => app.selection.ids.has(d.id)) ?? null;
        const id = () => o()?.id ?? '';
        const def = () => app.furniture(o()?.definition ?? -1);
        const collision = (patch: Partial<NonNullable<ZoneCollision>>) =>
            o() && app.execute(patchDecor(id(), {collision: {...o()!.collision ?? {}, ...patch}}));
        const move = (dx: number, dy: number, dz: number) => o() && app.execute(moveDecor([id()], dx, dy, dz));

        this._state = new ChoiceBinding<number>(_window, 'decor_state', () => o()?.state ?? 0, state => app.execute(patchDecor(id(), {state})));
        this._parts = [
            new TextBinding(_window, 'decor_definition', () => String(o()?.definition ?? ''), () => undefined),
            new TextBinding(_window, 'decor_class', () => o()?.class ?? '', () => undefined),
            new TextBinding(_window, 'decor_id', id, () => undefined),
            new NumberBinding(_window, 'decor_x', () => o()?.x ?? 0, x => move(x - o()!.x, 0, 0), 0, 63),
            new NumberBinding(_window, 'decor_y', () => o()?.y ?? 0, y => move(0, y - o()!.y, 0), 0, 63),
            new NumberBinding(_window, 'decor_z', () => o()?.z ?? 0, z => move(0, 0, z - (o()!.z ?? 0)), 0, 40, 0.5),
            ...[0, 2, 4, 6].map(r => new CheckBinding(_window, `rotation_${r}`, () => (o()?.rotation ?? 0) === r,
                on => on && app.execute(patchDecor(id(), {rotation: r})))),
            new CheckBinding(_window, 'decor_walkable', () => o()?.collision?.walkable ?? def()?.canWalk ?? false, walkable => collision({walkable})),
            new CheckBinding(_window, 'decor_blocks_sight', () => !!o()?.collision?.blocksSight, blocksSight => collision({blocksSight})),
            new CheckBinding(_window, 'decor_seat', () => o()?.collision?.seat ?? def()?.canSit ?? false, seat => collision({seat})),
            new CheckBinding(_window, 'decor_locked', () => !!o()?.locked, locked => app.execute(setDecorLocked([id()], locked))),
            new NumberBinding(_window, 'decor_surface', () => o()?.collision?.height ?? def()?.stackHeight ?? 0, height => collision({height}), 0, 40, 0.5),
            new ChoiceBinding(_window, 'decor_interaction', () => o()?.interaction ?? '', interaction => app.execute(patchDecor(id(), {interaction: interaction || null})))
                .options(INTERACTIONS),
            new TextBinding(_window, 'decor_tag', () => o()?.tag ?? '', tag => app.execute(patchDecor(id(), {tag: tag.trim() || null})))
        ];

        onClick(_window, 'duplicate_button', () => app.duplicate());
        onClick(_window, 'copy_button', () => app.copy());
        onClick(_window, 'lock_button', () => app.toggleLock());
        onClick(_window, 'delete_button', () => app.deleteSelection());
    }

    render(): void
    {
        const app = this._app;
        const o = app.doc.decor?.find(d => app.selection.ids.has(d.id));
        const def = o ? app.furniture(o.definition) : null;
        const category = o ? CATALOG_CATEGORIES.find(c => c[0] === furnitureCategory(o.class))?.[1] ?? '' : '';

        for(const name of EDITABLE) setEnabled(child(this._window, name), !!o && (name === 'lock_button' || name === 'decor_locked' || !o.locked));
        setText(this._window, 'decor_name', o ? o.class : 'Aucun mobi sélectionné');
        setText(this._window, 'decor_info', o ? `${def ? `${def.width}×${def.length} · ` : 'définition inconnue · '}${category}` : 'Choisissez un mobi dans la vue.');
        if(o) setImage(this._window, 'decor_icon', FurnitureSprites.picture(o.class, o.rotation ?? 0, o.state ?? 0));

        this._state.options(Array.from({length: Math.max(1, def?.states ?? 1)}, (_, s) => [s, s === 0 ? 'Normal (0)' : `État ${s}`] as const)).render();
        for(const part of this._parts) part.render();
    }
}
