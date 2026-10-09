import type {ActionDefinition} from './actions/ActionDefinition';
import {AvatarActionManager} from './actions/AvatarActionManager';
import type {IActiveActionData} from './actions/IActiveActionData';
import type {Animation} from './animation/Animation';
import type {AnimationLayerData} from './animation/AnimationLayerData';
import {AnimationManager} from './animation/AnimationManager';
import {AvatarImagePartContainer} from './AvatarImagePartContainer';
import {AvatarDirectionAngle} from './enum/AvatarDirectionAngle';
import {AvatarModelGeometry} from './geometry/AvatarModelGeometry';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {IAvatarRenderManager} from './IAvatarRenderManager';
import type {IAvatarFigureContainer} from './IAvatarFigureContainer';
import type {IAvatarImage} from './IAvatarImage';
import {AnimationData} from './structure/AnimationData';
import type {AvatarCanvas} from './structure/AvatarCanvas';
import {FigureSetData} from './structure/FigureSetData';
import type {IFigureData} from './structure/IFigureData';
import type {IPartColor} from './structure/figure/IPartColor';
import type {IFigurePartSet} from './structure/figure/IFigurePartSet';
import {PartSetsData} from './structure/PartSetsData';

/**
 * Central orchestrator connecting geometry, actions, animations, and figure data.
 *
 * @see sources/win63_version/habbo/avatar/AvatarStructure.as
 */
export class AvatarStructure
{
    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::_geometry
    private _geometry: AvatarModelGeometry | null = null;
    private _actionManager: AvatarActionManager | null = null;
    private _figureSetData: FigureSetData;
    private _partSetsData: PartSetsData;
    private _animationData: AnimationData;
    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::_defaultAction
    private _defaultAction: ActionDefinition | null = null;
    private _defaultLayAction: ActionDefinition | null = null;
    private _mandatorySetTypeCache: Map<string, Map<number, string[]>>;

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::AvatarStructure()
    constructor(renderManager: IAvatarRenderManager | null = null)
    {
        this._renderManager = renderManager;
        this._figureSetData = new FigureSetData();
        this._partSetsData = new PartSetsData();
        this._animationData = new AnimationData();
        this._animationManager = new AnimationManager();
        this._mandatorySetTypeCache = new Map();
    }

    private _animationManager: AnimationManager;

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::get animationManager()
    public get animationManager(): AnimationManager
    {
        return this._animationManager;
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::_renderManager
    private _renderManager: IAvatarRenderManager | null;

    /**
     * The render manager that owns this structure.
     *
     * AS3's asset download managers reach `.renderManager.isReady` and listen for
     * `AVATAR_RENDER_READY` through it. This port already hands those two reads to
     * `AvatarAssetDownloadManager` as callbacks (`renderReadyProvider` /
     * `mandatoryLibrariesReadyCallback`), so nothing here needs the back-reference — but it is a
     * real public member and AS3's constructor takes it, so it is carried.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarStructure.as::get renderManager()
    public get renderManager(): IAvatarRenderManager | null
    {
        return this._renderManager;
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::get figureData()
    public get figureData(): IFigureData
    {
        return this._figureSetData;
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::init()
    public init(): void
    {
        this._mandatorySetTypeCache = new Map();
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::initGeometry()
    public initGeometry(data: any): void
    {
        if(!data) return;

        this._geometry = new AvatarModelGeometry(data);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarStructure.as::initActions()
    public initActions(data: any, offsets: ReadonlyMap<string, unknown>): void
    {
        if(!data) return;

        this._actionManager = new AvatarActionManager(data, offsets);
        this._defaultAction = this._actionManager.getDefaultAction();
        this._defaultLayAction = this._actionManager.getDefaultLayAction();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarStructure.as::updateActions()
    public updateActions(data: any): void
    {
        if(this._actionManager)
        {
            this._actionManager.updateActions(data);
            this._defaultAction = this._actionManager.getDefaultAction();
            this._defaultLayAction = this._actionManager.getDefaultLayAction();
        }
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::initPartSets()
    public initPartSets(data: any): boolean
    {
        if(!data) return false;

        if(this._partSetsData.parse(data))
        {
            const riDef = this._partSetsData.getPartDefinition('ri');
            const liDef = this._partSetsData.getPartDefinition('li');

            // DEVIATION: Ambreia adds `rib`, the half of a weapon behind the body (geometry: behind).
            const ribDef = this._partSetsData.getPartDefinition('rib');

            if(riDef) riDef.appendToFigure = true;
            if(liDef) liDef.appendToFigure = true;
            if(ribDef) ribDef.appendToFigure = true;

            return true;
        }

        return false;
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::initAnimation()
    public initAnimation(data: any): boolean
    {
        if(!data) return false;

        return this._animationData.parse(data);
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::initFigureData()
    public initFigureData(data: any): boolean
    {
        if(!data) return false;

        return this._figureSetData.parse(data);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarStructure.as::injectFigureData()
    public injectFigureData(data: any): void
    {
        this._figureSetData.injectXML(data);
    }

    /**
     * Probes a library for `"<prefix>0"` .. `"<prefix>N-1"` and registers each animation it finds.
     *
     * Dead in AS3 too — no call site in the primary tree or in `win63_version`. The port's real
     * fx registration (`AvatarRenderManager.registerBuiltInAnimations()`,
     * `EffectAssetDownloadManager.libraryComplete()`) registers per resolved asset and never
     * needs the probe loop. Ported so the member exists with AS3's behaviour, including the
     * blunt "try 200 names" shape.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarStructure.as::registerAnimations()
    public registerAnimations(library: IAssetLibrary, prefix: string = 'fx', count: number = 200): void
    {
        for(let i = 0; i < count; i++)
        {
            const name = prefix + i;

            if(!library.hasAsset(name)) continue;

            this.registerAnimation(library.getAssetByName(name)?.content);
        }
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::registerAnimation()
    public registerAnimation(data: any): void
    {
        this._animationManager.registerAnimation(
            (actionId: string) => this.getActionDefinition(actionId),
            data
        );
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::getPartColor()
    public getPartColor(figure: IAvatarFigureContainer, partType: string, colorIndex: number = 0): IPartColor | null
    {
        const colorIds = figure.getPartColorIds(partType);

        if(!colorIds || colorIds.length <= colorIndex) return null;

        const setType = this._figureSetData.getSetType(partType);

        if(!setType) return null;

        const palette = this._figureSetData.getPalette(setType.paletteID);

        if(!palette) return null;

        return palette.getColor(colorIds[colorIndex]);
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::getBodyPartData()
    public getBodyPartData(animationName: string, frameIndex: number, partId: string): AnimationLayerData | null
    {
        return this._animationManager.getLayerData(animationName, frameIndex, partId);
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::getAnimation()
    public getAnimation(name: string): Animation | null
    {
        return this._animationManager.getAnimation(name) as Animation | null;
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::getActionDefinition()
    public getActionDefinition(id: string): ActionDefinition | null
    {
        if(!this._actionManager) return null;

        return this._actionManager.getActionDefinition(id);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarStructure.as::getDefaultActionDefinition()
    public getDefaultActionDefinition(): ActionDefinition | null
    {
        return this._defaultAction;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarStructure.as::getDefaultLayActionDefinition()
    public getDefaultLayActionDefinition(): ActionDefinition | null
    {
        return this._defaultLayAction;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarStructure.as::getItemIds()
    public getItemIds(): string[]
    {
        if(!this._actionManager) return [];

        const carryItem = this._actionManager.getActionDefinition('CarryItem');

        if(!carryItem) return [];

        return [...carryItem.params.keys()];
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::getActionDefinitionWithState()
    public getActionDefinitionWithState(state: string): ActionDefinition | null
    {
        if(!this._actionManager) return null;

        return this._actionManager.getActionDefinitionWithState(state);
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::isMainAvatarSet()
    public isMainAvatarSet(setId: string): boolean
    {
        if(!this._geometry) return false;

        return this._geometry.isMainAvatarSet(setId);
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::sortActions()
    public sortActions(actions: IActiveActionData[]): IActiveActionData[]
    {
        if(!this._actionManager) return actions;

        return this._actionManager.sortActions(actions);
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::maxFrames()
    public maxFrames(actions: IActiveActionData[]): number
    {
        let max = 0;

        for(const action of actions)
        {
            max = Math.max(max, this._animationData.getFrameCount(action.definition));
        }

        return max;
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::getMandatorySetTypeIds()
    public getMandatorySetTypeIds(gender: string, clubLevel: number): string[]
    {
        if(!this._mandatorySetTypeCache.has(gender))
        {
            this._mandatorySetTypeCache.set(gender, new Map());
        }

        const genderCache = this._mandatorySetTypeCache.get(gender)!;

        if(genderCache.has(clubLevel))
        {
            return genderCache.get(clubLevel)!;
        }

        const result = this._figureSetData.getMandatorySetTypeIds(gender, clubLevel);

        genderCache.set(clubLevel, result);

        return result;
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::getDefaultPartSet()
    public getDefaultPartSet(type: string, gender: string): IFigurePartSet | null
    {
        return this._figureSetData.getDefaultPartSet(type, gender);
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::getCanvasOffsets()
    public getCanvasOffsets(actions: IActiveActionData[], scale: string, direction: number): number[] | null
    {
        if(!this._actionManager) return null;

        return this._actionManager.getCanvasOffsets(actions, scale, direction);
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::getCanvas()
    public getCanvas(scale: string, geometryId: string): AvatarCanvas | null
    {
        if(!this._geometry) return null;

        return this._geometry.getCanvas(scale, geometryId);
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::removeDynamicItems()
    public removeDynamicItems(avatar: IAvatarImage): void
    {
        if(this._geometry) this._geometry.removeDynamicItems(avatar);
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::getActiveBodyPartIds()
    public getActiveBodyPartIds(action: IActiveActionData, avatar: IAvatarImage): string[]
    {
        if(!this._geometry) return [];

        const bodyPartIds: string[] = [];
        const geometryType = action.definition.geometryType;
        let animation: Animation | null;

        if(action.definition.isAnimation)
        {
            const animName = action.definition.state + '.' + action.actionParameter;

            animation = this.getAnimation(animName);

            if(animation)
            {
                const animatedIds = animation.getAnimatedBodyPartIds(0, action.overridingAction);

                // AS3 (AvatarStructure.as:298-308): the body parts an effect *removes*
                // must still be marked active, so setAction() applies the new action to
                // them. Without this, a removed part keeps its stale action (stays visible
                // or unrefreshed).
                for(const removePartId of animation.removeData)
                {
                    const removedBodyPart = this._geometry.getBodyPartOfItem(geometryType, removePartId, avatar);

                    if(removedBodyPart !== null && bodyPartIds.indexOf(removedBodyPart.id) === -1)
                    {
                        bodyPartIds.push(removedBodyPart.id);
                    }
                }

                if(animation.hasAddData())
                {
                    for(const addData of animation.addData)
                    {
                        const bodyPart = this._geometry.getBodyPart(geometryType, addData.align);

                        if(bodyPart)
                        {
                            bodyPart.addPart({
                                id: addData.id,
                                x: 0,
                                y: 0,
                                z: 0,
                                radius: 0.01,
                                nx: 0,
                                ny: 0,
                                nz: -1,
                                double: 1
                            }, avatar);

                            const partDef = this._partSetsData.addPartDefinition({
                                'set-type': addData.id,
                                setType: addData.id
                            });

                            partDef.appendToFigure = true;

                            if(addData.base === '')
                            {
                                partDef.staticId = 1;
                            }

                            if(bodyPartIds.indexOf(bodyPart.id) === -1)
                            {
                                bodyPartIds.push(bodyPart.id);
                            }
                        }
                    }
                }

                for(const partId of animatedIds)
                {
                    const bodyPart = this._geometry.getBodyPart(geometryType, partId);

                    if(bodyPart && bodyPartIds.indexOf(bodyPart.id) === -1)
                    {
                        bodyPartIds.push(bodyPart.id);
                    }
                }
            }
        }
        else
        {
            const activeParts = this._partSetsData.getActiveParts(action.definition);

            for(const partId of activeParts)
            {
                const bodyPart = this._geometry.getBodyPartOfItem(geometryType, partId, avatar);

                if(bodyPart && bodyPartIds.indexOf(bodyPart.id) === -1)
                {
                    bodyPartIds.push(bodyPart.id);
                }
            }
        }

        return bodyPartIds;
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::getBodyPartsUnordered()
    public getBodyPartsUnordered(setId: string): string[]
    {
        if(!this._geometry) return [];

        return this._geometry.getBodyPartIdsInAvatarSet(setId);
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::getBodyParts()
    public getBodyParts(setType: string, geometryType: string, direction: number): string[]
    {
        if(!this._geometry) return [];

        const angle = AvatarDirectionAngle.DIRECTION_ANGLES[direction] || 0;

        return this._geometry.getBodyPartsAtAngle(setType, angle, geometryType);
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::getFrameBodyPartOffset()
    public getFrameBodyPartOffset(action: IActiveActionData, direction: number, frameIndex: number, bodyPartId: string): {
        x: number;
        y: number
    }
    {
        const animAction = this._animationData.getAction(action.definition);

        if(animAction)
        {
            return animAction.getFrameBodyPartOffset(direction, frameIndex, bodyPartId);
        }

        return {x: 0, y: 0};
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::getParts()
    public getParts(
        bodyPartId: string,
        figure: IAvatarFigureContainer,
        action: IActiveActionData,
        geometryType: string,
        direction: number,
        hiddenLayers: string[],
        avatar: IAvatarImage,
        effectParts: Map<string, string> | null = null
    ): AvatarImagePartContainer[] | null
    {
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarStructure.as::getParts()
        // AS3 returns null here, not an empty array - AvatarImageCache.ts's `if(!partList) return
        // null` guard relied on that: an empty array is truthy in JS/TS, so it never tripped while
        // this returned [].
        if(!action || !this._geometry) return null;

        const activeParts = this._partSetsData.getActiveParts(action.definition);
        let defaultFrames: number[] = [0];

        const animAction = this._animationData.getAction(action.definition);
        let animation: Animation | null = null;

        if(action.definition.isAnimation)
        {
            const animName = action.definition.state + '.' + action.actionParameter;

            animation = this.getAnimation(animName);

            if(animation)
            {
                defaultFrames = this.getPopulatedArray(animation.frameCount(action.overridingAction));

                for(const partId of animation.getAnimatedBodyPartIds(0, action.overridingAction))
                {
                    if(partId === bodyPartId)
                    {
                        const geomBodyPart = this._geometry.getBodyPart(geometryType, partId);

                        if(geomBodyPart)
                        {
                            for(const dynamicPart of geomBodyPart.getDynamicParts(avatar))
                            {
                                activeParts.push(dynamicPart.id);
                            }
                        }
                    }
                }
            }
        }

        const geometryParts = this._geometry.getParts(geometryType, bodyPartId, direction, activeParts, avatar);
        const figurePartTypes = figure.getPartTypeIds();

        // Build containers from figure parts
        const figureContainers: { partType: string; container: AvatarImagePartContainer }[] = [];

        // AS3 (AvatarStructure.as:407) declares this at method scope, so it *leaks*
        // across parts: a part whose colorLayerIndex exceeds the figure's colour count
        // keeps the previous part's colour instead of resetting to null. Verified against
        // both the 2026 (:407) and 2016 decompiles — neither resets per iteration — so the
        // leak is real in the compiled client. Following the source (per the fidelity rule).
        let color: IPartColor | null = null;

        for(const partType of figurePartTypes)
        {
            if(effectParts && effectParts.has(partType)) continue;

            const partSetId = figure.getPartSetId(partType);
            const colorIds = figure.getPartColorIds(partType);
            const setType = this._figureSetData.getSetType(partType);

            if(!setType) continue;

            const palette = this._figureSetData.getPalette(setType.paletteID);

            if(!palette) continue;

            const partSet = setType.getPartSet(partSetId);

            if(!partSet) continue;

            hiddenLayers.push(...partSet.hiddenLayers);

            for(const part of partSet.parts)
            {
                if(geometryParts.indexOf(part.type) > -1)
                {
                    let frames: any[] = defaultFrames;

                    if(animAction)
                    {
                        const actionPart = animAction.getPart(part.type);

                        if(actionPart) frames = actionPart.frames;
                    }

                    let actionDef = action.definition;

                    if(activeParts.indexOf(part.type) === -1)
                    {
                        actionDef = action.definition.geometryType === 'horizontal' && this._defaultLayAction !== null
                            ? this._defaultLayAction
                            : this._defaultAction!;
                    }

                    const partDef = this._partSetsData.getPartDefinition(part.type);
                    let flippedType = partDef ? partDef.flippedSetType : part.type;

                    if(!flippedType) flippedType = part.type;

                    if(colorIds && colorIds.length > part.colorLayerIndex - 1)
                    {
                        color = palette.getColor(colorIds[part.colorLayerIndex - 1]);
                    }

                    const isColorable = part.colorLayerIndex > 0;

                    const container = new AvatarImagePartContainer(
                        bodyPartId, part.type, part.id.toString(), color,
                        frames, actionDef, isColorable, part.paletteMap, flippedType
                    );

                    figureContainers.push({partType: part.type, container});
                }
            }
        }

        // Order containers by geometry part order
        const result: AvatarImagePartContainer[] = [];

        for(const partType of geometryParts)
        {
            let found = false;

            for(const entry of figureContainers)
            {
                if(entry.partType === partType)
                {
                    if(hiddenLayers.indexOf(partType) === -1)
                    {
                        result.push(entry.container);
                    }

                    found = true;
                }
            }

            if(!found)
            {
                // Handle effect parts and appended figure parts
                if(effectParts && effectParts.has(partType))
                {
                    const effectPartId = effectParts.get(partType)!;
                    let frames: any[] = defaultFrames;

                    if(animAction)
                    {
                        const actionPart = animAction.getPart(partType);

                        if(actionPart) frames = actionPart.frames;
                    }

                    const container = new AvatarImagePartContainer(
                        bodyPartId, partType, effectPartId, null,
                        frames, action.definition, false, -1, partType, false, 1
                    );

                    result.push(container);
                }
                else if(activeParts.indexOf(partType) > -1)
                {
                    const geomBodyPart = this._geometry.getBodyPartOfItem(geometryType, partType, avatar);

                    if(geomBodyPart && bodyPartId === geomBodyPart.id)
                    {
                        const partDef = this._partSetsData.getPartDefinition(partType);

                        if(partDef && partDef.appendToFigure)
                        {
                            let partId = '1';

                            if(action.actionParameter !== '') partId = action.actionParameter;
                            if(partDef.hasStaticId()) partId = partDef.staticId.toString();

                            let isBlendable = false;
                            let blend = 1;

                            if(animation)
                            {
                                const addData = animation.getAddData(partType);

                                if(addData)
                                {
                                    isBlendable = addData.isBlended;
                                    blend = addData.blend;
                                }
                            }

                            let frames: any[] = defaultFrames;

                            if(animAction)
                            {
                                const actionPart = animAction.getPart(partType);

                                if(actionPart) frames = actionPart.frames;
                            }

                            const container = new AvatarImagePartContainer(
                                bodyPartId, partType, partId, null,
                                frames, action.definition, false, -1, partType, isBlendable, blend
                            );

                            result.push(container);
                        }
                    }
                }
            }
        }

        return result;
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::dispose()
    public dispose(): void
    {
        this._geometry = null;
        this._actionManager = null;
        this._defaultAction = null;
        this._defaultLayAction = null;
        this._mandatorySetTypeCache.clear();
    }

    // DEVIATION: Flash-only debug visualisation — it draws each body part as a labelled circle
    //   into a `BitmapData` attached to a `flash.display.Stage`, through `Shape`, `TextField` and
    //   `Matrix`. There is no stage to attach to here. It is also dead in AS3: `grep -rn
    //   displayGeometry sources/` finds only this declaration, so it is development leftovers, not
    //   a feature. Carried a TODO marker until 2026-09-05; reclassified, since nothing is owed.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarStructure.as::displayGeometry()

    // AS3: .../src/com/sulake/habbo/avatar/AvatarStructure.as::getPopulatedArray()
    private getPopulatedArray(count: number): number[]
    {
        const result: number[] = [];

        for(let i = 0; i < count; i++)
        {
            result.push(i);
        }

        return result;
    }
}
