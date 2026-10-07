/**
 * IContextMenuParentWidget — the widget a ContextInfoView calls back into.
 *
 * AS3 interface is obfuscated to `_SafeCls_1870`; real name recovered from the
 * PRODUCTION 2016 tree (`ui/widget/contextmenu/IContextMenuParentWidget.as`).
 * Implemented by AvatarInfoWidget.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/contextmenu/_SafeCls_1870.as
 */
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {IHabboLocalizationManager} from '../../../localization/IHabboLocalizationManager';
import type {IRoomWidgetMessageListener} from '../../IRoomWidgetMessageListener';
import type {ContextInfoView} from './ContextInfoView';

export interface IContextMenuParentWidget
{
    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/_SafeCls_1870.as::get windowManager()
    readonly windowManager: IHabboWindowManager;
    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/_SafeCls_1870.as::get assets()
    readonly assets: IAssetLibrary | null;
    readonly localizations: IHabboLocalizationManager | null;
    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/_SafeCls_1870.as::get messageListener()
    readonly messageListener: IRoomWidgetMessageListener | null;

    // AS3: _SafeCls_1870.as::removeView()
    removeView(view: ContextInfoView, animate: boolean): void;
}
