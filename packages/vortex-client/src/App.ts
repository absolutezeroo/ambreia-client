import type {IVortexConfig, IVortexWindowAssets} from 'vortex-engine';
import {ENGINE_FEATURES} from 'vortex-engine';
import {loadConfig, ConfigError} from '@ambreia/kernel/config/loadConfig';
import type {IKernelConfig} from '@ambreia/kernel/config/loadConfig';
import {browserSources, parseConfigJson} from '@ambreia/kernel/config/browserSources';
import {featureSections} from '@ambreia/kernel/feature/defineFeature';
import {FeatureDependencyError} from '@ambreia/kernel/feature/bootFeatures';
import {Vortex} from 'vortex-engine';
import {FRAME_CHANNEL_UI, FrameTimings} from '@ambreia/common/utils/FrameTimings';
import {SiteChannel} from './SiteChannel';
import {HabboCommunicationManagerEvent} from '@ambreia/game/communication/enum/HabboCommunicationManagerEvent';
import {AssetTypeDeclaration} from '@ambreia/common/assets/AssetTypeDeclaration';
import {UnknownAsset} from '@ambreia/common/assets/UnknownAsset';
import {RoomEngineEvent} from '@ambreia/iso/scene/events/RoomEngineEvent';
import type {AssetUrlSource} from '@ambreia/ui/IResourceManager';
import type {ISkinData} from '@ambreia/ui/index';
import {mergeElementDescription, mergeSkin} from '@ambreia/ui/assets/SkinMerge';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowController} from '@ambreia/ui/WindowController';
import {WindowContext} from '@ambreia/ui/WindowContext';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import {NativeWheelDelta} from '@ambreia/ui/utils/NativeWheelDelta';
import {GlyphAtlas} from '@ambreia/ui/utils/GlyphAtlas';
import type {WindowMouseOperator} from '@ambreia/ui/services/WindowMouseOperator';
import {Logger} from '@ambreia/common/utils/Logger';
import type {IElementDescriptionData} from '@ambreia/game/window/index';
import type {RoomUI} from '@ambreia/game/ui/RoomUI';
import type {RoomDesktop} from '@ambreia/game/ui/RoomDesktop';
import type {VortexLoadingScreen} from './VortexLoadingScreen';
import {AssetBundle} from '@ambreia/common/assets/AssetBundle';
import {installWindowDebugger} from './debugger/WindowDebuggerOverlay';
import {
    type IWindowLayoutXmlData,
    parseElementDescriptionXml,
    parseSkinXml,
    parseWindowLayoutXml
} from '@ambreia/ui/assets/WindowXmlAssetParser';
import './_index.scss';

const log = Logger.getLogger('client.App');

/**
 * The element description's asset name.
 *
 * Derived name: `init` is declared in no AS3 tree — the trace points
 * at the class it belongs to, but the identifier itself is this port's.
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::init()
 * asks for it by this exact name; build-window-assets.mjs emits it under the same name, so the
 * bundle key and the AS3 asset name are the one string.
 */
const ELEMENT_DESCRIPTION_ASSET = 'habbo_element_description_xml';

const EMBEDDED_AVATAR_XML_ASSET_NAMES = [
    'action_offset_lay',
    'action_offset_swim',
    'dance_sixseven_animation',
    'HabboAvatarAnimation',
    'HabboAvatarFigure',
    'HabboAvatarGeometry',
    'HabboAvatarPartSets',
];

/**
 * The `default_localizations*` embeds declared by `HabboLocalizationCom.as`, by asset name.
 *
 * `default_localizations` is the english-only global file; the rest are per-language and are
 * layered on top of it (see HabboLocalizationManager.loadDefaultEmbedLocalizations()).
 */
const EMBEDDED_LOCALIZATION_ASSET_NAMES = [
    'default_localizations',
    'default_localizations_de',
    'default_localizations_dk',
    'default_localizations_en',
    'default_localizations_es',
    'default_localizations_fi',
    'default_localizations_fr',
    'default_localizations_it',
    'default_localizations_nl',
    'default_localizations_no',
    'default_localizations_pt',
    'default_localizations_se',
    'default_localizations_tr',
];

function parseJson<T>(value: string): T | null 
{
    try 
    {
        return JSON.parse(value) as T;
    }
    catch (_error) 
    {
        return null;
    }
}

function parseElementDescriptionFromBundle(raw: string, source: string): IElementDescriptionData | null
{
    return parseElementDescriptionXml(raw, ELEMENT_DESCRIPTION_ASSET, source);
}

function parseSkinFromBundle(raw: string, skinId: string, source: string): ISkinData | null
{
    return parseSkinXml(raw, skinId, source);
}

/**
 * Registers the bundled webfonts with the browser's FontFace API.
 *
 * The .ttf files are bundled (they land in the "xml"/other-binary bundle
 * alongside XML/text assets — anything that isn't an image extension), but
 * nothing was ever loading them: `TextStyleManager.mapFontFace()` emits CSS
 * `font-family: "Volter (Goldfish)", Ubuntu, Arial, sans-serif` (and plain
 * "Ubuntu"), expecting those families to already be registered. Without this,
 * every window/button caption silently falls back to Arial/sans-serif — no
 * console warning, since an unregistered CSS font-family is just skipped.
 *
 * Two more real mismatches of the same kind, both previously unregistered
 * under any name:
 * - Chat bubbles use the plain family `"Volter"` (`ChatStyleLibrary.as`'s
 *   real default — verified byte-for-byte at `ChatStyleLibrary.as:114` in
 *   the primary `WIN63-202607011411-782849652` source — no "(Goldfish)"
 *   suffix, and none of the 89 real chat styles in `chatstyles_xml.xml`
 *   override it), which never matched the `"Volter (Goldfish)"` registration
 *   above, so chat text silently rendered in the browser default font.
 * - `"UbuntuThick"` is used verbatim as a literal `font_face` in real AS3
 *   layout XML (`games_main`, `snowwar_*`) but isn't derived from
 *   `TextStyleManager` at all, so it was never registered under any name.
 */
const WEBFONT_FACES: Array<{ family: string; file: string; weight?: string; style?: string }> = [
    {family: 'Volter (Goldfish)', file: 'webfonts/Volter.ttf', weight: 'normal'},
    {family: 'Volter (Goldfish)', file: 'webfonts/Volter Bold.ttf', weight: 'bold'},
    {family: 'Volter', file: 'webfonts/Volter.ttf', weight: 'normal'},
    {family: 'Volter', file: 'webfonts/Volter Bold.ttf', weight: 'bold'},
    {family: 'Ubuntu', file: 'webfonts/Ubuntu.ttf', weight: 'normal', style: 'normal'},
    {family: 'Ubuntu', file: 'webfonts/Ubuntu-b.ttf', weight: 'bold'},
    {family: 'Ubuntu', file: 'webfonts/Ubuntu-i.ttf', style: 'italic'},
    {family: 'Ubuntu', file: 'webfonts/Ubuntu-ib.ttf', weight: 'bold', style: 'italic'},
    {family: 'Ubuntu Condensed', file: 'webfonts/Ubuntu-C.ttf', weight: 'normal'},
    {family: 'UbuntuThick', file: 'webfonts/Ubuntu-thick-b.ttf', weight: 'normal'},
];

async function loadWebFonts(bundle: AssetBundle): Promise<void>
{
    // The atlas rasterises through truffle-text's generative engine, which
    // reproduces Flash's Saffron output — measured at 0.0025-0.06 mean coverage
    // error per pixel against captures of the real client, where fillText sat
    // at 0.15-0.21. The engine package does not depend on it (its WebAssembly
    // cannot go through the dev-time engine pre-bundle), so the client
    // constructs it and hands it over.
    try
    {
        const {SaffronText} = await import('truffle-text/generative');

        GlyphAtlas.setTextEngine(SaffronText.fromFonts([]));
    }
    catch (error)
    {
        log.warn('Text engine unavailable; text falls back to ctx.fillText().', error);
    }

    await Promise.all(WEBFONT_FACES.map(async ({family, file, weight, style}) =>
    {
        const bytes = bundle.getBytes(file);

        if(!bytes) 
        {
            log.warn(`Webfont not found in bundle: ${file}`);

            return;
        }

        try 
        {
            const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
            const face = new FontFace(family, buffer, {weight, style});

            await face.load();
            document.fonts.add(face);

            // The same bytes go to the glyph atlas, which rasterises outlines
            // rather than calling fillText() — see GlyphAtlas.registerFont().
            GlyphAtlas.registerFont(family, weight ?? 'normal', style ?? 'normal', buffer);
        }
        catch (error) 
        {
            log.warn(`Failed to load webfont ${file}:`, error);
        }
    }));
}

/**
 * Gives `url.prefix` / `pocket.api` the origin the client is being served from, wherever the
 * shipped configuration leaves them empty.
 *
 * Empty is how that file spells "same origin", and it is the one thing it cannot spell:
 * `HabboConfigurationManager.parseKeyValueConfiguration()` keeps a line only while
 * `parts[1].length > 0`, so an empty value means the key does not EXIST — and `interpolate()`
 * returns `''` for the WHOLE value the moment one `${...}` key is missing. `external.variables.txt`
 * then comes back blank and the boot dies on "Missing external.variables.txt". Both behaviours are
 * AS3's, so the value has to be real.
 *
 * It has to be computed rather than written down: this client is served at its own root, under
 * vortex-web's `/client`, and through a tunnel, and each one needs a different prefix — including
 * a different SCHEME, which is what an absolute `http://…` in the file gets blocked for on an
 * https page. A non-empty value is left alone, so a deployment that really does serve its assets
 * from another origin keeps saying so; a checkout that regenerates `configurations/` from the dump
 * gets `http://vortex-assets.local` back and is the case to look at first if this returns.
 */
function fillOriginPrefixes(configuration: string): string
{
    // `\r?` before the anchor: the shipped file has CRLF endings, and `$` under /m stops before the
    // newline but not before the carriage return.
    return configuration.replace(/^([ \t]*(?:url\.prefix|pocket\.api)(?:\.[a-z0-9]+)?=)[ \t]*\r?$/gim,
        (_line, assignment: string) => `${assignment}${window.location.origin}`);
}

function readEmbeddedConfigurationAssets(bundle: AssetBundle): Record<string, string>
{
    const assets: Record<string, string> = {};
    const commonConfiguration = bundle.getText('configurations/common_configuration_txt.txt');
    const localizationConfiguration = bundle.getText('configurations/localization_configuration_txt.txt');

    if(commonConfiguration !== null)
    {
        assets.common_configuration = fillOriginPrefixes(commonConfiguration);
    }

    if(localizationConfiguration !== null)
    {
        assets.localization_configuration = localizationConfiguration;
    }

    // AS3: HabboLocalizationCom's default_localizations* embeds, read by
    // HabboLocalizationManager.loadDefaultEmbedLocalizations(). These are the only texts the login
    // flow has — it runs before any external text file is fetched — so without them every login
    // caption renders as its raw ${key}.
    for(const assetName of EMBEDDED_LOCALIZATION_ASSET_NAMES)
    {
        const content = bundle.getText(`configurations/${assetName}_txt.txt`);

        if(content !== null)
        {
            assets[assetName] = content;
        }
    }

    const bundleKeys = bundle.listKeys();

    for(const assetName of EMBEDDED_AVATAR_XML_ASSET_NAMES)
    {
        const content = readEmbeddedAvatarXmlAsset(bundle, bundleKeys, assetName);

        if(content !== null)
        {
            assets[assetName] = content;
        }
    }

    const chatStylesXml = bundle.getText('configurations/chatstyles_xml.xml');

    if(chatStylesXml !== null)
    {
        assets.chatstyles_xml = chatStylesXml;
    }

    const chatStylesManifest = readChatStylesManifest(bundle);

    if(chatStylesManifest)
    {
        for(const [styleId, flags] of Object.entries(chatStylesManifest))
        {
            if(!flags.hasRegpoints) continue;

            const content = bundle.getText(`configurations/style_${styleId}_regpoints.txt`);

            if(content !== null) assets[`style_${styleId}_regpoints`] = content;
        }
    }

    return assets;
}

interface IChatStyleAssetFlags
{
    hasBase: boolean;
    hasPointer: boolean;
    hasEmblem: boolean;
    hasEmblemMultiline: boolean;
    hasIcon: boolean;
    hasColor: boolean;
    hasSelectorPreview: boolean;
    hasRegpoints: boolean;
}

const CHAT_STYLE_IMAGE_SUFFIX_BY_FLAG: Record<string, string> = {
    hasBase: 'chat_bubble_base',
    hasPointer: 'chat_bubble_pointer',
    hasEmblem: 'chat_bubble_emblem',
    hasEmblemMultiline: 'chat_bubble_emblem_multiline',
    hasIcon: 'icon',
    hasColor: 'chat_bubble_color',
    hasSelectorPreview: 'selector_preview',
};

function readChatStylesManifest(bundle: AssetBundle): Record<string, IChatStyleAssetFlags> | null
{
    const raw = bundle.getText('configurations/chatstyles-manifest.json');

    if(raw === null) return null;

    return parseJson<Record<string, IChatStyleAssetFlags>>(raw);
}

/**
 * Registers every extracted chat-style bitmap (packages/vortex-client/tools/
 * import-chatstyles.mjs's output) into AssetLibrary as a raw ImageBitmap - NOT through
 * the standard image/png -> BitmapDataAsset pipeline (readImageAssets() below, blob
 * URLs consumed by WindowManager), because ChatStyle.ts::getNewBackgroundSprite() draws
 * these directly via OffscreenCanvas.drawImage(), which needs a real ImageBitmap, not the
 * PixiJS Texture BitmapDataAsset.content would return.
 *
 * TS-only: no AS3 equivalent, this is infrastructure for the web port's asset bundling.
 */
async function registerChatStyleImageAssets(vortex: Vortex, imageBundle: AssetBundle, xmlBundle: AssetBundle): Promise<void>
{
    const manifest = readChatStylesManifest(xmlBundle);

    if(!manifest) return;

    const declaration = vortex.assets.getAssetTypeDeclarationByMimeType('application/octet-stream')
		?? new AssetTypeDeclaration('application/octet-stream', UnknownAsset);

    const tasks: Promise<void>[] = [];

    for(const [styleId, flags] of Object.entries(manifest))
    {
        for(const [flagKey, suffix] of Object.entries(CHAT_STYLE_IMAGE_SUFFIX_BY_FLAG))
        {
            if(!flags[flagKey as keyof IChatStyleAssetFlags]) continue;

            const assetName = `style_${styleId}_${suffix}`;

            tasks.push(imageBundle.getImageBitmap(`images/${assetName}.png`).then((bitmap) =>
            {
                if(!bitmap) return;

                const asset = new UnknownAsset(declaration, assetName);

                asset.setUnknownContent(bitmap);
                vortex.assets.setAsset(assetName, asset, true);
            }));
        }
    }

    await Promise.all(tasks);
}

/**
 * Reads every window layout for the *asset library*, keyed by its file basename.
 *
 * The layouts already go into the window manager's widget-layout registry (see
 * `readWindowAssets()`), which serves `buildWidgetLayout(name)`. But a whole family of ported
 * views does what AS3 does and reads the layout out of its component's asset library instead —
 * `assets.getAssetByName("settings_xml").content` — and nothing ever put a layout there: the
 * library only held images, sounds, the avatar configurations and the chat styles. Every one of
 * those lookups returned null, and each site turned that into "Missing layout X" and gave up.
 *
 * Handed to `Vortex.bootstrap()` rather than pushed in afterwards, which is what this used to do:
 * components that build their window the moment the window-manager IID resolves, inside
 * prepareCore(), asked for their layout before this had run.
 *
 * The name is the **file basename**, which `tools/build-window-assets.mjs` takes from the
 * `*Com.as` field name — the exact string AS3 passes to `getAssetByName()`. Deliberately *not*
 * the internal `<layout name="...">`: that is a Flash-authoring label AS3 never reads, it differs
 * from the real name for 633 of 783 layouts, and 86 of those internal names are shared by two or
 * more files (see CLAUDE.md → Assets).
 */
/**
 * Reads every bundled image twice over: once as a blob URL for the window manager's
 * `ResourceManager` (what an `asset_uri` resolves against), and once — for a scoped subset — as a
 * decoded `ImageBitmap` for the asset library.
 *
 * Both halves are handed to `Vortex.bootstrap()` instead of pushed in after it returns, which is
 * what this used to do from `initClientUi()`, two steps *after* `connect()`. Components built
 * during prepareCore() read from both: HabboGroupsManager's badge editor wants `badge_part_add`
 * out of the library in its own constructor, and a window built at DI time wants the URL
 * registry for its every `asset_uri`. Neither existed yet, and both failed silently.
 *
 * The library half is scoped rather than covering the whole images/ bundle, because it eagerly
 * decodes an ImageBitmap per entry and nothing else needs library access today:
 * - ctlg_*: catalog swatches/slot backgrounds, read by every CatalogWidget.getAssetBitmapData()
 *   caller — ColourGridCatalogWidget's swatches, RecyclerCatalogWidget's slot background.
 * - fx_icon_* / memenu_fx_*: the me-menu EffectsWidget rows read these programmatically
 *   (effect icon + play/pause hilite) via assets.getAssetByName(...).content.
 * - color_chooser_* / badge_part_* / position_*: the group creation wizard - every
 *   ColorGridCtrl swatch cell, and the badge editor's empty/add/picker markers and
 *   3x3 position grid, all via HabboGroupsManager.getButtonImage().
 * - avatar_editor_*: the whole avatar editor reads bitmaps programmatically -
 *   AvatarEditorGridColorItem tints the shared `..._clr_13x21_2` chip per swatch,
 *   HabboAvatarEditor sets the remove-selection and get-more icons on its two synthetic
 *   tiles, AvatarEditorGridPartItem paints the download icon and the selection hilite,
 *   and WardrobeSlot asks for the empty-slot artwork. Without these the palettes render
 *   white and the remove tile renders nothing - exactly the silent failure this comment
 *   warns about.
 * - LIBRARY_IMAGE_NAMES: the rest, one-off lookups by exact name.
 *
 * That list grows once per feature that reads a bitmap from the library, which is a standing
 * trap: a missing entry does not fail loudly, it just renders nothing. The current set was found
 * by grepping every getAssetByName('<literal>') call against the images/ bundle; re-run that when
 * a bitmap comes out blank.
 *
 * @see sources/win63_version/habbo/window/ResourceManager.as
 */
async function readImageAssets(imageBundle: AssetBundle, layoutNames: ReadonlySet<string>): Promise<{
    imageUrls: Map<string, AssetUrlSource>;
    libraryImages: Map<string, ImageBitmap>;
}>
{
    const imageUrls = new Map<string, AssetUrlSource>();
    const libraryImages = new Map<string, ImageBitmap>();
    const decodes: Promise<void>[] = [];

    for(const key of imageBundle.listKeys('images/'))
    {
        // Extract asset name: 'images/icons_toolbar_reception_normal.png' → 'icons_toolbar_reception_normal'.
        // A subfolder stays in the name ('images/rpg/skills/x.png' → 'rpg/skills/x'): the RPG icon
        // sets reuse file names across folders (icon_00…icon_63 in each), so the bare file name
        // would let the last folder overwrite the others.
        const name = key.slice('images/'.length).replace(/\.png$/, '');

        // Registered as a thunk, not a URL. Every *name* still goes in before the engine boots
        // (that is what `hasAsset()` and the pre-bootstrap registration need — see
        // registerWindowAssetLibraryContent()), but `getUrl()` builds a Blob and an object URL,
        // and doing that for all 2,891 entries measured 583 ms of main thread and a 9.1 MB copy
        // of the bundle in blob storage. Deferred, it is ~200 us on the first request for the
        // handful of assets a session actually shows. `AssetBundle.getUrl()` caches, so a second
        // request for the same name costs nothing.
        imageUrls.set(name, () => imageBundle.getUrl(key));

        // Three sources, in order of how much they are trusted.
        //
        // 1. `layoutNames` — every image the shipped layouts actually ask for, read out of the
        //    layouts. This is the part that used to be guessed at, and the guess was wrong both
        //    ways: it decoded some 491 images no layout names, and missed 453 that they do.
        //
        // 2. The prefixes below, which are the families resolved at RUNTIME and therefore in no
        //    layout — an effect icon keyed by effect id, a species preview keyed by a localisation
        //    key, a catalog icon by page, a badge part by number, an avatar-editor thumbnail by
        //    figure part. Measured, not assumed: of 126 `fishpedia_*` only 18 are named by a layout
        //    and of 57 `avatar_editor_*` only 29, so dropping these would blank the rest.
        //    `sign_icon_*` is NOT here — all seven are layout-named, which is the point.
        //
        // 3. `LIBRARY_IMAGE_NAMES` — one-off `getAssetByName('…')` calls in code, which no rule can
        //    derive. Almost none of them appear in a layout; that list has to stay explicit.
        //
        // Deliberately in none of the three: `s_fish_area_*`, `h_fishing_rod_*`, `sh_*`,
        // `h_hooked_*`. They are room sprites — the spot furni, the rod, the splash — which the room
        // renderer fetches by URL, and decoding 120-odd of them here would cost memory for something
        // no window ever asks the library for.
        if(layoutNames.has(name)
            || name.startsWith('fx_icon_') || name.startsWith('memenu_fx_')
            || name.startsWith('ctlg_') || name.startsWith('badge_part_')
            || name.startsWith('color_chooser_') || name.startsWith('position_')
            || name.startsWith('avatar_editor_')
            || name.startsWith('fish') || name.startsWith('derby')
            // user_* and number_*: the avatar ADDITIONS — the idle Zzz, the muted and typing
            // bubbles, the blown kiss, the guide bubbles, the number bubble. No layout names them;
            // each is built at runtime from a direction, a frame or a digit, and
            // `AvatarVisualization.getAvatarRendererAsset()` asks the library for the result. Thirty
            // images between them.
            || name.startsWith('user_') || name.startsWith('number_')
            || LIBRARY_IMAGE_NAMES.has(name))
        {
            decodes.push(imageBundle.getImageBitmap(key).then((bitmap) =>
            {
                if(bitmap) libraryImages.set(name, bitmap);
            }));
        }
    }

    // Awaited, unlike the fire-and-forget `.then()` this replaces: `getAssetByName(...).content` is
    // read synchronously, so a bitmap that is still decoding is indistinguishable from one that
    // does not exist. That race is what made `add_friends_icon` miss even though it was registered
    // — the friend-list packet landed first.
    await Promise.all(decodes);

    log.debug(`Read ${imageUrls.size} image URLs and decoded ${libraryImages.size} library bitmaps`);

    return {imageUrls, libraryImages};
}

function readLibraryLayouts(xmlBundle: AssetBundle): Map<string, string>
{
    const keys = xmlBundle.listKeys('window-layouts/').filter((key) => key.endsWith('.xml'));
    const layouts = new Map<string, string>();

    if(keys.length === 0)
    {
        log.warn('No window layouts in the bundle - every layout lookup will fail.');

        return layouts;
    }

    for(const key of keys)
    {
        const xml = xmlBundle.getText(key);

        if(!xml) continue;

        layouts.set(key.slice('window-layouts/'.length, -'.xml'.length), xml);
    }

    log.debug(`Read ${layouts.size} window layout assets`);

    return layouts;
}

/**
 * Every image name the shipped layouts ask for, read out of the layouts themselves.
 *
 * This replaces a hand-written allowlist of prefixes and one-off names, which was wrong in both
 * directions at once and silently: measured against the layouts, it eagerly decoded some 491 images
 * nothing ever asks the library for, and **missed 453 that the layouts name**. Every one of those is
 * a window that draws nothing with no error — `getAssetByName()` answers null, `setImageAsset()`
 * shrugs, and the slot is blank. The sign grid's seven picture signs were one of them; the
 * infostand's house icon, the catalog icons and the effect icons had each been found the same way,
 * one bug report at a time.
 *
 * Two things in a layout name an image:
 *
 * - `<var key="asset_uri" value="X"/>` — a `<static_bitmap>` naming its own picture.
 * - `tags="icon"` — a bare `<bitmap>` whose pixels code supplies, and the convention every menu
 *   uses is `setImageAsset(icon, icon.name)`, so the window's NAME is the asset name.
 */
// TS-only: the port's own boot-time asset registration; AS3 embedded these per component.
function readLayoutImageNames(layouts: Map<string, string>): Set<string>
{
    const names = new Set<string>();

    for(const xml of layouts.values())
    {
        for(const match of xml.matchAll(/key="asset_uri"\s+value="([^"]+)"/g))
        {
            names.add(match[1]);
        }

        // `name` and `tags` appear in either order across the dump's layouts, so both are matched
        // rather than assuming the one this repository's own generators happen to emit.
        for(const match of xml.matchAll(/<[a-z_]+[^>]*\bname="([^"]+)"[^>]*\btags="([^"]*)"/g))
        {
            if(match[2].split(',').some((tag) => tag.trim() === 'icon')) names.add(match[1]);
        }

        for(const match of xml.matchAll(/<[a-z_]+[^>]*\btags="([^"]*)"[^>]*\bname="([^"]+)"/g))
        {
            if(match[1].split(',').some((tag) => tag.trim() === 'icon')) names.add(match[2]);
        }
    }

    log.debug(`Layouts name ${names.size} image assets`);

    return names;
}

function readEmbeddedAvatarXmlAsset(bundle: AssetBundle, bundleKeys: string[], assetName: string): string | null
{
    const candidates = [
        `configurations/${assetName}.xml`,
        `configurations/${assetName}_xml.xml`,
        `configurations/${assetName}.json`,
        `avatar/${assetName}.xml`,
        `avatar/${assetName}_xml.xml`,
        `${assetName}.xml`,
        `${assetName}_xml.xml`,
    ];

    for(const candidate of candidates) 
    {
        const content = bundle.getText(candidate);

        if(content !== null) 
        {
            return content;
        }
    }

    const suffixMatch = bundleKeys.find((key) => 
    {
        return key.endsWith(`/${assetName}.xml`)
            || key.endsWith(`/${assetName}_xml.xml`)
            || key.endsWith(`/${assetName}.json`);
    });

    return suffixMatch ? bundle.getText(suffixMatch) : null;
}

function parseLayoutEntries(raw: string, source: string, baseName: string): IWindowLayoutXmlData[]
{
    return parseWindowLayoutXml(raw, baseName, source);
}

/**
 * The client's configuration, before anything of the game loads (spec §5): defaults computed from
 * the page, the deployment's config.json (none = defaults), then ?sso= and ?link=. Validated and
 * frozen; a ConfigError lists every faulty field.
 */
async function loadClientConfig(): Promise<IKernelConfig>
{
    const response = await fetch(`${import.meta.env.BASE_URL}config.json`).catch(() => null);
    const text = response !== null && response.ok && (response.headers.get('content-type') ?? '').includes('json') ? await response.text() : null;
    const {config, warnings} = loadConfig(browserSources(window.location, parseConfigJson(text)), featureSections(ENGINE_FEATURES));

    for(const warning of warnings) log.warn(warning);

    return config;
}

/**
 * The client cannot start: an invalid configuration or a feature waiting on one that is missing.
 * Shown instead of the hotel, with every reason, so a deployment mistake is read, not guessed.
 */
function showBootError(title: string, lines: readonly string[]): void
{
    const panel = document.createElement('div');

    panel.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#1b1e24;color:#e8e8ec;font:14px monospace;padding:32px;overflow:auto';
    panel.innerHTML = `<h2 style="margin:0 0 16px;font:bold 18px sans-serif">${title}</h2>`;

    const list = document.createElement('ul');

    for(const line of lines)
    {
        const item = document.createElement('li');

        item.textContent = line;
        list.appendChild(item);
    }

    panel.appendChild(list);
    document.body.appendChild(panel);
}

/**
 * VortexApp — Canvas-based application shell.
 *
 * The whole client renders into a single `<canvas>` element.
 * The engine's WindowRenderer composites all window layers into an OffscreenCanvas,
 * which is then drawn onto the DOM canvas via requestAnimationFrame. Mouse events
 * on the canvas are hit-tested against the window tree and dispatched to the
 * appropriate WindowController.
 *
 * This mirrors the AS3 pattern where WindowRenderer composed everything into a
 * single BitmapData displayed as a Bitmap on the Stage.
 */
/**
 * Images that some ported class fetches from the asset library by exact name, rather than
 * through the window manager's URL registry. Prefix families are handled inline in
 * readImageAssets(); this is for the one-offs.
 *
 * - dimmer_slider_*: BackgroundColorWidgetSlider's track and thumb.
 * - stickie_*: StickieFurniWidget's blank note, close and delete buttons.
 * - thumb_up: ExtraInfoPromoItem in the catalog's bundle purchase display.
 * - the friend list block: every bitmap HabboFriendList.getButtonImage() resolves, which is
 *   every `*_png` field of `binaryData/HabboFriendListCom.as` — that file is the authority,
 *   not a grep of call sites, because AS3 loads them from that component's own library.
 *   Tab headers (hdr_*), the category arrows, the footer buttons and the row buttons.
 */
const LIBRARY_IMAGE_NAMES: ReadonlySet<string> = new Set([
    // HabboFreeFlowChatCom.as — the chat-history tray. Every one is read by a *variable*
    // (`createBitmapSprite(chatFlow, name)`, `createSlice(chatFlow, name, grid)`), so the grep
    // this file prescribes cannot see them: the literal is at the call site, not inside the
    // `getAssetByName()` call. The `*Com.as` field names are the authority, as for the friend
    // list below. Without them the tray opens as a bare dark column: no bar, no handle — and no
    // handle means no hit area, so the only way to shut it again is the room-tools button.
    // `room_change` is the older miss of the set: `getRoomChangeBitmap()` has answered null since
    // it was written, so every room-change divider drew its timestamp and name over nothing.
    'close_x',
    'room_change',
    'scrollbar_back',
    'scrollbar_thumb',
    'tray_bar',
    'tray_handle_close',
    'tray_handle_open',

    // Second sweep, over `refreshButton(container, name, ...)` rather than
    // `getAssetByName('<literal>')`. The prescribed grep cannot see these: the
    // name is an argument that HabboNavigator.getButtonImage() resolves, so no
    // literal lookup exists to grep. Every icon in the in-room room-info view
    // is in here.
    'create_room',
    'doormode_doorbell_small',
    'doormode_invisible_small',
    'doormode_password_small',
    'favourite',
    'group_base_icon',
    'home',
    'icon_weblink',
    'make_favourite',
    'make_home',
    'navi_room_icon',
    'popup_arrow_down',
    'remove_rights',

    // Found by the sweep this file's own comment prescribes — every literal
    // getAssetByName() in the monorepo, intersected with the images bundle,
    // minus what was already listed. Twenty names came back: each of them had
    // a PNG shipping, a call site reading it, and no library entry, so each
    // rendered nothing at all. The infostand's house icon is what exposed them.
    'dimmer_color_button',
    'dimmer_color_frame',
    'dimmer_color_selected',
    'dimmer_info',
    'extend_hilite',
    'gift_icon_background',
    'gift_incognito',
    'icon_home',
    'inventory_furni_icon_credits',
    'memenu_settings_slider_base',
    'memenu_settings_slider_button',
    'small_pen',
    'sounds_off_color',
    'sounds_off_white',
    'sounds_on_color',
    'sounds_on_white',
    'use_product_preview_bg',

    'dimmer_slider_base',
    'dimmer_slider_button',

    // HabboCatalog.getSubscriptionProductIcon(): the icon every subscription product renders
    // with. `fx_icon_*` (its sibling) is already covered by the prefix rule above. The RPG fork
    // removed the mint-token products, and with them `minting_token_large`.
    'icon_hc',

    // ProductContainer.setAddOnIcon(): the add-on marker on an offer that bundles a badge / chat
    // style or the ninja effect. Read through the method's parameter, so the literal grep missed
    // them; without them the null asset threw and took the whole catalog page down with it.
    'catalog_icon_badge_included',
    'catalog_icon_ninja_effect_included',
    'stickie_blanco',
    'stickie_close',
    'stickie_remove',
    'thumb_up',

    // HabboFriendListCom.as
    'arrow_down_black',
    'arrow_down_white',
    'arrow_right_black',
    'arrow_right_white',
    'ask_for_friend',
    'follow_friend',
    'hdr_friend_requests',
    'hdr_friends',
    'hdr_hilite',
    'hdr_search',
    'minimail',
    'offline',
    'open_edit_ctgs',
    'open_homepage',
    'open_inbox',
    'open_minimail',
    'opened_to_web',
    'popup_arrow_left',
    'popup_arrow_right',
    'remove_friend',
    'room_invite',
    'search',
    'start_chat',

    // HabboFriendBarCom.as — the icons the bar's slots read by exact name.
    // `find_friends_icon` is declared in that component but was never extracted into
    // src/assets/images/, so AddFriendsTab shows no icon; AS3 guards the lookup the same
    // way, so this is a missing asset rather than a code gap.
    'add_friends_icon',
    'plus_friend_icon',
    'find_friends_icon',

    // HabboNotificationsCom.as — the icons `habbo_notifications_config_xml` names per
    // notification type. SingularNotificationController resolves each one to a bitmap at
    // startup and hands it to the bubble; a missing entry costs the notification its icon and
    // nothing else, which is the silent failure this list exists to prevent.
    'if_icon_temp',
    'if_icon_hc',
    'if_icon_vip',
    'if_icon_recycler',
    'if_icon_ltd',
    'if_icon_earning',

    // The rod-quality indicator in the Fishopedia's header, one sprite per tier.
    'fishing_skill_level_0',
    'fishing_skill_level_1',
    'fishing_skill_level_2',
    'fishing_skill_level_3',
    'fishing_skill_level_4',
    'fishing_skill_level_5',

    // The Fish Token, beside its count in the same header.
    'icon_fish_token',
]);

export class VortexApp 
{
    /**
    * Atlas spritesheet names that need to be decoded as ImageBitmaps.
    *
    * Every compiled window-skin template references one of these by name (the
    * `templates[].asset` field in `window-skins/*.xml`) — this must cover every
    * distinct name any compiled skin uses, or that skin's pieces silently never render.
    */
    private static readonly ATLAS_NAMES = [
        'habbo_blue_skin',
        'habbo_skin_ubuntu',
        'habbo_skin_illumina_dark',
        'habbo_skin_illumina_light',
        'habbo_icons',
        'skin_ubuntu_bg_9',
        'habbo_border_hsv_layers',
        'habbo_border_hsv_layers2',
        'leaderboard_button_close',
        'ubuntu_frame_leaderboard_ach',
        'ubuntu_frame_leaderboard_all',
        'ubuntu_frame_leaderboard_rarity_1',
        'ubuntu_frame_leaderboard_rarity_2',
        'ubuntu_frame_leaderboard_rarity_3',
        'ubuntu_frame_leaderboard_rarity_4',
        'ubuntu_frame_leaderboard_rarity_5',
        'ubuntu_frame_leaderboard_rarity_uncommon',
        'illumina_dark_scrollbar_horizontal',
        'illumina_dark_scrollbar_vertical',
        'illumina_light_balloon',
        'illumina_light_border_etched',
        'illumina_light_border_frame',
        'illumina_light_border_infobox',
        'illumina_light_border_light',
        'illumina_light_border_raised',
        'illumina_light_border_sunk',
        'illumina_light_bubble_chat_bg',
        'illumina_light_button_default',
        'illumina_light_button_dark_recolorable',
        'illumina_light_button_frame_close',
        'illumina_light_button_frame_menu',
        'illumina_light_button_frame_minimize',
        'illumina_light_button_multi',
        'illumina_light_button_unetched',
        'illumina_light_checkbox_basic',
        'illumina_light_input_chat',
        'illumina_light_radio_button',
        'illumina_light_scrollbar_horizontal',
        'illumina_light_scrollbar_vertical',
        'illumina_light_switch',
        'illumina_purple_border_frame',
        'illumina_purple_button_default',
        'illumina_purple_button_frame_close',

        // Vortex's own sheet, not from the dump: the art src/vortex-skins/ cuts its regions out of.
        // Built by tools/build-vortexcoin-icon.mjs, which is also what documents its layout.
        'vortex_icons',
    ];

    /**
    * Atlas names whose embedded-asset name doesn't match its file on disk.
    * `skin_ubuntu_bg_9` is the AS3 variable name (`HabboWindowManagerCom.as`); the
    * actual bundled file is `ubuntu_bg_9.png` (the embedded resource's own name).
    */
    private static readonly ATLAS_FILE_OVERRIDES: Record<string, string> = {
        skin_ubuntu_bg_9: 'ubuntu_bg_9',
    };

    private _canvas: HTMLCanvasElement | null = null;
    private _ctx: CanvasRenderingContext2D | null = null;
    private _animFrameId: number = 0;
    private _uiCompositeDirty: boolean = true;
    private _lastUiRenderVersion: number = -1;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as::_disposed
    private _disposed: boolean = false;
    // AS3: .../src/binaryData/HabboAir.as::_loadingScreen
    private _loadingScreen: VortexLoadingScreen | null;

    /** Memoized engine boot — see bootstrapEngine(). */
    private _enginePromise: Promise<typeof Vortex.instance> | null = null;
    private _imageBundle: AssetBundle | null = null;
    private _xmlBundle: AssetBundle | null = null;
    private _uninstallWindowDebugger: (() => void) | null = null;

    /** True between `setAuthenticated` and the next disconnect: when a link may actually be fired. */
    private _authenticated: boolean = false;

    // TS-only: the link to fire once authenticated: `?link=`, or one the site posted while booting.
    private _startLink: string | null = null;

    /** The `message` listener installed by `installLinkChannel`, kept so `dispose()` can remove it. */
    private _linkChannel: ((event: MessageEvent) => void) | null = null;

    /** Whether the mouse button is currently down. */
    private _mouseDown: boolean = false;

    /** The window that received the last DOWN event (for drag/UP tracking). */
    private _mouseDownWindow: IWindow | null = null;

    /** Document-level mousemove handler (for drag/scale). */
    private _docMoveHandler: ((e: MouseEvent) => void) | null = null;

    /** Document-level mouseup handler (for drag/scale). */
    private _docUpHandler: ((e: MouseEvent) => void) | null = null;

    /** Whether we are currently in a room (for mouse event routing). */
    private _isInRoom: boolean = false;

    /** Active room ID for mouse routing. */
    private _activeRoomId: number = -1;

    /**
     * Reusable scratch point for getGlobalPosition() in the mouse handlers.
     * The mouse-move/wheel paths run per DOM event (and per parent-chain step),
     * so a shared scratch avoids allocating a fresh {x, y} on every hit-test.
     * getGlobalPosition() overwrites x/y and the caller consumes them
     * synchronously before the next use, so a single instance is safe.
     */
    private readonly _globalPosScratch = {x: 0, y: 0};

    // DEVIATION: AS3's `createLoadingScreen()` is a method OF this class — it news up a
    //   `HabboLoadingScreen` sized off `stage`, nudges the bar to 0.6 and `addChild`s it. All
    //   three have a home here and none of them can be that method. The screen is a DOM overlay
    //   that sizes itself at 100%/100% and appends itself in its own constructor, so there is no
    //   stage to measure and no child to add; the 0.6 survives as `CORE_RATIO` in `init()`, which
    //   is the same ceiling reached progressively rather than in one jump. What is left — the
    //   `new` — is hoisted to `index.ts` ON PURPOSE: it runs before `new VortexApp()` so that a
    //   failure inside the constructor or `init()` still has a screen to show its error on, which
    //   `index.ts`'s own `.catch()` relies on. Injecting it also keeps this class with one owner
    //   for the screen's lifetime — the second, ungated owner is a bug this file has had before.
    // AS3: sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as::createLoadingScreen()
    constructor(loadingScreen?: VortexLoadingScreen)
    {
        this._loadingScreen = loadingScreen ?? null;
    }

    /**
     * Initializes the application.
     *
     * Bootstraps the engine, loads the asset bundle, configures skins/layouts,
     * creates the canvas, and starts the render loop.
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as
     */
    // AS3: .../src/login/LoginFlow.as::init()
    public async init(): Promise<void>
    {
        // INFO in dev, WARN in production, then the `vortex:log` localStorage key and the `?log=`
        // query parameter layered on top — `__log.set('habbo.room', 'debug')` at runtime, no
        // rebuild. See docs/STYLEGUIDE.md → Logging.
        Logger.configureFromEnvironment(import.meta.env.DEV);

        // Before the bundles, not after: a link posted while they download has to land somewhere,
        // and the listener queues it. Installed later it would simply not be there — the site can
        // post the moment the iframe exists, which is several seconds before the engine does.
        this.installLinkChannel();

        let kernelConfig: IKernelConfig;

        try
        {
            kernelConfig = await loadClientConfig();
        }
        catch (error)
        {
            if(error instanceof ConfigError)
            {
                showBootError('The configuration is invalid', error.issues);

                return;
            }

            throw error;
        }

        // `??=`: a link the site posted while config.json was loading is newer than `?link=`.
        this._startLink ??= kernelConfig.app.startLink ?? null;

        // 1. Load bundles, then bootstrap engine with AS3 embedded configuration assets
        const CORE_RATIO = 0.6;
        const bundleProgress =
            {
                images: 0,
                xml: 0
            };
        const updateBundleProgress = (): void => 
        {
            const ratio = (bundleProgress.images + bundleProgress.xml) / 2;

            this._loadingScreen?.updateLoadingBar(ratio * CORE_RATIO);
        };

        // BASE_URL, not a leading `/`: these two live in `public/`, so they are served under
        // whatever base the client is mounted at. Addressed from the ORIGIN root they were fetched
        // from the proxying site instead when vortex-web serves the client at /client — and a Vite
        // dev server answers an unknown path with its own index.html, 200. The bundle then parsed
        // `<!DO` as its header and died on "Unsupported bundle version: 1008821359", which is that
        // text read as a big-endian int. BASE_URL is `/client/` in dev and `/` in a build.
        const [imageBundle, xmlBundle] = await Promise.all([
            AssetBundle.load(`${import.meta.env.BASE_URL}assets-images.bundle`, (ratio: number) =>
            {
                bundleProgress.images = ratio;
                updateBundleProgress();
            }),
            AssetBundle.load(`${import.meta.env.BASE_URL}assets-xml.bundle`, (ratio: number) =>
            {
                bundleProgress.xml = ratio;
                updateBundleProgress();
            }),
        ]);

        const bundledConfigurations = readEmbeddedConfigurationAssets(xmlBundle);
        const vortexConfig: IVortexConfig = {
            kernel: kernelConfig,
            embeddedConfigurations: bundledConfigurations,
        };

        this._imageBundle = imageBundle;
        this._xmlBundle = xmlBundle;

        // The gate itself is AS3's: with no SSO ticket nothing of the game loads — in particular
        // SessionDataManager (and its furnidata/productdata downloads) is only constructed once
        // the core starts. So the engine boot lives *after* this gate, not before it.
        //
        // DEVIATION: AS3 answers a missing ticket by showing its own login screen, and this port
        //   carried a file-for-file copy of `WIN63-202607011411-782849652/src/login/` to do the
        //   same. That copy is deleted: `vortex-web` authenticates against the very
        //   `Vortex.WebApi` routes the screen drove (`/api/public/authentication/login`,
        //   `/api/ssotoken`) and hands the client a ticket on `?sso=`, so the in-client one was a
        //   second auth surface for one session — reachable by anyone who opened /client directly,
        //   and its `RegisterView` (invented; the dump's `src/login/` registers no account) let a
        //   visitor skip the terms and birthdate the site's registration form asks for. Nothing
        //   here calls it, so it is a redirect, not a screen.
        // AS3: sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as::createLoginFlowOrLoadingScreen()
        const configuredTicket = kernelConfig.app.sso;

        if(!configuredTicket)
        {
            // The site owns the origin root and serves this client under it (`/client`). When it
            // does not — the client alone at the root — there is nobody to send the visitor to and
            // a redirect would only reload this page, so say so rather than loop.
            if(window.location.pathname === '/')
            {
                throw new Error('[VortexApp] No SSO ticket, and no site at the origin root to get one from');
            }

            window.location.replace('/');

            return;
        }

        let vortex: typeof Vortex.instance;

        try
        {
            vortex = await this.bootstrapEngine(vortexConfig);
        }
        catch (error)
        {
            if(error instanceof FeatureDependencyError)
            {
                showBootError('A feature is missing what it needs', error.issues);

                return;
            }

            throw error;
        }

        // AS3: the SSO ticket reaches the client through FlashVars either way — HabboAir
        // writes the one the login flow produced back into the same Dictionary
        // (`_SafeStr_4998["sso.token"] = _loginFlow.ssoToken`) before starting the core.
        const ssoTicket = kernelConfig.app.sso;

        if(ssoTicket)
        {
            vortex.habboCommunication.ssoTicket = ssoTicket;
        }

        this.installConnectionActions(vortex);

        // 5. Create the canvas and set desktop sizes BEFORE creating windows.
        //
        // This used to run after connect(), behind an unconditional dispose of the loading
        // screen. That dispose was a second, ungated owner: VortexMain.onExitFrame() already
        // implements AS3's real condition (`if(_SafeStr_8656 && _SafeStr_9943)` in
        // HabboAir.as — room engine ready AND core running), and AS3 never waits on the
        // connection for it. Doing it here as well meant the loader's lifetime was decided by
        // whichever fired first. The engine now owns it alone, so the canvas has to exist by
        // the time that gate opens — hence before connect() rather than after.
        this.createCanvas();

        await vortex.connect();

        await this.initClientUi(vortex);

        // AS3: `HabboCommunicationManager.onConfigurationComplete()` -> `connection.isConfigured()`.
        // Until that call the connection holds every server message it received after authentication
        // in `_pendingServerMessages` and replays the lot here, in order — which is how Habbo never
        // loses a message that arrives before its handler has subscribed.
        //
        // AS3 hangs it off the configuration manager's "complete" because there that lands after the
        // component graph is up. Here configuration is awaited inside prepareCore(), long before the
        // components attach, so the same binding would open the gate too early — measured, the
        // moderation and help handlers subscribe 1.9s AFTER authentication, which is exactly why
        // ModeratorInit (757) and CfhTopicsInit (1762) were logged as "No registered handler".
        // The equivalent point in this port's boot is here: the engine is up and the client UI is
        // wired, so everything that can subscribe has.
        vortex.habboCommunication.connection?.isConfigured();
    }

    /**
     * Boots the engine and loads everything that depends on it (fonts, chat styles, window
     * skins, layouts). Idempotent: the login flow's avatar creator calls it too, so the two
     * entry points share one boot rather than racing a second one.
     *
     * AS3: HabboAir.as::startCoreInitializationIfPossible() -> prepareCore(). Nothing in here
     * may run before an SSO ticket exists — see the gate in init().
     */
    private bootstrapEngine(vortexConfig: IVortexConfig): Promise<typeof Vortex.instance>
    {
        if(!this._enginePromise)
        {
            this._enginePromise = this.doBootstrapEngine(vortexConfig);
        }

        return this._enginePromise;
    }

    private async doBootstrapEngine(vortexConfig: IVortexConfig): Promise<typeof Vortex.instance>
    {
        const imageBundle = this._imageBundle!;
        const xmlBundle = this._xmlBundle!;

        // The window assets are parsed BEFORE the engine boots and handed to it, so
        // HabboWindowManager owns them at construction the way AS3's does (its third
        // constructor argument is the already-filled AssetLibrary). See IVortexWindowAssets.
        const vortex = await Vortex.bootstrap(
            {...vortexConfig, windowAssets: await this.readWindowAssets(imageBundle, xmlBundle)},
            this._loadingScreen ?? undefined
        );

        if(import.meta.env.DEV)
        {
            // Dev-only console access, e.g. Vortex.instance.configuration.getProperty('...').
            // Vortex is only ever ES-module-imported elsewhere, so without this the class
            // (and its `instance` singleton getter) isn't reachable from the browser console.
            (window as unknown as { Vortex: typeof Vortex }).Vortex = Vortex;
        }

        // Register bundled webfonts (Volter/Ubuntu) before anything renders text —
        // see loadWebFonts() for why this was previously silently missing.
        await loadWebFonts(xmlBundle);

        // Chat-style bitmaps need real ImageBitmaps (not the standard image/png ->
        // BitmapDataAsset/Texture pipeline) - see registerChatStyleImageAssets()'s own
        // header comment for why. chatstyles_xml/regpoints text already went in above via
        // embeddedConfigurations.
        await registerChatStyleImageAssets(vortex, imageBundle, xmlBundle);

        return vortex;
    }

    /**
     * Parses the window skins, atlases and layouts out of the asset bundles.
     *
     * Kept separate from the engine boot on purpose: the result is passed *into*
     * Vortex.bootstrap() (IVortexConfig.windowAssets) rather than pushed onto a live window
     * manager afterwards, which is what AS3 does by handing HabboWindowManagerComponent its
     * AssetLibrary as a constructor argument.
     */
    private async readWindowAssets(imageBundle: AssetBundle, xmlBundle: AssetBundle): Promise<IVortexWindowAssets>
    {
        const windowAssets: IVortexWindowAssets = {};

        // 2. Load element descriptions + atlas bitmaps from bundle
        try
        {
            const elementDescriptionKey = `window-skins/${ELEMENT_DESCRIPTION_ASSET}.xml`;
            const elementDescriptionXml = xmlBundle.getText(elementDescriptionKey);

            if(elementDescriptionXml)
            {
                windowAssets.elementDescription = parseElementDescriptionFromBundle(
                    elementDescriptionXml,
                    elementDescriptionKey
                );
            }

            // Decode atlas spritesheets as ImageBitmaps
            const bitmaps = await Promise.all(
                VortexApp.ATLAS_NAMES.map(name => imageBundle.getImageBitmap(`images/${VortexApp.ATLAS_FILE_OVERRIDES[name] ?? name}.png`))
            );

            const atlases = new Map<string, ImageBitmap>();

            for(let i = 0; i < VortexApp.ATLAS_NAMES.length; i++) 
            {
                const bmp = bitmaps[i];

                if(bmp) atlases.set(VortexApp.ATLAS_NAMES[i], bmp);
            }

            // Load all skin XMLs from bundle
            const skins = new Map<string, ISkinData>();

            for(const key of xmlBundle.listKeys('window-skins/'))
            {
                if(key === elementDescriptionKey)
                {
                    continue;
                }

                const skinXml = xmlBundle.getText(key);

                if(!skinXml)
                {
                    continue;
                }

                // The bundle key's basename is the AS3 asset name (build-window-assets.mjs).
                const skinId = key.split('/').pop()!.replace(/\.xml$/, '');
                const skin = parseSkinFromBundle(skinXml, skinId, key);

                if(skin) skins.set(skin.id, skin);
            }

            // 2b. Vortex's own authored skins (src/vortex-skins/*.xml), registered last so a file
            // named after a dump skin merges into it. Same reasoning as readVortexLayouts() below:
            // src/assets/window-skins/ is gitignored and rebuilt from the dump by
            // tools/build-window-assets.mjs, so a hand-authored file placed there would be wiped
            // on the next asset build.
            const vortexElementDescription = this.readVortexSkins(skins, windowAssets.elementDescription ?? null);

            if(vortexElementDescription)
            {
                windowAssets.elementDescription = vortexElementDescription;
            }

            windowAssets.skins = skins;
            windowAssets.atlases = atlases;
        }
        catch (error)
        {
            log.warn('Failed to load skin/element assets:', error);
        }

        const layoutsByName = new Map<string, string>();

        // 3. Register all window layouts from XML bundle
        for(const key of xmlBundle.listKeys('window-layouts/'))
        {
            const layoutXml = xmlBundle.getText(key);

            if(!layoutXml) 
            {
                continue;
            }

            // The bundle key's basename is the AS3 asset name (build-window-assets.mjs).
            const layoutBaseName = key.split('/').pop()!.replace(/\.xml$/, '');
            let layouts: IWindowLayoutXmlData[];

            try
            {
                layouts = parseLayoutEntries(layoutXml, key, layoutBaseName);
            }
            catch (error) 
            {
                log.warn(`Failed to parse layout XML: ${key}`, error);
                continue;
            }

            for(const layout of layouts)
            {
                const name = layout.name;

                if(typeof name === 'string' && name.length > 0)
                {
                    layoutsByName.set(name, layout.xml);
                }
            }
        }

        // 3b. Vortex's own authored layouts (src/vortex-layouts/*.xml). These are not from
        // the dump and deliberately do not live in src/assets/window-layouts/, which is gitignored
        // and rebuilt by tools/build-window-assets.mjs — a file placed there would be wiped on the
        // next asset build. Registered under their file basename, the same way vortex-glaze
        // registers its editor layouts.
        this.readVortexLayouts(layoutsByName);

        windowAssets.layouts = layoutsByName;

        // 3c. The asset library's own copy of each layout, keyed by the file basename and holding
        // the whole file — see IVortexWindowAssets.libraryLayouts for why this is not `layouts`.
        //
        // Vortex's own layouts (3b) go in on top, and this is the only place a dump layout can be
        // *overridden* rather than merely added to: both maps key by file basename here, so
        // `src/vortex-layouts/<name>_xml.xml` replaces the dump's `<name>_xml` for every window
        // built through `assets.getAssetByName()` (`discord_settings_xml` is the first such
        // override). 3b alone cannot do that — it keys the dump's layouts by their `<layout name>`
        // attribute, which for this file is `discord_settings`, not `discord_settings_xml`.
        windowAssets.libraryLayouts = readLibraryLayouts(xmlBundle);
        this.readVortexLayouts(windowAssets.libraryLayouts);

        // 4. Images. Both halves go in before the engine boots, because components built during
        // prepareCore() read from both — see registerWindowAssetLibraryContent() in VortexMain.
        //
        // Which images get DECODED is derived from the layouts read just above rather than listed by
        // hand; `readLayoutImageNames()` says why. Vortex's own authored layouts (3b) are included,
        // because they name images too.
        const {imageUrls, libraryImages} = await readImageAssets(
            imageBundle,
            readLayoutImageNames(new Map([...windowAssets.libraryLayouts, ...windowAssets.layouts]))
        );

        windowAssets.imageUrls = imageUrls;
        windowAssets.libraryImages = libraryImages;

        return windowAssets;
    }

    /**
     * Everything that only makes sense once the client is authenticated and on screen.
     */
    /**
     * Gives the communication manager somewhere to report connection state.
     *
     * Nothing ever called `setConnectionActions()`, so `_connectionActions` stayed null
     * and every state change — including the server going away — was logged and dropped.
     * That is why the client sat there fully rendered after the emulator stopped.
     *
     * Nothing here reacts to the disconnect any more. `setDisconnected()` used to reload the
     * page, but it only fires on a peer-initiated close (see
     * HabboCommunicationManager.connectionClosed) — an emulator that is simply stopped closes
     * with 1006 and never reached it, and when it did fire it reloaded on the spot with no
     * explanation. The disconnect now lands where AS3 puts it, in
     * `HabboCommunicationDemo.disconnected()`, which alerts with the localized reason and
     * reloads when the player closes the dialog.
     *
     * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::disconnected()
     */
    private installConnectionActions(vortex: typeof Vortex.instance): void
    {
        vortex.habboCommunication.setConnectionActions({
            setConnecting: () => undefined,
            setConnected: () => undefined,
            setAuthenticated: () =>
            {
                this._authenticated = true;
                this.fireStartLink(vortex);
            },
            setError: () => undefined,
            setLoginStep: () => undefined,
            reset: () => (this._authenticated = false),
            setDisconnected: () => (this._authenticated = false)
        });

        // `off` first so this stays idempotent: `_onDisconnectAcknowledged` is a stable field, and a
        // second install would otherwise leave two listeners and post the handover twice.
        vortex.habboCommunication.events.off(
            HabboCommunicationManagerEvent.DISCONNECT_ACKNOWLEDGED, this._onDisconnectAcknowledged);
        vortex.habboCommunication.events.on(
            HabboCommunicationManagerEvent.DISCONNECT_ACKNOWLEDGED, this._onDisconnectAcknowledged);
    }

    /**
     * Hand the player back to the site, which is this client's login screen.
     *
     * The engine raises `disconnectAcknowledged` when the player closes the disconnect dialog —
     * AS3's `showDisconnected()` moment. It used to be a `window.location.reload()` inside the
     * engine, which never reached a login screen at all: the SSO ticket rides on `?sso=` in the URL
     * and a reload keeps the URL, so it re-bootstrapped the whole engine against the ticket that had
     * just been disconnected.
     *
     * The site parks this client in an iframe and never reloads it (components/Client.svelte), so
     * only the site can end the session: it drops the frame and fetches a fresh ticket the next time
     * the hotel is opened. Same-origin because the site proxies this client at `/client`; the origin
     * is named rather than `*` so the message is not readable by whatever else may frame this page.
     */
    // TS-only: AS3 calls `LoginFlow.showDisconnected()` here. This port has no LoginFlow — login
    //   lives in `vortex-web` — so the handover is a message to the embedder instead.
    private readonly _onDisconnectAcknowledged = (): void =>
    {
        if(window.parent === window) return;

        window.parent.postMessage({type: SiteChannel.DISCONNECTED}, window.location.origin);
    };

    /**
     * The second channel for `/hotel?link=…`, and the reason it has to exist.
     *
     * The site MOUNTS THIS CLIENT ONCE and never reloads it — closing the hotel parks the iframe
     * off-screen with its socket, its room and its session intact, which is what makes coming back
     * instant (components/Client.svelte). The consequence is that the query string is written
     * exactly once: `?link=habboUI/open/hccenter` from the purse reached the client the first time
     * the hotel was opened in a session and never again, so every later click did nothing at all.
     *
     * A message is the only way in after that, and same-origin is what makes it cheap: the site
     * proxies this client at `/client`, so the embedder and the embedded share an origin.
     *
     * WHAT IT WILL AND WILL NOT ACCEPT. `createLinkEvent` drives the client's own UI — open the
     * catalog, walk into a room, file a report — so a listener that fired on anything would hand
     * that to any page able to get a handle on this window, and this client is served publicly
     * enough to be framed by one. Hence: the origin must be ours, the sender must be the parent
     * frame, and the payload must be the exact shape below. Anything else is dropped in silence,
     * because answering tells a prober it found something.
     */
    // TS-only: the website needs a way to re-deliver habbo.com's own `/hotel?link=…` handover to an
    //   already-running client; AS3 has no counterpart because the Flash client took it in FlashVars
    //   and was reloaded for each visit.
    private installLinkChannel(): void
    {
        if(this._linkChannel) return;

        this._linkChannel = (event: MessageEvent): void =>
        {
            if(event.origin !== window.location.origin) return;
            if(event.source !== window.parent) return;

            const data = event.data as {type?: unknown; link?: unknown} | null;

            if(!data || data.type !== SiteChannel.LINK) return;
            if(typeof data.link !== 'string' || data.link.length === 0) return;

            // Before the handshake completes a link reaches a tracker that sends a composer nobody
            // reads, so it waits where `fireStartLink` will find it instead of being dropped. That
            // covers the whole boot, engine included: this listener is installed before the engine
            // exists, which is why the instance is read here and not captured.
            if(!this._authenticated || !Vortex.hasInstance)
            {
                this._startLink = data.link;

                return;
            }

            Vortex.instance.context.createLinkEvent(data.link);
        };

        window.addEventListener('message', this._linkChannel);
    }

    /**
     * Fires the start link (`?link=`, or one the site posted during the boot) once, the moment the session is authenticated.
     *
     * That moment is the point: `navigator/goto/42` reaches a tracker that sends a composer, and a
     * composer sent before the handshake completes is a composer nobody reads. `setAuthenticated`
     * is the only callback here that means "the socket is up and the player exists", which is why
     * it is the one that stopped being a no-op.
     *
     * Cleared after firing. The connection actions are reinstalled on a reconnect, and a link that
     * survived one would teleport a player out of wherever they had walked to since.
     */
    // TS-only: the website needs an entry point for habbo.com's own `/hotel?link=…` handover; AS3
    //   has no counterpart because the Flash client took it in FlashVars.
    private fireStartLink(vortex: typeof Vortex.instance): void
    {
        const link = this._startLink;

        if(link === null || link.length === 0) return;

        this._startLink = null;

        vortex.context.createLinkEvent(link);
    }

    private async initClientUi(vortex: typeof Vortex.instance): Promise<void>
    {
        // Visual window debugger (Ctrl+Shift+D, or the 🐞 button). On in dev always; in a
        // production build only when `VITE_WINDOW_DEBUGGER=1` was set AT BUILD TIME.
        //
        // It cannot be a runtime switch. Vite substitutes `import.meta.env.*` as literals and the
        // minifier drops the dead branch, so with neither flag set the debugger — and the whole
        // module behind it, tree inspector and skin previewer included — is not in the bundle at
        // all. That is the point: it is several hundred KB of tooling nobody browsing the hotel
        // should download. Setting the variable in Coolify's *runtime* environment does nothing;
        // it has to reach `vite build`, which is why the Dockerfile takes it as a build ARG.
        if((import.meta.env.DEV || import.meta.env.VITE_WINDOW_DEBUGGER === '1') && this._canvas)
        {
            this._uninstallWindowDebugger = installWindowDebugger(this._canvas);
        }

        // 7. Images and layouts are no longer registered here: they ride in on
        // IVortexWindowAssets and are in place before the first component is constructed.
        // See readImageAssets()/readLibraryLayouts().

        // 8. The avatar editor builds its windows from registered layouts, so it comes after them.
        // (The friend bar, friend list and toolbar that used to start here left with the core cut.)
        vortex.initAvatarEditor();

        // 10. Listen for room state changes to track when we are in a room
        this.setupRoomStateTracking();

        // 11. Flush microtasks
        await Promise.resolve();

        // 12. Start input and render loop
        this.setupMouseEvents();
        this.startRenderLoop();
    }

    /**
     * Registers Vortex's own authored window skins (src/vortex-skins/*.xml) under their file
     * basename, bundled at build time via import.meta.glob — the skin counterpart of
     * readVortexLayouts().
     *
     * The basename is the skin id, which is what an element descriptor's `asset` field points at
     * (HabboWindowManager.loadSkinAssets()). A file named after a dump skin — e.g.
     * `habbo_skin_frame.xml` — is **merged into** it: templates, layouts and states replace the
     * dump's entry of the same name and every other one is left alone, so a file may carry only
     * what it adds. `habbo_element_description_xml.xml` merges the same way, by (type, style),
     * which is the key the registry itself looks descriptors up by. A brand-new skin id renders
     * nothing until some descriptor asks for it: skins are only ever reached through the element
     * description, never by name from a layout.
     *
     * Merging rather than replacing is deliberate. These two files are 42 KB and 66 KB, so the
     * wholesale override this used to do meant forking both of them — and a fork stops following
     * the dump the moment it is taken, which for the element description means every window in the
     * client silently keeping the shape it had on the day someone wanted one new icon.
     *
     * Templates still resolve their bitmaps out of the atlases decoded above, so a skin here can
     * only reference an atlas listed in ATLAS_NAMES — a new spritesheet needs a new entry there
     * plus the PNG in the image bundle. BitmapSkinParser.parseTemplateList() looks the asset up
     * with `atlases.get()` and renders nothing at all when it misses, with no warning.
     *
     * @param sink - the skin map being built, mutated in place
     * @param base - the dump's element description, the thing an authored one merges into
     * @returns the merged element description if one was authored, otherwise null
     */
    private readVortexSkins(sink: Map<string, ISkinData>, base: IElementDescriptionData | null): IElementDescriptionData | null
    {
        const modules = import.meta.glob('./vortex-skins/*.xml', {
            query: '?raw',
            import: 'default',
            eager: true
        }) as Record<string, string>;

        let elementDescription: IElementDescriptionData | null = null;

        for(const [path, xml] of Object.entries(modules))
        {
            const name = path.split('/').pop()!.replace(/\.xml$/, '');

            // Parsed per file: a malformed hand-authored skin must not take the dump's skins down
            // with it, the way the bundle loop above would (its throw unwinds to the outer catch).
            try
            {
                if(name === ELEMENT_DESCRIPTION_ASSET)
                {
                    const authored = parseElementDescriptionFromBundle(xml, path);

                    if(authored) elementDescription = mergeElementDescription(elementDescription ?? base, authored);
                    else log.warn(`Vortex element description did not parse, ignored: ${path}`);

                    continue;
                }

                const skin = parseSkinFromBundle(xml, name, path);

                if(skin) sink.set(skin.id, mergeSkin(sink.get(skin.id) ?? null, skin));
                else log.warn(`Vortex skin has no <skin> root element, ignored: ${path}`);
            }
            catch (error)
            {
                log.warn(`Failed to parse Vortex skin: ${path}`, error);
            }
        }

        return elementDescription;
    }

    /**
     * Registers Vortex's own authored window layouts (src/vortex-layouts/*.xml) under their file
     * basename, bundled at build time via import.meta.glob.
     *
     * These are not Habbo assets: they belong to Vortex-only tools (the furni editor) and have no
     * counterpart in the dump.
     */
    private readVortexLayouts(sink: Map<string, string>): void
    {
        const modules = import.meta.glob('./vortex-layouts/*.xml', {
            query: '?raw',
            import: 'default',
            eager: true
        }) as Record<string, string>;

        for(const [path, xml] of Object.entries(modules))
        {
            const name = path.split('/').pop()!.replace(/\.xml$/, '');

            sink.set(name, xml);
        }
    }

    /**
     * Disposes the application and cleans up resources.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        this._uninstallWindowDebugger?.();
        this._uninstallWindowDebugger = null;

        // Stop render loop
        if(this._animFrameId) 
        {
            cancelAnimationFrame(this._animFrameId);
            this._animFrameId = 0;
        }

        // Remove event listeners
        window.removeEventListener('resize', this._onResize);
        document.removeEventListener('visibilitychange', this._onVisibilityChange);

        if(this._linkChannel)
        {
            window.removeEventListener('message', this._linkChannel);
            this._linkChannel = null;
        }

        if(this._canvas) 
        {
            this._canvas.removeEventListener('mousedown', this._onMouseDown);
            this._canvas.removeEventListener('mousemove', this._onMouseMove);
            this._canvas.removeEventListener('mouseup', this._onMouseUp);
            this._canvas.removeEventListener('click', this._onClick);
            this._canvas.removeEventListener('dblclick', this._onDblClick);
            this._canvas.removeEventListener('wheel', this._onWheel);
            this._canvas.removeEventListener('contextmenu', this._onContextMenu);
        }

        if(this._docMoveHandler) 
        {
            document.removeEventListener('mousemove', this._docMoveHandler);
        }

        if(this._docUpHandler) 
        {
            document.removeEventListener('mouseup', this._docUpHandler);
        }

        // Revoke blob URLs
        if(this._imageBundle) 
        {
            this._imageBundle.dispose();
            this._imageBundle = null;
        }

        if(this._xmlBundle) 
        {
            this._xmlBundle.dispose();
            this._xmlBundle = null;
        }

        // Remove canvas from DOM
        this._canvas?.remove();
        this._canvas = null;
        this._ctx = null;
        this._mouseDownWindow = null;
        this._isInRoom = false;
        this._activeRoomId = -1;
    }

    /**
     * Sets up room state tracking by listening to room engine events.
     * Updates `_isInRoom` to control mouse event routing.
     */
    private setupRoomStateTracking(): void
    {
        const vortex = Vortex.instance;

        vortex.roomEngine.events.on(RoomEngineEvent.REE_INITIALIZED, (event: RoomEngineEvent) =>
        {
            this._isInRoom = true;
            this._activeRoomId = event.roomId;
        });

        vortex.roomEngine.events.on(RoomEngineEvent.REE_DISPOSED, (_event: RoomEngineEvent) =>
        {
            this._isInRoom = false;
            this._activeRoomId = -1;
        });
    }

    /**
     * Forwards a mouse event to the room engine via RoomDesktop.
     * Called when no UI window intercepted the event and we are in a room.
     *
     * This is a *second* path into `canvasMouseHandler()` — the first is AS3's own: `RoomDesktop`
     * subscribes its `_canvasWrapper` to CLICK/DOUBLE_CLICK/MOVE/DOWN/UP/UP_OUTSIDE
     * (`RoomDesktop.ts:1165-1170`) and its `canvasWindowEventHandler` translates the
     * `WindowMouseEvent` and calls the same method. It looked redundant: `_onWheel`'s own comment
     * states the room canvas *is* a mouse-enabled window, so `findWindowAtPoint()` returns it over
     * the room and its `!hit`-gated branch never ran, which should hold for down/move/click too.
     *
     * Measured on 2026-09-08 rather than assumed, and the assumption was wrong — a one-shot probe
     * here fired with `type=mouse_move` on the first room entered. The `!hit` gate is live and this
     * path carries real events. Do not delete it on that reasoning again.
     */
    private forwardToRoomEngine(x: number, y: number, type: string, e: MouseEvent): void
    {
        const vortex = Vortex.instance;

        try 
        {
            const roomUI = vortex.roomUI as RoomUI;
            const desktop = roomUI.getDesktopForRoom(this._activeRoomId) as RoomDesktop | null;

            if(desktop) 
            {
                desktop.canvasMouseHandler(
                    x, y, type,
                    e.altKey, e.ctrlKey, e.shiftKey,
                    e.buttons > 0
                );
            }
        }
        catch
        {
            // RoomUI not yet initialized
        }
    }

    /**
     * Creates the canvas element and appends it to the DOM.
     */
    private createCanvas(): void 
    {
        const container = document.getElementById('vortex-ui');

        if(!container) return;

        // Clear any loading content
        container.innerHTML = '';

        this._canvas = document.createElement('canvas');
        this._canvas.id = 'vortex-canvas';
        this._canvas.style.position = 'absolute';
        this._canvas.style.top = '0';
        this._canvas.style.left = '0';
        this._canvas.style.imageRendering = 'pixelated';

        container.appendChild(this._canvas);

        this._ctx = this._canvas.getContext('2d');

        this.resizeCanvas();

        window.addEventListener('resize', this._onResize);
        document.addEventListener('visibilitychange', this._onVisibilityChange);
    }

    /** Bound resize handler. */
    private _onResize = (): void =>
    {
        this.resizeCanvas();
    };

    /**
     * Forces a full recomposite when the tab returns to the foreground.
     *
     * requestAnimationFrame (which drives both the Pixi ticker and this render loop) is paused
     * entirely by the browser while the tab is hidden, so the last painted frame is stale on
     * return. The network model itself was kept current by SocketConnection processing packets on
     * the WebSocket 'message' event (which keeps firing while hidden), so here we only need to
     * force the first resumed frame to recomposite the UI; the room canvas repaints from its own
     * resumed ticker.
     */
    private _onVisibilityChange = (): void =>
    {
        if(document.visibilityState === 'visible')
        {
            this._uiCompositeDirty = true;
        }
    };

    /**
     * Resizes the canvas to match the viewport.
     *
     * Sets the canvas width/height attributes directly to the viewport size.
     * No DPR scaling — the canvas pixel buffer matches CSS pixels 1:1.
     */
    private resizeCanvas(): void 
    {
        if(!this._canvas) return;

        const w = window.innerWidth;
        const h = window.innerHeight;

        this._canvas.width = w;
        this._canvas.height = h;
        this._uiCompositeDirty = true;

        // Update desktop sizes in each context layer
        const vortex = Vortex.instance;

        for(let i = 0; i < 4; i++) 
        {
            const desktop = vortex.windowManager.getDesktop(i);

            if(desktop) 
            {
                desktop.width = w;
                desktop.height = h;
            }
        }
    }

    /**
     * Starts the render loop using requestAnimationFrame.
     */
    private startRenderLoop(): void 
    {
        const loop = (): void => 
        {
            if(this._disposed) return;

            const vortex = Vortex.instance;

            if(vortex.disposed || !vortex.isReady) 
            {
                this._animFrameId = 0;
                return;
            }

            this.renderFrame();

            this._animFrameId = requestAnimationFrame(loop);
        };

        this._animFrameId = requestAnimationFrame(loop);
    }

    /**
     * Renders a single frame.
     *
     * Renders all dirty windows, composites the full tree,
     * then blits the result onto the DOM canvas.
     */
    private renderFrame(): void 
    {
        if(!this._canvas || !this._ctx) return;

        const vortex = Vortex.instance;

        if(vortex.disposed || !vortex.isReady) 
        {
            return;
        }

        const windowManager = vortex.windowManager;
        const renderer = windowManager.getWindowRenderer();

        if(!renderer) return;

        if(!this._uiCompositeDirty &&
            !renderer.hasPendingUpdates() &&
            renderer.renderVersion === this._lastUiRenderVersion) 
        {
            return;
        }

        // Everything below is the `ui` channel of the `:showstats` frame budget: the skin
        // re-render of every dirty window, the full-tree composite, and the blit. It opens past
        // the dirty gate above, so frames that change nothing bill zero and are still folded into
        // the mean — the reported figure is therefore the UI's **share of an average frame**, not
        // the cost of one repaint. That is the comparable quantity: `room` and `pixi` are billed
        // every frame, so the three lines add up to where the frame actually goes. A UI repaint
        // costing 8ms but running every other frame reads as 4ms here, by design.
        FrameTimings.begin(FRAME_CHANNEL_UI);

        try
        {
            // Process any pending render queue
            renderer.render();

            // Composite all layers into the buffer
            const w = this._canvas.width;
            const h = this._canvas.height;

            const buffer = windowManager.compositeToBuffer(w, h);

            if(!buffer) return;

            // Blit composite buffer onto the DOM canvas
            const ctx = this._ctx;

            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(buffer, 0, 0);
            this._uiCompositeDirty = false;
            this._lastUiRenderVersion = renderer.renderVersion;
        }
        finally
        {
            FrameTimings.end(FRAME_CHANNEL_UI);
        }
    }

    /**
     * Points PixiJS's event system at the UI canvas, which is the one the browser actually
     * delivers pointer events to.
     *
     * There are two canvases stacked in `#vortex-ui`: PixiJS's own, and `#vortex-canvas` above it,
     * created by `createCanvas()` for the window system's 2D composite. Every DOM pointer event
     * therefore lands on the *top* one — which is why `setupMouseEvents()` below listens there —
     * while PixiJS's `EventSystem` had attached its listeners to the canvas underneath, where
     * nothing can reach it.
     *
     * The consequence was total and silent: **no object on the PixiJS stage had ever been
     * clickable.** Both of them are on that stage — `PooledChatBubble`, whose `pointertap` →
     * `selectAvatar()` has been dead code since it was written (clicking a speech bubble also
     * happens to work by clicking the avatar under it, so nobody missed it), and the chat-history
     * tray's handle, which is how it is meant to be pulled shut. The window system never noticed
     * because it does its own hit testing off its own listeners.
     *
     * Retargeting is exact rather than approximate: both canvases are `window.innerWidth ×
     * innerHeight` with no CSS scaling (`resolution: 1`, `autoDensity: true`, `resizeTo: window` on
     * one; `resizeCanvas()` on the other), so the two coordinate spaces are the same one. PixiJS
     * adds its own listeners to the element and does not remove the client's, so the window system
     * keeps receiving everything it did before.
     */
    // TS-only: no AS3 counterpart — Flash had one display list and one input path.
    private retargetPixiEvents(): void
    {
        const events = Vortex.instance.application?.renderer?.events ?? null;

        if(!events || !this._canvas)
        {
            log.warn('Pixi event system unavailable — stage objects will not receive clicks.');

            return;
        }

        events.setTargetElement(this._canvas);
    }

    /**
     * Sets up mouse event listeners on the canvas.
     */
    private setupMouseEvents(): void
    {
        if(!this._canvas) return;

        this.retargetPixiEvents();

        this._canvas.addEventListener('mousedown', this._onMouseDown);
        this._canvas.addEventListener('mousemove', this._onMouseMove);
        this._canvas.addEventListener('mouseup', this._onMouseUp);
        this._canvas.addEventListener('click', this._onClick);
        this._canvas.addEventListener('dblclick', this._onDblClick);
        this._canvas.addEventListener('wheel', this._onWheel, {passive: true});
        this._canvas.addEventListener('contextmenu', this._onContextMenu);
    }

    /**
     * Hands one DOM pointer event to the window system's own input queue.
     *
     * This is the seam AS3 gets for free: `MouseEventQueue` subscribes to the Flash stage
     * (`MouseEventQueue.as:16-22`) and `WindowContext.update()` drains it through
     * `MouseEventProcessor.process()` every frame. There is no stage here, so the DOM
     * listeners below push instead — and from that point on the hit testing
     * (`groupParameterFilteredChildrenUnderPoint`), the OVER/OUT bookkeeping, the
     * CLICK_AWAY, the `mouseUp` re-targeting and the parent bubbling are all AS3's, in
     * `MouseEventProcessor`, rather than reimplemented here.
     *
     * Coordinates are canvas-local, which is the space `getGlobalPosition()` reports —
     * the same one AS3 calls `stageX`/`stageY`.
     */
    // TS-only: AS3 subscribes this queue to the Flash stage; the port has DOM listeners.
    private enqueueMouse(type: string, e: MouseEvent, delta: number = 0): void
    {
        const queue = WindowContext.inputEventQueue;

        if(!queue) return;

        const {x, y} = this.getCanvasCoords(e);

        queue.enqueue({
            type,
            stageX: x,
            stageY: y,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            buttonDown: (e.buttons & 1) !== 0,
            delta
        });
    }

    /**
     * Converts a DOM mouse event to canvas-local coordinates.
     */
    private getCanvasCoords(e: MouseEvent): { x: number; y: number }
    {
        if(!this._canvas) return {x: 0, y: 0};

        const rect = this._canvas.getBoundingClientRect();

        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }

    /** Canvas mousedown handler. */
    private _onMouseDown = (e: MouseEvent): void =>
    {
        // A DOM listener on the canvas can fire at any time, including after the engine has been
        // torn down — an HMR reload disposes Vortex while this canvas and its listeners are still
        // live, and `Vortex.instance` lazily builds a *fresh* empty instance whose `_habboMain` is
        // null. Bail rather than dereference it.
        if(Vortex.instance.disposed) return;

        // <canvas> isn't natively focusable, so the browser's default mousedown
        // action blurs whatever currently has DOM focus (moving it to <body>)
        // once every listener on this event has run. That happens *after* the
        // window-system dispatch below, which can synchronously call
        // TextFieldController.focus() -> HTMLInputElement.focus() on a text
        // field's hidden input — so without suppressing the browser's default,
        // that focus call is immediately undone: the caret still renders (it's
        // driven by this port's own internal focus flag) but document.activeElement
        // reverts to <body>, so keystrokes never reach the hidden input at all.
        e.preventDefault();

        this.enqueueMouse('mouseDown', e);

        const {x, y} = this.getCanvasCoords(e);
        const vortex = Vortex.instance;
        const hit = vortex.windowManager.findWindowAtPoint(x, y);

        if(!hit)
        {
            // No UI window hit — forward to room engine if in a room
            if(this._isInRoom)
            {
                this.forwardToRoomEngine(x, y, 'mouse_down', e);
            }

            return;
        }

        this._mouseDown = true;
        this._mouseDownWindow = hit;

        // Pre-seed drag/scale services with current canvas-local coords
        // so that begin() (triggered inside update() below) computes the correct offset.
        const serviceManager = vortex.windowManager.getServiceManager();

        if(serviceManager) 
        {
            (serviceManager.getMouseDraggingService() as WindowMouseOperator).setMousePosition(x, y);
            (serviceManager.getMouseScalingService() as WindowMouseOperator).setMousePosition(x, y);
        }

        // The DOWN itself was enqueued above — `MouseEventProcessor.passMouseEvent()` finds the
        // target, records it as `_lastMouseDownTarget` (which is what makes the later `mouseUp`
        // reach the same window even when the pointer has left it) and bubbles when unhandled.

        // Register document-level handlers for drag/scale.
        //
        // These stay client-side: `WindowMouseOperator.handler()` is a Flash event subscription in
        // AS3, and nothing in the engine drives `handleMouseMove()`/`handleMouseUp()` — this is
        // their only caller. They are also why the listeners go on `document` rather than the
        // canvas: a drag must keep tracking once the pointer leaves the canvas.
        if(serviceManager)
        {
            const dragger = serviceManager.getMouseDraggingService() as WindowMouseOperator;
            const scaler = serviceManager.getMouseScalingService() as WindowMouseOperator;

            this._docMoveHandler = (ev: MouseEvent): void => 
            {
                const coords = this.getCanvasCoords(ev);

                dragger.handleMouseMove(coords.x, coords.y);
                scaler.handleMouseMove(coords.x, coords.y);
            };

            this._docUpHandler = (ev: MouseEvent): void =>
            {
                dragger.handleMouseUp();
                scaler.handleMouseUp();

                // The UP goes through the queue like everything else. It is enqueued here rather
                // than in `_onMouseUp` because a drag can end with the pointer off the canvas,
                // where the canvas listener never fires — and `_onMouseUp` stands down while these
                // handlers are installed, so exactly one of the two enqueues it.
                //
                // `passMouseEvent()` re-targets it to `_lastMouseDownTarget` on its own, and
                // `convertMouseEventType()` picks WME_UP or WME_UP_OUTSIDE by testing the point
                // against that window's bounds. Neither needs to be worked out here.
                this.enqueueMouse('mouseUp', ev);

                this._mouseDown = false;
                this._mouseDownWindow = null;

                document.removeEventListener('mousemove', this._docMoveHandler!);
                document.removeEventListener('mouseup', this._docUpHandler!);
                this._docMoveHandler = null;
                this._docUpHandler = null;
            };

            document.addEventListener('mousemove', this._docMoveHandler);
            document.addEventListener('mouseup', this._docUpHandler);
        }
    };

    /** Canvas mousemove handler. */
    private _onMouseMove = (e: MouseEvent): void =>
    {
        // A DOM listener on the canvas can fire at any time, including after the engine has been
        // torn down — an HMR reload disposes Vortex while this canvas and its listeners are still
        // live, and `Vortex.instance` lazily builds a *fresh* empty instance whose `_habboMain` is
        // null. Bail rather than dereference it.
        if(Vortex.instance.disposed) return;

        const {x, y} = this.getCanvasCoords(e);

        // `enqueue()` records the pointer on its way past, which is how AS3 keeps
        // `MouseEventQueue.mouseX`/`mouseY` current — `WindowToolTipAgent.begin()` reads them the
        // instant the OVER lands. `recordPointer()` used to do that by hand here, because the
        // queue was never fed at all; it no longer has to.
        this.enqueueMouse('mouseMove', e);

        const vortex = Vortex.instance;
        const hit = vortex.windowManager.findWindowAtPoint(x, y);

        // OVER/OUT and MOVE are `MouseEventProcessor.process()`'s job now. It tracks the hovered
        // window in `EventProcessorState.hovered` across frames — which the hand-rolled version
        // here could not do, because it compared against a field this class owned and the
        // processor owns the same state for its own OUT dispatch. Two trackers, one truth.

        // Forward to room engine if no UI window hit and in a room
        if(!hit && this._isInRoom)
        {
            this.forwardToRoomEngine(x, y, 'mouse_move', e);
        }

        // Update cursor: pointer on mouse-event-enabled windows.
        //
        // With nothing hit, the rule is *cleared* rather than set to 'default': the room engine
        // writes the document cursor (RoomEngine.updateMouseCursor(), the hand over a usable
        // furni or an avatar) and a canvas rule of its own would win over it across the whole
        // room area. A window that is hit still wins, so the hand cannot bleed onto the UI.
        if(this._canvas)
        {
            this._canvas.style.cursor = hit ? (hit.testParamFlag(1) ? 'pointer' : 'default') : '';
        }
    };

    /** Canvas mouseup handler (fallback for non-drag scenarios). */
    private _onMouseUp = (e: MouseEvent): void =>
    {
        // A DOM listener on the canvas can fire at any time, including after the engine has been
        // torn down — an HMR reload disposes Vortex while this canvas and its listeners are still
        // live, and `Vortex.instance` lazily builds a *fresh* empty instance whose `_habboMain` is
        // null. Bail rather than dereference it.
        if(Vortex.instance.disposed) return;

        // If doc-level handlers are active, they enqueue the UP — see `_docUpHandler`.
        if(this._docUpHandler) return;

        this.enqueueMouse('mouseUp', e);

        const {x, y} = this.getCanvasCoords(e);
        const vortex = Vortex.instance;

        if(!vortex.windowManager.findWindowAtPoint(x, y) && this._isInRoom)
        {
            this.forwardToRoomEngine(x, y, 'click', e);
        }
    };

    /**
     * Canvas click handler.
     *
     * AS3 does not synthesize a click: `MouseEventQueue` subscribes to the stage's own `click` and
     * `doubleClick` (`MouseEventQueue.as:16-17`). The DOM has both too, so they are forwarded
     * rather than reconstructed from mousedown/mouseup — which is what the 55-line
     * `synthesizeClick()` this replaces was doing, with its own 350 ms / 8 px heuristic.
     *
     * `detail === 2` is skipped so the sequence matches Flash's. Flash fires click on the first
     * press and doubleClick on the second; the DOM fires click twice *and* dblclick, so passing
     * all three would land a third CLICK on the window — `passMouseEvent()` already dispatches a
     * CLICK ahead of every DOUBLE_CLICK, exactly as AS3 does.
     *
     * Modifier state rides along in the entry: the room's CTRL/SHIFT+click furniture shortcuts
     * read `ctrlKey`/`shiftKey` off the resulting event.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventQueue.as::mouseEventListener()
    private _onClick = (e: MouseEvent): void =>
    {
        if(Vortex.instance.disposed) return;

        if(e.detail === 2) return;

        this.enqueueMouse('click', e);
    };

    /** Canvas double-click handler. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventQueue.as::mouseEventListener()
    private _onDblClick = (e: MouseEvent): void =>
    {
        if(Vortex.instance.disposed) return;

        this.enqueueMouse('doubleClick', e);
    };

    /** Canvas wheel handler. */
    private _onWheel = (e: WheelEvent): void =>
    {
        const {x, y} = this.getCanvasCoords(e);
        const vortex = Vortex.instance;

        // AS3: RoomDesktop.as::mouseWheelHandler() — a plain wheel (no modifier) while a floor-
        // furniture placement/move preview is active rotates the ghost in place. This must be
        // tried BEFORE the window-hit branching: the room canvas is itself a mouse-enabled window,
        // so findWindowAtPoint() returns it (non-null) over the room and the old `!hit`-gated
        // version never ran. rotateActiveObjectPreview self-gates (returns false when no cat-10
        // preview is active), so normal wheel scrolling is untouched outside placement/move.
        // Flash delta>0 is scroll-up = "forward"; the DOM's deltaY is inverted, so scroll-up is deltaY<0.
        if(this._isInRoom && !e.ctrlKey && !e.altKey && !e.shiftKey)
        {
            try
            {
                if(vortex.roomEngine.rotateActiveObjectPreview(this._activeRoomId, e.deltaY < 0))
                {
                    return;
                }
            }
            catch
            {
                // RoomEngine not yet initialized
            }
        }

        const hit = vortex.windowManager.findWindowAtPoint(x, y);

        if(!hit)
        {
            // AS3: RoomDesktop.as::mouseWheelHandler() — `ctrlKey && !altKey && !shiftKey`. Ctrl
            // alone: the other two are what the room's own alt-drag and shift-rotate gestures use,
            // and holding one of them with ctrl must not zoom underneath them.
            if(this._isInRoom && e.ctrlKey && !e.altKey && !e.shiftKey)
            {
                try
                {
                    const roomUI = vortex.roomUI as RoomUI;
                    const desktop = roomUI.getDesktopForRoom(this._activeRoomId) as RoomDesktop | null;

                    if(desktop)
                    {
                        desktop.handleMouseWheel(e.deltaY, x, y);
                    }
                }
                catch
                {
                    // RoomUI not yet initialized
                }
            }

            return;
        }

        // WindowController.update() returns false for WHEEL by default - only
        // ItemListController/ScrollBarController override it to actually scroll.
        // findWindowAtPoint() returns the deepest (leaf) window under the cursor, which
        // inside a scrollable box is usually a list item/icon/label rather than the
        // scrollable container itself, so the event must bubble up the parent chain
        // (mirroring MouseEventProcessor.passMouseEvent()'s bubbling for other mouse
        // events) until an ancestor actually handles it.
        let target: WindowController | null = hit as WindowController;

        // Flash raised two distinct stage events, `mouseWheel` and `mouseWheelHorizontal`,
        // and ItemList/ItemGrid branch on the resulting WME type to pick the horizontal
        // scroller. The DOM has one `wheel` event carrying both axes, so the axis is
        // resolved here and the matching WME type dispatched.
        const isHorizontal = NativeWheelDelta.isHorizontal(e);
        const wheelType = isHorizontal ? WindowMouseEvent.WHEEL_HORIZONTAL : WindowMouseEvent.WHEEL;
        const wheelDelta = isHorizontal
            ? NativeWheelDelta.horizontalFromWheelEvent(e)
            : NativeWheelDelta.fromWheelEvent(e);

        while(target && !target.disposed)
        {
            const globalPos = this._globalPosScratch;

            target.getGlobalPosition(globalPos);

            // NativeWheelDelta converts the DOM's deltaY (pixels/lines/pages, positive
            // downwards) into the Flash line unit the window system is built on (positive
            // upwards, 25px per line) - see its header for why the raw deltaY made lists
            // jump straight to the top or the bottom.
            const event = WindowMouseEvent.allocateMouse(
                wheelType, target, null,
                x - globalPos.x, y - globalPos.y, e.clientX, e.clientY,
                e.altKey, e.ctrlKey, e.shiftKey, false,
                wheelDelta
            );

            const handled = target.update(target, event);

            event.recycle();

            if(handled) break;

            target = target.parent as WindowController | null;
        }
    };

    /** Prevent right-click context menu on the canvas. */
    private _onContextMenu = (e: Event): void =>
    {
        e.preventDefault();
    };
}
