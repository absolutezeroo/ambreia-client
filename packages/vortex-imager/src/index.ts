/**
 * Entry point.
 *
 * The two-phase start is required, not stylistic: `installGlobals()` has to run before any
 * engine module is evaluated, because the engine's modules capture browser globals at import
 * time. A static import of the render service would be hoisted above the call and the whole
 * pipeline would come up against a Node that has no `OffscreenCanvas`.
 */
import {installGlobals} from './shim/globals';
import {loadConfig} from './config';
import type {IServerDependencies} from './server';

const config = loadConfig();

installGlobals({assetsRoot: config.assetsRoot, assetsBaseUrl: config.assetsBaseUrl});

const {Logger, LogLevel} = await import('@ambreia/common/utils/Logger');
const {AvatarRenderService} = await import('./avatar/AvatarRenderService');
const {BadgeRenderService} = await import('./badge/BadgeRenderService');
const {RoomStack} = await import('./room/RoomStack');
const {RoomRenderService} = await import('./room/RoomRenderService');
const {Database} = await import('./db/Database');
const {RenderCache} = await import('./cache/RenderCache');
const {DiskCache} = await import('./cache/DiskCache');
const {createServer} = await import('./server');

type AvatarService = Awaited<ReturnType<typeof AvatarRenderService.boot>>;
type RoomService = InstanceType<typeof RoomRenderService>;

Logger.setLevel(resolveLogLevel(config.logLevel, LogLevel));

const log = Logger.getLogger('imager.main');

log.info(`Assets: ${config.assetsRoot ?? config.assetsBaseUrl}`);

const database = config.database === null ? null : new Database(config.database);

if(database === null)
{
    log.warn('No database configured — ?user= lookups and guild badges are disabled');
}

// Only the immutable routes get the cache. A room's URL names a room, not its contents. The disk
// tier is attached once the avatar pipeline is up: it is keyed on the hotel's asset build, which
// the avatar configuration names (`flash.client.url`).
const cache = new RenderCache(config.cacheMaxEntries, config.cacheTtlMs);
const roomCache = new RenderCache(config.cacheMaxEntries, config.roomCacheTtlMs);

/**
 * The server listens first and boots the pipelines behind it. Before this the listener waited for
 * the avatar preload: with the asset host down the process answered nothing (not even `/health`)
 * for the 120 s ready timeout, then died on an uncaught rejection — and did so again two minutes
 * after every `pnpm dev` while offline. Now `/health` says which step the boot is at and why it
 * failed, every other route answers 503 until it is done, and a failed boot is retried with a
 * growing pause instead of a restart loop.
 */
const deps: IServerDependencies = {
    config,
    boot: {state: 'starting', reason: 'avatar pipeline', since: Date.now()},
    // Filled by boot(); the server's request gate keeps every render route at 503 until then.
    avatars: null as unknown as AvatarService,
    badges: null,
    rooms: null,
    database,
    cache,
    roomCache,
    diskCache: null
};
const server = createServer(deps);

// A busy port is not a failure here: both dev servers start the imager themselves
// (`tools/vite-plugin-imager.mjs`) and each probes the port first, so two of them started in the
// same second is the one case the probe cannot catch. Whoever got there first is serving the same
// routes — exit quietly rather than dropping a stack in someone's dev terminal.
try
{
    await server.listen({host: config.host, port: config.port});
}
catch (error)
{
    if((error as NodeJS.ErrnoException)?.code !== 'EADDRINUSE') throw error;

    log.info(`Port ${config.port} is already serving an imager — nothing to do`);

    process.exit(0);
}

log.info(`vortex-imager listening on http://${config.host}:${config.port} (booting the pipelines)`);

for(const signal of ['SIGINT', 'SIGTERM'] as const)
{
    process.once(signal, () =>
    {
        void (async (): Promise<void> =>
        {
            log.info(`Received ${signal}, shutting down`);

            await server.close();

            // Before the avatar service, which ends at `Core.dispose()` and takes the DI
            // container the room stack's components live in with it.
            deps.rooms?.dispose();

            if(deps.boot.state === 'ready') await deps.avatars.dispose();

            await database?.dispose();

            process.exit(0);
        })();
    });
}

void bootUntilReady();

/** Boots the pipelines, and tries again after a failure: 10 s, then 20, 40, 60 s between attempts. */
async function bootUntilReady(): Promise<void>
{
    let pauseMs = 10_000;

    for(;;)
    {
        try
        {
            await boot();

            return;
        }
        catch (error)
        {
            const reason = error instanceof Error ? error.message : String(error);

            deps.boot = {state: 'failed', reason, since: Date.now()};
            log.error(`Imager boot failed, retrying in ${pauseMs / 1000} s: ${reason}`);

            await new Promise(resolve => setTimeout(resolve, pauseMs));
            pauseMs = Math.min(60_000, pauseMs * 2);
            deps.boot = {state: 'starting', reason: 'avatar pipeline (retry)', since: Date.now()};
        }
    }
}

async function boot(): Promise<void>
{
    const avatars = await AvatarRenderService.boot(config);

    // The badge part URL is a hotel property, so it comes from the same external_variables the
    // avatar libraries do rather than from this service's own environment.
    const badgePartUrl = avatars.getProperty('image.library.badgepart.url')
        || `${config.assetsBaseUrl}/c_images/Badgeparts/`;

    deps.badges = database === null ? null : new BadgeRenderService(database, badgePartUrl);
    deps.boot = {state: 'starting', reason: 'room pipeline', since: Date.now()};
    deps.rooms = await bootRooms(avatars);

    /**
     * The disk tier is keyed on the hotel's asset build, so a client update leaves the old images
     * behind in a directory nothing reads any more instead of serving them for the rest of time.
     * `flash.client.url` carries that build's folder name, and it is the same property the avatar
     * libraries are downloaded from.
     */
    const disk = config.cacheDir === null
        ? null
        : new DiskCache(config.cacheDir, avatars.getProperty('flash.client.url'));

    if(disk !== null) log.info(`Disk cache: ${disk.root}`);

    cache.attachDisk(disk);
    deps.diskCache = disk;
    deps.avatars = avatars;
    deps.boot = {state: 'ready', reason: null, since: Date.now()};

    log.info('vortex-imager ready');
}

/**
 * The room pipeline is booted after the avatar one and on top of the same core, and a failure
 * to bring it up is not fatal: furnidata may be missing on a hotel that only serves avatars and
 * badges, and losing those two routes as well would be a worse outcome than losing the furni
 * and room ones. The routes answer 503 and say so.
 */
async function bootRooms(avatars: AvatarService): Promise<RoomService | null>
{
    const assetLibrary = avatars.assetLibrary;
    const properties = avatars.properties;
    const directories = avatars.assetDirectories;

    if(assetLibrary === null || properties === null || directories === null)
    {
        log.warn('Avatar core is not available — furniture and room rendering are disabled');

        return null;
    }

    try
    {
        return new RoomRenderService(await RoomStack.boot(assetLibrary, properties, directories));
    }
    catch (error)
    {
        log.error('Room pipeline failed to boot — /habbo-imaging/furniture and /room will answer 503', error);

        return null;
    }
}

function resolveLogLevel(name: string, levels: typeof LogLevel): number
{
    switch(name.toLowerCase())
    {
        case 'trace': return levels.TRACE;
        case 'debug': return levels.DEBUG;
        case 'warn': return levels.WARN;
        case 'error': return levels.ERROR;
        case 'silent': return levels.SILENT;
        default: return levels.INFO;
    }
}
