import {RoomObjectCategoryEnum} from '@ambreia/iso/scene/object/RoomObjectCategoryEnum';

/** A click on an NPC of the zone talks to it (M2a §4.2); the interaction feature does not target it. */
export class NpcClicks
{
    constructor(private readonly _isNpc: (objectId: number) => boolean, private readonly _talk: (objectId: number) => void) {}

    /** True when the click was an NPC's and it was talked to. */
    selected(objectId: number, category: number): boolean
    {
        if(category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_USER || !this._isNpc(objectId)) return false;

        this._talk(objectId);

        return true;
    }
}
