import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {RoomThumbnailData} from './RoomThumbnailData';

/**
 * Door mode constants
 */
export const RoomDoorMode = {
    OPEN: 0,
    DOORBELL: 1,
    PASSWORD: 2,
    INVISIBLE: 3,
    NOOBS_ONLY: 4,
} as const;

/**
 * Trade mode constants
 */
export const RoomTradeMode = {
    NOT_ALLOWED: 0,
    RIGHTS_OWNERS: 1,
    ALLOWED: 2,
} as const;

/**
 * Guest room data containing all room information
 *
 * Based on AS3 com.sulake.habbo.communication.messages.incoming.navigator.class_1675
 */
export class GuestRoomData
{
    /**
    * Bitflags for room data
    */
    private static readonly ROOM_FLAG_THUMBNAIL = 1;

    private static readonly ROOM_FLAG_GROUP = 2;

    private static readonly ROOM_FLAG_PROMOTION = 4;

    private static readonly ROOM_FLAG_SHOW_OWNER = 8;

    private static readonly ROOM_FLAG_ALLOW_PETS = 16;

    private static readonly ROOM_FLAG_DISPLAY_AD = 32;

    constructor(wrapper: IMessageDataWrapper)
    {
        this._flatId = wrapper.readInt();
        this._roomName = wrapper.readString();
        this._ownerId = wrapper.readInt();
        this._ownerName = wrapper.readString();
        this._doorMode = wrapper.readInt();
        this._userCount = wrapper.readInt();
        this._maxUserCount = wrapper.readInt();
        this._description = wrapper.readString();
        this._tradeMode = wrapper.readInt();
        this._score = wrapper.readInt();
        this._ranking = wrapper.readInt();
        this._categoryId = wrapper.readInt();

        const tagCount = wrapper.readInt();
        for(let i = 0; i < tagCount; i++)
        {
            this._tags.push(wrapper.readString());
        }

        const flags = wrapper.readInt();

        if((flags & GuestRoomData.ROOM_FLAG_THUMBNAIL) > 0)
        {
            this._officialRoomPicRef = wrapper.readString();
        }

        if((flags & GuestRoomData.ROOM_FLAG_GROUP) > 0)
        {
            this._habboGroupId = wrapper.readInt();
            this._groupName = wrapper.readString();
            this._groupBadgeCode = wrapper.readString();
        }

        if((flags & GuestRoomData.ROOM_FLAG_PROMOTION) > 0)
        {
            this._roomAdName = wrapper.readString();
            this._roomAdDescription = wrapper.readString();
            this._roomAdExpiresInMin = wrapper.readInt();
        }

        this._showOwner = (flags & GuestRoomData.ROOM_FLAG_SHOW_OWNER) > 0;
        this._allowPets = (flags & GuestRoomData.ROOM_FLAG_ALLOW_PETS) > 0;
        this._displayRoomEntryAd = (flags & GuestRoomData.ROOM_FLAG_DISPLAY_AD) > 0;

        this._thumbnail = new RoomThumbnailData(null);
        this._thumbnail.setDefaults();
    }

    private _flatId: number = 0;

    get flatId(): number
    {
        return this._flatId;
    }

    private _roomName: string = '';

    get roomName(): string
    {
        return this._roomName;
    }

    set roomName(value: string)
    {
        this._roomName = value;
    }

    private _ownerId: number = 0;

    get ownerId(): number
    {
        return this._ownerId;
    }

    private _ownerName: string = '';

    get ownerName(): string
    {
        return this._ownerName;
    }

    private _doorMode: number = 0;

    get doorMode(): number
    {
        return this._doorMode;
    }

    private _userCount: number = 0;

    get userCount(): number
    {
        return this._userCount;
    }

    private _maxUserCount: number = 0;

    get maxUserCount(): number
    {
        return this._maxUserCount;
    }

    private _description: string = '';

    get description(): string
    {
        return this._description;
    }

    private _tradeMode: number = 0;

    get tradeMode(): number
    {
        return this._tradeMode;
    }

    private _score: number = 0;

    get score(): number
    {
        return this._score;
    }

    private _ranking: number = 0;

    get ranking(): number
    {
        return this._ranking;
    }

    private _categoryId: number = 0;

    get categoryId(): number
    {
        return this._categoryId;
    }

    private _tags: string[] = [];

    get tags(): string[]
    {
        return this._tags;
    }

    private _officialRoomPicRef: string | null = null;

    get officialRoomPicRef(): string | null
    {
        return this._officialRoomPicRef;
    }

    private _habboGroupId: number = 0;

    get habboGroupId(): number
    {
        return this._habboGroupId;
    }

    private _groupName: string = '';

    get groupName(): string
    {
        return this._groupName;
    }

    private _groupBadgeCode: string = '';

    get groupBadgeCode(): string
    {
        return this._groupBadgeCode;
    }

    private _roomAdName: string = '';

    get roomAdName(): string
    {
        return this._roomAdName;
    }

    private _roomAdDescription: string = '';

    get roomAdDescription(): string
    {
        return this._roomAdDescription;
    }

    private _roomAdExpiresInMin: number = 0;

    get roomAdExpiresInMin(): number
    {
        return this._roomAdExpiresInMin;
    }

    private _showOwner: boolean = false;

    get showOwner(): boolean
    {
        return this._showOwner;
    }

    private _allowPets: boolean = false;

    get allowPets(): boolean
    {
        return this._allowPets;
    }

    private _displayRoomEntryAd: boolean = false;

    get displayRoomEntryAd(): boolean
    {
        return this._displayRoomEntryAd;
    }

    private _thumbnail: RoomThumbnailData;

    get thumbnail(): RoomThumbnailData
    {
        return this._thumbnail;
    }

    private _allInRoomMuted: boolean = false;

    get allInRoomMuted(): boolean
    {
        return this._allInRoomMuted;
    }

    set allInRoomMuted(value: boolean)
    {
        this._allInRoomMuted = value;
    }

    private _canMute: boolean = false;

    get canMute(): boolean
    {
        return this._canMute;
    }

    set canMute(value: boolean)
    {
        this._canMute = value;
    }

    private _disposed: boolean = false;

    get disposed(): boolean
    {
        return this._disposed;
    }

    dispose(): void
    {
        if(this._disposed)
        {
            return;
        }

        this._disposed = true;
        this._tags = [];
    }
}
