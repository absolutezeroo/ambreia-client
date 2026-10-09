import {AssetBundle} from '@ambreia/common/assets/AssetBundle';
import {parseElementDescriptionXml, parseSkinXml, parseWindowLayoutXml} from '../src/assets/WindowXmlAssetParser';
import {WindowManager} from '../src/kit/WindowManager';
import {mergeElementDescription, mergeSkin} from '../src/assets/SkinMerge';
import type {ISkinData} from '../src/graphics/renderer/BitmapSkinParser';
import type {IWindow} from '../src/IWindow';
import type {IWindowContainer} from '../src/IWindowContainer';
import vortexLayout from '../../vortex-client/src/vortex-layouts/vortex_character_xml.xml?raw';

// One Ambreia layout and one Habbo layout, built by a bare WindowManager: no engine, no DI.
const VORTEX_LAYOUT = 'vortex_character_xml';
const HABBO_LAYOUT = 'bully_report_xml';
// The one atlas whose embedded name is not its file name (see the client's App.ts).
const ATLAS_FILES: Record<string, string> = {skin_ubuntu_bg_9: 'ubuntu_bg_9'};

const [images, xml] = await Promise.all([AssetBundle.load('/assets-images.ambreia'), AssetBundle.load('/assets-xml.ambreia')]);

// The two families the skins draw their text in; the window system measures with them.
await Promise.all([['Volter', 'Volter.ttf', 'normal'], ['Volter', 'Volter Bold.ttf', 'bold'], ['Ubuntu', 'Ubuntu.ttf', 'normal'], ['Ubuntu', 'Ubuntu-b.ttf', 'bold']]
    .map(async ([family, file, weight]) =>
    {
        const bytes = xml.getBytes(`webfonts/${file}`);

        if(!bytes) return;

        const face = new FontFace(family, bytes.slice().buffer, {weight});

        document.fonts.add(await face.load());
    }));
const manager = new WindowManager({interpolate: (text: string) => text});

manager.initialize();

const DESCRIPTION = 'habbo_element_description_xml';
const descriptionKey = `window-skins/${DESCRIPTION}.xml`;
let description = parseElementDescriptionXml(xml.getText(descriptionKey) ?? '', DESCRIPTION, descriptionKey);
const skins = new Map<string, ISkinData>();

for(const key of xml.listKeys('window-skins/'))
{
    if(key === descriptionKey) continue;

    const skin = parseSkinXml(xml.getText(key) ?? '', key.split('/').pop()!.replace(/\.xml$/, ''), key);

    if(skin) skins.set(skin.id, skin);
}

// Ambreia's own skins over the dump's, as the client merges them (its src/vortex-skins/).
const authoredSkins = import.meta.glob('../../vortex-client/src/vortex-skins/*.xml', {query: '?raw', import: 'default', eager: true}) as Record<string, string>;

for(const [path, text] of Object.entries(authoredSkins))
{
    const name = path.split('/').pop()!.replace(/\.xml$/, '');

    if(name === DESCRIPTION)
    {
        const authored = parseElementDescriptionXml(text, name, path);

        if(authored) description = mergeElementDescription(description, authored);
        continue;
    }

    const skin = parseSkinXml(text, name, path);

    if(skin) skins.set(skin.id, mergeSkin(skins.get(skin.id) ?? null, skin));
}

if(description) manager.loadElementDescription(description);

// Every atlas a skin template names, resolved through the skin's `$variables`.
const atlasNames = new Set<string>();

for(const skin of skins.values())
{
    for(const template of skin.templates)
    {
        const asset = template.asset?.startsWith('$') ? skin.variables[template.asset.slice(1)] : template.asset;

        if(asset) atlasNames.add(asset);
    }
}

const atlases = new Map<string, ImageBitmap>();

await Promise.all([...atlasNames].map(async name =>
{
    const bitmap = await images.getImageBitmap(`images/${ATLAS_FILES[name] ?? name}.png`);

    if(bitmap) atlases.set(name, bitmap);
}));
manager.loadSkinAssets(skins, atlases);

for(const key of images.listKeys('images/'))
{
    manager.registerAssetUrl(key.slice('images/'.length).replace(/\.png$/, ''), () => images.getUrl(key));
}

// All of them, not only the two shown: a frame or a button builds its own parts out of the
// layouts its element descriptor names (`habbo_window_layout_frame_xml`…).
for(const key of xml.listKeys('window-layouts/'))
{
    for(const layout of parseWindowLayoutXml(xml.getText(key) ?? '', key.split('/').pop()!.replace(/\.xml$/, ''), key))
    {
        if(layout.name) manager.registerWidgetLayout(layout.name, layout.xml);
    }
}
manager.registerWidgetLayout(VORTEX_LAYOUT, vortexLayout);

const desktop = manager.getDesktop(1) as IWindowContainer;

function show(name: string, x: number, y: number): IWindow | null
{
    const window = manager.buildWidgetLayout(name);

    if(!window) return null;

    window.x = x;
    window.y = y;
    desktop.addChild(window);

    return window;
}

const vortex = show(VORTEX_LAYOUT, 40, 40);
const habbo = show(HABBO_LAYOUT, 680, 40);

const canvas = document.getElementById('sandbox') as HTMLCanvasElement;
const context = canvas.getContext('2d')!;
let last = performance.now();

function frame(now: number): void
{
    if(canvas.width !== innerWidth || canvas.height !== innerHeight)
    {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
    }

    manager.update(now - last);
    last = now;

    const buffer = manager.compositeToBuffer(canvas.width, canvas.height);

    if(buffer)
    {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(buffer, 0, 0);
    }

    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

(window as unknown as {sandbox: unknown}).sandbox = {manager, vortex, habbo};
