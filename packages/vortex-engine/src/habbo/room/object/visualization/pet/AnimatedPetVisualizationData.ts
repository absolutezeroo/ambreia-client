/**
 * AnimatedPetVisualizationData
 *
 * Extends AnimatedFurnitureVisualizationData with pet-specific posture/gesture animation tables,
 * held per scale in PetAnimationSizeData.
 *
 * AS3 parses these from the visualization XML; this port receives the same data already decoded
 * from the .nitro bundle, so the element handlers take decoded objects instead of XML nodes.
 *
  * `getZOffset()`/`getDirectionValue()`/`getTag()` are inherited, not overridden here — see the
 * note at the bottom of this class for what the three stub overrides that used to sit there did
 * to every pet sprite lookup.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualizationData.as
 */
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {SizeData} from '../data/SizeData';
import {AnimationSizeData} from '../data/AnimationSizeData';
import {AnimatedFurnitureVisualizationData} from '../furniture/AnimatedFurnitureVisualizationData';
import {PetAnimationSizeData} from './PetAnimationSizeData';

export class AnimatedPetVisualizationData extends AnimatedFurnitureVisualizationData
{
    private _allowHeadTurn: boolean = true;

    private _commonAssets: IAssetLibrary | null = null;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualizationData.as::get commonAssets()
    get commonAssets(): IAssetLibrary | null
    {
        return this._commonAssets;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualizationData.as::set commonAssets()
    set commonAssets(value: IAssetLibrary | null)
    {
        this._commonAssets = value;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualizationData.as::get isAllowedToTurnHead()
    get isAllowedToTurnHead(): boolean
    {
        return this._allowHeadTurn;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualizationData.as::defineVisualizations()
    // AS3 reads `graphics.@disableheadturn` off the visualization XML; the decoded bundle carries
    // the same attribute as a plain key on the `graphics` node. Absent means head turning is
    // allowed, and only the exact string "1" switches it off.
    protected override defineVisualizations(data: Record<string, unknown>): boolean
    {
        const graphics = data['graphics'];

        if(graphics !== null && typeof graphics === 'object')
        {
            const value = (graphics as Record<string, unknown>)['disableheadturn'];

            this._allowHeadTurn = value === undefined ? true : String(value) !== '1';
        }
        else
        {
            this._allowHeadTurn = true;
        }

        return super.defineVisualizations(data);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualizationData.as::getAnimationForPosture()
    getAnimationForPosture(scale: number, posture: string): number
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData instanceof PetAnimationSizeData) return sizeData.getAnimationForPosture(posture);

        return -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualizationData.as::getGestureDisabled()
    getGestureDisabled(scale: number, posture: string): boolean
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData instanceof PetAnimationSizeData) return sizeData.getGestureDisabled(posture);

        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualizationData.as::getAnimationForGesture()
    getAnimationForGesture(scale: number, gesture: string): number
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData instanceof PetAnimationSizeData) return sizeData.getAnimationForGesture(gesture);

        return -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualizationData.as::getPostureForAnimation()
    getPostureForAnimation(scale: number, animationIndex: number, useDefault: boolean): string | null
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData instanceof PetAnimationSizeData) return sizeData.getPostureForAnimation(animationIndex, useDefault);

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualizationData.as::getGestureForAnimation()
    getGestureForAnimation(scale: number, animationIndex: number): string | null
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData instanceof PetAnimationSizeData) return sizeData.getGestureForAnimation(animationIndex);

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualizationData.as::getGestureForAnimationId()
    getGestureForAnimationId(scale: number, animationId: number): string | null
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData instanceof PetAnimationSizeData) return sizeData.getGestureForAnimationId(animationId);

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualizationData.as::getPostureCount()
    getPostureCount(scale: number): number
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData instanceof PetAnimationSizeData) return sizeData.getPostureCount();

        return 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualizationData.as::getGestureCount()
    getGestureCount(scale: number): number
    {
        const sizeData = this.getSizeData(scale);

        if(sizeData instanceof PetAnimationSizeData) return sizeData.getGestureCount();

        return 0;
    }

    // AS3's AnimatedPetVisualizationData overrides exactly three members - defineVisualizations(),
    // createSizeData() and processVisualizationElement() - and nothing else. It deliberately
    // inherits getDirectionValue()/getZOffset()/getTag() from FurnitureVisualizationData.
    //
    // This port previously *added* stub overrides for those three, with no AS3 counterpart. They
    // shadowed the parent's real implementations, and getDirectionValue() in particular returned
    // `Math.floor(direction / 45) * 45` - i.e. the raw angle (90) instead of the visualization's
    // own direction index (0-7). Every pet sprite was therefore looked up as "cat_64_a_90_0",
    // which exists in no pet library, so all six layers missed and the pet rendered as nothing.
    // Removed rather than implemented: inheriting is what AS3 does.

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualizationData.as::createSizeData()
    // Only scales above 1 (i.e. everything but the smallest) get posture/gesture tables.
    protected override createSizeData(size: number, layerCount: number, angle: number): SizeData
    {
        if(size > 1) return new PetAnimationSizeData(layerCount, angle);

        return new AnimationSizeData(layerCount, angle);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/AnimatedPetVisualizationData.as::processVisualizationElement()
    // AS3 casts sizeData to PetAnimationSizeData and, when the cast fails, silently skips the
    // element and still returns true (the smallest scale has a plain AnimationSizeData) - the
    // `instanceof` guards below reproduce that rather than treating it as an error.
    protected override processVisualizationElement(sizeData: SizeData, elementName: string, elementData: Record<string, unknown>): boolean
    {
        if(sizeData === null || elementData === null)
        {
            return false;
        }

        switch(elementName)
        {
            case 'postures':
                if(sizeData instanceof PetAnimationSizeData)
                {
                    if(!sizeData.definePostures(elementData as {defaultPosture?: string; postures?: {id?: string; animationId?: number}[]})) return false;
                }

                return true;
            case 'gestures':
                if(sizeData instanceof PetAnimationSizeData)
                {
                    // AS3 reads the <gestures> node's child list; the .nitro bundle decodes that
                    // same list to either a bare array or a { gestures: [...] } wrapper.
                    const gestures = Array.isArray(elementData)
                        ? elementData as {id?: string; animationId?: number}[]
                        : (elementData as {gestures?: {id?: string; animationId?: number}[]}).gestures ?? null;

                    if(!sizeData.defineGestures(gestures)) return false;
                }

                return true;
            default:
                return super.processVisualizationElement(sizeData, elementName, elementData);
        }
    }
}
