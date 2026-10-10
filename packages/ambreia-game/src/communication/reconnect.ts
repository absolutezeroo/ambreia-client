import type {ConnectionState, IReconnectPolicy} from '@ambreia/net/connection/ConnectionLifecycle';

/** What the communication manager does with a closed socket. */
export type ClosedVerdict =
    | {kind: 'retry'; attempt: number; delayMs: number}
    | {kind: 'closed'}
    | {kind: 'failed'}
    | {kind: 'ignore'};

export interface IClosedSocket
{
    /** The WebSocket close code; null when no socket could be opened at all. */
    code: number | null;
    /** The client closed it, or the server said why (DisconnectReason): not a loss. */
    expected: boolean;
    state: ConnectionState;
    /** The reconnect attempt that was under way, 0 outside a reconnect. */
    attempt: number;
    policy: IReconnectPolicy;
}

/**
 * A session the server knew (ready) that goes without a close frame is brought back, attempt after
 * attempt, until the policy is spent; a close the peer or the client meant (1000, 1001, a
 * DisconnectReason, disconnect()) is final; a socket that fails before any session is the port
 * loop's business, not this.
 */
export function onSocketClosed(closed: IClosedSocket): ClosedVerdict
{
    const {code, expected, state, attempt, policy} = closed;

    if(expected || code === 1000 || code === 1001) return state === 'idle' ? {kind: 'ignore'} : {kind: 'closed'};

    const lostSession = state === 'ready' || state === 'reconnecting' || (state === 'handshaking' && attempt > 0);

    if(!lostSession) return {kind: 'ignore'};

    const next = attempt + 1;

    if(next > policy.maxAttempts) return {kind: 'failed'};

    return {kind: 'retry', attempt: next, delayMs: policy.delayMs(next)};
}
