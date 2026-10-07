/* eslint-disable no-console -- this is the project's designated console sink; everything else logs through Logger.getLogger(), never console directly */

/**
 * Severity levels, ordered. A logger emits a record when its level is `<=` the record's level.
 *
 * `TRACE` is the floor for anything that fires per frame, per packet, per room object or per
 * grid item — it is off even in development, and is what keeps the console readable while
 * leaving the instrumentation in place.
 */
export enum LogLevel
{
    TRACE = 0,
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    SILENT = 5,
}

/** A bound console method, or the shared no-op when the level is disabled. */
export type LogFn = (...args: unknown[]) => void;

/** One emitted record, handed to {@link Logger.onRecord} subscribers. */
export interface ILogRecord
{
    level: LogLevel;
    /** Full dotted logger namespace, e.g. `habbo.room.RoomEngine`. */
    name: string;
    args: unknown[];
    /** `performance.now()` at emission. */
    at: number;
}

const NOOP: LogFn = () => {};

const LEVELS: readonly LogLevel[] = [LogLevel.TRACE, LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];

const LEVEL_NAMES: Readonly<Record<LogLevel, string>> = {
    [LogLevel.TRACE]: 'TRACE',
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.ERROR]: 'ERROR',
    [LogLevel.SILENT]: 'SILENT',
};

const LEVEL_LABELS: Readonly<Record<LogLevel, string>> = {
    [LogLevel.TRACE]: 'TRC',
    [LogLevel.DEBUG]: 'DBG',
    [LogLevel.INFO]: 'INF',
    [LogLevel.WARN]: 'WRN',
    [LogLevel.ERROR]: 'ERR',
    [LogLevel.SILENT]: '---',
};

const LEVEL_COLORS: Readonly<Record<LogLevel, string>> = {
    [LogLevel.TRACE]: '#64748B',
    [LogLevel.DEBUG]: '#7C3AED',
    [LogLevel.INFO]: '#0EA5E9',
    [LogLevel.WARN]: '#F59E0B',
    [LogLevel.ERROR]: '#EF4444',
    [LogLevel.SILENT]: '#64748B',
};

/**
 * Which `console` method backs each level. Mapping onto the native levels (rather than putting
 * everything through `console.log`) is what makes DevTools' own severity filter, the error count
 * badge and `console.trace`-style grouping work on Vortex output.
 */
const CONSOLE_METHODS: Readonly<Record<LogLevel, 'debug' | 'info' | 'warn' | 'error'>> = {
    [LogLevel.TRACE]: 'debug',
    [LogLevel.DEBUG]: 'debug',
    [LogLevel.INFO]: 'info',
    [LogLevel.WARN]: 'warn',
    [LogLevel.ERROR]: 'error',
    [LogLevel.SILENT]: 'debug',
};

/**
 * Namespaced logger for Vortex.
 *
 * ## Namespaces
 *
 * A logger name is a dotted path mirroring the module it lives in — `habbo.room.RoomEngine`,
 * `core.communication.Socket`, `habbo.catalog.widgets.PetPreview`. Levels are resolved by walking
 * that path outwards, so a single override covers a whole subsystem:
 *
 *     __log.set('habbo.room', 'trace')     // RoomEngine, RoomObject, TileObjectMap, ...
 *     __log.set('habbo.room.RoomEngine', 'warn')   // ... except this one
 *
 * ## Zero cost when disabled
 *
 * `debug`/`info`/... are *properties* holding a pre-bound `console` method, not wrapper functions.
 * That has two consequences, both deliberate:
 *
 * - a disabled level is the shared `NOOP`, so the only cost left at the call site is evaluating
 *   the arguments (use {@link isEnabled} to guard an expensive template literal);
 * - because the bound method is invoked directly from the call site, DevTools attributes the line
 *   to the *caller* instead of to this file. Wrapping the console in a function loses that, which
 *   is why neither timestamps nor {@link onRecord} are on by default.
 *
 * ## Configuration
 *
 * Lowest to highest precedence: build environment (DEBUG in dev, WARN in production), the
 * `vortex:log` localStorage key, then the `?log=` query parameter. All three take the same spec:
 *
 *     ?log=info                              // root level
 *     ?log=warn,habbo.room:trace             // root level plus one subsystem
 *     ?log=habbo.catalog:debug,-core.window  // `-ns` silences a subsystem
 */
export class Logger
{
    private static readonly STORAGE_KEY = 'vortex:log';
    private static readonly QUERY_KEY = 'log';

    private static readonly _loggers = new Map<string, Logger>();
    private static readonly _overrides = new Map<string, LogLevel>();
    private static readonly _onceKeys = new Set<string>();

    private static _rootLevel: LogLevel = LogLevel.DEBUG;
    /** What the build environment asked for, before any spec was layered on — `__log.reset()`. */
    private static _buildLevel: LogLevel = LogLevel.DEBUG;
    private static _timestamps = false;
    private static _listener: ((record: ILogRecord) => void) | null = null;
    private static _silentLogger: Logger | null = null;
    private static _installed = false;

    /**
     * Bumped whenever anything that affects a resolved level or a rendered prefix changes. Each
     * logger compares it against its own copy and re-binds lazily, so a level change is O(1)
     * regardless of how many loggers exist.
     */
    private static _generation = 0;

    private readonly _name: string;
    /** Leaf segment, rendered bold; the rest of the path is dimmed. */
    private readonly _leaf: string;
    /** Namespace hue, derived from the root segment so a subsystem reads as one colour. */
    private readonly _hue: number;
    private readonly _sinks: LogFn[] = [];

    private _generation = -1;
    private _level: LogLevel = LogLevel.DEBUG;
    private _forcedSilent = false;

    private constructor(name: string)
    {
        const cut = name.lastIndexOf('.');

        this._name = name;
        this._leaf = cut === -1 ? name : name.slice(cut + 1);
        this._hue = Logger.hue(cut === -1 ? name : name.slice(0, name.indexOf('.')));
    }

    /**
     * Get or create the logger for a dotted namespace.
     *
     * Convention: the module path with the class name as the leaf, e.g.
     * `Logger.getLogger('habbo.navigator.view.NavigatorView')`.
     */
    static getLogger(name: string): Logger
    {
        let logger = Logger._loggers.get(name);

        if(!logger)
        {
            logger = new Logger(name);
            Logger._loggers.set(name, logger);
        }

        return logger;
    }

    /**
     * Apply the build default, then layer the persisted and URL specs on top, and expose the
     * `__log` console API. Call once, as early as possible during startup.
     */
    static configureFromEnvironment(isDev: boolean): void
    {
        // INFO in development, not DEBUG: a subsystem's running commentary is only worth reading
        // when you are working on that subsystem, and `__log.set('habbo.room', 'debug')` is one
        // call away. WARN in production.
        Logger._buildLevel = isDev ? LogLevel.INFO : LogLevel.WARN;
        Logger._rootLevel = Logger._buildLevel;
        Logger._overrides.clear();

        Logger.applySpec(Logger.readStorage(), false);

        try
        {
            const fromUrl = new URLSearchParams(window.location.search).get(Logger.QUERY_KEY);

            if(fromUrl) Logger.applySpec(fromUrl, false);
        }
        catch
        {
            // No `window`/`location` (worker, test runner) — the build default stands.
        }

        Logger.invalidate();
        Logger.install();
        Logger.getLogger('core.utils.Logger').info(`Log level: ${Logger.toSpec()} — \`__log.list()\` for the full map, \`__log.set(ns, level)\` to change it`);
    }

    /** Set the root level, inherited by every namespace without a closer override. */
    static setLevel(level: LogLevel): void
    {
        Logger._rootLevel = level;
        Logger.invalidate();
    }

    /** Override the level for a namespace and everything under it. */
    static setNamespaceLevel(name: string, level: LogLevel): void
    {
        Logger._overrides.set(name, level);
        Logger.invalidate();
    }

    /** Drop a namespace override, falling back to the nearest enclosing one. */
    static clearNamespaceLevel(name: string): void
    {
        Logger._overrides.delete(name);
        Logger.invalidate();
    }

    /** Drop every override, leaving the root level in place. */
    static clearNamespaceLevels(): void
    {
        Logger._overrides.clear();
        Logger.invalidate();
    }

    /** Effective level for a namespace, resolved through its enclosing namespaces. */
    static getLevel(name: string): LogLevel
    {
        for(let cut = name.length; cut > 0; cut = name.lastIndexOf('.', cut - 1))
        {
            const level = Logger._overrides.get(name.slice(0, cut));

            if(level !== undefined) return level;
        }

        return Logger._rootLevel;
    }

    /**
     * Prepend a wall-clock timestamp to every line.
     *
     * Off by default: DevTools already timestamps rows on demand, and a live timestamp cannot be
     * baked into the bound prefix — turning it on falls back to a wrapper function and the console
     * then attributes every line to this file instead of to the real call site.
     */
    static setTimestamps(enabled: boolean): void
    {
        Logger._timestamps = enabled;
        Logger.invalidate();
    }

    /**
     * Mirror every emitted record to `listener` (crash reporting, an in-page console, a test
     * spy). Same caveat as {@link setTimestamps}: a listener forces wrapper mode, which costs
     * DevTools call-site attribution. Pass `null` to detach and go back to bound mode.
     */
    static onRecord(listener: ((record: ILogRecord) => void) | null): void
    {
        Logger._listener = listener;
        Logger.invalidate();
    }

    /**
     * Apply a spec string: comma-separated, each entry either a bare level (sets the root), a
     * `namespace:level` override, or `-namespace` to silence a subtree.
     *
     * @param persist write the spec to localStorage so it survives a reload.
     */
    static applySpec(spec: string | null, persist = true): void
    {
        if(spec)
        {
            for(const raw of spec.split(','))
            {
                const entry = raw.trim();

                if(!entry) continue;

                if(entry.startsWith('-'))
                {
                    Logger._overrides.set(entry.slice(1), LogLevel.SILENT);

                    continue;
                }

                const cut = entry.lastIndexOf(':');
                const bare = Logger.parseLevel(entry);

                if(cut === -1 || bare !== null)
                {
                    if(bare !== null) Logger._rootLevel = bare;

                    continue;
                }

                const level = Logger.parseLevel(entry.slice(cut + 1));

                if(level !== null) Logger._overrides.set(entry.slice(0, cut).trim(), level);
            }
        }

        if(persist) Logger.writeStorage(Logger.toSpec());

        // Unconditional: `persist` decides whether the change survives a reload, never whether it
        // takes effect. Leaving it inside the branch made a non-persisted spec depend on some
        // later call happening to bump the generation first.
        Logger.invalidate();
    }

    /** The current configuration as a spec string, round-trippable through {@link applySpec}. */
    static toSpec(): string
    {
        const parts = [LEVEL_NAMES[Logger._rootLevel].toLowerCase()];

        for(const [name, level] of Logger._overrides)
        {
            parts.push(level === LogLevel.SILENT ? `-${name}` : `${name}:${LEVEL_NAMES[level].toLowerCase()}`);
        }

        return parts.join(',');
    }

    /** Every registered logger with its resolved level — backs `__log.list()`. */
    static describe(): {name: string; level: string}[]
    {
        return [...Logger._loggers.keys()]
            .sort()
            .map(name => ({name, level: LEVEL_NAMES[Logger.getLevel(name)]}));
    }

    /** Parse `"debug"`, `"WARN"`, `"off"`, … into a level, or `null` if it is not one. */
    private static parseLevel(value: string): LogLevel | null
    {
        const key = value.trim().toUpperCase();

        if(key === 'OFF' || key === 'NONE' || key === 'SILENT') return LogLevel.SILENT;
        if(key === 'ALL') return LogLevel.TRACE;

        const level = LogLevel[key as keyof typeof LogLevel];

        return typeof level === 'number' ? level : null;
    }

    private static readStorage(): string | null
    {
        try
        {
            return window.localStorage.getItem(Logger.STORAGE_KEY);
        }
        catch
        {
            return null;
        }
    }

    private static writeStorage(spec: string): void
    {
        try
        {
            window.localStorage.setItem(Logger.STORAGE_KEY, spec);
        }
        catch
        {
            // Storage unavailable (private mode, sandboxed frame) — the change still applies for
            // this session, it just will not survive a reload.
        }
    }

    private static invalidate(): void
    {
        Logger._generation++;
    }

    /** Shared logger pinned to SILENT, returned by {@link once} after the first hit. */
    private static silent(): Logger
    {
        if(!Logger._silentLogger)
        {
            Logger._silentLogger = new Logger('silent');
            Logger._silentLogger._forcedSilent = true;
        }

        return Logger._silentLogger;
    }

    /**
     * Stable hue per root namespace, so `habbo.room.*` always reads as one colour band. The
     * multiplier is an arbitrary odd constant — it only has to scatter adjacent strings.
     */
    private static hue(root: string): number
    {
        let hash = 0;

        for(let i = 0; i < root.length; i++) hash = (hash * 31 + root.charCodeAt(i)) | 0;

        return Math.abs(hash) % 360;
    }

    /** Expose the `__log` console API. Idempotent. */
    private static install(): void
    {
        if(Logger._installed || typeof globalThis === 'undefined') return;

        Logger._installed = true;

        (globalThis as unknown as Record<string, unknown>).__log = {
            /** Every known logger and its resolved level. */
            list()
            {
                console.table(Logger.describe());
            },
            /** Raise or lower the root level: `__log.level('trace')`. */
            level(level: string)
            {
                const parsed = Logger.parseLevel(level);

                if(parsed === null) return `unknown level "${level}"`;

                Logger._rootLevel = parsed;
                Logger.applySpec(null);

                return Logger.toSpec();
            },
            /** Override one subsystem: `__log.set('habbo.room', 'trace')`. */
            set(name: string, level: string)
            {
                const parsed = Logger.parseLevel(level);

                if(parsed === null) return `unknown level "${level}"`;

                Logger._overrides.set(name, parsed);
                Logger.applySpec(null);

                return Logger.toSpec();
            },
            /** Silence everything, then trace one subsystem — the usual bug-hunting entry point. */
            only(name: string, level = 'trace')
            {
                const parsed = Logger.parseLevel(level) ?? LogLevel.TRACE;

                Logger._overrides.clear();
                Logger._rootLevel = LogLevel.WARN;
                Logger._overrides.set(name, parsed);
                Logger.applySpec(null);

                return Logger.toSpec();
            },
            /** Drop every override and go back to the build default. */
            reset()
            {
                Logger._overrides.clear();
                Logger._rootLevel = Logger._buildLevel;
                Logger.applySpec(null);

                return Logger.toSpec();
            },
            /** Prepend wall-clock timestamps (costs DevTools call-site attribution). */
            timestamps(enabled = true)
            {
                Logger.setTimestamps(enabled);

                return enabled;
            },
            /** The current configuration, e.g. to paste into a `?log=` URL. */
            spec()
            {
                return Logger.toSpec();
            },
        };
    }

    /** Full dotted namespace. */
    get name(): string
    {
        return this._name;
    }

    /** Resolved level for this logger. */
    get level(): LogLevel
    {
        if(this._generation !== Logger._generation) this.rebind();

        return this._level;
    }

    /** Per-frame / per-packet / per-item detail. Off even in development. */
    get trace(): LogFn
    {
        return this.sink(LogLevel.TRACE);
    }

    /** Development detail: what a subsystem decided and why. */
    get debug(): LogFn
    {
        return this.sink(LogLevel.DEBUG);
    }

    /** Milestones a developer would want without asking: connected, room entered, assets ready. */
    get info(): LogFn
    {
        return this.sink(LogLevel.INFO);
    }

    /** Something is wrong but the client carries on — unported branch, missing asset, bad data. */
    get warn(): LogFn
    {
        return this.sink(LogLevel.WARN);
    }

    /** Something failed and the user will notice. */
    get error(): LogFn
    {
        return this.sink(LogLevel.ERROR);
    }

    /**
     * Whether a level would emit. Guard an expensive argument with it — the level check inside the
     * sink cannot stop a template literal that was already built at the call site:
     *
     *     if(log.isEnabled(LogLevel.TRACE)) log.trace(`libs: ${libs.map(l => l.name).join(', ')}`);
     */
    isEnabled(level: LogLevel): boolean
    {
        return level >= this.level;
    }

    /** A logger for a sub-scope of this one: `log.child('preload')` → `<name>.preload`. */
    child(suffix: string): Logger
    {
        return Logger.getLogger(`${this._name}.${suffix}`);
    }

    /**
     * Emit at most once per `key`, for warnings raised from a loop or a per-object path:
     *
     *     log.once(`missing-lib:${name}`).warn(`Avatar library not in the figure map: ${name}`);
     *
     * Returns `this` the first time and a silent logger afterwards, so the call site keeps its
     * DevTools attribution.
     */
    once(key: string): Logger
    {
        const full = `${this._name}:${key}`;

        if(Logger._onceKeys.has(full)) return Logger.silent();

        Logger._onceKeys.add(full);

        return this;
    }

    /**
     * Run `body` inside a collapsed console group, or plainly if the level is disabled. For a
     * multi-line summary (a boot report, a parsed manifest) that would otherwise be N loose lines.
     */
    group(level: LogLevel, label: string, body: () => void): void
    {
        if(!this.isEnabled(level))
        {
            return;
        }

        console.groupCollapsed(...this.prefix(level, label));

        try
        {
            body();
        }
        finally
        {
            console.groupEnd();
        }
    }

    private sink(level: LogLevel): LogFn
    {
        if(this._generation !== Logger._generation) this.rebind();

        return this._sinks[level];
    }

    /**
     * Recompute this logger's level and re-bind its sinks. Runs at most once per configuration
     * change, on first use after it.
     */
    private rebind(): void
    {
        this._generation = Logger._generation;
        this._level = this._forcedSilent ? LogLevel.SILENT : Logger.getLevel(this._name);

        for(const level of LEVELS)
        {
            if(level < this._level)
            {
                this._sinks[level] = NOOP;

                continue;
            }

            this._sinks[level] = Logger._timestamps || Logger._listener
                ? this.wrapped(level)
                : console[CONSOLE_METHODS[level]].bind(console, ...this.prefix(level));
        }
    }

    /**
     * Fallback sink for when the prefix cannot be baked in (live timestamp) or a record listener
     * is attached. Costs an extra stack frame, which is what moves DevTools' reported source onto
     * this file — hence bound sinks being the default.
     */
    private wrapped(level: LogLevel): LogFn
    {
        const method = CONSOLE_METHODS[level];

        return (...args: unknown[]): void =>
        {
            Logger._listener?.({level, name: this._name, args, at: performance.now()});

            console[method](...this.prefix(level), ...args);
        };
    }

    /**
     * Build the `%c`-formatted prefix. The style array must line up with the `%c` count exactly —
     * anything passed after it by the caller is appended by the console as ordinary arguments.
     */
    private prefix(level: LogLevel, label?: string): unknown[]
    {
        const parent = this._name.length > this._leaf.length
            ? this._name.slice(0, this._name.length - this._leaf.length)
            : '';

        let format = '';
        const styles: string[] = [];

        if(Logger._timestamps)
        {
            format += '%c';
            styles.push('color:#94A3B8');
            format += `${new Date().toISOString().slice(11, 23)} `;
        }

        format += `%c${LEVEL_LABELS[level]}%c ${parent}%c${this._leaf}%c`;

        styles.push(
            `background:${LEVEL_COLORS[level]};color:#fff;font-weight:600;padding:1px 5px;border-radius:3px`,
            `color:hsl(${this._hue},45%,58%)`,
            `color:hsl(${this._hue},70%,62%);font-weight:600`,
            'color:inherit;font-weight:inherit'
        );

        return label !== undefined ? [`${format} ${label}`, ...styles] : [format, ...styles];
    }
}
