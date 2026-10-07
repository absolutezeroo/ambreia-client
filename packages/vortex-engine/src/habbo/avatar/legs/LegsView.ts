import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {ICategoryModel} from '../common/ICategoryModel';
import type {ICategoryView} from '../common/ICategoryView';
import {CategoryBaseView} from '../common/CategoryBaseView';

/**
 * The legs page: trousers, shoes and belt.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/legs/LegsView.as
 */
export class LegsView extends CategoryBaseView implements ICategoryView
{
    // AS3: .../avatar/legs/LegsView.as::DEFAULT_PART_TYPE
    // Name DERIVED: the "lg" `init()` opens the page on.
    private static readonly DEFAULT_PART_TYPE: string = 'lg';

    // AS3: .../avatar/legs/LegsView.as::switchCategory()
    // Name DERIVED: the part-type → tab-name switch, hoisted.
    private static readonly TAB_NAMES: ReadonlyMap<string, string> = new Map([
        ['lg', 'tab_pants'],
        ['sh', 'tab_shoes'],
        ['wa', 'tab_belts']
    ]);

    // AS3: .../avatar/legs/LegsView.as::windowEventProc()
    // Name DERIVED: the tab-name → part-type switch.
    private static readonly PART_TYPES: ReadonlyMap<string, string> = new Map([
        ['tab_pants', 'lg'],
        ['tab_shoes', 'sh'],
        ['tab_belts', 'wa']
    ]);

    // AS3: .../avatar/legs/LegsView.as::LegsView()
    constructor(model: ICategoryModel | null)
    {
        super(model);
    }

    // AS3: .../avatar/legs/LegsView.as::init()
    public override init(): void
    {
        if(this._window === null)
        {
            this._window = (this._model?.controller?.view?.getCategoryContainer('legs') as IWindowContainer | null) ?? null;

            if(this._window !== null)
            {
                this._window.visible = false;
                this._window.procedure = this.windowEventProc;
            }
        }

        this._initialised = true;

        if(this._model !== null && this._currentPartType === '')
        {
            this._model.switchCategory(LegsView.DEFAULT_PART_TYPE);
        }
    }

    // AS3: .../avatar/legs/LegsView.as::switchCategory()
    public switchCategory(partType: string): void
    {
        if(this._window === null || this._window.disposed) return;

        const resolved = partType === '' ? this._currentPartType : partType;

        this.inactivateTab(this._currentTabName);

        const tabName = LegsView.TAB_NAMES.get(resolved) ?? null;

        if(tabName === null) throw new Error(`[LegsView] Unknown item category: "${resolved}"`);

        this._currentTabName = tabName;
        this._currentPartType = resolved;

        this.activateTab(this._currentTabName);

        if(!this._initialised) this.init();

        this.updateGridView(this._currentPartType);
    }

    // AS3: .../avatar/legs/LegsView.as::windowEventProc()
    private windowEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        const partType = LegsView.PART_TYPES.get(window.name) ?? null;

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
