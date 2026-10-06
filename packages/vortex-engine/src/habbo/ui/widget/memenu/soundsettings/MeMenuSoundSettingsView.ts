import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IMeMenuView} from '../IMeMenuView';
import type {MeMenuWidget} from '../MeMenuWidget';
import type {RoomWidgetSettingsUpdateEvent} from '../../events/RoomWidgetSettingsUpdateEvent';
import {Logger} from '@core/utils/Logger';
import {RoomWidgetGetSettingsMessage} from '../../messages/RoomWidgetGetSettingsMessage';
import {RoomWidgetStoreSettingsMessage} from '../../messages/RoomWidgetStoreSettingsMessage';
import {MeMenuSoundSettingsItem} from './MeMenuSoundSettingsItem';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';

const log = Logger.getLogger('habbo.ui.widget.memenu.soundsettings.MeMenuSoundSettingsView');

/**
 * The three sound sliders — interface, furniture and music.
 *
 * Nothing is committed while you drag: every change previews, and the volumes are **stored on
 * dispose**, so leaving the page is what saves it. That is also why `dispose()` calls
 * `saveVolume()` before dropping its references.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/memenu/soundsettings/MeMenuSoundSettingsView.as
 */
export class MeMenuSoundSettingsView implements IMeMenuView
{
    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::UNCHANGED
    // Name DERIVED: the −1 an item passes for the two volumes it does not own.
    private static readonly UNCHANGED: number = -1;

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::_widget
    // Name DERIVED (`_SafeStr_4549`).
    private _widget: MeMenuWidget | null = null;

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::_uiVolumeItem
    // Name DERIVED (`_SafeStr_6213`).
    private _uiVolumeItem: MeMenuSoundSettingsItem | null = null;

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::_furniVolumeItem
    // Name DERIVED (`_SafeStr_6199`).
    private _furniVolumeItem: MeMenuSoundSettingsItem | null = null;

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::_traxVolumeItem
    // Name DERIVED (`_SafeStr_6274`).
    private _traxVolumeItem: MeMenuSoundSettingsItem | null = null;

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::_soundsOffIconColor
    private _soundsOffIconColor: ImageBitmap | null = null;

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::_soundsOffIconWhite
    private _soundsOffIconWhite: ImageBitmap | null = null;

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::_soundsOnIconColor
    private _soundsOnIconColor: ImageBitmap | null = null;

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::_soundsOnIconWhite
    private _soundsOnIconWhite: ImageBitmap | null = null;

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::_genericVolume
    private _genericVolume: number = 1;

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::_furniVolume
    private _furniVolume: number = 1;

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::_traxVolume
    private _traxVolume: number = 1;

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::init()
    public init(widget: MeMenuWidget, name: string): void
    {
        this._widget = widget;

        this.createWindow(name);
    }

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::get window()
    public get window(): IWindowContainer | null
    {
        return this._window;
    }

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::get widget()
    public get widget(): MeMenuWidget | null
    {
        return this._widget;
    }

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::get uiVolumeContainer()
    public get uiVolumeContainer(): IWindowContainer | null
    {
        return (this._window?.findChildByName('ui_volume_container') as IWindowContainer | null) ?? null;
    }

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::get furniVolumeContainer()
    public get furniVolumeContainer(): IWindowContainer | null
    {
        return (this._window?.findChildByName('furni_volume_container') as IWindowContainer | null) ?? null;
    }

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::get traxVolumeContainer()
    public get traxVolumeContainer(): IWindowContainer | null
    {
        return (this._window?.findChildByName('trax_volume_container') as IWindowContainer | null) ?? null;
    }

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::get soundsOffIconColor()
    public get soundsOffIconColor(): ImageBitmap | null
    {
        return this._soundsOffIconColor;
    }

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::get soundsOffIconWhite()
    public get soundsOffIconWhite(): ImageBitmap | null
    {
        return this._soundsOffIconWhite;
    }

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::get soundsOnIconColor()
    public get soundsOnIconColor(): ImageBitmap | null
    {
        return this._soundsOnIconColor;
    }

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::get soundsOnIconWhite()
    public get soundsOnIconWhite(): ImageBitmap | null
    {
        return this._soundsOnIconWhite;
    }

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::updateUnseenItemCount()
    // Empty in AS3 too.
    public updateUnseenItemCount(_category: string, _count: number): void
    {
    }

    /**
     * The answer to `RWGSM_GET_SETTINGS`. Note the mapping: the event's `uiVolume` becomes the
     * *generic* volume, which is what `RoomWidgetSettingsUpdateEvent` actually carries there — see
     * the note on that class about its parameter order.
     */
    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::updateSettings()
    public updateSettings(event: RoomWidgetSettingsUpdateEvent): void
    {
        this._genericVolume = event.uiVolume;
        this._furniVolume = event.furniVolume;
        this._traxVolume = event.traxVolume;

        this._uiVolumeItem?.setValue(this._genericVolume);
        this._furniVolumeItem?.setValue(this._furniVolume);
        this._traxVolumeItem?.setValue(this._traxVolume);
    }

    /**
     * −1 in any slot means "keep what I have". `store` false sends the preview message instead of
     * the store one, which is what every drag and every end-button click uses.
     */
    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::saveVolume()
    public saveVolume(generic: number, furni: number, trax: number, store: boolean = true): void
    {
        const message = new RoomWidgetStoreSettingsMessage(
            store ? RoomWidgetStoreSettingsMessage.STORE_SOUND_SETTING
                : RoomWidgetStoreSettingsMessage.PREVIEW_SOUND_SETTING
        );

        const unchanged = MeMenuSoundSettingsView.UNCHANGED;

        message.genericVolume = generic !== unchanged ? generic : this._genericVolume;
        message.furniVolume = furni !== unchanged ? furni : this._furniVolume;
        message.traxVolume = trax !== unchanged ? trax : this._traxVolume;

        this._widget?.messageListener?.processWidgetMessage(message);
    }

    /**
     * Commits first — this is the only place the volumes are actually stored, so leaving the page
     * is what saves them. It then disposes the three items and the four icons.
     */
    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::dispose()
    public dispose(): void
    {
        this.saveVolume(this._genericVolume, this._furniVolume, this._traxVolume);

        this._widget = null;

        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
        }

        this._uiVolumeItem?.dispose();
        this._uiVolumeItem = null;
        this._furniVolumeItem?.dispose();
        this._furniVolumeItem = null;
        this._traxVolumeItem?.dispose();
        this._traxVolumeItem = null;

        // AS3 calls BitmapData.dispose() on all four here. This port holds shared ImageBitmaps
        // straight off the asset library — closing them would break every later use of the same
        // asset — so the references are simply dropped.
        this._soundsOffIconColor = null;
        this._soundsOffIconWhite = null;
        this._soundsOnIconColor = null;
        this._soundsOnIconWhite = null;
    }

    /**
     * The click listener is attached to **every direct child** rather than to named buttons, so
     * anything at the top level of the layout can act as the back button. The three items are then
     * built against their containers, and the current volumes are requested.
     */
    // DEVIATION: AS3 shows the `trax_volume_container` row; the RPG fork removed jukebox music, so
    //   the row is hidden until Task 10 drops it from the layout.
    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::createWindow()
    private createWindow(name: string): void
    {
        const widget = this._widget;

        if(widget === null) return;

        this._window = widget.windowManager.buildWidgetLayout('memenu_settings') as IWindowContainer | null;

        if(this._window === null || this._window === undefined)
        {
            // AS3 throws here; this runs from a click and a throw would take the room UI down.
            log.warn('memenu_settings did not build — the sound page cannot be shown');
            this._window = null;

            return;
        }

        this._window.name = name;

        for(let index = 0; index < this._window.numChildren; index++)
        {
            this._window.getChildAt(index)?.addEventListener(WindowMouseEvent.CLICK, this.onButtonClicked);
        }

        const assets = widget.assets;

        this._soundsOffIconColor = (assets?.getAssetByName('sounds_off_color')?.content ?? null) as ImageBitmap | null;
        this._soundsOffIconWhite = (assets?.getAssetByName('sounds_off_white')?.content ?? null) as ImageBitmap | null;
        this._soundsOnIconColor = (assets?.getAssetByName('sounds_on_color')?.content ?? null) as ImageBitmap | null;
        this._soundsOnIconWhite = (assets?.getAssetByName('sounds_on_white')?.content ?? null) as ImageBitmap | null;

        this._uiVolumeItem = new MeMenuSoundSettingsItem(
            this, MeMenuSoundSettingsItem.TYPE_UI_VOLUME, this.uiVolumeContainer
        );
        this._furniVolumeItem = new MeMenuSoundSettingsItem(
            this, MeMenuSoundSettingsItem.TYPE_FURNI_VOLUME, this.furniVolumeContainer
        );
        this._traxVolumeItem = new MeMenuSoundSettingsItem(
            this, MeMenuSoundSettingsItem.TYPE_TRAX_VOLUME, this.traxVolumeContainer
        );

        if(this.traxVolumeContainer) this.traxVolumeContainer.visible = false;

        widget.messageListener?.processWidgetMessage(
            new RoomWidgetGetSettingsMessage(RoomWidgetGetSettingsMessage.GET_SETTINGS)
        );
    }

    // AS3: .../soundsettings/MeMenuSoundSettingsView.as::onButtonClicked()
    // Back goes to the settings *menu*, not the main view — this page is one level deeper.
    private onButtonClicked = (event: {target?: unknown}): void =>
    {
        const name = (event.target as IWindow | null)?.name ?? '';

        if(name !== 'back_btn')
        {
            log.debug(`Me Menu Settings View: unknown button: ${name}`);

            return;
        }

        this._widget?.changeView('me_menu_settings_view');
    };
}
