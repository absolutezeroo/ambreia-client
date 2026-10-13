import {platform} from '@ambreia/common/platform/Platform';
import type {DeathChoice} from '@ambreia/protocol/outgoing/rpg/combat/RpgDeathChoiceMessage';
import type {ICombatModel} from '../ICombatModel';
import type {IOffer} from '../IOffer';
import {koTimer, offerTimer} from './deathTimers';
import type {IKoPlayer} from './IKoPlayer';
import type {IKoView} from './IKoView';
import type {IOfferCaster} from './IOfferCaster';
import type {IOfferView} from './IOfferView';
import type {OnceChoice} from './OnceChoice';
import type {Ticker} from '../../../ui/kit/Ticker';

/** How often the countdowns move while the player is KO. */
const TICK_MS = 250;

/**
 * The death screens (M1d §4): the KO screen while the model says KO, the offer beside it while one
 * is pending, both counting down; gone when the server stands the player up. The choices go out
 * once each (OnceChoice); the screens never anticipate the server's answer.
 */
export class DeathScreens
{
    private _ticker: {clear(): void} | null = null;
    private _offer: IOffer | null = null;
    private _offerWholeMs = 0;
    private _wasKo = false;
    private readonly _update = (): void => this.update();

    constructor(
        private readonly _model: ICombatModel,
        private readonly _ko: IKoView,
        private readonly _offerView: IOfferView,
        private readonly _choice: OnceChoice,
        private readonly _player: () => IKoPlayer,
        private readonly _caster: (objectId: number) => IOfferCaster | null,
        private readonly _tick: Ticker
    )
    {
        _model.events.on('self', this._update);
    }

    /** A button of either screen. */
    choose(choice: DeathChoice): void
    {
        this._choice.choose(choice);
    }

    private update(): void
    {
        const death = this._model.self.death;
        const now = platform().now();

        if(death.kind === 'alive')
        {
            this._wasKo = false;
            this._offer = null;
            this._ko.hide();
            this._offerView.hide();
            this.stopTicker();

            return;
        }

        if(!this._wasKo)
        {
            this._wasKo = true;
            this._choice.reset();
        }

        this._ko.show(this._player(), koTimer(death, now), death.waiting);
        this.renderOffer(death.offer, now);
        this._ticker ??= this._tick(this._update, TICK_MS);
    }

    private renderOffer(offer: IOffer | null, now: number): void
    {
        if(offer !== this._offer && offer !== null)
        {
            this._offerWholeMs = Math.max(1, offer.expiresAt - now);
            this._choice.newOffer();
        }

        this._offer = offer;

        const caster = offer ? this._caster(offer.casterObjectId) : null;
        const timer = offer ? offerTimer(offer, now, this._offerWholeMs) : null;

        if(offer && caster && timer && timer.leftMs > 0) this._offerView.show(caster, offer.healthPercent, timer.leftMs, timer.fraction);
        else this._offerView.hide();
    }

    private stopTicker(): void
    {
        this._ticker?.clear();
        this._ticker = null;
    }

    dispose(): void
    {
        this._model.events.off('self', this._update);
        this.stopTicker();
    }
}
