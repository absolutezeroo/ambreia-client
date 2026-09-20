#!/usr/bin/env node
// Renders all 89 chat styles side by side, as one self-contained HTML page, so a broken bubble
// can be named instead of guessed at.
//
// ## Why a sheet and not another audit
//
// "Some bubbles are broken, others work" was chased three times through the *data* and the data
// came back clean every time. As of 2026-09-21 the shipped chat-style set is internally
// consistent on eight separate measurements:
//
//   89 <style> entries in chatstyles_xml.xml  ↔  89 manifest entries  ↔  89 regpoints files,
//   with no id or assetId on either side that the other does not have;
//   every base / pointer / emblem / icon / color image the manifest declares is present;
//   every 9-slice fits inside its own base image (no negative right/bottom inset);
//   no pointerY past the base height, no negative faceXY;
//   `hasConfig()`'s substring lookup never lands on the wrong key in any of the 89 files;
//   and every field the files declare is read by ChatStyleLibrary -- none is silently ignored.
//
// The 21 files with no `pointerY` are exactly the 21 marked `anonymous` (the notification
// bubbles, which have no pointer by design), so that gap is not one either.
//
// So the fault is in the rendering of sound data, or in which style id the wire carries -- and
// neither is findable without seeing which styles misbehave. This draws each style from its own
// numbers using the browser's `border-image`, which is the same scale-9 rule Flash applies, next
// to those numbers in text. A style that looks wrong here is a data/geometry problem after all;
// a style that looks right here but wrong in the client is the renderer's.
//
//   node tools/chat-style-contact-sheet.mjs --out sheet.html
//
// The page references the PNGs by absolute path, so it opens from anywhere with no server.
import { readFileSync, writeFileSync, existsSync, openSync, readSync, closeSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ASSETS = resolve(here, '../src/assets');
const CONFIG = join(ASSETS, 'configurations');
const IMAGES = join(ASSETS, 'images');

function pngSize(path) {
  // IHDR width/height live at bytes 16..23 of every PNG; no decoder needed.
  const fd = openSync(path, 'r');
  const head = Buffer.alloc(24);

  readSync(fd, head, 0, 24, 0);
  closeSync(fd);

  return { w: head.readUInt32BE(16), h: head.readUInt32BE(20) };
}

function readRegpoints(style) {
  const path = join(CONFIG, `style_${style}_regpoints.txt`);
  const out = {};

  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

const nums = (v) => (v ?? '').split(',').map((n) => Number.parseInt(n, 10));

function main() {
  const argv = process.argv.slice(2);
  const outIndex = argv.indexOf('--out');
  const out = outIndex === -1 ? resolve(process.cwd(), 'chat-style-contact-sheet.html') : resolve(argv[outIndex + 1]);

  const manifest = JSON.parse(readFileSync(join(CONFIG, 'chatstyles-manifest.json'), 'utf8'));
  const xml = readFileSync(join(CONFIG, 'chatstyles_xml.xml'), 'utf8');

  const idOf = new Map();
  for (const m of xml.matchAll(/<style\s+id="(\d+)"\s+assetId="([^"]+)"/g)) idOf.set(m[2], Number(m[1]));

  const cells = [];

  for (const style of Object.keys(manifest).sort()) {
    const cfg = readRegpoints(style);
    const base = join(IMAGES, `style_${style}_chat_bubble_base.png`);

    if (!existsSync(base)) {
      cells.push(`<div class="cell err"><h3>${style}</h3><p>base absente</p></div>`);
      continue;
    }

    const { w: W, h: H } = pngSize(base);
    const [sx, sy] = nums(cfg['9sliceXY']);
    const [sw, sh] = nums(cfg['9sliceWH']);
    const right = W - sx - sw;
    const bottom = H - sy - sh;

    // Rectangle(x, y, width, height) used as a margin box: left, top, right, bottom.
    const [ml, mt, mr, mb] = nums(cfg.textFieldMargins);
    const [fx, fy] = cfg.faceXY ? nums(cfg.faceXY) : [null, null];
    const pointerY = cfg.pointerY ? Number.parseInt(cfg.pointerY, 10) : null;
    const pointer = join(IMAGES, `style_${style}_chat_bubble_pointer.png`);
    const hasPointer = pointerY !== null && existsSync(pointer);
    const colour = (cfg.textColorRGB ?? '0x000000').replace('0x', '#').padEnd(7, '0');

    const lineH = Math.round((Number(cfg.fontSize) || 12) * 1.35);
    const bubbleW = Math.max(sx + right + 8, ml + mr + 130);
    const bubbleH = Math.max(sy + bottom + 4, mt + mb + lineH);

    // Every coordinate in a regpoints file is measured from the bubble's top-left, so the skin,
    // the text, the face and the pointer are all siblings placed against the same box. Putting
    // the text *inside* the border-image element instead would offset it by the border widths,
    // which is not what the numbers mean.
    cells.push(`
<div class="cell">
  <h3>${style} <span class="id">id ${idOf.get(style) ?? '?'}</span></h3>
  <div class="stage" style="width:${bubbleW}px; height:${bubbleH + 12}px">
    <div class="skin" style="
      width:${bubbleW}px; height:${bubbleH}px;
      border-image: url('${pathToFileURL(base).href}') ${sy} ${right} ${bottom} ${sx} fill stretch;
      border-width: ${sy}px ${right}px ${bottom}px ${sx}px;"></div>
    <span class="txt" style="left:${ml}px; top:${mt}px; color:${colour};
      font-family:${cfg.fontFace || 'Ubuntu'}, sans-serif; font-size:${cfg.fontSize || 12}px;
      line-height:${lineH}px;">Bonjour, Habbo !</span>
    ${fx !== null ? `<i class="face" style="left:${fx}px; top:${fy}px"></i>` : ''}
    ${hasPointer ? `<img class="ptr" src="${pathToFileURL(pointer).href}" style="top:${pointerY}px">` : ''}
  </div>
  <pre>9slice ${sx},${sy} ${sw}x${sh} sur ${W}x${H}  (droite ${right}, bas ${bottom})
marges  ${cfg.textFieldMargins}
face    ${cfg.faceXY ?? '--'}     pointerY ${cfg.pointerY ?? '--'}
police  ${cfg.fontFace} ${cfg.fontSize}  ${cfg.textColorRGB}${cfg.anonymous ? '\nanonymous' : ''}${cfg.usePixelPerfectNineSlice ? '\nusePixelPerfectNineSlice' : ''}${cfg.pointerXMargins ? `\npointerXMargins ${cfg.pointerXMargins}` : ''}</pre>
</div>`);
  }

  const html = `<!doctype html><meta charset="utf-8"><title>Chat styles — ${cells.length}</title>
<style>
  body{background:#6a7a86;font:13px/1.4 Ubuntu,system-ui,sans-serif;color:#eee;margin:0;padding:16px}
  h1{font-size:18px;margin:0 0 4px}
  .lede{opacity:.8;margin:0 0 16px;max-width:70ch}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
  .cell{background:#8fa0ad;border-radius:6px;padding:10px}
  .cell.err{background:#a35}
  h3{margin:0 0 8px;font-size:14px;color:#fff}
  .id{opacity:.6;font-weight:400}
  .stage{position:relative;margin:6px 0 30px}
  .skin{position:absolute;left:0;top:0;box-sizing:border-box}
  .txt{position:absolute;white-space:nowrap}
  .face{position:absolute;width:24px;height:24px;border:1px dashed rgba(255,0,0,.7);border-radius:50%}
  .ptr{position:absolute;left:24px}
  pre{margin:6px 0 0;font:11px/1.35 ui-monospace,monospace;color:#22303a;white-space:pre-wrap}
</style>
<h1>Styles de bulle — ${cells.length}</h1>
<p class="lede">Chaque bulle est dessinee a partir de ses propres regpoints, en scale-9 (<code>border-image</code>),
la meme regle que Flash. Cercle rouge = <code>faceXY</code>. Une bulle fausse ici est un probleme de donnees ;
une bulle juste ici mais fausse dans le client est un probleme de rendu.</p>
<div class="grid">${cells.join('\n')}</div>`;

  writeFileSync(out, html, 'utf8');
  console.log(`${cells.length} styles -> ${out}`);
}

main();
