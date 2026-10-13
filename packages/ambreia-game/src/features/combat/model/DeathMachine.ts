import type {DeathState} from '../ICombat';

/**
 * Alive, or KO on the spot (spec §3.1): counting down to the auto-release, or waiting for a
 * resurrection, with an offer pending or not. Only the server stands the player up: the model
 * calls `standUp()` when his vitals come back with health, never on a click.
 */
export class DeathMachine
{
    private _state: DeathState = {kind: 'alive'};

    get state(): DeathState
    {
        return this._state;
    }

    /** RpgDeath: `respawnSeconds` to the auto-release; 0 when the player already chose to wait. */
    ko(respawnSeconds: number, now: number): void
    {
        this._state = {kind: 'ko', autoReleaseAt: respawnSeconds > 0 ? now + respawnSeconds * 1000 : null, waiting: respawnSeconds === 0, offer: null};
    }

    wait(): void
    {
        if(this._state.kind === 'ko') this._state = {...this._state, waiting: true, autoReleaseAt: null};
    }

    /** The newest offer replaces the pending one; nothing for the living. */
    offer(offer: {casterObjectId: number; healthPercent: number; expiresMs: number}, now: number): void
    {
        if(this._state.kind !== 'ko') return;

        this._state = {...this._state, offer: {casterObjectId: offer.casterObjectId, healthPercent: offer.healthPercent, expiresAt: now + offer.expiresMs}};
    }

    decline(): void
    {
        if(this._state.kind === 'ko') this._state = {...this._state, offer: null};
    }

    /** True when it was a change: the views show the ko leaving. */
    standUp(): boolean
    {
        if(this._state.kind === 'alive') return false;

        this._state = {kind: 'alive'};

        return true;
    }

    reset(): void
    {
        this._state = {kind: 'alive'};
    }
}
