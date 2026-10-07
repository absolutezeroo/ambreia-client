/**
 * AnimatedPetVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.pet.AnimatedPetVisualization
 *
 * Extends AnimatedFurnitureVisualization for pet-specific rendering.
 * Supports posture/gesture-based animations, independent head direction,
 * custom pet parts with palette swapping, saddle visibility,
 * head-only mode, and experience bubble display.
 *
 * STUB - Core structure and key overrides defined. Complex pet-specific
 * rendering to be completed when pet system is implemented.
 */
import {Texture} from 'pixi.js';
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {IRoomObjectVisualizationData} from '../../object/visualization/IRoomObjectVisualizationData';
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';
import {AnimationStateData} from '../../scene/object/visualization/data/AnimationStateData';
import type {AnimationFrame} from '../../scene/object/visualization/data/AnimationFrame';
import {AnimatedFurnitureVisualization} from '../../furniture/visualization/AnimatedFurnitureVisualization';
import {FurnitureVisualizationData} from '../../furniture/visualization/FurnitureVisualizationData';
import {AnimatedPetVisualizationData} from './AnimatedPetVisualizationData';

/**
 * Experience bubble data for displaying gained XP above the pet.
 */
class ExperienceData
{
    private _experience: number = 0;

    constructor(image: HTMLCanvasElement | null)
    {
        this._image = image;
    }

    private _image: HTMLCanvasElement | null;

    get image(): HTMLCanvasElement | null
    {
        return this._image;
    }

    private _alpha: number = 0;

    get alpha(): number
    {
        return this._alpha;
    }

    set alpha(value: number)
    {
        this._alpha = value;
    }

    setExperience(value: number): void
    {
        this._experience = value;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::dispose()
    dispose(): void
    {
        this._image = null;
    }
}

export class AnimatedPetVisualization extends AnimatedFurnitureVisualization
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::POSTURE_ANIMATION_INDEX
    private static readonly POSTURE_ANIMATION_INDEX: number = 0;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::GESTURE_ANIMATION_INDEX
    private static readonly GESTURE_ANIMATION_INDEX: number = 1;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::EXPERIENCE_BUBBLE_VISIBLE_IN_MS
    private static readonly EXPERIENCE_BUBBLE_VISIBLE_IN_MS: number = 1000;

    // AS3 initialises both to "" and relies on the *model* returning null for an unset
    // figure_posture/figure_gesture, so its first validateActions() pass sees `null != ""` and runs
    // both setAnimationForIndex() calls. This port's IRoomObjectModel.getString() is typed `string`
    // and hands back "" for a missing key, so that comparison could never fire and neither
    // animation state was ever assigned - both kept the default animation 0, and since
    // getSpriteXOffset()/getSpriteYOffset() sum the frames of every state, each layer's offset was
    // applied twice (head and tail visibly detached).
    //
    // Initialising the fields to null instead restores the exact same first-pass behaviour ('' !==
    // null) without changing getString()'s signature across the whole engine.
    private _posture: string | null = null;
    private _gesture: string | null = null;
    private _isSleeping: boolean = false;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::_headDirection
    private _headDirection: number = 0;
    private _experienceData: ExperienceData | null = null;
    private _experienceTimestamp: number = 0;
    private _gainedExperience: number = 0;
    private _petData: AnimatedPetVisualizationData | null = null;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::_paletteName
    private _paletteName: string = '';
    private _paletteIndex: number = -1;
    private _customLayerIds: number[] = [];
    private _customPartIds: number[] = [];
    private _customPaletteIds: number[] = [];
    private _petColor: number = 0xFFFFFF;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::_headOnly
    private _headOnly: boolean = false;
    private _isRiding: boolean = false;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::_animationStates
    private _animationStates: AnimationStateData[] = [];
    private _allAnimationsOver: boolean = false;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::_headSprites
    private _headSprites: (boolean | null)[] = [];
    // AS3: .../src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::_nonHeadSprites
    private _nonHeadSprites: (boolean | null)[] = [];
    // AS3: .../src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::_saddleSprites
    private _saddleSprites: (boolean | null)[] = [];
    private _lastDirectionX: number = -1;

    constructor()
    {
        super();

        // Create animation state data for posture and gesture
        while(this._animationStates.length < 2)
        {
            this._animationStates.push(new AnimationStateData());
        }
    }

    override initialize(data: IRoomObjectVisualizationData): boolean
    {
        if(!(data instanceof AnimatedPetVisualizationData))
        {
            return false;
        }

        this._petData = data;

        // The bubble's artwork comes out of the pet library's common assets, not its own — every
        // pet shares one. AS3 clones the BitmapData because Flash's is mutable; nothing here
        // takes ownership of the canvas, so the library's own is used.
        // AS3: .../src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::initialize()
        const asset = data.commonAssets?.getAssetByName('pet_experience_bubble') ?? null;
        const image = (asset?.content as HTMLCanvasElement | null) ?? null;

        if(image !== null) this._experienceData = new ExperienceData(image);

        return super.initialize(data);
    }

    override update(geometry: IRoomGeometry, time: number, update: boolean, skipUpdate: boolean): void
    {
        super.update(geometry, time, update, skipUpdate);
        this.updateExperienceBubble(time);
    }

    override dispose(): void
    {
        super.dispose();

        for(const state of this._animationStates)
        {
            if(state !== null)
            {
                state.dispose();
            }
        }

        this._animationStates = [];

        if(this._experienceData !== null)
        {
            this._experienceData.dispose();
            this._experienceData = null;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::getAnimationId()
    // Furniture has one animation, so the base ignores the state it is handed and answers with the
    // visualization's own shared `animationId`. A pet runs two states at once (posture + gesture),
    // so each must answer with *its own* id.
    //
    // Without this override both states resolved to the same shared animation and produced
    // identical frames - and since getSpriteXOffset()/getSpriteYOffset() sum the frames of every
    // state, every layer's offset was applied exactly twice (head and tail visibly detached).
    protected override getAnimationId(stateData: AnimationStateData): number
    {
        return stateData.animationId;
    }

    protected override updateAnimation(scale: number): number
    {
        const roomObject = this.object;

        if(roomObject !== null)
        {
            const dirX = Math.floor(roomObject.getDirection().x);

            if(dirX !== this._lastDirectionX)
            {
                this._lastDirectionX = dirX;
                this.resetAllAnimationFrames();
            }
        }

        return super.updateAnimation(scale);
    }

    protected override updateModel(_scale: number): boolean
    {
        const roomObject = this.object;

        if(roomObject === null) return false;

        const model = roomObject.getModel();

        if(model === null) return false;

        if(model.getUpdateID() !== this._updateModelCounter)
        {
            // Do NOT coerce these to '': AS3 reads them straight off the model and compares against
            // fields initialised to "". The catalog preview never sets figure_posture/figure_gesture
            // (getPetImage passes no posture), so AS3 sees null, `null != ""` is true, and it
            // therefore *does* run both setAnimationForIndex() calls on the first pass - animation 0
            // for the posture, -1 for the gesture, which leaves the gesture state empty.
            //
            // With `?? ''` the comparison became '' !== '' - false - so neither state was ever set
            // and both kept their default animation 0. getSpriteXOffset()/getSpriteYOffset() sum the
            // frames of *every* state (faithfully to AS3), so each layer's offset was applied twice:
            // the head and tail rendered at double their intended displacement.
            const posture = model.getString('figure_posture');
            const gesture = model.getString('figure_gesture');

            this.validateActions(posture, gesture);

            this._isSleeping = model.getNumber('figure_sleep') > 0;

            const headDir = model.getNumber('head_direction');

            if(!isNaN(headDir) && this._petData !== null && this._petData.isAllowedToTurnHead)
            {
                this._headDirection = headDir;
            }
            else
            {
                this._headDirection = roomObject.getDirection().x;
            }

            this._experienceTimestamp = model.getNumber('figure_experience_timestamp');
            this._gainedExperience = model.getNumber('figure_gained_experience');

            const paletteIndex = Math.floor(model.getNumber('pet_palette_index'));

            if(paletteIndex !== this._paletteIndex)
            {
                this._paletteIndex = paletteIndex;
                this._paletteName = String(this._paletteIndex);
            }

            const customLayers = model.getNumberArray('pet_custom_layer_ids');
            const customParts = model.getNumberArray('pet_custom_part_ids');
            const customPalettes = model.getNumberArray('pet_custom_palette_ids');

            this._customLayerIds = customLayers !== null ? [...customLayers] : [];
            this._customPartIds = customParts !== null ? [...customParts] : [];
            this._customPaletteIds = customPalettes !== null ? [...customPalettes] : [];

            const isRiding = Math.floor(model.getNumber('pet_is_riding'));
            this._isRiding = !isNaN(isRiding) && isRiding > 0;

            const petColor = model.getNumber('pet_color');

            if(!isNaN(petColor) && petColor !== this._petColor)
            {
                this._petColor = petColor;
            }

            this._headOnly = model.getNumber('pet_head_only') > 0;

            this._updateModelCounter = model.getUpdateID();
            return true;
        }

        return false;
    }

    protected override setAnimation(_animationId: number): void
    {
        // Pet visualization uses posture/gesture system instead of direct animation IDs
    }

    protected override resetAllAnimationFrames(): void
    {
        this._allAnimationsOver = false;

        for(let i = this._animationStates.length - 1; i >= 0; i--)
        {
            const state = this._animationStates[i];

            if(state !== null)
            {
                state.setLayerCount(this.animatedLayerCount);
            }
        }
    }

    protected override updateAnimations(scale: number): number
    {
        if(this._allAnimationsOver) return 0;

        let allOver = true;
        let result = 0;

        for(let i = 0; i < this._animationStates.length; i++)
        {
            const state = this._animationStates[i];

            if(state !== null && !state.animationOver)
            {
                const layerResult = this.updateFramesForAnimation(state, scale);
                result |= layerResult;

                if(!state.animationOver)
                {
                    allOver = false;
                }
            }
        }

        this._allAnimationsOver = allOver;
        return result;
    }

    protected override getFrameNumber(scale: number, layerIndex: number): number
    {
        for(let i = this._animationStates.length - 1; i >= 0; i--)
        {
            const state = this._animationStates[i];

            if(state !== null)
            {
                const frame: AnimationFrame | null = state.getFrame(layerIndex);

                if(frame !== null)
                {
                    return frame.id;
                }
            }
        }

        return super.getFrameNumber(scale, layerIndex);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::getAsset()
    // A pet's sprites are palette-swapped: the base library is greyscale and the colour comes from
    // the palette named by pet_palette_index. This override was missing entirely, so pets fell
    // through to FurnitureVisualization.getAsset(), which calls getAsset() without a palette and
    // therefore rendered every pet uncoloured.
    //
    // A layer listed in pet_custom_layer_ids additionally carries its own part id (appended to the
    // asset name) and may override the palette with its own.
    protected override getAsset(name: string, layerIndex: number = -1): IGraphicAsset | null
    {
        if(this.assetCollection === null) return null;

        let paletteName = this._paletteName;
        let partId = -1;

        const customIndex = this._customLayerIds.indexOf(layerIndex);

        if(customIndex > -1)
        {
            partId = this._customPartIds[customIndex] ?? -1;

            const customPaletteId = this._customPaletteIds[customIndex] ?? -1;

            paletteName = customPaletteId > -1 ? String(customPaletteId) : this._paletteName;
        }

        if(partId > -1) name += '_' + partId;

        // for the real library (the first calls land on the place-holder object).

        return this.assetCollection.getAssetWithPalette(name, paletteName);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::getDirection()
    // A pet's head turns independently of its body, so head sprites resolve their own direction.
    // Without this the head was built with the body's direction and landed in the wrong place.
    private getDirection(scale: number, layerIndex: number): number
    {
        if(this.isHeadSprite(layerIndex) && this._petData !== null)
        {
            return this._petData.getDirectionValue(scale, this._headDirection);
        }

        return this.direction;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::isHeadSprite()
    private isHeadSprite(layerIndex: number): boolean
    {
        if(this._headSprites[layerIndex] == null)
        {
            const tag = this._petData !== null ? this._petData.getTag(this._resolvedSize, -1, layerIndex) : '';

            this._headSprites[layerIndex] = tag === 'head' || tag === 'hair';
        }

        return this._headSprites[layerIndex] === true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::isNonHeadSprite()
    private isNonHeadSprite(layerIndex: number): boolean
    {
        if(this._nonHeadSprites[layerIndex] == null)
        {
            if(layerIndex < this.spriteCount - 2)
            {
                const tag = this._petData !== null ? this._petData.getTag(this._resolvedSize, -1, layerIndex) : '';

                this._nonHeadSprites[layerIndex] = tag != null && tag.length > 0 && tag !== 'head' && tag !== 'hair';
            }
            else
            {
                this._nonHeadSprites[layerIndex] = true;
            }
        }

        return this._nonHeadSprites[layerIndex] === true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::isSaddleSprite()
    private isSaddleSprite(layerIndex: number): boolean
    {
        if(this._saddleSprites[layerIndex] == null)
        {
            const tag = this._petData !== null ? this._petData.getTag(this._resolvedSize, -1, layerIndex) : '';

            this._saddleSprites[layerIndex] = tag === 'saddle';
        }

        return this._saddleSprites[layerIndex] === true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::getSpriteZOffset()
    protected override getSpriteZOffset(scale: number, _direction: number, layerIndex: number): number
    {
        if(this._petData === null) return 0;

        return this._petData.getZOffset(scale, this.getDirection(scale, layerIndex), layerIndex);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::getSpriteAssetName()
    // Differs from the furniture base in three ways: head sprites use their own direction, the
    // second-to-last layer is always the shadow ("sd", frame 0), and the last layer has no asset.
    // Note AS3 passes the resolved *size* to getFrameNumber(), not the scale.
    protected override getSpriteAssetName(scale: number, layerIndex: number): string
    {
        // the object is still alive (getGenericRoomObjectImage disposes it right after rendering).

        if(this._headOnly && this.isNonHeadSprite(layerIndex)) return '';

        if(this._isRiding && this.isSaddleSprite(layerIndex)) return '';

        const count = this.spriteCount;

        if(layerIndex >= count - 1) return '';

        const size = this.getSize(scale);

        if(layerIndex < count - 2)
        {
            if(layerIndex >= FurnitureVisualizationData.LAYER_NAMES.length) return '';

            const layerName = FurnitureVisualizationData.LAYER_NAMES[layerIndex];

            if(size === 1) return `${this.type}_icon_${layerName}`;

            return `${this.type}_${size}_${layerName}_${this.getDirection(scale, layerIndex)}_${this.getFrameNumber(size, layerIndex)}`;
        }

        return `${this.type}_${size}_sd_${this.getDirection(scale, layerIndex)}_0`;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::getSpriteColor()
    // The pet's user-picked colour tints every sprite except the last one, which stays white.
    // Without this override _petColor was read off the model and then never applied to anything,
    // so every pet rendered in its palette's own colours and ignored the colour selection.
    protected override getSpriteColor(_scale: number, layerIndex: number, _colorId: number): number
    {
        if(layerIndex < this.spriteCount - 1) return this._petColor;

        return 0xFFFFFF;
    }

    protected override getSpriteXOffset(scale: number, direction: number, layerIndex: number): number
    {
        let offset = super.getSpriteXOffset(scale, direction, layerIndex);

        for(let i = this._animationStates.length - 1; i >= 0; i--)
        {
            const state = this._animationStates[i];

            if(state !== null)
            {
                const frame = state.getFrame(layerIndex);

                if(frame !== null)
                {
                    offset += frame.x;
                }
            }
        }

        return offset;
    }

    protected override getSpriteYOffset(scale: number, direction: number, layerIndex: number): number
    {
        let offset = super.getSpriteYOffset(scale, direction, layerIndex);

        for(let i = this._animationStates.length - 1; i >= 0; i--)
        {
            const state = this._animationStates[i];

            if(state !== null)
            {
                const frame = state.getFrame(layerIndex);

                if(frame !== null)
                {
                    offset += frame.y;
                }
            }
        }

        return offset;
    }

    protected override updateLayerCount(count: number, scale: number): void
    {
        super.updateLayerCount(count, scale);
        this._headSprites = [];
    }

    protected override getAdditionalSpriteCount(scale: number): number
    {
        return super.getAdditionalSpriteCount(scale) + 1;
    }

    /**
	 * Validate and update posture/gesture actions.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::validateActions()
    // This was a stub, and it is what fed everything else: with no animation ever set, the
    // animation states stayed empty, so getFrameNumber() fell back to 0 (wrong asset names for the
    // layers that need a real frame) and getSpriteXOffset()/getSpriteYOffset() added no frame
    // offsets at all - which is why the head and tail sat detached from the body.
    private validateActions(posture: string | null, gesture: string | null): void
    {
        if(this._petData === null) return;

        let resolvedGesture: string | null = gesture;

        if(posture !== this._posture)
        {
            this._posture = posture;

            this.setAnimationForIndex(
                AnimatedPetVisualization.POSTURE_ANIMATION_INDEX,
                this._petData.getAnimationForPosture(this._resolvedSize, posture ?? '')
            );
        }

        // AS3 nulls the gesture out when the current posture disables gestures - note it tests the
        // *posture*, not the gesture.
        // library, whose own (1-posture) data would otherwise be what gets reported.

        if(this._petData.getGestureDisabled(this._resolvedSize, posture ?? '')) resolvedGesture = null;

        if(resolvedGesture !== this._gesture)
        {
            this._gesture = resolvedGesture;

            this.setAnimationForIndex(
                AnimatedPetVisualization.GESTURE_ANIMATION_INDEX,
                this._petData.getAnimationForGesture(this._resolvedSize, resolvedGesture ?? '')
            );
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::getAnimationStateData()
    private getAnimationStateData(index: number): AnimationStateData | null
    {
        return this._animationStates[index] ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::setAnimationForIndex()
    private setAnimationForIndex(index: number, animationId: number): void
    {
        const stateData = this.getAnimationStateData(index);

        if(stateData === null) return;

        if(this.setSubAnimation(stateData, animationId)) this._allAnimationsOver = false;
    }

    /**
	 * Update the experience bubble display.
	 */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualization.as::updateExperienceBubble()
    private updateExperienceBubble(time: number): void
    {
        if(this._experienceData === null) return;

        this._experienceData.alpha = 0;

        if(this._experienceTimestamp > 0)
        {
            const elapsed = time - this._experienceTimestamp;

            if(elapsed < AnimatedPetVisualization.EXPERIENCE_BUBBLE_VISIBLE_IN_MS)
            {
                this._experienceData.alpha = Math.sin(elapsed / AnimatedPetVisualization.EXPERIENCE_BUBBLE_VISIBLE_IN_MS * Math.PI) * 255;
                this._experienceData.setExperience(this._gainedExperience);
            }
            else
            {
                this._experienceTimestamp = 0;
            }

            const sprite = this.getSprite(this.spriteCount - 1);

            if(sprite !== null)
            {
                if(this._experienceData.alpha > 0)
                {
                    const img = this._experienceData.image;
                    sprite.texture = img !== null ? Texture.from(img) : null;
                    sprite.offsetX = -20;
                    sprite.offsetY = -80;
                    sprite.alpha = this._experienceData.alpha;
                    sprite.visible = true;
                }
                else
                {
                    sprite.texture = null;
                    sprite.visible = false;
                }
            }
        }
    }
}
