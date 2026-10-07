import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowController} from '@ambreia/ui/WindowController';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import {effect, signal, type Scope, type SignalReader} from '@ambreia/common/reactive/index';
import {createWindowScope} from '@ambreia/ui/reactive/index';
import {type EditorState} from '../../state/EditorState';
import {addChildOfType, cloneSelected, convertSelected, deleteSelected, reorderSelected, wrapSelected} from '../../ops/StructuralOps';
import {specFor, type IWidgetSpec} from '../../ops/WidgetCatalog';
import {GLAZE_THEMES, setTheme} from '../../ops/ThemeOps';
import type {WindowHierarchy} from './WindowHierarchy';
import type {WindowPalette} from './WindowPalette';

interface IContainerLike { addChild(child: IWindow): IWindow; }
interface IDropWidget { populate(items: unknown[]): void; selection: number; }

/** The type Create/Convert start on, before anything is picked. */
const DEFAULT_TYPE = 'container';

/**
 * WindowHierarchyControls — the tree's action strip (Glaze's Create / Set Theme /
 * clone / delete / reorder row), built from Habbo widgets above the tree list.
 *
 * The type to create or convert to is chosen through the Widgets popup rather
 * than a drop menu: the strip only shows which type is armed. A drop menu would
 * have to list all 94 window types in one expanded column — the ported
 * `dropmenu` sizes itself to the total item height and does not scroll — and the
 * nine-type list it used to carry was the real limit on what Convert could reach.
 */
export class WindowHierarchyControls
{
    private readonly _state: EditorState;
    private readonly _wm: EditorState['runtime']['windowManager'];
    private readonly _bar: IWindow;
    private readonly _hierarchy: WindowHierarchy | null;
    private readonly _palette: WindowPalette | null;
    private readonly _scope: Scope;
    private _themeDrop: IDropWidget | null = null;
    private readonly _type: SignalReader<IWidgetSpec>;
    private readonly _setType: (spec: IWidgetSpec) => void;

    public constructor(
        state: EditorState,
        bar: IWindow,
        hierarchy: WindowHierarchy | null,
        palette: WindowPalette | null = null
    )
    {
        this._state = state;
        this._wm = state.runtime.windowManager;
        this._bar = bar;
        this._hierarchy = hierarchy;
        this._palette = palette;
        this._scope = createWindowScope(bar);
        [this._type, this._setType] = signal<IWidgetSpec>(
            specFor(DEFAULT_TYPE) ?? {type: DEFAULT_TYPE, label: DEFAULT_TYPE, width: 60, height: 30}
        );

        this._scope.run(() => this.build());
    }

    private build(): void
    {
        // Row 1: armed type + Create + Convert. The armed type is a signal, so
        // the button caption follows whatever the Widgets popup hands back. The
        // caption setter auto-sizes the button, so the effect reasserts the
        // strip's fixed box right after writing it.
        const typeButton = this.button('', 4, 4, 180, () => this.chooseType());

        if(typeButton)
        {
            effect(() =>
            {
                const caption = `Type: ${this._type().label}`;

                if(typeButton.disposed || typeButton.caption === caption) return;

                typeButton.caption = caption;
                typeButton.rectangle = {x: 4, y: 4, width: 180, height: 24};
            });
        }

        this.button('Create', 188, 4, 54, () => addChildOfType(this._state, this._type().type));
        this.button('Convert', 246, 4, 56, () => convertSelected(this._state, this._type().type));

        // Row 2: theme dropdown + Set Theme, where Glaze has them.
        this._themeDrop = this.dropdown(4, 32, 220, GLAZE_THEMES);
        this.button('Set Theme', 228, 32, 74, () =>
        {
            const theme = GLAZE_THEMES[this._themeDrop?.selection ?? 0] ?? GLAZE_THEMES[0];

            setTheme(this._state, theme);
        });

        // Row 3: delete + move + wrap + clone + expand. Wrap is the only op that
        // goes *up* the tree — it inserts the armed type above the selection.
        this.button('Del', 4, 60, 36, () => deleteSelected(this._state));
        this.button('↑', 44, 60, 24, () => reorderSelected(this._state, -1));
        this.button('↓', 72, 60, 24, () => reorderSelected(this._state, 1));
        this.button('Wrap', 100, 60, 44, () => wrapSelected(this._state, this._type().type));
        this.button('Clone', 148, 60, 50, () => cloneSelected(this._state));
        this.button('Expand', 202, 60, 56, () => this._hierarchy?.expandAll());
    }

    /** Opens the widget library as a type picker and arms whatever comes back. */
    private chooseType(): void
    {
        this._palette?.toggle('pick', (spec) => this._setType(spec));
    }

    private button(caption: string, x: number, y: number, width: number, onClick: () => void): WindowController | null
    {
        const btn = this._wm.buildWidgetLayout('glaze_button_xml');

        if(!btn) return null;

        const bc = btn as unknown as WindowController;

        bc.caption = caption;
        (this._bar as unknown as IContainerLike).addChild(btn);
        bc.rectangle = {x, y, width, height: 24};
        bc.procedure = (event: WindowEvent): void =>
        {
            if(event.type === WindowMouseEvent.CLICK) onClick();
        };

        return bc;
    }

    private dropdown(x: number, y: number, width: number, items: string[]): IDropWidget | null
    {
        const dd = this._wm.buildWidgetLayout('glaze_dropdown_xml');

        if(!dd) return null;

        (this._bar as unknown as IContainerLike).addChild(dd);
        (dd as unknown as WindowController).rectangle = {x, y, width, height: 22};

        const drop = dd as unknown as IDropWidget;

        drop.populate(items);

        return drop;
    }
}
