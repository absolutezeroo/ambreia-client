import {Logger, LogLevel} from '@ambreia/common/utils/Logger';

const NAMESPACE = 'core.communication.PacketLogger';

const log = Logger.getLogger(NAMESPACE);

/**
 * Packet tracing for the client's wire layer.
 *
 * This has no AS3 counterpart — the Flash client had no equivalent, and the port needs one because
 * a packet that arrives and is then handled by nobody looks exactly like a packet that never
 * arrived. Server-side logs cannot tell those apart.
 *
 * Off by default. Enable from the browser console, then reproduce:
 *
 *     __packets.on()                  // trace everything
 *     __packets.on('Chat')            // only names containing "Chat" (case-insensitive)
 *     __packets.only('in')            // incoming only ('out', or 'both' to reset)
 *     __packets.off()
 *     __packets.dump()                // the last 200 entries as a table
 *     __packets.unhandled()           // incoming ids that reached no handler
 */
export class PacketLogger
{
    private static readonly HISTORY_LIMIT = 200;

    private static _enabled = false;
    private static _filter: string | null = null;
    private static _direction: 'in' | 'out' | 'both' = 'both';
    private static _history: IPacketRecord[] = [];
    private static _unhandled = new Map<number, {name: string; count: number}>();
    private static _installed = false;

    static get enabled(): boolean
    {
        return PacketLogger._enabled;
    }

    /**
	 * Record an incoming packet.
	 *
	 * @param handlerCount how many message events were registered for this id — 0 is the
	 * interesting case: the packet was decoded and then dropped on the floor.
	 */
    static incoming(id: number, name: string, handlerCount: number): void
    {
        if(handlerCount === 0)
        {
            const entry = PacketLogger._unhandled.get(id) ?? {name, count: 0};

            entry.count++;
            PacketLogger._unhandled.set(id, entry);
        }

        PacketLogger.record({
            at: PacketLogger.now(),
            direction: 'in',
            id,
            name,
            handlers: handlerCount,
        });
    }

    static outgoing(id: number, name: string): void
    {
        PacketLogger.record({
            at: PacketLogger.now(),
            direction: 'out',
            id,
            name,
            handlers: null,
        });
    }

    /**
	 * Expose the console API. Called once at bootstrap; safe to call again.
	 */
    static install(): void
    {
        if(PacketLogger._installed || typeof globalThis === 'undefined') return;

        PacketLogger._installed = true;

        (globalThis as unknown as Record<string, unknown>).__packets = {
            on(filter?: string)
            {
                PacketLogger._enabled = true;
                PacketLogger._filter = filter ?? null;

                // Per-packet lines are TRACE, which is off at every default level — turning tracing
                // on has to raise this one namespace or `__packets.on()` would silently do nothing.
                Logger.setNamespaceLevel(NAMESPACE, LogLevel.TRACE);

                log.info(`Packet tracing ON${filter ? ` (filter: "${filter}")` : ''}, direction: ${PacketLogger._direction}`);
            },
            off()
            {
                PacketLogger._enabled = false;

                log.info('Packet tracing OFF');

                Logger.clearNamespaceLevel(NAMESPACE);
            },
            only(direction: 'in' | 'out' | 'both')
            {
                PacketLogger._direction = direction;

                log.info(`Packet tracing direction: ${direction}`);
            },
            dump()
            {
                return [...PacketLogger._history];
            },
            unhandled()
            {
                return [...PacketLogger._unhandled.entries()]
                    .map(([id, e]) => ({id, name: e.name, count: e.count}))
                    .sort((a, b) => b.count - a.count);
            },
            clear()
            {
                PacketLogger._history = [];
                PacketLogger._unhandled.clear();
            },
        };

        log.info('Packet tracing available: __packets.on() / .only("in") / .dump() / .unhandled()');
    }

    private static now(): number
    {
        return typeof performance !== 'undefined' ? Math.round(performance.now()) : Date.now();
    }

    private static record(entry: IPacketRecord): void
    {
        // The unhandled tally is always kept — it is the thing you want to look at after the fact,
        // and by then it is too late to have turned tracing on.
        PacketLogger._history.push(entry);

        if(PacketLogger._history.length > PacketLogger.HISTORY_LIMIT)
        {
            PacketLogger._history.shift();
        }

        if(!PacketLogger._enabled) return;
        if(PacketLogger._direction !== 'both' && PacketLogger._direction !== entry.direction) return;
        if(PacketLogger._filter && !entry.name.toLowerCase().includes(PacketLogger._filter.toLowerCase())) return;

        const arrow = entry.direction === 'in' ? '<--' : '-->';

        if(entry.direction === 'in' && entry.handlers === 0)
        {
            log.warn(`${arrow} [${entry.id}] ${entry.name} — NO HANDLER (decoded, then dropped)`);

            return;
        }

        const handlers = entry.handlers !== null ? ` (${entry.handlers} handler${entry.handlers === 1 ? '' : 's'})` : '';

        log.trace(`${arrow} [${entry.id}] ${entry.name}${handlers}`);
    }
}

export interface IPacketRecord
{
    at: number;
    direction: 'in' | 'out';
    id: number;
    name: string;
    /** null for outgoing; 0 on an incoming packet means nothing was listening. */
    handlers: number | null;
}
