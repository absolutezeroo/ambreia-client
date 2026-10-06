import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import type {ICategoryModel} from './ICategoryModel';
import {TabUtils} from './TabUtils';

/**
 * What the six tabbed editor pages share: the container they were handed, which part type they are
 * showing, and the two tab-highlight helpers.
 *
 * This class **owns no windows of its own** — `init()` is empty here and every subclass fills
 * `_window` from `AvatarEditorView.getCategoryContainer()`, i.e. a `<name>_content` container the
 * main window detached from `contentArea` at build time. The base only knows how to find a named
 * tab inside it and swap its bitmap.
 *
 * Note that it does **not** implement `ICategoryView`: `switchCategory()` is left to the
 * subclasses, which is why `HotLooksView` can implement the interface without extending this at all.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/common/CategoryBaseView.as
 */
export class CategoryBaseView
{
    // AS3: .../avatar/common/CategoryBaseView.as::_window
    protected _window: IWindowContainer | null = null;

    /**
     * The part type currently shown, and the fallback `switchCategory('')` falls back to.
     *
     * Name DERIVED (`_SafeStr_4635`): seeded by the subclass — `BodyView` sets `hd` in its
     * constructor, the others leave it empty until their first `switchCategory()`.
     */
    // AS3: .../avatar/common/CategoryBaseView.as::_currentPartType
    protected _currentPartType: string = '';

    // AS3: .../avatar/common/CategoryBaseView.as::_currentTabName
    // The *window* name of the tab lit for `_currentPartType` — `tab_hair`, `tab_shirt`, …
    protected _currentTabName: string = '';

    // AS3: .../avatar/common/CategoryBaseView.as::_model
    // Name DERIVED (`_SafeStr_4570`): the page this view draws, and the only route to the editor.
    protected _model: ICategoryModel | null;

    // AS3: .../avatar/common/CategoryBaseView.as::_initialised
    // Name DERIVED (`_SafeStr_4755`): set by the subclass at the end of its `init()`.
    protected _initialised: boolean = false;

    // AS3: .../avatar/common/CategoryBaseView.as::CategoryBaseView()
    constructor(model: ICategoryModel | null)
    {
        this._model = model;
    }

    // AS3: .../avatar/common/CategoryBaseView.as::init()
    // Empty here — every subclass overrides it.
    public init(): void
    {
    }

    /**
     * Clears the initialised flag but **keeps `_window`**, so the next `getWindowContainer()`
     * re-runs the subclass's `init()` against the container it already has. That is why a gender
     * change re-populates the grid without rebuilding any window.
     */
    // AS3: .../avatar/common/CategoryBaseView.as::reset()
    public reset(): void
    {
        this._currentPartType = '';
        this._currentTabName = '';
        this._initialised = false;
    }

    // AS3: .../avatar/common/CategoryBaseView.as::getWindowContainer()
    public getWindowContainer(): IWindowContainer | null
    {
        if(!this._initialised) this.init();

        return this._window;
    }

    /**
     * Forwards to the editor's shared grid, **discarding the part type** — the grid shows one part
     * type at a time and already knows which, so only the palette count matters here. AS3's
     * signature, kept because `ICategoryView` declares it that way.
     */
    // AS3: .../avatar/common/CategoryBaseView.as::showPalettes()
    public showPalettes(_partType: string, count: number): void
    {
        this._model?.controller?.view?.gridView?.showPalettes(count);
    }

    // AS3: .../avatar/common/CategoryBaseView.as::dispose()
    public dispose(): void
    {
        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
        }

        this._model = null;
        this._initialised = false;
    }

    // AS3: .../avatar/common/CategoryBaseView.as::updateGridView()
    // Repopulates the one shared grid with this page's parts and palettes for `partType`.
    protected updateGridView(partType: string): void
    {
        const model = this._model;

        if(model === null) return;

        model.controller?.view?.gridView?.initFromList(model, partType);
    }

    // AS3: .../avatar/common/CategoryBaseView.as::activateTab()
    // The tab is a container; the bitmap it highlights carries the `BITMAP` tag, not a name.
    protected activateTab(name: string): void
    {
        this.setTabImage(name, true);
    }

    // AS3: .../avatar/common/CategoryBaseView.as::inactivateTab()
    protected inactivateTab(name: string): void
    {
        this.setTabImage(name, false);
    }

    // TS-only: the shared body of `activateTab()` / `inactivateTab()`, which differ only in the flag.
    private setTabImage(name: string, active: boolean): void
    {
        if(this._window === null) return;

        const tab = this._window.findChildByName(name) as IWindowContainer | null;

        if(tab === null) return;

        const bitmap = tab.findChildByTag('BITMAP') as IStaticBitmapWrapperWindow | null;

        // AS3 passes the lookup result straight to `TabUtils.setElementImage()` and would throw on
        // a tab with no tagged bitmap; guarded here because the port's signature is non-null.
        if(bitmap === null) return;

        TabUtils.setElementImage(bitmap, active);
    }
}
