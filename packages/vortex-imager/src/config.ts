/**
 * Runtime configuration, read once from the environment.
 *
 * Only the hotel-shaped values live here. Everything the avatar pipeline needs — where the
 * avatar libraries are, what the figure map is called, which revision is current — is *not*
 * configured: it comes from the hotel's own `external_variables`, exactly as it does in the
 * client. Hard-coding those here is how an imager drifts a build behind the client and starts
 * rendering last month's clothes.
 */
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import type {IAssetPacksSettings} from '@ambreia/common/assets/pack/AssetDirectories';
import {Logger} from '@ambreia/common/utils/Logger';

const HERE = dirname(fileURLToPath(import.meta.url));

export interface IDatabaseConfig
{
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    connectionLimit: number;
}

export interface IImagerConfig
{
    host: string;
    port: number;

    /** Root of the hotel's asset host, e.g. `http://vortex-assets.local`. */
    assetsBaseUrl: string;

    /**
	 * Filesystem path the asset host serves, when the imager runs on the same machine.
	 * Set it and every asset read skips HTTP entirely; leave it unset and the imager
	 * fetches over the network like the client does.
	 */
    assetsRoot: string | null;

    /** Directory holding the embedded avatar XMLs (geometry, part sets, animation, figure). */
    avatarConfigDir: string;

    /**
	 * The client's config.json → `asset-packs`: the families' .ambreia directories and their key. The
	 * same file the client reads, so the imager never renders from other assets than the game.
	 */
    assetPacks: IAssetPacksSettings;

    /** `null` disables username lookups; `?figure=` still works. */
    database: IDatabaseConfig | null;

    /** Rendered images held in memory. */
    cacheMaxEntries: number;

    /** How long a rendered image stays cached, in milliseconds. */
    cacheTtlMs: number;

    /**
	 * Where rendered avatars, badges and furniture are kept on disk, so a restart does not
	 * re-render the hotel. Empty disables it and the service is memory-only.
	 *
	 * Rooms are never written there: their URL does not describe their contents.
	 */
    cacheDir: string | null;

    /**
	 * How long a *room* render stays cached, in milliseconds.
	 *
	 * Its own setting, and much shorter than the others, because a room render is the one
	 * thing here that is not immutable for its URL: an avatar figure or a badge code fully
	 * describes its image, but `?room=7` describes a room whose contents change every time
	 * someone moves a chair, and nothing tells the imager when that happened.
	 */
    roomCacheTtlMs: number;

    /**
	 * Value for `Access-Control-Allow-Origin`. Required, not optional: the client tags avatar
	 * and badge images with `crossOrigin = "anonymous"` (`ImageLoader`, `BadgeImageManager`,
	 * `RoomPicker`), which makes the browser refuse any response without this header. `*` is
	 * the right default — these images are public and no request carries credentials — but it
	 * can be narrowed to the hotel's origin.
	 */
    corsOrigin: string;

    logLevel: string;
}

function env(key: string, fallback: string): string
{
    const value = process.env[key];

    return value === undefined || value === '' ? fallback : value;
}

function envOrNull(key: string): string | null
{
    const value = process.env[key];

    return value === undefined || value === '' ? null : value;
}

function envNumber(key: string, fallback: number): number
{
    const value = process.env[key];

    if(value === undefined || value === '') return fallback;

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Reads `.env` next to the package, if there is one. Values already in the environment win,
 * so a systemd unit or a docker `-e` still overrides the file.
 *
 * Node's own `--env-file` would do this, but it aborts when the file is absent — and the file
 * is optional here, since every setting has a working default.
 */
function loadEnvFile(): void
{
    let contents: string;

    try
    {
        contents = readFileSync(resolve(HERE, '../.env'), 'utf8');
    }
    catch
    {
        return;
    }

    for(const line of contents.split(/\r?\n/))
    {
        const trimmed = line.trim();

        if(trimmed.length === 0 || trimmed.startsWith('#')) continue;

        const separator = trimmed.indexOf('=');

        if(separator <= 0) continue;

        const key = trimmed.slice(0, separator).trim();
        const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '');

        if(process.env[key] === undefined) process.env[key] = value;
    }
}

/**
 * `asset-packs` of the client's config.json (IMAGER_CLIENT_CONFIG, default the client package's own).
 * Without the file, every family is the asset host's default directory and there is no key: the
 * imager still starts, and an encrypted directory says why it cannot be read.
 */
function readAssetPacks(): IAssetPacksSettings
{
    const file = env('IMAGER_CLIENT_CONFIG', resolve(HERE, '../../vortex-client/public/config.json'));
    let text: string;

    try
    {
        text = readFileSync(file, 'utf8');
    }
    catch
    {
        Logger.getLogger('imager.config').warn(`IMAGER_CLIENT_CONFIG: ${file} not found — default asset directories, no key (copy config.example.json and fill asset-packs)`);

        return {};
    }

    return (JSON.parse(text) as {'asset-packs'?: IAssetPacksSettings})['asset-packs'] ?? {};
}

export function loadConfig(): IImagerConfig
{
    loadEnvFile();

    const assetsBaseUrl = env('IMAGER_ASSETS_BASE_URL', 'http://vortex-assets.local').replace(/\/+$/, '');
    const database = envOrNull('IMAGER_DB_DATABASE');

    return {
        host: env('IMAGER_HOST', '0.0.0.0'),
        port: envNumber('IMAGER_PORT', 8081),
        assetsBaseUrl,
        assetsRoot: envOrNull('IMAGER_ASSETS_ROOT'),
        // The client ships these as embedded assets; the imager reads the same files out of
        // the client package so both render against one copy.
        avatarConfigDir: env(
            'IMAGER_AVATAR_CONFIG_DIR',
            resolve(HERE, '../../vortex-client/src/assets/configurations')
        ),
        assetPacks: readAssetPacks(),
        database: database === null
            ? null
            : {
                host: env('IMAGER_DB_HOST', '127.0.0.1'),
                port: envNumber('IMAGER_DB_PORT', 3306),
                // Deliberately not `root`: an unset user should fail to connect, not connect
                // with everything. `tools/grant-readonly.sql` creates this account.
                user: env('IMAGER_DB_USER', 'vortex_imager'),
                password: env('IMAGER_DB_PASSWORD', ''),
                database,
                connectionLimit: envNumber('IMAGER_DB_POOL', 4)
            },
        cacheMaxEntries: envNumber('IMAGER_CACHE_ENTRIES', 2000),
        cacheTtlMs: envNumber('IMAGER_CACHE_TTL_MS', 6 * 60 * 60 * 1000),

        // On by default, next to the package: the whole point of it is that it survives a
        // restart, and a setting nobody turns on never does. `IMAGER_CACHE_DIR=` disables it.
        cacheDir: process.env.IMAGER_CACHE_DIR === '' ? null : env('IMAGER_CACHE_DIR', resolve(HERE, '../cache')),
        roomCacheTtlMs: envNumber('IMAGER_ROOM_CACHE_TTL_MS', 60 * 1000),
        corsOrigin: env('IMAGER_CORS_ORIGIN', '*'),
        logLevel: env('IMAGER_LOG_LEVEL', 'info')
    };
}
