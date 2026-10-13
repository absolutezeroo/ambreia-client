import {Logger, LogLevel} from '@ambreia/common/utils/Logger';
import {AssetBundle} from '@ambreia/common/assets/AssetBundle';
import {WindowManager} from '@ambreia/ui/kit/WindowManager';
import type {IWindowManager} from '@ambreia/ui/kit/IWindowManager';
import type {IElementDescriptionData} from '@ambreia/ui/kit/IElementDescriptor';
import type {ISkinData} from '@ambreia/ui/index';
import {
    type IWindowLayoutXmlData,
    parseElementDescriptionXml,
    parseSkinXml,
    parseWindowLayoutXml
} from '@ambreia/ui/assets/WindowXmlAssetParser';
import {mergeElementDescription, mergeSkin} from '@ambreia/ui/assets/SkinMerge';
import {GlazeConfigurationStub} from './GlazeConfigurationStub';
import {registerGameWidgetPlaceholders} from './GameWidgetPlaceholder';
import {GlazeLocalizationStub} from './GlazeLocalizationStub';

const log = Logger.getLogger('glaze.boot.GlazeBoot');

/**
 * The element description's asset name (see vortex-client App.ts).
 */
const ELEMENT_DESCRIPTION_ASSET = 'habbo_element_description_xml';

/**
 * Atlas spritesheet names decoded as ImageBitmaps.
 *
 * Copied verbatim from vortex-client/src/App.ts — every compiled window-skin
 * template references one of these by name, so this must cover every distinct
 * atlas any skin uses or that skin's pieces silently never render.
 */
/** Vortex's own authored skins (vortex-client/src/vortex-skins), merged over the dump's as App.readVortexSkins() does. */
const VORTEX_SKINS = import.meta.glob('../../../vortex-client/src/vortex-skins/*.xml', {query: '?raw', import: 'default', eager: true}) as Record<string, string>;

const ATLAS_NAMES = [
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
    // The Ambreia dark window theme (style 300), src/vortex-skins/ambreia_skin_dark_*.xml.
    'ambreia_skin_dark'
];

/**
 * Atlas names whose embedded-asset name differs from the file on disk.
 * (See vortex-client App.ts — `skin_ubuntu_bg_9` is the AS3 variable name;
 * the bundled file is `ubuntu_bg_9.png`.)
 */
const ATLAS_FILE_OVERRIDES: Record<string, string> = {
    skin_ubuntu_bg_9: 'ubuntu_bg_9'
};

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
    {family: 'UbuntuThick', file: 'webfonts/Ubuntu-thick-b.ttf', weight: 'normal'}
];

/**
 * The live runtime handle returned by {@link GlazeBoot.boot}.
 */
export interface IGlazeRuntime
{
    windowManager: IWindowManager;
    imageBundle: AssetBundle;
    xmlBundle: AssetBundle;

    /**
     * Registered layout name → its raw layout XML. The window manager keeps this
     * privately; we mirror it here so the editor can read each layout's
     * `<variables>` blocks (the live window discards them — faithfully, since
     * AS3's base `WindowController` does too — so `<var>` editing must work off
     * the source XML).
     */
    layoutXml: Map<string, string>;
}

/**
 * GlazeBoot — brings up ONLY the window subsystem, standalone.
 *
 * A window-layout editor needs the window system (@ambreia/ui) and nothing else — no
 * communication, room engine, catalog, avatar rendering, furnidata, DI, or even a PixiJS stage.
 * So this builds a bare `WindowManager` with a localisation and a configuration stub, and updates
 * it from its own `requestAnimationFrame` ticker. The game widgets (avatar, badge, furni…) are
 * placeholders that draw nothing but keep their properties (GameWidgetPlaceholder), so Glaze can
 * still offer them, lay them out and save them unchanged. Windows composite onto a 2D
 * `OffscreenCanvas` via `compositeToBuffer` — the editor blits that onto its own
 * canvas — so PixiJS is never involved.
 *
 * The asset-loading glue (atlas decode + skin/layout parsing) mirrors
 * vortex-client/src/App.ts and reuses that package's `AssetBundle` +
 * `WindowXmlAssetParser` so the XML vocabulary stays single-sourced.
 */
export class GlazeBoot
{
    private _tickerId: number = 0;

    /**
     * Boots the window subsystem and loads every window asset, then returns a
     * live runtime.
     */
    public async boot(): Promise<IGlazeRuntime>
    {
        Logger.configureFromEnvironment(import.meta.env.DEV);
        // Glaze doesn't render avatars, so layouts referencing avatar placeholder
        // bitmaps flood ResourceManager with harmless "Asset not found" warnings.
        Logger.setNamespaceLevel('habbo.window.ResourceManager', LogLevel.ERROR);

        const [imageBundle, xmlBundle] = await Promise.all([
            this.loadBundle('/assets-images.ambreia'),
            this.loadBundle('/assets-xml.ambreia')
        ]);

        const windowManager = this.buildWindowSubsystem();

        if(import.meta.env.DEV)
        {
            (window as unknown as { glazeWindowManager: unknown }).glazeWindowManager = windowManager;
        }

        const layoutXml = new Map<string, string>();

        await this.loadWebFonts(xmlBundle);
        await this.loadSkinAssets(windowManager, imageBundle, xmlBundle);
        this.registerLayouts(windowManager, xmlBundle, layoutXml);
        await this.overlaySourceLayouts(windowManager, layoutXml);
        this.registerGlazeLayouts(windowManager, layoutXml);
        this.registerImageAssets(windowManager, imageBundle);

        return {
            windowManager,
            imageBundle,
            xmlBundle,
            layoutXml
        };
    }

    /**
     * Stops the update ticker. The caller owns bundle/context disposal.
     */
    public dispose(): void
    {
        if(this._tickerId)
        {
            cancelAnimationFrame(this._tickerId);
            this._tickerId = 0;
        }
    }

    /**
     * Builds the window manager and starts the rAF loop that replaces the PixiJS ticker.
     */
    private buildWindowSubsystem(): IWindowManager
    {
        // `interpolate` is what resolves `${image.library.url}…` in a layout's asset_uri: without
        // it every externally hosted image in a layout renders as nothing.
        const configuration = new GlazeConfigurationStub();
        const windowManager = new WindowManager({interpolate: (text: string): string => configuration.interpolate(text)});

        registerGameWidgetPlaceholders(windowManager);

        windowManager.setLocalization(new GlazeLocalizationStub());
        windowManager.initialize();
        this.startTicker(windowManager);

        return windowManager;
    }

    private startTicker(windowManager: WindowManager): void
    {
        let last = performance.now();

        const tick = (now: number): void =>
        {
            if(windowManager.disposed) return;

            windowManager.update(now - last);
            last = now;
            this._tickerId = requestAnimationFrame(tick);
        };

        this._tickerId = requestAnimationFrame(tick);
    }

    private async loadBundle(url: string): Promise<AssetBundle>
    {
        try
        {
            return await AssetBundle.load(url);
        }
        catch (error)
        {
            throw new Error(
                `[GlazeBoot] Failed to load ${url}. Build the client asset bundles first: `
                + `run "pnpm --filter vortex-client build:bundle" (or "pnpm --filter vortex-glaze bundle").`,
                {cause: error}
            );
        }
    }

    /**
     * Loads element descriptions, atlas bitmaps and every skin XML, then hands
     * them to the window manager (this call is what creates the WindowRenderer +
     * WindowComposite; before it, `compositeToBuffer` returns null).
     */
    private async loadSkinAssets(windowManager: IWindowManager, imageBundle: AssetBundle, xmlBundle: AssetBundle): Promise<void>
    {
        try
        {
            const elementDescriptionKey = `window-skins/${ELEMENT_DESCRIPTION_ASSET}.xml`;
            const elementDescriptionXml = xmlBundle.getText(elementDescriptionKey);

            if(elementDescriptionXml)
            {
                const elementDescription: IElementDescriptionData | null = parseElementDescriptionXml(
                    elementDescriptionXml,
                    ELEMENT_DESCRIPTION_ASSET,
                    elementDescriptionKey
                );

                const authored = VORTEX_SKINS[Object.keys(VORTEX_SKINS).find((p) => p.endsWith(`/${ELEMENT_DESCRIPTION_ASSET}.xml`)) ?? ''];
                const authoredDescription = authored ? parseElementDescriptionXml(authored, ELEMENT_DESCRIPTION_ASSET, 'vortex-skins') : null;
                const merged = elementDescription && authoredDescription ? mergeElementDescription(elementDescription, authoredDescription) : elementDescription;

                if(merged)
                {
                    windowManager.loadElementDescription(merged);
                }
            }

            await this.decodeAtlasesAndSkins(windowManager, imageBundle, xmlBundle, elementDescriptionKey);
        }
        catch (error)
        {
            log.warn('Failed to load skin/element assets:', error);
        }
    }

    /**
     * Decodes atlas PNGs → ImageBitmap and parses skin XMLs, then commits them
     * to the window manager. Runs asynchronously; the render loop simply shows
     * skinless windows for the ~1 frame until it resolves.
     */
    private async decodeAtlasesAndSkins(
        windowManager: IWindowManager,
        imageBundle: AssetBundle,
        xmlBundle: AssetBundle,
        elementDescriptionKey: string
    ): Promise<void>
    {
        const bitmaps = await Promise.all(
            ATLAS_NAMES.map((name) => imageBundle.getImageBitmap(`images/${ATLAS_FILE_OVERRIDES[name] ?? name}.png`))
        );

        const atlases = new Map<string, ImageBitmap>();

        for(let i = 0; i < ATLAS_NAMES.length; i++)
        {
            const bmp = bitmaps[i];

            if(bmp) atlases.set(ATLAS_NAMES[i], bmp);
        }

        const skins = new Map<string, ISkinData>();

        for(const key of xmlBundle.listKeys('window-skins/'))
        {
            if(key === elementDescriptionKey) continue;

            const skinXml = xmlBundle.getText(key);

            if(!skinXml) continue;

            const skinId = key.split('/').pop()!.replace(/\.xml$/, '');
            const skin = parseSkinXml(skinXml, skinId, key);

            if(skin) skins.set(skin.id, skin);
        }

        // The authored skins: a file named after a dump skin merges into it, a new id is added.
        for(const [path, xml] of Object.entries(VORTEX_SKINS))
        {
            const skinId = path.split('/').pop()!.replace(/.xml$/, '');

            if(skinId === ELEMENT_DESCRIPTION_ASSET) continue;

            const skin = parseSkinXml(xml, skinId, path);

            if(skin) skins.set(skin.id, mergeSkin(skins.get(skin.id) ?? null, skin));
        }

        windowManager.loadSkinAssets(skins, atlases);
    }

    /**
     * Registers every window layout XML under its AS3 asset name.
     */
    private registerLayouts(
        windowManager: IWindowManager,
        xmlBundle: AssetBundle,
        layoutXmlSink: Map<string, string>
    ): void
    {
        for(const key of xmlBundle.listKeys('window-layouts/'))
        {
            const layoutXml = xmlBundle.getText(key);

            if(!layoutXml) continue;

            const layoutBaseName = key.split('/').pop()!.replace(/\.xml$/, '');
            let layouts: IWindowLayoutXmlData[];

            try
            {
                layouts = parseWindowLayoutXml(layoutXml, layoutBaseName, key);
            }
            catch (error)
            {
                log.warn(`Failed to parse layout XML: ${key}`, error);
                continue;
            }

            for(const layout of layouts)
            {
                if(typeof layout.name === 'string' && layout.name.length > 0)
                {
                    windowManager.registerWidgetLayout(layout.name, layout.xml);
                    layoutXmlSink.set(layout.name, layout.xml);
                }
            }
        }
    }

    /**
     * Re-registers, on top of the bundle, every source layout that is newer than
     * the bundle itself (dev server only, see `vite.config.ts`).
     *
     * The bundle is a build artefact while Save writes to
     * `vortex-client/src/assets/window-layouts/` — so a layout edited in the
     * editor came back as its pre-edit self on the next page load, and the only
     * way to see the change was to re-run `pnpm --filter vortex-glaze bundle`.
     * The server sends only the files that actually changed, so this is normally
     * an empty response.
     */
    private async overlaySourceLayouts(
        windowManager: IWindowManager,
        layoutXmlSink: Map<string, string>
    ): Promise<void>
    {
        if(!import.meta.env.DEV)
        {
            return;
        }

        try
        {
            const response = await fetch('/glaze/layouts');

            if(!response.ok)
            {
                return;
            }

            const data = await response.json() as { files?: Array<{ name: string; xml: string }> };
            const files = data.files ?? [];
            let count = 0;

            for(const file of files)
            {
                let layouts: IWindowLayoutXmlData[];

                try
                {
                    layouts = parseWindowLayoutXml(file.xml, file.name, `${file.name}.xml`);
                }
                catch (error)
                {
                    log.warn(`Failed to parse source layout: ${file.name}.xml`, error);
                    continue;
                }

                for(const layout of layouts)
                {
                    if(typeof layout.name === 'string' && layout.name.length > 0)
                    {
                        windowManager.registerWidgetLayout(layout.name, layout.xml);
                        layoutXmlSink.set(layout.name, layout.xml);
                        count++;
                    }
                }
            }

            if(count > 0)
            {
                log.info(`${count} layout(s) loaded from source instead of the bundle (edited since it was built)`);
            }
        }
        catch (error)
        {
            log.warn('Source-layout overlay unavailable (is the Glaze dev server running?)', error);
        }
    }

    /**
     * Registers Glaze's own editor-UI layouts (src/assets/window-layouts/glaze_*.xml),
     * bundled at build time via import.meta.glob, under their file basename.
     */
    private registerGlazeLayouts(windowManager: IWindowManager, layoutXmlSink: Map<string, string>): void
    {
        const modules = import.meta.glob('../assets/window-layouts/*.xml', {
            query: '?raw',
            import: 'default',
            eager: true
        }) as Record<string, string>;

        for(const [path, xml] of Object.entries(modules))
        {
            const name = path.split('/').pop()!.replace(/\.xml$/, '');

            windowManager.registerWidgetLayout(name, xml);
            layoutXmlSink.set(name, xml);
        }
    }

    /**
     * Registers every bundled image as a blob URL with the window manager so
     * bitmap-backed skins resolve their assets.
     */
    private registerImageAssets(windowManager: IWindowManager, imageBundle: AssetBundle): void
    {
        for(const key of imageBundle.listKeys('images/'))
        {
            // Same naming as the client's readImageAssets(): a subfolder stays in the name.
            const name = key.slice('images/'.length).replace(/\.png$/, '');

            // Thunk, not a URL — same reason as the client's readImageAssets(): building
            // 2,891 blob URLs up front costs ~580 ms of editor boot for assets the edited
            // layout mostly never references.
            windowManager.registerAssetUrl(name, () => imageBundle.getUrl(key));
        }
    }

    private async loadWebFonts(bundle: AssetBundle): Promise<void>
    {
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
            }
            catch (error)
            {
                log.warn(`Failed to load webfont ${file}:`, error);
            }
        }));
    }
}
