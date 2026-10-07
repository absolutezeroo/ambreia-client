import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {ICategoryModel} from '../common/ICategoryModel';
import type {ICategoryView} from '../common/ICategoryView';
import {CategoryBaseView} from '../common/CategoryBaseView';

/**
 * The misc page: pets and everything else wearable that is neither clothing nor an effect.
 *
 * Only shown when `clothing.misc.tab.enabled` is on — see `AvatarEditorView`'s constructor, which
 * decides that before the tabs are pruned.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/misc/MiscView.as
 */
export class MiscView extends CategoryBaseView implements ICategoryView
{
    // AS3: .../avatar/misc/MiscView.as::defaultCategory
    // The one page whose default part type AS3 gives a real name to.
    private static readonly DEFAULT_CATEGORY: string = 'pt';

    // AS3: .../avatar/misc/MiscView.as::switchCategory()
    // Name DERIVED: the part-type → tab-name switch, hoisted.
    private static readonly TAB_NAMES: ReadonlyMap<string, string> = new Map([
        ['pt', 'tab_pets'],
        ['mc', 'tab_misc']
    ]);

    // AS3: .../avatar/misc/MiscView.as::windowEventProc()
    // Name DERIVED: the tab-name → part-type switch.
    private static readonly PART_TYPES: ReadonlyMap<string, string> = new Map([
        ['tab_pets', 'pt'],
        ['tab_misc', 'mc']
    ]);

    // AS3: .../avatar/misc/MiscView.as::MiscView()
    constructor(model: ICategoryModel | null)
    {
        super(model);
    }

    // AS3: .../avatar/misc/MiscView.as::init()
    public override init(): void
    {
        if(this._window === null)
        {
            this._window = (this._model?.controller?.view?.getCategoryContainer('misc') as IWindowContainer | null) ?? null;

            if(this._window !== null)
            {
                this._window.visible = false;
                this._window.procedure = this.windowEventProc;
            }
        }

        this._initialised = true;

        if(this._model !== null && this._currentPartType === '')
        {
            this._model.switchCategory(MiscView.DEFAULT_CATEGORY);
        }
    }

    // AS3: .../avatar/misc/MiscView.as::switchCategory()
    public switchCategory(partType: string): void
    {
        if(this._window === null || this._window.disposed) return;

        this.inactivateTab(this._currentTabName);

        const resolved = partType === '' ? this._currentPartType : partType;
        const tabName = MiscView.TAB_NAMES.get(resolved) ?? null;

        if(tabName === null) throw new Error(`[MiscView] Unknown item category: "${resolved}"`);

        this._currentTabName = tabName;
        this._currentPartType = resolved;

        this.activateTab(this._currentTabName);

        if(!this._initialised) this.init();

        this.updateGridView(resolved);
    }

    // AS3: .../avatar/misc/MiscView.as::windowEventProc()
    private windowEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        const partType = MiscView.PART_TYPES.get(window.name) ?? null;

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
