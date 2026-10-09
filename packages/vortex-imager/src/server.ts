/**
 * The HTTP surface.
 *
 * The routes are Habbo's, not invented ones: the client's own configuration already points at
 * them — `habbo.imaging.avatar.url` at `/habbo-imaging/avatarimage`, `group.badge.url` at
 * `/habbo-imaging/badge/%imagerdata%.gif` and `group_logo_url_template` at
 * `/habbo-imaging/badge-fill/…`. Serving anything else would mean editing the hotel config to
 * match the imager, which is backwards.
 *
 * `.gif` is answered with a PNG on purpose. Every stored `group.badge.url` on a Habbo hotel
 * ends in `.gif`, and `BadgeImageManager.getBadgeImageInternal()` rewrites that extension to
 * `.png` before requesting it — but CMS templates and old links still ask for the `.gif`, so
 * both extensions resolve to the same image rather than 404ing half the callers.
 */
import Fastify from 'fastify';
import type {FastifyInstance, FastifyReply} from 'fastify';
import {Logger} from '@ambreia/common/utils/Logger';
import type {IImagerConfig} from './config';
import type {AvatarRenderService} from './avatar/AvatarRenderService';
import type {BadgeRenderService} from './badge/BadgeRenderService';
import type {Database} from './db/Database';
import type {RenderCache} from './cache/RenderCache';
import type {DiskCache} from './cache/DiskCache';
import {AvatarRequestError, avatarCacheKey, parseAvatarRequest} from './avatar/AvatarRequest';
import type {AvatarQuery} from './avatar/AvatarRequest';
import {BadgeCodeError} from './badge/BadgeCode';
import {BadgeRenderError} from './badge/BadgeRenderService';
import type {RoomRenderService} from './room/RoomRenderService';
import type {ImagerQuery} from './room/FurnitureRequest';
import {
    ContentUnavailableError,
    furnitureCacheKey,
    parseFurnitureRequest,
    parsePetRequest,
    parseRoomRequest,
    petCacheKey,
    RoomNotFoundError,
    RoomRequestError,
    roomCacheKey
} from './room/FurnitureRequest';

const log = Logger.getLogger('imager.server');

/** Rendered images are immutable for a given query, so they cache hard downstream. */
const CACHE_CONTROL = 'public, max-age=21600';

export interface IServerDependencies
{
    config: IImagerConfig;
    avatars: AvatarRenderService;
    badges: BadgeRenderService | null;

    /** `null` when the room pipeline failed to boot; its routes then answer 503. */
    rooms: RoomRenderService | null;

    database: Database | null;
    cache: RenderCache;

    /** Rooms cache separately, on a much shorter TTL — see `IImagerConfig.roomCacheTtlMs`. */
    roomCache: RenderCache;

    /** Reported by `/health` so an operator can find the directory; `null` when disabled. */
    diskCache: DiskCache | null;
}

interface IBadgeParams
{
    code: string;
}

interface IAvatarParams
{
    name: string;
}

interface IFurnitureParams
{
    name: string;
}

interface IRoomParams
{
    roomId: string;
}

interface IIdParams
{
    id: string;
}

/**
 * The figure the `/effect/` and `/handitem/` routes hang their part on when the caller gives
 * none. It is never drawn — both routes composite only the part asked for — but the pipeline
 * needs a figure to resolve actions and directions against, and one that renders is cheaper to
 * reason about than a minimal one that might not.
 */
const DEFAULT_FIGURE = 'hd-180-1.ch-210-66.lg-270-82.sh-290-80';

export function createServer(deps: IServerDependencies): FastifyInstance
{
    const app = Fastify({logger: false});

    /**
	 * CORS is not optional here, and it is not about being permissive.
	 *
	 * The client tags every avatar and badge it loads with `crossOrigin = "anonymous"` —
	 * `login/ImageLoader`, `BadgeImageManager`, `onBoardingHcSteps/RoomPicker` — because it
	 * reads those images back off a canvas (`BadgeImageManager.renderSmallScaleBadgeBitmap()`
	 * derives the 50% badge with `toDataURL()`, which throws on a tainted canvas). That flag
	 * makes the browser discard any response without `Access-Control-Allow-Origin`, whatever
	 * its status code, so an imager on a different origin than the client serves nothing at all
	 * without this.
	 *
	 * It is an `onSend` hook rather than per-route so error responses carry it too — otherwise
	 * a 404 reaches the client as an opaque CORS failure instead of a 404.
	 */
    app.addHook('onSend', async (_request, reply) =>
    {
        reply.header('Access-Control-Allow-Origin', deps.config.corsOrigin);

        // Only meaningful when the origin is pinned rather than `*`; a shared cache must not
        // hand one hotel's allowed origin to another.
        if(deps.config.corsOrigin !== '*') reply.header('Vary', 'Origin');
    });

    app.get('/health', async () =>
    {
        return {
            status: 'ok',
            cachedImages: deps.cache.size,
            cachedRooms: deps.roomCache.size,
            diskCache: deps.diskCache === null ? 'disabled' : deps.diskCache.root,
            rooms: deps.rooms === null ? 'disabled' : 'up',
            database: deps.database === null ? 'disabled' : await deps.database.ping() ? 'up' : 'down'
        };
    });

    app.get('/habbo-imaging/avatarimage', async (request, reply) =>
    {
        return renderAvatar(deps, request.query as AvatarQuery, reply);
    });

    // `/habbo-imaging/avatarimage/<name>.png` — the path form CMS templates tend to use.
    app.get<{ Params: IAvatarParams }>('/habbo-imaging/avatarimage/:name', async (request, reply) =>
    {
        const query = {...request.query as AvatarQuery};

        query.user = stripImageExtension(request.params.name);

        return renderAvatar(deps, query, reply);
    });

    /**
	 * An effect's own sprites, without the figure wearing them.
	 *
	 * Only some effects have any: most are an animation the avatar performs, and those answer
	 * 400 saying so rather than a blank image. A figure is still needed — the sprites are
	 * resolved against the avatar's actions and direction — so one is supplied and then not
	 * drawn; `?figure=` overrides it if the effect's sprites depend on the look.
	 */
    app.get<{ Params: IIdParams }>('/habbo-imaging/effect/:id', async (request, reply) =>
    {
        const query = {...request.query as AvatarQuery};

        query.effect = stripImageExtension(request.params.id);
        query.part = 'effect';
        query.figure ??= DEFAULT_FIGURE;

        return renderAvatar(deps, query, reply);
    });

    /**
	 * The object in the avatar's hand, without the avatar. `?drk=1` uses the drinking pose
	 * instead of the carrying one, which some items are only drawn for.
	 */
    app.get<{ Params: IIdParams }>('/habbo-imaging/handitem/:id', async (request, reply) =>
    {
        const query = {...request.query as AvatarQuery};
        const id = stripImageExtension(request.params.id);

        if(readSingle(query, 'drk') === '1') query.drk = id;
        else query.crr = id;

        query.part = 'hand';
        query.figure ??= DEFAULT_FIGURE;

        return renderAvatar(deps, query, reply);
    });

    /**
	 * One clothing item, on nothing.
	 *
	 * The figure string is the whole contract — `ch-255-73`, `hr-165-45.hd-180-1` — and it is
	 * the avatar route underneath, with two differences that are the entire reason this exists:
	 * the result is cropped by default, and no gender ever reaches it.
	 *
	 * That second one is not a convenience. `AvatarRenderManager.createAvatarImage()` runs
	 * `validateAvatarFigure()` *only* when it is given a gender, and that method fills in the
	 * default head, chest and legs for every mandatory set type the figure is missing — so the
	 * same figure renders as a bare shirt without a gender and as a whole dressed avatar with
	 * one. A route that silently did the second when a caller added `gender=M` would be a trap.
	 */
    app.get<{ Params: IAvatarParams }>('/habbo-imaging/clothing/:name', async (request, reply) =>
    {
        const query = {...request.query as AvatarQuery};

        delete query.gender;
        delete query.user;

        query.figure = stripImageExtension(request.params.name);
        query.crop ??= '1';
        query.part = 'clothing';

        return renderAvatar(deps, query, reply);
    });

    /**
	 * A pet, in the isometric view the catalog previews one in.
	 *
	 * `/pet/<name>.png` or `?type=<name|type id>`, plus `palette`, `color`, `head`,
	 * `direction`, `posture`, `gesture` and the usual `size`/`zoom`/`bg`/`frame`. There is no
	 * Habbo route to match — the real hotel has no pet imager at all — so this follows the
	 * furniture one's shape.
	 */
    app.get('/habbo-imaging/pet', async (request, reply) =>
    {
        return renderPet(deps, request.query as ImagerQuery, reply);
    });

    app.get<{ Params: IFurnitureParams }>('/habbo-imaging/pet/:name', async (request, reply) =>
    {
        const query = {...request.query as ImagerQuery};

        query.type = stripImageExtension(request.params.name);

        return renderPet(deps, query, reply);
    });

    app.get<{ Params: IBadgeParams }>('/habbo-imaging/badge/:code', async (request, reply) =>
    {
        return renderBadge(deps, stripImageExtension(request.params.code), request.query as AvatarQuery, reply);
    });

    app.get<{ Params: IBadgeParams }>('/habbo-imaging/badge-fill/:code', async (request, reply) =>
    {
        return renderBadge(deps, stripImageExtension(request.params.code), request.query as AvatarQuery, reply);
    });

    /**
	 * Furniture, in the isometric view the catalog previews it in.
	 *
	 * `?class=<name>` or `?id=<sprite id>`, plus `direction`, `size`, `state`, `frame`,
	 * `color`, `extra` and `bg`. There is no Habbo route to match here — the real hotel serves
	 * furniture as pre-baked images from `images.habbo.com/dcr/hof_furni/`, which is a build
	 * artefact rather than an endpoint — so the path follows the shape of the ones above.
	 */
    app.get('/habbo-imaging/furniture', async (request, reply) =>
    {
        return renderFurniture(deps, request.query as ImagerQuery, reply);
    });

    // Same query as above; answers where the furni's tile centre falls in that image, so an
    // editor can stand the picture on its tile: `{x, y, width, height}` in output pixels.
    app.get('/habbo-imaging/furniture-anchor', async (request, reply) =>
    {
        const rooms = deps.rooms;

        if(rooms === null) return reply.code(503).send({error: 'The room pipeline is not available'});

        try
        {
            const query = parseFurnitureRequest(request.query as ImagerQuery, (q) => rooms.resolveFurniture(q));

            return reply.header('Cache-Control', CACHE_CONTROL).send(await rooms.furnitureAnchor(query));
        }
        catch (error)
        {
            return sendError(reply, error, 'furniture');
        }
    });

    // `/habbo-imaging/furniture/<class>.png` — the path form, for a CMS template that would
    // rather interpolate a name than build a query string.
    app.get<{ Params: IFurnitureParams }>('/habbo-imaging/furniture/:name', async (request, reply) =>
    {
        const query = {...request.query as ImagerQuery};

        query.class = stripImageExtension(request.params.name);

        return renderFurniture(deps, query, reply);
    });

    /**
	 * A whole room: its model's floor and walls, and every item standing on them.
	 *
	 * `?walls=0` drops the walls, `?furni=0` renders the bare model, `size`/`zoom` scale it.
	 * The image is sized to the room rather than to a viewport, so a big room comes back big.
	 */
    app.get<{ Params: IRoomParams }>('/habbo-imaging/room/:roomId', async (request, reply) =>
    {
        return renderRoom(deps, Number(stripImageExtension(request.params.roomId)), request.query as ImagerQuery, reply);
    });

    return app;
}

async function renderFurniture(deps: IServerDependencies, query: ImagerQuery, reply: FastifyReply): Promise<void>
{
    const rooms = deps.rooms;

    if(rooms === null)
    {
        await reply.code(503).send({error: 'The room pipeline is not available'});

        return;
    }

    try
    {
        const request = parseFurnitureRequest(query, (q) => rooms.resolveFurniture(q));

        const {buffer, hit} = await deps.cache.resolve(
            `furni:${furnitureCacheKey(request)}`,
            () => rooms.renderFurniture(request)
        );

        sendImage(reply, buffer, hit);
    }
    catch (error)
    {
        await sendError(reply, error, 'furniture');
    }
}

async function renderPet(deps: IServerDependencies, query: ImagerQuery, reply: FastifyReply): Promise<void>
{
    const rooms = deps.rooms;

    if(rooms === null)
    {
        await reply.code(503).send({error: 'The room pipeline is not available'});

        return;
    }

    try
    {
        const request = parsePetRequest(query, (q) => rooms.resolvePet(q));

        const {buffer, hit} = await deps.cache.resolve(
            `pet:${petCacheKey(request)}`,
            () => rooms.renderPet(request)
        );

        sendImage(reply, buffer, hit);
    }
    catch (error)
    {
        await sendError(reply, error, 'pet');
    }
}

async function renderRoom(
    deps: IServerDependencies,
    roomId: number,
    query: ImagerQuery,
    reply: FastifyReply
): Promise<void>
{
    const rooms = deps.rooms;
    const database = deps.database;

    if(rooms === null || database === null)
    {
        await reply.code(503).send({
            error: 'Rendering a room needs both the room pipeline and a database — set IMAGER_DB_DATABASE'
        });

        return;
    }

    try
    {
        const request = parseRoomRequest(roomId, query);

        const {buffer, hit} = await deps.roomCache.resolve(
            `room:${roomCacheKey(request)}`,
            async () =>
            {
                const room = await database.findRoom(request.roomId);

                if(room === null) throw new RoomNotFoundError(`No room with id ${request.roomId}`);

                const items = request.furniture ? await database.findRoomItems(request.roomId) : [];

                return rooms.renderRoom(request, room, items);
            }
        );

        sendImage(reply, buffer, hit);
    }
    catch (error)
    {
        await sendError(reply, error, 'room');
    }
}

async function renderAvatar(deps: IServerDependencies, query: AvatarQuery, reply: FastifyReply): Promise<void>
{
    try
    {
        const figure = await resolveFigure(deps, query);

        if(figure === null)
        {
            await reply.code(404).send({error: 'No such user, and no figure given'});

            return;
        }

        const request = parseAvatarRequest(figure.figure, {
            // A looked-up player's own gender wins over the query string, which is usually
            // absent for `?user=` calls; an explicit `gender=` still overrides it.
            gender: figure.gender ?? undefined,
            ...query
        });

        const {buffer, hit} = await deps.cache.resolve(
            `avatar:${avatarCacheKey(request)}`,
            () => deps.avatars.render(request)
        );

        sendImage(reply, buffer, hit);
    }
    catch (error)
    {
        await sendError(reply, error, 'avatar');
    }
}

async function renderBadge(
    deps: IServerDependencies,
    code: string,
    query: AvatarQuery,
    reply: FastifyReply
): Promise<void>
{
    if(deps.badges === null)
    {
        await reply.code(503).send({
            error: 'Guild badges need a database connection — set IMAGER_DB_DATABASE'
        });

        return;
    }

    const badges = deps.badges;

    try
    {
        const zoom = readZoom(query);
        const {buffer, hit} = await deps.cache.resolve(
            `badge:${code}:${zoom}`,
            () => badges.render(code, zoom)
        );

        sendImage(reply, buffer, hit);
    }
    catch (error)
    {
        await sendError(reply, error, 'badge');
    }
}

/**
 * Resolves what to render from: an explicit `figure=`, or a `user=` looked up in the hotel
 * database. `figure=` wins, so a caller that already knows the look never pays for a query.
 */
async function resolveFigure(
    deps: IServerDependencies,
    query: AvatarQuery
): Promise<{ figure: string; gender: string | null } | null>
{
    const figure = readSingle(query, 'figure');

    if(figure !== null) return {figure, gender: null};

    const user = readSingle(query, 'user');

    if(user === null || deps.database === null) return null;

    const player = await deps.database.findPlayerLook(user);

    return player === null ? null : {figure: player.figure, gender: player.gender};
}

function sendImage(reply: FastifyReply, buffer: Buffer, cacheHit: boolean): void
{
    reply
        .header('Content-Type', 'image/png')
        .header('Cache-Control', CACHE_CONTROL)
        .header('X-Imager-Cache', cacheHit ? 'hit' : 'miss')
        .send(buffer);
}

async function sendError(reply: FastifyReply, error: unknown, kind: string): Promise<void>
{
    const message = error instanceof Error ? error.message : String(error);

    // Ordered: `RoomNotFoundError` extends `RoomRequestError`, so the 404 case has to be tested
    // before the 400 one or every missing room answers 400.
    if(error instanceof BadgeRenderError || error instanceof RoomNotFoundError)
    {
        await reply.code(404).send({error: message});

        return;
    }

    if(error instanceof ContentUnavailableError)
    {
        await reply.code(503).header('Retry-After', '4').send({error: message});

        return;
    }

    if(error instanceof AvatarRequestError || error instanceof BadgeCodeError || error instanceof RoomRequestError)
    {
        await reply.code(400).send({error: message});

        return;
    }

    log.error(`Failed to render ${kind}: ${message}`, error);

    await reply.code(500).send({error: message});
}

/** `b0101 4.gif` and `b01014.png` and `b01014` are all the same badge. */
function stripImageExtension(value: string): string
{
    return value.replace(/\.(png|gif|jpe?g)$/i, '');
}

function readSingle(query: AvatarQuery, key: string): string | null
{
    const value = query[key];
    const single = Array.isArray(value) ? value[0] : value;

    return single === undefined || single === '' ? null : single;
}

function readZoom(query: AvatarQuery): number
{
    const value = readSingle(query, 'zoom') ?? readSingle(query, 'scale');

    if(value === null) return 1;

    const parsed = Number(value);

    return Number.isFinite(parsed) ? Math.min(8, Math.max(1, Math.trunc(parsed))) : 1;
}
