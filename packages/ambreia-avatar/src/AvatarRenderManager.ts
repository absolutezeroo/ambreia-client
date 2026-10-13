import type {IAsset} from '@ambreia/common/assets/IAsset';
import {EventEmitter} from 'eventemitter3';
import type {IAvatarRenderOptions} from './IAvatarRenderOptions';
import type {IAvatarRenderManager} from './IAvatarRenderManager';
import type {IAvatarImage} from './IAvatarImage';
import type {IAvatarFigureContainer} from './IAvatarFigureContainer';
import type {IAvatarImageListener} from './IAvatarImageListener';
import type {IAvatarAnimationListener} from './IAvatarAnimationListener';
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
import {AvatarAnimationAssets} from './AvatarAnimationAssets';
import {AvatarRenderEvent} from './enum/AvatarRenderEvent';
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
// DEVIATION: AS3's AvatarRenderManager is a Component fed by the DI context and the configuration.
//   Here it is built from typed options (spec §3 rule 1); the engine reads the four configuration
//   keys, builds it once the configuration is complete, and registers it with attachInstance().
export class AvatarRenderManager implements IAvatarRenderManager 
{
    private readonly _options: IAvatarRenderOptions;
    private readonly _events: EventEmitter = new EventEmitter();
    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::AVATAR_PLACEHOLDER_FIGURE
    private static readonly AVATAR_PLACEHOLDER_FIGURE: string = 'hd-99999-99999';

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarRenderManager.as::_structure
    private _structure: AvatarStructure;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarRenderManager.as::_aliasCollection
    private _aliasCollection: AssetAliasCollection;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarRenderManager.as::_avatarAssetDownloadManager
    private _avatarAssetDownloadManager: AvatarAssetDownloadManager | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarRenderManager.as::_effectAssetDownloadManager
    private _animationAssets: AvatarAnimationAssets | null = null;
    private _placeholderFigure: AvatarFigureContainer | null = null;
    // AS3: .../src/com/sulake/habbo/avatar/_SafeCls_582.as::_blockedFigure
    private _blockedFigure: AvatarFigureContainer | null = null;
    private _pendingFigureDownloads: [IAvatarFigureContainer, IAvatarImageListener | null][] = [];
    private _mandatoryLibrariesReady: boolean = false;

    constructor(options: IAvatarRenderOptions)
    {
        this._options = options;
        this._structure = new AvatarStructure(this);
        this._aliasCollection = new AssetAliasCollection();

        // What initComponent() and the configuration's `complete` did, in that order.
        this.initStructure();
        this.initDownloadManagers();
    }

    // TS-only: the Component used to provide these two; the manager owns them now.
    public get events(): EventEmitter
    {
        return this._events;
    }

    // TS-only: see `events`.
    public get disposed(): boolean
    {
        return this._disposed;
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
        if(!this._animationAssets) return new Map();

        return this._animationAssets.effectMap;
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
        effectListener: IAvatarAnimationListener | null = null
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
                this._animationAssets,
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
            this._animationAssets
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
            this._animationAssets
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
        return this._options.assets.getAssetByName(name) ?? null;
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

        if(this._animationAssets) 
        {
            this._animationAssets.dispose();
            this._animationAssets = null;
        }

        this._pendingFigureDownloads.length = 0;
        this._placeholderFigure = null;
        this._structure.dispose();
        this._aliasCollection.dispose();
        this._events.removeAllListeners();
    }

    /**
     * Parses the shipped data (IAvatarRenderOptions.data). AS3 parsed the embedded XMLs here and
     * downloaded the actions, the figure data, the figure map and the effect map once the
     * configuration was complete; Ambreia ships all of them, so nothing waits on the network but
     * the figure libraries.
     */
    // AS3: sources/win63_version/habbo/avatar/class_49.as::initComponent()
    private initStructure(): void
    {
        const data = this._options.data;
        const offsets = new Map<string, unknown>();

        for(const [state, xml] of Object.entries(data.actionOffsets)) offsets.set(state, parseXmlDocument(xml));

        this._structure.initGeometry(parseXmlDocument(data.geometry));
        this._structure.initPartSets(parseXmlDocument(data.partSets));
        this._structure.initActions(parseXmlDocument(data.actions), offsets);
        this._structure.initAnimation(parseXmlDocument(data.animation));
        this._structure.initFigureData(parseXmlDocument(data.figure));
        // AS3: AvatarStructureDownload.onDataComplete(): the full figure data goes on top of the embedded one.
        (this._structure.figureData as unknown as IStructureData).appendXML(parseXmlDocument(data.figureData));
        this._structure.init();
    }

    // AS3: sources/win63_version/habbo/avatar/class_49.as::onConfigurationComplete()
    private initDownloadManagers(): void
    {
        const {clothing, effects, data} = this._options;

        this._aliasCollection.setAssetLibrary(this._options.assets);

        this._avatarAssetDownloadManager = new AvatarAssetDownloadManager(
            clothing,
            this._structure,
            this._options.assets,
            this._aliasCollection,
            () => this._isReady,
            () => this.onMandatoryLibrariesReady(),
            this._options.onLibraryLoaded ?? null
        );
        this._animationAssets = new AvatarAnimationAssets(
            effects,
            this._structure,
            this._options.assets,
            this._aliasCollection
        );

        const figureMap = this.parseFigureMapXml(data.figureMap);

        if(figureMap) this._avatarAssetDownloadManager.loadFigureMap(figureMap);
        else log.error('The figure map has no <lib>: no figure library will ever download.');

        this._animationAssets.loadEffectMap(parseXmlDocument(data.effectMap));
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

    private checkReady(): void
    {
        if(this._isReady || !this._mandatoryLibrariesReady) return;

        this._isReady = true;

        log.info('Avatar render system ready');
        this.events.emit(AvatarRenderEvent.AVATAR_RENDER_READY);
        this._avatarAssetDownloadManager?.processInitBuffer();
        this.purgeInitDownloadBuffer();
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
