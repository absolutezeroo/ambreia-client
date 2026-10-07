import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IWindowManager} from '@ambreia/ui/kit/IWindowManager';

/**
 * The window manager with the game services the Habbo windows need. Everything generic is in
 * IWindowManager (@ambreia/ui since J3); this adds the services and the game-only calls.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/IHabboWindowManager.as
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as
 */
export interface IHabboWindowManager extends IWindowManager {
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::avatarRenderer
    readonly avatarRenderer: IAvatarRenderManager | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::communication
    readonly communication: IHabboCommunicationManager | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::sessionDataManager
    readonly sessionDataManager: ISessionDataManager | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::roomEngine
    readonly roomEngine: IRoomEngine | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::localization
    readonly localization: IHabboLocalizationManager | null;
    // AS3: sources/win63_version/habbo/window/class_38.as::habboPagesStyleSheet
    readonly habboPagesStyleSheet: unknown | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as (context.configuration)
    readonly configuration: IHabboConfigurationManager | null;
    // AS3: sources/win63_version/habbo/window/class_38.as::toggleFullScreen()
    toggleFullScreen(): void;
    // AS3: sources/win63_version/habbo/window/class_38.as::registerLocalizationParameter()
    registerLocalizationParameter(key: string, parameter: string, value: string, delimiter?: string): void;
    // AS3: sources/win63_version/habbo/window/class_38.as::createUnseenItemCounter()
    createUnseenItemCounter(): IWindowContainer | null;
    // AS3: sources/win63_version/habbo/window/class_38.as::openHelpPage()
    openHelpPage(pageId: string): void;
    // AS3: sources/win63_version/habbo/window/class_38.as::displayFloorPlanEditor()
    displayFloorPlanEditor(): void;

    /**
     * Open the illustrated alert dialog (`simple_alert_xml`)
     *
     * The second and third parameters used to be named `message, subtitle` — the wrong way round.
     * Positions were never wrong: this forwards straight to `SimpleAlertDialog`, whose second
     * argument fills the `subtitle` window and whose third fills the `message` one, exactly as
     * `HabboWindowManagerComponent.as::simpleAlert()` does. Every call site in the port already
     * passed them in AS3 order, so this is a rename with no behaviour change — but the old names
     * were a standing trap, and `HabboFriendList.simpleAlert()` carried a comment working around
     * them.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::simpleAlert()
    simpleAlert(
        title: string,
        subtitle: string,
        message: string,
        linkCaption?: string | null,
        linkUrl?: string | null,
        parameters?: Map<string, string> | null,
        illustrationUrl?: string | null,
        linkClickCallback?: (() => void) | null,
        closeCallback?: (() => void) | null
    ): void;
}
