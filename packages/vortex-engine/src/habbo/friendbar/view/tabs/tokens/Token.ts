import type {IAssetLibrary} from '@core/assets';
import type {IDisposable} from '@core/runtime/IDisposable';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IRegionWindow} from '@core/window/components/IRegionWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import {DropBounce} from '@core/window/motion/DropBounce';
import {Motions} from '@core/window/motion/Motions';
import {Logger} from '@core/utils/Logger';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IFriendNotification} from '../../../data/IFriendNotification';

const log = Logger.getLogger('habbo.friendbar.tokens.Token');

/**
 * Token
 *
 * One notification badge hanging off a friend's slot: a small icon on the bar, and the
 * message piece shown when the slot is opened.
 *
 * The icon drops into place with a bounce, but only if nothing is already animating
 * that window — a second notification of the same type must not restart the bounce.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/view/tabs/tokens/Token.as
 */
export class Token implements IDisposable
{
    // AS3: .../tokens/Token.as::_WINDOW_MANAGER
    protected static _windowManager: IHabboWindowManager | null = null;

    /** **Name derived** from its type; obfuscated in every tree. */
    // AS3: .../tokens/Token.as::_ASSETS
    protected static _assets: IAssetLibrary | null = null;

    // AS3: .../tokens/Token.as::TITLE
    protected static readonly TITLE: string = 'title';

    // AS3: .../tokens/Token.as::MESSAGE
    protected static readonly MESSAGE: string = 'message';

    // AS3: .../tokens/Token.as::ICON_RECTANGLE
    protected static readonly ICON_RECTANGLE: {x: number; y: number; width: number; height: number} = {x: 0, y: 0, width: 25, height: 25};

    // AS3: .../tokens/Token.as::set WINDOWING()
    static set WINDOWING(value: IHabboWindowManager | null)
    {
        Token._windowManager = value;
    }

    // AS3: .../tokens/Token.as::set ASSETS()
    static set ASSETS(value: IAssetLibrary | null)
    {
        Token._assets = value;
    }

    // AS3: .../tokens/Token.as::Token()
    constructor(notification: IFriendNotification)
    {
        this._notification = notification;
    }

    // AS3: .../tokens/Token.as::_SafeStr_6873
    protected _notification: IFriendNotification | null;

    // AS3: .../tokens/Token.as::get notification()
    get notification(): IFriendNotification | null
    {
        return this._notification;
    }

    // AS3: .../tokens/Token.as::get typeCode()
    get typeCode(): number
    {
        return this._notification?.typeCode ?? 0;
    }

    // AS3: .../tokens/Token.as::get viewOnce()
    get viewOnce(): boolean
    {
        return this._notification?.viewOnce ?? false;
    }

    // AS3: .../tokens/Token.as::_icon
    protected _icon: IRegionWindow | null = null;

    // AS3: .../tokens/Token.as::get iconElement()
    get iconElement(): IWindow | null
    {
        return this._icon as unknown as IWindow | null;
    }

    // AS3: .../tokens/Token.as::_window
    protected _window: IWindowContainer | null = null;

    // AS3: .../tokens/Token.as::get windowElement()
    get windowElement(): IWindow | null
    {
        return this._window;
    }

    // AS3: .../tokens/Token.as::_disposed
    protected _disposed: boolean = false;

    // AS3: .../tokens/Token.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../tokens/Token.as::prepare()
    protected prepare(title: string, message: string | null, layoutName: string, iconAssetUri: string): void
    {
        const windowManager = Token._windowManager;

        if(windowManager === null)
        {
            return;
        }

        this._window = windowManager.buildWidgetLayout(layoutName) as IWindowContainer | null;

        if(this._window === null)
        {
            log.error(`prepare: layout "${layoutName}" is not registered`);

            return;
        }

        const titleWindow = this._window.findChildByName(Token.TITLE);
        const messageWindow = this._window.findChildByName(Token.MESSAGE);

        if(titleWindow !== null)
        {
            titleWindow.caption = title;
        }

        if(messageWindow !== null)
        {
            messageWindow.caption = message ?? '';
        }

        this._icon = windowManager.create(`ICON_${this.typeCode}`, 5, 0, 1, Token.ICON_RECTANGLE) as unknown as IRegionWindow;

        const iconWindow = this._icon as unknown as IWindow;

        iconWindow.mouseThreshold = 0;

        const bitmap = windowManager.create(`BITMAP_${this.typeCode}`, 23, 0, 0, Token.ICON_RECTANGLE) as unknown as IStaticBitmapWrapperWindow;

        bitmap.assetUri = iconAssetUri;
        (this._icon as unknown as IWindowContainer).addChild(bitmap as unknown as IWindow);

        if(Motions.getMotionByTarget(iconWindow) === null)
        {
            Motions.runMotion(new DropBounce(iconWindow, 600, 32));
        }
    }

    // AS3: .../tokens/Token.as::dispose()
    dispose(): void
    {
        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
        }

        if(this._icon !== null)
        {
            (this._icon as unknown as IWindow).dispose();
            this._icon = null;
        }

        this._notification = null;
        this._disposed = true;
    }
}
