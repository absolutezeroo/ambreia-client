import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {RoomThumbnailObjectData} from './RoomThumbnailObjectData';

/**
 * Room thumbnail data containing background and objects
 *
 * Based on AS3 com.sulake.habbo.communication.messages.incoming.navigator.class_1782
 */
export class RoomThumbnailData
{
    constructor(wrapper: IMessageDataWrapper | null)
    {
        if(wrapper === null)
        {
            return;
        }

        this._bgImgId = wrapper.readInt();
        this._frontImgId = wrapper.readInt();

        const count = wrapper.readInt();
        for(let i = 0; i < count; i++)
        {
            const obj = new RoomThumbnailObjectData();
            obj.pos = wrapper.readInt();
            obj.imgId = wrapper.readInt();
            this._objects.push(obj);
        }

        if(this._bgImgId === 0)
        {
            this.setDefaults();
        }
    }

    private _bgImgId: number = 0;

    get bgImgId(): number
    {
        return this._bgImgId;
    }

    set bgImgId(value: number)
    {
        this._bgImgId = value;
    }

    private _frontImgId: number = 0;

    get frontImgId(): number
    {
        return this._frontImgId;
    }

    set frontImgId(value: number)
    {
        this._frontImgId = value;
    }

    private _objects: RoomThumbnailObjectData[] = [];

    get objects(): RoomThumbnailObjectData[]
    {
        return this._objects;
    }

    private _disposed: boolean = false;

    get disposed(): boolean
    {
        return this._disposed;
    }

    setDefaults(): void
    {
        this._bgImgId = 1;
        this._frontImgId = 0;

        const obj = new RoomThumbnailObjectData();
        obj.pos = 4;
        obj.imgId = 1;
        this._objects.push(obj);
    }

    getCopy(): RoomThumbnailData
    {
        const copy = new RoomThumbnailData(null);
        copy._bgImgId = this._bgImgId;
        copy._frontImgId = this._frontImgId;

        for(const obj of this._objects)
        {
            copy._objects.push(obj.getCopy());
        }

        return copy;
    }

    dispose(): void
    {
        if(this._disposed)
        {
            return;
        }
        this._disposed = true;
        this._objects = [];
    }

    getAsString(): string
    {
        let result = this._frontImgId + ';';
        result += this._bgImgId + ';';

        for(const obj of this._objects)
        {
            result += obj.imgId + ',' + obj.pos + ';';
        }

        return result;
    }
}
