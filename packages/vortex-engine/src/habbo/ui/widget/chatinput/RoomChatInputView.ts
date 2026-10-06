/**
 * RoomChatInputView
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as
 *
 * Covers the core input box (create/position/focus/type/send, whisper+shout mode parsing, typing
 * indicator, flood control), the chat style selector, the NUX first-time chat reminder, the room-enter-effect "chat dimmer" overlay, and the
 * help-button hover behaviour.
 *
 * DEVIATION: AS3 drives all six timers with `flash.utils.Timer`; the port uses
 *   `setTimeout`/`setInterval`. A Flash `Timer(delay)` with no repeat count fires repeatedly, so
 *   those become `setInterval` — the ones AS3 constructs as `Timer(delay, 1)` become `setTimeout`.
 *
 * DEVIATION: AS3 also runs the habbicon selector off the `chat_extra_button` (selector, set icon,
 *   unseen counter, hub link and token insertion). The RPG fork removed Habbicons; the button, its
 *   set icon and the `habbicon_menu` container are hidden until Task 10 of the M0 cleanup drops them
 *   from the layout.
 */
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {ITextFieldWindow} from '@core/window/components/ITextFieldWindow';
import type {IRegionWindow} from '@core/window/components/IRegionWindow';
import type {IFocusWindow} from '@core/window/components/IFocusWindow';
import {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {WindowKeyboardEvent} from '@core/window/events/WindowKeyboardEvent';
import {RoomEnterEffect} from '@room/utils/RoomEnterEffect';
import {RoomWidgetChatTypingMessage} from '@habbo/ui/widget/messages/RoomWidgetChatTypingMessage';
import {ChatStyleSelector} from './styleselector/ChatStyleSelector';
import type {RoomChatInputWidget} from './RoomChatInputWidget';

export class RoomChatInputView
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::MARGIN_H
    private static readonly MARGIN_H = 12;

    private static readonly NFT_CHAT_STYLE_MIN = 1000;

    private static readonly NFT_CHAT_STYLE_MAX = 9999;

    private static readonly STATIC_CHAT_STYLE_MAX = 1000;

    private _widget: RoomChatInputWidget | null;
    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::_window
    private _window: IWindowContainer | null = null;
    private _input: (ITextFieldWindow & IFocusWindow) | null = null;
    private _inputBorder: IWindow | null = null;
    private _blockText: IWindow | null = null;
    private _helpHoverRegion: IRegionWindow | null = null;
    private _bubbleCont: IWindowContainer | null = null;
    private _chatStyleMenuContainer: IWindowContainer | null = null;
    private _chatStyleSelector: ChatStyleSelector | null = null;
    private _whisperModeId: string;
    private _shoutModeId: string;
    private _speakModeId: string;
    private _placeholderActive: boolean = false;
    private _lastText: string = '';
    private _isTyping: boolean = false;
    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::_typingStartedSent
    // Whether a "typing" message has actually gone to the server. Obfuscated as `_SafeStr_6063` in
    // both WIN63 trees, name recovered from PRODUCTION. Without it nothing sends the matching
    // "stopped typing" on send, and the bubble stays over the avatar forever.
    private _typingStartedSent: boolean = false;
    private _typingTimer: ReturnType<typeof setTimeout> | null = null;
    private _idleTimer: ReturnType<typeof setTimeout> | null = null;

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::_helpButton
    private _helpButton: IWindow | null = null;

    /** True while the pointer is over the help button itself, as opposed to the input's region. */
    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::_helpButtonHovered
    private _helpButtonHovered: boolean = false;

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::_helpButtonHideTimer
    private _helpButtonHideTimer: ReturnType<typeof setInterval> | null = null;

    /** True for a new player, which is the only case the chat reminder ever runs for. */
    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::_isNoob
    private _isNoob: boolean = false;

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::_nuxIdleTimer
    private _nuxIdleTimer: ReturnType<typeof setTimeout> | null = null;

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::_chatReminderTimer
    private _chatReminderTimer: ReturnType<typeof setInterval> | null = null;

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::_chatReminderTicks
    private _chatReminderTicks: number = 0;

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::_dimmerTimer
    private _dimmerTimer: ReturnType<typeof setTimeout> | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::RoomChatInputView()
    constructor(widget: RoomChatInputWidget)
    {
        this._widget = widget;
        this._whisperModeId = widget.localizations?.getLocalization('widgets.chatinput.mode.whisper', ':tell') ?? ':tell';
        this._shoutModeId = widget.localizations?.getLocalization('widgets.chatinput.mode.shout', ':shout') ?? ':shout';
        this._speakModeId = widget.localizations?.getLocalization('widgets.chatinput.mode.speak', ':speak') ?? ':speak';

        const sessionData = widget.handler.container?.sessionDataManager ?? null;

        this._isNoob = (sessionData?.isNoob ?? false) || (sessionData?.isRealNoob ?? false);

        if(this._isNoob)
        {
            const config = widget.handler.container?.config ?? null;

            // Once shown, never again — the flag is persisted, so this is a once-per-account nudge.
            if(config !== null && config.getProperty('nux.chat.reminder.shown') !== '1')
            {
                const delaySeconds = config.getInteger('nux.noob.chat.reminder.delay', 240);

                this._nuxIdleTimer = setTimeout(this.onNuxIdleTimerComplete, delaySeconds * 1000);
            }
        }

        this.createWindow();
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::get window()
    public get window(): IWindowContainer | null
    {
        return this._window;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::get widget()
    public get widget(): RoomChatInputWidget | null
    {
        return this._widget;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::get chatStyleMenuContainer()
    public get chatStyleMenuContainer(): IWindowContainer | null
    {
        return this._chatStyleMenuContainer;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::dispose()
    public dispose(): void
    {
        this.clearTimers();

        if(this._isNoob)
        {
            this._widget?.windowManager.hideHint();
            this._widget?.windowManager.unregisterHintWindow('nux_chat_reminder');
        }

        if(this._helpButton)
        {
            this._helpButton.removeEventListener(WindowMouseEvent.CLICK, this.onHelpButtonMouseEvent);
            this._helpButton.removeEventListener(WindowMouseEvent.OVER, this.onHelpButtonMouseEvent);
            this._helpButton.removeEventListener(WindowMouseEvent.OUT, this.onHelpButtonMouseEvent);
            this._helpButton = null;
        }

        if(this._helpHoverRegion)
        {
            (this._helpHoverRegion as unknown as IWindow).removeEventListener(
                WindowMouseEvent.OVER, this.onInputHoverRegionMouseEvent);
            (this._helpHoverRegion as unknown as IWindow).removeEventListener(
                WindowMouseEvent.OUT, this.onInputHoverRegionMouseEvent);
            this._helpHoverRegion = null;
        }

        this._chatStyleSelector?.dispose();
        this._chatStyleSelector = null;

        if(this._input)
        {
            this._input.removeEventListener(WindowMouseEvent.DOWN, this.onInputMouseDown);
            this._input.removeEventListener(WindowKeyboardEvent.KEY_DOWN, this.onKeyDown);
            this._input.removeEventListener(WindowEvent.WE_CHANGE, this.onInputChanged);
            this._input = null;
        }

        if(this._window)
        {
            this._window.procedure = null;
        }

        if(this._window?.desktop)
        {
            (this._window.desktop as IWindowContainer).removeChild(this._window);
        }

        this._widget = null;
    }

    private clearTimers(): void
    {
        if(this._typingTimer !== null) { clearTimeout(this._typingTimer); this._typingTimer = null; }
        if(this._idleTimer !== null) { clearTimeout(this._idleTimer); this._idleTimer = null; }
        if(this._nuxIdleTimer !== null) { clearTimeout(this._nuxIdleTimer); this._nuxIdleTimer = null; }
        if(this._dimmerTimer !== null) { clearTimeout(this._dimmerTimer); this._dimmerTimer = null; }

        this.stopChatReminderTimer();
        this.stopHelpButtonHideTimer();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::createWindow()
    private createWindow(): void
    {
        if(!this._widget) return;

        this._window = this._widget.windowManager.buildWidgetLayout('chatinput_window_new') as IWindowContainer | null;

        if(!this._window) return;

        const desktop = this._window.desktop;

        if(desktop)
        {
            this._window.width = desktop.width;
            this._window.height = desktop.height;
        }

        // AS3 sets this right after building the window, before any child lookup or
        // input wiring below - matters because createOrUpdateChatStylesView() (which
        // can fail if the server hasn't enabled/populated custom chat styles) runs
        // dead last, *after* the input's own listeners are already attached; a crash
        // in the optional chat-styles setup must never take basic typing down with it.
        this._window.procedure = this.chatInputWindowProcedure;

        this._bubbleCont = this._window.findChildByName('bubblecont') as IWindowContainer | null;

        if(this._bubbleCont)
        {
            this._bubbleCont.tags.push('room_widget_chatinput');
        }

        this._input = this._bubbleCont?.findChildByName('chat_input') as (ITextFieldWindow & IFocusWindow) | null;
        this._inputBorder = this._bubbleCont?.findChildByName('input_border') ?? null;
        this._blockText = this._bubbleCont?.findChildByName('block_text') ?? null;
        this._helpHoverRegion = this._bubbleCont?.findChildByName('helpbutton_show_hover_region') as IRegionWindow | null;
        this._chatStyleMenuContainer = this._window.findChildByName('chatstyles_menu') as IWindowContainer | null;

        // The RPG fork removed Habbicons: hide the selector's button, its set icon and its menu.
        for(const name of ['habbicon_menu', 'chat_extra_button', 'chat_extra_set_icon'])
        {
            const child = this._window.findChildByName(name);

            if(child) child.visible = false;
        }

        this.updatePosition();

        if(this._input)
        {
            this._input.addEventListener(WindowMouseEvent.DOWN, this.onInputMouseDown);
            this._input.addEventListener(WindowKeyboardEvent.KEY_DOWN, this.onKeyDown);
            this._input.addEventListener(WindowEvent.WE_CHANGE, this.onInputChanged);
            this._input.toolTipDelay = 0;
            this._input.toolTipIsDynamic = true;
            this._placeholderActive = true;
        }

        this._window.addEventListener(WindowEvent.WE_PARENT_RESIZED, this.onParentResized);

        this.createOrUpdateChatStylesView();
        this.createAndAttachDimmerWindow();

        this._helpButton = this._window.findChildByName('helpbutton');

        if(this._helpButton)
        {
            this._helpButton.addEventListener(WindowMouseEvent.CLICK, this.onHelpButtonMouseEvent);
            this._helpButton.addEventListener(WindowMouseEvent.OVER, this.onHelpButtonMouseEvent);
            this._helpButton.addEventListener(WindowMouseEvent.OUT, this.onHelpButtonMouseEvent);
            this._helpButton.visible = false;
        }

        if(this._helpHoverRegion)
        {
            (this._helpHoverRegion as unknown as IWindow).addEventListener(
                WindowMouseEvent.OVER, this.onInputHoverRegionMouseEvent);
            (this._helpHoverRegion as unknown as IWindow).addEventListener(
                WindowMouseEvent.OUT, this.onInputHoverRegionMouseEvent);
        }
    }

    /**
     * Dims the chat bar for as long as the room-enter effect is playing.
     *
     * A plain black window at 30% blend laid over the bar, removed by a timer rather than by the
     * effect itself — the effect exposes only `isRunning()` and `totalRunningTime`, so AS3 sizes
     * one timeout to the whole effect and forgets about it.
     */
    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::createAndAttachDimmerWindow()
    private createAndAttachDimmerWindow(): void
    {
        if(!RoomEnterEffect.isRunning() || !this._bubbleCont || !this._widget) return;

        const dimmer = this._widget.windowManager.createWindow(
            'chat_dimmer', '', 30, 1, 0x80 | 0x0800 | 1,
            {x: 0, y: 0, width: this._bubbleCont.width, height: this._bubbleCont.height}, null, 0
        );

        dimmer.color = 0;
        dimmer.blend = 0.3;

        this._bubbleCont.addChild(dimmer);
        this._bubbleCont.invalidate();

        if(this._dimmerTimer === null)
        {
            this._dimmerTimer = setTimeout(this.onRemoveDimmer, RoomEnterEffect.totalRunningTime);
        }
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::onRemoveDimmer()
    private onRemoveDimmer = (): void =>
    {
        this._dimmerTimer = null;

        const dimmer = this._bubbleCont?.findChildByName('chat_dimmer') ?? null;

        if(dimmer !== null)
        {
            this._bubbleCont?.removeChild(dimmer);
            this._widget?.windowManager.destroy(dimmer);
        }
    };

    /**
     * The "?" button next to the input, which only appears while the pointer is near the bar.
     *
     * Two regions can show it — the button itself and the input's wider hover region — so the
     * hide is deferred on a repeating 400ms timer rather than fired on mouse-out: leaving one
     * region for the other would otherwise flicker it off between the two events.
     */
    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::onHelpButtonMouseEvent()
    private onHelpButtonMouseEvent = (event: WindowMouseEvent): void =>
    {
        if(event.type === WindowMouseEvent.CLICK)
        {
            this._widget?.roomUi?.context?.createLinkEvent('habbopages/chat/commands');
        }

        if(event.type === WindowMouseEvent.OVER)
        {
            if(this._helpButton) this._helpButton.visible = true;

            this._helpButtonHovered = true;
            this.stopHelpButtonHideTimer();
        }
        else if(event.type === WindowMouseEvent.OUT)
        {
            this._helpButtonHovered = false;
            this.startHelpButtonHideTimer();
        }
    };

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::onInputHoverRegionMouseEvent()
    private onInputHoverRegionMouseEvent = (event: WindowMouseEvent): void =>
    {
        if(event.type === WindowMouseEvent.OVER)
        {
            if(this._helpButton) this._helpButton.visible = true;

            this.stopHelpButtonHideTimer();
        }
        else if(event.type === WindowMouseEvent.OUT && !this._helpButtonHovered)
        {
            this.startHelpButtonHideTimer();
        }
    };

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::startHelpButtonHideTimer()
    private startHelpButtonHideTimer(): void
    {
        if(this._helpButtonHideTimer !== null) this.stopHelpButtonHideTimer();

        this._helpButtonHideTimer = setInterval(this.onHelpButtonHideTimer, 400);
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::onHelpButtonHideTimer()
    private onHelpButtonHideTimer = (): void =>
    {
        if(!this._helpButtonHovered && this._helpButton) this._helpButton.visible = false;

        this.stopHelpButtonHideTimer();
    };

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::stopHelpButtonHideTimer()
    private stopHelpButtonHideTimer(): void
    {
        if(this._helpButtonHideTimer === null) return;

        clearInterval(this._helpButtonHideTimer);
        this._helpButtonHideTimer = null;
    }

    /**
     * A new player who has not typed for the configured delay gets the chat bar pointed out:
     * the input's placeholder becomes the reminder text, a hint bubble opens on it, and the whole
     * bar jitters by a pixel ten times.
     */
    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::onNuxIdleTimerComplete()
    private onNuxIdleTimerComplete = (): void =>
    {
        this._nuxIdleTimer = null;
        this.highlightChatInput();
    };

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::highlightChatInput()
    private highlightChatInput(): void
    {
        if(!this._input || !this._widget) return;

        this._input.text = this._widget.localizations?.getLocalization('widgets.chatinput.mode.remind.noobie') ?? '';

        this._chatReminderTicks = 0;
        this._chatReminderTimer = setInterval(this.onChatReminderTimer, 500);

        this._widget.windowManager.registerHintWindow('nux_chat_reminder', this._input as unknown as IWindow);
        this._widget.windowManager.showHint('nux_chat_reminder');
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::onChatReminderTimer()
    private onChatReminderTimer = (): void =>
    {
        const mainWindow = this._widget?.mainWindow ?? null;

        this._chatReminderTicks++;

        if(mainWindow !== null)
        {
            // Odd ticks up, even ticks back down: five round trips, then parked at 0.
            mainWindow.y += (this._chatReminderTicks % 2 !== 0) ? -1 : 1;
        }

        if(this._chatReminderTicks >= 10)
        {
            this.stopChatReminderTimer();

            if(mainWindow !== null) mainWindow.y = 0;

            this.chatBarReminderShown();
        }
    };

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::chatBarReminderShown()
    private chatBarReminderShown(): void
    {
        this._widget?.handler.container?.config?.setProperty('nux.chat.reminder.shown', '1');

        this.stopChatReminderTimer();
        this._widget?.windowManager.hideHint();
        this._widget?.windowManager.unregisterHintWindow('nux_chat_reminder');
    }

    // TS-only: AS3 resets the Timer object in three places; this is that reset, named once.
    private stopChatReminderTimer(): void
    {
        if(this._chatReminderTimer === null) return;

        clearInterval(this._chatReminderTimer);
        this._chatReminderTimer = null;
    }

    private onParentResized = (): void => this.updatePosition();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::updatePosition()
    public updatePosition(): void
    {
        if(!this._window || !this._bubbleCont || !this._widget) return;

        const desktop = this._window.desktop;

        if(!desktop) return;

        this._window.width = desktop.width;
        this._window.height = desktop.height;

        const toolbarWidth = this._widget.getToolBarWidth();
        const friendBarWidth = this._widget.getFriendBarWidth();
        const requiredWidth = this._bubbleCont.width + RoomChatInputView.MARGIN_H;

        let centeredX = desktop.width / 2 - this._bubbleCont.width / 2;
        let leftBound: number;

        if(desktop.width - toolbarWidth - friendBarWidth > requiredWidth)
        {
            leftBound = toolbarWidth + RoomChatInputView.MARGIN_H;
            this._bubbleCont.y = desktop.height - 104;

            if(centeredX + this._bubbleCont.width > desktop.width - friendBarWidth)
            {
                centeredX = 0;
            }
        }
        else
        {
            leftBound = this._widget.getRoomToolsWidth() + RoomChatInputView.MARGIN_H;
            this._bubbleCont.y = desktop.height - 160;
        }

        this._bubbleCont.x = Math.max(centeredX, leftBound);

        this._chatStyleSelector?.alignMenuToSelector();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::hideFloodBlocking()
    public hideFloodBlocking(): void
    {
        if(this._input) this._input.visible = true;
        if(this._blockText) this._blockText.visible = false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::showFloodBlocking()
    public showFloodBlocking(): void
    {
        if(this._input) this._input.visible = false;
        if(this._blockText) this._blockText.visible = true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::updateBlockText()
    public updateBlockText(seconds: number): void
    {
        if(!this._blockText || !this._widget) return;

        this._blockText.caption = this._widget.localizations?.registerParameter('chat.input.alert.flood', 'time', String(seconds)) ?? '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::displaySpecialChatMessage()
    public displaySpecialChatMessage(prefix: string, name: string = ''): void
    {
        if(!this._input) return;

        this._input.enable();
        this._input.selectable = true;
        this._input.text = '';
        this.setInputFieldFocus();
        this._input.text += `${prefix} `;

        if(name.length > 0)
        {
            this._input.text += `${name} `;
        }

        this._input.setSelection(this._input.text.length, this._input.text.length);
        this._lastText = this._input.text;
    }

    private onInputMouseDown = (): void =>
    {
        this.setInputFieldFocus();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::windowKeyEventProcessor()
    private onKeyDown = (event: WindowKeyboardEvent): void =>
    {
        if(!this._input || !this._widget || this._widget.floodBlocked) return;

        this.setInputFieldFocus();

        if(event.charCode === 32)
        {
            this.checkSpecialKeywordForInput();
        }

        if(event.charCode === 13)
        {
            this.sendChatFromInputField(event.shiftKey);
        }

        if(event.charCode === 8)
        {
            const parts = this._input.text.split(' ');

            if(parts[0] === this._whisperModeId && parts.length === 3 && parts[2] === '')
            {
                this._input.text = '';
                this._lastText = '';
            }
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::onInputChanged()
    private onInputChanged = (): void =>
    {
        if(!this._input || !this._widget) return;

        if(this._idleTimer !== null) { clearTimeout(this._idleTimer); this._idleTimer = null; }

        if(this._input.text.length === 0)
        {
            this._isTyping = false;

            if(this._typingTimer !== null) { clearTimeout(this._typingTimer); this._typingTimer = null; }

            this._typingTimer = setTimeout(() => this.onTypingTimerComplete(), 1000);
        }
        else
        {
            if(this._input.text.length > this._lastText.length + 1)
            {
                if(this._widget.allowPaste)
                {
                    this._widget.setLastPasteTime();
                }
                else
                {
                    this._input.text = '';
                }
            }

            this._lastText = this._input.text;

            if(!this._isTyping)
            {
                this._isTyping = true;

                if(this._typingTimer !== null) clearTimeout(this._typingTimer);

                this._typingTimer = setTimeout(() => this.onTypingTimerComplete(), 1000);
            }

            if(this._idleTimer !== null) clearTimeout(this._idleTimer);

            this._idleTimer = setTimeout(() => this.onIdleTimerComplete(), 10000);
        }
    };

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::checkSpecialKeywordForInput()
    private checkSpecialKeywordForInput(): void
    {
        if(!this._input || !this._widget || this._input.text === '') return;

        const text = this._input.text;
        const selectedUserName = this._widget.selectedUserName;

        if(text === this._whisperModeId && selectedUserName.length > 0)
        {
            this._input.text += ` ${selectedUserName}`;
            this._input.setSelection(this._input.text.length, this._input.text.length);
            this._lastText = this._input.text;
        }
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::onIdleTimerComplete()
    private onIdleTimerComplete(): void
    {
        if(this._isTyping) this._typingStartedSent = false;

        this._isTyping = false;
        this.sendTypingMessage();
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::onTypingTimerComplete()
    private onTypingTimerComplete(): void
    {
        if(this._isTyping) this._typingStartedSent = true;

        this.sendTypingMessage();
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::sendTypingMessage()
    private sendTypingMessage(): void
    {
        if(!this._widget || this._widget.floodBlocked) return;

        this._widget.messageListener?.processWidgetMessage(new RoomWidgetChatTypingMessage(this._isTyping));
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::setInputFieldFocus()
    private setInputFieldFocus(): void
    {
        if(!this._input) return;

        if(this._placeholderActive)
        {
            this._input.text = '';
            this._input.textColor = 0;
            this._placeholderActive = false;
            this._lastText = '';
        }

        this._input.focus();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::setInputFieldColor()
    public setInputFieldColor(color: number): void
    {
        if(this._input) this._input.textColor = color;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::sendChatFromInputField()
    private sendChatFromInputField(shiftKey: boolean = false): void
    {
        if(!this._input || !this._widget || this._input.text === '') return;

        let chatType = shiftKey ? 2 : 0;
        let text = this._input.text;
        const parts = text.split(' ');
        let recipientName = '';
        let restoreText = '';

        if(parts[0] === this._whisperModeId)
        {
            chatType = 1;
            recipientName = parts[1] ?? '';
            restoreText = `${this._whisperModeId} ${recipientName} `;
            parts.shift();
            parts.shift();
        }
        else if(parts[0] === this._shoutModeId)
        {
            chatType = 2;
            parts.shift();
        }
        else if(parts[0] === this._speakModeId)
        {
            chatType = 0;
            parts.shift();
        }

        text = parts.join(' ');

        if(this._typingTimer !== null) { clearTimeout(this._typingTimer); this._typingTimer = null; }
        if(this._idleTimer !== null) { clearTimeout(this._idleTimer); this._idleTimer = null; }

        // AS3: styleId defaults to 0 and is only ever read from the selector when custom
        // styles are enabled - selectedStyleId itself can legitimately be -1 ("unchanged
        // since last send"), passed straight through rather than collapsed to 0.
        const styleId = this.customChatStylesEnabled() && this._chatStyleSelector ? this._chatStyleSelector.selectedStyleId : 0;

        this._widget.sendChat(text, chatType, recipientName, styleId);
        this._isTyping = false;

        // The only thing that ever clears the typing bubble: both timers were just cancelled, and
        // the programmatic `text = restoreText` below fires no input event, so nothing else will.
        if(this._typingStartedSent) this.sendTypingMessage();

        this._typingStartedSent = false;

        this._input.text = restoreText;
        this._lastText = restoreText;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::customChatStylesEnabled()
    private customChatStylesEnabled(): boolean
    {
        return this._widget?.roomUi?.getBoolean('custom.chat.styles.enabled') ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::createOrUpdateChatStylesView()
    public createOrUpdateChatStylesView(): void
    {
        const container = this._widget?.handler.container;
        const freeFlowChat = container?.freeFlowChat;
        const chatStyleLibrary = freeFlowChat?.chatStyleLibrary;
        const sessionDataManager = container?.sessionDataManager;

        if(this.customChatStylesEnabled() && container && !container.roomSession.isGameSession && freeFlowChat && chatStyleLibrary && sessionDataManager)
        {
            const disabledIds = (this._widget?.roomUi?.getProperty('disabled.custom.chat.styles') ?? '').split(',');
            const isStaff = sessionDataManager.hasSecurity(4);
            const allowed: number[] = [];

            for(const styleId of chatStyleLibrary.getStyleIds())
            {
                const style = chatStyleLibrary.getStyle(styleId);

                if(!style || style.isSystemStyle) continue;

                if(styleId >= RoomChatInputView.NFT_CHAT_STYLE_MIN && styleId <= RoomChatInputView.NFT_CHAT_STYLE_MAX)
                {
                    if(sessionDataManager.hasNftChatStyle(styleId)) allowed.push(styleId);

                    continue;
                }

                if(styleId < RoomChatInputView.STATIC_CHAT_STYLE_MAX && !style.purchasable)
                {
                    if(style.isStaffOverrideable && isStaff) { allowed.push(styleId); continue; }
                    if(style.isAmbassadorOnly && (isStaff || sessionDataManager.isAmbassador)) { allowed.push(styleId); continue; }
                    if(disabledIds.indexOf(String(styleId)) !== -1) continue;
                    if(style.isHcOnly && sessionDataManager.hasClub) { allowed.push(styleId); continue; }
                    if(!style.isHcOnly && !style.isAmbassadorOnly) { allowed.push(styleId); continue; }
                }

                if(sessionDataManager.hasPurchasableChatStyle(styleId)) allowed.push(styleId);
            }

            this.createChatStyleSelectorMenuItems(allowed);
        }
        else
        {
            const chatInputContainer = this._bubbleCont?.findChildByName('chat_input_container');

            if(chatInputContainer && 'removeListItemAt' in chatInputContainer)
            {
                (chatInputContainer as unknown as IItemListWindow).removeListItemAt(0);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::createChatStyleSelectorMenuItems()
    private createChatStyleSelectorMenuItems(allowedIds: number[]): void
    {
        const container = this._widget?.handler.container;
        const freeFlowChat = container?.freeFlowChat;
        const chatStyleLibrary = freeFlowChat?.chatStyleLibrary;

        if(!chatStyleLibrary) return;

        if(!this._chatStyleSelector)
        {
            const stylesButton = this._bubbleCont?.findChildByName('styles') as IWindowContainer | null;

            this._chatStyleSelector = new ChatStyleSelector(this, stylesButton);
            this._chatStyleSelector.gridColumns = Math.min(Math.max(Math.floor(allowedIds.length / 6) + 1, 4), 6);
        }
        else
        {
            this._chatStyleSelector.clear();
        }

        for(let i = allowedIds.length - 1; i >= 0; i--)
        {
            const styleId = allowedIds[i];
            const style = chatStyleLibrary.getStyle(styleId);

            if(style) this._chatStyleSelector.addItem(styleId, style.selectorPreview);
        }

        this._chatStyleSelector.initSelection();
        this._chatStyleSelector.initFontSizeSelection(freeFlowChat?.chatFontSizeMode ?? 0);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::hideChatStyleSelector()
    public hideChatStyleSelector(): void
    {
        if(this._chatStyleSelector) this._chatStyleSelector.hide();
        else if(this._chatStyleMenuContainer) this._chatStyleMenuContainer.visible = false;
    }

    // DEVIATION: AS3 also hides the habbicon selector; the RPG fork removed Habbicons.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::hideTransientSelectors()
    public hideTransientSelectors(): void
    {
        this.hideChatStyleSelector();
    }

    /**
     * Resets the view for widget-pool reuse (RoomChatInputWidget.release()) rather than tearing it
     * fully down (that's dispose()). `clearTimers()` covers the help-button hide timer AS3 resets
     * here along with the other five.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::release()
    public release(): void
    {
        this.clearTimers();

        this._isTyping = false;
        this._typingStartedSent = false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::chatInputWindowProcedure()
    private chatInputWindowProcedure = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WME_CLICK') this.hideSelectorsIfClickOutside(window);
        else if(event.type === 'WME_CLICK_AWAY') this.hideSelectorsIfClickOutside(event.related);
    };

    // DEVIATION: AS3 also hides the habbicon selector on a click outside it and its button; the RPG
    //   fork removed Habbicons.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::hideSelectorsIfClickOutside()
    private hideSelectorsIfClickOutside(clicked: IWindow | null): void
    {
        if(this._chatStyleSelector?.visible && !this._chatStyleSelector.containsWindow(clicked))
        {
            this._chatStyleSelector.hide();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::getChatInputY()
    public getChatInputY(): number
    {
        const container = this._window?.findChildByName('chat_input_container');

        if(!container) return 0;

        const pos = {x: 0, y: 0};

        container.getGlobalPosition(pos);

        return pos.y;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chatinput/RoomChatInputView.as::getChatWindowElements()
    public getChatWindowElements(): IWindow[]
    {
        const elements: Array<IWindow | null> = [this._bubbleCont, this._input];

        return elements.filter((w): w is IWindow => w !== null);
    }
}
