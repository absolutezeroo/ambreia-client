/**
 * FurnitureRandomTeleportLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureRandomTeleportLogic.as
 *
 * Logic for random teleport furniture (context menu = RANDOM_TELEPORT).
 */
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';

export class FurnitureRandomTeleportLogic extends FurnitureMultiStateLogic
{
    override get contextMenu(): string | null
    {
        return 'RANDOM_TELEPORT';
    }
}
