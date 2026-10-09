#!/usr/bin/env node
/**
 * Vortex client driver — drives the running dev client over the Chrome DevTools Protocol.
 *
 * Zero dependencies: Node 22+ has a global `WebSocket`, and Edge ships with Windows. The browser is
 * launched detached on a fixed debugging port and REUSED by later invocations, so a sequence of
 * `node driver.mjs ...` calls keeps the same page (and the same client session) alive.
 *
 * The client is a PixiJS canvas: there is no DOM to query. Everything here is therefore pixels and
 * globals — screenshots, `Input.dispatchMouseEvent` at CSS coordinates, and `eval` against the
 * client's own objects.
 *
 *   node .claude/skills/run-vortex-client/driver.mjs goto "ss boot" errors
 *   node .claude/skills/run-vortex-client/driver.mjs "click 640 400" "ss after-click"
 *   node .claude/skills/run-vortex-client/driver.mjs quit
 *
 * Each argv element is one command; its arguments live inside it (quote them).
 */

import {spawn} from 'node:child_process';
import {mkdirSync, writeFileSync, readFileSync, existsSync} from 'node:fs';
import {dirname, resolve, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

const flags = {};
const commands = [];

for(const arg of process.argv.slice(2))
{
    if(arg.startsWith('--'))
    {
        const [key, value = 'true'] = arg.slice(2).split('=');
        flags[key] = value;
    }
    else commands.push(arg);
}

const PORT = Number(flags.port ?? 9333);
const URL_ = flags.url ?? 'http://localhost:5173/client/';
const OUT = resolve(flags.out ?? join(HERE, 'shots'));
const WIDTH = Number(flags.width ?? 1280);
const HEIGHT = Number(flags.height ?? 800);

const PROFILE = join(process.env.TEMP ?? '/tmp', `vortex-driver-${PORT}`);
const STATE = join(PROFILE, 'driver-target.json');

const EDGE_PATHS = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

/**
 * Injected before every document. `window.__vortexErrors` has to live in the PAGE, not in this
 * process: the driver reattaches on every invocation and would otherwise only ever report errors
 * from its own few seconds of runtime.
 */
const ERROR_COLLECTOR = `
window.__vortexErrors = window.__vortexErrors || [];
if(!window.__vortexErrorsHooked)
{
    window.__vortexErrorsHooked = true;
    const push = (kind, text) => window.__vortexErrors.push(kind + ': ' + text);
    const nativeError = console.error.bind(console);
    console.error = (...args) =>
    {
        push('console', args.map(a => (a && a.stack) ? a.stack : String(a)).join(' '));
        nativeError(...args);
    };
    window.addEventListener('error', (e) => push('pageerror', (e.error && e.error.stack) || e.message));
    window.addEventListener('unhandledrejection', (e) => push('rejection', String((e.reason && e.reason.stack) || e.reason)));
}
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** CDP modifier bits, for a trailing `alt`, `ctrl`, `meta` or `shift` on click, move and drag. */
const MODIFIERS = {alt: 1, ctrl: 2, meta: 4, shift: 8};
const modifiers = (tokens) => tokens.reduce((bits, token) => bits | (MODIFIERS[token] ?? 0), 0);

async function fetchJson(path)
{
    const res = await fetch(`http://127.0.0.1:${PORT}${path}`);
    return res.json();
}

async function browserAlive()
{
    try
    {
        await fetchJson('/json/version');
        return true;
    }
    catch
    {
        return false;
    }
}

async function launchBrowser()
{
    const exe = EDGE_PATHS.find((p) => existsSync(p));
    if(!exe) throw new Error(`No Edge/Chrome found. Looked in:\n${EDGE_PATHS.join('\n')}`);

    const args = [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${PROFILE}`,
        `--window-size=${WIDTH},${HEIGHT}`,
        '--no-first-run',
        '--no-default-browser-check',
        // Edge signs a fresh profile into the Windows account and syncs the user's extensions in,
        // each of which opens its own welcome tab — those tabs then outrank the client in
        // `Target.getTargets`. Off, the browser has exactly one page.
        '--disable-sync',
        '--disable-extensions',
        '--disable-features=Translate,MediaRouter,msEdgeSync,EdgeFollowServiceHandler',
        // The client is WebGL. Headless Chromium falls back to SwiftShader, which newer builds
        // refuse to use unless this flag says so — without it the Pixi renderer never initialises
        // and every screenshot is a blank canvas.
        '--enable-unsafe-swiftshader',
        'about:blank',
    ];

    if(!flags.headed) args.unshift('--headless=new');

    spawn(exe, args, {detached: true, stdio: 'ignore'}).unref();

    for(let i = 0; i < 60; i++)
    {
        if(await browserAlive()) return;
        await sleep(250);
    }

    throw new Error(`Browser did not open a debugging port on ${PORT}`);
}

class Cdp
{
    constructor(ws)
    {
        this._ws = ws;
        this._id = 0;
        this._pending = new Map();
        this._listeners = [];
        this.sessionId = null;

        ws.addEventListener('message', (event) =>
        {
            const msg = JSON.parse(event.data);

            if(msg.id !== undefined)
            {
                const pending = this._pending.get(msg.id);
                if(!pending) return;
                this._pending.delete(msg.id);
                if(msg.error) pending.reject(new Error(msg.error.message));
                else pending.resolve(msg.result);
                return;
            }

            for(const listener of this._listeners) listener(msg);
        });
    }

    static async connect(url)
    {
        const ws = new WebSocket(url);
        await new Promise((res, rej) =>
        {
            ws.addEventListener('open', res, {once: true});
            ws.addEventListener('error', () => rej(new Error(`Cannot connect to ${url}`)), {once: true});
        });
        return new Cdp(ws);
    }

    on(handler)
    {
        this._listeners.push(handler);
    }

    send(method, params = {}, useSession = true)
    {
        const id = ++this._id;
        const payload = {id, method, params};
        if(useSession && this.sessionId) payload.sessionId = this.sessionId;
        this._ws.send(JSON.stringify(payload));
        return new Promise((resolve_, reject) => this._pending.set(id, {resolve: resolve_, reject}));
    }

    close()
    {
        this._ws.close();
    }
}

async function attach()
{
    if(!(await browserAlive())) await launchBrowser();

    const {webSocketDebuggerUrl} = await fetchJson('/json/version');
    const cdp = await Cdp.connect(webSocketDebuggerUrl);

    // Which page to drive, in order: the one a previous invocation drove (this is what keeps the
    // client session alive across `node driver.mjs …` calls), then any tab already on the client,
    // then a blank tab, then a new one.
    const {targetInfos} = await cdp.send('Target.getTargets', {}, false);
    const pages = targetInfos.filter((t) => t.type === 'page');
    const remembered = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')).targetId : null;
    const origin = new URL(URL_).origin;

    let page = pages.find((t) => t.targetId === remembered)
        ?? pages.find((t) => t.url.startsWith(origin))
        ?? pages.find((t) => t.url === 'about:blank');

    if(!page)
    {
        const {targetId} = await cdp.send('Target.createTarget', {url: 'about:blank'}, false);
        page = {targetId};
    }

    mkdirSync(PROFILE, {recursive: true});
    writeFileSync(STATE, JSON.stringify({targetId: page.targetId}));

    const {sessionId} = await cdp.send('Target.attachToTarget', {targetId: page.targetId, flatten: true}, false);
    cdp.sessionId = sessionId;

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false,
    });
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {source: ERROR_COLLECTOR});

    return cdp;
}

const failedRequests = [];

async function evaluate(cdp, expression)
{
    const {result, exceptionDetails} = await cdp.send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
    });

    if(exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return result.value;
}

async function waitFor(cdp, expression, timeoutMs = 30_000)
{
    const deadline = Date.now() + timeoutMs;

    while(Date.now() < deadline)
    {
        try
        {
            if(await evaluate(cdp, `!!(${expression})`)) return true;
        }
        catch { /* the page may be mid-navigation; keep polling */ }

        await sleep(250);
    }

    throw new Error(`Timed out after ${timeoutMs}ms waiting for: ${expression}`);
}

async function screenshot(cdp, name)
{
    mkdirSync(OUT, {recursive: true});
    const {data} = await cdp.send('Page.captureScreenshot', {format: 'png'});
    const file = join(OUT, `${name || 'shot'}.png`);
    writeFileSync(file, Buffer.from(data, 'base64'));
    console.log(`[ss] ${file}`);
}

async function run(cdp, line)
{
    const [cmd, ...rest] = line.trim().split(/\s+/);
    const arg = line.trim().slice(cmd.length).trim();

    switch(cmd)
    {
        case 'goto':
        {
            const target = arg || URL_;
            await cdp.send('Page.navigate', {url: target});
            await waitFor(cdp, 'document.readyState === "complete"');
            console.log(`[goto] ${target}`);
            break;
        }

        case 'wait':
            await sleep(Number(rest[0] ?? 1000));
            break;

        case 'waitfor':
            await waitFor(cdp, arg);
            console.log(`[waitfor] ${arg}`);
            break;

        case 'ss':
            await screenshot(cdp, rest[0]);
            break;

        case 'move':
        case 'click':
        {
            const [x, y] = rest.map(Number);
            const base = {x, y, button: 'left', clickCount: 1, buttons: 0, modifiers: modifiers(rest)};
            await cdp.send('Input.dispatchMouseEvent', {...base, type: 'mouseMoved'});

            if(cmd === 'click')
            {
                await sleep(50);
                await cdp.send('Input.dispatchMouseEvent', {...base, type: 'mousePressed', buttons: 1});
                await sleep(50);
                await cdp.send('Input.dispatchMouseEvent', {...base, type: 'mouseReleased'});
            }

            console.log(`[${cmd}] ${x},${y}`);
            break;
        }

        case 'drag':
        {
            const [x1, y1, x2, y2, steps = 8] = rest.filter(token => !(token in MODIFIERS)).map(Number);
            const base = {button: 'left', clickCount: 1, modifiers: modifiers(rest)};

            await cdp.send('Input.dispatchMouseEvent', {...base, type: 'mouseMoved', x: x1, y: y1, buttons: 0});
            await cdp.send('Input.dispatchMouseEvent', {...base, type: 'mousePressed', x: x1, y: y1, buttons: 1});

            for(let i = 1; i <= steps; i++)
            {
                const x = Math.round(x1 + ((x2 - x1) * i) / steps);
                const y = Math.round(y1 + ((y2 - y1) * i) / steps);

                await sleep(20);
                await cdp.send('Input.dispatchMouseEvent', {...base, type: 'mouseMoved', x, y, buttons: 1});
            }

            await sleep(20);
            await cdp.send('Input.dispatchMouseEvent', {...base, type: 'mouseReleased', x: x2, y: y2, buttons: 0});

            console.log(`[drag] ${x1},${y1} -> ${x2},${y2}`);
            break;
        }

        case 'type':
            await cdp.send('Input.insertText', {text: arg});
            console.log(`[type] ${arg}`);
            break;

        case 'key':
            for(const type of ['keyDown', 'keyUp'])
            {
                await cdp.send('Input.dispatchKeyEvent', {
                    type,
                    key: rest[0],
                    code: rest[0],
                    windowsVirtualKeyCode: rest[0] === 'Enter' ? 13 : undefined,
                    text: rest[0] === 'Enter' ? '\r' : undefined,
                });
            }
            console.log(`[key] ${rest[0]}`);
            break;

        case 'eval':
            console.log(JSON.stringify(await evaluate(cdp, arg), null, 2));
            break;

        case 'errors':
        {
            const errors = await evaluate(cdp, 'window.__vortexErrors || []');
            console.log(errors.length ? errors.join('\n') : '[errors] none');
            break;
        }

        case 'net':
            console.log(failedRequests.length ? failedRequests.join('\n') : '[net] no failures this invocation');
            break;

        case 'quit':
            await cdp.send('Browser.close', {}, false).catch(() => {});
            console.log('[quit] browser closed');
            // Straight out: closing the socket whose peer has just died trips a libuv assertion.
            process.exit(0);
            break;

        default:
            throw new Error(`Unknown command: ${cmd}`);
    }

    return true;
}

const cdp = await attach();

cdp.on((msg) =>
{
    if(msg.method === 'Network.loadingFailed') failedRequests.push(`FAILED ${msg.params.errorText}`);
    if(msg.method === 'Network.responseReceived' && msg.params.response.status >= 400)
    {
        failedRequests.push(`${msg.params.response.status} ${msg.params.response.url}`);
    }
});

let alive = true;

for(const command of commands.length ? commands : ['goto', 'wait 5000', 'ss boot', 'errors'])
{
    if(!alive) break;
    alive = await run(cdp, command);
}

cdp.close();
process.exit(0);
