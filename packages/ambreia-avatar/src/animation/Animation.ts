import type {IActionDefinition} from '../actions/IActionDefinition';
import type {IAnimation} from './IAnimation';
import type {ISpriteDataContainer} from './ISpriteDataContainer';
import {AddDataContainer} from './AddDataContainer';
import {AnimationLayerData} from './AnimationLayerData';
import {AvatarDataContainer} from './AvatarDataContainer';
import {DirectionDataContainer} from './DirectionDataContainer';
import {SpriteDataContainer} from './SpriteDataContainer';

/**
 * Callback type for resolving action definitions during animation parsing.
 */
export type ActionDefinitionResolver = (actionId: string) => IActionDefinition | null;

/**
 * Represents a complete avatar animation with frames, sprites, and effects.
 *
 * @see sources/win63_version/habbo/avatar/animation/Animation.as
 */
export class Animation implements IAnimation
{
    private static readonly EMPTY_ARRAY: any[] = [];
    private _description: string;
    private _frames: AnimationLayerData[][] = [];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::_overriddenActions
    private _overriddenActions: Map<string, string> | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::_overrideFrames
    private _overrideFrames: Map<string, AnimationLayerData[][]> | null = null;

    constructor(actionResolver: ActionDefinitionResolver, data: any)
    {
        this._id = String(data.name || '');
        this._description = data.desc ? String(data.desc) : this._id;
        this._resetOnToggle = Boolean(data.resetOnToggle);

        if(data.sprites)
        {
            this._spriteData = [];

            for(const spriteData of data.sprites)
            {
                this._spriteData.push(new SpriteDataContainer(this, spriteData));
            }
        }

        if(data.avatars && data.avatars.length > 0)
        {
            this._avatarData = new AvatarDataContainer(data.avatars[0]);
        }

        if(data.directions && data.directions.length > 0)
        {
            this._directionData = new DirectionDataContainer(data.directions[0]);
        }

        if(data.removes)
        {
            this._removeData = [];

            for(const removeItem of data.removes)
            {
                this._removeData.push(String(removeItem.id));
            }
        }

        if(data.adds)
        {
            this._addData = [];

            for(const addItem of data.adds)
            {
                this._addData.push(new AddDataContainer(addItem));
            }
        }

        if(data.overrides)
        {
            this._overrideFrames = new Map();
            this._overriddenActions = new Map();

            for(const overrideData of data.overrides)
            {
                const name = String(overrideData.name);
                const overrideName = String(overrideData.override);

                this._overriddenActions.set(overrideName, name);

                const frames: AnimationLayerData[][] = [];

                this.parseFrames(frames, overrideData.frames || [], actionResolver);
                this._overrideFrames.set(name, frames);
            }
        }

        this.parseFrames(this._frames, data.frames || [], actionResolver);
    }

    private _id: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::get id()
    public get id(): string
    {
        return this._id;
    }

    private _spriteData: ISpriteDataContainer[] | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::get spriteData()
    public get spriteData(): ISpriteDataContainer[]
    {
        return this._spriteData || [];
    }

    private _avatarData: AvatarDataContainer | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::get avatarData()
    public get avatarData(): AvatarDataContainer | null
    {
        return this._avatarData;
    }

    private _directionData: DirectionDataContainer | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::get directionData()
    public get directionData(): DirectionDataContainer | null
    {
        return this._directionData;
    }

    private _removeData: string[] | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::get removeData()
    public get removeData(): string[]
    {
        return this._removeData || Animation.EMPTY_ARRAY;
    }

    private _addData: AddDataContainer[] | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::get addData()
    public get addData(): AddDataContainer[]
    {
        return this._addData || Animation.EMPTY_ARRAY as AddDataContainer[];
    }

    private _resetOnToggle: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::get resetOnToggle()
    public get resetOnToggle(): boolean
    {
        return this._resetOnToggle;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::frameCount()
    public frameCount(overrideAction: string | null = null): number
    {
        if(!overrideAction) return this._frames.length;

        if(this._overrideFrames)
        {
            const frames = this._overrideFrames.get(overrideAction);

            if(frames) return frames.length;
        }

        return 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::hasOverriddenActions()
    public hasOverriddenActions(): boolean
    {
        if(!this._overriddenActions) return false;

        return this._overriddenActions.size > 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::overriddenActionNames()
    public overriddenActionNames(): string[] | null
    {
        if(!this._overriddenActions) return null;

        return [...this._overriddenActions.keys()];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::overridingAction()
    public overridingAction(name: string): string | null
    {
        if(!this._overriddenActions) return null;

        return this._overriddenActions.get(name) || null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::getAnimatedBodyPartIds()
    public getAnimatedBodyPartIds(frameIndex: number, overrideAction: string | null = null): string[]
    {
        const ids: string[] = [];

        for(const layerData of this.getFrame(frameIndex, overrideAction))
        {
            if(layerData.type === AnimationLayerData.BODYPART)
            {
                ids.push(layerData.id);
            }
            else if(layerData.type === AnimationLayerData.FX && this._addData)
            {
                for(const addData of this._addData)
                {
                    if(addData.id === layerData.id)
                    {
                        ids.push(addData.align);
                    }
                }
            }
        }

        return ids;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::getLayerData()
    public getLayerData(frameIndex: number, partId: string, overrideAction: string | null = null): AnimationLayerData | null
    {
        for(const layerData of this.getFrame(frameIndex, overrideAction))
        {
            if(layerData.id === partId) return layerData;

            if(layerData.type === AnimationLayerData.FX && this._addData)
            {
                for(const addData of this._addData)
                {
                    if(addData.align === partId && addData.id === layerData.id)
                    {
                        return layerData;
                    }
                }
            }
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::getAddData()
    public getAddData(id: string): AddDataContainer | null
    {
        if(this._addData)
        {
            for(const addData of this._addData)
            {
                if(addData.id === id) return addData;
            }
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::hasAvatarData()
    public hasAvatarData(): boolean
    {
        return this._avatarData != null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::hasDirectionData()
    public hasDirectionData(): boolean
    {
        return this._directionData != null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::hasAddData()
    public hasAddData(): boolean
    {
        return this._addData != null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::toString()
    public toString(): string
    {
        return this._description;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::parseFrames()
    private parseFrames(target: AnimationLayerData[][], framesData: any[], actionResolver: ActionDefinitionResolver): void
    {
        for(const frameData of framesData)
        {
            let repeats = 1;

            if(frameData.repeats && frameData.repeats > 1)
            {
                repeats = parseInt(frameData.repeats);
            }

            for(let i = 0; i < repeats; i++)
            {
                const layerDataList: AnimationLayerData[] = [];

                if(frameData.bodyparts)
                {
                    for(const bpData of frameData.bodyparts)
                    {
                        const actionDef = actionResolver(String(bpData.action || ''));

                        layerDataList.push(new AnimationLayerData(bpData, AnimationLayerData.BODYPART, actionDef));
                    }
                }

                if(frameData.fxs)
                {
                    for(const fxData of frameData.fxs)
                    {
                        const actionDef = actionResolver(String(fxData.action || ''));

                        layerDataList.push(new AnimationLayerData(fxData, AnimationLayerData.FX, actionDef));
                    }
                }

                target.push(layerDataList);
            }
        }
    }

    /**
     * One frame's layers, or none.
     *
     * **`index` can be negative.** `AvatarImageCache.getImageContainer()` asks for
     * `frameCounter - action.startFrame`, and an action whose `startFrame` was recorded before the
     * counter was reset is ahead of it. `index % length` is then negative, and a negative array
     * index is `undefined` in both languages — the difference is what each does next: AS3's
     * `for each` over `undefined` iterates nothing and the part simply gets no layer data, while a
     * TypeScript `for...of` throws `is not a function or its return value is not iterable`, from
     * inside the room's render loop, every frame. That is the same for-each-on-null trap this port
     * has hit before; the tolerance has to be written out rather than inherited.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/Animation.as::getFrame()
    private getFrame(index: number, overrideAction: string | null = null): AnimationLayerData[]
    {
        if(!overrideAction)
        {
            if(this._frames.length > 0)
            {
                return this._frames[index % this._frames.length] ?? Animation.EMPTY_ARRAY;
            }
        }
        else if(this._overrideFrames)
        {
            const frames = this._overrideFrames.get(overrideAction);

            if(frames && frames.length > 0)
            {
                return frames[index % frames.length] ?? Animation.EMPTY_ARRAY;
            }
        }

        return [];
    }
}
