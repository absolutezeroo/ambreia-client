import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';

/**
 * UserInfoRegionUtil
 *
 * The little eye icon that opens a profile. It ships as two images stacked in the
 * layout — a dim one and a lit one — and hovering swaps which of the pair is visible,
 * so there is no state to track beyond the two `visible` flags.
 *
 * The primary tree obfuscates this class to `_SafeCls_3877` and no tree recovers it.
 * **The name `UserInfoRegionUtil` is derived**, from the `user_info_region` child it
 * exists to wire up.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/_SafeCls_3877.as
 */
export class UserInfoRegionUtil
{
    /**
     * Wires an entry's `user_info_region` to the hover swap, with `onClick` for the
     * click itself. Views that already own the region's `procedure` call
     * `setUserInfoState()` directly instead.
     */
    // AS3: .../utils/_SafeCls_3877.as::setup()
    static setup(entry: IWindowContainer, onClick: (event: WindowEvent) => void): void
    {
        const region = entry.findChildByName('user_info_region');

        if(region === null)
        {
            return;
        }

        region.addEventListener(WindowMouseEvent.OVER, UserInfoRegionUtil.onUserInfoMouseOver);
        region.addEventListener(WindowMouseEvent.OUT, UserInfoRegionUtil.onUserInfoMouseOut);
        region.addEventListener(WindowMouseEvent.CLICK, onClick);
    }

    // AS3: .../utils/_SafeCls_3877.as::setUserInfoState()
    static setUserInfoState(over: boolean, container: IWindowContainer): void
    {
        const off = container.findChildByName('icon_eye_off');
        const over_ = container.findChildByName('icon_eye_over');

        if(off !== null)
        {
            off.visible = !over;
        }

        if(over_ !== null)
        {
            over_.visible = over;
        }
    }

    /**
     * `procedure`-shaped variant for layouts that hang the handler off a child of the
     * region rather than the region itself — hence the `parent` hop.
     */
    // AS3: .../utils/_SafeCls_3877.as::onEntry()
    static onEntry(event: WindowEvent, window: IWindow): void
    {
        const parent = window.parent as IWindowContainer | null;

        if(parent === null)
        {
            return;
        }

        if(event.type === 'WME_OVER')
        {
            UserInfoRegionUtil.setUserInfoState(true, parent);
        }
        else if(event.type === 'WME_OUT')
        {
            UserInfoRegionUtil.setUserInfoState(false, parent);
        }
    }

    // AS3: .../utils/_SafeCls_3877.as::onUserInfoMouseOver()
    private static onUserInfoMouseOver = (event: WindowEvent): void =>
    {
        UserInfoRegionUtil.setUserInfoState(true, event.target as unknown as IWindowContainer);
    };

    // AS3: .../utils/_SafeCls_3877.as::onUserInfoMouseOut()
    private static onUserInfoMouseOut = (event: WindowEvent): void =>
    {
        UserInfoRegionUtil.setUserInfoState(false, event.target as unknown as IWindowContainer);
    };
}
