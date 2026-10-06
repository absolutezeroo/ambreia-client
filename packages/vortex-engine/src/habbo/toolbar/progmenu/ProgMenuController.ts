import type {HabboToolbar} from '../HabboToolbar';
import type {BottomBarLeft} from '../BottomBarLeft';
import {AbstractSubMenuController} from '../abstractsubmenu/AbstractSubMenuController';

/**
 * The "Progression" bottom-bar popup: achievements, quests, daily tasks and
 * badge leaderboards. (AS3 also has the reward-track introduction; the RPG fork
 * removed the Reward track.)
 *
 * This is the toolbar's real entry point into the achievements panel — clicking
 * the PROGRESSION bottom-bar icon opens this menu, and its "achievements" region
 * calls HabboQuestEngine.showAchievements(). Neither the me-menu popup
 * (me_menu_new_view_xml) nor the bottom bar itself (bottom_bar_left_xml) has an
 * achievements region in this client build; this menu is where it actually lives.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/progmenu/ProgMenuController.as
 */
export class ProgMenuController extends AbstractSubMenuController
{
    // DEVIATION: AS3 leaves the `introduction` (reward track) region visible; the RPG fork removed
    //   the Reward track, so it is hidden until Task 10 of the M0 cleanup drops it from the layout.
    // AS3: ProgMenuController.as::ProgMenuController()
    constructor(toolbar: HabboToolbar, toolbarView: BottomBarLeft)
    {
        super(toolbar, toolbarView, 'prog_menu_view_xml', 'HTIE_ICON_PROGRESSION');

        const introduction = this.window?.findChildByName('introduction');

        if(introduction !== null && introduction !== undefined) introduction.visible = false;

        if(toolbar.getBoolean('toolbar.hide.quests'))
        {
            this.setQuestsVisibility(false);
        }

        if(!toolbar.getBoolean('dailytasks.enabled'))
        {
            this.setDailyTasksVisibility(false);
        }
    }

    // DEVIATION: AS3 also opens the reward track from the `introduction` region; the RPG fork
    //   removed the Reward track.
    // AS3: ProgMenuController.as::onSubMenuItemClick()
    protected override onSubMenuItemClick(itemName: string): void
    {
        switch(itemName)
        {
            case 'achievements':
                this.toolbar?.questEngine?.showAchievements();
                break;
            case 'dailytasks':
                this.toolbar?.context.createLinkEvent('dailytasks/open');
                break;
            case 'leaderboards':
                // AS3: _SafeCls_2379.getLink(0,-1,0) — inlined; that class is a one-line
                // string builder ("badge_leaderboard/" + rank + "/" + type + "/" + subtype),
                // not worth a whole new port file for a single fixed-argument call site.
                this.toolbar?.context.createLinkEvent('badge_leaderboard/0/-1/0');
                break;
            case 'quests':
                this.toolbar?.questEngine?.showQuests();
                break;
        }
    }

    // AS3: ProgMenuController.as::setQuestsVisibility()
    private setQuestsVisibility(visible: boolean): void
    {
        const quests = this.window?.findChildByName('quests');

        if(quests !== null && quests !== undefined)
        {
            quests.visible = visible;
        }
    }

    // AS3: ProgMenuController.as::setDailyTasksVisibility()
    private setDailyTasksVisibility(visible: boolean): void
    {
        const dailyTasks = this.window?.findChildByName('dailytasks');

        if(dailyTasks !== null && dailyTasks !== undefined)
        {
            dailyTasks.visible = visible;
        }
    }

    /**
	 * Set the unseen achievements count badge.
	 */
    // AS3: ProgMenuController.as::set unseenAchievementsCount()
    set unseenAchievementsCount(value: number)
    {
        this.setUnseenItemCount('achievements', value);
    }

    /**
	 * Set the unseen daily-task count badge.
	 */
    // AS3: ProgMenuController.as::set unseenDailyTaskCount()
    set unseenDailyTaskCount(value: number)
    {
        this.setUnseenItemCount('dailytasks', value);
    }
}
