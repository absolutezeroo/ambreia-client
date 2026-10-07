import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {ICategoryView} from '../common/ICategoryView';
import type {TorsoModel} from './TorsoModel';
import {CategoryBaseView} from '../common/CategoryBaseView';

/**
 * The torso page: shirt, jacket, print and chest accessory.
 *
 * Note the tab order in the layout is not the part-type order: `ca` is `tab_accessories`, the same
 * tab **name** the head page uses for `he`. The two pages never share a container, so the collision
 * is harmless — but it is why the lookup has to be per-view rather than global.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/torso/TorsoView.as
 */
export class TorsoView extends CategoryBaseView implements ICategoryView
{
    // AS3: .../avatar/torso/TorsoView.as::DEFAULT_PART_TYPE
    // Name DERIVED: the "ch" `init()` opens the page on.
    private static readonly DEFAULT_PART_TYPE: string = 'ch';

    // AS3: .../avatar/torso/TorsoView.as::switchCategory()
    // Name DERIVED: the part-type → tab-name switch, hoisted.
    private static readonly TAB_NAMES: ReadonlyMap<string, string> = new Map([
        ['ch', 'tab_shirt'],
        ['cc', 'tab_jacket'],
        ['cp', 'tab_prints'],
        ['ca', 'tab_accessories']
    ]);

    // AS3: .../avatar/torso/TorsoView.as::windowEventProc()
    // Name DERIVED: the tab-name → part-type switch.
    private static readonly PART_TYPES: ReadonlyMap<string, string> = new Map([
        ['tab_shirt', 'ch'],
        ['tab_jacket', 'cc'],
        ['tab_prints', 'cp'],
        ['tab_accessories', 'ca']
    ]);

    // AS3: .../avatar/torso/TorsoView.as::TorsoView()
    // Typed to the concrete model in AS3 where every sibling view takes the interface. Kept.
    constructor(model: TorsoModel | null)
    {
        super(model);
    }

    // AS3: .../avatar/torso/TorsoView.as::init()
    public override init(): void
    {
        if(this._window === null)
        {
            this._window = (this._model?.controller?.view?.getCategoryContainer('torso') as IWindowContainer | null) ?? null;

            if(this._window !== null)
            {
                this._window.visible = false;
                this._window.procedure = this.windowEventProc;
            }
        }

        this._initialised = true;

        if(this._model !== null && this._currentPartType === '')
        {
            this._model.switchCategory(TorsoView.DEFAULT_PART_TYPE);
        }
    }

    // AS3: .../avatar/torso/TorsoView.as::switchCategory()
    // Resolves the part type **before** dimming the old tab, unlike `HeadView`. Immaterial, but
    // kept as written.
    public switchCategory(partType: string): void
    {
        if(this._window === null || this._window.disposed) return;

        const resolved = partType === '' ? this._currentPartType : partType;

        this.inactivateTab(this._currentTabName);

        const tabName = TorsoView.TAB_NAMES.get(resolved) ?? null;

        if(tabName === null) throw new Error(`[TorsoView] Unknown item category: "${resolved}"`);

        this._currentTabName = tabName;
        this._currentPartType = resolved;

        this.activateTab(this._currentTabName);

        if(!this._initialised) this.init();

        this.updateGridView(this._currentPartType);
    }

    // AS3: .../avatar/torso/TorsoView.as::dispose()
    // Overridden only to null the model again — the base has already done it. Kept.
    public override dispose(): void
    {
        super.dispose();

        this._model = null;
    }

    // AS3: .../avatar/torso/TorsoView.as::windowEventProc()
    private windowEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        const partType = TorsoView.PART_TYPES.get(window.name) ?? null;

        if(partType === null) return;

        if(event.type === 'WME_CLICK')
        {
            this.switchCategory(partType);

            return;
        }

        if(event.type === 'WME_OVER')
        {
            this.activateTab(window.name);

            return;
        }

        if(event.type === 'WME_OUT')
        {
            if(this._currentTabName !== window.name) this.inactivateTab(window.name);
        }
    };
}
