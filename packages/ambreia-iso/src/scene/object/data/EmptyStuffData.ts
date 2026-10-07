/**
 * EmptyStuffData
 *
 * Based on AS3: com.sulake.habbo.room.object.data.EmptyStuffData
 *
 * Empty furniture data placeholder (format type 4).
 */
import type {IStuffData} from './IStuffData';
import {StuffDataBase} from './StuffDataBase';

export class EmptyStuffData extends StuffDataBase implements IStuffData
{
    public static readonly FORMAT_KEY = 4;

    override getLegacyString(): string
    {
        return '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/data/EmptyStuffData.as::compare()
    override compare(data: IStuffData): boolean
    {
        // AS3 returns `super.compare()`, and the base returns false — so two
        // empty-stuffdata items never compare equal. The old `return true` merged
        // every empty-data item into a single inventory stack.
        return super.compare(data);
    }
}
