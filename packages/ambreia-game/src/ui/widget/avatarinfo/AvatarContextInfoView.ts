/**
 * AvatarContextInfoView — a ContextInfoView carrying avatar identity (userId/name/type/roomIndex)
 * with no button-menu interactivity, unlike its sibling `AvatarContextInfoButtonView` (which wraps
 * `ButtonMenuView` instead of `ContextInfoView` directly). Base for `UserNameView`, the only AS3
 * subclass — a bare nametag bubble with nothing to click.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/AvatarContextInfoView.as
 */
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import {ContextInfoView} from '../contextmenu/ContextInfoView';
import type {IScreenRectangle} from '../contextmenu/ContextInfoView';

export class AvatarContextInfoView extends ContextInfoView
{
    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarContextInfoView.as::_SafeStr_5971 (userId)
    protected _userId: number = 0;

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarContextInfoView.as::_userName
    protected _userName: string = '';

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarContextInfoView.as::_SafeStr_8226 (userType)
    protected _userType: number = 0;

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarContextInfoView.as::_SafeStr_7952 (allowNameChange)
    protected _allowNameChange: boolean = false;

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarContextInfoView.as::_SafeStr_7722 (roomIndex)
    protected _roomIndex: number = 0;

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarContextInfoView.as::_SafeStr_5421 (isBlocked)
    protected _isBlocked: boolean = false;

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarContextInfoView.as::setup()
    protected static setupInfoView(
        view: AvatarContextInfoView,
        userId: number,
        userName: string,
        roomIndex: number,
        userType: number,
        allowNameChange: boolean = false,
        blocked: boolean = false
    ): void
    {
        view._userId = userId;
        view._userName = userName;
        view._userType = userType;
        view._roomIndex = roomIndex;
        view._allowNameChange = allowNameChange;
        view._isBlocked = blocked;

        ContextInfoView.setupContext(view);
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarContextInfoView.as::get userId()
    public get userId(): number
    {
        return this._userId;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarContextInfoView.as::get userType()
    public get userType(): number
    {
        return this._userType;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarContextInfoView.as::get roomIndex()
    public get roomIndex(): number
    {
        return this._roomIndex;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarContextInfoView.as::get userName()
    public get userName(): string
    {
        return this._userName;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarContextInfoView.as::get allowNameChange()
    public get allowNameChange(): boolean
    {
        return this._allowNameChange;
    }

    /**
     * TS-only deviation: AS3's own getter reads `return isBlocked;` — a self-referential infinite
     * recursion, present identically in both the primary WIN63 tree and win63_version (so it is a
     * real shipped bug, not a decompiler artifact — see CLAUDE.md on cross-checking trees), and
     * never actually invoked anywhere in this class (`updateWindow()` reads `_isBlocked` directly).
     * `AvatarContextInfoButtonView` carries the exact same bug in its own AS3 source and already
     * ports it field-backed for the same reason; this follows that established precedent rather
     * than reproducing a guaranteed stack overflow.
     */
    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarContextInfoView.as::get isBlocked()
    public get isBlocked(): boolean
    {
        return this._isBlocked;
    }

    /**
     * AS3 bug, ported faithfully: the unconditional `caption` assignment right after the if/else
     * overwrites whatever the blocked/not-blocked branch just set, so the "blocked user" caption
     * never actually reaches the screen — only `italic` survives from that branch. Confirmed
     * identical in win63_version, so this is the real shipped 2026 behavior, not a decompile
     * artifact; PRODUCTION (2016) predates the blocked-user branch entirely.
     */
    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarContextInfoView.as::updateWindow()
    protected override updateWindow(): void
    {
        if(!this._widget.assets || !this._widget.windowManager) return;

        if(!this._window)
        {
            this._window = this._widget.windowManager.buildWidgetLayout('avatar_info_widget', 0) as IWindowContainer | null;

            if(!this._window) return;
        }

        const nameWindow = this._window.findChildByName('name') as ITextWindow | null;

        if(nameWindow)
        {
            if(this._isBlocked)
            {
                nameWindow.italic = true;
                nameWindow.caption = '${infostand.blocked_user}';
            }
            else
            {
                nameWindow.italic = false;
                nameWindow.caption = this._userName;
            }

            nameWindow.caption = this._userName;
        }

        // AS3 calls updateRelationshipStatus() here for the friend-relationship badge; the friend
        // list left with the core cut (2026-10-07), so the badge stays empty.
        const changeNameContainer = this._window.findChildByName('change_name_container');

        if(changeNameContainer)
        {
            changeNameContainer.visible = false;
        }

        this._window.height = 39;
        this.activeView = this._window;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarContextInfoView.as::getOffset()
    protected override getOffset(rect: IScreenRectangle): number
    {
        let offset = -(this._activeView?.height ?? 0);

        if(this._userType === 1 || this._userType === 3)
        {
            offset += rect.height > 50 ? 25 : 0;
        }
        else
        {
            offset -= 4;
        }

        return offset;
    }
}
