import type {IDisposable} from '@core/runtime';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemGridWindow} from '@core/window/components/IItemGridWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {OrderedMap} from '@core/utils/OrderedMap';
import {Vector3d} from '@room/utils/Vector3d';
import type {IGetImageListener} from '@habbo/room/IGetImageListener';
import {HabboToolbarEvent} from '@habbo/toolbar/events/HabboToolbarEvent';
import {HabboToolbarIconEnum} from '@habbo/toolbar/HabboToolbarIconEnum';
import {
    RoomCompetitionInitMessageComposer
} from '@habbo/communication/messages/outgoing/competition/RoomCompetitionInitMessageComposer';
import {
    SubmitRoomToCompetitionMessageComposer
} from '@habbo/communication/messages/outgoing/competition/SubmitRoomToCompetitionMessageComposer';

import {
    GetTalentTrackMessageComposer
} from '@habbo/communication/messages/outgoing/talent/GetTalentTrackMessageComposer';
import type {
    CompetitionVotingInfoMessageEventParser
} from '@habbo/communication/messages/parser/competition/CompetitionVotingInfoMessageEventParser';
import type {
    CompetitionEntrySubmitResultMessageEventParser
} from '@habbo/communication/messages/parser/competition/CompetitionEntrySubmitResultMessageEventParser';
import type {HabboQuestEngine} from './HabboQuestEngine';
import {Logger} from '@core/utils/Logger';

const log = Logger.getLogger('habbo.quest.RoomCompetitionController');

/**
 * The room-competition banner: the strip that drops in at the top of a room to say either
 * "submit this room" (you own it) or "vote for this room" (you do not).
 *
 * The whole class is one window, `RoomCompetition`, driven entirely by two server messages.
 * `CompetitionVotingInfo` puts it in vote mode; `CompetitionEntrySubmitResult` puts it in submit
 * mode and its `result` code decides what the action button does and where the info line links to —
 * seven distinct wirings, listed at `onCompetitionEntrySubmitResult()`.
 *
 * The texts are looked up twice: `roomcompetition.<slot>.<mode>.<result>` first, then
 * `roomcompetition.<slot>.<mode>` as a fallback, and a slot with neither hides itself. That is what
 * lets one layout carry every state without a branch per label.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/RoomCompetitionController.as
 */
export class RoomCompetitionController implements IDisposable, IGetImageListener
{
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::INDENT_LEFT
    private static readonly INDENT_LEFT: number = 270;

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::INDENT_RIGHT
    private static readonly INDENT_RIGHT: number = 200;

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::INDENT_TOP
    private static readonly INDENT_TOP: number = 4;

    /** The layout name, passed verbatim to `getXmlWindow()` — no `_xml` suffix. */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::prepare()
    private static readonly WINDOW_LAYOUT: string = 'RoomCompetition';

    /** AS3 builds on layer 1, above the room and below the toolbar's own contexts. */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::prepare()
    private static readonly WINDOW_LAYER: number = 1;

    /** How long the "you will not see this again" panel stays up before the banner closes itself. */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::_hideTimer
    private static readonly HIDE_DELAY: number = 3000;

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::_questEngine
    private _engine: HabboQuestEngine | null;

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::_goalCode
    private _goalCode: string = '';

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::_goalId
    private _goalId: number = 0;

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::_remainingVotes
    private _votesRemaining: number = 0;

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::_submit
    private _isSubmitMode: boolean = false;

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::_dontShowAgain
    private _dontShowAgain: boolean = false;

    /** The last `CompetitionEntrySubmitResult.result`, which `onClose()` reads back. */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::_submitResult
    private _submitResult: number = 0;

    // DEVIATION: AS3 uses a `flash.utils.Timer(3000, 1)` held for the object's lifetime and
    //   `reset()`/`start()`ed per use. A one-shot timer is `setTimeout` here, so what is held is the
    //   handle; `reset()` is the `clearTimeout` in `startHideTimer()` and in `dispose()`.
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::_hideTimer
    private _hideTimer: ReturnType<typeof setTimeout> | null = null;

    /** Pending furni-icon requests: image id → the grid slot that asked for it. */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::_imageRequests
    private _imageRequests: OrderedMap<number, number> = new OrderedMap<number, number>();

    constructor(engine: HabboQuestEngine)
    {
        this._engine = engine;
    }

    /**
     * DEVIATION: none — this really is AS3's `_window == null`, and it reads oddly on purpose. A
     *   controller that has never been shown reports itself disposed, because AS3 builds the window
     *   lazily in `prepare()` and has nothing else to test. Nothing in this port reads it (the one
     *   consumer, `HabboQuestEngine`, holds the instance directly), so keeping AS3's answer is free;
     *   swapping in a `_disposed` flag would be a silent behavioural change to an `IDisposable`.
     */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::get disposed()
    get disposed(): boolean
    {
        return this._window === null;
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::_goalCode
    get goalCode(): string
    {
        return this._goalCode;
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::_goalId
    get goalId(): number
    {
        return this._goalId;
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::_remainingVotes
    get votesRemaining(): number
    {
        return this._votesRemaining;
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::_submit
    get isSubmitMode(): boolean
    {
        return this._isSubmitMode;
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::set dontShowAgain()
    set dontShowAgain(value: boolean)
    {
        this._dontShowAgain = value;
    }

    /**
     * Vote mode. `resultCode === 1` means the viewer has a talent track to open instead of a
     * participant list, which is the only thing the info line's target depends on here.
     */
    // DEVIATION: AS3 wires the action button to `onVote()`, which sends the room vote, and shows it
    //   while votes remain; the RPG fork removed room voting (plan decision 4: competitions stay,
    //   only the vote goes), so the button stays hidden in vote mode.
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onCompetitionVotingInfo()
    onCompetitionVotingInfo(parser: CompetitionVotingInfoMessageEventParser): void
    {
        this._votesRemaining = parser.votesRemaining;

        const isVotingAllowed = parser.isVotingAllowedForUser;
        const resultCode = parser.resultCode;

        this.refreshContent(parser.goalId, false, parser.goalCode, resultCode.toString());
        this.setInfoRegionProc(resultCode === 1 ? this.onTalents : this.onSeeParticipants);

        const actionButton = this.getActionButton();

        if(actionButton !== null) actionButton.visible = false;

        const buttonInfo = this.getButtonInfoText();

        if(buttonInfo !== null) buttonInfo.visible = isVotingAllowed;
    }

    /**
     * Submit mode. The result code is the whole state machine:
     *
     * | result | info line links to | action button |
     * |--------|--------------------|---------------|
     * | 0      | hotel view         | close         |
     * | 1      | hotel view         | submit        |
     * | 2      | nothing            | confirm       |
     * | 3      | the catalog page   | hidden; the required-furni grid shows instead |
     * | 4      | nothing            | hidden        |
     * | 5      | nothing            | open navigator |
     * | 6      | hotel view         | accept        |
     *
     * `result === 5` on the way in is AS3's early return — a *different* 5 from the button case
     * below it, because that branch is reached through `_submitResult`, which this method sets
     * only after the guard.
     */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onCompetitionEntrySubmitResult()
    onCompetitionEntrySubmitResult(parser: CompetitionEntrySubmitResultMessageEventParser): void
    {
        if(parser.result === 5) return;

        this.refreshContent(parser.goalId, true, parser.goalCode, `${parser.result}`);

        this._submitResult = parser.result;

        const actionButton = this.getActionButton();

        if(actionButton === null) return;

        switch(this._submitResult)
        {
            case 2:
                this.setInfoRegionProc(null);
                actionButton.procedure = this.onConfirm;
                break;
            case 6:
                this.setInfoRegionProc(this.onGoToHotelView);
                actionButton.procedure = this.onAccept;
                break;
            case 1:
                this.setInfoRegionProc(this.onGoToHotelView);
                actionButton.procedure = this.onSubmit;
                break;
            case 3:
                this.setInfoRegionProc(this.onCatalogLink);
                actionButton.visible = false;
                this.refreshRequiredFurnis(parser);

                {
                    const grid = this.getRequiredFurnisWindow();
                    if(grid !== null) grid.visible = true;
                }
                break;
            case 0:
                this.setInfoRegionProc(this.onGoToHotelView);
                actionButton.procedure = this.onClose;
                break;
            case 4:
                this.setInfoRegionProc(null);
                actionButton.procedure = null;
                actionButton.visible = false;
                break;
            case 5:
                this.setInfoRegionProc(null);
                actionButton.procedure = this.onOpenNavigator;
                actionButton.visible = true;
                break;
        }
    }

    /**
     * Builds the window if it does not exist, relabels every slot and shows it.
     *
     * The `dont_show_again_container` / `normal_container` pair is a two-page banner in one layout:
     * every refresh puts it back on the normal page.
     */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::refreshContent()
    refreshContent(goalId: number, submit: boolean, goalCode: string, resultKey: string): void
    {
        this._goalId = goalId;
        this._goalCode = goalCode;
        this._isSubmitMode = submit;

        this.prepare();

        if(this._window === null) return;

        this.setTexts(submit ? 'submit' : 'vote', resultKey);

        const actionButton = this.getActionButton();

        if(actionButton !== null) actionButton.visible = true;

        this.setPromoImage();
        this.showAndPositionWindow();

        const grid = this.getRequiredFurnisWindow();

        if(grid !== null) grid.visible = false;

        const dontShow = this._window.findChildByName('dont_show_again_container');
        const normal = this._window.findChildByName('normal_container');

        if(dontShow !== null) dontShow.visible = false;
        if(normal !== null) normal.visible = true;
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onRoomExit()
    onRoomExit(): void
    {
        this.close();
    }

    /**
     * Entering a room asks the server what this room's competition state is — unless the viewer has
     * dismissed the banner, or the new-identity flow is holding the UI back.
     */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onRoomEnter()
    onRoomEnter(owner: boolean): void
    {
        this.close();

        if(this._engine === null) return;

        const uiAllowed = this._engine.getInteger('new.identity', 0) === 0
            || !this._engine.getBoolean('new.identity.hide.ui');

        if(!this._dontShowAgain && uiAllowed)
        {
            this._isSubmitMode = owner;
            this._engine.send(new RoomCompetitionInitMessageComposer());
        }
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::sendRoomCompetitionInit()
    sendRoomCompetitionInit(): void
    {
        this._engine?.send(new RoomCompetitionInitMessageComposer());
    }

    /**
     * Furniture moved, or the room settings were saved: in submit mode the server has to re-judge
     * whether the room still qualifies, so the banner asks again with `confirmAction = 0`.
     */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onContextChanged()
    onContextChanged(): void
    {
        if(this._window !== null && this._window.visible && this._isSubmitMode)
        {
            this._engine?.send(new SubmitRoomToCompetitionMessageComposer(this._goalCode, 0));
        }
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::imageReady()
    imageReady(id: number, data: ImageBitmap | null): void
    {
        const slot = this._imageRequests.getValue(id);

        if(slot === null) return;

        this.setRequiredFurniImage(slot, data);
        this._imageRequests.remove(id);
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::imageFailed()
    imageFailed(_id: number): void
    {
    }

    /**
     * A localisation slot, with AS3's two-key lookup: `<base>.<suffix>` then bare `<base>`, and if
     * neither resolves the slot is hidden rather than left showing the layout's placeholder text.
     */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::setText()
    private setText(target: IWindow | null, base: string, suffix: string): void
    {
        if(target === null) return;

        const localization = this._engine?.localization ?? null;

        if(localization === null) return;

        let key = `${base}.${suffix}`;
        let text = localization.getLocalization(key, '');

        if(text === '')
        {
            key = base;
            text = localization.getLocalization(key, '');
        }

        if(text === '')
        {
            target.visible = false;
            return;
        }

        target.visible = true;
        localization.registerParameter(key, 'competition_name', this.getCompetitionName());
        localization.registerParameter(key, 'votes', `${this._votesRemaining}`);
        target.caption = `\${${key}}`;
    }

    /** The info line is only clickable when it has somewhere to go — param flag 1 is "mouse". */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::setInfoRegionProc()
    private setInfoRegionProc(procedure: ((event: WindowEvent, window: IWindow) => void) | null): void
    {
        const region = this.getInfoRegion();

        if(region === null) return;

        region.procedure = procedure;
        region.setParamFlag(1, procedure !== null);
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::setPromoImage()
    private setPromoImage(): void
    {
        const vote = this.getVoteImage();
        const submit = this.getSubmitImage();

        if(vote !== null) vote.visible = !this._isSubmitMode;
        if(submit !== null) submit.visible = this._isSubmitMode;
    }

    /**
     * The banner is a full-width strip inset from both sides: 270px in from the left (clear of the
     * navigator) and 200px from the right, 4px down. Every number is AS3's.
     */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::showAndPositionWindow()
    private showAndPositionWindow(): void
    {
        if(this._window === null) return;

        this._window.visible = true;

        const desktop = this._window.desktop;

        if(desktop !== null)
        {
            this._window.x = RoomCompetitionController.INDENT_LEFT;
            this._window.y = RoomCompetitionController.INDENT_TOP;
            this._window.width = desktop.rectangle.width
                - RoomCompetitionController.INDENT_LEFT
                - RoomCompetitionController.INDENT_RIGHT;
        }

        this._window.activate();
    }

    /**
     * Result 3 — "your room is missing things". Each entry is `<type>*<extra>`, the extra half
     * optional, and the tick is shown for the ones the room already has.
     */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::refreshRequiredFurnis()
    private refreshRequiredFurnis(parser: CompetitionEntrySubmitResultMessageEventParser): void
    {
        const required = parser.requiredFurnis;
        const roomEngine = this._engine?.roomEngine ?? null;

        if(required === null || roomEngine === null) return;

        for(let i = 0; i < required.length; i++)
        {
            const entry = required[i];
            const slot = this.getRequiredFurniWindow(i + 1);

            if(slot === null) continue;

            if(entry === null || entry === undefined)
            {
                slot.visible = false;
                continue;
            }

            const parts = entry.split('*');
            const type = parts[0];
            const extra = parts.length > 1 ? parts[1] : '';

            slot.visible = true;

            const tick = slot.findChildByName('tick_icon');

            if(tick !== null) tick.visible = !parser.isMissing(entry);

            const image = roomEngine.getGenericRoomObjectImage(
                type,
                extra,
                new Vector3d(180, 0, 0),
                1,
                this
            );

            if(image.id !== 0) this._imageRequests.add(image.id, i);

            this.setRequiredFurniImage(i, image.data);
        }
    }

    /**
     * Centres the icon in its slot rather than scaling it: a furni icon is whatever size the
     * renderer produced, and the grid cell is a fixed 32x31.
     *
     * DEVIATION: AS3 allocates a `BitmapData` of the target's size and `copyPixels()` into it. The
     *   port draws into an `OffscreenCanvas` and transfers an `ImageBitmap`, which is what
     *   `IBitmapWrapperWindow.bitmap` takes.
     */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::setRequiredFurniImage()
    private setRequiredFurniImage(index: number, data: ImageBitmap | null): void
    {
        if(data === null) return;

        const slot = this.getRequiredFurniWindow(index + 1);

        if(slot === null) return;

        const icon = slot.findChildByName('furni_icon') as unknown as IBitmapWrapperWindow | null;

        if(icon === null) return;

        const width = Math.max(1, Math.floor(icon.width));
        const height = Math.max(1, Math.floor(icon.height));
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext('2d');

        if(context === null) return;

        context.drawImage(data, (width - data.width) / 2, (height - data.height) / 2);

        icon.bitmap = canvas.transferToImageBitmap();
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::getCompetitionName()
    private getCompetitionName(): string
    {
        const key = `roomcompetition.${this._goalCode}.name`;

        return this._engine?.localization?.getLocalization(key, key) ?? key;
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::setTexts()
    private setTexts(mode: string, resultKey: string): void
    {
        this.setText(this.getCaption(), `roomcompetition.caption.${mode}`, resultKey);
        this.setText(this.getInfoText(), `roomcompetition.info.${mode}`, resultKey);
        this.setText(this.getActionButton(), `roomcompetition.button.${mode}`, resultKey);
        this.setText(this.getButtonInfoText(), `roomcompetition.buttoninfo.${mode}`, resultKey);

        this.onResize();
    }

    /** The info line sits under whatever height the caption wrapped to, plus 5px. */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onResize()
    private onResize(): void
    {
        const caption = this.getCaption();
        const region = this.getInfoRegion();

        if(caption === null || region === null) return;

        region.y = caption.y + caption.textHeight + 5;
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::close()
    private close(): void
    {
        if(this._window !== null) this._window.visible = false;

        this._goalCode = '';
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::prepare()
    private prepare(): void
    {
        if(this._window !== null) return;

        const engine = this._engine;

        if(engine === null) return;

        this._window = engine.getXmlWindow(
            RoomCompetitionController.WINDOW_LAYOUT,
            RoomCompetitionController.WINDOW_LAYER
        ) as IWindowContainer | null;

        if(this._window === null)
        {
            log.warn(`Layout ${RoomCompetitionController.WINDOW_LAYOUT} did not build`);
            return;
        }

        const close = this._window.findChildByName('close_region');

        if(close !== null) close.procedure = this.onClose;

        const dontShow = this._window.findChildByName('dont_show_again_region');

        if(dontShow !== null) dontShow.procedure = this.onDontShowAgain;

        engine.windowManager
            ?.getWindowContext(RoomCompetitionController.WINDOW_LAYER)
            ?.getDesktopWindow()
            ?.addEventListener(WindowEvent.WE_RESIZED, this.onDesktopResized);
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onCatalogLink()
    private onCatalogLink = (event: WindowEvent): void =>
    {
        if(event.type !== WindowMouseEvent.CLICK) return;

        const page = this._engine?.getProperty(`competition.${this._goalCode}.catalogPage`) ?? '';

        this._engine?.catalog?.openCatalogPage(page);
    };

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onOpenNavigator()
    private onOpenNavigator = (event: WindowEvent): void =>
    {
        if(event.type !== WindowMouseEvent.CLICK) return;

        this._engine?.navigator?.open();
    };

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onGoToHotelView()
    private onGoToHotelView = (event: WindowEvent): void =>
    {
        if(event.type !== WindowMouseEvent.CLICK) return;

        const toolbarEvent = new HabboToolbarEvent(HabboToolbarEvent.TOOLBAR_CLICK);

        toolbarEvent.iconId = HabboToolbarIconEnum.RECEPTION;

        // AS3 says `toolbar.events.dispatchEvent(e)`; the port's toolbar publishes the same bus as
        // `toolbarEvents`, because `events` is reserved on a DI Component (rule 20-architecture #4).
        this._engine?.toolbar?.toolbarEvents.emit(HabboToolbarEvent.TOOLBAR_CLICK, toolbarEvent);
    };

    /**
     * AS3's is an empty body, and this one is too: the "see the other entries" link has no target
     * in this build. It still has to exist, because `setInfoRegionProc()` passing it rather than
     * `null` is what keeps the info line's mouse flag on and its cursor a hand.
     */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onSeeParticipants()
    private onSeeParticipants = (_event: WindowEvent): void =>
    {
    };

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onTalents()
    private onTalents = (event: WindowEvent): void =>
    {
        if(event.type !== WindowMouseEvent.CLICK) return;

        const engine = this._engine;

        if(engine === null) return;

        const track = engine.sessionDataManager?.currentTalentTrack ?? '';

        engine.tracking?.trackTalentTrackOpen(track, 'roomcompetition');
        engine.send(new GetTalentTrackMessageComposer(track));
    };

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onAccept()
    private onAccept = (event: WindowEvent): void =>
    {
        if(event.type !== WindowMouseEvent.CLICK) return;

        this._engine?.send(new SubmitRoomToCompetitionMessageComposer(this._goalCode, 1));
    };

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onSubmit()
    private onSubmit = (event: WindowEvent): void =>
    {
        if(event.type !== WindowMouseEvent.CLICK) return;

        this._engine?.send(new SubmitRoomToCompetitionMessageComposer(this._goalCode, 2));
    };

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onConfirm()
    private onConfirm = (event: WindowEvent): void =>
    {
        if(event.type !== WindowMouseEvent.CLICK) return;

        this._engine?.send(new SubmitRoomToCompetitionMessageComposer(this._goalCode, 3));
    };

    /**
     * Closing does not close: it flips to the "you can turn this off" page and starts a 3s timer,
     * which is the only way the viewer is ever offered the opt-out. The exception is a submit-mode
     * banner whose result is 0 — nothing was asked of the viewer there, so it just goes away.
     */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onClose()
    private onClose = (event: WindowEvent): void =>
    {
        if(event.type !== WindowMouseEvent.CLICK) return;

        if(this._isSubmitMode && this._submitResult === 0)
        {
            this.close();
            return;
        }

        if(this._window === null) return;

        const key = `roomcompetition.dontshowagain.info.${this._isSubmitMode ? 'submit' : 'vote'}`;
        const info = this._window.findChildByName('dont_show_info_txt');

        if(info !== null)
        {
            info.caption = this._engine?.localization?.getLocalization(key, key) ?? key;
        }

        const dontShow = this._window.findChildByName('dont_show_again_container');
        const normal = this._window.findChildByName('normal_container');

        if(dontShow !== null) dontShow.visible = true;
        if(normal !== null) normal.visible = false;

        this.startHideTimer();
    };

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onDontShowAgain()
    private onDontShowAgain = (event: WindowEvent): void =>
    {
        if(event.type !== WindowMouseEvent.CLICK) return;

        this._dontShowAgain = true;
        this.close();
    };

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onDesktopResized()
    private onDesktopResized = (_event: WindowEvent): void =>
    {
        if(this._window !== null && this._window.visible) this.onResize();
    };

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::onHideTimer()
    private startHideTimer(): void
    {
        if(this._hideTimer !== null) clearTimeout(this._hideTimer);

        this._hideTimer = setTimeout(() =>
        {
            this._hideTimer = null;
            this.close();
        }, RoomCompetitionController.HIDE_DELAY);
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::getInfoRegion()
    private getInfoRegion(): IWindow | null
    {
        return this._window?.findChildByName('info_region') ?? null;
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::getInfoText()
    private getInfoText(): IWindow | null
    {
        return this._window?.findChildByName('info_txt') ?? null;
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::getButtonInfoText()
    private getButtonInfoText(): IWindow | null
    {
        return this._window?.findChildByName('button_info_txt') ?? null;
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::getActionButton()
    private getActionButton(): IWindow | null
    {
        return this._window?.findChildByName('action_button') ?? null;
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::getCaption()
    private getCaption(): ITextWindow | null
    {
        return (this._window?.findChildByName('caption_txt') ?? null) as unknown as ITextWindow | null;
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::getRequiredFurnisWindow()
    private getRequiredFurnisWindow(): IWindow | null
    {
        return this._window?.findChildByName('required_furnis_itemgrid') ?? null;
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::getVoteImage()
    private getVoteImage(): IWindow | null
    {
        return this._window?.findChildByName('vote_image') ?? null;
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::getSubmitImage()
    private getSubmitImage(): IWindow | null
    {
        return this._window?.findChildByName('submit_image') ?? null;
    }

    /**
     * Slot `n` of the required-furni grid, growing the grid by cloning slot 0 until it exists.
     *
     * The layout ships exactly one `furni_container`; everything past the first entry is a clone of
     * it, which is why the template must never be removed.
     */
    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::getRequiredFurniWindow()
    private getRequiredFurniWindow(oneBasedIndex: number): IWindowContainer | null
    {
        const grid = this.getRequiredFurnisWindow() as unknown as IItemGridWindow | null;

        if(grid === null) return null;

        const template = grid.getGridItemAt(0);

        if(template === null) return null;

        const missing = oneBasedIndex - grid.numGridItems;

        for(let i = 0; i < missing; i++)
        {
            grid.addGridItem(template.clone());
        }

        return grid.getGridItemAt(oneBasedIndex - 1) as IWindowContainer | null;
    }

    // AS3: .../src/com/sulake/habbo/quest/RoomCompetitionController.as::dispose()
    dispose(): void
    {
        this._engine = null;

        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
        }

        if(this._hideTimer !== null)
        {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }

        this._imageRequests.dispose();
    }
}
