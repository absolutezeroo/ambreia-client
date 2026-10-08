// Renders one avatar to a PNG in Node with nothing but @ambreia/avatar and @ambreia/common (spec §9,
// J2): no DI context, no simulated browser, no engine.
//
//   AMBREIA_ASSETS=http://vortex-assets.local node node_modules/tsx/dist/cli.mjs \
//     --tsconfig packages/ambreia-avatar/tsconfig.json packages/ambreia-avatar/tools/render-avatar.mjs \
//     <figure> <out.png> [--direction 2] [--zoom 2]
//
// The client's legacy.defaults.json says where the libraries are; the Ambreia*.xml data comes from
// the client's configurations folder. Output matches the imager's `size=l` (zoom 2, nearest-neighbour).
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { setPlatform } from '@ambreia/common/platform/Platform';
import { AssetLibrary } from '@ambreia/common/assets/AssetLibrary';
import { AvatarRenderManager } from '@ambreia/avatar/AvatarRenderManager';
import { readAvatarData } from '@ambreia/avatar/AvatarData';
import { AvatarRenderEvent } from '@ambreia/avatar/enum/AvatarRenderEvent';
import { AvatarScaleType } from '@ambreia/avatar/enum/AvatarScaleType';
import { AvatarSetType } from '@ambreia/avatar/enum/AvatarSetType';
import { AvatarAction } from '@ambreia/avatar/enum/AvatarAction';
import { nodePlatform } from './node-platform.mjs';

setPlatform(nodePlatform());

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIGURATIONS = resolve(HERE, '../../vortex-client/src/assets/configurations');

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? Number(args[i + 1]) : fallback; };
const [figure, out] = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const direction = flag('--direction', 2);
const zoom = flag('--zoom', 2);
const assetsBase = (process.env.AMBREIA_ASSETS ?? 'http://vortex-assets.local').replace(/\/+$/, '');

if(!figure || !out)
{
    console.error('usage: render-avatar.mjs <figure> <out.png> [--direction 2] [--zoom 2]');
    process.exit(2);
}

const withTimeout = (promise, ms, what) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`${what} timed out`)), ms))]);

/** The client's starting properties, `${key}` references and all; url.prefix is the asset host. */
function hotelVariables()
{
    const raw = JSON.parse(readFileSync(resolve(HERE, '../../ambreia-game/src/configuration/legacy.defaults.json'), 'utf8'));
    const values = { ...raw, 'url.prefix': assetsBase };
    const resolveValue = (value, depth = 0) => depth > 8 ? value : value.replace(/\$\{([^}]+)\}/g, (_, key) => resolveValue(String(values[key] ?? ''), depth + 1));

    return key => resolveValue(String(values[key] ?? ''));
}

const variable = hotelVariables();
const manager = new AvatarRenderManager({
    assets: new AssetLibrary('avatar'),
    data: readAvatarData(file => { try { return readFileSync(join(CONFIGURATIONS, file), 'utf8'); } catch { return null; } }),
    downloadUrl: variable('flash.dynamic.avatar.download.url'),
    downloadNameTemplate: variable('flash.dynamic.avatar.download.name.template')
});

if(!manager.isReady) await withTimeout(new Promise(done => manager.events.once(AvatarRenderEvent.AVATAR_RENDER_READY, done)), 120_000, 'render manager');

const container = manager.createFigureContainer(figure);

if(!manager.isFigureReady(container))
{
    await withTimeout(new Promise(done => manager.downloadFigure(container, { disposed: false, avatarImageReady: done })), 60_000, 'figure');
}

const image = manager.createAvatarImage(figure, AvatarScaleType.LARGE, null, null, null);

image.setDirection(AvatarSetType.FULL, direction);
image.initActionAppends();
image.appendAction(AvatarAction.POSTURE, AvatarAction.POSTURE_STAND);
image.endActionAppends();
image.setDirection(AvatarSetType.HEAD, direction);

const texture = image.getImage(AvatarSetType.FULL, false);

if(!texture) throw new Error(`Nothing rendered for ${figure}`);

// The imager's textureToCanvas(): the frame of the composite, magnified nearest-neighbour.
const frame = texture.frame;
const canvas = createCanvas(Math.max(1, Math.round(frame.width * zoom)), Math.max(1, Math.round(frame.height * zoom)));
const context = canvas.getContext('2d');

context.imageSmoothingEnabled = zoom < 1;
context.drawImage(texture.source.resource, frame.x, frame.y, frame.width, frame.height, 0, 0, canvas.width, canvas.height);

await writeFile(out, await canvas.encode('png'));
console.log(`wrote ${out} (${canvas.width}x${canvas.height})`);
manager.dispose();
process.exit(0);
