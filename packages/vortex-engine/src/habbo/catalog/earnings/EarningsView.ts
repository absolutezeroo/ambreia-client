import type {IDisposable} from '@core/runtime';
import type {XmlAsset} from '@core/assets/XmlAsset';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {Logger} from '@core/utils/Logger';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {
    IncomeRewardData
} from '@habbo/communication/messages/incoming/inventory/IncomeRewardData';

import type {EarningsController} from './EarningsController';

const log = Logger.getLogger('habbo.catalog.earnings.EarningsView');

/**
 * The vault window: one row per reward category, each showing credits, duckets and furniture waiting
 * to be claimed, plus a "claim all".
 *
 * **Every control is found by name built from the category string** — `dailygift_claim_button`,
 * `dailygiftCreditValue`, `dailygiftDucketValue` — so the layout and {@link REWARD_CATEGORIES} have
 * to stay in the same order: a category's *index* is what the server calls its id.
 *
 * **The duckets total is read back out of the window, not tracked.** `ducketValueForCategory()`
 * parses the caption it wrote earlier, which is how the soft-limit check knows what a claim would
 * add. Odd, and transcribed: the alternative would be a second copy of the state to keep in sync.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/earnings/EarningsView.as
 */
export class EarningsView implements IDisposable
{
    // AS3: EarningsView.as::ALL_CATEGORIES
    private static readonly ALL_CATEGORIES: number = -1;

    /**
	 * **Order is the wire contract**: the index into this array is the reward category id the server
	 * sends and `claimReward()` sends back. `tutorial` is index 0 and has no claim button in the
	 * layout — AS3's switch has no case for it, so category 0 is never claimed from here.
	 */
    // AS3: EarningsView.as::_rewardCategories
    private static readonly REWARD_CATEGORIES: string[] = [
        'tutorial',
        'dailygift',
        'achievements',
        'marketplace',
        'habboclub',
        'levelprogression',
        'roombundlesales',
        'bonusbag',
        'donation',
        'surprise',
        'snowstorm',
        'games',
        'wiredchest',
        'agency',
    ];

    /**
	 * Duckets are reward type 0, credits type 1. AS3 inlines both and names neither.
	 */
    // AS3: EarningsView.as::onIncomeRewardDataReceived() — inline reward types (names derived)
    private static readonly REWARD_TYPE_DUCKETS: number = 0;

    // AS3: EarningsView.as::onIncomeRewardDataReceived() — inline reward type (name derived)
    private static readonly REWARD_TYPE_CREDITS: number = 1;

    /**
	 * The purse currency the soft limit is checked against. AS3 inlines 0 at its one call site.
	 */
    // AS3: EarningsView.as::windowProcedure() — inline activity-point type (name derived)
    private static readonly ACTIVITY_POINT_TYPE_DUCKETS: number = 0;

    // AS3: EarningsView.as::_SafeStr_4593 (name derived: the owning controller)
    private _controller: EarningsController | null;

    // AS3: EarningsView.as::_window
    private _window: IWindowContainer | null = null;

    /**
	 * Three rows are hidden at build time rather than by the layout: two behind config flags, and
	 * `wiredchest` unconditionally — it is revealed again only if a status message actually reports
	 * something in it.
	 */
    // DEVIATION: AS3 hides the `snowstorm_container` row only while `games_icon_enabled` is off; the
    //   RPG fork removed Snow War, so it is always hidden (still in the shipped layout until cleaned).
    // AS3: EarningsView.as::EarningsView()
    constructor(controller: EarningsController, windowManager: IHabboWindowManager | null)
    {
        this._controller = controller;

        const asset = (controller.assets?.getAssetByName('vault_view_xml') as XmlAsset | null) ?? null;
        const layout = asset?.content ?? null;

        if(layout === null || windowManager === null)
        {
            log.warn('Missing layout "vault_view_xml" — the vault window is not built');

            return;
        }

        this._window = windowManager.buildFromXML(layout) as IWindowContainer | null;

        if(this._window === null) return;

        this._window.procedure = this.windowProcedure;
        this._window.center();

        const list = (this._window.findChildByName('scrolling_earnings_list') as IItemListWindow | null) ?? null;

        if(list === null) return;

        // Always hidden: see the DEVIATION on the constructor.
        const snowstorm = list.findChildByName('snowstorm_container');

        if(snowstorm !== null) snowstorm.visible = false;

        if(!controller.getBoolean('wired.game_earnings'))
        {
            const games = list.findChildByName('games_container');
            const agency = list.findChildByName('agency_container');

            if(games !== null) games.visible = false;
            if(agency !== null) agency.visible = false;
        }

        const wiredChest = list.findChildByName('wiredchest_container');

        if(wiredChest !== null) wiredChest.visible = false;
    }

    // AS3: EarningsView.as::getDistinctRewardCategories()
    private static getDistinctRewardCategories(data: IncomeRewardData[]): number[]
    {
        const categories: number[] = [];

        for(const reward of data)
        {
            if(categories.indexOf(reward.rewardCategory) === -1)
            {
                categories.push(reward.rewardCategory);
            }
        }

        return categories;
    }

    /**
	 * A refused claim re-enables the button the player pressed — nothing else changes, because the
	 * amounts are still owed. A successful one zeroes the row instead.
	 */
    // AS3: EarningsView.as::onIncomeRewardClaimResponse()
    onIncomeRewardClaimResponse(rewardCategory: number, result: boolean): void
    {
        if(result)
        {
            if(rewardCategory === EarningsView.ALL_CATEGORIES)
            {
                for(let i = 0; i < EarningsView.REWARD_CATEGORIES.length; i++)
                {
                    this.updateRewardsForCategory(i, 0, 0);
                    this.setElementEnabled(`${EarningsView.REWARD_CATEGORIES[i]}_claim_button`, false);
                }
            }
            else
            {
                this.updateRewardsForCategory(rewardCategory, 0, 0);
            }

            return;
        }

        if(rewardCategory !== EarningsView.ALL_CATEGORIES)
        {
            this.setElementEnabled(`${EarningsView.REWARD_CATEGORIES[rewardCategory]}_claim_button`, true);

            return;
        }

        this.setElementEnabled('claim_all_btn', true);
    }

    /**
	 * The status message sends one row per (category, type), so each category's credits, duckets and
	 * product count are summed here before being written. A category with nothing owed has its claim
	 * button disabled; "claim all" is enabled if *any* category has something.
	 */
    // AS3: EarningsView.as::onIncomeRewardDataReceived()
    onIncomeRewardDataReceived(data: IncomeRewardData[]): void
    {
        const claimable: string[] = [];

        for(const category of EarningsView.getDistinctRewardCategories(data))
        {
            let duckets = 0;
            let credits = 0;
            let products = 0;

            for(const reward of data)
            {
                if(reward.rewardCategory !== category) continue;

                if(reward.rewardType === EarningsView.REWARD_TYPE_DUCKETS) duckets += reward.amount;

                if(reward.rewardType === EarningsView.REWARD_TYPE_CREDITS) credits += reward.amount;

                if(reward.productCode) products += 1;
            }

            this.updateRewardsForCategory(category, credits, duckets, products);

            if(credits > 0 || duckets > 0 || products > 0)
            {
                claimable.push(EarningsView.REWARD_CATEGORIES[category]);
            }
        }

        let anyClaimable = false;

        for(const name of EarningsView.REWARD_CATEGORIES)
        {
            const enabled = claimable.indexOf(name) !== -1;

            if(enabled) anyClaimable = true;

            // The wired-chest row is hidden at build time and only ever revealed here.
            if(enabled && name === 'wiredchest')
            {
                const container = this._window?.findChildByName('wiredchest_container');

                if(container !== null && container !== undefined) container.visible = true;
            }

            this.setElementEnabled(`${name}_claim_button`, enabled);
        }

        this.setElementEnabled('claim_all_btn', anyClaimable);
    }

    // AS3: EarningsView.as::getTotalDucketsToClaim()
    private getTotalDucketsToClaim(): number
    {
        let total = 0;

        for(let i = 0; i < EarningsView.REWARD_CATEGORIES.length; i++)
        {
            total += this.ducketValueForCategory(i);
        }

        return total;
    }

    // AS3: EarningsView.as::ducketValueForCategory()
    private ducketValueForCategory(category: number): number
    {
        if(category === EarningsView.ALL_CATEGORIES)
        {
            return this.getTotalDucketsToClaim();
        }

        const name = EarningsView.REWARD_CATEGORIES[category];
        const label = this._window?.findChildByName(`${name}DucketValue`) ?? null;

        if(label === null) return 0;

        return parseInt(label.caption, 10) || 0;
    }

    /**
	 * The product count is written **only when it is positive** — AS3 leaves a stale caption in place
	 * rather than zeroing it, so a category that had furniture keeps showing the old number until it
	 * has some again. Transcribed.
	 */
    // AS3: EarningsView.as::updateRewardsForCategory()
    private updateRewardsForCategory(category: number, credits: number, duckets: number, products: number = 0): void
    {
        const name = EarningsView.REWARD_CATEGORIES[category];

        if(name === undefined) return;

        const creditLabel = this._window?.findChildByName(`${name}CreditValue`) ?? null;

        if(creditLabel !== null) creditLabel.caption = String(credits);

        const ducketLabel = this._window?.findChildByName(`${name}DucketValue`) ?? null;

        if(ducketLabel !== null) ducketLabel.caption = String(duckets);

        if(products > 0)
        {
            const productLabel = this._window?.findChildByName(`${name}ProductValue`) ?? null;

            if(productLabel !== null) productLabel.caption = String(products);
        }
    }

    // AS3: EarningsView.as::setElementEnabled()
    private setElementEnabled(name: string, enabled: boolean): void
    {
        if(this._window === null) return;

        const element = this._window.findChildByName(name);

        if(element === null) return;

        if(enabled)
        {
            element.enable();
        }
        else
        {
            element.disable();
        }
    }

    /**
	 * One procedure for the whole window. The claim buttons map to their category **by an explicit
	 * switch, not by index**: `roombundlesales` (6) has no button, so the ids jump from 5 to 7.
	 *
	 * Claiming past the ducket soft limit asks first — the duckets would otherwise be lost, since the
	 * server caps rather than queues.
	 */
    // AS3: EarningsView.as::windowProcedure()
    private windowProcedure = (event: WindowEvent, target: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        let claiming = false;
        let claimCategory = 0;

        switch(target.name)
        {
            case 'vaultWithdraw_button':
            case 'vaultWithdrawAll_button':
                this._controller?.withdrawVaultCredits();
                break;
            case 'vaultOpenShop_button':
                this._controller?.openCatalogue();
                break;
            case 'header_button_close':
                this.dispose();
                break;
            case 'dailygift_claim_button': claiming = true; claimCategory = 1; break;
            case 'achievements_claim_button': claiming = true; claimCategory = 2; break;
            case 'marketplace_claim_button': claiming = true; claimCategory = 3; break;
            case 'habboclub_claim_button': claiming = true; claimCategory = 4; break;
            case 'levelprogression_claim_button': claiming = true; claimCategory = 5; break;
            case 'bonusbag_claim_button': claiming = true; claimCategory = 7; break;
            case 'donation_claim_button': claiming = true; claimCategory = 8; break;
            case 'surprise_claim_button': claiming = true; claimCategory = 9; break;
            case 'snowstorm_claim_button': claiming = true; claimCategory = 10; break;
            case 'games_claim_button': claiming = true; claimCategory = 11; break;
            case 'wiredchest_claim_button': claiming = true; claimCategory = 12; break;
            case 'agency_claim_button': claiming = true; claimCategory = 13; break;
            case 'claim_all_btn': claiming = true; claimCategory = EarningsView.ALL_CATEGORIES; break;
        }

        if(!claiming) return;

        const incoming = this.ducketValueForCategory(claimCategory);
        const current = this._controller?.catalog?.getPurse()
            ?.getActivityPointsForType(EarningsView.ACTIVITY_POINT_TYPE_DUCKETS) ?? 0;
        const softLimit = this._controller?.getInteger('duckets.soft_limit', 2147483647) ?? 2147483647;
        const buttonName = target.name;

        if(incoming > 0 && incoming + current > softLimit)
        {
            this._controller?.windowManager?.confirm(
                '${generic.alert.title}',
                '${earning.exceeding_limit}',
                0,
                (dialog, confirmEvent) =>
                {
                    dialog.dispose();

                    if(confirmEvent.type === 'WE_OK')
                    {
                        this.performClaim(buttonName, claimCategory);
                    }
                }
            );

            return;
        }

        this.performClaim(buttonName, claimCategory);
    };

    /**
	 * The button is disabled before the request goes out, so a double click cannot claim twice; the
	 * response re-enables it if the server refused.
	 */
    // AS3: EarningsView.as::performClaim()
    private performClaim(buttonName: string, category: number): void
    {
        if(this._window === null || this._controller === null) return;

        this.setElementEnabled(buttonName, false);
        this._controller.claimReward(category);
    }

    // AS3: EarningsView.as::dispose()
    dispose(): void
    {
        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
        }

        this._controller = null;
    }

    // AS3: EarningsView.as::get disposed()
    get disposed(): boolean
    {
        return this._controller === null;
    }
}
