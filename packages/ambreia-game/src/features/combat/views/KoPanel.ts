import type {DeathChoice} from '@ambreia/protocol/outgoing/rpg/combat/RpgDeathChoiceMessage';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import {buildFrame} from '../../../ui/kit/buildFrame';
import {WindowBits} from '../../../ui/kit/WindowBits';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import {formatDuration} from './deathTimers';
import type {IKoPlayer} from './IKoPlayer';
import type {IKoView} from './IKoView';

/**
 * The KO screen (the owner's vortex_death_xml, M1d §4): the player lying, his level and class, the
 * countdown to the auto-release, and the choices. « Quitter l'instance » is a dungeon's (M4): hidden.
 */
export class KoPanel implements IKoView
{
    private _window: IWindowContainer | null = null;
    private _help = false;

    constructor(private readonly _windows: () => IHabboWindowManager | null, private readonly _bits: WindowBits, private readonly _choose: (choice: DeathChoice) => void) {}

    show(player: IKoPlayer, timerMs: number | null, waiting: boolean): void
    {
        const window = this._window ??= this.frame('vortex_death_xml', this._onEvent);

        if(!window) return;

        const bits = this._bits;

        window.visible = true;
        bits.setVisible(window, false, 'leave_button');
        bits.avatar(window, 'head_image', player.figure, 2, true, true);
        bits.setText(window, 'level_txt', player.level === null ? '' : `${bits.text('vortex.ui.level')} ${player.level}`);
        bits.setText(window, 'class_txt', player.className);
        bits.setText(window, 'respawn_timer', timerMs === null ? '' : bits.text('vortex.death.timer', 'time', formatDuration(timerMs)));
        bits.setText(window, 'death_desc', waiting || this._help ? bits.text('vortex.death.wait_help') : '');

        const wait = window.findChildByName('wait_button');

        if(wait) wait[waiting ? 'disable' : 'enable']();
    }

    /** The window manager comes up with the client, after this feature: built at the first show. */
    private frame(layout: string, procedure: (event: WindowEvent, window: IWindow) => void): IWindowContainer | null
    {
        const windows = this._windows();

        return windows ? buildFrame(windows, layout, procedure) : null;
    }

    hide(): void
    {
        this._help = false;
        if(this._window) this._window.visible = false;
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        if(WindowBits.ancestor(window, 'respawn_button')) this._choose('release');
        else if(WindowBits.ancestor(window, 'wait_button')) this._choose('wait');
        else if(WindowBits.ancestor(window, 'help_button') && this._window)
        {
            this._help = !this._help;
            this._bits.setText(this._window, 'death_desc', this._help ? this._bits.text('vortex.death.wait_help') : '');
        }
    };

    dispose(): void
    {
        this._window?.destroy();
        this._window = null;
    }
}
