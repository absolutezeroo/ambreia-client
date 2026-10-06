import type {MeMenuSettingsMenuView} from '../MeMenuSettingsMenuView';
import type {MeMenuController} from '../MeMenuController';
import type {ToolbarView} from '../../ToolbarView';
import {MeMenuSoundSettingsItem} from './MeMenuSoundSettingsItem';
import {Logger} from '@core/utils/Logger';

const log = Logger.getLogger('habbo.toolbar.memenu.soundsettings.MeMenuSoundSettingsView');

/**
 * Sound settings view within the me menu
 *
 * In AS3 this creates a window with three sound setting items (UI, furni, trax),
 * manages volume state and syncs with the sound manager via the settings menu
 *
 * **Dead in the 2026 build, and deliberately left as a shell.** `HabboToolbar` constructs
 * `BottomBarLeft`, which constructs `MeMenuNewController`; `ToolbarView` is never constructed in
 * either tree, and `MeMenuController` only by `ToolbarView`. The whole chain is the 2023 me-menu
 * design that `MeMenuNewController` replaced. Porting its window code would be porting dead code —
 * check `BottomBarLeft`/`MeMenuNewController` before adding anything here.
 *
 * @see sources/win63_version/habbo/toolbar/memenu/soundsettings/MeMenuSoundSettingsView.as
 */
export class MeMenuSoundSettingsView
{
    private _settingsMenuView: MeMenuSettingsMenuView | null = null;
    private _toolbarView: ToolbarView | null = null;

    constructor()
    {
        log.debug('MeMenuSoundSettingsView constructed');
    }

    private _uiVolumeItem: MeMenuSoundSettingsItem | null = null;

    /**
	 * The UI volume item
	 */
    get uiVolumeItem(): MeMenuSoundSettingsItem | null
    {
        return this._uiVolumeItem;
    }

    private _furniVolumeItem: MeMenuSoundSettingsItem | null = null;

    /**
	 * The furni volume item
	 */
    get furniVolumeItem(): MeMenuSoundSettingsItem | null
    {
        return this._furniVolumeItem;
    }

    private _traxVolumeItem: MeMenuSoundSettingsItem | null = null;

    /**
	 * The trax volume item
	 */
    get traxVolumeItem(): MeMenuSoundSettingsItem | null
    {
        return this._traxVolumeItem;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/memenu/soundsettings/MeMenuSoundSettingsView.as::_genericVolume
    private _genericVolume: number = 1;

    /**
	 * The current generic (UI) volume
	 */
    get genericVolume(): number
    {
        return this._genericVolume;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/memenu/soundsettings/MeMenuSoundSettingsView.as::_furniVolume
    private _furniVolume: number = 1;

    /**
	 * The current furni volume
	 */
    get furniVolume(): number
    {
        return this._furniVolume;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/memenu/soundsettings/MeMenuSoundSettingsView.as::_traxVolume
    private _traxVolume: number = 1;

    /**
	 * The current trax volume
	 */
    get traxVolume(): number
    {
        return this._traxVolume;
    }

    /**
	 * The parent widget controller
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/memenu/soundsettings/MeMenuSoundSettingsView.as::get widget()
    get widget(): MeMenuController | null
    {
        return this._settingsMenuView?.widget ?? null;
    }

    /**
	 * Initialize the sound settings view
	 *
	 * @param settingsMenuView The parent settings menu view
	 * @param toolbarView The toolbar view for positioning
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/memenu/soundsettings/MeMenuSoundSettingsView.as::init()
    public init(settingsMenuView: MeMenuSettingsMenuView, toolbarView: ToolbarView): void
    {
        this._settingsMenuView = settingsMenuView;
        this._toolbarView = toolbarView;

        this._uiVolumeItem = new MeMenuSoundSettingsItem(this, MeMenuSoundSettingsItem.TYPE_UI_VOLUME);
        this._furniVolumeItem = new MeMenuSoundSettingsItem(this, MeMenuSoundSettingsItem.TYPE_FURNI_VOLUME);
        this._traxVolumeItem = new MeMenuSoundSettingsItem(this, MeMenuSoundSettingsItem.TYPE_TRAX_VOLUME);

        this.updateSettings();
    }

    /**
	 * Update settings from the sound manager
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/memenu/soundsettings/MeMenuSoundSettingsView.as::updateSettings()
    public updateSettings(): void
    {
        // In AS3: reads volumes from settingsMenuView.widget.toolbar.soundManager
        // In Vortex, these would be synced from the sound manager
        if(this._uiVolumeItem)
        {
            this._uiVolumeItem.setValue(this._genericVolume);
        }

        if(this._furniVolumeItem)
        {
            this._furniVolumeItem.setValue(this._furniVolume);
        }

        if(this._traxVolumeItem)
        {
            this._traxVolumeItem.setValue(this._traxVolume);
        }
    }

    /**
	 * Save volume values
	 *
	 * @param genericVolume UI volume (-1 to keep current)
	 * @param furniVolume Furni volume (-1 to keep current)
	 * @param traxVolume Music volume (-1 to keep current)
	 * @param persist If true, persist the volume. If false, just preview.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/memenu/soundsettings/MeMenuSoundSettingsView.as::saveVolume()
    public saveVolume(genericVolume: number, furniVolume: number, traxVolume: number, persist: boolean = true): void
    {
        const effectiveFurni = furniVolume !== -1 ? furniVolume : this._furniVolume;
        const effectiveGeneric = genericVolume !== -1 ? genericVolume : this._genericVolume;
        const effectiveMusic = traxVolume !== -1 ? traxVolume : this._traxVolume;

        if(persist)
        {
            if(!this._settingsMenuView) return;

            this._genericVolume = effectiveGeneric;
            this._furniVolume = effectiveFurni;
            this._traxVolume = effectiveMusic;

            // In AS3: widget.toolbar.soundManager.furniVolume = effectiveFurni
            // In AS3: widget.toolbar.soundManager.genericVolume = effectiveGeneric
            // In AS3: widget.toolbar.soundManager.traxVolume = effectiveMusic
        }
        else
        {
            // In AS3: widget.toolbar.soundManager.previewVolume(effectiveGeneric, effectiveFurni, effectiveMusic)
        }
    }

    /**
	 * Handle a button click
	 *
	 * @param buttonName The button name
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/memenu/soundsettings/MeMenuSoundSettingsView.as::onButtonClicked()
    public onButtonClicked(buttonName: string): void
    {
        if(buttonName === 'back_btn')
        {
            if(this._settingsMenuView)
            {
                this._settingsMenuView.visible = true;
            }

            this.dispose();
        }
        else
        {
            log.warn(`Me Menu Settings View: unknown button: ${buttonName}`);
        }
    }

    /**
	 * Dispose of this view
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/memenu/soundsettings/MeMenuSoundSettingsView.as::dispose()
    public dispose(): void
    {
        this.saveVolume(this._genericVolume, this._furniVolume, this._traxVolume);

        this._settingsMenuView = null;
        this._toolbarView = null;

        if(this._uiVolumeItem)
        {
            this._uiVolumeItem.dispose();
            this._uiVolumeItem = null;
        }

        if(this._furniVolumeItem)
        {
            this._furniVolumeItem.dispose();
            this._furniVolumeItem = null;
        }

        if(this._traxVolumeItem)
        {
            this._traxVolumeItem.dispose();
            this._traxVolumeItem = null;
        }
    }
}
