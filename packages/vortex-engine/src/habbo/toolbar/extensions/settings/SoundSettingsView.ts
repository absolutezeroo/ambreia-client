import type {XmlAsset} from '@core/assets/XmlAsset';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {Logger} from '@core/utils/Logger';

import type {HabboToolbar} from '../../HabboToolbar';
import {SoundSettingsItem} from './SoundSettingsItem';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';

const log = Logger.getLogger('habbo.toolbar.extensions.settings.SoundSettingsView');

/**
 * SoundSettingsView
 *
 * Three volume rows — interface, furniture, trax — each a `SoundSettingsItem` over a
 * container the layout provides. The view holds the three numbers; the rows write through
 * it, and it writes to the sound manager.
 *
 * A drag only previews: `saveVolume(..., false)` routes to `previewVolume()`, letting the
 * player hear the change without storing it. Closing the window commits all three.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/extensions/settings/SoundSettingsView.as
 */
export class SoundSettingsView
{
    // AS3: .../SoundSettingsView.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: .../SoundSettingsView.as::_SafeStr_6213
    private _uiVolumeItem: SoundSettingsItem | null = null;

    // AS3: .../SoundSettingsView.as::_SafeStr_6199
    private _furniVolumeItem: SoundSettingsItem | null = null;

    // AS3: .../SoundSettingsView.as::_SafeStr_6274
    private _traxVolumeItem: SoundSettingsItem | null = null;

    // AS3: .../SoundSettingsView.as::_genericVolume
    private _genericVolume: number = 1;

    // AS3: .../SoundSettingsView.as::_furniVolume
    private _furniVolume: number = 1;

    // AS3: .../SoundSettingsView.as::_traxVolume
    private _traxVolume: number = 1;

    // AS3: .../SoundSettingsView.as::_toolbar
    private _toolbar: HabboToolbar | null;

    // AS3: .../SoundSettingsView.as::SoundSettingsView()
    constructor(toolbar: HabboToolbar)
    {
        this._toolbar = toolbar;

        this.createWindow();
    }

    // AS3: .../SoundSettingsView.as::get window()
    get window(): IWindowContainer | null
    {
        return this._window;
    }

    // AS3: .../SoundSettingsView.as::get toolbar()
    get toolbar(): HabboToolbar | null
    {
        return this._toolbar;
    }

    // AS3: .../SoundSettingsView.as::updateSettings()
    updateSettings(): void
    {
        const soundManager = this._toolbar?.soundManager ?? null;

        if(soundManager === null) return;

        this._genericVolume = soundManager.genericVolume;
        this._furniVolume = soundManager.furniVolume;
        this._traxVolume = soundManager.traxVolume;

        this._uiVolumeItem?.setValue(this._genericVolume);
        this._furniVolumeItem?.setValue(this._furniVolume);
        this._traxVolumeItem?.setValue(this._traxVolume);
    }

    /** Every direct child gets the click handler; only `back_btn` does anything with it. */
    // DEVIATION: AS3 shows the `trax_volume_container` row; the RPG fork removed jukebox music, so
    //   the row is hidden until Task 10 drops it from the layout.
    // AS3: .../SoundSettingsView.as::createWindow()
    private createWindow(): void
    {
        const asset = this._toolbar?.assets?.getAssetByName('me_menu_sound_settings_xml') as XmlAsset | null;

        if(asset === null || asset === undefined)
        {
            log.warn('Missing layout "me_menu_sound_settings_xml" - sound settings cannot open');

            return;
        }

        this._window = this._toolbar?.windowManager?.buildFromXML(
            asset.content as unknown as string
        ) as IWindowContainer | null;

        if(this._window === null) return;

        for(let index = 0; index < this._window.numChildren; index++)
        {
            this._window.getChildAt(index)?.addEventListener(WindowMouseEvent.CLICK, this.onButtonClicked);
        }

        this._uiVolumeItem = new SoundSettingsItem(this, SoundSettingsItem.TYPE_UI_VOLUME, this.uiVolumeContainer);
        this._furniVolumeItem = new SoundSettingsItem(this, SoundSettingsItem.TYPE_FURNI_VOLUME, this.furniVolumeContainer);
        this._traxVolumeItem = new SoundSettingsItem(this, SoundSettingsItem.TYPE_TRAX_VOLUME, this.traxVolumeContainer);

        if(this.traxVolumeContainer) this.traxVolumeContainer.visible = false;

        this.updateSettings();
    }

    // AS3: .../SoundSettingsView.as::onButtonClicked()
    private onButtonClicked = (event: WindowEvent): void =>
    {
        const name = (event.target as unknown as IWindow | null)?.name ?? '';

        if(name !== 'back_btn')
        {
            log.debug(`Me Menu Settings View: unknown button: ${name}`);

            return;
        }

        this.dispose();
    };

    /**
     * `-1` means "leave this channel alone", which is how one row writes its own volume
     * without disturbing the other two.
     */
    // AS3: .../SoundSettingsView.as::saveVolume()
    saveVolume(genericVolume: number, furniVolume: number, traxVolume: number, save: boolean = true): void
    {
        const soundManager = this._toolbar?.soundManager ?? null;

        if(soundManager === null) return;

        const furni = furniVolume !== -1 ? furniVolume : this._furniVolume;
        const generic = genericVolume !== -1 ? genericVolume : this._genericVolume;
        const trax = traxVolume !== -1 ? traxVolume : this._traxVolume;

        if(save)
        {
            soundManager.furniVolume = furni;
            soundManager.genericVolume = generic;
            soundManager.traxVolume = trax;
        }
        else
        {
            soundManager.previewVolume(generic, furni, trax);
        }
    }

    /** AS3 no-op: the sound settings carry no unseen-item badge. */
    // AS3: .../SoundSettingsView.as::updateUnseenItemCount()
    updateUnseenItemCount(_category: string, _count: number): void
    {
    }

    // AS3: .../SoundSettingsView.as::get uiVolumeContainer()
    get uiVolumeContainer(): IWindowContainer | null
    {
        return (this._window?.findChildByName('ui_volume_container') ?? null) as IWindowContainer | null;
    }

    // AS3: .../SoundSettingsView.as::get furniVolumeContainer()
    get furniVolumeContainer(): IWindowContainer | null
    {
        return (this._window?.findChildByName('furni_volume_container') ?? null) as IWindowContainer | null;
    }

    // AS3: .../SoundSettingsView.as::get traxVolumeContainer()
    get traxVolumeContainer(): IWindowContainer | null
    {
        return (this._window?.findChildByName('trax_volume_container') ?? null) as IWindowContainer | null;
    }

    /**
     * sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/extensions/settings/SoundSettingsView.as
     * also declares four `BitmapData` icon fields (`soundsOffIconColor`, `soundsOffIconWhite`,
     * `soundsOnIconColor`, `soundsOnIconWhite`) with public getters, and disposes them here.
     * Nothing in that file — nor in `SoundSettingsItem`, which loads its icons by `assetUri`
     * instead — ever assigns them, so they are permanently null and the getters are never
     * called. Omitted rather than ported as four fields that can only ever be null.
     */
    // AS3: .../SoundSettingsView.as::dispose()
    dispose(): void
    {
        this.saveVolume(this._genericVolume, this._furniVolume, this._traxVolume);

        if(this._window !== null) this._window.dispose();

        this._window = null;

        this._uiVolumeItem?.dispose();
        this._uiVolumeItem = null;

        this._furniVolumeItem?.dispose();
        this._furniVolumeItem = null;

        this._traxVolumeItem?.dispose();
        this._traxVolumeItem = null;
    }
}
