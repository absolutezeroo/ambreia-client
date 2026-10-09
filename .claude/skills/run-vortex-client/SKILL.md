---
name: run-vortex-client
description: Launches and drives the running Vortex dev client in a real browser to verify a change visually - screenshots, clicks, drags, typing, page errors and failed requests, all from the command line. Use after any change that shows on screen (window, layout, HUD, room rendering, avatar, boot) or when asked to run, open, screenshot, check or test the client; use it before saying a visible change works.
---

# Run and drive the Vortex client

The client is a PixiJS canvas: there is no DOM to query. Verification is screenshots, mouse and
keyboard input at CSS coordinates, and `eval` against the client's own globals.
`driver.mjs` does all of it over the Chrome DevTools Protocol with no dependency.

## 1. Start the dev server (once)

```bash
pnpm dev        # Vite on http://localhost:5173, serves the client under /client/; also starts the imager
```

Run it in the background and wait until it prints its local URL. Without `node install.mjs` having
unpacked the assets, the client boots to an empty screen: check `packages/vortex-client/src/assets/`.

## 2. Drive it

Each argument is one command; quote commands that take arguments. The browser (Edge, else Chrome)
is started detached on port 9333 and **reused** by later calls, so the same page and session stay
alive between invocations.

```bash
node .claude/skills/run-vortex-client/driver.mjs                     # default: goto, wait 5 s, "ss boot", errors
node .claude/skills/run-vortex-client/driver.mjs goto "wait 4000" "ss login" errors
node .claude/skills/run-vortex-client/driver.mjs "click 640 400" "wait 500" "ss after-click"
node .claude/skills/run-vortex-client/driver.mjs "drag 100 100 300 200" "type hello" "key Enter"
node .claude/skills/run-vortex-client/driver.mjs "eval window.location.href" net
node .claude/skills/run-vortex-client/driver.mjs quit                # close the browser
```

| Command | Effect |
|---|---|
| `goto [url]` | Navigate (default `http://localhost:5173/client/`) and wait for load |
| `wait <ms>` / `waitfor <js expr>` | Sleep, or poll until the expression is truthy |
| `ss <name>` | Screenshot to `.claude/skills/run-vortex-client/shots/<name>.png` (gitignored) |
| `click x y [shift|alt|ctrl]` / `move x y` / `drag x1 y1 x2 y2 [steps] [alt…]` | Mouse at CSS coordinates (1280×800 viewport), with modifier keys held |
| `type <text>` / `key <Key>` | Insert text / press a key (`Enter`, `Escape`…) |
| `eval <js>` | Evaluate in the page, print the JSON result |
| `errors` | Console errors, page errors and unhandled rejections since the page loaded |
| `net` | Failed requests and HTTP ≥ 400 during this invocation |

Flags: `--url=…`, `--port=…`, `--width=…`, `--height=…`, `--out=<dir>`.

## 3. Verify, then report

1. Take a screenshot **before** and **after** the change at the same coordinates and read both images
   (the Read tool shows PNGs). Compare what changed, not just that something renders.
2. Run `errors` and `net`: a canvas can look right while a layout failed to load or a request 404'd.
3. Report what you saw, with the screenshot names. If something could not be checked (no server, no
   assets, login needed), say so instead of calling it verified.

Reaching a room needs the emulator (`../vortex-rpg-emulator`) running and a session: the website
normally hands one over with `?sso=<ticket>` (`goto http://localhost:5173/client/?sso=<ticket>`).
