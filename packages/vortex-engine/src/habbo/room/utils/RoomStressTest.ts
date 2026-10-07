import {Logger} from '@ambreia/common/utils/Logger';
import {FrameTimings} from '@ambreia/common/utils/FrameTimings';
import {FrameTimingsReporter} from '@ambreia/common/utils/FrameTimingsReporter';
import {SelfProfiler} from '@ambreia/common/utils/SelfProfiler';
import type {IProfileResult} from '@ambreia/common/utils/SelfProfiler';
import type {IFrameTimingsRun, IFrameTimingsSample} from '@ambreia/common/utils/FrameTimingsReporter';
import {Vector3d} from '@ambreia/iso/utils/Vector3d';
import type {IVector3d} from '@ambreia/iso/utils/IVector3d';
import type {IRoomEngine} from '../IRoomEngine';
import {RoomObjectCategoryEnum} from '@ambreia/iso/scene/object/RoomObjectCategoryEnum';
import {RoomObjectVariableEnum} from '@ambreia/iso/scene/object/RoomObjectVariableEnum';

const log = Logger.getLogger('habbo.room.utils.RoomStressTest');

/**
 * Synthetic room load, driven entirely client-side, for reading the `:showstats` frame budget
 * under a controlled number of moving avatars.
 *
 * TS-only: no AS3 counterpart — Flash had no such tool, and this exists to answer a question about
 * this port's own rendering, not about the original client's.
 *
 * **Why a client-side one exists at all**, next to loading the real server with bots: a full-stack
 * test cannot tell you *which* stage got slower. Bots on the server move the `net` channel (their
 * status updates), the `room` channel (sprite updates and the per-frame sort) and `pixi` (draw
 * submission) all at once. This one emits no packets whatsoever — it drives `IRoomEngine` directly —
 * so it is the render-only baseline. Run both at the same avatar count and the difference is the
 * cost of the wire.
 *
 * The avatars here take the same code path a server-driven avatar does. `updateRoomObjectUser()`
 * with a target is exactly what `RoomMessageHandler.onWiredUserMove()` calls on a real status
 * update, and the `'mv'` posture is what `setUserMovePosture()` sets alongside it — the port does no
 * client-side pathfinding, it animates the slide it is told about. So no walkable-tile logic is
 * needed for the load to be representative: a bot sliding to an unreachable tile exercises the same
 * visualization, cache and sort work as one walking a legal path.
 *
 * What it does **not** reproduce: server-side pathing, packet volume, and any per-user data the
 * session manager would hold. It is a rendering load, and only that.
 */
export class RoomStressTest
{
    /**
     * First synthetic room index. Server room indices are per-room and small; starting this high
     * keeps a synthetic avatar from ever colliding with a real occupant's index, which would make
     * the stress test dispose somebody's actual avatar on cleanup.
     */
    // TS-only: see the class note.
    private static readonly BASE_ROOM_INDEX: number = 900000;

    /**
     * How long one slide takes, in ms.
     *
     * 500 is `MovingObjectLogic`'s own default for a move message that arrives without a time
     * (`isNaN(animationTime) ? 500 : animationTime`), i.e. what a real server-driven step costs. A
     * short value here would be a *lighter* test, not a heavier one: the avatar would arrive within
     * a frame or two and stand still, skipping the walk-frame cycling and the per-frame
     * interpolation that are the whole point of moving it.
     */
    // TS-only: see the class note.
    private static readonly STEP_ANIMATION_TIME: number = 500;

    /**
     * How often each avatar picks a new destination, in ms.
     *
     * Equal to the slide duration, so a new step is issued exactly as the previous one lands and
     * the avatars never stand still. That is the honest worst case — real occupants idle between
     * walks, so this loads the client harder than a room of the same size would.
     */
    // TS-only: see the class note.
    private static readonly STEP_INTERVAL_MS: number = RoomStressTest.STEP_ANIMATION_TIME;

    /**
     * Smallest half-width, in tiles, of the square the avatars wander inside.
     *
     * A floor rather than the value itself. Fixed at 4 it described a 9×9 square, which is a fair
     * crowd at sixty avatars and nonsense at two thousand — twenty-five of them per tile, every one
     * inside the viewport. That is not a busy room, it is a stack, and it made the run unable to
     * exercise anything that depends on an avatar being off screen.
     */
    // TS-only: see the class note.
    private static readonly WANDER_RADIUS_MIN: number = 4;

    /**
     * Half-width of the wander square for the current run, derived from the avatar count.
     *
     * Sized so the crowd averages roughly one avatar per tile, which is what a full room looks like
     * and what decides how many of them the viewport actually holds. Without this the benchmark
     * measures the worst case for every avatar at once and nothing else — useful for stressing the
     * composition path, useless for anything about visibility.
     */
    // TS-only: see the class note.
    private static _wanderRadius: number = RoomStressTest.WANDER_RADIUS_MIN;

    /**
     * Largest half-width of the wander square, in tiles.
     *
     * A Habbo room is meant to fit the screen, and a player expects to see everyone in it at once —
     * that is the game, not an implementation detail. So a load spread wider than a screenful is not
     * a bigger room, it is a different game: it moves most of the crowd off camera and quietly stops
     * measuring the thing the client actually has to do.
     *
     * 12 is a 25×25 floor, at the large end of what a real room occupies. Density above that ceiling
     * rises with the count, which is the honest consequence of asking for more occupants than a room
     * that size holds.
     */
    // TS-only: see the class note.
    private static readonly WANDER_RADIUS_MAX: number = 12;

    /**
     * Fallback figures, used only when the caller's own figure cannot be read.
     *
     * These were written from memory and **must not be trusted as a measurement baseline**. A run
     * dressed in them reported 71% of body-part compositions resolving to no asset at all — which
     * is exactly what a figure naming clothing ids this hotel does not have would produce, and is
     * indistinguishable in the numbers from a real resolution bug. `resolveFigures()` below reads
     * the player's own figure instead, which is known-good by construction because the server sent
     * it and the client is already drawing it.
     */
    // TS-only: see the class note.
    private static readonly FALLBACK_FIGURES: string[] = [
        'hr-100-61.hd-180-1.ch-210-66.lg-270-82.sh-290-80',
        'hr-828-45.hd-600-2.ch-665-92.lg-716-63.sh-735-68',
        'hr-3163-61.hd-209-10.ch-3030-82.lg-3216-82.sh-3115-92',
        'hr-155-31.hd-190-10.ch-215-66.lg-285-79.sh-290-62',
        'hr-802-37.hd-605-14.ch-635-70.lg-716-82.sh-730-62',
        'hr-3012-45.hd-185-2.ch-255-70.lg-280-64.sh-305-62',
        'hr-115-42.hd-195-19.ch-3030-64.lg-275-73.sh-300-64',
        'hr-681-45.hd-627-10.ch-665-1408.lg-716-1408.sh-908-1408'
    ];

    /** How often a timed run records the frame budget, in ms. */
    // TS-only: see the class note.
    private static readonly SAMPLE_INTERVAL_MS: number = 1000;

    // TS-only: no AS3 counterpart; see the class note.
    private static _engine: IRoomEngine | null = null;
    // TS-only: no AS3 counterpart; see the class note.
    private static _roomId: number = -1;
    // TS-only: no AS3 counterpart; see the class note.
    private static _origin: IVector3d | null = null;
    // TS-only: no AS3 counterpart; see the class note.
    private static _avatarIndices: number[] = [];
    // TS-only: no AS3 counterpart; see the class note.
    private static _furnitureIds: number[] = [];
    // TS-only: no AS3 counterpart; see the class note.
    private static _timer: ReturnType<typeof setInterval> | null = null;
    // TS-only: no AS3 counterpart; see the class note.
    private static _sampleTimer: ReturnType<typeof setInterval> | null = null;
    // TS-only: no AS3 counterpart; see the class note.
    private static _samples: IFrameTimingsSample[] = [];
    // TS-only: no AS3 counterpart; see the class note.
    private static _runStartedAt: number = 0;
    // TS-only: no AS3 counterpart; see the class note.
    private static _runDurationSeconds: number = 0;
    // TS-only: no AS3 counterpart; see the class note.
    private static _profiling: boolean = false;
    // TS-only: no AS3 counterpart; see the class note.
    private static _lastProfile: IProfileResult | null = null;

    /** Whether a stress load is currently running. */
    // TS-only: see the class note.
    public static get active(): boolean
    {
        return RoomStressTest._timer !== null;
    }

    /** The profile of the most recent timed run, if one was recorded. */
    // TS-only: see the class note.
    public static get lastProfile(): IProfileResult | null
    {
        return RoomStressTest._lastProfile;
    }

    /** How many synthetic avatars are currently in the room. */
    // TS-only: see the class note.
    public static get avatarCount(): number
    {
        return RoomStressTest._avatarIndices.length;
    }

    /**
     * Replaces any running load with a fresh one of `avatarCount` avatars and `furnitureCount`
     * pieces of furniture, centred on `origin`.
     *
     * Passing zero for both is the documented way to clear — `stop()` is called first regardless,
     * so re-running with a new count is always safe and never stacks.
     */
    // TS-only: see the class note.
    public static start(
        engine: IRoomEngine,
        roomId: number,
        origin: IVector3d,
        avatarCount: number,
        furnitureCount: number,
        durationSeconds: number = 0
    ): void
    {
        RoomStressTest.stop();

        if(avatarCount <= 0 && furnitureCount <= 0) return;

        RoomStressTest._engine = engine;
        RoomStressTest._roomId = roomId;
        RoomStressTest._origin = new Vector3d(origin.x, origin.y, origin.z);
        RoomStressTest._runDurationSeconds = Math.max(0, durationSeconds);

        // Half the side of a square holding `avatarCount` tiles, so density stays near one per tile —
        // but never wider than a screenful, because a Habbo room fits the screen and everyone in it
        // is meant to be visible. See `WANDER_RADIUS_MAX`.
        RoomStressTest._wanderRadius = Math.min(
            RoomStressTest.WANDER_RADIUS_MAX,
            Math.max(RoomStressTest.WANDER_RADIUS_MIN, Math.ceil(Math.sqrt(avatarCount) / 2))
        );

        RoomStressTest.spawnAvatars(avatarCount);
        RoomStressTest.spawnFurniture(furnitureCount);

        if(RoomStressTest._avatarIndices.length > 0)
        {
            RoomStressTest._timer = setInterval(RoomStressTest.step, RoomStressTest.STEP_INTERVAL_MS);
        }

        log.info(
            `Stress load started: ${RoomStressTest._avatarIndices.length} avatars,`
            + ` ${RoomStressTest._furnitureIds.length} furniture, wander radius ${RoomStressTest._wanderRadius}, around`
            + ` (${origin.x}, ${origin.y}, ${origin.z})`
        );

        if(RoomStressTest._runDurationSeconds > 0)
        {
            RoomStressTest.beginTimedRun();
        }
    }

    /**
     * Starts sampling the frame budget once a second, and stops the run when the duration is up.
     *
     * Sampled as a series rather than once at the end because the two halves of a run mean
     * different things: the first seconds are dominated by cold avatar caches — every figure,
     * direction and walk frame composed for the first time — and only the tail is the steady state
     * that is comparable between runs. A single figure taken at either end would be a different
     * measurement depending on when it was taken, with nothing in the output to say which.
     */
    // TS-only: see the class note.
    private static beginTimedRun(): void
    {
        RoomStressTest._samples = [];
        RoomStressTest._runStartedAt = performance.now();

        // Profiles itself for the length of the run. Unavailable outside a document served with
        // `Document-Policy: js-profiling`, in which case the run is recorded without one rather
        // than refusing to start.
        RoomStressTest._profiling = SelfProfiler.start();

        RoomStressTest._sampleTimer = setInterval(() =>
        {
            const snapshot = FrameTimings.snapshot();

            RoomStressTest._samples.push({
                atMs: Math.round(performance.now() - RoomStressTest._runStartedAt),
                heapMb: snapshot.heapMb,
                frames: snapshot.frames,
                intervalFrames: snapshot.intervalFrames,
                intervalMs: snapshot.intervalMs,
                fps: snapshot.fps,
                frameIntervalMs: snapshot.frameIntervalMs,
                channels: snapshot.channels,
                counters: snapshot.counters
            });

            const elapsedSeconds = (performance.now() - RoomStressTest._runStartedAt) / 1000;

            if(elapsedSeconds >= RoomStressTest._runDurationSeconds)
            {
                RoomStressTest.finishTimedRun();
            }
        }, RoomStressTest.SAMPLE_INTERVAL_MS);
    }

    /**
     * Ships the collected samples, then clears the load.
     *
     * The run is captured into locals before `stop()` runs, because `stop()` resets every field it
     * reads — reporting afterwards off the class state would post an empty run.
     */
    // TS-only: see the class note.
    private static finishTimedRun(): void
    {
        const run: IFrameTimingsRun = {
            label: `${RoomStressTest._avatarIndices.length}av`,
            avatars: RoomStressTest._avatarIndices.length,
            furniture: RoomStressTest._furnitureIds.length,
            durationSeconds: RoomStressTest._runDurationSeconds,
            samples: RoomStressTest._samples
        };

        const profiling = RoomStressTest._profiling;

        RoomStressTest.stop();

        log.info(`Stress run finished: ${run.samples.length} samples over ${run.durationSeconds}s`);

        // The profile is attached to the run before it is written, so a recorded run carries both
        // what the frame cost and which functions spent it — the two halves that were previously in
        // separate files and had to be lined up by hand.
        void (async (): Promise<void> =>
        {
            if(profiling)
            {
                const profile = await SelfProfiler.stop();

                if(profile !== null)
                {
                    run.profile = profile;
                    RoomStressTest._lastProfile = profile;
                }
            }

            await FrameTimingsReporter.report(run);
        })();
    }

    /** Removes every synthetic object and stops the wander timer. Safe to call when not running. */
    // TS-only: see the class note.
    public static stop(): void
    {
        if(RoomStressTest._timer !== null)
        {
            clearInterval(RoomStressTest._timer);
            RoomStressTest._timer = null;
        }

        if(RoomStressTest._sampleTimer !== null)
        {
            clearInterval(RoomStressTest._sampleTimer);
            RoomStressTest._sampleTimer = null;
        }

        const engine = RoomStressTest._engine;

        let refused = 0;

        if(engine !== null)
        {
            for(const roomIndex of RoomStressTest._avatarIndices)
            {
                if(!engine.disposeObjectUser(RoomStressTest._roomId, roomIndex)) refused++;
            }

            for(const id of RoomStressTest._furnitureIds)
            {
                engine.disposeObjectFurniture(RoomStressTest._roomId, id);
            }

            // Counted rather than assumed. Two back-to-back runs of the same command showed the
            // second starting with roughly twice the compositions per frame at the same avatar
            // count — which is what leftover avatars would look like, and is a far simpler
            // explanation than the memory-pressure story. If disposal refuses, the room keeps
            // filling up and every later measurement is of a bigger room than it claims.
            const remaining = engine.getObjectsByCategory(RoomObjectCategoryEnum.OBJECT_CATEGORY_USER).length;

            log.info(
                `Stress cleanup: ${RoomStressTest._avatarIndices.length} avatars asked to dispose,`
                + ` ${refused} refused, ${remaining} user objects left in the room`
            );
        }

        const removed = RoomStressTest._avatarIndices.length + RoomStressTest._furnitureIds.length;

        RoomStressTest._avatarIndices = [];
        RoomStressTest._furnitureIds = [];
        RoomStressTest._engine = null;
        RoomStressTest._roomId = -1;
        RoomStressTest._origin = null;
        RoomStressTest._samples = [];
        RoomStressTest._runStartedAt = 0;
        RoomStressTest._runDurationSeconds = 0;

        if(removed > 0)
        {
            log.info(`Stress load cleared: ${removed} objects removed`);
        }
    }

    /**
     * The figures to dress the synthetic avatars in, preferring real ones already in the room.
     *
     * Every figure standing in the room came from the server and is being drawn right now, so its
     * clothing ids are known to exist in this hotel's asset set. An invented figure is not, and the
     * difference is not visible in a frame-budget run: a part whose asset cannot be resolved simply
     * composes to nothing, which reads as expensive cache-missing work rather than as a broken
     * input. A 60-avatar run on the hard-coded list spent 71% of its compositions that way.
     *
     * Reusing a handful of real figures does mean synthetic avatars share cached body parts, which
     * *understates* cache pressure compared with sixty distinct outfits. That is the honest
     * direction to be wrong in — it cannot manufacture a cost that is not there.
     */
    // TS-only: see the class note.
    private static resolveFigures(engine: IRoomEngine): string[]
    {
        const figures: string[] = [];

        for(const object of engine.getObjectsByCategory(RoomObjectCategoryEnum.OBJECT_CATEGORY_USER))
        {
            const figure = object.getModel()?.getString(RoomObjectVariableEnum.AVATAR_FIGURE) ?? '';

            if(figure.length > 0 && !figures.includes(figure))
            {
                figures.push(figure);
            }
        }

        if(figures.length > 0) return figures;

        log.warn(
            'No real figure could be read from the room — falling back to the hard-coded list.'
            + ' Treat any resolution figures from this run as suspect'
        );

        return RoomStressTest.FALLBACK_FIGURES;
    }

    // TS-only: see the class note.
    private static spawnAvatars(count: number): void
    {
        const engine = RoomStressTest._engine;
        const origin = RoomStressTest._origin;

        if(engine === null || origin === null || count <= 0) return;

        const figures = RoomStressTest.resolveFigures(engine);

        for(let i = 0; i < count; i++)
        {
            const roomIndex = RoomStressTest.BASE_ROOM_INDEX + i;
            const location = RoomStressTest.wanderTarget(origin);
            const direction = new Vector3d((i % 8) * 45);
            const figure = figures[i % figures.length];

            // userType 1 = 'user'. A bot type would resolve to the same visualization but carries
            // rentable-bot logic the server normally feeds; a plain user is the honest analogue of
            // the occupants this test stands in for.
            if(engine.addObjectUser(RoomStressTest._roomId, roomIndex, location, direction, (i % 8) * 45, 1, figure))
            {
                RoomStressTest._avatarIndices.push(roomIndex);
            }
        }

        if(RoomStressTest._avatarIndices.length < count)
        {
            log.warn(
                `Only ${RoomStressTest._avatarIndices.length}/${count} avatars were created —`
                + ' addObjectUser() refused the rest, usually because the room is not active'
            );
        }
    }

    /**
     * Adds `count` copies of furniture already standing in the room.
     *
     * The type is cloned rather than chosen, because a furniture type id only means something
     * against the hotel's own furnidata: an invented id resolves to no content, renders nothing and
     * would load nothing. Copying a type that is demonstrably present in this room is the only way
     * to be sure the load is real. An empty room therefore gets no furniture, and says so.
     */
    // TS-only: see the class note.
    private static spawnFurniture(count: number): void
    {
        const engine = RoomStressTest._engine;
        const origin = RoomStressTest._origin;

        if(engine === null || origin === null || count <= 0) return;

        const existing = engine.getObjectsByCategory(RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE);
        const typeIds: number[] = [];

        for(const object of existing)
        {
            const typeId = object.getModel()?.getNumber(RoomObjectVariableEnum.FURNITURE_TYPE_ID) ?? NaN;

            if(!Number.isNaN(typeId) && typeId > 0 && !typeIds.includes(typeId))
            {
                typeIds.push(typeId);
            }
        }

        if(typeIds.length === 0)
        {
            log.warn('No furniture in this room to clone a type from — spawning avatars only');

            return;
        }

        for(let i = 0; i < count; i++)
        {
            const id = RoomStressTest.BASE_ROOM_INDEX + i;
            const location = RoomStressTest.wanderTarget(origin);
            const direction = new Vector3d((i % 4) * 90);

            const added = engine.addRoomObjectFurniture(
                RoomStressTest._roomId,
                id,
                typeIds[i % typeIds.length],
                location,
                direction,
                0,
                null,
                0,
                0,
                0,
                null
            );

            if(added)
            {
                RoomStressTest._furnitureIds.push(id);
            }
        }
    }

    /**
     * Sends every synthetic avatar to a new nearby tile.
     *
     * Mirrors `RoomMessageHandler.onWiredUserMove()`: a location/target pair through
     * `updateRoomObjectUser()`, then the `'mv'` posture, which is the pair a real status update
     * produces. Reading each avatar's current location back from the engine rather than tracking it
     * here keeps the slide continuous — starting from a remembered position that the previous slide
     * had not finished reaching would make them teleport.
     */
    // TS-only: see the class note.
    private static step(): void
    {
        const engine = RoomStressTest._engine;
        const origin = RoomStressTest._origin;

        if(engine === null || origin === null) return;

        for(const roomIndex of RoomStressTest._avatarIndices)
        {
            const object = engine.getRoomObject(
                RoomStressTest._roomId, roomIndex, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER
            );

            if(object === null) continue;

            const from = object.getLocation();
            const target = RoomStressTest.wanderTarget(origin);
            const angle = RoomStressTest.directionBetween(from, target);

            engine.updateRoomObjectUser(
                RoomStressTest._roomId,
                roomIndex,
                new Vector3d(from.x, from.y, from.z),
                target,
                new Vector3d(angle),
                angle,
                false,
                0,
                RoomStressTest.STEP_ANIMATION_TIME
            );

            engine.updateRoomObjectUserPosture(RoomStressTest._roomId, roomIndex, 'mv', '');
        }
    }

    /** A random tile within the run's wander radius of `origin`, at the origin's height. */
    // TS-only: see the class note.
    private static wanderTarget(origin: IVector3d): Vector3d
    {
        const span = (RoomStressTest._wanderRadius * 2) + 1;
        const x = Math.round(origin.x) - RoomStressTest._wanderRadius + Math.floor(Math.random() * span);
        const y = Math.round(origin.y) - RoomStressTest._wanderRadius + Math.floor(Math.random() * span);

        return new Vector3d(Math.max(0, x), Math.max(0, y), origin.z);
    }

    /** The eight-way body angle pointing from `from` to `to`, in degrees. */
    // TS-only: see the class note.
    private static directionBetween(from: IVector3d, to: IVector3d): number
    {
        const dx = to.x - from.x;
        const dy = to.y - from.y;

        if(dx === 0 && dy === 0) return 0;

        // Screen-space isometric octants, matching the 0..7 * 45 convention every avatar direction
        // in the port uses (RoomMessageHandler builds its Vector3d the same way).
        const octant = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));

        return ((octant + 8) % 8) * 45;
    }
}
