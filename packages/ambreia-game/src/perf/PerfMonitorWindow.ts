import {Logger} from '@ambreia/common/utils/Logger';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IBitmapWrapperWindow} from '@ambreia/ui/components/IBitmapWrapperWindow';
import type {ISelectableWindow} from '@ambreia/ui/components/ISelectableWindow';
import type {ITabContextWindow} from '@ambreia/ui/components/ITabContextWindow';
import {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IHabboWindowManager} from '../window/IHabboWindowManager';
import type {IRoomEngine} from '../room/IRoomEngine';
import {RoomObjectCategoryEnum} from '@ambreia/iso/scene/object/RoomObjectCategoryEnum';
import {RoomStressTest} from '../room/utils/RoomStressTest';
import type {IProfileResult} from '@ambreia/common/utils/SelfProfiler';
import {SelfProfiler} from '@ambreia/common/utils/SelfProfiler';
import {
    FRAME_CHANNEL_NET,
    FRAME_CHANNEL_PIXI,
    FRAME_CHANNEL_ROOM_OBJECTS,
    FRAME_CHANNEL_UI,
    FrameTimings
} from '@ambreia/common/utils/FrameTimings';
import {PERF_MONITOR_LAYOUT_NAME, PERF_MONITOR_TABS} from './PerfMonitorLayout';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';

const log = Logger.getLogger('habbo.perf.PerfMonitorWindow');

/** One second of the frame budget, as the graph plots it. */
interface IPerfPoint
{
    // TS-only: no AS3 counterpart; see the class note.
    fps: number;
    // TS-only: no AS3 counterpart; see the class note.
    roomObjects: number;
    // TS-only: no AS3 counterpart; see the class note.
    pixi: number;
    // TS-only: no AS3 counterpart; see the class note.
    ui: number;
    // TS-only: no AS3 counterpart; see the class note.
    net: number;
    // TS-only: no AS3 counterpart; see the class note.
    compositions: number;
}

/** A run listed by the dev server's `/__perf/runs`. */
interface IRunIndexEntry
{
    // TS-only: no AS3 counterpart; see the class note.
    file: string;
    // TS-only: no AS3 counterpart; see the class note.
    when: string;
    // TS-only: no AS3 counterpart; see the class note.
    avatars: number;
    // TS-only: no AS3 counterpart; see the class note.
    furniture: number;
    // TS-only: no AS3 counterpart; see the class note.
    durationSeconds: number;
    // TS-only: no AS3 counterpart; see the class note.
    samples: number;
}

/**
 * The frame-budget monitor: a tabbed tool window of the client's own window system.
 *
 * TS-only: no AS3 counterpart — Flash had no such tool, and this measures this port's rendering.
 *
 * Built from `vortex_perfmon_xml`, one of this port's own authored layouts in
 * `vortex-client/src/vortex-layouts/` — tab buttons wired to `WE_SELECTED`, one container per tab
 * toggled with `.visible`, exactly as the (removed) wired menu view did it. Assembling the same window from
 * `createWindow()` calls by hand produces something that works and looks nothing like the client:
 * the skinning lives in the layout, not in the window types.
 *
 * Three tabs, because measuring this port needs three different things:
 *
 * - **Live** — samples `FrameTimings` as the client runs. A browser page can only read runs already
 *   written, so it can only show the past; this shows a change while it is being made.
 * - **Runs** — reads the JSON the dev server wrote, so past runs can be compared without leaving
 *   the client.
 * - **Bench** — starts a synthetic load from here. Typing `:stresstest 15 100` and then opening a
 *   separate tool to read the result is the workflow this replaces.
 */
export class PerfMonitorWindow
{
    /** Seconds of history the live graph holds. */
    // TS-only: see the class note.
    private static readonly HISTORY: number = 60;

    // TS-only: see the class note.
    private static readonly SAMPLE_INTERVAL_MS: number = 1000;

    /** Layer 1, where the wired menu puts its own views. */
    // TS-only: see the class note.
    private static readonly LAYER: number = 1;

    /** Seconds a bench run records before writing itself out. */
    // TS-only: see the class note.
    private static readonly BENCH_SECONDS: number = 15;

    /** Rows of the profile table. Enough to see the shape, few enough to read at a glance. */
    // TS-only: see the class note.
    private static readonly PROFILE_ROWS: number = 20;

    // TS-only: no AS3 counterpart; see the class note.
    private static _instance: PerfMonitorWindow | null = null;

    // TS-only: no AS3 counterpart; see the class note.
    private readonly _windowManager: IHabboWindowManager;
    // TS-only: no AS3 counterpart; see the class note.
    private readonly _roomEngine: IRoomEngine | null;
    // TS-only: no AS3 counterpart; see the class note.
    private readonly _roomId: number;
    // TS-only: no AS3 counterpart; see the class note.
    private readonly _ownRoomIndex: number;

    // TS-only: no AS3 counterpart; see the class note.
    private _frame: IWindow | null = null;
    // TS-only: no AS3 counterpart; see the class note.
    private _tree: IWindowContainer | null = null;
    // TS-only: no AS3 counterpart; see the class note.
    private _timer: ReturnType<typeof setInterval> | null = null;
    // TS-only: no AS3 counterpart; see the class note.
    private _activeTab: string = 'live';

    // TS-only: no AS3 counterpart; see the class note.
    private readonly _history: IPerfPoint[] = [];
    // TS-only: no AS3 counterpart; see the class note.
    private _runs: IRunIndexEntry[] = [];
    // TS-only: no AS3 counterpart; see the class note.
    private _runIndex: number = 0;
    // TS-only: no AS3 counterpart; see the class note.
    private _shownProfile: IProfileResult | null = null;

    // TS-only: no AS3 counterpart; see the class note.
    private _liveCanvas: OffscreenCanvas | null = null;
    // TS-only: no AS3 counterpart; see the class note.
    private _runCanvas: OffscreenCanvas | null = null;
    // TS-only: no AS3 counterpart; see the class note.
    private _benchCanvas: OffscreenCanvas | null = null;

    private constructor(
        windowManager: IHabboWindowManager,
        roomEngine: IRoomEngine | null,
        roomId: number,
        ownRoomIndex: number
    )
    {
        this._windowManager = windowManager;
        this._roomEngine = roomEngine;
        this._roomId = roomId;
        this._ownRoomIndex = ownRoomIndex;
    }

    /** Opens the monitor, or closes it if it is already up. Returns whether it is now open. */
    // TS-only: see the class note.
    public static toggle(
        windowManager: IHabboWindowManager,
        roomEngine: IRoomEngine | null,
        roomId: number,
        ownRoomIndex: number
    ): boolean
    {
        if(PerfMonitorWindow._instance !== null)
        {
            PerfMonitorWindow._instance.dispose();

            return false;
        }

        const monitor = new PerfMonitorWindow(windowManager, roomEngine, roomId, ownRoomIndex);

        if(!monitor.open())
        {
            monitor.dispose();

            return false;
        }

        PerfMonitorWindow._instance = monitor;

        return true;
    }

    // TS-only: see the class note.
    private open(): boolean
    {
        // No registration here: `App.readVortexLayouts()` registers everything in
        // `src/vortex-layouts/` at boot, under the file basename.
        const frame = this._windowManager.buildWidgetLayout(PERF_MONITOR_LAYOUT_NAME, PerfMonitorWindow.LAYER);

        if(frame === null)
        {
            log.warn('Could not build the monitor layout');

            return false;
        }

        this._frame = frame;
        this._tree = frame as unknown as IWindowContainer;

        this._liveCanvas = this.canvasFor('perfmon_graph');
        this._runCanvas = this.canvasFor('perfmon_run_graph');
        this._benchCanvas = this.canvasFor('perfmon_bench_graph');

        this.wireTabs();
        this.wireButtons();

        // The frame skin supplies the red X in its header, tagged `close` — the layout never
        // declares it, so it has to be found by tag rather than by name. Without this the button
        // draws and depresses and does nothing, which is what it was doing.
        this._tree.findChildByTag('close')?.addEventListener(WindowMouseEvent.CLICK, this._onClose);

        // Parented to a desktop layer and activated, exactly as `WiredErrorInfoView.show()` does.
        // A window that is only `visible` has no parent and never reaches the compositor.
        const desktop = this._windowManager.getDesktop(PerfMonitorWindow.LAYER) as unknown as IWindowContainer | null;

        if(desktop !== null && typeof desktop.addChild === 'function') desktop.addChild(frame);

        frame.visible = true;
        frame.activate();

        this._timer = setInterval(() => this.sample(), PerfMonitorWindow.SAMPLE_INTERVAL_MS);

        this.sample();
        void this.reloadRuns();

        log.info('Frame budget monitor opened');

        return true;
    }

    // TS-only: see the class note.
    private wireTabs(): void
    {
        for(const tab of PERF_MONITOR_TABS)
        {
            const page = this.find(tab.container);

            if(page !== null) page.visible = tab.id === this._activeTab;

            this.find(tab.button)?.addEventListener(WindowEvent.WE_SELECTED, this._onTabSelected);
        }

        // Selecting through the context's own selector is what paints a tab button as active;
        // toggling container visibility alone leaves every tab looking unselected.
        const context = this.find('perfmon_tabs') as unknown as ITabContextWindow | null;
        const first = this.find(PERF_MONITOR_TABS[0].button);

        if(context?.selector && first !== null) context.selector.setSelected(first as unknown as ISelectableWindow);
    }

    // TS-only: see the class note.
    private readonly _onClose = (): void =>
    {
        this.dispose();
    };

    // TS-only: see the class note.
    private readonly _onTabSelected = (event: WindowEvent): void =>
    {
        const target = event.target as unknown as IWindow | null;

        if(target === null) return;

        for(const tab of PERF_MONITOR_TABS)
        {
            if(this.find(tab.button) !== target) continue;

            this._activeTab = tab.id;

            for(const other of PERF_MONITOR_TABS)
            {
                const page = this.find(other.container);

                if(page !== null) page.visible = other.id === tab.id;
            }

            if(tab.id === 'runs') void this.reloadRuns();
            if(tab.id === 'profile') this.showProfile();

            return;
        }
    };

    // TS-only: see the class note.
    private wireButtons(): void
    {
        this.find('perfmon_run_prev')?.addEventListener(WindowMouseEvent.CLICK, () => this.stepRun(-1));
        this.find('perfmon_run_next')?.addEventListener(WindowMouseEvent.CLICK, () => this.stepRun(1));
        this.find('perfmon_run_reload')?.addEventListener(WindowMouseEvent.CLICK, () => void this.reloadRuns());

        this.find('perfmon_bench_20')?.addEventListener(WindowMouseEvent.CLICK, () => this.startBench(20));
        this.find('perfmon_bench_60')?.addEventListener(WindowMouseEvent.CLICK, () => this.startBench(60));
        this.find('perfmon_bench_100')?.addEventListener(WindowMouseEvent.CLICK, () => this.startBench(100));
        this.find('perfmon_p_refresh')?.addEventListener(WindowMouseEvent.CLICK, () => this.showProfile());

        this.find('perfmon_bench_stop')?.addEventListener(WindowMouseEvent.CLICK, () =>
        {
            RoomStressTest.stop();
            this.setCaption('perfmon_bench_status', 'stopped');
        });
    }

    // ------------------------------------------------------------------ live

    /**
     * Takes one reading and redraws.
     *
     * A snapshot with no frames in it is dropped rather than plotted: nothing rendered during that
     * second, so every figure in it is zero, and a zero on the graph is a cliff that never happened.
     * That confusion — a frozen sampler read as a steady state — is why the interval frame count
     * exists at all.
     */
    // TS-only: see the class note.
    private sample(): void
    {
        const snapshot = FrameTimings.snapshot();

        if(snapshot.intervalFrames > 0)
        {
            this._history.push({
                fps: snapshot.fps,
                roomObjects: snapshot.channels[FRAME_CHANNEL_ROOM_OBJECTS] ?? 0,
                pixi: snapshot.channels[FRAME_CHANNEL_PIXI] ?? 0,
                ui: snapshot.channels[FRAME_CHANNEL_UI] ?? 0,
                net: snapshot.channels[FRAME_CHANNEL_NET] ?? 0,
                compositions: (snapshot.counters['avatar.compose'] ?? 0) - (snapshot.counters['avatar.null'] ?? 0)
            });

            while(this._history.length > PerfMonitorWindow.HISTORY) this._history.shift();
        }

        // Only the visible tab's graph is redrawn. With all three refreshing, the window's own
        // bitmap children cost 4.5s of a 15s run — `BitmapDataRenderer.draw()` at 51% of the
        // profile — so the monitor was measuring itself more than the client.
        if(this._activeTab === 'live') this.drawSeries(this._liveCanvas, 'perfmon_graph', this._history);

        this.updateLiveText();

        if(RoomStressTest.active)
        {
            if(this._activeTab === 'bench') this.drawSeries(this._benchCanvas, 'perfmon_bench_graph', this._history);
            this.setCaption(
                'perfmon_bench_status',
                `running — ${RoomStressTest.avatarCount} avatars, writes to perf/ when it finishes`
            );
        }
        else if(RoomStressTest.lastProfile !== null && RoomStressTest.lastProfile !== this._shownProfile)
        {
            // The profile only exists once the run has ended and the browser has handed the trace
            // back, which is asynchronous — so it is picked up here rather than at the moment the
            // bench stops.
            this._shownProfile = RoomStressTest.lastProfile;
            this.setCaption('perfmon_bench_status', 'finished — see the Profile tab');
            this.showProfile();
        }
    }

    /**
     * Renders the last run's profile as a fixed-width table of the heaviest functions.
     *
     * Self time, not total: the browser's sampler only walks JavaScript stacks, so the time a
     * function spends inside `drawImage` or `getImageData` lands on that function's own line. That
     * is the attribution reading a DevTools native total by eye gets wrong — `save` measured 36.7%
     * of a run here and was charged to the wrong caller, turning a predicted third of the frame
     * into 14%.
     */
    // TS-only: see the class note.
    private showProfile(): void
    {
        const profile: IProfileResult | null = RoomStressTest.lastProfile;

        if(profile === null)
        {
            this.setCaption(
                'perfmon_p_title',
                SelfProfiler.available ? 'no profile yet' : 'profiling unavailable in this document'
            );
            this.setCaption(
                'perfmon_p_table',
                SelfProfiler.available
                    ? 'Run a bench and the heaviest functions appear here.'
                    : 'The page must be served with Document-Policy: js-profiling. The dev server sets it;'
                      + ' a production build does not.'
            );

            return;
        }

        this._shownProfile = profile;
        this.setCaption(
            'perfmon_p_title',
            `${(profile.durationMs / 1000).toFixed(1)}s, ${profile.sampleCount} samples`
        );

        const half = Math.floor(PerfMonitorWindow.PROFILE_ROWS / 2);
        const rows = profile.entries.slice(0, half).map((entry) =>
        {
            const share = `${entry.selfPercent.toFixed(1)}%`.padStart(6);
            const self = `${entry.selfMs.toFixed(0)}ms`.padStart(8);

            return `${share} ${self}   ${entry.label.slice(0, 62)}`;
        });

        // A bare `drawImage` line says nothing actionable; the same time charged to the function
        // that asked for it names the thing to change.
        const blame = (profile.natives ?? []).slice(0, half).map((entry) =>
        {
            const share = `${entry.selfPercent.toFixed(1)}%`.padStart(6);
            const self = `${entry.selfMs.toFixed(0)}ms`.padStart(8);

            return `${share} ${self}   ${entry.label.slice(0, 62)}`;
        });

        if(blame.length > 0) rows.push('', ' NATIVE WORK BY CALLER', ...blame);

        this.setCaption(
            'perfmon_p_table',
            rows.length > 0
                ? ` SHARE     SELF   FUNCTION\n${rows.join('\n')}`
                : 'the profile came back empty'
        );
    }

    // TS-only: see the class note.
    private updateLiveText(): void
    {
        const last = this._history[this._history.length - 1];

        if(last === undefined)
        {
            this.setCaption('perfmon_v_fps', 'waiting');

            return;
        }

        const frame = last.roomObjects + last.pixi + last.ui + last.net;

        this.setCaption('perfmon_v_fps', last.fps.toFixed(1));
        this.setCaption('perfmon_v_frame', frame.toFixed(1));
        // One decimal, not none: this is a per-frame mean, so a real load of 0.4 compositions a
        // frame rounded to a flat "0" while the cost beside it was plainly not zero.
        this.setCaption('perfmon_v_comps', last.compositions.toFixed(1));
        this.setCaption(
            'perfmon_v_per',
            last.compositions > 0 ? (last.roomObjects / last.compositions).toFixed(3) : '-'
        );
        this.setCaption(
            'perfmon_breakdown',
            `room ${last.roomObjects.toFixed(2)}ms      pixi ${last.pixi.toFixed(2)}ms`
            + `      ui ${last.ui.toFixed(2)}ms      net ${last.net.toFixed(2)}ms`
        );
    }

    // ------------------------------------------------------------------ runs

    /** Asks the dev server which runs are on disk. Absent outside `pnpm dev`, and that is fine. */
    // TS-only: see the class note.
    private async reloadRuns(): Promise<void>
    {
        try
        {
            const response = await fetch('/__perf/runs');

            if(!response.ok) throw new Error(String(response.status));

            this._runs = await response.json() as IRunIndexEntry[];
            this._runIndex = 0;

            await this.showRun();
        }
        catch
        {
            this.setCaption('perfmon_run_title', 'no run index — the dev server is not serving /__perf');
        }
    }

    // TS-only: see the class note.
    private stepRun(delta: number): void
    {
        if(this._runs.length === 0) return;

        this._runIndex = (this._runIndex + delta + this._runs.length) % this._runs.length;

        void this.showRun();
    }

    // TS-only: see the class note.
    private async showRun(): Promise<void>
    {
        const entry = this._runs[this._runIndex];

        if(entry === undefined)
        {
            this.setCaption('perfmon_run_title', 'no runs on disk');
            this.setCaption('perfmon_run_detail', 'use the Bench tab to record one');

            return;
        }

        try
        {
            const run = await (await fetch(`/__perf/run?file=${encodeURIComponent(entry.file)}`)).json() as {
                samples: {
                    // TS-only: no AS3 counterpart; see the class note.
                    intervalFrames?: number;
                    // TS-only: no AS3 counterpart; see the class note.
                    fps: number;
                    // TS-only: no AS3 counterpart; see the class note.
                    channels: Record<string, number>;
                    // TS-only: no AS3 counterpart; see the class note.
                    counters: Record<string, number>;
                }[];
            };

            const points: IPerfPoint[] = run.samples
                .filter((s) => (s.intervalFrames ?? 1) > 0)
                .map((s) => ({
                    fps: s.fps,
                    roomObjects: s.channels['room.obj'] ?? 0,
                    pixi: s.channels['pixi'] ?? 0,
                    ui: s.channels['ui'] ?? 0,
                    net: s.channels['net'] ?? 0,
                    compositions: (s.counters['avatar.compose'] ?? 0) - (s.counters['avatar.null'] ?? 0)
                }));

            this.drawSeries(this._runCanvas, 'perfmon_run_graph', points);

            const dropped = run.samples.length - points.length;
            const loaded = points.filter((p) => p.compositions > 50);
            const first = loaded[0];
            const last = loaded[loaded.length - 1];
            const perOf = (p?: IPerfPoint): number => (p !== undefined && p.compositions > 0)
                ? p.roomObjects / p.compositions
                : 0;
            const drift = perOf(first) > 0 ? perOf(last) / perOf(first) : 0;

            this.setCaption(
                'perfmon_run_title',
                `${entry.avatars} avatars · ${entry.when}   (${this._runIndex + 1}/${this._runs.length})`
            );
            this.setCaption('perfmon_r_samples', `${points.length}${dropped > 0 ? ` / ${dropped} dropped` : ''}`);
            this.setCaption(
                'perfmon_r_fps',
                `${first ? first.fps.toFixed(1) : '-'} to ${last ? last.fps.toFixed(1) : '-'}`
            );
            this.setCaption('perfmon_r_per', `${perOf(first).toFixed(3)} to ${perOf(last).toFixed(3)}`);
            this.setCaption('perfmon_r_drift', drift > 0 ? `x${drift.toFixed(1)}` : '-');
            this.setCaption(
                'perfmon_run_note',
                dropped > 0
                    ? `${dropped} sample${dropped > 1 ? 's' : ''} recorded no frames at all and are left out.`
                    : ''
            );
        }
        catch (error)
        {
            this.setCaption('perfmon_run_title', `could not read ${entry.file}`);
            this.setCaption('perfmon_run_detail', String((error as Error).message));
        }
    }

    // ----------------------------------------------------------------- bench

    /**
     * Starts a timed synthetic load, centred where the camera already is.
     *
     * Same resolution the `:stresstest` command uses: the caller's own avatar when the session knows
     * which one it is, otherwise any object in the room. The centre only decides *where* the load
     * lands, and anything on screen keeps it inside the viewport — which is the property that makes
     * the `pixi` figure mean anything.
     */
    // TS-only: see the class note.
    private startBench(avatars: number): void
    {
        const engine = this._roomEngine;

        if(engine === null)
        {
            this.setCaption('perfmon_bench_status', 'no room engine — join a room first');

            return;
        }

        const own = engine.getRoomObject(this._roomId, this._ownRoomIndex, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER);
        const centre = own
            ?? engine.getObjectsByCategory(RoomObjectCategoryEnum.OBJECT_CATEGORY_USER)[0]
            ?? engine.getObjectsByCategory(RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)[0]
            ?? null;

        if(centre === null)
        {
            this.setCaption('perfmon_bench_status', 'nothing in the room to centre the load on');

            return;
        }

        RoomStressTest.start(
            engine, this._roomId, centre.getLocation(), avatars, 0, PerfMonitorWindow.BENCH_SECONDS
        );

        this._history.length = 0;
        this.setCaption(
            'perfmon_bench_status',
            `started ${avatars} avatars for ${PerfMonitorWindow.BENCH_SECONDS}s — the graph below is live`
        );
    }

    // ---------------------------------------------------------------- canvas

    // TS-only: see the class note.
    private canvasFor(name: string): OffscreenCanvas | null
    {
        const target = this.find(name);

        if(target === null || typeof OffscreenCanvas === 'undefined') return null;

        return new OffscreenCanvas(Math.max(1, target.width), Math.max(1, target.height));
    }

    /**
     * Draws fps, whole-frame and room.obj onto one of the bitmap children.
     *
     * Milliseconds and frames per second share the plot on their own scales: the point is the
     * *shape* of each, and a shared axis would flatten whichever lost.
     */
    // TS-only: see the class note.
    private drawSeries(canvas: OffscreenCanvas | null, windowName: string, points: IPerfPoint[]): void
    {
        const target = this.find(windowName) as unknown as IBitmapWrapperWindow | null;

        if(canvas === null || target === null) return;

        const context = canvas.getContext('2d');

        if(context === null) return;

        const w = canvas.width;
        const h = canvas.height;

        context.imageSmoothingEnabled = false;

        // A light recessed field, the way the client's own list and preview areas read. A dark
        // chart inside a light window is the tell that a tool was bolted on.
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, w, h);
        context.strokeStyle = '#9aa8b5';
        context.lineWidth = 1;
        context.strokeRect(0.5, 0.5, w - 1, h - 1);

        context.strokeStyle = '#dfe6ec';

        for(let i = 1; i < 4; i++)
        {
            const y = Math.round((h / 4) * i) + 0.5;

            context.beginPath();
            context.moveTo(1, y);
            context.lineTo(w - 1, y);
            context.stroke();
        }

        if(points.length > 1)
        {
            const maxMs = Math.max(...points.map((p) => p.roomObjects + p.pixi + p.ui + p.net), 1);
            const maxFps = Math.max(...points.map((p) => p.fps), 1);

            this.plot(context, canvas, points, (p) => p.fps / maxFps, '#3d8b37');
            this.plot(context, canvas, points, (p) => (p.roomObjects + p.pixi + p.ui + p.net) / maxMs, '#c8502a');
            this.plot(context, canvas, points, (p) => p.roomObjects / maxMs, '#2b6fb0');

            context.fillStyle = '#5a6773';
            context.font = '9px Verdana, sans-serif';
            context.fillText(`${maxMs.toFixed(0)}ms`, 4, 11);
            context.fillText(`${maxFps.toFixed(0)}fps`, 4, h - 4);
        }
        else
        {
            context.fillStyle = '#5a6773';
            context.font = '10px Verdana, sans-serif';
            context.fillText('collecting', 8, 18);
        }

        target.bitmap = canvas.transferToImageBitmap();
    }

    // TS-only: see the class note.
    private plot(
        context: OffscreenCanvasRenderingContext2D,
        canvas: OffscreenCanvas,
        points: IPerfPoint[],
        pick: (point: IPerfPoint) => number,
        colour: string
    ): void
    {
        const w = canvas.width;
        const h = canvas.height;
        const step = (w - 2) / Math.max(1, points.length - 1);

        context.strokeStyle = colour;
        context.lineWidth = 1.5;
        context.beginPath();

        points.forEach((point, i) =>
        {
            const x = 1 + (i * step);
            const y = h - (Math.max(0, Math.min(1, pick(point))) * (h - 6)) - 3;

            if(i === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        });

        context.stroke();
    }

    // ----------------------------------------------------------------- utils

    // TS-only: see the class note.
    private find(name: string): IWindow | null
    {
        return this._tree?.findChildByName(name) ?? null;
    }

    // TS-only: see the class note.
    private setCaption(name: string, text: string): void
    {
        const target = this.find(name);

        if(target !== null) target.caption = text;
    }

    // TS-only: see the class note.
    public dispose(): void
    {
        if(this._timer !== null)
        {
            clearInterval(this._timer);
            this._timer = null;
        }

        // The wrappers own whatever bitmap they hold, so clearing them before the window goes is
        // what releases the last frame's ImageBitmap rather than leaving it to the collector.
        for(const name of ['perfmon_graph', 'perfmon_run_graph', 'perfmon_bench_graph'])
        {
            const target = this.find(name) as unknown as IBitmapWrapperWindow | null;

            if(target !== null) target.bitmap = null;
        }

        this._frame?.dispose();
        this._frame = null;
        this._tree = null;
        this._liveCanvas = null;
        this._runCanvas = null;
        this._benchCanvas = null;
        this._history.length = 0;
        this._runs = [];
        this._shownProfile = null;

        if(PerfMonitorWindow._instance === this) PerfMonitorWindow._instance = null;
    }
}
