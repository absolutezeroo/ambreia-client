import type {IAsset} from '@ambreia/common/assets/IAsset';
import {Component, ComponentDependency, type IContext} from '@core/runtime';
import {IID_HabboConfigurationManager} from '@iid/IIDHabboConfigurationManager';
import {IID_AssetLibrary} from '@iid/IIDAssetLibrary';
import type {IHabboConfigurationManager} from '../configuration/IHabboConfigurationManager';
import type {IAssetLibrary} from '@core/assets';
import type {IAvatarRenderManager} from './IAvatarRenderManager';
import type {IAvatarImage} from './IAvatarImage';
import type {IAvatarFigureContainer} from './IAvatarFigureContainer';
import type {IAvatarImageListener} from './IAvatarImageListener';
import type {IAvatarEffectListener} from './IAvatarEffectListener';
import type {IFigureData} from './structure/IFigureData';
import {ErrorReportStorage} from '@ambreia/common/utils/ErrorReportStorage';
import {AvatarStructure} from './AvatarStructure';
import {platform} from '@ambreia/common/platform/Platform';
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';
import {AssetAliasCollection} from './alias/AssetAliasCollection';
import {AvatarFigureContainer} from './AvatarFigureContainer';
import {AvatarImage} from './AvatarImage';
import {PlaceholderAvatarImage} from './PlaceholderAvatarImage';
import {BlockedAvatarImage} from './BlockedAvatarImage';
import {AvatarAssetDownloadManager} from './AvatarAssetDownloadManager';
import type {AnimationManager} from './animation/AnimationManager';
import {EffectAssetDownloadManager} from './EffectAssetDownloadManager';
import {AvatarRenderEvent} from './enum/AvatarRenderEvent';
import {AvatarStructureDownload} from './structure/AvatarStructureDownload';
import type {IStructureData} from './structure/IStructureData';
import {parseXmlDocument} from './structure/AvatarXmlUtils';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.avatar.AvatarRenderManager');

/**
 * Main avatar render manager component. Initializes and manages the avatar rendering system.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarRenderManager.as
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarRenderManager.as
 */
export class AvatarRenderManager extends Component implements IAvatarRenderManager 
{
    private static readonly EMBEDDED_AVATAR_ACTIONS_XML = `<actions><action  id="Default" precedence="1000" state="std" main="1" isdefault="1" geometrytype="vertical" activepartset="figure" assetpartdefinition="std"/>	<!-- baked in actions for snowwar -->
				<action  id="SnowWarRun" state="swrun" precedence="104" main="1" geometrytype="vertical" activepartset="snowwarrun" assetpartdefinition="swrun" prevents="fx.2,fx.3,fx.6,fx.14,fx.15,fx.17,fx.18,fx.19,fx.20,fx.21,fx.22,fx.33,fx.34,fx.35,fx.36,fx.38,fx.39,fx.45,fx.46,fx.48,fx.54,fx.55,fx.56,fx.57,fx.58,fx.69,fx.71,fx.72,fx.89,fx.90,fx.91,fx.92,fx.94,fx.97,fx.100,fx.104,fx.107,fx.108,fx.115,fx.116,fx.117,fx.118,fx.119,fx.120,fx.121,fx.122,fx.123,fx.124,fx.125,fx.127,fx.129,fx.130,fx.131,fx.132,fx.134,fx.135,fx.136,fx.137,fx.138,fx.139,fx.140,fx.141,fx.142,fx.143,fx.144,fx.145,fx.146,fx.147,fx.148,fx.149,fx.150,fx.151,fx.152,fx.153,fx.154,fx.155,fx.156,fx.157,fx.158,fx.159,fx.160,fx.161,fx.162,fx.164,fx.165,fx.166,fx167,fx168,fx169,fx170,fx171,fx172,fx173,fx174,fx175,fx176,dance"/>
				<action  id="SnowWarDieFront" state="swdiefront" precedence="105" main="1" geometrytype="swhorizontal" activepartset="snowwardiefront" assetpartdefinition="swdie" startfromframezero="true" prevents="fx.2,fx.3,fx.6,fx.14,fx.15,fx.17,fx.18,fx.19,fx.20,fx.21,fx.22,fx.33,fx.34,fx.35,fx.36,fx.38,fx.39,fx.45,fx.46,fx.48,fx.54,fx.55,fx.56,fx.57,fx.58,fx.69,fx.71,fx.72,fx.89,fx.90,fx.91,fx.92,fx.94,fx.97,fx.100,fx.104,fx.105,fx.107,fx.108,fx.115,fx.116,fx.117,fx.118,fx.119,fx.120,fx.121,fx.122,fx.123,fx.124,fx.125,fx.127,fx.129,fx.130,fx.131,fx.132,fx.134,fx.135,fx.136,fx.137,fx.138,fx.139,fx.140,fx.141,fx.142,fx.143,fx.144,fx.145,fx.146,fx.147,fx.148,fx.149,fx.150,fx.151,fx.152,fx.153,fx.154,fx.155,fx.156,fx.157,fx.158,fx.159,fx.160,fx.161,fx.162,fx.164,fx.165,fx.166,fx167,fx168,fx169,fx170,fx171,fx172,fx173,fx174,fx175,fx176,dance"/>
				<action  id="SnowWarDieBack" state="swdieback" precedence="106" main="1" geometrytype="swhorizontal" activepartset="snowwardieback" assetpartdefinition="swdie" startfromframezero="true" prevents="fx.2,fx.3,fx.6,fx.14,fx.15,fx.17,fx.18,fx.19,fx.20,fx.21,fx.22,fx.33,fx.34,fx.35,fx.36,fx.38,fx.39,fx.45,fx.46,fx.48,fx.54,fx.55,fx.56,fx.57,fx.58,fx.69,fx.71,fx.72,fx.89,fx.90,fx.91,fx.92,fx.94,fx.97,fx.100,fx.104,fx.105,fx.107,fx.108,fx.115,fx.116,fx.117,fx.118,fx.119,fx.120,fx.121,fx.122,fx.123,fx.124,fx.125,fx.127,fx.129,fx.130,fx.131,fx.132,fx.134,fx.135,fx.140,fx.141,fx.142,fx.143,fx.144,fx.145,fx.146,fx.147,fx.148,fx.149,fx.150,fx.151,fx.152,fx.153,fx.154,fx.155,fx.156,fx.157,fx.158,fx.159,fx.160,fx.161,fx.162,fx.164,fx.165,fx.166,fx167,fx168,fx169,fx170,fx171,fx172,fx173,fx174,fx175,fx176,dance"/>
				<action  id="SnowWarPick" state="swpick" precedence="107" main="1" geometrytype="vertical" activepartset="snowwarpick" assetpartdefinition="swpick" startfromframezero="true" prevents="fx.2,fx.3,fx.6,fx.14,fx.15,fx.17,fx.18,fx.19,fx.20,fx.21,fx.22,fx.33,fx.34,fx.35,fx.36,fx.38,fx.39,fx.45,fx.46,fx.48,fx.54,fx.55,fx.56,fx.57,fx.58,fx.69,fx.71,fx.72,fx.89,fx.90,fx.91,fx.92,fx.94,fx.97,fx.100,fx.104,fx.105,fx.107,fx.108,fx.115,fx.116,fx.117,fx.118,fx.119,fx.120,fx.121,fx.122,fx.123,fx.124,fx.125,fx.127,fx.129,fx.130,fx.131,fx.132,fx.134,fx.135,fx.136,fx.137,fx.138,fx.139,fx.140,fx.141,fx.142,fx.143,fx.144,fx.145,fx.146,fx.147,fx.148,fx.149,fx.150,fx.151,fx.152,fx.153,fx.154,fx.155,fx.156,fx.157,fx.158,fx.159,fx.160,fx.161,fx.162,fx.164,fx.165,fx.166,fx167,fx168,fx169,fx170,fx171,fx172,fx173,fx174,fx175,fx176,dance"/>
				<action  id="SnowWarThrow" state="swthrow" precedence="108" main="1" geometrytype="vertical" activepartset="snowwarthrow" assetpartdefinition="swthrow" startfromframezero="true" prevents="fx.2,fx.3,fx.6,fx.14,fx.15,fx.17,fx.18,fx.19,fx.20,fx.21,fx.22,fx.33,fx.34,fx.35,fx.36,fx.38,fx.39,fx.45,fx.46,fx.48,fx.54,fx.55,fx.56,fx.57,fx.58,fx.69,fx.71,fx.72,fx.89,fx.90,fx.91,fx.92,fx.94,fx.97,fx.100,fx.104,fx.105,fx.107,fx.108,fx.115,fx.116,fx.117,fx.118,fx.119,fx.120,fx.121,fx.122,fx.123,fx.124,fx.125,fx.127,fx.129,fx.130,fx.131,fx.132,fx.134,fx.135,fx.136,fx.137,fx.138,fx.139,fx.140,fx.141,fx.142,fx.143,fx.144,fx.145,fx.146,fx.147,fx.148,fx.149,fx.150,fx.151,fx.152,fx.153,fx.154,fx.155,fx.156,fx.157,fx.158,fx.159,fx.160,fx.161,fx.162,fx.164,fx.165,fx.166,fx167,fx168,fx169,fx170,fx171,fx172,fx173,fx.174,fx175,fx176,dance"/>
			</actions>`;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::BUILT_IN_ANIMATION_ASSET_NAMES
    private static readonly BUILT_IN_ANIMATION_ASSET_NAMES: string[] = ['dance_sixseven_animation'];

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::AVATAR_PLACEHOLDER_FIGURE
    private static readonly AVATAR_PLACEHOLDER_FIGURE: string = 'hd-99999-99999';

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarRenderManager.as::_structure
    private _structure: AvatarStructure;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarRenderManager.as::_aliasCollection
    private _aliasCollection: AssetAliasCollection;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarRenderManager.as::_avatarAssetDownloadManager
    private _avatarAssetDownloadManager: AvatarAssetDownloadManager | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarRenderManager.as::_effectAssetDownloadManager
    private _effectAssetDownloadManager: EffectAssetDownloadManager | null = null;
    private _placeholderFigure: AvatarFigureContainer | null = null;
    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::_blockedFigure
    private _blockedFigure: AvatarFigureContainer | null = null;
    private _pendingFigureDownloads: [IAvatarFigureContainer, IAvatarImageListener | null][] = [];
    private _configuration: IHabboConfigurationManager | null = null;
    private _assetLibrary: IAssetLibrary | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarRenderManager.as::_figureMapReady
    private _figureMapReady: boolean = false;
    private _mandatoryLibrariesReady: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarRenderManager.as::_structureReady
    private _structureReady: boolean = false;
    private _geometryReady: boolean = false;
    private _partSetsReady: boolean = false;
    private _actionsReady: boolean = false;
    private _animationsReady: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarRenderManager.as::_effectMapReady
    private _effectMapReady: boolean = false;
    private _structureDownload: AvatarStructureDownload | null = null;
    private _configurationCompleteHandled: boolean = false;

    constructor(context: IContext) 
    {
        super(context);

        this._structure = new AvatarStructure(this);
        this._aliasCollection = new AssetAliasCollection();
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarRenderManager.as::_isReady
    private _isReady: boolean = false;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::get isReady()
    public get isReady(): boolean 
    {
        return this._isReady;
    }

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::get effectMap()
    public get effectMap(): Map<string, any> 
    {
        if(!this._effectAssetDownloadManager) return new Map();

        return this._effectAssetDownloadManager.effectMap;
    }

    protected override get dependencies(): Array<ComponentDependency<any>> 
    {
        return [
            new ComponentDependency(
                IID_HabboConfigurationManager,
                (config: IHabboConfigurationManager | null) => 
                {
                    this._configuration = config;
                    this.tryOnConfigurationComplete();
                },
                true,
                [{type: 'complete', callback: () => this.tryOnConfigurationComplete()}]
            ),
            new ComponentDependency(
                IID_AssetLibrary,
                (assets: IAssetLibrary | null) => 
                {
                    this._assetLibrary = assets;
                    this.tryOnConfigurationComplete();
                },
                true
            ),
        ];
    }

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::_activeImages
    // Only the *real* images are tracked, not the placeholders: a placeholder is thrown away as
    // soon as the figure downloads, and its cache holds one figure nobody will look at again.
    private readonly _activeImages: AvatarImage[] = [];

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::createAvatarImage()
    public createAvatarImage(
        figureString: string,
        scale: string,
        gender: string | null = null,
        listener: IAvatarImageListener | null = null,
        effectListener: IAvatarEffectListener | null = null
    ): IAvatarImage | null
    {
        const figureContainer = new AvatarFigureContainer(figureString);

        if(this._avatarAssetDownloadManager === null) 
        {
            this._pendingFigureDownloads.push([figureContainer, listener]);

            return null;
        }

        if(gender) 
        {
            this.validateAvatarFigure(figureContainer, gender);
        }

        if(this._avatarAssetDownloadManager.isReady(figureContainer))
        {
            const avatarImage = new AvatarImage(
                this._structure,
                this._aliasCollection,
                figureContainer,
                scale,
                this._effectAssetDownloadManager,
                effectListener
            );

            this._activeImages.push(avatarImage);

            return avatarImage;
        }

        if(this._placeholderFigure === null) 
        {
            this._placeholderFigure = new AvatarFigureContainer(AvatarRenderManager.AVATAR_PLACEHOLDER_FIGURE);
        }

        this._avatarAssetDownloadManager.loadFigureSetData(figureContainer, listener);

        return new PlaceholderAvatarImage(
            this._structure,
            this._aliasCollection,
            this._placeholderFigure,
            scale,
            this._effectAssetDownloadManager
        );
    }

    /**
     * Forgets one image, so a later `resetAllCaches()` does not walk it.
     *
     * Not required for correctness — `resetAllCaches()` drops disposed images on its own pass —
     * but an image that unregisters on disposal keeps the list from growing with the room.
     */
    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::unregisterImage()
    public unregisterImage(avatarImage: AvatarImage): void
    {
        const index = this._activeImages.indexOf(avatarImage);

        if(index >= 0) this._activeImages.splice(index, 1);
    }

    /**
	 * The download manager reports the figure libraries the client cannot start without
	 *
	 * Public in AS3 because the download manager calls back into the render manager rather than
	 * the other way round; the port passes it as a closure, which is the same call.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/_SafeCls_582.as::onMandatoryLibrariesReady()
    public onMandatoryLibrariesReady(): void
    {
        this._mandatoryLibrariesReady = true;
        this.checkReady();
    }

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::resetAssetManager()
    public resetAssetManager(): void
    {
        this._aliasCollection.reset();
    }

    /**
	 * The carry-item ids the avatar structure knows about
	 *
	 * They come out of the `CarryItem` action's parameter list rather than a list of their own,
	 * which is why this goes through the structure instead of being a field here.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::getItemIds()
    public getItemIds(): string[]
    {
        return this._structure.getItemIds();
    }

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::getAnimationManager()
    public getAnimationManager(): AnimationManager | null
    {
        return this._structure?.animationManager ?? null;
    }

    /**
	 * Drops every downloaded asset library that is not currently in use
	 *
	 * Distinct from resetAllCaches() above: that one clears what each live avatar has *rendered*,
	 * this one clears what was *downloaded* to render it.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::purgeAssets()
    public purgeAssets(): void
    {
        this._avatarAssetDownloadManager?.purge();
    }

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::_mode
    private _mode: string = '';

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::get mode()
    public get mode(): string
    {
        return this._mode;
    }

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::set mode()
    public set mode(value: string)
    {
        this._mode = value;
    }

    /**
     * The silhouette shown in place of a user this client is blocking.
     *
     * `figureString` is taken and discarded, exactly as in AS3: the image always renders the
     * fixed `hd-99999-99999` figure, so the blocked user's real look never reaches the screen.
     * The container is built once and shared, and the result is deliberately *not* pushed onto
     * `_activeImages` — like a placeholder, it holds one figure no cache reset needs to walk.
     */
    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::createBlockedAvatarImage()
    public createBlockedAvatarImage(_figureString: string, scale: string): IAvatarImage
    {
        if(this._blockedFigure === null)
        {
            this._blockedFigure = new AvatarFigureContainer(AvatarRenderManager.AVATAR_PLACEHOLDER_FIGURE);
        }

        return new BlockedAvatarImage(
            this._structure,
            this._aliasCollection,
            this._blockedFigure,
            scale,
            this._effectAssetDownloadManager
        );
    }

    /**
     * Throws away every live avatar's render cache.
     *
     * The reason it also *rebuilds* the list is AS3's: the pass is the only place disposed images
     * are noticed, so it doubles as the sweep that lets them be collected.
     */
    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::resetAllCaches()
    public resetAllCaches(): void
    {
        const surviving: AvatarImage[] = [];

        for(const avatarImage of this._activeImages)
        {
            if(avatarImage === null || avatarImage.disposed) continue;

            avatarImage.resetCache();
            surviving.push(avatarImage);
        }

        this._activeImages.length = 0;
        this._activeImages.push(...surviving);
    }

    // Derived name: `getAssetByName` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::getAssetByName()
    // Inherited from Component in AS3; forwarded here because the port keeps the library private.
    public getAssetByName(name: string): IAsset | null
    {
        return this._assetLibrary?.getAssetByName(name) ?? null;
    }

    // TS-only: see `IAvatarRenderManager.getSpriteAsset()` for why the raw library lookup above
    // cannot find a sprite in this port and the alias collection can.
    public getSpriteAsset(name: string): IGraphicAsset | null
    {
        return this._aliasCollection.getAsset(name);
    }

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::getFigureData()
    public getFigureData(): IFigureData 
    {
        return this._structure.figureData;
    }

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::getFigureStringWithFigureIds()
    public getFigureStringWithFigureIds(figureString: string, gender: string, figureIds: number[]): string 
    {
        const figure = new AvatarFigureContainer(figureString);

        for(const setId of figureIds) 
        {
            const partSet = this._structure.figureData.getFigurePartSet(setId);

            if(partSet)
            {
                // AS3 saves the part with the colours the figure ALREADY has for that type
                // (`_SafeCls_582.as` l.407: `savePartData(type, id, getColourIds(type))`). Passing
                // [0] here reset the colour of every part this method touched, so swapping a hat
                // through the figure-id path silently repainted it.
                figure.updatePart(partSet.type, setId, figure.getPartColorIds(partSet.type) ?? [0]);
            }
        }

        return figure.getFigureString();
    }

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::isValidFigureSetForGender()
    public isValidFigureSetForGender(setId: number, gender: string): boolean 
    {
        const partSet = this._structure.figureData.getFigurePartSet(setId);

        if(!partSet) return false;

        return partSet.gender === gender || partSet.gender === 'U';
    }

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::getMandatoryAvatarPartSetIds()
    public getMandatoryAvatarPartSetIds(gender: string, clubLevel: number): string[] 
    {
        return this._structure.getMandatorySetTypeIds(gender, clubLevel);
    }

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::createFigureContainer()
    public createFigureContainer(figureString: string): IAvatarFigureContainer 
    {
        return new AvatarFigureContainer(figureString);
    }

    /**
     * The highest club level any part of a figure requires — what the mannequin checks
     * before letting somebody wear an outfit.
     *
     * The second loop is the non-obvious half: a part type the figure *omits* can still cost
     * club level, because `optionalFromClubLevel()` is what makes "no hat" a club-only look
     * for a gender that has a mandatory default. Passing `partTypes` restricts the check to
     * the six clothing slots the mannequin cares about; null means the whole body.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/_SafeCls_582.as::resolveClubLevel()
    public resolveClubLevel(container: IAvatarFigureContainer, gender: string, partTypes: string[] | null = null): number
    {
        if(!this._structureReady) return 0;

        const figureData = this._structure.figureData;
        const containerPartTypes = container.getPartTypeIds();

        let clubLevel = 0;

        for(const partType of containerPartTypes)
        {
            const setType = figureData.getSetType(partType);

            if(!setType) continue;

            const partSet = setType.getPartSet(container.getPartSetId(partType));

            if(!partSet) continue;

            clubLevel = Math.max(partSet.clubLevel, clubLevel);

            const palette = figureData.getPalette(setType.paletteID);

            if(!palette) continue;

            for(const colorId of container.getPartColorIds(partType) ?? [])
            {
                const color = palette.getColor(colorId);

                if(color)
                {
                    clubLevel = Math.max(color.clubLevel, clubLevel);
                }
            }
        }

        const checkedTypes = partTypes ?? this._structure.getBodyPartsUnordered('full');

        for(const partType of checkedTypes)
        {
            if(containerPartTypes.indexOf(partType) !== -1) continue;

            const setType = figureData.getSetType(partType);

            // AS3 dereferences this unguarded and throws on an unknown part type; skipped
            // here, which leaves the level unchanged exactly as a zero would.
            if(!setType) continue;

            clubLevel = Math.max(setType.optionalFromClubLevel(gender), clubLevel);
        }

        return clubLevel;
    }

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::isFigureReady()
    public isFigureReady(figure: IAvatarFigureContainer): boolean 
    {
        if(!this._avatarAssetDownloadManager) return false;

        return this._avatarAssetDownloadManager.isReady(figure);
    }

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::downloadFigure()
    public downloadFigure(figure: IAvatarFigureContainer, listener: IAvatarImageListener | null = null): void 
    {
        if(!this._avatarAssetDownloadManager) 
        {
            this._pendingFigureDownloads.push([figure, listener]);

            return;
        }

        this._avatarAssetDownloadManager.loadFigureSetData(figure, listener);
    }

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::injectFigureData()
    public injectFigureData(data: any): void 
    {
        this._structure.injectFigureData(data);
    }

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::dispose()
    public dispose(): void 
    {
        if(this._disposed) return;

        this._disposed = true;

        if(this._avatarAssetDownloadManager) 
        {
            this._avatarAssetDownloadManager.dispose();
            this._avatarAssetDownloadManager = null;
        }

        if(this._effectAssetDownloadManager) 
        {
            this._effectAssetDownloadManager.dispose();
            this._effectAssetDownloadManager = null;
        }

        this._pendingFigureDownloads.length = 0;
        this._structureDownload = null;
        this._placeholderFigure = null;
        this._structure.dispose();
        this._aliasCollection.dispose();

        super.dispose();
    }

    // AS3: sources/win63_version/habbo/avatar/class_49.as::onConfigurationComplete()
    public onConfigurationComplete(): void 
    {
        // Can now be invoked twice (the immediate isInitialized() check above, and
        // the 'complete' event handler) if configuration finishes loading between
        // those two — make sure the actual work only happens once.
        if(this._configurationCompleteHandled) return;

        this._configurationCompleteHandled = true;

        void this.loadActions();
        this.loadFigureData();
        this.initDownloadManagers();
    }

    // AS3: sources/win63_version/habbo/avatar/class_49.as::initComponent()
    protected override initComponent(): void 
    {
        this.onConfigurationReady();
    }

    /**
     * Component's dependency injection resolves IID_HabboConfigurationManager and
     * IID_AssetLibrary independently and in no guaranteed order, and only attaches
     * the 'complete' listener once the *configuration* dependency resolves — so
     * relying on that listener alone breaks two ways: (1) if configuration already
     * finished loading (and already emitted 'complete') before this component's
     * dependency on it resolved, the listener is attached after the fact and never
     * fires again since 'complete' is one-shot, and (2) even accounting for that,
     * onConfigurationComplete() also needs _assetLibrary, which is a *separate*
     * dependency that can resolve before or after configuration with no ordering
     * guarantee — initDownloadManagers() would otherwise silently bail out
     * ("AssetLibrary not available for download managers") if it ran first. So:
     * check both conditions from every point either one could become satisfied,
     * and let onConfigurationComplete()'s own guard make repeat calls a no-op.
     */
    private tryOnConfigurationComplete(): void 
    {
        if(!this._assetLibrary || !this._configuration?.isInitialized()) return;

        this.onConfigurationComplete();
    }

    /**
     * AS3 initComponent(): loads embedded avatar XML assets from AssetLibrary.
     *
     * @see sources/win63_version/habbo/avatar/class_49.as
     */
    private onConfigurationReady(): void 
    {
        if(!this._assetLibrary) return;

        log.debug('Loading embedded avatar XML assets...');

        const embeddedActions = parseXmlDocument(AvatarRenderManager.EMBEDDED_AVATAR_ACTIONS_XML);

        this._structure.initGeometry(this.getEmbeddedAvatarAssetContent('HabboAvatarGeometry'));
        this._geometryReady = true;
        this._structure.initPartSets(this.getEmbeddedAvatarAssetContent('HabboAvatarPartSets'));
        this._partSetsReady = true;

        if(embeddedActions !== null) 
        {
            this._structure.initActions(this._assetLibrary, embeddedActions);
        }

        this._structure.initAnimation(this.getEmbeddedAvatarAssetContent('HabboAvatarAnimation'));
        this._animationsReady = true;
        this._structure.initFigureData(this.getEmbeddedAvatarAssetContent('HabboAvatarFigure'));

        this.checkReady();
    }

    /**
     * AS3 requestActions()/onAvatarActionsLoaded(): loads HabboAvatarActions XML and updates actions.
     *
     * @see sources/win63_version/habbo/avatar/class_49.as::requestActions()
     * @see sources/win63_version/habbo/avatar/class_49.as::onAvatarActionsLoaded()
     */
    private async loadActions(): Promise<void> 
    {
        try 
        {
            let data = this.getEmbeddedAvatarAssetContent('HabboAvatarActions', false);

            if(data === null) 
            {
                const url = this.getAvatarActionsUrl();

                if(url !== '') 
                {
                    data = await this.loadXmlFromUrl(url, 'HabboAvatarActions');
                }
            }

            if(data !== null)
            {
                this._structure.updateActions(data);
                this.registerBuiltInAnimations();
                this._actionsReady = true;
                this.checkReady();
            }
        }
        catch (error)
        {
            log.error('Failed to load actions data', error);
        }
    }

    /**
     * Registers the animations shipped as their own embedded XML rather than inside
     * `HabboAvatarAnimation`.
     *
     * AS3 calls this from `onAvatarActionsLoaded()`, right after `updateActions()` and
     * before the ready flag — the animation references actions, so the action table has to
     * exist first.
     */
    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::registerBuiltInAnimations()
    private registerBuiltInAnimations(): void
    {
        for(const assetName of AvatarRenderManager.BUILT_IN_ANIMATION_ASSET_NAMES)
        {
            const animation = this.getEmbeddedAvatarAssetContent(assetName, false);

            if(animation !== null)
            {
                this._structure.registerAnimation(animation);
            }
        }
    }

    // AS3: sources/win63_version/habbo/avatar/class_49.as::initComponent()
    private getEmbeddedAvatarAssetContent(assetName: string, warnIfMissing: boolean = true): unknown | null 
    {
        if(!this._assetLibrary || !this._assetLibrary.hasAsset(assetName)) 
        {
            if(warnIfMissing) 
            {
                log.warn(`Missing embedded avatar asset: ${assetName}`);
            }

            return null;
        }

        return this._assetLibrary.getAssetByName(assetName)?.content ?? null;
    }

    // AS3: sources/win63_version/habbo/avatar/class_49.as::onConfigurationComplete()
    private loadFigureData(): void 
    {
        const url = this._configuration?.getProperty('external.figurepartlist.txt') ?? '';

        if(url === '') 
        {
            return;
        }

        this._structureDownload = new AvatarStructureDownload(url, this._structure.figureData as unknown as IStructureData);
        this._structureDownload.once(AvatarStructureDownload.STRUCTURE_DONE, () => 
        {
            this._structureDownload = null;
            this._structure.init();
            this._structureReady = true;
            this.checkReady();
        });
    }

    private getAvatarActionsUrl(): string 
    {
        if(!this._configuration) 
        {
            return '';
        }

        const dynamicAvatarUrl = this._configuration.getProperty('flash.dynamic.avatar.download.url');

        if(this.isResolvedDownloadUrlTemplate(dynamicAvatarUrl)) 
        {
            return dynamicAvatarUrl + 'HabboAvatarActions.xml';
        }

        return '';
    }

    private getEffectMapUrl(): string 
    {
        if(!this._configuration) 
        {
            return '';
        }

        const dynamicAvatarUrl = this._configuration.getProperty('flash.dynamic.avatar.download.url');

        return this.isResolvedDownloadUrlTemplate(dynamicAvatarUrl) ? dynamicAvatarUrl + 'effectmap.xml' : '';
    }

    private async loadXmlFromUrl(url: string, assetName: string): Promise<Document | null> 
    {
        const response = await fetch(url);

        if(!response.ok) 
        {
            throw new Error(`${assetName} fetch failed: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        const document = parseXmlDocument(text);

        if(document === null) 
        {
            throw new Error(`${assetName} is not valid XML`);
        }

        return document;
    }

    // AS3: sources/win63_version/habbo/avatar/class_49.as::onConfigurationComplete()
    private initDownloadManagers(): void 
    {
        const avatarDownloadUrl = this.getAvatarDownloadUrlTemplate(
            'flash.dynamic.avatar.download.url',
            'flash.dynamic.avatar.download.name.template');
        const effectDownloadUrl = avatarDownloadUrl;

        if(!this._assetLibrary) 
        {
            log.error('AssetLibrary not available for download managers');

            return;
        }

        // Connect alias collection to asset library for sprite resolution
        this._aliasCollection.setAssetLibrary(this._assetLibrary);

        if(this._avatarAssetDownloadManager === null) 
        {
            this._mandatoryLibrariesReady = false;
            this._avatarAssetDownloadManager = new AvatarAssetDownloadManager(
                avatarDownloadUrl,
                this._structure,
                this._assetLibrary,
                this._aliasCollection,
                () => this._isReady,
                () => this.onMandatoryLibrariesReady()
            );

            this.loadFigureMap();
        }

        if(this._effectAssetDownloadManager === null) 
        {
            this._effectAssetDownloadManager = new EffectAssetDownloadManager(
                effectDownloadUrl,
                this._structure,
                this._assetLibrary,
                this._aliasCollection
            );

            this.loadEffectMap();
        }
    }

    private getAvatarDownloadUrlTemplate(downloadUrlKey: string, nameTemplateKey: string): string 
    {
        if(!this._configuration) 
        {
            return '';
        }

        const downloadUrl = this._configuration.getProperty(downloadUrlKey);

        if(!this.isResolvedDownloadUrlTemplate(downloadUrl)) 
        {
            return '';
        }

        return downloadUrl + this._configuration.getProperty(nameTemplateKey);
    }

    private isResolvedDownloadUrlTemplate(url: string): boolean 
    {
        return !!url && url.indexOf('${') < 0;
    }

    private async loadFigureMap(): Promise<void> 
    {
        try 
        {
            const url = this._configuration?.getProperty('flash.dynamic.avatar.download.configuration') ?? '';

            if(url === '' || !this._avatarAssetDownloadManager) 
            {
                return;
            }

            const response = await fetch(url);

            if(!response.ok) 
            {
                throw new Error(`Figure map fetch failed: ${response.status} ${response.statusText}`);
            }

            const text = await response.text();
            let data = this.parseFigureMapXml(text);
            const trimmed = text.trim();

            if(data === null && (trimmed.startsWith('{') || trimmed.startsWith('['))) 
            {
                data = JSON.parse(trimmed);
            }

            if(data === null) 
            {
                throw new Error('Figure map is not valid XML');
            }

            this._avatarAssetDownloadManager.loadFigureMap(data);
            this._figureMapReady = true;
            this.checkReady();
        }
        catch (error) 
        {
            log.error('Failed to load figure map', error);
        }
    }

    /**
     * Parses figure map XML into the JSON format expected by generateMap.
     *
     * AS3 uses XML natively. The figure map XML format is:
     * <map><lib id="..." revision="..."><part type="..." id="..."/></lib></map>
     */
    private parseFigureMapXml(xmlText: string): any | null 
    {
        try 
        {
            const doc = platform().parseXml(xmlText);
            const libElements = doc.querySelectorAll('lib');

            if(libElements.length === 0) return null;

            const libraries: any[] = [];

            for(const libEl of libElements) 
            {
                const id = libEl.getAttribute('id') || '';
                const revision = libEl.getAttribute('revision') || '';
                const parts: any[] = [];

                const partElements = libEl.querySelectorAll('part');

                for(const partEl of partElements) 
                {
                    parts.push({
                        type: partEl.getAttribute('type') || '',
                        id: partEl.getAttribute('id') || ''
                    });
                }

                libraries.push({id, revision, parts});
            }

            log.info(`Parsed XML figure map: ${libraries.length} libraries`);

            return {libraries};
        }
        catch (error) 
        {
            log.error('XML parsing error', error);

            return null;
        }
    }

    // AS3: sources/win63_version/habbo/avatar/class_49.as::onConfigurationComplete()
    private async loadEffectMap(): Promise<void> 
    {
        try 
        {
            const url = this.getEffectMapUrl();

            if(url !== '' && this._effectAssetDownloadManager) 
            {
                const data = await this.loadXmlFromUrl(url, 'effectmap');

                if(data !== null) 
                {
                    this._effectAssetDownloadManager.loadEffectMap(data);
                }
            }

            this._effectMapReady = true;
            this.checkReady();
        }
        catch (error) 
        {
            log.error('Failed to load effect map', error);
        }
    }

    private checkReady(): void 
    {
        if(this._isReady) return;

        if(this._geometryReady &&
            this._partSetsReady &&
            this._actionsReady &&
            this._animationsReady &&
            this._structureReady &&
            this._figureMapReady &&
            this._mandatoryLibrariesReady &&
            this._effectMapReady) 
        {
            this._isReady = true;

            log.info('Avatar render system ready');
            this.events.emit(AvatarRenderEvent.AVATAR_RENDER_READY);
            this._avatarAssetDownloadManager?.processInitBuffer();
            this.purgeInitDownloadBuffer();
        }
    }

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::purgeInitDownloadBuffer()
    private purgeInitDownloadBuffer(): void 
    {
        if(!this._avatarAssetDownloadManager) return;

        const buffer = this._pendingFigureDownloads;

        this._pendingFigureDownloads = [];

        for(const [figure, listener] of buffer) 
        {
            if(listener !== null && !listener.disposed) 
            {
                this._avatarAssetDownloadManager.loadFigureSetData(figure, listener);
            }
        }
    }

    /**
	 * Repairs a figure before it is rendered, and answers whether it was already sound.
	 *
	 * Three things were missing, and the middle one is the one that shows: the port only filled in
	 * a mandatory part that was ABSENT. A part that is present but names a set id the figure data
	 * does not contain — an item removed from the hotel, a hand-edited figure string, a figure
	 * from another hotel — was left alone and drew nothing. AS3 replaces it with the default too.
	 *
	 * The club level is AS3's own `2`, not `0`: it decides which set types count as mandatory, so
	 * validating at 0 checked a shorter list than the one the renderer then draws.
	 *
	 * The return value is `true` when NOTHING had to be repaired — note the inversion, AS3 returns
	 * `!changed`.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::validateAvatarFigure()
    private validateAvatarFigure(figure: AvatarFigureContainer, gender: string): boolean
    {
        if(this._structure === null)
        {
            ErrorReportStorage.addDebugData('AvatarRenderManager', 'validateAvatarFigure: structure is null!');
        }

        const mandatoryTypes = this._structure.getMandatorySetTypeIds(gender, 2);

        if(!mandatoryTypes) return true;

        const figureData = this._structure.figureData;

        if(!figureData)
        {
            ErrorReportStorage.addDebugData('AvatarRenderManager', 'validateAvatarFigure: figureData is null!');
        }

        let changed = false;

        for(const partType of mandatoryTypes)
        {
            if(!figure.hasPartType(partType))
            {
                const defaultPartSet = this._structure.getDefaultPartSet(partType, gender);

                if(defaultPartSet)
                {
                    figure.updatePart(partType, defaultPartSet.id, [0]);
                    changed = true;
                }

                continue;
            }

            const setType = figureData?.getSetType(partType) ?? null;

            if(setType === null)
            {
                ErrorReportStorage.addDebugData('AvatarRenderManager', 'validateAvatarFigure: setType is null!');

                continue;
            }

            if(setType.getPartSet(figure.getPartSetId(partType)) !== null) continue;

            const fallback = this._structure.getDefaultPartSet(partType, gender);

            if(fallback)
            {
                figure.updatePart(partType, fallback.id, [0]);
                changed = true;
            }
        }

        return !changed;
    }
}
