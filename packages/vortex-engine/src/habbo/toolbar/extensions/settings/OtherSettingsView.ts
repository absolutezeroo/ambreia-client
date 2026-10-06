import type {XmlAsset} from '@core/assets/XmlAsset';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ISelectableWindow} from '@core/window/components/ISelectableWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {Logger} from '@core/utils/Logger';

import {
    SetIgnoreRoomInvitesMessageComposer
} from '@habbo/communication/messages/outgoing/preferences/SetIgnoreRoomInvitesMessageComposer';
import {
    SetRoomCameraPreferencesMessageComposer
} from '@habbo/communication/messages/outgoing/preferences/SetRoomCameraPreferencesMessageComposer';
import {
    ResetPhoneNumberStateMessageComposer
} from '@habbo/communication/messages/outgoing/preferences/ResetPhoneNumberStateMessageComposer';
import type {HabboToolbar} from '../../HabboToolbar';

const log = Logger.getLogger('habbo.toolbar.extensions.settings.OtherSettingsView');

/**
 * OtherSettingsView
 *
 * The leftovers panel: ignore room invites, disable wired whispers, stop the room camera
 * following you, and reset phone-number collection. Each checkbox commits the moment it
 * is clicked — there is no save button and no dispose-time write.
 *
 * Two of the four are config-gated and simply absent otherwise, and the phone-number
 * button appears only for one specific combination of verification and collection status.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/extensions/settings/OtherSettingsView.as
 */
export class OtherSettingsView
{
    // AS3: .../OtherSettingsView.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: .../OtherSettingsView.as::_toolbar
    private _toolbar: HabboToolbar | null;

    // AS3: .../OtherSettingsView.as::OtherSettingsView()
    constructor(toolbar: HabboToolbar)
    {
        this._toolbar = toolbar;

        this.createWindow();
    }

    // AS3: .../OtherSettingsView.as::get window()
    get window(): IWindowContainer | null
    {
        return this._window;
    }

    // AS3: .../OtherSettingsView.as::createWindow()
    private createWindow(): void
    {
        const toolbar = this._toolbar;

        if(toolbar === null) return;

        const asset = toolbar.assets?.getAssetByName('me_menu_other_settings_xml') as XmlAsset | null;

        if(asset === null || asset === undefined)
        {
            log.warn('Missing layout "me_menu_other_settings_xml" - other settings cannot open');

            return;
        }

        this._window = toolbar.windowManager?.buildFromXML(
            asset.content as unknown as string
        ) as IWindowContainer | null;

        if(this._window === null) return;

        this._window.procedure = this.onButtonClicked;

        this.setChecked('ignore_room_invites_checkbox', toolbar.messenger?.getRoomInvitesIgnored() ?? false);

        const cameraFollowEnabled = toolbar.getBoolean('room.camera.follow_user');
        const cameraFollowRow = this._window.findChildByName('disable_room_camera_follow');

        if(cameraFollowRow) cameraFollowRow.visible = cameraFollowEnabled;

        if(cameraFollowEnabled)
        {
            this.setChecked(
                'disable_room_camera_follow_checkbox',
                toolbar.sessionDataManager?.isRoomCameraFollowDisabled ?? false
            );
        }

        // Offered only to someone SMS verification applies to but who is not verified,
        // and either already gave a number or is allowed to be asked for one.
        const smsEnabled = toolbar.getBoolean('sms.identity.verification.enabled');
        const verified = toolbar.getInteger('phone.verification.status', 0) === 2;
        const collected = toolbar.getInteger('phone.collection.status', 0) === 2;
        const buttonEnabled = toolbar.getBoolean('sms.identity.verification.button.enabled');
        const notCollected = toolbar.getInteger('phone.collection.status', 0) === 0;

        const resetButton = this._window.findChildByName('btn_reset_phone_number_collection');

        if(resetButton) resetButton.visible = smsEnabled && !verified && (collected || (buttonEnabled && notCollected));
    }

    // TS-only: the checkbox cast AS3 spells out at each of its three call sites.
    private setChecked(name: string, selected: boolean): void
    {
        const checkbox = this._window?.findChildByName(name) as unknown as ISelectableWindow | null;

        if(checkbox !== null && checkbox !== undefined) checkbox.isSelected = selected;
    }

    // TS-only: the matching read.
    private isChecked(name: string): boolean
    {
        const checkbox = this._window?.findChildByName(name) as unknown as ISelectableWindow | null;

        return checkbox?.isSelected ?? false;
    }

    /**
     * The checkbox has already toggled itself by the time this runs, so each branch reads
     * the new state back off the window rather than tracking it.
     */
    // AS3: .../OtherSettingsView.as::onButtonClicked()
    private onButtonClicked = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        const toolbar = this._toolbar;

        if(toolbar === null) return;

        switch(window.name)
        {
            case 'back_btn':
                this.dispose();
                break;
            case 'ignore_room_invites_checkbox':
                toolbar.messenger?.setRoomInvitesIgnored(this.isChecked('ignore_room_invites_checkbox'));
                toolbar.connection?.send(
                    new SetIgnoreRoomInvitesMessageComposer(toolbar.messenger?.getRoomInvitesIgnored() ?? false)
                );
                break;
            case 'disable_room_camera_follow_checkbox':
            {
                const disabled = this.isChecked('disable_room_camera_follow_checkbox');

                toolbar.connection?.send(new SetRoomCameraPreferencesMessageComposer(disabled));
                toolbar.sessionDataManager?.setRoomCameraFollowDisabled(disabled);
                break;
            }
            case 'btn_reset_phone_number_collection':
            {
                const resetButton = this._window?.findChildByName('btn_reset_phone_number_collection');

                if(resetButton) resetButton.visible = false;

                toolbar.connection?.send(new ResetPhoneNumberStateMessageComposer());
                break;
            }
        }
    };

    /** AS3 keeps the toolbar reference; only the window goes. */
    // AS3: .../OtherSettingsView.as::dispose()
    dispose(): void
    {
        if(this._window === null) return;

        this._window.dispose();
        this._window = null;
    }
}
