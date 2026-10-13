#!/usr/bin/env node
// Draws `src/assets/images/ambreia_skin_dark.png`, the atlas of the Ambreia window theme
// (style 300+, src/vortex-skins/ambreia_skin_dark_*.xml): the two-tone windows of the 2026-10
// mock-ups, colours sampled from mockup/new/quests — a night-blue body in a light bevelled frame,
// dark panels for lists, light panels for reading, amber outlines for the selection.
//
// Regions (x, y, width, height), the numbers the skins quote:
//   frame         0,0   26x55   corners 10, title band 33 high, bottom 10
//   panel dark   32,0   16x16   corners 7   (border 300/301: a list's ground)
//   card dark    48,0   16x16   corners 7   (border 302: a row, a tile on a dark ground)
//   panel light  64,0   16x16   corners 7   (border 303: a reading panel)
//   strip light  80,0   16x16   corners 7   (border 304: a section header on a light panel)
//   card light   96,0   16x16   corners 7   (border 305: a row, a tile on a light panel)
//   selected    112,0   16x16   corners 7   (border 306: the selected row, blue in amber)
//   tab content 128,0   14x15 + 128,15 14x4  (the strip under the tabs)
//   close       128,20  15x15 ×3 down: default, hovering, pressed
//   header      144,0   6x5     transparent: the frame's own band is the title bar
//   button      0,56   12x24 ×4 right: default, hovering, pressed, disabled (blue, style 300)
//   button grey 48,56  12x24 ×4 right: the same in greys, for a `color` tint (style 301)
//   tab         0,80   30x21 ×3 right: default (dark), selected (light), hovering
//
// Zero dependencies: the PNG is written by hand (RGBA, one IDAT, zlib).
import {deflateSync} from 'node:zlib';
import {writeFileSync, mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/assets/images/ambreia_skin_dark.png');
const W = 160, H = 104;
const px = new Uint8Array(W * H * 4);

const rgb = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255, 255];
const set = (x, y, c) => { if(x < 0 || y < 0 || x >= W || y >= H) return; px.set(c, (y * W + x) * 4); };
const clear = (x, y) => px.fill(0, (y * W + x) * 4, (y * W + x) * 4 + 4);
const fill = (x, y, w, h, c) => { for(let j = 0; j < h; j++) for(let i = 0; i < w; i++) set(x + i, y + j, c); };
const ring = (x, y, w, h, c) => { fill(x, y, w, 1, c); fill(x, y + h - 1, w, 1, c); fill(x, y, 1, h, c); fill(x + w - 1, y, 1, h, c); };
/** Rounds the corners (radius 3: three pixels off the corner, one off its neighbours), the mock-ups' curve. */
const round = (x, y, w, h, r = 3) =>
{
    const off = r === 3 ? [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]] : [[0, 0], [1, 0], [0, 1]];
    for(const [i, j] of off) { clear(x + i, y + j); clear(x + w - 1 - i, y + j); clear(x + i, y + h - 1 - j); clear(x + w - 1 - i, y + h - 1 - j); }
};
/** A box with a 1 px edge, an optional second edge inside, rounded corners. */
const box = (x, y, w, h, edge, body, inner = null, r = 3) =>
{
    fill(x, y, w, h, body);
    ring(x, y, w, h, edge);
    if(inner) ring(x + 1, y + 1, w - 2, h - 2, inner);
    round(x, y, w, h, r);
    // the corner pixel inside the curve takes the edge colour
    if(r === 3) for(const [i, j] of [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]]) set(x + i, y + j, edge);
};

// Sampled from the quest sheet.
const C = {
    night: rgb(0x07161f), band: rgb(0x082535), frameOut: rgb(0x111a26), frameSteel: rgb(0x6a8ba5), frameLight: rgb(0xd9dcdf), frameShade: rgb(0xb7c3cc),
    panelDark: rgb(0x0b1a23), panelDarkEdge: rgb(0x1e3346), cardDark: rgb(0x0e2230), cardDarkEdge: rgb(0x2a4458),
    panelLight: rgb(0xe3e8ec), panelLightEdge: rgb(0xc9d3db), stripLight: rgb(0xc6d0d8), stripLightEdge: rgb(0xb4c0ca), cardLight: rgb(0xf7f8fa),
    selected: rgb(0x01436d), amber: rgb(0xf4bf04), amberDark: rgb(0x965b12),
    blue: rgb(0x0072dd), blueRim: rgb(0x4fb3ff), blueHover: rgb(0x1f8cf0), bluePressed: rgb(0x0059b0), blueEdge: rgb(0x0a3f78),
    tabDark: rgb(0x152f40), tabDarkEdge: rgb(0x2a4a60), tabHover: rgb(0x1c3a4f), tabLight: rgb(0xe8eaec), tabLightEdge: rgb(0xcfd6dc),
};

// frame: a light bevel (dark outline, steel, light face, shade) around the night body; the title band
fill(0, 0, 26, 55, C.night);
ring(0, 0, 26, 55, C.frameOut);
ring(1, 1, 24, 53, C.frameSteel);
ring(2, 2, 22, 51, C.frameLight);
ring(3, 3, 20, 49, C.frameLight);
ring(4, 4, 18, 47, C.frameShade);
fill(5, 5, 16, 28, C.band);
fill(5, 32, 16, 1, C.frameSteel);
round(0, 0, 26, 55);

// panels
box(32, 0, 16, 16, C.panelDarkEdge, C.panelDark);
box(48, 0, 16, 16, C.cardDarkEdge, C.cardDark);
box(64, 0, 16, 16, C.panelLightEdge, C.panelLight);
box(80, 0, 16, 16, C.stripLightEdge, C.stripLight);
box(96, 0, 16, 16, C.panelLightEdge, C.cardLight);
box(112, 0, 16, 16, C.amber, C.selected, C.amberDark);

// tab content strip: night with the frame's steel line above
fill(128, 0, 14, 19, C.night);
fill(128, 0, 14, 1, C.tabDarkEdge);

// close button: red, with its cross
const close = (y, body, edge) =>
{
    box(128, y, 15, 15, edge, body, null, 2);
    for(let i = 0; i < 7; i++) { set(132 + i, y + 4 + i, rgb(0xffffff)); set(138 - i, y + 4 + i, rgb(0xffffff)); }
};
close(20, rgb(0xd23a2a), rgb(0x8a1e10));
close(36, rgb(0xef5343), rgb(0xa52a1e));
close(52, rgb(0xa52a1e), rgb(0x6e150a));

// buttons: blue with a light rim (default, hover, pressed, disabled), then greys to be tinted
const button = (x, edge, body, rim) => box(x, 56, 12, 24, edge, body, rim, 2);
button(0, C.blueEdge, C.blue, C.blueRim);
button(12, C.blueEdge, C.blueHover, rgb(0x8fd0ff));
button(24, C.blueEdge, C.bluePressed, rgb(0x2a7fd6));
button(36, rgb(0x2a3644), rgb(0x3a4a5c), rgb(0x4a5c70));
button(48, rgb(0x8c8c8c), rgb(0xe6e6e6), rgb(0xffffff));
button(60, rgb(0x9a9a9a), rgb(0xf4f4f4), rgb(0xffffff));
button(72, rgb(0x777777), rgb(0xc8c8c8), rgb(0xb0b0b0));
button(84, rgb(0x777777), rgb(0x9a9a9a), rgb(0xa8a8a8));

// tabs: the bottom row is the body colour so the tab joins the content strip
const tab = (x, edge, body) =>
{
    fill(x, 80, 30, 21, body);
    ring(x, 80, 30, 21, edge);
    fill(x + 1, 100, 28, 1, body);
    round(x, 80, 30, 21, 2);
};
tab(0, C.tabDarkEdge, C.tabDark);
tab(30, C.tabLightEdge, C.tabLight);
tab(60, C.tabDarkEdge, C.tabHover);

// --- PNG
const crcTable = new Uint32Array(256).map((_, n) => { let c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (bytes) => { let c = 0xffffffff; for(const b of bytes) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) =>
{
    const t = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, c]);
};
const raw = Buffer.alloc((W * 4 + 1) * H);
for(let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; px.subarray(y * W * 4, (y + 1) * W * 4).forEach((v, i) => { raw[y * (W * 4 + 1) + 1 + i] = v; }); }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);

mkdirSync(dirname(OUT), {recursive: true});
writeFileSync(OUT, png);
console.log(`${OUT} (${W}x${H})`);
