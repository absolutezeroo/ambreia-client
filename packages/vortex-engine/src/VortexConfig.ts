import type {AssetUrlSource} from '@ambreia/ui/IResourceManager';
import type {IElementDescriptionData} from '@ambreia/ui/kit/IElementDescriptor';
import type {ISkinData} from '@ambreia/ui/graphics/renderer/BitmapSkinParser';
import type {IKernelConfig} from '@ambreia/kernel/config/loadConfig';
import type {IAvatarData} from '@ambreia/avatar/AvatarData';

/**
 * PixiJS application configuration options.
 */
export interface IVortexCoreConfig
{
    /** Background color */
    background?: string;
    /** Element to resize to */
    resizeTo?: HTMLElement | Window;
    /** Enable antialiasing */
    antialias?: boolean;
    /** Pixel resolution */
    resolution?: number;
    /** Canvas container element */
    canvas?: HTMLElement;
}

/**
 * Connection configuration
 */
export interface IConnectionConfig
{
    /** Server host (can include ws:// or wss://) */
    host: string;

    /** Server ports to try */
    ports: number[];

    /** SSO ticket for authentication */
    ssoTicket?: string;

    /** Auto-connect on initialization */
    autoConnect?: boolean;
}

/**
 * The window manager's asset library, supplied at construction.
 *
 * AS3 equivalent: the `_SafeCls_76` (AssetLibrary) third argument of
 * HabboWindowManagerComponent, loaded from the embedded HabboWindowManagerCom resource.
 */
export interface IVortexWindowAssets
{
    /** Parsed element-description XML (window type -> skin/renderer descriptors). */
    elementDescription?: IElementDescriptionData | null;

    /** Skin definitions keyed by skin id. */
    skins?: Map<string, ISkinData>;

    /** Decoded atlas spritesheets keyed by atlas name. */
    atlases?: Map<string, ImageBitmap>;

    /** Widget layout XML keyed by asset name. */
    layouts?: Map<string, string>;

    /**
     * Whole-file layout XML keyed by its `*Com.as` field name, for the *asset library*.
     *
     * Distinct from `layouts` above, which is the window manager's `buildWidgetLayout()` registry
     * and splits a multi-window file into one `name#0`, `name#1`, … entry per `<window>`. A whole
     * family of ported views does what AS3 does and reads the layout out of the library instead —
     * `assets.getAssetByName("settings_xml").content` — where the name is the file's and the
     * content is all of it, `<layout>` root included.
     */
    libraryLayouts?: Map<string, string>;

    /**
     * Image blob URLs keyed by asset name, for the window manager's `ResourceManager` — the
     * registry every `asset_uri` in a layout resolves against.
     *
     * A value may be a thunk instead of a URL, and for the images/ bundle it is: see
     * `AssetUrlSource`. The names still all go in before the engine boots.
     */
    imageUrls?: Map<string, AssetUrlSource>;

    /**
     * Decoded bitmaps for the images that ported code reads straight out of the *asset library*
     * by name (`getAssetByName("badge_part_add").content`) rather than through an `asset_uri`.
     *
     * Decoded up front, not lazily, because those reads are synchronous — in AS3 they resolve an
     * `[Embed]` that is already a `BitmapData` by the time the component owning it exists.
     */
    libraryImages?: Map<string, ImageBitmap>;
}

/**
 * Vortex configuration
 */

export interface IVortexConfig extends IVortexCoreConfig
{
    /**
     * The configuration, loaded, validated and frozen by the kernel before the boot (spec §5):
     * `app` (server, ?sso, ?link), `legacy` (the old key=value properties) and one section per
     * feature. Replaces `connection`, `configuration`, `configurationUrl` and the top-level keys.
     */
    kernel: IKernelConfig;

    /** The avatar's shipped data (readAvatarData()). */
    avatarData: IAvatarData;

    /**
     * Window skins and layouts, handed to HabboWindowManager at construction.
     *
     * AS3's HabboWindowManagerComponent(context, flags, assets) takes its asset library as a
     * constructor argument, already filled from the embedded HabboWindowManagerCom resource —
     * so the component owns its layouts from the instant it exists. Pushing them in afterwards
     * (which is what the client used to do, once the bundle had been parsed) leaves a window
     * in which the manager is alive but empty: the socket opens during component init, so an
     * early server message could reach buildWidgetLayout() before the layouts landed and get
     * null back — intermittently, depending on who won the race.
     */
    windowAssets?: IVortexWindowAssets;

}
