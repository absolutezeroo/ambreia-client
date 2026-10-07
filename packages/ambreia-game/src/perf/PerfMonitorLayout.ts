/**
 * Names the perf monitor's window layout and the tabs it declares.
 *
 * TS-only: no AS3 counterpart — the dump contains no perf-monitor window, because Flash had no such
 * tool.
 *
 * The layout itself is `packages/vortex-client/src/vortex-layouts/vortex_perfmon_xml.xml`, which is
 * where this port keeps window layouts it authored rather than took from the dump. `App` registers
 * everything in that folder at boot under the file basename, so nothing here has to register it —
 * `buildWidgetLayout('vortex_perfmon_xml')` just works, the same as the furni editor's layouts.
 *
 * Not `src/assets/window-layouts/`: that directory is gitignored and rebuilt by
 * `tools/build-window-assets.mjs`, so a hand-written file there is wiped by the next asset build.
 *
 * Structure and every styling value in the XML come from `wired_menu_view_xml` — the same frame
 * params, header blue and drop shadow, the same `tab_context` holding `tab_button` children, and
 * the same one-container-per-tab arrangement the wired view toggles with `.visible`. That is what
 * makes it look like the client; window types alone carry none of it.
 */
// TS-only: see the module note.
export const PERF_MONITOR_LAYOUT_NAME: string = 'vortex_perfmon_xml';

/** Tab id → the tab button and container the layout declares for it. */
// TS-only: see the module note.
export const PERF_MONITOR_TABS: { id: string; button: string; container: string }[] = [
    {id: 'live', button: 'perfmon_tab_live', container: 'perfmon_page_live'},
    {id: 'runs', button: 'perfmon_tab_runs', container: 'perfmon_page_runs'},
    {id: 'bench', button: 'perfmon_tab_bench', container: 'perfmon_page_bench'},
    {id: 'profile', button: 'perfmon_tab_profile', container: 'perfmon_page_profile'}
];
