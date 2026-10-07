/**
 * FurnitureVimeoLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureVimeoLogic.as
 *
 * Logic for Vimeo video furniture (widget = VIMEO).
 */
import {FurnitureLogic} from './FurnitureLogic';

export class FurnitureVimeoLogic extends FurnitureLogic
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/furniture/_SafeCls_2317.as::get widget()
    override get widget(): string | null
    {
        return 'RWE_VIMEO';
    }
}
