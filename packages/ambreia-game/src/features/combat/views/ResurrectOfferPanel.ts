import type {DeathChoice} from '@ambreia/protocol/outgoing/rpg/combat/RpgDeathChoiceMessage';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import {buildFrame} from '../../../ui/kit/buildFrame';
import {WindowBits} from '../../../ui/kit/WindowBits';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import {formatDuration} from './deathTimers';
import type {IOfferCaster} from './IOfferCaster';
import type {IOfferView} from './IOfferView';

/** Between the KO screen and this one when both are open. */
const GAP = 12;

/**
 * The resurrection offer (the owner's vortex_resurrect_xml, M1d §4): the healer, his message, the
 * time left with its bar, accept or refuse. Beside the KO screen, which stays under it.
 */
export class ResurrectOfferPanel implements IOfferView
{
    private _window: IWindowContainer | null = null;

    constructor(private readonly _windows: () => IHabboWindowManager | null, private readonly _bits: WindowBits, private readonly _choose: (choice: DeathChoice) => void) {}

    show(caster: IOfferCaster, _healthPercent: number, leftMs: number, fraction: number): void
    {
        const window = this._window ??= this.build();

        if(!window) return;

        const bits = this._bits;

        window.visible = true;
        bits.avatar(window, 'head_image', caster.figure, 2, true);
        bits.setText(window, 'caster_name', caster.name);
        bits.setText(window, 'caster_level', caster.level === null ? '' : `${bits.text('vortex.ui.level')} ${caster.level}`);
        bits.setText(window, 'message', bits.text('vortex.resurrect.message', 'name', caster.name));
        bits.setText(window, 'expire_txt', bits.text('vortex.resurrect.expires', 'time', formatDuration(leftMs)));

        const bar = window.findChildByName('expire_bar') as IWindowContainer | null;
        const background = bar?.findChildByName('bg');
        const fill = bar?.findChildByName('fill');

        if(background && fill)
        {
            fill.visible = fraction > 0;
            if(fraction > 0) fill.width = Math.max(1, Math.round(background.width * fraction));
        }
    }

    /** The window manager comes up with the client, after this feature: built at the first show. */
    private frame(layout: string, procedure: (event: WindowEvent, window: IWindow) => void): IWindowContainer | null
    {
        const windows = this._windows();

        return windows ? buildFrame(windows, layout, procedure) : null;
    }

    hide(): void
    {
        if(this._window) this._window.visible = false;
    }

    /** Centred, then moved right of the KO screen's place when the desktop has the room. */
    private build(): IWindowContainer | null
    {
        const window = this.frame('vortex_resurrect_xml', this._onEvent);
        const desktop = window?.parent ?? null;

        if(window && desktop && desktop.width > window.width * 2 + GAP * 4) window.x = Math.round(desktop.width / 2 + 190 + GAP);

        return window;
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        if(WindowBits.ancestor(window, 'accept_button')) this._choose('accept');
        else if(WindowBits.ancestor(window, 'refuse_button')) this._choose('decline');
    };

    dispose(): void
    {
        this._window?.destroy();
        this._window = null;
    }
}
