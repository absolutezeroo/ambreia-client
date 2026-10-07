import {Vortex} from 'vortex-engine';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IWindowDebugNode, IWindowDebugRect} from '@ambreia/ui/debugger/index';
import {SkinPreviewRenderer, WindowTreeInspector} from '@ambreia/ui/debugger/index';
import {TextStyleManager} from '@ambreia/ui/utils/TextStyleManager';
import {GlyphAtlas} from '@ambreia/ui/utils/GlyphAtlas';
import {TYPE_CODE_TO_NAME, WindowType} from '@ambreia/ui/enum/WindowType';
import type {ILogRecord} from '@ambreia/common/utils/Logger';
import {Logger, LogLevel} from '@ambreia/common/utils/Logger';
import type {IElementDescriptor} from '@ambreia/ui/kit/IElementDescriptor';
import type {ILinkEventTracker} from '@ambreia/game/core/runtime/events/index';

const log = Logger.getLogger('client.debugger.WindowDebuggerOverlay');

/**
 * Dev-only visual debugger overlay (vortex-client/src/debugger).
 *
 * Entirely opt-in: installWindowDebugger() only adds one small floating
 * toggle button (plus a Ctrl+Shift+D hotkey as a bonus shortcut — some
 * browsers reserve that combo, e.g. Firefox's "Bookmark All Tabs", and
 * can swallow it before page JS ever sees it, so the button is the
 * reliable path). Lets you browse every registered widget layout and
 * skin/style combination, spawn a layout as a real live window (same
 * buildWidgetLayout() path production uses, so it's fully interactive),
 * and inspect its component tree with on-canvas highlight boxes.
 * No AS3 equivalent.
 */

const HOTKEY_CODE = 'KeyD';

/**
 * Clipboard write that still works where `navigator.clipboard` is refused.
 *
 * Every toolbar action here ends in a clipboard write, and the whole point of them is handing a
 * window tree to someone else. A Permissions Policy blocks the modern API with nothing but a console
 * violation — the client is framed by vortex-web and Chrome does not inherit `clipboard-write` into
 * a frame just because it is same-origin (that delegation is now in Client.svelte, but a client
 * opened directly, or an older deployment of the site, still lands here).
 *
 * The fallback is the pre-API `execCommand('copy')` over an off-screen textarea. It is deprecated
 * and it is synchronous, which is exactly why it survives the policy: it copies from a real
 * selection inside a user gesture rather than asking for a capability.
 */
async function copyText(text: string): Promise<string>
{
    try
    {
        await navigator.clipboard.writeText(text);

        return 'Copied!';
    }
    catch
    {
        const area = document.createElement('textarea');

        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.left = '-9999px';
        area.style.top = '0';

        document.body.appendChild(area);
        area.select();

        let ok: boolean;

        try
        {
            ok = document.execCommand('copy');
        }
        catch
        {
            ok = false;
        }

        area.remove();

        if(ok) return 'Copied!';

        throw new Error('clipboard blocked');
    }
}
const CASCADE_OFFSET = 24;
const CONTEXT_LAYER_COUNT = 4;
// A full-region dump of anything bigger than a small icon is unpasteable;
// the alpha-coverage line in the header carries the "did it draw at all"
// answer that the rows were really being read for.
const MAX_PIXEL_DUMP_ROWS = 24;
const MAX_PIXEL_DUMP_RUNS = 12;

interface IOpenWindowEntry {
    id: number;
    label: string;
    window: IWindow;
}

let nextOpenId = 1;
let stylesInjected = false;

const LINK_COMMAND_PATTERN = /['"]([a-zA-Z][\w.-]{1,30})['"]/g;

// ponytail: the sub-commands are read out of `linkReceived`'s own source with
// Function.prototype.toString(), because nothing exposes them at runtime — a `switch(parts[1])`
// is invisible to reflection, and a hand-kept list of every link in the client would be stale
// within a week. Best-effort by construction: it lists candidates, some of which are not links,
// and a tracker that delegates or dispatches from a table lists none. The free-text box is the
// fallback for both cases. Upgrade path if it ever matters: have each tracker declare its own
// commands. Dev-only — a minified build would defeat it.
function extractLinkCommands(tracker: ILinkEventTracker): string[]
{
    const source = String(tracker.linkReceived);
    const seen = new Set<string>();

    for(const match of source.matchAll(LINK_COMMAND_PATTERN))
    {
        const command = match[1];

        // The prefix itself and the separator show up in every split()/startsWith() call.
        if(command === tracker.linkPattern || command === tracker.linkPattern.replace('/', '')) continue;

        seen.add(command);
    }

    return [...seen].sort();
}

export function installWindowDebugger(canvas: HTMLCanvasElement): () => void 
{
    let panel: WindowDebuggerPanel | null = null;

    const toggle = (): void => 
    {
        if(panel) 
        {
            panel.dispose();
            panel = null;
        }
        else 
        {
            panel = new WindowDebuggerPanel(canvas, () => 
            {
                panel = null;
                toggleButton.classList.remove('hwd-toggle-active');
            });
        }

        toggleButton.classList.toggle('hwd-toggle-active', panel !== null);
    };

    const onKeyDown = (event: KeyboardEvent): void => 
    {
        if(!event.ctrlKey || !event.shiftKey || event.code !== HOTKEY_CODE) return;

        event.preventDefault();
        toggle();
    };

    window.addEventListener('keydown', onKeyDown);

    // Both capture buffers arm here rather than when the panel opens: the
    // warnings that explain a broken layout (missing asset, unregistered
    // layout) are emitted during boot, and an exception thrown mid-build
    // leaves the half-drawn UI that gets reported as "a visual bug".
    const removeErrorCapture = installErrorCapture();

    if(isLogCaptureEnabled()) Logger.onRecord(onLogRecord);

    const toggleButton = createToggleButton(toggle);

    return () =>
    {
        window.removeEventListener('keydown', onKeyDown);
        removeErrorCapture();
        Logger.onRecord(null);
        toggleButton.remove();
        panel?.dispose();
        panel = null;
    };
}

/**
 * Flips the glyph atlas off and back on, so the two rasterisation paths can be
 * compared on the same widget without a rebuild.
 *
 * With it on, `antiAliasType="normal"` text is baked into an atlas and
 * centre-sampled — a deliberate binary coverage, on the reading that Flash's
 * pre-Flash-8 rasteriser was near-binary on a pixel font at its design size.
 * Measured against a real client capture of the same menu, that reading does
 * not hold: the reference has 65-91 distinct luminances per line of text where
 * this port has 5, and several lines with no intermediate pixel at all. With
 * the atlas off, the same text goes through `ctx.fillText()` like the
 * "advanced" path already does.
 *
 * The switch itself is not new — GlyphAtlas has always read
 * `globalThis.__vortexTextAtlas`. This only puts it a click away, and redraws
 * so the change is visible without reopening every window.
 */
function createAtlasButton(): HTMLButtonElement
{
    const button = document.createElement('button');

    const paint = (): void =>
    {
        const on = GlyphAtlas.enabled;

        button.textContent = `Atlas: ${on ? 'ON' : 'off'}`;
        button.classList.toggle('hwd-copy-btn-armed', !on);
    };

    button.className = 'hwd-copy-btn';
    button.title = 'Glyph atlas: rasterises glyph outlines with the face\'s own hinting, for both antiAliasType values. Off routes every style through ctx.fillText() — reopen a window if some text does not repaint.';
    button.addEventListener('click', () =>
    {
        GlyphAtlas.enabled = !GlyphAtlas.enabled;
        GlyphAtlas.invalidateAll();
        paint();
    });

    paint();

    return button;
}

/**
 * Arms or disarms warn/error capture.A toggle rather than a plain action:
 * the setting outlives the panel, and the label has to show which way it is
 * currently pointing.
 */
function createLogCaptureButton(): HTMLButtonElement
{
    const button = document.createElement('button');

    const paint = (): void =>
    {
        const on = isLogCaptureEnabled();

        button.textContent = `Logs: ${on ? 'ON' : 'off'} (${logBuffer.length})`;
        button.classList.toggle('hwd-copy-btn-armed', on);
    };

    button.className = 'hwd-copy-btn';
    button.title = 'Capture warn/error log records into the report. Costs DevTools call-site attribution on every console line, so it is off by default; reload once armed to catch boot-time warnings.';
    button.addEventListener('click', () =>
    {
        setLogCapture(!isLogCaptureEnabled());
        paint();
    });

    paint();

    return button;
}

function createToggleButton(onToggle: () => void): HTMLButtonElement 
{
    injectStyles();

    const button = document.createElement('button');

    button.className = 'hwd-toggle-btn';
    button.textContent = '🐞';
    button.title = 'Window Debugger (Ctrl+Shift+D)';
    button.addEventListener('click', onToggle);
    document.body.appendChild(button);

    return button;
}

class WindowDebuggerPanel 
{
    private readonly _canvas: HTMLCanvasElement;
    private readonly _onClosed: () => void;
    private readonly _root: HTMLDivElement;
    private readonly _listEl: HTMLDivElement;
    private readonly _detailEl: HTMLDivElement;
    private readonly _openListEl: HTMLDivElement;
    private readonly _treeEl: HTMLDivElement;
    private readonly _selectedHighlight: HTMLDivElement;
    private readonly _hoverHighlight: HTMLDivElement;
    private readonly _tabButtons: Record<'layouts' | 'skins' | 'links', HTMLButtonElement>;
    private readonly _pickBtn: HTMLButtonElement;

    private _activeTab: 'layouts' | 'skins' | 'links' = 'layouts';
    private _openWindows: IOpenWindowEntry[] = [];
    private _selectedWindow: IWindow | null = null;
    private _selectedNodeWindow: IWindow | null = null;
    private _pickModeActive: boolean = false;
    private _rafId: number = 0;
    private _lastTreeRefresh: number = 0;
    private _suppressRefreshUntil: number = 0;

    public constructor(canvas: HTMLCanvasElement, onClosed: () => void) 
    {
        this._canvas = canvas;
        this._onClosed = onClosed;

        injectStyles();

        this._root = document.createElement('div');
        this._root.className = 'hwd-root';

        const header = document.createElement('div');

        header.className = 'hwd-header';
        header.innerHTML = '<span>Window Debugger</span>';
        header.addEventListener('mousedown', (event) => this.startDrag(event, this._root));

        const closeBtn = document.createElement('button');

        closeBtn.className = 'hwd-close';
        closeBtn.textContent = '×';
        closeBtn.title = 'Close (Ctrl+Shift+D)';
        closeBtn.addEventListener('click', () => this.dispose());
        header.appendChild(closeBtn);

        const toolbar = document.createElement('div');

        toolbar.className = 'hwd-toolbar';

        this._pickBtn = document.createElement('button');
        this._pickBtn.className = 'hwd-pick-btn';
        this._pickBtn.addEventListener('click', () => this.togglePickMode());
        toolbar.appendChild(this._pickBtn);

        // The two switches that are not about the selected window live here
        // rather than in the tree toolbar below, which only exists once
        // something has been picked — a global toggle you cannot reach until
        // you have selected a window is a toggle nobody finds.
        const globals = document.createElement('div');

        globals.className = 'hwd-toolbar-globals';
        globals.appendChild(createLogCaptureButton());
        globals.appendChild(createAtlasButton());
        toolbar.appendChild(globals);

        const tabs = document.createElement('div');

        tabs.className = 'hwd-tabs';

        const layoutsTabBtn = document.createElement('button');

        layoutsTabBtn.textContent = 'Layouts';
        layoutsTabBtn.addEventListener('click', () => this.setTab('layouts'));

        const skinsTabBtn = document.createElement('button');

        skinsTabBtn.textContent = 'Skins';
        skinsTabBtn.addEventListener('click', () => this.setTab('skins'));

        const linksTabBtn = document.createElement('button');

        linksTabBtn.textContent = 'Links';
        linksTabBtn.addEventListener('click', () => this.setTab('links'));

        tabs.appendChild(layoutsTabBtn);
        tabs.appendChild(skinsTabBtn);
        tabs.appendChild(linksTabBtn);

        this._tabButtons = {layouts: layoutsTabBtn, skins: skinsTabBtn, links: linksTabBtn};

        const body = document.createElement('div');

        body.className = 'hwd-body';

        this._listEl = document.createElement('div');
        this._listEl.className = 'hwd-list';

        this._detailEl = document.createElement('div');
        this._detailEl.className = 'hwd-detail';

        this._openListEl = document.createElement('div');
        this._openListEl.className = 'hwd-open-list';

        this._treeEl = document.createElement('div');
        this._treeEl.className = 'hwd-tree';

        this._detailEl.appendChild(this._openListEl);
        this._detailEl.appendChild(this._treeEl);

        body.appendChild(this._listEl);
        body.appendChild(this._detailEl);

        this._root.appendChild(header);
        this._root.appendChild(toolbar);
        this._root.appendChild(tabs);
        this._root.appendChild(body);

        document.body.appendChild(this._root);

        this._selectedHighlight = document.createElement('div');
        this._selectedHighlight.className = 'hwd-highlight hwd-highlight-selected';
        document.body.appendChild(this._selectedHighlight);

        this._hoverHighlight = document.createElement('div');
        this._hoverHighlight.className = 'hwd-highlight hwd-highlight-hover';
        document.body.appendChild(this._hoverHighlight);

        this.updatePickButton();
        this.setTab('layouts');
        this.renderOpenList();
        this.loop();
    }

    public dispose(): void 
    {
        cancelAnimationFrame(this._rafId);

        if(this._pickModeActive) 
        {
            this.stopPickMode();
        }

        this._root.remove();
        this._selectedHighlight.remove();
        this._hoverHighlight.remove();
        document.getElementById('hwd-pick-menu')?.remove();
        this._onClosed();
    }

    private readonly pickListener = (event: MouseEvent): void => this.onCanvasPick(event);

    private readonly hoverPickListener = (event: MouseEvent): void => this.onCanvasHoverPick(event);

    private readonly pickEscListener = (event: KeyboardEvent): void => 
    {
        if(event.code === 'Escape') this.stopPickMode();
    };

    private startDrag(event: MouseEvent, target: HTMLElement): void 
    {
        if((event.target as HTMLElement).closest('.hwd-close')) return;

        event.preventDefault();

        const rect = target.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;

        target.style.left = `${rect.left}px`;
        target.style.top = `${rect.top}px`;
        target.style.right = 'auto';

        const onMove = (moveEvent: MouseEvent): void => 
        {
            const maxLeft = window.innerWidth - target.offsetWidth;
            const maxTop = window.innerHeight - target.offsetHeight;

            target.style.left = `${Math.min(Math.max(0, moveEvent.clientX - offsetX), Math.max(0, maxLeft))}px`;
            target.style.top = `${Math.min(Math.max(0, moveEvent.clientY - offsetY), Math.max(0, maxTop))}px`;
        };

        const onUp = (): void => 
        {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    private setTab(tab: 'layouts' | 'skins' | 'links'): void
    {
        this._activeTab = tab;

        for(const [name, btn] of Object.entries(this._tabButtons))
        {
            btn.classList.toggle('hwd-tab-active', name === tab);
        }

        if(tab === 'layouts')
        {
            this.renderLayoutsList('');
            this.renderOpenList();

            if(this._selectedWindow)
            {
                this.refreshTree();
            }
        }
        else if(tab === 'links')
        {
            this.renderLinksList('');
        }
        else
        {
            this.renderSkinsList('');
        }
    }

    /**
     * Every feature that can be opened from outside itself registers an ILinkEventTracker and is
     * reachable by an internal link — `questengine/calendar`, `catalog/open/{page}`,
     * `navigator/goto/{room}`. This tab is a dispatcher for them: the prefixes come live off the
     * context's tracker list, so nothing here needs maintaining as trackers come and go.
     */
    private renderLinksList(filter: string): void
    {
        const trackers = Vortex.instance.context.linkEventTrackers;

        this._listEl.innerHTML = '';

        const search = document.createElement('input');

        search.type = 'text';
        search.placeholder = 'Type a link, e.g. questengine/calendar - Enter to fire';
        search.className = 'hwd-search';
        search.value = filter;
        search.addEventListener('input', () =>
        {
            const box = this._listEl.querySelector('.hwd-scroll');

            if(box) this.fillLinkRows(box as HTMLDivElement, search.value);
        });
        search.addEventListener('keydown', (event) =>
        {
            if(event.key !== 'Enter' || search.value.length === 0) return;

            this.fireLink(search.value);
        });

        const scroll = document.createElement('div');

        scroll.className = 'hwd-scroll';

        this._listEl.appendChild(search);
        this._listEl.appendChild(scroll);
        this.fillLinkRows(scroll, filter);

        log.debug(`Link debugger: ${trackers.length} trackers registered`);
    }

    private fillLinkRows(scroll: HTMLDivElement, filter: string): void
    {
        const lower = filter.toLowerCase();

        scroll.innerHTML = '';

        for(const tracker of Vortex.instance.context.linkEventTrackers)
        {
            const prefix = tracker.linkPattern;
            const commands = extractLinkCommands(tracker);
            const matching = commands.filter(command => !lower || `${prefix}${command}`.toLowerCase().includes(lower));

            if(lower && matching.length === 0 && !prefix.toLowerCase().includes(lower)) continue;

            const heading = document.createElement('div');

            heading.className = 'hwd-heading';
            heading.textContent = prefix.length > 0 ? prefix : '(catch-all)';
            scroll.appendChild(heading);

            for(const command of matching)
            {
                const link = `${prefix}${command}`;
                const row = document.createElement('div');

                row.className = 'hwd-row';
                row.textContent = link;
                row.addEventListener('click', () => this.fireLink(link));
                scroll.appendChild(row);
            }
        }
    }

    private fireLink(link: string): void
    {
        log.info(`Link debugger: firing "${link}"`);
        Vortex.instance.context.createLinkEvent(link);
    }

    private renderLayoutsList(filter: string): void 
    {
        const windowManager = Vortex.instance.windowManager;
        const names = windowManager.getRegisteredWidgetLayoutNames().sort();

        this._listEl.innerHTML = '';

        const search = document.createElement('input');

        search.type = 'text';
        search.placeholder = `Filter ${names.length} layouts...`;
        search.className = 'hwd-search';
        search.value = filter;
        search.addEventListener('input', () => this.renderLayoutsList(search.value));

        const scroll = document.createElement('div');

        scroll.className = 'hwd-scroll';

        const lower = filter.toLowerCase();

        for(const name of names) 
        {
            if(lower && !name.toLowerCase().includes(lower)) continue;

            const row = document.createElement('div');

            row.className = 'hwd-row';
            row.textContent = name;
            row.addEventListener('click', () => this.spawnLayout(name));
            scroll.appendChild(row);
        }

        this._listEl.appendChild(search);
        this._listEl.appendChild(scroll);
    }

    private spawnLayout(name: string): void 
    {
        const windowManager = Vortex.instance.windowManager;
        const built = windowManager.buildWidgetLayout(name);

        if(!built) 
        {
            return;
        }

        built.center();
        built.offset((this._openWindows.length % 10) * CASCADE_OFFSET, (this._openWindows.length % 10) * CASCADE_OFFSET);

        const entry: IOpenWindowEntry = {id: nextOpenId++, label: name, window: built};

        this._openWindows.push(entry);
        this.selectWindow(built);
        this.renderOpenList();
    }

    private renderOpenList(): void 
    {
        this._openWindows = this._openWindows.filter(entry => !entry.window.disposed);

        this._openListEl.innerHTML = '';

        if(this._openWindows.length === 0) 
        {
            return;
        }

        const heading = document.createElement('div');

        heading.className = 'hwd-heading';
        heading.textContent = `Open (${this._openWindows.length})`;
        this._openListEl.appendChild(heading);

        for(const entry of this._openWindows) 
        {
            const row = document.createElement('div');

            row.className = 'hwd-open-row';

            if(entry.window === this._selectedWindow) 
            {
                row.classList.add('hwd-row-selected');
            }

            const label = document.createElement('span');

            label.textContent = entry.label;
            label.addEventListener('click', () => this.selectWindow(entry.window));

            const closeBtn = document.createElement('button');

            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', (event) => 
            {
                event.stopPropagation();
                entry.window.destroy();

                if(this._selectedWindow === entry.window) 
                {
                    this._selectedWindow = null;
                    this._treeEl.innerHTML = '';
                }

                this.renderOpenList();
            });

            row.appendChild(label);
            row.appendChild(closeBtn);
            this._openListEl.appendChild(row);
        }
    }

    private selectWindow(window: IWindow, node: IWindow | null = null): void
    {
        this._selectedWindow = window;
        this._selectedNodeWindow = node;
        this.refreshTree();
        this.renderOpenList();
    }

    private refreshTree(): void 
    {
        this._treeEl.innerHTML = '';

        if(!this._selectedWindow || this._selectedWindow.disposed) 
        {
            this._selectedWindow = null;

            return;
        }

        const snapshot = WindowTreeInspector.snapshot(this._selectedWindow);
        let overlaps: IOverlapWarning[] | null = null;

        try 
        {
            overlaps = findOverlaps(snapshot);
        }
        catch (error) 
        {
            log.warn('Overlap detection failed', error);
        }

        const overlappingWindows = new Set<IWindow>();

        for(const overlap of overlaps ?? [])
        {
            overlappingWindows.add(overlap.a.window);
            overlappingWindows.add(overlap.b.window);
        }

        let problems: IWindowProblem[] = [];

        try
        {
            problems = collectProblems(snapshot, this._canvas);
        }
        catch (error)
        {
            log.warn('Problem detection failed', error);
        }

        const problemKinds = problemsByWindow(problems);

        const toolbar = document.createElement('div');

        toolbar.className = 'hwd-tree-toolbar';

        const selectedNode = this._selectedNodeWindow ? findNodeByWindow(snapshot, this._selectedNodeWindow) : null;

        toolbar.appendChild(this.createActionButton(
            'Copy report',
            'Problems, overlaps, layout source, ancestor chain, full tree and captured warnings - everything a bug report needs, in one paste',
            () => copyText(buildDiagnosticReport(snapshot, this._canvas, selectedNode))));

        toolbar.appendChild(this.createActionButton(
            'Copy PNG',
            'Copies the live canvas pixels under the selected node as an image (falls back to a download when the browser refuses clipboard images)',
            () =>
            {
                const target = this._selectedNodeWindow ?? this._selectedWindow;

                if(!target) return Promise.resolve('No node selected');

                return copyWindowImage(target, this._canvas, (selectedNode ?? snapshot).name);
            }));

        toolbar.appendChild(this.createActionButton(
            'Layout source',
            'Which registered layout XML declares the selected node, scored across its whole ancestor chain',
            () => copyText(findLayoutSources((selectedNode ?? snapshot).window))));

        toolbar.appendChild(this.createActionButton(
            'Copy pixels',
            'Reads the real on-screen canvas at the selected node global rect, plus the node own pre-composite render buffer',
            () =>
            {
                const target = this._selectedNodeWindow ?? this._selectedWindow;

                if(!target) return Promise.resolve('No node selected');

                return copyText(dumpWindowPixels(target, this._canvas));
            }));

        if(overlaps === null)
        {
            const notice = document.createElement('span');

            notice.className = 'hwd-overlap-count';
            notice.textContent = 'Overlap check skipped (tree too large)';
            toolbar.appendChild(notice);
        }
        else if(overlaps.length > 0) 
        {
            const warning = document.createElement('span');

            warning.className = 'hwd-overlap-count';
            warning.textContent = `⚠ ${overlaps.length} overlap${overlaps.length > 1 ? 's' : ''}`;
            toolbar.appendChild(warning);
        }

        if(problems.length > 0)
        {
            const chip = document.createElement('span');

            chip.className = 'hwd-problem-count';
            chip.textContent = `\u26D4 ${problems.length} problem${problems.length > 1 ? 's' : ''}`;
            toolbar.appendChild(chip);
        }

        this._treeEl.appendChild(toolbar);

        // The whole point of the panel: the nodes that cannot be drawing what
        // they claim to, listed above the tree instead of hidden inside it.
        if(problems.length > 0)
        {
            const problemList = document.createElement('div');

            problemList.className = 'hwd-problem-list';

            for(const problem of problems)
            {
                const row = document.createElement('div');

                row.className = 'hwd-problem-row';
                row.textContent = `[${problem.kind}] "${problem.node.name}" ${problem.detail}`;
                row.title = problem.detail;
                row.addEventListener('click', () =>
                {
                    this._selectedNodeWindow = problem.node.window;
                    this.showDetailPanel(problem.node);
                    this.positionHighlight(this._selectedHighlight, problem.node.globalRect);
                });
                row.addEventListener('mouseenter', () => this.positionHighlight(this._hoverHighlight, problem.node.globalRect));
                row.addEventListener('mouseleave', () => this.hideHighlight(this._hoverHighlight));
                problemList.appendChild(row);
            }

            this._treeEl.appendChild(problemList);
        }

        const list = document.createElement('div');

        list.className = 'hwd-tree-list';
        this.appendTreeNode(list, snapshot, 0, overlappingWindows, problemKinds);
        this._treeEl.appendChild(list);

        if(this._selectedNodeWindow)
        {
            if(selectedNode)
            {
                this.showDetailPanel(selectedNode);
                this.positionHighlight(this._selectedHighlight, selectedNode.globalRect);
            }
            else
            {
                this._selectedNodeWindow = null;
                this.hideHighlight(this._selectedHighlight);
            }
        }
    }

    /**
     * One button whose label reports what its own action returned. Every
     * toolbar action is a clipboard write that fails silently otherwise, and
     * each had grown its own copy of the same success/failure/restore dance.
     */
    private createActionButton(label: string, title: string, action: () => Promise<string>): HTMLButtonElement
    {
        const button = document.createElement('button');

        button.className = 'hwd-copy-btn';
        button.textContent = label;
        button.title = title;
        button.addEventListener('click', () =>
        {
            const restore = (result: string): void =>
            {
                // Hold the periodic rebuild off until the result has been read:
                // it recreates this very button, taking the label with it.
                this._suppressRefreshUntil = performance.now() + 1400;
                button.textContent = result;
                setTimeout(() =>
                {
                    button.textContent = label;
                }, 1400);
            };

            try
            {
                action().then(restore).catch((error) =>
                {
                    log.warn(`Debugger action "${label}" failed`, error);
                    restore('Failed');
                });
            }
            catch (error)
            {
                log.warn(`Debugger action "${label}" failed`, error);
                restore('Failed');
            }
        });

        return button;
    }

    private appendTreeNode(parentEl: HTMLElement, node: IWindowDebugNode, depth: number, overlappingWindows: Set<IWindow>, problemKinds: Map<IWindow, string[]>): void
    {
        const row = document.createElement('div');
        const isOverlapping = overlappingWindows.has(node.window);
        const kinds = problemKinds.get(node.window) ?? null;

        row.className = 'hwd-tree-row';
        row.style.paddingLeft = `${depth * 14}px`;
        row.textContent = `${kinds ? '⛔ ' : ''}${isOverlapping ? '⚠ ' : ''}${node.typeName} "${node.name}" (${node.rect.width}x${node.rect.height})`;

        if(kinds)
        {
            row.title = kinds.join(', ');
            row.classList.add('hwd-tree-row-problem');
        }

        if(!node.visible)
        {
            row.classList.add('hwd-tree-row-hidden');
        }

        if(isOverlapping) 
        {
            row.classList.add('hwd-tree-row-overlap');
        }

        row.addEventListener('click', (event) => 
        {
            event.stopPropagation();
            this._selectedNodeWindow = node.window;
            this.showDetailPanel(node);
            this.positionHighlight(this._selectedHighlight, node.globalRect);
        });

        row.addEventListener('mouseenter', () => this.positionHighlight(this._hoverHighlight, node.globalRect));
        row.addEventListener('mouseleave', () => this.hideHighlight(this._hoverHighlight));

        parentEl.appendChild(row);

        for(const child of node.children)
        {
            this.appendTreeNode(parentEl, child, depth + 1, overlappingWindows, problemKinds);
        }
    }

    private showDetailPanel(node: IWindowDebugNode): void
    {
        const existing = this._treeEl.querySelector('.hwd-node-detail');

        existing?.remove();

        const detail = document.createElement('pre');

        detail.className = 'hwd-node-detail';
        detail.textContent = [
            `name: ${node.name}`,
            `type: ${node.typeName} (${node.type})`,
            `style: ${node.style}  state: ${node.state}  param: ${node.param}`,
            `rect: ${node.rect.x}, ${node.rect.y}, ${node.rect.width}x${node.rect.height}`,
            `dynamicStyle: ${node.dynamicStyle || '(none)'}`,
            ...(node.textStyle ? [`text: ${formatTextStyle(node.textStyle)}`] : []),
            `tags: ${node.tags.join(', ') || '(none)'}`,
            '',
            'ancestor chain (root first):',
            buildAncestorChainText(node.window),
        ].join('\n');

        this._treeEl.insertBefore(detail, this._treeEl.firstChild);
    }

    private updatePickButton(): void 
    {
        this._pickBtn.textContent = this._pickModeActive ? 'Click anywhere to pick... (Esc to cancel)' : 'Pick element on screen';
        this._pickBtn.classList.toggle('hwd-pick-btn-active', this._pickModeActive);
    }

    private togglePickMode(): void 
    {
        if(this._pickModeActive) 
        {
            this.stopPickMode();

            return;
        }

        this._pickModeActive = true;
        this._canvas.addEventListener('mousedown', this.pickListener, {capture: true});
        this._canvas.addEventListener('mousemove', this.hoverPickListener, {capture: true});
        window.addEventListener('keydown', this.pickEscListener);
        this.updatePickButton();
    }

    private stopPickMode(): void 
    {
        this._pickModeActive = false;
        this._canvas.removeEventListener('mousedown', this.pickListener, {capture: true});
        this._canvas.removeEventListener('mousemove', this.hoverPickListener, {capture: true});
        window.removeEventListener('keydown', this.pickEscListener);
        this.hideHighlight(this._hoverHighlight);
        this.updatePickButton();
    }

    private topWindowAtEvent(event: MouseEvent): IWindow | null 
    {
        const rect = this._canvas.getBoundingClientRect();

        return Vortex.instance.windowManager.findWindowAtPoint(event.clientX - rect.left, event.clientY - rect.top);
    }

    // findWindowAtPoint() applies production hit-testing rules (only
    // INPUT_EVENT_PROCESSOR windows are returned, first match per layer
    // wins) — great for real gameplay, but it means a full-screen window
    // like the room's canvas wrapper always "wins" and you can never pick
    // whatever's layered behind/around it. This collects every window
    // whose bounds actually contain the point, deepest/topmost first, so
    // the picker can offer all of them.
    private windowsAtEvent(event: MouseEvent): IWindow[] 
    {
        const rect = this._canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const windowManager = Vortex.instance.windowManager;
        const matches: IWindow[] = [];

        for(let layer = CONTEXT_LAYER_COUNT - 1; layer >= 0; layer--) 
        {
            const desktop = windowManager.getDesktop(layer);

            if(desktop) this.collectWindowsAtPoint(desktop, x, y, matches);
        }

        return matches;
    }

    private collectWindowsAtPoint(window: IWindow, x: number, y: number, out: IWindow[]): void 
    {
        if(!window.visible) return;

        const container = window as unknown as IWindowContainer;

        if(typeof container.numChildren === 'number') 
        {
            for(let i = container.numChildren - 1; i >= 0; i--) 
            {
                const child = container.getChildAt(i);

                if(child) this.collectWindowsAtPoint(child, x, y, out);
            }
        }

        const rect = {x: 0, y: 0, width: 0, height: 0};

        window.getGlobalRectangle(rect);

        if(x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height) 
        {
            out.push(window);
        }
    }

    private onCanvasHoverPick(event: MouseEvent): void 
    {
        const hit = this.topWindowAtEvent(event);

        if(!hit) 
        {
            this.hideHighlight(this._hoverHighlight);

            return;
        }

        const globalRect = {x: 0, y: 0, width: 0, height: 0};

        hit.getGlobalRectangle(globalRect);
        this.positionHighlight(this._hoverHighlight, globalRect);
    }

    private onCanvasPick(event: MouseEvent): void 
    {
        event.preventDefault();
        event.stopImmediatePropagation();

        const matches = this.windowsAtEvent(event);

        this.stopPickMode();

        if(matches.length === 0) return;

        if(matches.length === 1) 
        {
            this.pickWindow(matches[0]);

            return;
        }

        this.showPickMenu(matches, event.clientX, event.clientY);
    }

    private pickWindow(hit: IWindow): void
    {
        // Root the tree at the window the element belongs to, not at the
        // element: picking a 49x20 bitmap used to snapshot only that bitmap,
        // so the report came back "PROBLEMS (0)" having looked at one node.
        // The hit stays selected, so the detail panel, the highlight and
        // every per-node action still point at what was actually clicked.
        const root = enclosingWindow(hit);

        if(!this._openWindows.some(entry => entry.window === root))
        {
            this._openWindows.push({id: nextOpenId++, label: root.name || root.caption || '(unnamed)', window: root});
        }

        this.setTab('layouts');
        this.selectWindow(root, root === hit ? null : hit);
    }

    private showPickMenu(matches: IWindow[], clientX: number, clientY: number): void 
    {
        document.getElementById('hwd-pick-menu')?.remove();

        const menu = document.createElement('div');

        menu.id = 'hwd-pick-menu';
        menu.className = 'hwd-pick-menu';
        menu.style.left = `${clientX}px`;
        menu.style.top = `${clientY}px`;

        const heading = document.createElement('div');

        heading.className = 'hwd-pick-menu-heading';
        heading.textContent = `${matches.length} windows here — pick one:`;
        heading.addEventListener('mousedown', (event) => this.startDrag(event, menu));
        menu.appendChild(heading);

        for(const match of matches) 
        {
            const row = document.createElement('div');

            row.className = 'hwd-pick-menu-row';
            row.textContent = `${TYPE_CODE_TO_NAME[match.type] ?? match.type} "${match.name || match.caption || '(unnamed)'}"`;

            row.addEventListener('mouseenter', () => 
            {
                const rect = {x: 0, y: 0, width: 0, height: 0};

                match.getGlobalRectangle(rect);
                this.positionHighlight(this._hoverHighlight, rect);
            });

            row.addEventListener('click', (event) => 
            {
                event.stopPropagation();
                menu.remove();
                this.hideHighlight(this._hoverHighlight);
                this.pickWindow(match);
            });

            menu.appendChild(row);
        }

        document.body.appendChild(menu);

        const margin = 8;
        const maxLeft = Math.max(margin, window.innerWidth - menu.offsetWidth - margin);
        const maxTop = Math.max(margin, window.innerHeight - menu.offsetHeight - margin);

        menu.style.left = `${Math.min(clientX, maxLeft)}px`;
        menu.style.top = `${Math.min(clientY, maxTop)}px`;

        const closeOnClickAway = (event: MouseEvent): void => 
        {
            if(!menu.contains(event.target as Node)) 
            {
                menu.remove();
                document.removeEventListener('mousedown', closeOnClickAway, true);
            }
        };

        // Deferred so the click that opened the menu doesn't immediately close it.
        setTimeout(() => document.addEventListener('mousedown', closeOnClickAway, true), 0);
    }

    private renderSkinsList(filter: string): void 
    {
        const windowManager = Vortex.instance.windowManager;
        const descriptors = [...windowManager.elementRegistry.getAllDescriptors()]
            .sort((a, b) => (a.type + a.style).localeCompare(b.type + b.style));

        this._listEl.innerHTML = '';

        const search = document.createElement('input');

        search.type = 'text';
        search.placeholder = `Filter ${descriptors.length} type/style pairs...`;
        search.className = 'hwd-search';
        search.value = filter;
        search.addEventListener('input', () => this.renderSkinsList(search.value));

        const scroll = document.createElement('div');

        scroll.className = 'hwd-scroll';

        const lower = filter.toLowerCase();

        for(const descriptor of descriptors) 
        {
            const label = `${descriptor.type} / style ${descriptor.style} → ${descriptor.asset || '(no skin)'}`;

            if(lower && !label.toLowerCase().includes(lower)) continue;

            const row = document.createElement('div');

            row.className = 'hwd-row';
            row.textContent = label;
            row.addEventListener('click', () => this.previewSkin(descriptor));
            scroll.appendChild(row);
        }

        this._listEl.appendChild(search);
        this._listEl.appendChild(scroll);
    }

    private previewSkin(descriptor: IElementDescriptor): void 
    {
        const windowManager = Vortex.instance.windowManager;
        const renderer = windowManager.getRendererByTypeAndStyle(descriptor.typeId, descriptor.style);

        this._treeEl.innerHTML = '';
        this._openListEl.innerHTML = '';

        const heading = document.createElement('div');

        heading.className = 'hwd-heading';
        heading.textContent = `${descriptor.type} / style ${descriptor.style} (${descriptor.asset || 'no skin'})`;
        this._treeEl.appendChild(heading);

        if(!renderer) 
        {
            const empty = document.createElement('div');

            empty.textContent = 'No renderer registered for this type/style (skin assets not loaded yet?)';
            this._treeEl.appendChild(empty);

            return;
        }

        const frames = SkinPreviewRenderer.renderStates(renderer);

        if(frames.length === 0) 
        {
            const empty = document.createElement('div');

            empty.textContent = 'Renderer has no drawable states.';
            this._treeEl.appendChild(empty);

            return;
        }

        const grid = document.createElement('div');

        grid.className = 'hwd-skin-grid';

        for(const frame of frames) 
        {
            const cell = document.createElement('div');

            cell.className = 'hwd-skin-cell';

            const canvasEl = document.createElement('canvas');

            canvasEl.width = frame.canvas.width;
            canvasEl.height = frame.canvas.height;

            const ctx = canvasEl.getContext('2d');

            ctx?.drawImage(frame.canvas, 0, 0);

            const label = document.createElement('div');

            label.textContent = `${frame.stateName} (${frame.canvas.width}x${frame.canvas.height})`;

            cell.appendChild(canvasEl);
            cell.appendChild(label);
            grid.appendChild(cell);
        }

        this._treeEl.appendChild(grid);
    }

    private positionHighlight(el: HTMLDivElement, globalRect: {
        x: number;
        y: number;
        width: number;
        height: number
    }): void 
    {
        const canvasRect = this._canvas.getBoundingClientRect();

        el.style.display = 'block';
        el.style.left = `${canvasRect.left + globalRect.x}px`;
        el.style.top = `${canvasRect.top + globalRect.y}px`;
        el.style.width = `${globalRect.width}px`;
        el.style.height = `${globalRect.height}px`;
    }

    private hideHighlight(el: HTMLDivElement): void 
    {
        el.style.display = 'none';
    }

    private loop(): void 
    {
        this._rafId = requestAnimationFrame(() => this.loop());

        if(this._selectedWindow) 
        {
            if(this._selectedWindow.disposed) 
            {
                this._selectedWindow = null;
                this.hideHighlight(this._selectedHighlight);
                this.renderOpenList();
            }
            else 
            {
                const rect = {x: 0, y: 0, width: 0, height: 0};

                this._selectedWindow.getGlobalRectangle(rect);
                this.positionHighlight(this._selectedHighlight, rect);
            }
        }

        const now = performance.now();

        if(now - this._lastTreeRefresh > 1000 && now >= this._suppressRefreshUntil)
        {
            this._lastTreeRefresh = now;

            if(this._activeTab === 'layouts') 
            {
                this.renderOpenList();

                if(this._selectedWindow && !this._pickModeActive) 
                {
                    this.refreshTree();
                }
            }
        }
    }
}

// Walks IWindow.parent up to the root so a floating/misplaced window's real
// attachment point (which desktop/layer, or none at all) is visible - the
// tree view above only ever shows descendants of whatever was picked/opened,
// never ancestors, so there was previously no way to tell "nested correctly
// under the catalog window" apart from "orphaned directly under a desktop".
function buildAncestorChainText(window: IWindow): string
{
    const chain: IWindow[] = [];
    let current: IWindow | null = window;
    let guard = 0;

    while(current && guard++ < 64)
    {
        chain.push(current);
        current = current.parent;
    }

    chain.reverse();

    return chain
        .map((win, depth) => `${'  '.repeat(depth)}${TYPE_CODE_TO_NAME[win.type] ?? win.type} "${win.name || win.caption || '(unnamed)'}" (${win.x}, ${win.y}, ${win.width}x${win.height}) visible=${win.visible}`)
        .join('\n');
}

// The frame-ish types a user would point at and call "the window". Walking
// all the way to the desktop instead would root the tree at a container with
// thousands of children; stopping at the frame keeps the scope bounded to the
// thing that was opened.
const WINDOW_ROOT_TYPES = new Set<number>([
    WindowType.FRAME,
    WindowType.FRAME_THIN,
    WindowType.FRAME_THICK,
    WindowType.FRAME_NOTIFY,
    WindowType.BUBBLE,
    WindowType.BUBBLE_POINTER_UP,
    WindowType.BUBBLE_POINTER_RIGHT,
    WindowType.BUBBLE_POINTER_DOWN,
    WindowType.BUBBLE_POINTER_LEFT,
    WindowType.TOOLTIP,
    WindowType.NOTIFY,
]);

// Falls back to the window itself when nothing frame-like encloses it - a
// toolbar button parented straight to a desktop has no window to widen to.
function enclosingWindow(window: IWindow): IWindow
{
    let current: IWindow | null = window;
    let guard = 0;

    while(current && guard++ < 64)
    {
        if(WINDOW_ROOT_TYPES.has(current.type)) return current;

        current = current.parent;
    }

    return window;
}

// `textWidth`/`textHeight` are what the controller measured; the rect next to
// them is the box that came out of it. The two disagreeing, or antiAliasType
// not being the value the layout declared, is what separates "this text is
// styled wrong" from "this text is positioned wrong" - and neither is visible
// from the rect alone.
function formatTextStyle(style: NonNullable<IWindowDebugNode['textStyle']>): string
{
    return `style="${style.styleName}" font="${style.fontFace}" size=${style.fontSize}${style.bold ? ' bold' : ''}${style.italic ? ' italic' : ''}`
        + ` aa=${style.antiAliasType} autoSize=${style.autoSize} leading=${style.leading}`
        + ` color=#${(style.textColor >>> 0).toString(16).padStart(6, '0')}`
        + ` measured=${Math.round(style.textWidth)}x${Math.round(style.textHeight)}`;
}

function findNodeByWindow(node: IWindowDebugNode, window: IWindow): IWindowDebugNode | null
{
    if(node.window === window) 
    {
        return node;
    }

    for(const child of node.children) 
    {
        const found = findNodeByWindow(child, window);

        if(found) return found;
    }

    return null;
}

const TEXT_LIKE_TYPES = new Set<number>([
    WindowType.TEXT,
    WindowType.LABEL,
    WindowType.LINK,
    WindowType.FORMATTED_TEXT,
    WindowType.TEXTFIELD,
    WindowType.PASSWORD,
    WindowType.HTML,
]);

// Best-effort check for "does this window actually draw pixels", reusing
// the same signals WindowComposite itself draws from (background fill,
// bitmap wrapper types, text content, or a bound skin renderer for its
// type+style) — not a guess, but it can still miss dynamic/animated
// content that isn't reflected in a single snapshot.
// Content-shape check only — does NOT account for a hidden ancestor
// suppressing this node; findOverlaps() tracks effective (ancestor-aware)
// visibility separately, since a node's own `visible` flag says nothing
// about whether an invisible parent is hiding it from the composite.
function hasVisualContent(node: IWindowDebugNode): boolean 
{
    if(node.rect.width <= 0 || node.rect.height <= 0) return false;

    const window = node.window;

    if(window.background) return true;

    if(window.type === WindowType.BITMAP_WRAPPER || window.type === WindowType.STATIC_BITMAP_WRAPPER) return true;

    // Some controllers' caption getter can return non-string (undefined
    // has been observed in the wild) despite the IWindow type contract.
    if(TEXT_LIKE_TYPES.has(window.type) && typeof node.caption === 'string' && node.caption.trim() !== '') return true;

    return Vortex.instance.windowManager.getRendererByTypeAndStyle(window.type, window.style) !== null;
}

interface IOverlapWarning {
    a: IWindowDebugNode;
    b: IWindowDebugNode;
}

// Flags text that collides with other text: two labels sharing pixels is
// the one overlap that always looks broken on screen.
//
// Every other pairing was noise. Across two real windows the geometric
// version produced thirteen warnings and not one bug: an icon straddling two
// background panels, a counter pill sitting on the artwork it belongs to, an
// arrow deliberately poking into the panel it points at. Ancestor/descendant
// pairs and full containment are excluded for the same reason - a child
// inside its parent is layering, not collision.
const MIN_OVERLAP_PX = 3;
// The comparison below is O(n^2) over every node in the selected subtree —
// fine for a dialog, not for something like the whole desktop or a room
// list with thousands of entries. Skip rather than freeze the tab.
const MAX_OVERLAP_NODES = 400;

// Returns null when the subtree is too large to check safely.
function findOverlaps(root: IWindowDebugNode): IOverlapWarning[] | null 
{
    const flat: Array<{ node: IWindowDebugNode; ancestors: Set<IWindow>; effectivelyVisible: boolean }> = [];

    const walk = (node: IWindowDebugNode, ancestors: Set<IWindow>, parentVisible: boolean): void => 
    {
        const effectivelyVisible = parentVisible && node.visible;

        flat.push({node, ancestors, effectivelyVisible});

        const childAncestors = new Set(ancestors);

        childAncestors.add(node.window);

        for(const child of node.children) 
        {
            walk(child, childAncestors, effectivelyVisible);
        }
    };

    walk(root, new Set(), true);

    if(flat.length > MAX_OVERLAP_NODES) 
    {
        return null;
    }

    const warnings: IOverlapWarning[] = [];

    for(let i = 0; i < flat.length; i++) 
    {
        const a = flat[i];

        if(!a.effectivelyVisible || !TEXT_LIKE_TYPES.has(a.node.type) || !hasVisualContent(a.node)) continue;

        for(let j = i + 1; j < flat.length; j++)
        {
            const b = flat[j];

            if(a.ancestors.has(b.node.window) || b.ancestors.has(a.node.window)) continue;
            if(!b.effectivelyVisible || !TEXT_LIKE_TYPES.has(b.node.type) || !hasVisualContent(b.node)) continue;

            // One rect wholly inside the other is how every layout stacks a
            // label or an icon on its own background - normal layering, and
            // it was drowning the real collisions: a quest tile reported five
            // overlaps, all of them content sitting on its own backdrop.
            if(contains(a.node.globalRect, b.node.globalRect) || contains(b.node.globalRect, a.node.globalRect)) continue;

            const overlapW = Math.min(a.node.globalRect.x + a.node.globalRect.width, b.node.globalRect.x + b.node.globalRect.width)
                - Math.max(a.node.globalRect.x, b.node.globalRect.x);
            const overlapH = Math.min(a.node.globalRect.y + a.node.globalRect.height, b.node.globalRect.y + b.node.globalRect.height)
                - Math.max(a.node.globalRect.y, b.node.globalRect.y);

            if(overlapW >= MIN_OVERLAP_PX && overlapH >= MIN_OVERLAP_PX)
            {
                warnings.push({a: a.node, b: b.node});
            }
        }
    }

    return warnings;
}

function formatNodeText(node: IWindowDebugNode, depth: number, overlaps: IOverlapWarning[] | null, marks: Map<IWindow, string[]> | null = null): string 
{
    const indent = '  '.repeat(depth);
    const isInvolved = overlaps?.some(o => o.a.window === node.window || o.b.window === node.window) ?? false;
    const problemKinds = marks?.get(node.window) ?? null;
    const marker = (isInvolved ? '  [OVERLAP]' : '') + (problemKinds ? `  [${problemKinds.join('] [')}]` : '');
    const r = node.rect;
    const g = node.globalRect;
    const bmpSize = node.bitmapSize ? ` bitmapSize=${node.bitmapSize.width}x${node.bitmapSize.height}` : '';
    const bmpParams = node.bitmapParams
        ? ` [stretchedX=${node.bitmapParams.stretchedX} stretchedY=${node.bitmapParams.stretchedY}`
        + ` zoomX=${node.bitmapParams.zoomX} zoomY=${node.bitmapParams.zoomY}`
        + ` pivotPoint=${node.bitmapParams.pivotPoint} flipX=${node.bitmapParams.flipX} flipY=${node.bitmapParams.flipY}]`
        : '';
    const assetInfo = node.assetUri !== null
        ? ` assetUri="${node.assetUri}" bitmapLoaded=${node.bitmapLoaded}${bmpSize}${bmpParams}`
        : (node.bitmapLoaded !== null ? ` bitmapLoaded=${node.bitmapLoaded}${bmpSize}` : '');
    const textInfo = node.textStyle ? ` ${formatTextStyle(node.textStyle)}` : '';

    // Mirrors WindowRendererItem.render()'s own dispatch check: a window whose
    // (type, style) has no registered skin renderer - or whose renderer can't
    // draw the window's current state - silently renders nothing at all, no
    // matter how correct its own bitmap/position data is.
    const rendererInfo = ((): string =>
    {
        try
        {
            const renderer = Vortex.instance.windowManager.getRendererByTypeAndStyle(node.type, node.style);

            return renderer
                ? ` renderer=${renderer.constructor.name} drawableAtState=${renderer.isStateDrawable(node.state)}`
                : ' renderer=NONE';
        }
        catch
        {
            return ' renderer=<error>';
        }
    })();

    let text = `${indent}${node.typeName} "${node.name}" rect=(${r.x},${r.y},${r.width}x${r.height}) `
        + `global=(${g.x},${g.y},${g.width}x${g.height}) style=${node.style} state=${node.state} `
        + `param=${node.param} visible=${node.visible}${node.clipping ? ' clipping' : ''}${assetInfo}${textInfo}${rendererInfo}${marker}\n`;

    for(const child of node.children) 
    {
        text += formatNodeText(child, depth + 1, overlaps, marks);
    }

    return text;
}

/**
 * Reads the REAL on-screen pixels for a window's global rect directly off the
 * live game canvas (not a re-render/reconstruction) - so it reflects whatever
 * clipping/compositing/caching actually happened this frame, including bugs
 * that only manifest in the full desktop composite and don't reproduce in an
 * isolated re-render. No AS3 equivalent - debug-only.
 */
/**
 * Walks the ancestor chain accumulating offsetX/offsetY + x/y at every level,
 * exactly like WindowComposite.compositeWindow()'s `absX = offsetX + window.x
 * + window.offsetX` recursion does. getGlobalRectangle() (IWindow's own public
 * API) only accumulates x/y - it never adds offsetX/offsetY at any level - so
 * the two can disagree whenever something (e.g. a dynamic style's per-state
 * offsetX/offsetY, see WindowController.applyDynamicStyleByState()) sets a
 * non-zero offset anywhere in the chain. No AS3 equivalent - debug-only.
 */
function computeTrueCompositePosition(window: IWindow): {x: number; y: number}
{
    let x = 0;
    let y = 0;
    let current: IWindow | null = window;

    while(current)
    {
        x += current.x + current.offsetX;
        y += current.y + current.offsetY;
        current = current.parent;
    }

    return {x, y};
}

function dumpWindowPixels(window: IWindow, canvas: HTMLCanvasElement): string
{
    const rect = {x: 0, y: 0, width: 0, height: 0};

    window.getGlobalRectangle(rect);

    const truePos = computeTrueCompositePosition(window);
    const positionMismatch = truePos.x !== rect.x || truePos.y !== rect.y;

    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const x = positionMismatch ? Math.round(truePos.x) : Math.round(rect.x);
    const y = positionMismatch ? Math.round(truePos.y) : Math.round(rect.y);

    function dumpCanvasRegion(source: CanvasImageSource, sx: number, sy: number, label: string): string
    {
        const crop = new OffscreenCanvas(w, h);
        const cctx = crop.getContext('2d');

        if(!cctx) throw new Error('Could not get 2D context for pixel crop');

        cctx.imageSmoothingEnabled = false;
        cctx.drawImage(source, sx, sy, w, h, 0, 0, w, h);

        const data = cctx.getImageData(0, 0, w, h).data;

        // Run-length: a UI row is mostly flat, so listing every pixel spent
        // hundreds of columns restating one colour. Lossless, and short
        // exactly where there is nothing to see.
        function rowText(row: number): string
        {
            const parts: string[] = [];
            let run = 1;

            for(let px = 1; px <= w; px++)
            {
                const i = (row * w + px) * 4;
                const prev = (row * w + px - 1) * 4;
                const same = px < w
                    && data[i] === data[prev]
                    && data[i + 1] === data[prev + 1]
                    && data[i + 2] === data[prev + 2]
                    && data[i + 3] === data[prev + 3];

                if(same)
                {
                    run++;

                    continue;
                }

                const colour = `${data[prev]},${data[prev + 1]},${data[prev + 2]},${data[prev + 3]}`;

                parts.push(run > 1 ? `${colour} x${run}` : colour);
                run = 1;

                if(parts.length >= MAX_PIXEL_DUMP_RUNS)
                {
                    parts.push(`... to x=${w - 1}`);

                    break;
                }
            }

            return parts.join(' | ');
        }

        let opaque = 0;

        for(let i = 3; i < data.length; i += 4)
        {
            if(data[i] > 0) opaque++;
        }

        const rows = Math.min(h, MAX_PIXEL_DUMP_ROWS);

        let out = `${label} (${sx},${sy},${w}x${h}): ${Math.round((opaque / (w * h)) * 100)}% of pixels have alpha > 0\n`;

        for(let row = 0; row < rows; row++)
        {
            out += `y${row}: ${rowText(row)}\n`;
        }

        if(rows < h) out += `... ${h - rows} further row(s) omitted\n`;

        return out;
    }

    let text = positionMismatch
        ? `getGlobalRectangle()=(${rect.x},${rect.y}) vs true composite position=(${truePos.x},${truePos.y}) - MISMATCH, using the latter for this dump\n\n`
        : '';

    text += dumpCanvasRegion(canvas, x, y, 'composited canvas pixel dump for global rect');

    // Also dump the window's OWN render buffer (pre-compositing) at its local
    // origin, so a blank composite can be told apart from "BitmapDataRenderer
    // never drew anything into this window's buffer in the first place" vs
    // "it drew fine, but compositing never blitted/positioned it onto the
    // screen". No AS3 equivalent - debug-only.
    try
    {
        const renderer = Vortex.instance.windowManager.getWindowRenderer();
        const buffer = (renderer?.getDrawBufferForRenderable(window) ?? null) as OffscreenCanvas | null;

        if(buffer)
        {
            text += '\n' + dumpCanvasRegion(buffer, 0, 0, 'own render buffer pixel dump (pre-composite)');
        }
        else
        {
            text += '\nown render buffer: null/none\n';
        }
    }
    catch (error)
    {
        text += `\nown render buffer: <error: ${(error as Error).message}>\n`;
    }

    return text;
}

function injectStyles(): void
{
    if(stylesInjected) return;

    stylesInjected = true;

    const style = document.createElement('style');

    style.textContent = `
.hwd-toggle-btn {
    /* Last in the row the site starts at top left: [back to web] [fullscreen] [report] [debugger].
       The first two are the site's own (vortex-web Client.svelte), the third is the bug reporter
       at left 124px; this one follows it. Same gold pill so the four read as one strip rather than
       as three different products, restated in plain CSS because this bundle has no Tailwind. */
    position: fixed;
    top: 12px;
    left: 186px;
    padding: 6px 12px;
    border-radius: 0 5px 5px 0;
    background: #ffb900;
    border: 2px solid #ffea00;
    color: #000;
    box-shadow: -1px 4px 0 rgb(0 0 0 / 30%);
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    z-index: 999997;
}
.hwd-toggle-btn:hover { background: #ffd400; border-color: #fffd70; }
.hwd-toggle-btn:active {
    transform: translateY(2px); background: #f89400; border-color: #ffce37;
    box-shadow: -1px 2px 0 rgb(0 0 0 / 30%);
}
/* Open: the pressed shade held, so the strip shows which control is active without a second hue. */
.hwd-toggle-btn.hwd-toggle-active { background: #f89400; border-color: #ffce37; }
.hwd-root {
    position: fixed;
    top: 12px;
    right: 12px;
    width: 420px;
    max-height: calc(100vh - 84px);
    background: #1e1e1e;
    color: #ddd;
    font: 12px/1.4 monospace;
    border: 1px solid #444;
    border-radius: 6px;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5);
}
.hwd-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: #2a2a2a; font-weight: bold; border-bottom: 1px solid #444; border-radius: 6px 6px 0 0; cursor: move; user-select: none; }
.hwd-close { background: none; border: none; color: #ddd; font-size: 16px; cursor: pointer; line-height: 1; }
.hwd-toolbar { padding: 6px 8px; border-bottom: 1px solid #444; }
.hwd-toolbar-globals { display: flex; gap: 6px; margin-top: 6px; }
.hwd-toolbar-globals button { flex: 1; }
.hwd-tabs { display: flex; border-bottom: 1px solid #444; }
.hwd-tabs button { flex: 1; background: #262626; color: #aaa; border: none; padding: 6px; cursor: pointer; }
.hwd-tabs button.hwd-tab-active { background: #1e1e1e; color: #fff; border-bottom: 2px solid #4a9eff; }
.hwd-body { display: flex; flex-direction: column; overflow: hidden; flex: 1; }
.hwd-search { margin: 6px; padding: 4px 6px; background: #111; color: #ddd; border: 1px solid #444; border-radius: 4px; }
.hwd-list { display: flex; flex-direction: column; max-height: 220px; }
.hwd-scroll { overflow-y: auto; max-height: 190px; border-top: 1px solid #333; }
.hwd-row { padding: 3px 8px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hwd-row:hover { background: #2f3d52; }
.hwd-heading { padding: 6px 8px; font-weight: bold; color: #4a9eff; }
.hwd-detail { overflow-y: auto; flex: 1; border-top: 1px solid #333; }
.hwd-open-row { display: flex; justify-content: space-between; padding: 3px 8px; cursor: pointer; }
.hwd-open-row span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hwd-open-row button { background: none; border: none; color: #e88; cursor: pointer; }
.hwd-row-selected { background: #35506e; }
.hwd-tree { padding: 4px 8px 10px; }
.hwd-pick-btn { width: 100%; margin: 0; padding: 6px; background: #2f3d52; color: #fff; border: 1px solid #4a9eff; border-radius: 4px; cursor: pointer; }
.hwd-pick-btn.hwd-pick-btn-active { background: #ff5050; border-color: #ff5050; }
.hwd-tree-row { cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hwd-tree-row:hover { background: #2f3d52; }
.hwd-tree-row-hidden { color: #777; font-style: italic; }
.hwd-tree-row-overlap { color: #ff9d4d; }
.hwd-tree-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
.hwd-copy-btn.hwd-copy-btn-armed { background: #35506e; border-color: #4a9eff; color: #fff; }
.hwd-tree-row-problem { color: #ff6b6b; }
.hwd-problem-count { color: #ff6b6b; font-weight: bold; }
.hwd-problem-list { border: 1px solid #5a2a2a; background: #2a1414; border-radius: 4px; margin-bottom: 6px; max-height: 160px; overflow-y: auto; }
.hwd-problem-row { padding: 3px 6px; cursor: pointer; color: #ffb0b0; border-bottom: 1px solid #3a1c1c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hwd-problem-row:hover { background: #3d1e1e; }
.hwd-copy-btn { padding: 4px 8px; background: #2a2a2a; color: #ddd; border: 1px solid #555; border-radius: 4px; cursor: pointer; }
.hwd-copy-btn:hover { border-color: #4a9eff; }
.hwd-overlap-count { color: #ff9d4d; font-weight: bold; }
.hwd-node-detail { background: #111; border: 1px solid #333; border-radius: 4px; padding: 6px; margin: 4px 0; white-space: pre-wrap; }
.hwd-skin-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.hwd-skin-cell { text-align: center; }
.hwd-skin-cell canvas { image-rendering: pixelated; background: repeating-conic-gradient(#333 0% 25%, #2a2a2a 0% 50%) 50% / 12px 12px; border: 1px solid #444; }
.hwd-highlight { position: fixed; pointer-events: none; z-index: 999998; display: none; box-sizing: border-box; }
.hwd-highlight-selected { border: 2px solid #ff5050; background: rgba(255,80,80,0.08); }
.hwd-highlight-hover { border: 2px dashed #4a9eff; background: rgba(74,158,255,0.08); }
.hwd-pick-menu { position: fixed; z-index: 1000000; background: #1e1e1e; border: 1px solid #4a9eff; border-radius: 4px; box-shadow: 0 4px 24px rgba(0,0,0,0.5); font: 12px/1.4 monospace; color: #ddd; max-width: 320px; max-height: 260px; overflow-y: auto; }
.hwd-pick-menu-heading { padding: 6px 8px; font-weight: bold; color: #4a9eff; border-bottom: 1px solid #444; white-space: nowrap; cursor: move; user-select: none; }
.hwd-pick-menu-row { padding: 4px 8px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hwd-pick-menu-row:hover { background: #2f3d52; }
`;
    document.head.appendChild(style);
}

/* ------------------------------------------------------------------------ *
 * Diagnostics: problem detection, log capture, image export, layout lookup.
 *
 * All of it exists for one reason: a visual bug in this port almost never
 * throws. The tree builds, every rect is plausible, and the pixels simply
 * never arrive — so a raw tree dump makes the reader hunt for the one node
 * that is wrong. The rules below each encode one of the ways that actually
 * happens, so a report can name the cause instead of only describing the
 * scene. No AS3 equivalent — debug-only.
 * ------------------------------------------------------------------------ */

interface IWindowProblem
{
    node: IWindowDebugNode;
    kind: string;
    detail: string;
}

const MAX_PROBLEMS = 80;
// Layouts routinely round a child a pixel or two past its parent; only a
// clip big enough to eat a glyph is worth a line in the report.
const MIN_OVERFLOW_PX = 2;

function rectsIntersect(a: IWindowDebugRect, b: IWindowDebugRect): boolean
{
    return a.x < b.x + b.width
        && b.x < a.x + a.width
        && a.y < b.y + b.height
        && b.y < a.y + a.height;
}

function contains(outer: IWindowDebugRect, inner: IWindowDebugRect): boolean
{
    return inner.x >= outer.x
        && inner.y >= outer.y
        && inner.x + inner.width <= outer.x + outer.width
        && inner.y + inner.height <= outer.y + outer.height;
}

// Types that are supposed to paint nothing: a region is a hit area, an
// activator an interaction layer. Flagging them as "draws nothing" was
// reporting them working as designed.
const NON_DRAWING_TYPES = new Set<number>([WindowType.NULL, WindowType.REGION, WindowType.ACTIVATOR]);

// An item list's own inner container goes negative by exactly one spacing when
// every item is hidden, and that is Flash's arithmetic, not a port bug:
// ItemListController accumulates only visible children, then subtracts the
// trailing spacing under `if(numChildren > 0)` - the total count, not the
// visible one. The primary tree has the same guard, so an empty horizontal
// list lands at -spacing there too and this must not be "fixed".
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ItemListController.as::updateScrollAreaRegion()
const ITEM_LIST_TYPES = new Set<number>([
    WindowType.ITEMLIST,
    WindowType.ITEMLIST_HORIZONTAL,
    WindowType.ITEMGRID,
    WindowType.ITEMGRID_VERTICAL,
    WindowType.ITEMGRID_HORIZONTAL,
    WindowType.SCROLLABLE_ITEMLIST,
    WindowType.SCROLLABLE_ITEMLIST_VERTICAL,
    WindowType.SCROLLABLE_ITEMLIST_HORIZONTAL,
    WindowType.SCROLLABLE_ITEMGRID_VERTICAL,
]);

function isEmptyListContainer(node: IWindowDebugNode, parent: IWindowDebugNode | null): boolean
{
    return parent !== null
        && ITEM_LIST_TYPES.has(parent.type)
        && !node.children.some(child => child.visible);
}

// A caption that is still a localization key: dotted, lowercase, no spaces.
// getString() returns the key itself on a miss instead of throwing, so an
// absent translation reaches the screen looking like a rendered label -
// which is exactly what a quest tile was showing as "quests.identity.nam".
const LOCALIZATION_KEY = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/;

// Whether anything in this subtree would actually be seen if it were shown.
// Hiding an empty node is the normal way a counter badge or an optional line
// switches itself off, and reporting that as a bug buries the cases where a
// node with real content is sitting under a hidden parent.
function subtreeHasContent(node: IWindowDebugNode): boolean
{
    // A hidden descendant is not content: an empty timer list still holds the
    // caption of the last quest that had one, and counting that made a list
    // that had correctly collapsed to nothing look like a broken layout.
    if(!node.visible) return false;

    if(typeof node.caption === 'string' && node.caption.trim() !== '') return true;

    if(node.bitmapLoaded === true) return true;

    return node.children.some(subtreeHasContent);
}

function collectProblems(root: IWindowDebugNode, canvas: HTMLCanvasElement): IWindowProblem[]
{
    const problems: IWindowProblem[] = [];
    const canvasRect: IWindowDebugRect = {x: 0, y: 0, width: canvas.width, height: canvas.height};

    const walk = (node: IWindowDebugNode, parent: IWindowDebugNode | null, parentVisible: boolean, clippingAncestors: IWindowDebugNode[]): void =>
    {
        if(problems.length >= MAX_PROBLEMS) return;

        const effectivelyVisible = parentVisible && node.visible;
        const push = (kind: string, detail: string): void =>
        {
            if(problems.length < MAX_PROBLEMS) problems.push({node, kind, detail});
        };

        // A bitmap window with no URI takes its pixels from code. Nothing here
        // can say which code, but it can say that nothing arrived — which is
        // all an invisible icon leaves behind.
        if(effectivelyVisible && node.assetUri === null && node.bitmapLoaded === false)
        {
            push('no-bitmap', 'a bitmap window with no asset_uri and no bitmapData - nothing ever assigned it any pixels');
        }

        // The asset key was accepted but nothing ever loaded behind it — the
        // shape a wrong or unregistered asset name takes, since a miss returns
        // null instead of throwing.
        if(node.assetUri !== null && node.bitmapLoaded === false)
        {
            push('asset-missing', `assetUri="${node.assetUri}" never loaded (wrong key, or the asset was registered after bootstrap)`);
        }

        // No hidden-by-ancestor rule: hiding a container and leaving its
        // children's own flags alone is how every optional panel in this UI
        // switches off, so it fired on all four it ever found and on nothing
        // else. The tree already prints the hidden parent in grey.

        if(effectivelyVisible && (node.rect.width < 0 || node.rect.height < 0) && !isEmptyListContainer(node, parent))
        {
            push('negative-size', `rect is ${node.rect.width}x${node.rect.height} - a negative dimension with no empty-list explanation`);
        }
        // A list that auto-sizes to zero because everything in it is hidden is
        // working, not broken; only a collapse with something left to show is.
        else if(effectivelyVisible && (node.rect.width === 0 || node.rect.height === 0) && subtreeHasContent(node))
        {
            push('zero-size', `rect is ${node.rect.width}x${node.rect.height} while still carrying content`);
        }

        if(effectivelyVisible && parent && node.rect.width > 0 && node.rect.height > 0 && !rectsIntersect(node.globalRect, parent.globalRect))
        {
            push('outside-parent', `global=(${node.globalRect.x},${node.globalRect.y},${node.globalRect.width}x${node.globalRect.height}) lies entirely outside parent "${parent.name}" (${parent.globalRect.x},${parent.globalRect.y},${parent.globalRect.width}x${parent.globalRect.height})`);
        }

        if(effectivelyVisible && node.rect.width > 0 && node.rect.height > 0 && !rectsIntersect(node.globalRect, canvasRect))
        {
            push('off-canvas', `global=(${node.globalRect.x},${node.globalRect.y},${node.globalRect.width}x${node.globalRect.height}) is off the ${canvas.width}x${canvas.height} canvas`);
        }

        if(effectivelyVisible && TEXT_LIKE_TYPES.has(node.type) && typeof node.caption === 'string' && LOCALIZATION_KEY.test(node.caption.trim()))
        {
            push('untranslated', `caption is "${node.caption.trim()}" - a localization key with no translation behind it`);
        }

        // Clipped content — measured against the nearest ancestor that actually
        // clips, not against the immediate parent.
        //
        // WindowComposite narrows the clip rectangle only at a window whose
        // `clipping` flag is set; a plain container passes its parent's clip
        // straight through. Testing the parent instead reported every button
        // in the me-menu, whose skin deliberately draws its border 3px outside
        // the content box and is never cut.
        if(effectivelyVisible && subtreeHasContent(node) && node.rect.width > 0 && node.rect.height > 0)
        {
            const clipper = clippingAncestors.length > 0 ? clippingAncestors[clippingAncestors.length - 1] : null;

            if(clipper && rectsIntersect(node.globalRect, clipper.globalRect))
            {
                const worst = Math.max(
                    (node.globalRect.x + node.globalRect.width) - (clipper.globalRect.x + clipper.globalRect.width),
                    (node.globalRect.y + node.globalRect.height) - (clipper.globalRect.y + clipper.globalRect.height),
                    clipper.globalRect.x - node.globalRect.x,
                    clipper.globalRect.y - node.globalRect.y);

                if(worst > MIN_OVERFLOW_PX)
                {
                    push('overflows-parent', `${node.rect.width}x${node.rect.height} sticks ${worst}px outside the clip of "${clipper.name}" (${clipper.typeName}, ${clipper.rect.width}x${clipper.rect.height}) and is cut`);
                }
            }
        }

        // A visible leaf with real size that no code path can paint: no skin
        // renderer for its (type, style), no background, no bitmap, no text.
        if(effectivelyVisible && node.children.length === 0 && node.rect.width > 0 && node.rect.height > 0 && !NON_DRAWING_TYPES.has(node.type) && !hasVisualContent(node))
        {
            push('draws-nothing', `visible leaf with nothing to draw (no renderer for type=${node.type}/style=${node.style}, no background, no bitmap, no caption)`);
        }

        const childClippers = node.clipping ? [...clippingAncestors, node] : clippingAncestors;

        for(const child of node.children)
        {
            walk(child, node, effectivelyVisible, childClippers);
        }
    };

    walk(root, null, true, []);

    return problems;
}

function problemsByWindow(problems: IWindowProblem[]): Map<IWindow, string[]>
{
    const map = new Map<IWindow, string[]>();

    for(const problem of problems)
    {
        const kinds = map.get(problem.node.window);

        if(kinds) kinds.push(problem.kind);
        else map.set(problem.node.window, [problem.kind]);
    }

    return map;
}

/* ---------------------------------------------------------------- *
 * Log capture.
 *
 * Logger.onRecord() forces the logger out of bound-console mode, which
 * costs DevTools call-site attribution on every line — so it is opt-in
 * and remembered in localStorage: the warnings worth having (missing
 * assets, unregistered layouts) are emitted during boot, long before the
 * panel is ever opened, so arming it has to survive a reload. Uncaught
 * errors are captured unconditionally — that listener costs nothing.
 * ---------------------------------------------------------------- */

const LOG_BUFFER_LIMIT = 200;
const LOG_CAPTURE_KEY = 'hwd-capture-logs';

const logBuffer: string[] = [];

function pushLogLine(line: string): void
{
    logBuffer.push(line);

    if(logBuffer.length > LOG_BUFFER_LIMIT) logBuffer.shift();
}

function formatLogArg(value: unknown): string
{
    if(typeof value === 'string') return value;

    if(value instanceof Error) return `${value.name}: ${value.message}`;

    try
    {
        return JSON.stringify(value) ?? String(value);
    }
    catch
    {
        return String(value);
    }
}

function onLogRecord(record: ILogRecord): void
{
    if(record.level < LogLevel.WARN) return;

    pushLogLine(`[${record.level === LogLevel.ERROR ? 'ERR' : 'WRN'}] ${record.name}: ${record.args.map(formatLogArg).join(' ')}`);
}

function isLogCaptureEnabled(): boolean
{
    try
    {
        return localStorage.getItem(LOG_CAPTURE_KEY) === '1';
    }
    catch
    {
        return false;
    }
}

function setLogCapture(enabled: boolean): void
{
    try
    {
        localStorage.setItem(LOG_CAPTURE_KEY, enabled ? '1' : '0');
    }
    catch
    {
        // Private mode: the listener still applies for this session, it just
        // will not survive the reload that boot-time capture needs.
    }

    Logger.onRecord(enabled ? onLogRecord : null);
}

function installErrorCapture(): () => void
{
    const onError = (event: ErrorEvent): void =>
    {
        pushLogLine(`[UNCAUGHT] ${event.message} (${event.filename}:${event.lineno})`);
    };

    const onRejection = (event: PromiseRejectionEvent): void =>
    {
        pushLogLine(`[UNHANDLED REJECTION] ${formatLogArg(event.reason)}`);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () =>
    {
        window.removeEventListener('error', onError);
        window.removeEventListener('unhandledrejection', onRejection);
    };
}

/* ---------------------------------------------------------------- *
 * Layout lookup.
 *
 * Answers the first question any picked element raises — which XML
 * declared it — by scanning the registered layouts for the node's own
 * name attribute. Nothing links a live window back to its source, so
 * this is a text match: it can return several candidates, and none at
 * all for a window built in code rather than from XML.
 * ---------------------------------------------------------------- */

const MAX_LAYOUT_HITS = 3;

// A name has to be able to identify a layout on its own. Habbo layouts number
// their repeated children ("0", "1", "2"), so matching on one of those returns
// whichever unrelated layout happens to use the same index — a picked quest
// tile named "1" was confidently reported as coming from the group forum
// settings dialog.
function isDistinctiveName(name: string): boolean
{
    return name.length >= 3 && !/^\d+$/.test(name);
}

function excerptAround(xml: string, needle: string): string
{
    const at = xml.indexOf(needle);

    if(at === -1) return '';

    return xml.slice(Math.max(0, at - 120), at + 200).replace(/\s+/g, ' ').trim();
}

/**
 * Which registered layout XML declares the picked window.
 *
 * Nothing links a live window back to its source, so this is a text match —
 * and matching the picked node's own name alone is not enough to trust. The
 * whole ancestor chain is scored instead, and the answer reports which names
 * corroborated it so a weak match is visible as one.
 */
function findLayoutSources(window: IWindow): string
{
    const chain: string[] = [];
    let current: IWindow | null = window;
    let guard = 0;

    while(current && guard++ < 64)
    {
        if(isDistinctiveName(current.name)) chain.push(current.name);

        current = current.parent;
    }

    const ownName = window.name;

    if(chain.length === 0) return `layout source: nothing in the chain up from "${ownName}" has a name distinctive enough to match on\n`;

    const windowManager = Vortex.instance.windowManager;
    let scored: Array<{layout: string; matched: string[]; excerpt: string}> = [];

    for(const layoutName of windowManager.getRegisteredWidgetLayoutNames())
    {
        let xml: string;

        try
        {
            xml = windowManager.requireWidgetLayout(layoutName, 'window debugger');
        }
        catch
        {
            continue;
        }

        const matched = chain.filter(name => xml.includes(`name="${name}"`));

        if(matched.length === 0) continue;

        scored.push({
            layout: layoutName,
            matched,
            excerpt: excerptAround(xml, `name="${matched[0]}"`),
        });
    }

    if(scored.length === 0) return `layout source for "${ownName}": no registered layout declares any of ${chain.join(', ')} (built in code?)\n`;

    // The node is declared by whichever layout names IT, full stop — a widget
    // built from its own small layout and dropped into a big window would
    // otherwise lose to that window's layout, which matches more of the
    // ancestor chain without declaring the node at all. Ancestors only break
    // ties, or answer at all when the node's own name is a bare index.
    const declaring = scored.filter(hit => hit.matched[0] === ownName);
    const narrowed = declaring.length > 0;

    if(narrowed) scored = declaring;

    scored.sort((a, b) => b.matched.length - a.matched.length);

    const best = scored[0].matched.length;
    const hits = scored.filter(hit => hit.matched.length === best).slice(0, MAX_LAYOUT_HITS);
    const confidence = narrowed
        ? ''
        : ` - "${ownName}" itself is declared by no layout, so this is the enclosing window's layout, not the node's`;

    let text = `layout source for "${ownName}" (chain: ${chain.join(' < ')})${confidence}:\n`;

    for(const hit of hits)
    {
        text += `  ${hit.layout}  [matched ${hit.matched.join(', ')}]\n      ...${hit.excerpt}...\n`;
    }

    if(scored.length > hits.length) text += `  (${scored.length - hits.length} weaker candidate(s) not listed)\n`;

    return text;
}

/* ---------------------------------------------------------------- *
 * Image export — a crop of the live canvas at the window's true
 * composite position, put on the clipboard so it can be pasted straight
 * into a bug report, and downloaded instead when the browser refuses
 * clipboard images.
 * ---------------------------------------------------------------- */

function windowScreenRect(window: IWindow): {x: number; y: number; w: number; h: number; mismatch: boolean}
{
    const rect = {x: 0, y: 0, width: 0, height: 0};

    window.getGlobalRectangle(rect);

    const truePos = computeTrueCompositePosition(window);
    const mismatch = truePos.x !== rect.x || truePos.y !== rect.y;

    return {
        x: Math.round(mismatch ? truePos.x : rect.x),
        y: Math.round(mismatch ? truePos.y : rect.y),
        w: Math.max(1, Math.round(rect.width)),
        h: Math.max(1, Math.round(rect.height)),
        mismatch,
    };
}

function cropCanvas(source: CanvasImageSource, x: number, y: number, w: number, h: number): HTMLCanvasElement
{
    const crop = document.createElement('canvas');

    crop.width = w;
    crop.height = h;

    const ctx = crop.getContext('2d');

    if(!ctx) throw new Error('Could not get a 2D context for the crop');

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, x, y, w, h, 0, 0, w, h);

    return crop;
}

async function copyWindowImage(window: IWindow, canvas: HTMLCanvasElement, label: string): Promise<string>
{
    const {x, y, w, h} = windowScreenRect(window);
    const crop = cropCanvas(canvas, x, y, w, h);
    const blob = new Promise<Blob>((resolve, reject) => crop.toBlob(
        result => result ? resolve(result) : reject(new Error('toBlob() produced nothing')),
        'image/png'));

    try
    {
        // The pending blob, not an awaited one: awaiting first spends the user
        // gesture that the clipboard write needs.
        await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]);

        return 'Copied!';
    }
    catch
    {
        const link = document.createElement('a');
        const url = URL.createObjectURL(await blob);

        link.href = url;
        link.download = `hwd-${label.replace(/[^\w.-]+/g, '_') || 'window'}-${w}x${h}.png`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);

        return 'Downloaded';
    }
}

/* ---------------------------------------------------------------- *
 * Report assembly — everything a visual bug report needs, in one paste.
 * ---------------------------------------------------------------- */

function buildDiagnosticReport(root: IWindowDebugNode, canvas: HTMLCanvasElement, selected: IWindowDebugNode | null): string
{
    const problems = collectProblems(root, canvas);
    const marks = problemsByWindow(problems);
    const cssRect = canvas.getBoundingClientRect();

    let overlaps: IOverlapWarning[] | null = null;

    try
    {
        overlaps = findOverlaps(root);
    }
    catch (error)
    {
        log.warn('Overlap detection failed', error);
    }

    let text = '=== WINDOW DEBUGGER REPORT ===\n';

    text += `canvas: ${canvas.width}x${canvas.height} backing, ${Math.round(cssRect.width)}x${Math.round(cssRect.height)} css, dpr ${window.devicePixelRatio}\n`;
    text += `root: ${root.typeName} "${root.name}" ${root.rect.width}x${root.rect.height} at global (${root.globalRect.x},${root.globalRect.y})\n`;

    if(selected)
    {
        text += `selected: ${selected.typeName} "${selected.name}" ${selected.rect.width}x${selected.rect.height} at global (${selected.globalRect.x},${selected.globalRect.y})\n`;
    }

    text += `\n--- PROBLEMS (${problems.length}${problems.length >= MAX_PROBLEMS ? ', truncated' : ''}) ---\n`;

    if(problems.length === 0) text += '  none detected\n';

    for(const problem of problems)
    {
        text += `  [${problem.kind}] ${problem.node.typeName} "${problem.node.name}": ${problem.detail}\n`;
    }

    if(overlaps === null)
    {
        text += '\n--- OVERLAPS ---\n  check skipped (tree too large)\n';
    }
    else if(overlaps.length > 0)
    {
        text += `\n--- OVERLAPS (${overlaps.length}) ---\n`;

        for(const overlap of overlaps)
        {
            text += `  "${overlap.a.name}" (${overlap.a.typeName}) overlaps "${overlap.b.name}" (${overlap.b.typeName})\n`;
        }
    }

    text += '\n--- DECLARED vs LIVE ---\n';

    try
    {
        const declared = findDeclaredMismatches(root);

        if(declared.mismatches.length > 0) text += `  ${declared.mismatches.length} value(s) the layout declares and the window does not have:\n`;
        else if(declared.checked > 0) text += `  ${declared.checked} text node(s) match their layout\n`;
        else text += '  nothing checked - no text node could be matched to a layout\n';

        for(const mismatch of declared.mismatches)
        {
            text += `  [${mismatch.key}] ${mismatch.node.typeName} "${mismatch.node.name}": ${mismatch.layout} declares ${mismatch.declared}, window has ${mismatch.live}\n`;
        }

        if(declared.unresolved > 0) text += `  (${declared.unresolved} text node(s) skipped - no layout declares that name, or two declare it equally well)\n`;

        text += `\n--- TEXT BOX HEIGHT: PORT vs FLASH ---\n`;

        if(declared.heights.length === 0) text += '  no auto-sized text node could be matched to an authored height\n';
        else
        {
            const buckets = new Map<string, {sample: IBoxHeightSample; count: number}>();

            for(const sample of declared.heights)
            {
                const key = `${sample.fontSize}|${sample.authored}|${sample.live}`;
                const bucket = buckets.get(key);

                if(bucket) bucket.count++;
                else buckets.set(key, {sample, count: 1});
            }

            let shorter = 0;
            let taller = 0;
            let exact = 0;
            let totalDelta = 0;

            for(const sample of declared.heights)
            {
                const delta = sample.live - sample.authored;

                totalDelta += delta;

                if(delta < 0) shorter++;
                else if(delta > 0) taller++;
                else exact++;
            }

            for(const {sample, count} of [...buckets.values()].sort((a, b) => b.count - a.count))
            {
                const delta = sample.live - sample.authored;

                text += `  size ${sample.fontSize}: Flash ${sample.authored}, port ${sample.live} (${delta >= 0 ? '+' : ''}${delta})`
                    + ` x${count}  e.g. "${sample.name}"\n`;
            }

            text += `  ${declared.heights.length} sampled: ${exact} exact, ${shorter} shorter, ${taller} taller,`
                + ` mean ${(totalDelta / declared.heights.length).toFixed(2)}px\n`;
        }
    }
    catch (error)
    {
        log.warn('Declared-vs-live check failed', error);
        text += '  check failed\n';
    }

    text += `\n--- LAYOUT SOURCE ---\n${findLayoutSources((selected ?? root).window)}`;
    text += `\n--- ANCESTOR CHAIN (root first) ---\n${buildAncestorChainText(root.window)}\n`;
    text += `\n--- TREE ---\n${formatNodeText(root, 0, overlaps, marks)}`;
    text += `\n--- LOGS (${logBuffer.length}) ---\n`;

    if(!isLogCaptureEnabled())
    {
        text += '  warn/error capture is OFF - arm it in the debugger toolbar and reload to catch boot-time warnings\n';
    }

    text += logBuffer.length === 0 ? '  (empty)\n' : logBuffer.map(line => `  ${line}\n`).join('');

    return text;
}

/* ---------------------------------------------------------------- *
 * Declared vs live.
 *
 * The check that was missing. Every other rule here asks whether a
 * window is internally consistent; none asked whether it is the window
 * the layout asked for. A text field rendering in the theme's font at
 * the theme's size reports perfectly healthy on every other field -
 * right rect, right renderer, drawable at its state - and looks wrong
 * on screen, which is how a `font_size="13"` shipped as 9.
 *
 * Element names are reused across layouts (2,505 names carry variables
 * across 784 layouts, and 361 of those names are declared more than
 * once), so a flat name lookup answers with the wrong layout's values.
 * A reused name is resolved the same way findLayoutSources() resolves
 * one - by how much of the ancestor chain the candidate layout also
 * declares - and a genuine tie is skipped rather than guessed at.
 *
 * Indexed once and cached: the registered layouts do not change at
 * runtime, and this parses all of them.
 * ---------------------------------------------------------------- */

interface ILayoutVarIndex
{
    /** element name -> every layout declaring it with variables (null = that layout declares it inconsistently). */
    byName: Map<string, Array<{layout: string; vars: Map<string, string> | null; height: number | null}>>;
    /** layout -> every element name in it, for chain scoring. */
    namesByLayout: Map<string, Set<string>>;
}

let layoutVarIndex: ILayoutVarIndex | null = null;

function buildLayoutVarIndex(): ILayoutVarIndex
{
    if(layoutVarIndex) return layoutVarIndex;

    const byName = new Map<string, Array<{layout: string; vars: Map<string, string> | null; height: number | null}>>();
    const namesByLayout = new Map<string, Set<string>>();
    const windowManager = Vortex.instance.windowManager;
    const parser = new DOMParser();

    for(const layout of windowManager.getRegisteredWidgetLayoutNames())
    {
        let doc: Document;

        try
        {
            doc = parser.parseFromString(windowManager.requireWidgetLayout(layout, 'window debugger'), 'text/xml');
        }
        catch
        {
            continue;
        }

        if(doc.querySelector('parsererror')) continue;

        const names = new Set<string>();

        namesByLayout.set(layout, names);

        for(const element of Array.from(doc.querySelectorAll('[name]')))
        {
            const name = element.getAttribute('name');

            if(!name) continue;

            names.add(name);

            const vars = new Map<string, string>();

            for(const child of Array.from(element.children))
            {
                if(child.tagName !== 'variables') continue;

                for(const entry of Array.from(child.children))
                {
                    const key = entry.getAttribute('key');
                    const value = entry.getAttribute('value');

                    if(key !== null && value !== null) vars.set(key, value);
                }
            }

            if(vars.size === 0) continue;

            const authored = Number(element.getAttribute('height'));
            const height = Number.isFinite(authored) && authored > 0 ? authored : null;
            const bucket = byName.get(name);
            const existing = bucket?.find(entry => entry.layout === layout);

            if(!existing)
            {
                if(bucket) bucket.push({layout, vars, height});
                else byName.set(name, [{layout, vars, height}]);

                continue;
            }

            if(existing.height !== height) existing.height = null;

            // Same name again in the same layout: usable only while every copy
            // declares the same thing. own_avatar_menu names 25 elements
            // "label" and they agree; nothing says which one built a given
            // window, so a disagreement makes the whole name unusable there.
            if(existing.vars === null) continue;

            const same = existing.vars.size === vars.size
                && [...vars].every(([key, value]) => existing.vars?.get(key) === value);

            if(!same) existing.vars = null;
        }
    }

    layoutVarIndex = {byName, namesByLayout};

    return layoutVarIndex;
}

/** Every name in a window's subtree — the fingerprint that identifies its layout. */
function subtreeNames(node: IWindowDebugNode, into: Set<string> = new Set()): Set<string>
{
    if(node.name) into.add(node.name);

    for(const child of node.children) subtreeNames(child, into);

    return into;
}

/**
 * Which layout declared this node.
 *
 * Scored on the whole window's names rather than the one chain up from the
 * node, because sibling layouts of the same widget share that chain: the
 * me-menu's `label < button < decorate < buttons < border` matches
 * own_avatar_menu and own_avatar_decorating equally well, and every one of its
 * 26 text nodes came back unresolved. The full name set separates them at
 * once — one declares `dance_menu`, `signs`, `effects`; the other does not.
 */
function resolveDeclaredVars(node: IWindowDebugNode, index: ILayoutVarIndex, windowNames: Set<string>): {layout: string; vars: Map<string, string>; height: number | null} | null
{
    const candidates = index.byName.get(node.name);

    if(!candidates || candidates.length === 0) return null;

    const usable = candidates.filter(candidate => candidate.vars !== null) as Array<{layout: string; vars: Map<string, string>; height: number | null}>;

    if(usable.length === 0) return null;

    if(usable.length === 1) return usable[0];

    const scored = usable
        .map(candidate =>
        {
            const names = index.namesByLayout.get(candidate.layout);
            let score = 0;

            if(names) for(const name of windowNames) if(names.has(name)) score++;

            return {candidate, score};
        })
        .sort((a, b) => b.score - a.score);

    // A tie means nothing here can tell them apart, and reporting either one's
    // values would be inventing a source.
    if(scored.length > 1 && scored[0].score === scored[1].score) return null;

    return scored[0].candidate;
}

interface IDeclaredMismatch
{
    node: IWindowDebugNode;
    layout: string;
    key: string;
    declared: string;
    live: string;
}

/** The port stores a CSS family list, so only the first family is the answer. */
function firstFontFamily(fontFace: string): string
{
    return (fontFace.split(',')[0] ?? '').trim().replace(/^["']|["']$/g, '');
}

/**
 * A layout declares a Flash font name ("Volter Bold"); the window stores the
 * CSS list that name resolves to. Comparing the two raw reports every styled
 * text field as a mismatch, so the declared side is resolved the same way the
 * window resolved it.
 */
function declaredFontFamily(declared: string): string
{
    return firstFontFamily(TextStyleManager.mapFontFamily(declared));
}

interface IBoxHeightSample
{
    name: string;
    fontSize: number;
    authored: number;
    live: number;
}

function findDeclaredMismatches(root: IWindowDebugNode): {mismatches: IDeclaredMismatch[]; checked: number; unresolved: number; heights: IBoxHeightSample[]}
{
    const index = buildLayoutVarIndex();
    const windowNames = subtreeNames(root);
    const mismatches: IDeclaredMismatch[] = [];
    const heights: IBoxHeightSample[] = [];
    let checked = 0;
    let unresolved = 0;

    const walk = (node: IWindowDebugNode): void =>
    {
        const style = node.textStyle;

        if(style && node.name)
        {
            const hit = resolveDeclaredVars(node, index, windowNames);

            if(!hit) unresolved++;
            else
            {
                checked++;

                const compare = (key: string, live: string, matches: (declaredValue: string) => boolean): void =>
                {
                    const declared = hit.vars.get(key);

                    if(declared === undefined || matches(declared.trim())) return;

                    mismatches.push({node, layout: hit.layout, key, declared, live});
                };

                compare('font_face', firstFontFamily(style.fontFace), v => firstFontFamily(style.fontFace) === declaredFontFamily(v));
                compare('font_size', String(style.fontSize), v => Number(v) === style.fontSize);
                compare('antialias_type', style.antiAliasType, v => v === style.antiAliasType);
                compare('auto_size', style.autoSize, v => v === style.autoSize);
                compare('bold', String(style.bold), v => (v === 'true') === style.bold);
                compare('italic', String(style.italic), v => (v === 'true') === style.italic);
                compare('leading', String(style.leading), v => Number(v) === style.leading);

                // Flash's own answer for this box against the port's.
                //
                // Only auto-sized fields carry information: with auto_size
                // "none" the port simply keeps the authored rect, so the two
                // agree by construction and say nothing. Where the field
                // auto-sizes, the authored height is what the Flash IDE
                // computed from the player's line metrics and the live height
                // is what measureFontLineHeight() computed from the browser's.
                //
                // Two kinds of field have to come out of the sample, because for
                // them the authored height is not a rendered line box and the
                // comparison only produces noise. Both were reported as real
                // gaps before this filter existed:
                //
                // - `multiline`. The authored height is one line at design time;
                //   the runtime text is as many lines as it needs. A perfectly
                //   correct two-line field reads as "+15" against a one-line
                //   authored box (`camera.competition.header`, `removal_disclaimer`).
                // - A collapsed placeholder. A field authored a few pixels tall
                //   and grown entirely at runtime says nothing about Flash's
                //   metrics — `purchase_credit_cost_text` is authored 4x4 and
                //   read as "Flash 4, port 19 (+15)".
                const autoSize = hit.vars.get('auto_size');
                const multiline = hit.vars.get('multiline')?.trim() === 'true';
                const collapsed = hit.height !== null && hit.height < style.fontSize;

                if(hit.height !== null && autoSize !== undefined && autoSize.trim() !== 'none'
                    && !multiline && !collapsed)
                {
                    heights.push({
                        name: node.name,
                        fontSize: style.fontSize,
                        authored: hit.height,
                        live: node.rect.height,
                    });
                }
            }
        }

        for(const child of node.children) walk(child);
    };

    walk(root);

    return {mismatches, checked, unresolved, heights};
}
