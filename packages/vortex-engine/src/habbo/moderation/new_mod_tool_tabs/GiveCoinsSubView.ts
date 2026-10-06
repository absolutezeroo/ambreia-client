/**
 * GiveCoinsSubView — the new mod tool's "give coins" panel.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/moderation/new_mod_tool_tabs/_SafeCls_3550.as
 *
 * Derived name — `_SafeCls_3550`; named after `NewModerationTool.giveCoinsSubView`.
 *
 * **No coins are given; you get a drum solo instead.** Donating resets the amount to 1, disables
 * the button, and plays 68 stock sounds 250ms apart — purchase chimes, pixel chimes and a cuckoo
 * clock — a little over 17 seconds. Halfway through, a notification asks whether this counts as music. When
 * the last sound has played the button re-enables and tool 3 is marked complete.
 *
 * The volume is clamped into 0.4..0.6 for the duration so the sequence is neither inaudible nor
 * painful, and restored afterwards — but only if nothing else moved it in the meantime, which is
 * what the equality test on the way out is for.
 */
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IIconButtonWindow} from '@core/window/components/IIconButtonWindow';
import type {ITextFieldWindow} from '@core/window/components/ITextFieldWindow';
import type {NewModerationTool} from '../NewModerationTool';
import {NewModToolSubView} from './NewModToolSubView';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';

export class GiveCoinsSubView extends NewModToolSubView
{
    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::PLAY_SOUND_DELAY
    private static readonly PLAY_SOUND_DELAY: number = 250;

    /** The lower and upper volume clamps AS3 applies inline in `playAllSounds()`. */
    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::playAllSounds()
    private static readonly MIN_VOLUME: number = 0.4;

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::playAllSounds()
    private static readonly MAX_VOLUME: number = 0.6;

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::PLAY_SOUNDS
    private static readonly PLAY_SOUNDS: string[] = [
        'HBST_purchase', 'HBST_purchase', 'HBST_purchase', 'HBST_purchase', 'HBST_purchase',
        'HBST_purchase', 'HBST_purchase', 'HBST_purchase', 'HBST_purchase', 'HBST_pixels',
        'HBST_message_received', 'HBST_purchase', 'HBST_purchase', 'HBST_purchase', 'HBST_purchase',
        'HBST_pixels', 'HBST_pixels', 'HBST_pixels', 'HBST_pixels', 'HBST_pixels', 'HBST_purchase',
        'HBST_purchase', 'HBST_purchase', 'FURNITURE_cuckoo_clock', 'FURNITURE_cuckoo_clock',
        'FURNITURE_cuckoo_clock', 'FURNITURE_cuckoo_clock', 'HBST_message_received',
        'HBST_message_received', 'HBST_message_received', 'HBST_purchase', 'HBST_purchase',
        'HBST_purchase', 'HBST_purchase', 'HBST_purchase', 'HBST_purchase', 'HBST_purchase',
        'HBST_purchase', 'HBST_purchase', 'HBST_purchase', 'HBST_purchase', 'HBST_purchase',
        'HBST_purchase', 'HBST_pixels', 'HBST_message_received', 'HBST_purchase', 'HBST_purchase',
        'HBST_purchase', 'HBST_purchase', 'HBST_pixels', 'HBST_pixels', 'HBST_pixels', 'HBST_pixels',
        'HBST_pixels', 'HBST_purchase', 'HBST_purchase', 'HBST_purchase', 'FURNITURE_cuckoo_clock',
        'FURNITURE_cuckoo_clock', 'FURNITURE_cuckoo_clock', 'FURNITURE_cuckoo_clock',
        'HBST_message_received', 'HBST_message_received', 'HBST_message_received', 'HBST_purchase',
        'HBST_purchase', 'HBST_purchase', 'HBST_purchase'
    ];

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::_originalVolume
    private _originalVolume: number = 0;

    /**
     * TS-only: AS3 leaves its `setTimeout()` handles unowned, so a panel disposed mid-sequence goes
     * on firing into a null tool. They are tracked here and cleared in `dispose()`.
     */
    // TS-only: no AS3 counterpart; see the note above.
    private _timeouts: ReturnType<typeof setTimeout>[] = [];

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::_SafeCls_3550()
    constructor(tool: NewModerationTool, window: IWindowContainer)
    {
        super(tool, window);

        (this.plusButton as unknown as IWindow | null)?.addEventListener(WindowMouseEvent.CLICK, this.onPlusButtonClick);
        (this.minusButton as unknown as IWindow | null)?.addEventListener(WindowMouseEvent.CLICK, this.onMinusButtonClick);
        this.donateCoinsButton?.addEventListener(WindowMouseEvent.CLICK, this.onDonateCoinsClick);
    }

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::onDonateCoinsClick()
    private onDonateCoinsClick = (): void =>
    {
        this.amount = 1;

        this.playAllSounds();

        this.donateCoinsButton?.disable();
    };

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::playAllSounds()
    private playAllSounds(): void
    {
        const soundManager = this.tool.soundManager;

        this._originalVolume = soundManager?.genericVolume ?? 0;

        if(soundManager !== null && soundManager !== undefined)
        {
            if(this._originalVolume < GiveCoinsSubView.MIN_VOLUME)
            {
                soundManager.genericVolume = GiveCoinsSubView.MIN_VOLUME;
            }
            else if(this._originalVolume > GiveCoinsSubView.MAX_VOLUME)
            {
                soundManager.genericVolume = GiveCoinsSubView.MAX_VOLUME;
            }
        }

        for(let index = 0; index < GiveCoinsSubView.PLAY_SOUNDS.length; index++)
        {
            const name = GiveCoinsSubView.PLAY_SOUNDS[index];

            this._timeouts.push(
                setTimeout(() => this.playSound(name), index * GiveCoinsSubView.PLAY_SOUND_DELAY)
            );
        }

        this._timeouts.push(setTimeout(
            this.halfWay, GiveCoinsSubView.PLAY_SOUNDS.length * GiveCoinsSubView.PLAY_SOUND_DELAY / 2
        ));
        this._timeouts.push(setTimeout(
            this.soundsFinished, GiveCoinsSubView.PLAY_SOUNDS.length * GiveCoinsSubView.PLAY_SOUND_DELAY
        ));
    }

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::playSound()
    private playSound(name: string): void
    {
        this.tool?.soundManager?.playSound(name);
    }

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::halfWay()
    private halfWay = (): void =>
    {
        this.tool?.notifications?.addItem('${generic.is_this_trax}', 'soundmachine');
    };

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::soundsFinished()
    private soundsFinished = (): void =>
    {
        this.donateCoinsButton?.enable();

        this.tool?.setToolCompletion(3);

        const soundManager = this.tool?.soundManager ?? null;

        if(soundManager !== null && soundManager.genericVolume !== this._originalVolume)
        {
            soundManager.genericVolume = this._originalVolume;
        }
    };

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::onOpen()
    public override onOpen(): void
    {
        super.onOpen();

        const input = this.usernameInput;

        if(input !== null) input.text = this.tool.sessionDataManager?.userName ?? '';
    }

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::onPlusButtonClick()
    private onPlusButtonClick = (): void =>
    {
        if(this.amount < 99999) this.amount = this.amount + 1;
    };

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::onMinusButtonClick()
    private onMinusButtonClick = (): void =>
    {
        if(this.amount > 1) this.amount = this.amount - 1;
    };

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::get amount()
    private get amount(): number
    {
        return parseInt(this.amountCoinsInput?.text ?? '', 10);
    }

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::set amount()
    private set amount(value: number)
    {
        const input = this.amountCoinsInput;

        if(input !== null) input.text = '' + value;
    }

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::get usernameInput()
    private get usernameInput(): ITextFieldWindow | null
    {
        return this.window?.findChildByName('give_coins_username_input') as unknown as ITextFieldWindow | null;
    }

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::get amountCoinsInput()
    private get amountCoinsInput(): ITextFieldWindow | null
    {
        return this.window?.findChildByName('amount_coins_input') as unknown as ITextFieldWindow | null;
    }

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::get plusButton()
    private get plusButton(): IIconButtonWindow | null
    {
        return this.window?.findChildByName('plus_btn_coins') as unknown as IIconButtonWindow | null;
    }

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::get minusButton()
    private get minusButton(): IIconButtonWindow | null
    {
        return this.window?.findChildByName('minus_btn_coins') as unknown as IIconButtonWindow | null;
    }

    // AS3: .../new_mod_tool_tabs/_SafeCls_3550.as::get donateCoinsButton()
    private get donateCoinsButton(): IWindow | null
    {
        return this.window?.findChildByName('add_coins_btn') ?? null;
    }

    /** See `_timeouts`: AS3 has no counterpart, because AS3 never cancels its timers. */
    // AS3: .../new_mod_tool_tabs/_SafeCls_2521.as::dispose()
    public override dispose(): void
    {
        if(this.disposed) return;

        for(const handle of this._timeouts) clearTimeout(handle);

        this._timeouts = [];

        super.dispose();
    }
}
