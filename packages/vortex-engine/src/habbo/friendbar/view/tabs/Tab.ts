import type {IAssetLibrary} from '@core/assets';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {IAvatarRenderManager} from '@habbo/avatar/IAvatarRenderManager';
import type {IHabboFriendList} from '@habbo/friendlist/IHabboFriendList';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboTracking} from '@habbo/tracking/IHabboTracking';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboFriendBarData} from '../../data/IHabboFriendBarData';
import type {IHabboFriendBarView} from '../IHabboFriendBarView';
import type {TextCropper} from '../utils/TextCropper';
import type {ITab} from './ITab';

/**
 * Tab
 *
 * Base for every slot in the bar. Holds the selection and "exposed" (hovered-open)
 * state, and the shared mouse behaviour: clicking a selected slot closes it, hovering
 * an unselected one exposes it.
 *
 * Its collaborators are **class statics**, not constructor arguments — the bar sets
 * them once and every slot reads them. That is verbatim AS3, and it is why a slot can
 * be constructed with no arguments at all. AS3 spells them upper-case (`public static
 * var DATA`, `VIEW`, `WIDTH`, …); they are mutable, so they are camelCase here — the
 * trace comment on each keeps the AS3 spelling.
 *
 * `mouseOut` re-tests the pointer against the window before concealing: the event also
 * fires when the pointer crosses onto a child, which is still inside the slot.
 *
 * Two dead constants are not ported: `_SafeStr_11141` (a `false` Boolean) and
 * `_SafeStr_10788` (`3`). Both are obfuscated in every tree and read by nothing in the
 * package, so there is no way to name them honestly and nothing to break by leaving
 * them out.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/view/tabs/Tab.as
 */
export class Tab implements ITab
{
    // AS3: .../view/tabs/Tab.as::WIDTH
    static width: number = 127;

    // AS3: .../view/tabs/Tab.as::HEIGHT
    static height: number = 36;

    // AS3: .../view/tabs/Tab.as::DATA
    static data: IHabboFriendBarData | null = null;

    // AS3: .../view/tabs/Tab.as::FRIENDS
    static friends: IHabboFriendList | null = null;

    // AS3: .../view/tabs/Tab.as::VIEW
    static view: IHabboFriendBarView | null = null;

    // AS3: .../view/tabs/Tab.as::ASSETS
    static assets: IAssetLibrary | null = null;

    // AS3: .../view/tabs/Tab.as::WINDOWING
    static windowing: IHabboWindowManager | null = null;

    /** **Name derived** from its type; obfuscated in every tree. */
    // AS3: .../view/tabs/Tab.as::LOCALIZATION
    static localization: IHabboLocalizationManager | null = null;

    // AS3: .../view/tabs/Tab.as::TRACKING
    static tracking: IHabboTracking | null = null;

    // AS3: .../view/tabs/Tab.as::CROPPER
    static cropper: TextCropper | null = null;

    // AS3: .../view/tabs/Tab.as::AVATAR_RENDER_MANAGER
    static avatarRenderManager: IAvatarRenderManager | null = null;

    // AS3: .../view/tabs/Tab.as::_MOTION_TIME
    protected static readonly MOTION_TIME: number = 80;

    // AS3: .../view/tabs/Tab.as::_window
    protected _window: IWindowContainer | null = null;

    // AS3: .../view/tabs/Tab.as::get window()
    get window(): IWindowContainer | null
    {
        return this._window;
    }

    // AS3: .../view/tabs/Tab.as::_SafeStr_4656
    protected _recycled: boolean = false;

    // AS3: .../view/tabs/Tab.as::get recycled()
    get recycled(): boolean
    {
        return this._recycled;
    }

    // AS3: .../view/tabs/Tab.as::_selected
    private _selected: boolean = false;

    // AS3: .../view/tabs/Tab.as::get selected()
    get selected(): boolean
    {
        return this._selected;
    }

    // AS3: .../view/tabs/Tab.as::_SafeStr_7702
    private _exposed: boolean = false;

    // AS3: .../view/tabs/Tab.as::get exposed()
    protected get exposed(): boolean
    {
        return this._exposed;
    }

    // AS3: .../view/tabs/Tab.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../view/tabs/Tab.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    /** Selecting conceals first — the hover state and the open state are exclusive. */
    // AS3: .../view/tabs/Tab.as::select()
    select(_animate: boolean): void
    {
        this.conceal();
        this._selected = true;
    }

    // AS3: .../view/tabs/Tab.as::deselect()
    deselect(_animate: boolean): void
    {
        this._selected = false;
    }

    // AS3: .../view/tabs/Tab.as::recycle()
    recycle(): void
    {
        this.conceal();
        this._recycled = true;
    }

    // AS3: .../view/tabs/Tab.as::expose()
    protected expose(): void
    {
        this._exposed = true;
    }

    // AS3: .../view/tabs/Tab.as::conceal()
    protected conceal(): void
    {
        this._exposed = false;
    }

    // AS3: .../view/tabs/Tab.as::onMouseClick()
    protected onMouseClick(_event: WindowMouseEvent): void
    {
        if(this.disposed || this.recycled)
        {
            return;
        }

        if(this.selected)
        {
            Tab.view?.deSelect(true);
        }
        else
        {
            Tab.view?.selectTab(this, true);
        }
    }

    // AS3: .../view/tabs/Tab.as::onMouseOver()
    protected onMouseOver(_event: WindowMouseEvent): void
    {
        if(this.disposed || this.recycled)
        {
            return;
        }

        if(!this.selected)
        {
            this.expose();
        }
    }

    // AS3: .../view/tabs/Tab.as::onMouseOut()
    protected onMouseOut(event: WindowMouseEvent): void
    {
        if(this.disposed || this.recycled || this._window === null)
        {
            return;
        }

        if(!this.selected && !this._window.hitTestGlobalPoint({x: event.stageX, y: event.stageY}))
        {
            this.conceal();
        }
    }

    // AS3: .../view/tabs/Tab.as::dispose()
    dispose(): void
    {
        if(this._disposed)
        {
            return;
        }

        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
        }

        this._disposed = true;
    }
}
