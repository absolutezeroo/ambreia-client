/**
 * FurnitureOneWayDoorLogic
 *
 * Based on AS3: com.sulake.habbo.room.object.logic.furniture.FurnitureOneWayDoorLogic
 *
 * Logic for one-way door furniture.
 */
import {FurnitureLogic} from './FurnitureLogic';

export class FurnitureOneWayDoorLogic extends FurnitureLogic
{
    override useObject(): void
    {
        // One-way doors handle entry differently
        // The server manages the state
    }
}
