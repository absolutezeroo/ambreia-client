import type {HabboToolbar} from '../HabboToolbar';
import type {BottomBarLeft} from '../BottomBarLeft';
import type {MeMenuSettingsMenuView} from './MeMenuSettingsMenuView';
import {MeMenuNewIconLoader} from './MeMenuNewIconLoader';
import type {HabboToolbarEvent} from '../events/HabboToolbarEvent';
import {AbstractSubMenuController} from '../abstractsubmenu/AbstractSubMenuController';
import {GetExtendedProfileMessageComposer} from '@habbo/communication/messages/outgoing/users/GetExtendedProfileMessageComposer';
import {GetTalentTrackMessageComposer} from '@habbo/communication/messages/outgoing/talent';
import {HabboWebTools} from '@habbo/utils/HabboWebTools';
import type {IWindow} from '@core/window/IWindow';
import type {IBoxSizerWindow} from '@core/window/components/IBoxSizerWindow';
import {Logger} from '@core/utils/Logger';

const log = Logger.getLogger('habbo.toolbar.memenu.MeMenuNewController');

/**
 * The "me menu" popup for the new horizontal bottom bar: profile, minimail, rooms,
 * talents, settings, achievements, guide, clothes, forums.
 *
 * Note: this build's shipped `me_menu_new_view_xml` layout has no "achievements"
 * region at all (verified against the raw AS3 dump too - not a stale-asset gap), so
 * achievements is not reachable through this menu here; see ProgMenuController
 * (the "PROGRESSION" bottom-bar icon), which is the real entry point in this build.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/memenu/MeMenuNewController.as
 */
export class MeMenuNewController extends AbstractSubMenuController
{
    // AS3: .../src/com/sulake/habbo/toolbar/memenu/MeMenuNewController.as::USE_GUIDE_TOOL
    public static readonly USE_GUIDE_TOOL: string = 'USE_GUIDE_TOOL';

    /** The Fish-O-Pedia entry, kept out of the dump-built layout — see `addFishpediaEntry()`. */
    // TS-only: Vortex-only fishing system — no AS3 counterpart.
    private static readonly FISHPEDIA_LAYOUT: string = 'vortex_memenu_fishpedia_xml';

    /** One entry's column: 60 wide plus the menu's own 8px gutter, as the shipped entries space. */
    // TS-only: Vortex-only fishing system — no AS3 counterpart.
    private static readonly FISHPEDIA_COLUMN: number = 68;

    /**
     * The geometry `me_menu_new_view_xml`'s row was authored with, recovered from the positions it
     * ships — see `addFishpediaEntry()`.
     */
    // TS-only: recovered from the shipped layout, not from AS3.
    private static readonly ROW_PADDING_H: number = 12;
    // TS-only: recovered from the shipped layout, not from AS3.
    private static readonly ROW_PADDING_V: number = 2;
    // TS-only: recovered from the shipped layout, not from AS3.
    private static readonly ROW_SPACING: number = 8;

    private _iconLoader: MeMenuNewIconLoader | null;
    private _settingsView: MeMenuSettingsMenuView | null = null;

    // DEVIATION: AS3 hides the `collectibles` entry only when `classic.collectibles.hub.enabled` or
    //   `collectibles.hub.enabled` is off; the RPG fork removed collectibles, so it is always hidden
    //   until Task 10 removes it from the XML.
    // AS3: MeMenuNewController.as::MeMenuNewController()
    constructor(toolbar: HabboToolbar, bottomBarLeft: BottomBarLeft)
    {
        super(toolbar, bottomBarLeft, 'me_menu_new_view_xml', 'HTIE_ICON_MEMENU');

        if(!toolbar.getBoolean('guides.enabled'))
        {
            this.setGuideToolVisibility(false);
        }

        this.setCollectiblesVisibility(false);

        this.setMinimailVisibility(false);

        this._iconLoader = new MeMenuNewIconLoader(toolbar);

        this.addFishpediaEntry();
    }

    /**
     * Adds the Fish-O-Pedia entry to the shipped menu.
     *
     * Vortex-only: fishing is an Origins feature, so `me_menu_new_view_xml` has no such region —
     * and it cannot be given one, because that file is rewritten from the dump by
     * `build-window-assets.mjs`. The entry is its own layout in `vortex-layouts/` and is parented
     * here instead, which is also how it survives an asset rebuild.
     *
     * No click handler is bound: `AbstractSubMenuController` puts one procedure on the whole window
     * and dispatches on `window.name`, so the region's name is the wiring.
     *
     * **The row is a `boxsizer`, which owns its children's positions.** It re-lays the whole row out
     * on `WE_CHILD_ADDED` — and on `WE_CHILD_VISIBILITY`, which the three `set*Visibility()` calls in
     * the constructor already fire — so the entry's own x in the layout is never read, and neither
     * are the shipped x's of the eight entries beside it. It also carries no `spacing`/`padding`
     * variables, so it arranges with `BoxSizerController`'s defaults (8/8/5) rather than the pitch
     * the row was drawn at, which moves every icon the first time one of them is hidden. The three
     * constants above are that pitch, recovered by solving the shipped positions: 12, 70, 128, 196,
     * 264, 332, 400, 468 and the spacer at 536 are exactly `paddingHorizontal 12`, `spacing 8`, with
     * every region at `paddingVertical 2`. Setting them makes the arrangement reproduce the layout
     * as drawn, and places the ninth column without a hardcoded coordinate anywhere.
     */
    // TS-only: Vortex-only fishing system — no AS3 counterpart.
    private addFishpediaEntry(): void
    {
        const window = this.window;
        const spacer = window?.findChildByName('spacer') ?? null;
        const row = spacer?.parent as IBoxSizerWindow | null;

        if(window === null || spacer === null || row === null || typeof row.setSpacing !== 'function')
        {
            log.warn('me_menu_new_view_xml is not the boxsizer row it was; the Fish-O-Pedia entry is not added.');

            return;
        }

        const entry = this.toolbar?.windowManager?.buildWidgetLayout(
            MeMenuNewController.FISHPEDIA_LAYOUT, 2
        ) as IWindow | null;

        if(entry === null || entry === undefined)
        {
            log.warn(`${MeMenuNewController.FISHPEDIA_LAYOUT} is not registered; the Fish-O-Pedia entry is not added.`);

            return;
        }

        row.setHorizontalPadding(MeMenuNewController.ROW_PADDING_H);
        row.setVerticalPadding(MeMenuNewController.ROW_PADDING_V);
        row.setSpacing(MeMenuNewController.ROW_SPACING);

        // Before the spacer, which is the row's right margin rather than an entry.
        row.addChildAt(entry, row.getChildIndex(spacer));

        // Nothing in the chain reflects its parent's resize — no REFLECT_*_RESIZE_TO_PARENT in any
        // of their params — so the boxsizer, the container, the bordered plate and the window each
        // need the ninth column added by hand, or it draws outside the plate.
        for(let level: IWindow | null = row; level !== null; level = level.parent)
        {
            level.width = level.width + MeMenuNewController.FISHPEDIA_COLUMN;

            if(level === window) break;
        }
    }

    /**
	 * Set the unseen achievements count
	 */
    set unseenAchievementsCount(value: number)
    {
        this.setUnseenItemCount('achievements', value);
    }

    /**
	 * Set the unseen minimails count
	 */
    // AS3: MeMenuNewController.as::set unseenMinimailsCount()
    set unseenMinimailsCount(value: number)
    {
        this.setUnseenItemCount('minimail', value);
    }

    /**
	 * Set the unseen forums count
	 */
    // AS3: MeMenuNewController.as::set unseenForumsCount()
    set unseenForumsCount(value: number)
    {
        this.setUnseenItemCount('forums', value);
    }

    // DEVIATION: AS3 also opens the collectibles hub (`collectibles/open`); the RPG fork removed it.
    // AS3: MeMenuNewController.as::onSubMenuItemClick()
    protected override onSubMenuItemClick(itemName: string): void
    {
        switch(itemName)
        {
            case 'profile': {
                const userId = this.toolbar?.sessionDataManager?.userId;

                if(userId !== undefined)
                {
                    this.toolbar?.communicationManager?.connection?.send(new GetExtendedProfileMessageComposer(userId));
                }
                break;
            }
            case 'minimail':
                HabboWebTools.openMinimail('#mail/inbox/');
                break;
            case 'rooms':
                this.toolbar?.navigator?.showOwnRooms();
                break;
            case 'talents': {
                const trackName = this.toolbar?.sessionDataManager?.currentTalentTrack;

                if(trackName !== undefined)
                {
                    this.toolbar?.communicationManager?.connection?.send(new GetTalentTrackMessageComposer(trackName));
                }
                break;
            }
            case 'settings':
                // Empty in AS3 too — `case "settings":` is the last label of the switch and has no
                // statements at all (MeMenuNewController.as:75). Not an owed port: the live
                // settings window is reached from the toolbar's own extension strip, not here.
                break;
            case 'achievements':
                this.toolbar?.questEngine?.showAchievements();
                break;
            case 'guide':
                this.toolbar?.toggleWindowVisibility('GUIDE');
                break;
            case 'clothes':
                this.toolbar?.context.createLinkEvent('avatareditor/open');
                break;
            case 'forums':
                this.toolbar?.context.createLinkEvent('groupforum/list/my');
                break;
            // TS-only: Vortex-only fishing system — no AS3 counterpart. `HabboFishing` registers
            //   itself as the `fishpedia/` link tracker, so the toolbar needs no reference to it.
            case 'fishpedia':
                this.toolbar?.context.createLinkEvent('fishpedia/open');
                break;
        }
    }

    // AS3: MeMenuNewController.as::onToolbarClick()
    protected override onToolbarClick(event: HabboToolbarEvent): void
    {
        super.onToolbarClick(event);

        if(event.iconId !== 'HTIE_ICON_MEMENU' && this._settingsView)
        {
            this._settingsView.dispose();
            this._settingsView = null;
        }
    }

    // AS3: MeMenuNewController.as::setGuideToolVisibility()
    private setGuideToolVisibility(visible: boolean): void
    {
        const guide = this.window?.findChildByName('guide');
        const profile = this.window?.findChildByName('profile');

        if(guide) guide.visible = visible;

        if(this.window && guide && profile)
        {
            this.window.height = visible ? guide.bottom + 5 : profile.bottom + 5;
        }
    }

    // AS3: MeMenuNewController.as::setCollectiblesVisibility()
    private setCollectiblesVisibility(visible: boolean): void
    {
        const collectibles = this.window?.findChildByName('collectibles');

        if(collectibles) collectibles.visible = visible;
    }

    // AS3: MeMenuNewController.as::setMinimailVisibility()
    private setMinimailVisibility(visible: boolean): void
    {
        const minimail = this.window?.findChildByName('minimail');

        if(minimail) minimail.visible = visible;
    }

    // AS3: MeMenuNewController.as::toggleVisibility()
    override toggleVisibility(): void
    {
        super.toggleVisibility();

        if(this._settingsView)
        {
            this._settingsView.dispose();
            this._settingsView = null;
        }

        if(this.window?.visible)
        {
            const talents = this.window.findChildByName('talents');

            if(talents && !this.toolbar?.getBoolean('talent.track.enabled'))
            {
                talents.visible = false;
            }

            if(this.toolbar?.getBoolean('guides.enabled') && this.toolbar.sessionDataManager)
            {
                const hasPerk = this.toolbar.sessionDataManager.isPerkAllowed(MeMenuNewController.USE_GUIDE_TOOL);

                this.setGuideToolVisibility(hasPerk);
            }
        }
    }

    // AS3: MeMenuNewController.as::dispose()
    override dispose(): void
    {
        if(this.disposed) return;

        if(this._settingsView)
        {
            this._settingsView.dispose();
            this._settingsView = null;
        }

        if(this._iconLoader)
        {
            this._iconLoader.dispose();
            this._iconLoader = null;
        }

        super.dispose();
    }
}
