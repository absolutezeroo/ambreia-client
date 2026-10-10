// Composes a preview in the running Glaze: registers every vortex_character_* layout from disk,
// opens a root layout, runs a page-side fill script (rows, captions, popups) and saves the PNG.
//   node compose.mjs --root=<xml file | layout name> --fill=<js file> --out=<png>
import {spawn} from 'node:child_process';
import {mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync} from 'node:fs';
import {dirname, resolve, join, basename} from 'node:path';

const flags = {};
for(const arg of process.argv.slice(2))
{
    const eq = arg.indexOf('='); const key = eq < 0 ? arg.slice(2) : arg.slice(2, eq); const value = eq < 0 ? 'true' : arg.slice(eq + 1);
    flags[key] = value;
}

const PORT = 9334;
const URL_ = 'http://localhost:5174/';
const LAYOUTS = 'D:/Developpment/Habbo/vortex-rpg-client/packages/vortex-client/src/vortex-layouts';
const PROFILE = join(process.env.TEMP ?? '/tmp', `glaze-render-${PORT}`);
const EDGE_PATHS = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function browserAlive()
{
    try { await fetch(`http://127.0.0.1:${PORT}/json/version`); return true; } catch { return false; }
}

async function launchBrowser()
{
    const exe = EDGE_PATHS.find((p) => existsSync(p));
    mkdirSync(PROFILE, {recursive: true});
    spawn(exe, [`--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--window-size=1400,900', '--no-first-run',
        '--no-default-browser-check', '--disable-sync', '--disable-extensions', '--enable-unsafe-swiftshader', 'about:blank'],
    {detached: true, stdio: 'ignore'}).unref();
    for(let i = 0; i < 60; i++) { if(await browserAlive()) return; await sleep(250); }
    throw new Error('Browser did not expose its debugging port');
}

async function connect()
{
    if(!(await browserAlive())) await launchBrowser();
    const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    let page = targets.find((t) => t.type === 'page' && t.url.startsWith(URL_));
    if(!page)
    {
        await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL_)}`, {method: 'PUT'});
        for(let i = 0; i < 40 && !page; i++)
        {
            await sleep(250);
            const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
            page = list.find((t) => t.type === 'page' && t.url.startsWith(URL_));
        }
    }
    if(!page) throw new Error('No Glaze tab');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error('CDP socket failed')); });
    let id = 0;
    const pending = new Map();
    ws.onmessage = (event) => { const msg = JSON.parse(event.data); const e = pending.get(msg.id); if(e) { pending.delete(msg.id); e(msg); } };
    const send = (method, params = {}) => new Promise((ok) => { const n = ++id; pending.set(n, ok); ws.send(JSON.stringify({id: n, method, params})); });
    await send('Page.bringToFront');

    return {
        ws,
        async eval(expression)
        {
            const res = await send('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true});
            const details = res.result?.exceptionDetails;
            if(details) throw new Error(details.exception?.description ?? details.text);
            return res.result?.result?.value;
        },
    };
}

// Runtime.evaluate on the local Glaze page with scripts authored here is the tool itself, as in render.mjs.
const PRELUDE = `
const wm = glaze.runtime.windowManager;
const root = glaze.state.rootWindow;
const build = (n) => { const w = wm.buildWidgetLayout(n); if(!w) throw new Error('no layout ' + n); return w; };
// Every helper tolerates a missing window, so one fill script can serve several boards.
const find = (w, n) => (w ? w.findChildByName(n) : null);
const text = (w, n, c) => { const t = find(w, n); if(t) t.caption = c; };
const tcolor = (w, n, c) => { const t = find(w, n); if(t) t.textColor = c; };
const show = (w, n, v = true) => { const t = find(w, n); if(t) t.visible = v; };
const tint = (w, n, c) => { const t = n ? find(w, n) : w; if(t) t.color = c; };
const bar = (w, n, px) => { const f = find(find(w, n), 'fill'); if(f) f.width = px; };
const icon = (w, n, uri) => { const t = find(w, n); if(t) t.assetUri = uri; };
const add = (list, layout, fill) => { if(!list) return null; const row = build(layout); if(fill) fill(row); list.addListItem(row); return row; };
const place = (parent, layout, x, y, fill) => { if(!parent) return null; const w = build(layout); w.x = x; w.y = y; if(fill) fill(w); parent.addChild(w); return w; };
const tab = (frame, name) => { const tabs = find(frame, 'tab_context'); const item = tabs.getTabItemByName(name); if(tabs.selector && item) tabs.selector.setSelected(item); };
`;

async function main()
{
    const page = await connect();
    for(let i = 0; i < 80; i++) { if(await page.eval('typeof window.glaze !== "undefined"')) break; await sleep(250); }

    if(flags.expr) { console.log(JSON.stringify(await page.eval(flags.expr))); page.ws.close(); return; }

    // Every character layout from disk, fresh.
    const PREFIXES = (flags.prefixes ?? 'vortex_character_,vortex_hud_,vortex_combat_,vortex_bestiary_tip').split(',');
    for(const file of readdirSync(LAYOUTS).filter((f) => PREFIXES.some((p) => f.startsWith(p))))
    {
        const name = file.replace(/\.xml$/, '');
        const xml = readFileSync(join(LAYOUTS, file), 'utf8');
        await page.eval(`(() => { glaze.runtime.windowManager.registerWidgetLayout(${JSON.stringify(name)}, ${JSON.stringify(xml)}); glaze.runtime.layoutXml.set(${JSON.stringify(name)}, ${JSON.stringify(xml)}); return true; })()`);
    }

    // Localise (the toolbar toggle) when a known caption still reads as its key.
    const raw = await page.eval("(() => { glaze.state.openLayout('vortex_character_xml'); return glaze.state.rootWindow.findChildByName('tab_overview').caption; })()");
    if(raw.includes('vortex.'))
    {
        await page.eval("(() => { glaze.toolbar._items.find((i) => i.window.caption === 'Localise').window.procedure({type: 'WME_CLICK'}); return true; })()");
        await sleep(2500);
    }

    const rootArg = flags.root;
    const name = rootArg.endsWith('.xml') ? basename(rootArg).replace(/\.xml$/, '') : rootArg;
    if(rootArg.endsWith('.xml'))
    {
        const xml = readFileSync(resolve(rootArg), 'utf8');
        const ok = await page.eval(`window.glaze.preview(${JSON.stringify(xml)}, ${JSON.stringify(name)})`);
        if(!ok) throw new Error('Glaze refused the XML');
    }
    else await page.eval(`window.glaze.state.openLayout(${JSON.stringify(name)})`);

    if(flags.fill)
    {
        const body = readFileSync(resolve(flags.fill), 'utf8');
        await page.eval(`(async () => { ${PRELUDE}\n${body}\n return true; })()`);
    }

    // A caption resolved at parse time is not rasterised until it is set again (the text field
    // only invalidates on a change): walk the tree and re-set every caption.
    await page.eval(`(() => { const walk = (w) => { if(w.caption) { const c = w.caption; w.caption = ''; w.caption = c; } if(typeof w.numChildren === 'number') for(let i = 0; i < w.numChildren; i++) { const k = w.getChildAt(i); if(k) walk(k); } }; walk(glaze.state.rootWindow); return true; })()`);

    // Static bitmaps fetch asynchronously: give them a moment, then two frames to composite.
    await sleep(Number(flags.wait ?? 1500));
    await page.eval('new Promise((r) => setTimeout(r, 120))');
    const dataUrl = await page.eval('window.glaze.screenshot()');
    if(!dataUrl) throw new Error('Nothing rendered');
    const out = resolve(flags.out);
    mkdirSync(dirname(out), {recursive: true});
    writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
    const size = await page.eval('(() => { const r = {x:0,y:0,width:0,height:0}; window.glaze.state.rootWindow.getGlobalRectangle(r); return `${Math.round(r.width)}x${Math.round(r.height)}`; })()');
    console.log(`${out} (${size})`);
    page.ws.close();
}

main().catch((e) => { console.error(String(e.message ?? e)); process.exit(1); });
