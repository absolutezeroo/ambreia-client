/**
 * RentableBotMenuView — the bubble menu shown next to a rentable bot: pick it up, configure what it
 * says, rename it, make it dress up / wander / dance, plus whatever in-client links and NUX steps
 * its skill list carries.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/RentableBotMenuView.as
 *
 * Built on the same `avatar_menu_widget` layout as the peer-avatar bubble — the bot rows are simply
 * the ones that layout already declares (`pick`, `setup_chat`, `change_bot_name`, `dress_up`,
 * `random_walk`, `dance`, `donate_to_*`, `nux_*`, `wired_inspect`) plus the two templates it clones.
 *
 * Same AS3 adaptation as PetMenuView: the window's WME_OVER/WME_OUT listeners become one
 * `procedure`, because a window carries a single procedure in this port.
 */
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {Logger} from '@core/utils/Logger';
import {CommandBotComposer} from '@habbo/communication/messages/outgoing/room/bot/CommandBotComposer';
import {
    RemoveBotFromFlatMessageComposer
} from '@habbo/communication/messages/outgoing/room/bot/RemoveBotFromFlatMessageComposer';

import {RoomWidgetUserActionMessage} from '../messages/RoomWidgetUserActionMessage';
import {AvatarContextInfoButtonView} from './AvatarContextInfoButtonView';
import {BotSkillEnum} from './botskills/BotSkillEnum';
import type {RentableBotInfoData} from './RentableBotInfoData';
import type {AvatarInfoWidget} from './AvatarInfoWidget';

const log = Logger.getLogger('habbo.ui.widget.avatarinfo.RentableBotMenuView');

export class RentableBotMenuView extends AvatarContextInfoButtonView
{
    // AS3: RentableBotMenuView.as::buttonEventProc() — the two name prefixes a cloned row carries, and
    // the offsets AS3 slices them at.
    private static readonly LINK_PREFIX = ':link ';

    private static readonly NUX_PROCEED_PREFIX = 'nux_proceed_';

    // AS3: RentableBotMenuView.as::_SafeStr_4556
    private _botData: RentableBotInfoData | null = null;

    // AS3: RentableBotMenuView.as::RentableBotMenuView()
    constructor(widget: AvatarInfoWidget)
    {
        super(widget);
        this._autoHideEnabled = false;
    }

    // AS3: RentableBotMenuView.as::setup()
    public static setup(
        view: RentableBotMenuView,
        userId: number,
        userName: string,
        roomIndex: number,
        userType: number,
        botData: RentableBotInfoData
    ): void
    {
        if(!view) return;

        view._botData = botData;

        AvatarContextInfoButtonView.setupButtonView(view, userId, userName, roomIndex, userType, false);
    }

    // AS3: RentableBotMenuView.as::get widget()
    private get widget(): AvatarInfoWidget
    {
        return this._widget as AvatarInfoWidget;
    }

    // AS3: RentableBotMenuView.as::updateWindow()
    protected override updateWindow(): void
    {
        if(!this._widget.assets || !this._widget.windowManager) return;

        if(this.minimized)
        {
            const minimizedView = this.getMinimizedView();

            if(minimizedView) this.activeView = minimizedView;

            return;
        }

        if(!this._window)
        {
            this._window = this._widget.windowManager.buildWidgetLayout('avatar_menu_widget', 0) as IWindowContainer | null;

            if(!this._window) return;

            this._window.procedure = this.windowProc;

            const minimize = this._window.findChildByName('minimize');

            if(minimize) minimize.procedure = this.onMinimize;
        }

        this._buttons = this._window.findChildByName('buttons') as IItemListWindow | null;

        if(this._buttons) this._buttons.procedure = this.buttonEventProc;

        const nameWindow = this._window.findChildByName('name') as ITextWindow | null;

        if(nameWindow) nameWindow.caption = this._userName;

        this._window.visible = false;
        this.activeView = this._window;
        this.updateButtons();
    }

    /**
     * AS3: RentableBotMenuView.as::updateButtons()
     *
     * Every row starts hidden and is switched on by a skill the bot actually has. Note the pick-up
     * rule: rights alone are not enough — a bot carrying NO_PICK_UP (12) cannot be taken back, and
     * a bot with no skill list at all falls back to rights only.
     */
    // AS3: RentableBotMenuView.as::updateButtons()
    public updateButtons(): void
    {
        if(!this._window || !this._botData || !this._buttons) return;

        const buttons = this._buttons;

        buttons.procedure = this.buttonEventProc;
        buttons.autoArrangeItems = false;

        const linkTemplate = buttons.getListItemByName('link_template') as IWindowContainer | null;
        const nuxTemplate = buttons.getListItemByName('nux_proceed_1') as IWindowContainer | null;
        const count = buttons.numListItems;

        for(let i = 0; i < count; i++)
        {
            const item = buttons.getListItemAt(i);

            if(item) item.visible = false;
        }

        const data = this._botData;
        const hasRights = data.amIOwner || data.amIAnyRoomController;
        const skills = data.botSkills;

        this.showButton('pick', skills.length === 0
            ? hasRights
            : skills.indexOf(BotSkillEnum.NO_PICK_UP) === -1 && hasRights);

        if(skills.length > 0)
        {
            this.showButton('donate_to_all', skills.indexOf(BotSkillEnum.DONATE_FURNITURE_TO_ALL) !== -1);
            this.showButton('donate_to_user', skills.indexOf(BotSkillEnum.DONATE_FURNITURE_TO_USER) !== -1);

            // The five configuration rows are the owner's alone — a room controller may pick the
            // bot up but not re-dress or rename it.
            if(data.amIOwner)
            {
                this.showButton('change_bot_name', skills.indexOf(BotSkillEnum.CHANGE_NAME) !== -1);
                this.showButton('dress_up', skills.indexOf(BotSkillEnum.FIGURE_STRING) !== -1);
                this.showButton('random_walk', skills.indexOf(BotSkillEnum.RANDOM_WALK) !== -1);
                this.showButton('setup_chat', skills.indexOf(BotSkillEnum.CHATTER_MARKOV) !== -1);
                this.showButton('dance', skills.indexOf(BotSkillEnum.DANCE) !== -1);
            }

            this.showButton('nux_take_tour', skills.indexOf(BotSkillEnum.NUX_TAKE_TOUR) !== -1);
        }

        // AS3 asks the wired component (`showInspectButton()`); the RPG fork removed wired.
        this.showButton('wired_inspect', false);

        for(const skill of data.botSkillsWithCommands)
        {
            switch(skill.id)
            {
                case BotSkillEnum.INCLIENT_LINK:
                    this.addLinkRow(buttons, linkTemplate, skill.data, (link) => `${RentableBotMenuView.LINK_PREFIX}${link}`);
                    break;
                case BotSkillEnum.NAVIGATOR_SEARCH:
                    this.addLinkRow(buttons, linkTemplate, skill.data, (query) => `${RentableBotMenuView.LINK_PREFIX}navigator/search/${query}`);
                    break;
                case BotSkillEnum.NUX_PROCEED:
                    this.addNuxRow(buttons, nuxTemplate, skill.data);
                    break;
            }
        }

        buttons.autoArrangeItems = true;
        buttons.visible = true;
    }

    /**
     * AS3: RentableBotMenuView.as::updateButtons() — the `id == 7` and `id == 14` arms, which only
     * differ in the link they build. The skill data is `"<caption>,<target>"`; anything else is
     * skipped, exactly as the AS3 length check does.
     */
    // AS3: RentableBotMenuView.as::updateButtons() (the id 7 / id 14 arms)
    private addLinkRow(
        buttons: IItemListWindow,
        template: IWindowContainer | null,
        data: string,
        buildName: (target: string) => string
    ): void
    {
        if(template === null) return;

        const parts = data.split(',');

        if(parts.length !== 2) return;

        const row = template.clone() as IWindowContainer;
        const label = row.findChildByName('label') as ITextWindow | null;

        if(label) label.caption = parts[0];

        // AS3 carries the link on the row's *name*, which buttonEventProc() reads back off the
        // clicked button's parent. Cloned rows have no other place to keep it.
        row.name = buildName(parts[1]);
        row.visible = true;
        buttons.addListItem(row);
    }

    /**
     * AS3: RentableBotMenuView.as::updateButtons() — the `id == 8` arm. Empty data shows the
     * layout's own first NUX row; `"<caption>,<index>"` either relabels that row (index 1) or
     * clones it into position for the later steps.
     */
    // AS3: RentableBotMenuView.as::updateButtons() (the id 8 arm)
    private addNuxRow(buttons: IItemListWindow, template: IWindowContainer | null, data: string): void
    {
        if(data === '')
        {
            this.showButton('nux_proceed_1', true);

            return;
        }

        const parts = data.split(',');

        if(parts.length !== 2) return;

        const index = parseInt(parts[1], 10);

        if(index === 1)
        {
            this.showButton('nux_proceed_1', true);

            const first = buttons.getListItemByName('nux_proceed_1') as IWindowContainer | null;
            const label = first?.findChildByName('label') as ITextWindow | null;

            if(label) label.caption = parts[0];

            return;
        }

        if(template === null || isNaN(index)) return;

        const row = template.clone() as IWindowContainer;
        const label = row.findChildByName('label') as ITextWindow | null;

        if(label) label.caption = parts[0];

        row.visible = true;
        row.name = `${RentableBotMenuView.NUX_PROCEED_PREFIX}${index}`;

        const first = buttons.getListItemByName('nux_proceed_1');

        buttons.addListItemAt(row, (first ? buttons.getListItemIndex(first) : 0) + index - 1);
    }

    // AS3: RentableBotMenuView.as::buttonEventProc()
    protected override buttonEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        if(this.disposed || !this._window || this._window.disposed) return;

        if(event.type !== 'WME_CLICK')
        {
            // AS3 defers to `super.buttonEventProc()` here, which is ButtonMenuView's hover tint.
            // A field-declared arrow cannot be reached through `super` in TS, so the base's own
            // body is called directly — the same shape PetMenuView uses.
            this.applyButtonHover(event, window);

            return;
        }

        let close = false;

        if(window.name === 'button')
        {
            close = this.handleButtonClick(window.parent?.name ?? '');
        }

        this.updateButtons();

        if(close) this._widget.removeView(this, false);
    };

    // AS3: RentableBotMenuView.as::buttonEventProc() — the switch and the two prefix tests below it.
    // Returns whether the menu closes, which AS3 tracks in the same local for all three paths.
    private handleButtonClick(name: string): boolean
    {
        const data = this._botData;

        if(data === null) return false;

        const connection = this.widget.handler?.container?.connection ?? null;

        switch(name)
        {
            case 'pick':
                connection?.send(new RemoveBotFromFlatMessageComposer(data.id));

                return true;
            case 'setup_chat':
                this.openSkillConfiguration(BotSkillEnum.CHATTER_MARKOV);

                return true;
            case 'change_bot_name':
                this.openSkillConfiguration(BotSkillEnum.CHANGE_NAME);

                return true;
            case 'random_walk':
                connection?.send(new CommandBotComposer(data.id, BotSkillEnum.RANDOM_WALK, ''));

                return true;
            case 'dress_up':
                connection?.send(new CommandBotComposer(data.id, BotSkillEnum.FIGURE_STRING, ''));

                return true;
            case 'dance':
                connection?.send(new CommandBotComposer(data.id, BotSkillEnum.DANCE, ''));

                return true;
            case 'donate_to_all':
                connection?.send(new CommandBotComposer(data.id, BotSkillEnum.DONATE_FURNITURE_TO_ALL, ''));

                return true;
            case 'donate_to_user':
                connection?.send(new CommandBotComposer(data.id, BotSkillEnum.DONATE_FURNITURE_TO_USER, ''));

                return true;
            case 'nux_take_tour':
                this.createLinkEvent('help/tour');
                connection?.send(new CommandBotComposer(data.id, BotSkillEnum.NUX_TAKE_TOUR, ''));

                return true;
            case 'wired_inspect':
                this.widget.messageListener?.processWidgetMessage(
                    new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.WIRED_INSPECT_BOT, data.id)
                );

                return true;
        }

        // AS3 tests both prefixes with indexOf() != -1 rather than a start-of-string check, and
        // slices at a fixed offset — so the row name really is `":link <target>"` /
        // `"nux_proceed_<n>"` and nothing else.
        if(name.indexOf(RentableBotMenuView.LINK_PREFIX) !== -1)
        {
            this.createLinkEvent(name.substr(RentableBotMenuView.LINK_PREFIX.length));

            return true;
        }

        if(name.indexOf(RentableBotMenuView.NUX_PROCEED_PREFIX) !== -1)
        {
            connection?.send(
                new CommandBotComposer(data.id, BotSkillEnum.NUX_PROCEED, name.substr(RentableBotMenuView.NUX_PROCEED_PREFIX.length))
            );

            return true;
        }

        log.debug(`Unhandled rentable-bot menu row "${name}"`);

        return false;
    }

    // AS3: RentableBotMenuView.as::buttonEventProc() — `widget.openBotSkillConfigurationView(id,
    // skill, point)`, where the point is the bottom-centre of this bubble so the editor opens
    // under it.
    private openSkillConfiguration(skillType: number): void
    {
        const data = this._botData;

        if(data === null || this._window === null) return;

        const rectangle = {x: 0, y: 0, width: 0, height: 0};

        this._window.getGlobalRectangle(rectangle);

        this.widget.openBotSkillConfigurationView(
            data.id, skillType,
            {x: rectangle.x + rectangle.width / 2, y: rectangle.y + rectangle.height}
        );
    }

    // AS3 reaches the link bus as `widget.component.context.createLinkEvent(...)`; this port's
    // widgets have no `component`, so it goes through the room engine's context — the same cast
    // RoomToolsToolbarCtrl documents for its achievements link.
    // AS3: RentableBotMenuView.as::buttonEventProc() — `widget.component.context.createLinkEvent()`
    private createLinkEvent(link: string): void
    {
        const context = (this.widget.handler?.container?.roomEngine as unknown as {
            context?: {createLinkEvent(link: string): void};
        } | null)?.context ?? null;

        context?.createLinkEvent(link);
    }

    // AS3: RentableBotMenuView.as::updateWindow() — the WME_OVER/WME_OUT listeners it puts on
    // `_window`, plus the port's click-away dismissal. Same shape as PetMenuView.windowProc().
    private windowProc = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WME_CLICK_AWAY')
        {
            this._widget.removeView(this, false);

            return;
        }

        this.onMouseHoverEvent(event, window);
    };

    // AS3: RentableBotMenuView.as::dispose()
    public override dispose(): void
    {
        this._botData = null;

        super.dispose();
    }
}
