import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {ICategoryModel} from '../common/ICategoryModel';
import type {ICategoryView} from '../common/ICategoryView';
import {CategoryBaseView} from '../common/CategoryBaseView';

/**
 * The body page: the face grid, and the two gender tabs.
 *
 * It is the only page whose tabs do not choose a part type — both show `hd`; they set the editor's
 * gender instead, which swaps the whole figure model underneath. That is why `getWindowContainer()`
 * is overridden to re-light the tabs on every fetch: the gender can change from anywhere.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/generic/BodyView.as
 */
export class BodyView extends CategoryBaseView implements ICategoryView
{
    // AS3: .../avatar/generic/BodyView.as::TAB_BOY_ID
    // Declared in AS3 and never referenced there — every use is the literal. Kept and used.
    private static readonly TAB_BOY_ID: string = 'tab_boy';

    // AS3: .../avatar/generic/BodyView.as::TAB_GIRL_ID
    private static readonly TAB_GIRL_ID: string = 'tab_girl';

    // AS3: .../avatar/generic/BodyView.as::HEAD_PART_TYPE
    // Name DERIVED: the "hd" this page seeds itself with and never leaves.
    private static readonly HEAD_PART_TYPE: string = 'hd';

    // AS3: .../avatar/generic/BodyView.as::BodyView()
    constructor(model: ICategoryModel | null)
    {
        super(model);

        this._currentPartType = BodyView.HEAD_PART_TYPE;
    }

    // AS3: .../avatar/generic/BodyView.as::init()
    public override init(): void
    {
        if(this._window === null)
        {
            this._window = (this._model?.controller?.view?.getCategoryContainer('generic') as IWindowContainer | null) ?? null;

            if(this._window !== null)
            {
                this._window.visible = false;
                this._window.procedure = this.windowEventProc;
            }
        }

        this.updateGridView(BodyView.HEAD_PART_TYPE);
        this._initialised = true;
        this.updateGenderTab();
    }

    // AS3: .../avatar/generic/BodyView.as::reset()
    // Re-seeds the part type the base clears, so this page never comes back empty.
    public override reset(): void
    {
        super.reset();

        this._currentPartType = BodyView.HEAD_PART_TYPE;
    }

    // AS3: .../avatar/generic/BodyView.as::getWindowContainer()
    public override getWindowContainer(): IWindowContainer | null
    {
        if(!this._initialised) this.init();

        this.updateGenderTab();

        return this._window;
    }

    // AS3: .../avatar/generic/BodyView.as::switchCategory()
    public switchCategory(partType: string): void
    {
        this.updateGenderTab();
        this.updateGridView(partType === '' ? this._currentPartType : partType);
    }

    // AS3: .../avatar/generic/BodyView.as::updateGenderTab()
    // A gender the editor does not report as `M` or `F` lights **neither** tab, rather than
    // defaulting to one. AS3's switch has no default; kept.
    public updateGenderTab(): void
    {
        const gender = this._model?.controller?.gender ?? null;

        if(gender === null) return;

        switch(gender)
        {
            case 'M':
                this.activateTab(BodyView.TAB_BOY_ID);
                this.inactivateTab(BodyView.TAB_GIRL_ID);
                break;

            case 'F':
                this.activateTab(BodyView.TAB_GIRL_ID);
                this.inactivateTab(BodyView.TAB_BOY_ID);
                break;
        }
    }

    /**
     * Clicking a gender tab stops propagation — the page container is a child of the editor body,
     * whose own procedure would otherwise see the click and try to match it against unrelated
     * editor actions.
     *
     * Hovering out does not un-light the tab: it re-runs `updateGenderTab()`, so the tab for the
     * *current* gender stays lit whichever one the cursor left.
     */
    // AS3: .../avatar/generic/BodyView.as::windowEventProc()
    private windowEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WME_CLICK')
        {
            switch(window.name)
            {
                case BodyView.TAB_BOY_ID:
                    if(this._model?.controller != null) this._model.controller.gender = 'M';
                    event.stopPropagation();
                    break;

                case BodyView.TAB_GIRL_ID:
                    if(this._model?.controller != null) this._model.controller.gender = 'F';
                    event.stopPropagation();
                    break;
            }

            return;
        }

        if(event.type === 'WME_OVER')
        {
            if(window.name === BodyView.TAB_BOY_ID || window.name === BodyView.TAB_GIRL_ID)
            {
                this.activateTab(window.name);
            }

            return;
        }

        if(event.type === 'WME_OUT')
        {
            if(window.name === BodyView.TAB_BOY_ID || window.name === BodyView.TAB_GIRL_ID)
            {
                this.updateGenderTab();
            }
        }
    };
}
