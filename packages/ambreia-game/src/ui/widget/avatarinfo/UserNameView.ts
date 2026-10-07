/**
 * UserNameView — the bare nametag bubble shown above a friend's avatar (`showUserName()`) or a
 * game NPC/player (`showGamePlayerName()`, `isGameRoomMode = true`). No click-to-open menu, no
 * name-change row — that is `AvatarMenuView`'s job for a selected non-friend avatar.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/UserNameView.as
 */
import {AvatarContextInfoView} from './AvatarContextInfoView';
import type {AvatarInfoWidget} from './AvatarInfoWidget';

export class UserNameView extends AvatarContextInfoView
{
    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/UserNameView.as::DEFAULT_BG_COLOR
    public static readonly DEFAULT_BG_COLOR: number = 4288528218;

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/UserNameView.as::DEFAULT_FADE_DELAY_MS
    public static readonly DEFAULT_FADE_DELAY_MS: number = 8000;

    /** Derived name — `_SafeStr_4841`; PRODUCTION's unobfuscated `_objectId` confirms it. */
    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/UserNameView.as::_SafeStr_4841 (objectId)
    private _objectId: number = 0;

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/UserNameView.as::_isGameRoomMode
    private _isGameRoomMode: boolean;

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/UserNameView.as::UserNameView()
    constructor(widget: AvatarInfoWidget, isGameRoomMode: boolean = false)
    {
        super(widget);

        this._isGameRoomMode = isGameRoomMode;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/UserNameView.as::setup()
    public static setup(
        view: UserNameView,
        userId: number,
        userName: string,
        roomIndex: number,
        userType: number,
        objectId: number,
        bgColor: number = UserNameView.DEFAULT_BG_COLOR,
        fadeDelayMs: number = UserNameView.DEFAULT_FADE_DELAY_MS,
        blocked: boolean = false
    ): void
    {
        view._objectId = objectId;
        view._autoHideDelay = fadeDelayMs;

        AvatarContextInfoView.setupInfoView(view, userId, userName, roomIndex, userType, false, blocked);

        if(view._window) view._window.color = bgColor;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/UserNameView.as::get objectId()
    public get objectId(): number
    {
        return this._objectId;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/UserNameView.as::get isGameRoomMode()
    public get isGameRoomMode(): boolean
    {
        return this._isGameRoomMode;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/UserNameView.as::get maximumBlend()
    public override get maximumBlend(): number
    {
        if(this._isGameRoomMode) return 0.75;

        return super.maximumBlend;
    }
}
