/**
 * StuffDataFactory
 *
 * Based on AS3: com.sulake.habbo.room.object.data.class_1697
 *
 * Factory for creating StuffData instances based on format type.
 */
import type {IStuffData} from './IStuffData';
import {LegacyStuffData} from './LegacyStuffData';
import {MapStuffData} from './MapStuffData';
import {StringArrayStuffData} from './StringArrayStuffData';
import {VoteResultStuffData} from './VoteResultStuffData';
import {EmptyStuffData} from './EmptyStuffData';
import {IntArrayStuffData} from './IntArrayStuffData';
import {HighScoreStuffData} from './HighScoreStuffData';
import {CrackableStuffData} from './CrackableStuffData';

export class StuffDataFactory
{
    public static readonly FLAGS_MASK = 0xFF00;
    public static readonly TYPE_MASK = 0x00FF;

    static getStuffDataForType(typeFlags: number): IStuffData | null
    {
        const type = typeFlags & StuffDataFactory.TYPE_MASK;
        let stuffData: IStuffData | null = null;

        switch(type)
        {
            case LegacyStuffData.FORMAT_KEY:
                stuffData = new LegacyStuffData();

                break;

            case MapStuffData.FORMAT_KEY:
                stuffData = new MapStuffData();

                break;

            case StringArrayStuffData.FORMAT_KEY:
                stuffData = new StringArrayStuffData();

                break;

            case VoteResultStuffData.FORMAT_KEY:
                stuffData = new VoteResultStuffData();

                break;

            case EmptyStuffData.FORMAT_KEY:
                stuffData = new EmptyStuffData();

                break;

            case IntArrayStuffData.FORMAT_KEY:
                stuffData = new IntArrayStuffData();

                break;

            case HighScoreStuffData.FORMAT_KEY:
                stuffData = new HighScoreStuffData();

                break;

            case CrackableStuffData.FORMAT_KEY:
                stuffData = new CrackableStuffData();

                break;
        }

        if(stuffData !== null)
        {
            stuffData.flags = typeFlags & StuffDataFactory.FLAGS_MASK;
        }

        return stuffData;
    }
}
