/**
 * WallDataParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.class_1750
 *
 * Utility class for parsing wall item data from messages.
 */
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {FurnitureWallData} from '@habbo/communication/messages/incoming/room/engine/FurnitureWallData';

export class WallDataParser
{
    static parseItemData(wrapper: IMessageDataWrapper): FurnitureWallData
    {
        const id = parseInt(wrapper.readString(), 10);
        const type = wrapper.readInt();
        const location = wrapper.readString();
        const dataStr = wrapper.readString();
        const secondsToExpiration = wrapper.readInt();
        const usagePolicy = wrapper.readInt();
        const ownerId = wrapper.readInt();

        // Parse state from data string
        let state = 0;
        const dataNum = parseFloat(dataStr);
        if(!isNaN(dataNum))
        {
            state = parseInt(dataStr, 10);
        }

        let data: FurnitureWallData;

        // New format starts with ":"
        if(location.indexOf(':') === 0)
        {
            data = new FurnitureWallData(id, type, false);

            const parts = location.split(' ');
            if(parts.length >= 3)
            {
                let wallPart = parts[0];
                let localPart = parts[1];
                const dirPart = parts[2];

                if(wallPart.length > 3 && localPart.length > 2)
                {
                    // Remove prefix :w= and l=
                    wallPart = wallPart.substring(3);
                    localPart = localPart.substring(2);

                    const wallCoords = wallPart.split(',');
                    if(wallCoords.length >= 2)
                    {
                        const wallX = parseInt(wallCoords[0], 10);
                        const wallY = parseInt(wallCoords[1], 10);

                        const localCoords = localPart.split(',');
                        if(localCoords.length >= 2)
                        {
                            const localX = parseInt(localCoords[0], 10);
                            const localY = parseInt(localCoords[1], 10);

                            data.wallX = wallX;
                            data.wallY = wallY;
                            data.localX = localX;
                            data.localY = localY;
                            data.dir = dirPart;
                            data.data = dataStr;
                            data.state = state;
                        }
                    }
                }
            }
        }
        // Old format (legacy posters etc)
        else
        {
            data = new FurnitureWallData(id, type, true);

            const parts = location.split(' ');
            if(parts.length >= 2)
            {
                let dir = parts[0];
                if(dir === 'rightwall' || dir === 'frontwall')
                {
                    dir = 'r';
                }
                else
                {
                    dir = 'l';
                }

                const posStr = parts[1];
                const posCoords = posStr.split(',');
                if(posCoords.length >= 3)
                {
                    const y = parseFloat(posCoords[0]);
                    const z = parseFloat(posCoords[1]);

                    data.y = y;
                    data.z = z;
                    data.dir = dir;
                    data.data = dataStr;
                    data.state = state;
                }
            }
        }

        data.usagePolicy = usagePolicy;
        data.ownerId = ownerId;
        data.secondsToExpiration = secondsToExpiration;

        return data;
    }
}
