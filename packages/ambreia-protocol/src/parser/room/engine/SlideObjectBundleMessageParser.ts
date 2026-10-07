/**
 * SlideObjectBundleMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.SlideObjectBundleMessageEventParser
 *
 * Parser for roller/slide object movements.
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {SlideObjectData} from '../../../incoming/room/engine/SlideObjectData';
import {Vector3d} from '@ambreia/iso/utils/Vector3d';

export class SlideObjectBundleMessageParser implements IMessageParser
{
    private _objects: SlideObjectData[] = [];

    private _id: number = -1;

    get id(): number
    {
        return this._id;
    }

    private _avatar: SlideObjectData | null = null;

    get avatar(): SlideObjectData | null
    {
        return this._avatar;
    }

    get objectList(): SlideObjectData[]
    {
        return this._objects;
    }

    flush(): boolean
    {
        this._id = -1;
        this._avatar = null;
        this._objects = [];
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        const oldX = wrapper.readInt();
        const oldY = wrapper.readInt();
        const newX = wrapper.readInt();
        const newY = wrapper.readInt();

        const objectCount = wrapper.readInt();
        this._objects = [];

        for(let i = 0; i < objectCount; i++)
        {
            const id = wrapper.readInt();
            const oldZ = parseFloat(wrapper.readString());
            const newZ = parseFloat(wrapper.readString());

            const oldLoc = new Vector3d(oldX, oldY, oldZ);
            const newLoc = new Vector3d(newX, newY, newZ);

            const data = new SlideObjectData(id, oldLoc, newLoc);
            this._objects.push(data);
        }

        this._id = wrapper.readInt();

        if(wrapper.bytesAvailable <= 0)
        {
            return true;
        }

        const moveType = wrapper.readInt();

        switch(moveType)
        {
            case 0:
                // No avatar movement
                break;
            case 1:
            {
                // Avatar move
                const id = wrapper.readInt();
                const oldZ = parseFloat(wrapper.readString());
                const newZ = parseFloat(wrapper.readString());
                const oldLoc = new Vector3d(oldX, oldY, oldZ);
                const newLoc = new Vector3d(newX, newY, newZ);
                this._avatar = new SlideObjectData(id, oldLoc, newLoc, SlideObjectData.MOVE_TYPE_MOVE);
                break;
            }
            case 2:
            {
                // Avatar slide
                const id = wrapper.readInt();
                const oldZ = parseFloat(wrapper.readString());
                const newZ = parseFloat(wrapper.readString());
                const oldLoc = new Vector3d(oldX, oldY, oldZ);
                const newLoc = new Vector3d(newX, newY, newZ);
                this._avatar = new SlideObjectData(id, oldLoc, newLoc, SlideObjectData.MOVE_TYPE_SLIDE);
                break;
            }
        }

        return true;
    }
}
