/**
 * Read-only access to the hotel database.
 *
 * Two things the imager cannot derive from the client's assets live here: which figure a
 * username currently wears, and the guild badge part / colour catalogue. Both are the
 * server's data, so both are read from the server's tables rather than mirrored into this
 * repository — a mirrored copy is a copy that goes stale silently.
 *
 * Every statement is a SELECT. The pool is small on purpose: a badge or avatar request does
 * at most one lookup, and everything it reads is cached afterwards.
 */
import {createPool} from 'mysql2/promise';
import type {Pool, RowDataPacket} from 'mysql2/promise';
import {Logger} from '@ambreia/common/utils/Logger';
import type {IDatabaseConfig} from '../config';

const log = Logger.getLogger('imager.db.Database');

export interface IPlayerLook
{
    name: string;
    figure: string;

    /** `M` or `F` — `AvatarGenderType` is stored as 0/1. */
    gender: string;
}

export interface IBadgePartRow
{
    partId: number;
    type: string;
    fileName: string;
    maskFileName: string;
}

/**
 * A room and the model it stands on, joined because neither renders without the other: the
 * model carries the tile heights, the room carries the three decoration ids painted over them.
 */
export interface IRoomRow
{
    id: number;
    name: string;

    /** The raw model string — one character per tile, `x` for a hole. */
    model: string;

    doorX: number;
    doorY: number;

    /** `rooms.paint_floor` / `paint_wall` / `paint_landscape`, opaque ids, never numbers. */
    floorType: string;
    wallType: string;
    landscapeType: string;

    /** `-1` means "derive from the model", which is what the plane parser does with it. */
    wallHeight: number;

    hideWalls: boolean;
}

export interface IRoomItemRow
{
    id: number;

    /** The furnidata id — `furniture_definitions.sprite_id`, not the row id. */
    spriteId: number;

    /** `ProductType`: 0 floor, 1 wall. Everything else is not placeable in a room. */
    productType: number;

    x: number;
    y: number;
    z: number;

    /** Tile rotation, 0–7. */
    direction: number;

    /** Wall items only: the horizontal offset along the wall. */
    wallOffset: number;

    extraData: string | null;
}

export class Database
{
    private _pool: Pool;

    constructor(config: IDatabaseConfig)
    {
        this._pool = createPool({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database,
            connectionLimit: config.connectionLimit,
            waitForConnections: true,
            enableKeepAlive: true
        });
    }

    /**
	 * Resolves a username to the look it is wearing right now.
	 *
	 * Soft-deleted rows are excluded: `players.deleted_at` defaults to a timestamp and is
	 * maintained on update, so it is not a "deleted" flag in the usual sense — only rows the
	 * emulator considers live should answer a lookup.
	 */
    async findPlayerLook(name: string): Promise<IPlayerLook | null>
    {
        const [rows] = await this._pool.query<RowDataPacket[]>(
            'SELECT `name`, `figure`, `gender` FROM `players` WHERE `name` = ? LIMIT 1',
            [name]
        );

        const row = rows[0];

        if(row === undefined) return null;

        return {
            name: String(row.name),
            figure: String(row.figure),
            gender: Number(row.gender) === 1 ? 'F' : 'M'
        };
    }

    /**
	 * Reads a room and its model in one statement.
	 *
	 * `deleted_at` genuinely is a soft-delete flag on `rooms` and on `furniture` — NULL for a
	 * live row, a timestamp for a removed one — unlike on `players`, where it is maintained on
	 * every update and means nothing of the sort (see `findPlayerLook()`'s note). A deleted room
	 * should 404 rather than render its last known state, so it is filtered here and in
	 * {@link findRoomItems}.
	 */
    async findRoom(roomId: number): Promise<IRoomRow | null>
    {
        const [rows] = await this._pool.query<RowDataPacket[]>(
            'SELECT r.`id`, r.`name`, r.`paint_floor`, r.`paint_wall`, r.`paint_landscape`,'
            + ' r.`wall_height`, r.`hide_walls`, m.`model`, m.`door_x`, m.`door_y`'
            + ' FROM `rooms` r'
            + ' JOIN `room_models` m ON m.`id` = r.`model_id`'
            + ' WHERE r.`id` = ? AND r.`deleted_at` IS NULL LIMIT 1',
            [roomId]
        );

        const row = rows[0];

        if(row === undefined) return null;

        return {
            id: Number(row.id),
            name: String(row.name),
            model: String(row.model),
            doorX: Number(row.door_x),
            doorY: Number(row.door_y),

            // The client's own defaults when a room has never been decorated — RoomEngine's
            // DEFAULT_FLOOR_TYPE / DEFAULT_WALL_TYPE / DEFAULT_LANDSCAPE_TYPE. An empty string
            // here is not "no floor", it is a plane with no material, which renders as nothing.
            floorType: nonEmpty(row.paint_floor, '111'),
            wallType: nonEmpty(row.paint_wall, '201'),
            landscapeType: nonEmpty(row.paint_landscape, '1'),
            wallHeight: Number(row.wall_height ?? -1),
            hideWalls: Number(row.hide_walls) === 1
        };
    }

    /**
	 * Every item standing in a room, floor and wall alike.
	 *
	 * Joined to `furniture_definitions` for the sprite id, because `furniture.definition_id` is
	 * a row id and the client keys everything on the furnidata id instead. Ordered by id only
	 * for a stable render; the depth sort that decides what covers what is the geometry's.
	 */
    async findRoomItems(roomId: number): Promise<IRoomItemRow[]>
    {
        const [rows] = await this._pool.query<RowDataPacket[]>(
            'SELECT f.`id`, f.`x`, f.`y`, f.`z`, f.`direction`, f.`wall_offset`, f.`extra_data`,'
            + ' d.`sprite_id`, d.`type`'
            + ' FROM `furniture` f'
            + ' JOIN `furniture_definitions` d ON d.`id` = f.`definition_id`'
            + ' WHERE f.`room_id` = ? AND f.`deleted_at` IS NULL'
            + ' ORDER BY f.`id`',
            [roomId]
        );

        return rows.map((row) => ({
            id: Number(row.id),
            spriteId: Number(row.sprite_id),
            productType: Number(row.type),
            x: Number(row.x),
            y: Number(row.y),
            z: Number(row.z),
            direction: Number(row.direction),
            wallOffset: Number(row.wall_offset),
            extraData: row.extra_data === null ? null : String(row.extra_data)
        }));
    }

    // The badge editor only ever offers enabled parts, so a badge that references a disabled
    // one is a badge the editor could not have produced; it is still rendered, because the
    // code is already stored on the guild and refusing it would blank an existing badge.
    async findBadgeParts(): Promise<IBadgePartRow[]>
    {
        const [rows] = await this._pool.query<RowDataPacket[]>(
            'SELECT `part_id`, `type`, `file_name`, `mask_file_name` FROM `group_badge_parts`'
        );

        return rows.map((row) => ({
            partId: Number(row.part_id),
            type: String(row.type),
            fileName: String(row.file_name ?? ''),
            maskFileName: String(row.mask_file_name ?? '')
        }));
    }

    async findBadgeColors(): Promise<Map<number, string>>
    {
        const [rows] = await this._pool.query<RowDataPacket[]>(
            'SELECT `color_id`, `color_hex` FROM `group_colors`'
        );

        const colors = new Map<number, string>();

        for(const row of rows) colors.set(Number(row.color_id), String(row.color_hex ?? ''));

        return colors;
    }

    async ping(): Promise<boolean>
    {
        try
        {
            await this._pool.query('SELECT 1');

            return true;
        }
        catch (error)
        {
            log.warn('Database ping failed', error);

            return false;
        }
    }

    async dispose(): Promise<void>
    {
        await this._pool.end();
    }
}

/**
 * A never-decorated room stores NULL, an empty string, or `"0"`; all three mean "use the
 * default".
 *
 * `"0"` is the emulator's own column default and not a material anyone can buy — floor and
 * wall ids start in the hundreds and a landscape is a dotted pair like `"4.1"`. It matters
 * because the client renders these rooms from the defaults too: the room-properties message
 * that would carry a paint is not ported, so `RoomEngine.initializeRoom()`'s
 * `DEFAULT_FLOOR_TYPE` / `DEFAULT_WALL_TYPE` / `DEFAULT_LANDSCAPE_TYPE` are what every room in
 * this hotel is actually drawn with. Passing `"0"` through instead would give the imager a
 * different floor from the one the player is standing on.
 */
function nonEmpty(value: unknown, fallback: string): string
{
    const text = value === null || value === undefined ? '' : String(value).trim();

    return text.length > 0 && text !== '0' ? text : fallback;
}
