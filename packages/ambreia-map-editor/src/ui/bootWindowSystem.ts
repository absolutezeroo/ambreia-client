import {AssetBundle} from '@ambreia/common/assets/AssetBundle';
import {mergeElementDescription, mergeSkin} from '@ambreia/ui/assets/SkinMerge';
import {parseElementDescriptionXml, parseSkinXml, parseWindowLayoutXml} from '@ambreia/ui/assets/WindowXmlAssetParser';
import type {ISkinData} from '@ambreia/ui/graphics/renderer/BitmapSkinParser';
import {WindowManager} from '@ambreia/ui/kit/WindowManager';
import {EditorTexts} from './EditorTexts';

const DESCRIPTION = 'habbo_element_description_xml';
const GAME_WIDGET_TYPES = [
    'avatar_image', 'badge_image', 'furniture_image', 'illumina_chat_bubble', 'pet_image',
    'product_icon', 'product_image', 'room_previewer', 'updating_timestamp'
] as const;
// The one atlas whose embedded name is not its file name (see the client's App.ts).
const ATLAS_FILES: Record<string, string> = {skin_ubuntu_bg_9: 'ubuntu_bg_9'};
// The families the skins draw their text in (GlazeBoot's list); the window system measures with them.
const FONTS: readonly [string, string, string, string][] = [
    ['Volter (Goldfish)', 'Volter.ttf', 'normal', 'normal'],
    ['Volter (Goldfish)', 'Volter Bold.ttf', 'bold', 'normal'],
    ['Volter', 'Volter.ttf', 'normal', 'normal'],
    ['Volter', 'Volter Bold.ttf', 'bold', 'normal'],
    ['Ubuntu', 'Ubuntu.ttf', 'normal', 'normal'],
    ['Ubuntu', 'Ubuntu-b.ttf', 'bold', 'normal'],
    ['Ubuntu', 'Ubuntu-i.ttf', 'normal', 'italic'],
    ['Ubuntu', 'Ubuntu-ib.ttf', 'bold', 'italic'],
    ['Ubuntu Condensed', 'Ubuntu-C.ttf', 'normal', 'normal'],
    ['UbuntuThick', 'Ubuntu-thick-b.ttf', 'normal', 'normal']
];

/** The owner's editor layouts, read from their source: Glaze writes them there. */
const EDITOR_LAYOUTS = import.meta.glob('../../../vortex-client/src/vortex-layouts/vortex_map_editor_*.xml', {
    query: '?raw', import: 'default', eager: true
}) as Record<string, string>;

/** The editor's own layouts (view host, canvas host, forms, section title), next to the owner's. */
const OWN_LAYOUTS = import.meta.glob('./layouts/*.xml', {query: '?raw', import: 'default', eager: true}) as Record<string, string>;

/** Ambreia's own skins, merged over the Habbo dump as the client does (its src/vortex-skins/). */
const AUTHORED_SKINS = import.meta.glob('../../../vortex-client/src/vortex-skins/*.xml', {
    query: '?raw', import: 'default', eager: true
}) as Record<string, string>;

/** Every French text of the client's windows: the editor's layouts also borrow keys from other screens. */
const FRENCH_TEXTS = import.meta.glob('../../../vortex-client/tools/locale-overrides/*.fr.txt', {
    query: '?raw', import: 'default', eager: true
}) as Record<string, string>;

const baseName = (path: string): string => path.split('/').pop()!.replace(/\.xml$/, '');

/**
 * Brings up @ambreia/ui on its own, the way the J3 sandbox and Glaze do: no engine, no DI.
 * Fonts, skins (with Ambreia's), every Habbo layout, the owner's vortex_map_editor_* layouts and
 * the editor's French texts. The bundles come from vortex-client/public (`build:bundle`).
 */
export async function bootWindowSystem(): Promise<{manager: WindowManager; texts: EditorTexts}>
{
    const [images, xml] = await Promise.all([AssetBundle.load('/assets-images.bundle'), AssetBundle.load('/assets-xml.bundle')]);

    await Promise.all(FONTS.map(async ([family, file, weight, style]) =>
    {
        const bytes = xml.getBytes(`webfonts/${file}`);

        if(!bytes) return;

        document.fonts.add(await new FontFace(family, bytes.slice().buffer, {weight, style}).load());
    }));

    // mapeditor last: its keys win over a homonym elsewhere.
    const texts = new EditorTexts(...Object.entries(FRENCH_TEXTS).sort(([a], [b]) => Number(a.includes('mapeditor')) - Number(b.includes('mapeditor'))).map(([, text]) => text));
    const manager = new WindowManager({interpolate: text => text});

    // The engine's game widgets (avatar, badge, furni…), placeholders here as in Glaze: the
    // owner's NPC layouts name avatar_image, which draws nothing until the editor renders avatars.
    for(const type of GAME_WIDGET_TYPES) manager.widgets.register(type, () => null);

    manager.setLocalization(texts);
    manager.initialize();

    const descriptionKey = `window-skins/${DESCRIPTION}.xml`;
    let description = parseElementDescriptionXml(xml.getText(descriptionKey) ?? '', DESCRIPTION, descriptionKey);
    const skins = new Map<string, ISkinData>();

    for(const key of xml.listKeys('window-skins/'))
    {
        if(key === descriptionKey) continue;

        const skin = parseSkinXml(xml.getText(key) ?? '', baseName(key), key);

        if(skin) skins.set(skin.id, skin);
    }

    for(const [path, text] of Object.entries(AUTHORED_SKINS))
    {
        const name = baseName(path);

        if(name === DESCRIPTION)
        {
            const authored = parseElementDescriptionXml(text, name, path);

            if(authored) description = description ? mergeElementDescription(description, authored) : authored;
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

    // All of them: a frame or a button builds its own parts out of the layouts its element
    // descriptor names (`habbo_window_layout_frame_xml`…).
    for(const key of xml.listKeys('window-layouts/'))
    {
        for(const layout of parseWindowLayoutXml(xml.getText(key) ?? '', baseName(key), key))
        {
            if(layout.name) manager.registerWidgetLayout(layout.name, layout.xml);
        }
    }

    for(const [path, text] of Object.entries(EDITOR_LAYOUTS)) manager.registerWidgetLayout(baseName(path), text);
    for(const [path, text] of Object.entries(OWN_LAYOUTS)) manager.registerWidgetLayout(baseName(path), text);

    return {manager, texts};
}
