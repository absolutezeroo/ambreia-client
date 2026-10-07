import {OrderedMap} from '@ambreia/common/utils/OrderedMap';
import {Logger} from '@ambreia/common/utils/Logger';
import {AnimationSizeData} from '../data/AnimationSizeData';

const log = Logger.getLogger('habbo.room.object.visualization.pet.PetAnimationSizeData');

/**
 * Per-scale posture/gesture animation table for a pet.
 *
 * Both maps are `OrderedMap` rather than a native Map because AS3 reads them back *by index*
 * (`getKey(index)` in getPostureForAnimation()/getGestureForAnimation()), which a native Map
 * cannot express - insertion order is load-bearing here, not incidental.
 *
 * AS3 parses these from XML attributes; this port receives the same data already decoded from the
 * .nitro bundle's JSON, so definePostures()/defineGestures() take the decoded objects instead of
 * an XML node. The `checkRequiredAttributes(["id","animationId"])` guard AS3 performs is kept as an
 * explicit presence check on each entry.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/PetAnimationSizeData.as
 */
export class PetAnimationSizeData extends AnimationSizeData
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/PetAnimationSizeData.as::DEFAULT
    // Name unrecoverable in every tree (`_SafeStr_10592` / `const_388`) - TS-derived.
    static readonly DEFAULT: number = -1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/PetAnimationSizeData.as::_SafeStr_6025
    // Name unrecoverable in every tree - TS-derived from definePostures().
    private _posturesToAnimations: OrderedMap<string, number> = new OrderedMap<string, number>();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/PetAnimationSizeData.as::_SafeStr_5684
    // Name unrecoverable in every tree - TS-derived from defineGestures().
    private _gesturesToAnimations: OrderedMap<string, number> = new OrderedMap<string, number>();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/PetAnimationSizeData.as::_defaultPosture
    private _defaultPosture: string | null = null;

    constructor(layerCount: number, angle: number)
    {
        super(layerCount, angle);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/PetAnimationSizeData.as::definePostures()
    definePostures(data: {defaultPosture?: string; postures?: {id?: string; animationId?: number}[]} | null): boolean
    {
        if(data == null) return false;

        this._defaultPosture = (data.defaultPosture != null && data.defaultPosture.length > 0) ? data.defaultPosture : null;

        const postures = data.postures;

        if(postures == null) return false;

        for(const posture of postures)
        {
            if(posture == null || posture.id == null || posture.animationId == null) return false;

            this._posturesToAnimations.add(posture.id, posture.animationId);

            // AS3 falls back to the first posture id when no defaultPosture attribute is present.
            if(this._defaultPosture == null) this._defaultPosture = posture.id;
        }

        if(this._defaultPosture == null) return false;

        return this._posturesToAnimations.getValue(this._defaultPosture) != null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/PetAnimationSizeData.as::defineGestures()
    // Absent gesture data is not an error in AS3 - it returns true.
    defineGestures(data: {id?: string; animationId?: number}[] | null): boolean
    {
        if(data == null) return true;

        for(const gesture of data)
        {
            if(gesture == null || gesture.id == null || gesture.animationId == null) return false;

            this._gesturesToAnimations.add(gesture.id, gesture.animationId);
        }

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/PetAnimationSizeData.as::getAnimationForPosture()
    getAnimationForPosture(posture: string): number
    {
        let key: string | null = posture;

        if(this._posturesToAnimations.getValue(key) == null) key = this._defaultPosture;

        if(key == null) return 0;

        const animationId = this._posturesToAnimations.getValue(key) ?? 0;

        // TEMPORARY DIAGNOSTIC - remove once the pet walk animation is settled.
        // Symptom under investigation: pets slide instead of walking. The posture chain is faithful
        // to AS3 from setUserMovePosture() down to here, so this answers the one open question -
        // does the pet's own animation table declare "mv", or is it falling back to the default?
        // Fires only on a posture change (validateActions gates it), not per frame.
        if(!PetAnimationSizeData._tracedPostures.has(posture))
        {
            PetAnimationSizeData._tracedPostures.add(posture);
            log.info(
                `posture="${posture}" resolved="${key}" animationId=${animationId} ` +
                `default="${this._defaultPosture}" known=[${this.listKnownPostures()}]`
            );
        }

        return animationId;
    }

    /** TEMPORARY: one line per distinct posture, so a walking pet does not flood the console. */
    private static _tracedPostures: Set<string> = new Set<string>();

    /** TEMPORARY: OrderedMap exposes keys only by index, hence the walk. */
    private listKnownPostures(): string
    {
        const keys: string[] = [];

        for(let i = 0; i < this._posturesToAnimations.length; i++)
        {
            const key = this._posturesToAnimations.getKey(i);

            if(key !== null) keys.push(key);
        }

        return keys.join(',');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/PetAnimationSizeData.as::getGestureDisabled()
    getGestureDisabled(posture: string): boolean
    {
        return posture === 'ded';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/PetAnimationSizeData.as::getAnimationForGesture()
    getAnimationForGesture(gesture: string): number
    {
        const animationId = this._gesturesToAnimations.getValue(gesture);

        if(animationId == null) return PetAnimationSizeData.DEFAULT;

        return animationId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/PetAnimationSizeData.as::getPostureForAnimation()
    // Note AS3 indexes the map by *position*, not by animation id - preserved.
    getPostureForAnimation(index: number, useDefault: boolean): string | null
    {
        if(index >= 0 && index < this._posturesToAnimations.length) return this._posturesToAnimations.getKey(index);

        return useDefault ? this._defaultPosture : null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/PetAnimationSizeData.as::getGestureForAnimation()
    getGestureForAnimation(index: number): string | null
    {
        if(index >= 0 && index < this._gesturesToAnimations.length) return this._gesturesToAnimations.getKey(index);

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/PetAnimationSizeData.as::getGestureForAnimationId()
    getGestureForAnimationId(animationId: number): string | null
    {
        for(const key of this._gesturesToAnimations.getKeys())
        {
            if(this._gesturesToAnimations.getValue(key) === animationId) return key;
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/PetAnimationSizeData.as::getPostureCount()
    getPostureCount(): number
    {
        return this._posturesToAnimations.length;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/pet/PetAnimationSizeData.as::getGestureCount()
    getGestureCount(): number
    {
        return this._gesturesToAnimations.length;
    }
}
