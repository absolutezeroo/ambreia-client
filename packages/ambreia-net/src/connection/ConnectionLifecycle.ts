import {EventEmitter} from 'eventemitter3';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('core.communication.ConnectionLifecycle');

/**
 * The one state of the connection, where six booleans across three classes used to say it:
 * `idle` before any connect, `connecting` while a socket opens (the port loop stays here),
 * `handshaking` from open to authenticated, `ready` once the server accepted the ticket,
 * `reconnecting` while a lost session is being brought back (the attempt counts), `closed` when
 * the peer or the client ended it on purpose, `failed` when no attempt is left.
 */
export type ConnectionState = 'idle' | 'connecting' | 'handshaking' | 'ready' | 'reconnecting' | 'closed' | 'failed';

const TRANSITIONS: Readonly<Record<ConnectionState, readonly ConnectionState[]>> = {
    idle: ['connecting'],
    connecting: ['connecting', 'handshaking', 'closed', 'failed'],
    handshaking: ['ready', 'reconnecting', 'closed', 'failed'],
    ready: ['reconnecting', 'closed', 'failed'],
    reconnecting: ['reconnecting', 'handshaking', 'closed', 'failed'],
    closed: ['connecting'],
    failed: ['connecting']
};

/** How a lost session is brought back: how many times, and how long before each attempt. */
export interface IReconnectPolicy
{
    readonly maxAttempts: number;
    /** The pause before attempt `attempt` (1-based), in ms. */
    delayMs(attempt: number): number;
}

/** 1 s, 2 s, 4 s… up to 30 s, each spread over ±50 % so a hotel's clients do not come back as one wave. */
export const DEFAULT_RECONNECT_POLICY: IReconnectPolicy = {
    maxAttempts: 6,
    delayMs: (attempt: number): number => Math.round(Math.min(30_000, 1_000 * 2 ** Math.max(0, attempt - 1)) * (0.5 + Math.random()))
};

export interface IConnectionLifecycleEvents
{
    /** Every transition: from, to, and what the host said about it. */
    change: [ConnectionState, ConnectionState, string | null];
    /** The session the server knew is gone (ready → anything): every session's state is stale and is forgotten. */
    reset: [ConnectionState];
}

export class ConnectionLifecycle extends EventEmitter<IConnectionLifecycleEvents>
{
    private _state: ConnectionState = 'idle';
    private _detail: string | null = null;
    private _attempt = 0;

    public get state(): ConnectionState
    {
        return this._state;
    }

    public get detail(): string | null
    {
        return this._detail;
    }

    /** The reconnect attempt under way, 0 outside a reconnect. */
    public get attempt(): number
    {
        return this._attempt;
    }

    public set attempt(value: number)
    {
        this._attempt = value;
    }

    /** Whether `next` may follow the current state (the table above). */
    public allows(next: ConnectionState): boolean
    {
        return TRANSITIONS[this._state].includes(next);
    }

    /**
     * Moves to `next`; a move the table refuses is logged and ignored (false). The same state again
     * only updates the detail, except `reconnecting`, re-entered once per attempt.
     */
    public to(next: ConnectionState, detail: string | null = null): boolean
    {
        const from = this._state;

        if(from === next && next !== 'reconnecting')
        {
            this._detail = detail;

            return true;
        }

        if(!this.allows(next))
        {
            log.warn(`Connection cannot go from ${from} to ${next}${detail ? ` (${detail})` : ''}`);

            return false;
        }

        this._state = next;
        this._detail = detail;

        if(next === 'ready') this._attempt = 0;

        log.debug(`Connection ${from} → ${next}${detail ? ` (${detail})` : ''}`);
        this.emit('change', from, next, detail);

        if(from === 'ready') this.emit('reset', next);

        return true;
    }

    public describe(): {state: ConnectionState; detail: string | null; attempt: number}
    {
        return {state: this._state, detail: this._detail, attempt: this._attempt};
    }
}
