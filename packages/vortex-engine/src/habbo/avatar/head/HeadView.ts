import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {ICategoryModel} from '../common/ICategoryModel';
import type {ICategoryView} from '../common/ICategoryView';
import {CategoryBaseView} from '../common/CategoryBaseView';

/**
 * The head page: hair, hat, head accessory, eyewear and mask.
 *
 * The five tabs map one-to-one onto part types, and `switchCategory()` **throws** on anything else
 * rather than falling back — an unknown part type here means the layout and this class have drifted
 * apart, which is a build error rather than a runtime state. AS3's; kept.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/head/HeadView.as
 */
export class HeadView extends CategoryBaseView implements ICategoryView
{
    // AS3: .../avatar/head/HeadView.as::DEFAULT_PART_TYPE
    // Name DERIVED: the "hr" `init()` opens the page on.
    private static readonly DEFAULT_PART_TYPE: string = 'hr';

    // AS3: .../avatar/head/HeadView.as::switchCategory()
    // Name DERIVED: the part-type → tab-name switch, hoisted. The reverse direction lives in
    // `windowEventProc()`, exactly as in AS3 — the two are not derived from one another.
    private static readonly TAB_NAMES: ReadonlyMap<string, string> = new Map([
        ['hr', 'tab_hair'],
        ['ha', 'tab_hat'],
        ['he', 'tab_accessories'],
        ['ea', 'tab_eyewear'],
        ['fa', 'tab_masks']
    ]);

    // AS3: .../avatar/head/HeadView.as::windowEventProc()
    // Name DERIVED: the tab-name → part-type switch.
    private static readonly PART_TYPES: ReadonlyMap<string, string> = new Map([
        ['tab_hair', 'hr'],
        ['tab_hat', 'ha'],
        ['tab_accessories', 'he'],
        ['tab_eyewear', 'ea'],
        ['tab_masks', 'fa']
    ]);

    // AS3: .../avatar/head/HeadView.as::HeadView()
    constructor(model: ICategoryModel | null)
    {
        super(model);
    }

    /**
     * AS3: .../avatar/head/HeadView.as::init()
     *
     * Opens on hair by going back through the **model**, not by calling `switchCategory()` here —
     * so the model gets its chance to build the page's grids first.
     */
    public override init(): void
    {
        if(this._window === null)
        {
            this._window = (this._model?.controller?.view?.getCategoryContainer('head') as IWindowContainer | null) ?? null;

            if(this._window !== null)
            {
                this._window.visible = false;
                this._window.procedure = this.windowEventProc;
            }
        }

        this._initialised = true;

        if(this._model !== null && this._currentPartType === '')
        {
            this._model.switchCategory(HeadView.DEFAULT_PART_TYPE);
        }
    }

    /**
     * AS3: .../avatar/head/HeadView.as::switchCategory()
     *
     * The old tab is dimmed **before** the new part type is resolved, so a throw leaves the page
     * with no tab lit at all.
     */
    // AS3: .../avatar/head/HeadView.as::switchCategory()
    public switchCategory(partType: string): void
    {
        if(this._window === null || this._window.disposed) return;

        this.inactivateTab(this._currentTabName);

        const resolved = partType === '' ? this._currentPartType : partType;
        const tabName = HeadView.TAB_NAMES.get(resolved) ?? null;

        if(tabName === null) throw new Error(`[HeadView] Unknown item category: "${resolved}"`);

        this._currentTabName = tabName;
        this._currentPartType = resolved;

        this.activateTab(this._currentTabName);

        if(!this._initialised) this.init();

        this.updateGridView(resolved);
    }

    // AS3: .../avatar/head/HeadView.as::windowEventProc()
    // Hovering out only dims a tab that is not the current one, so the selected tab survives the
    // cursor leaving it.
    private windowEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        const partType = HeadView.PART_TYPES.get(window.name) ?? null;

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
