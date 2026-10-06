import type {
    CategoriesWithVisitorCountData,
    CompetitionRoomsData,
    EventCategory,
    FlatCategory,
    GuestRoomData,
    GuestRoomSearchResultData,
    INavigatorSearchResultData,
    OfficialRoomEntryData,
    OfficialRoomsData,
    PopularTagsData,
    PromotedRoomsData,
    RoomEventData,
} from '../../communication/messages/incoming/navigator';
import type { RoomSessionTags } from './RoomSessionTags';
import type {
    NavigatorSearchResultSet,
    NavigatorTopLevelContext,
} from '../../communication/messages/incoming/newnavigator';
import {RoomSettingsFriendListManager} from '../roomsettings';

type NavigatorSecurityProvider = {
    readonly sessionData?: {
        hasSecurity(level: number): boolean;
    } | null;
};

/**
 * Navigator data domain model
 *
 * Based on AS3 com.sulake.habbo.navigator.domain.NavigatorData
 */
export class NavigatorData
{
    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::_navigator
    private readonly _navigator: NavigatorSecurityProvider | null;
    private _lastMessage: INavigatorSearchResultData | null = null;
    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::_favouriteLimit
    private _favouriteLimit: number = 0;
    private _favouriteCount: number = 0;
    private _favouriteRoomIds: Map<number, boolean> = new Map();
    private _isLoading: boolean = false;
    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::_friendList
    private _friendList: RoomSettingsFriendListManager = new RoomSettingsFriendListManager();

    constructor(navigator: NavigatorSecurityProvider | null = null)
    {
        this._navigator = navigator;
    }

    private _roomEventData: RoomEventData | null = null;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get roomEventData()
    get roomEventData(): RoomEventData | null
    {
        return this._roomEventData;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set roomEventData()
    set roomEventData(value: RoomEventData | null)
    {
        if(this._roomEventData !== null)
        {
            (this._roomEventData as { dispose?: () => void }).dispose?.();
        }

        this._roomEventData = value;
    }

    private _eventMod: boolean = false;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get eventMod()
    get eventMod(): boolean
    {
        return this._eventMod;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set eventMod()
    set eventMod(value: boolean)
    {
        this._eventMod = value;
    }

    private _roomPicker: boolean = false;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get roomPicker()
    get roomPicker(): boolean
    {
        return this._roomPicker;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set roomPicker()
    set roomPicker(value: boolean)
    {
        this._roomPicker = value;
    }

    private _currentRoomOwner: boolean = false;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get currentRoomOwner()
    get currentRoomOwner(): boolean
    {
        return this._currentRoomOwner;
    }

    private _currentRoomId: number = 0;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get currentRoomId()
    get currentRoomId(): number
    {
        return this._currentRoomId;
    }

    private _avatarId: number = 0;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get avatarId()
    get avatarId(): number
    {
        return this._avatarId;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set avatarId()
    set avatarId(value: number)
    {
        this._avatarId = value;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::_enteredGuestRoom
    private _enteredGuestRoom: GuestRoomData | null = null;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get enteredGuestRoom()
    get enteredGuestRoom(): GuestRoomData | null
    {
        return this._enteredGuestRoom;
    }

    set enteredGuestRoom(value: GuestRoomData | null)
    {
        if(this._enteredGuestRoom !== null)
        {
            this._enteredGuestRoom.dispose();
        }

        this._enteredGuestRoom = value;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set enteredRoom()
    set enteredRoom(value: GuestRoomData | null)
    {
        this.enteredGuestRoom = value;
    }

    private _hcMember: boolean = false;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get hcMember()
    get hcMember(): boolean
    {
        return this._hcMember;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set hcMember()
    set hcMember(value: boolean)
    {
        this._hcMember = value;
    }

    private _createdFlatId: number = 0;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get createdFlatId()
    get createdFlatId(): number
    {
        return this._createdFlatId;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set createdFlatId()
    set createdFlatId(value: number)
    {
        this._createdFlatId = value;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::_hotRoomPopupOpen
    private _hotRoomPopupOpen: boolean = false;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get hotRoomPopupOpen()
    get hotRoomPopupOpen(): boolean
    {
        return this._hotRoomPopupOpen;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set hotRoomPopupOpen()
    set hotRoomPopupOpen(value: boolean)
    {
        this._hotRoomPopupOpen = value;
    }

    private _homeRoomId: number = 0;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get homeRoomId()
    get homeRoomId(): number
    {
        return this._homeRoomId;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set homeRoomId()
    set homeRoomId(value: number)
    {
        this._homeRoomId = value;
    }

    private _settingsReceived: boolean = false;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get settingsReceived()
    get settingsReceived(): boolean
    {
        return this._settingsReceived;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set settingsReceived()
    set settingsReceived(value: boolean)
    {
        this._settingsReceived = value;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::_allCategories
    private _allCategories: FlatCategory[] = [];
    private _categoryByNodeId: Map<number, FlatCategory> = new Map();

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get allCategories()
    get allCategories(): FlatCategory[]
    {
        return this._allCategories;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::_visibleCategories
    private _visibleCategories: FlatCategory[] = [];

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get visibleCategories()
    get visibleCategories(): FlatCategory[]
    {
        return this._visibleCategories;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::_allEventCategories
    private _allEventCategories: EventCategory[] = [];
    private _eventCategoryById: Map<number, EventCategory> = new Map();

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get allEventCategories()
    get allEventCategories(): EventCategory[]
    {
        return this._allEventCategories;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::_visibleEventCategories
    private _visibleEventCategories: EventCategory[] = [];

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get visibleEventCategories()
    get visibleEventCategories(): EventCategory[]
    {
        return this._visibleEventCategories;
    }

    private _currentRoomRating: number = 0;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get currentRoomRating()
    get currentRoomRating(): number
    {
        return this._currentRoomRating;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set currentRoomRating()
    set currentRoomRating(value: number)
    {
        this._currentRoomRating = value;
    }

    private _currentRoomIsStaffPick: boolean = false;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get currentRoomIsStaffPick()
    get currentRoomIsStaffPick(): boolean
    {
        return this._currentRoomIsStaffPick;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set currentRoomIsStaffPick()
    set currentRoomIsStaffPick(value: boolean)
    {
        this._currentRoomIsStaffPick = value;
    }

    private _adIndex: number = 0;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get adIndex()
    get adIndex(): number
    {
        return this._adIndex;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set adIndex()
    set adIndex(value: number)
    {
        this._adIndex = value;
    }

    private _adRoom: OfficialRoomEntryData | null = null;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get adRoom()
    get adRoom(): OfficialRoomEntryData | null
    {
        return this._adRoom;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set adRoom()
    set adRoom(value: OfficialRoomEntryData | null)
    {
        this._adRoom = value;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::_promotedRooms
    private _promotedRooms: PromotedRoomsData | null = null;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get promotedRooms()
    get promotedRooms(): PromotedRoomsData | null
    {
        return this._promotedRooms;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set promotedRooms()
    set promotedRooms(value: PromotedRoomsData | null)
    {
        this._promotedRooms = value;
    }

    private _roomSessionTags: RoomSessionTags | null = null;

    get roomSessionTags(): RoomSessionTags | null
    {
        return this._roomSessionTags;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set roomSessionTags()
    set roomSessionTags(value: RoomSessionTags | null)
    {
        this._roomSessionTags = value;
    }

    private _competitionRoomsData: CompetitionRoomsData | null = null;

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get competitionRoomsData()
    get competitionRoomsData(): CompetitionRoomsData | null
    {
        return this._competitionRoomsData;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set competitionRoomsData()
    set competitionRoomsData(value: CompetitionRoomsData | null)
    {
        this._competitionRoomsData = value;
    }

    // New Navigator data
    private _topLevelContexts: NavigatorTopLevelContext[] = [];

    get topLevelContexts(): NavigatorTopLevelContext[]
    {
        return this._topLevelContexts;
    }

    set topLevelContexts(value: NavigatorTopLevelContext[])
    {
        this._topLevelContexts = value;
    }

    private _navigatorSearchResultSet: NavigatorSearchResultSet | null = null;

    get navigatorSearchResultSet(): NavigatorSearchResultSet | null
    {
        return this._navigatorSearchResultSet;
    }

    set navigatorSearchResultSet(value: NavigatorSearchResultSet | null)
    {
        this._navigatorSearchResultSet = value;

        this._isLoading = false;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get canAddFavourite()
    get canAddFavourite(): boolean
    {
        return this._enteredGuestRoom !== null && !this._currentRoomOwner;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get canEditRoomSettings()
    get canEditRoomSettings(): boolean
    {
        return this._enteredGuestRoom !== null && (this._currentRoomOwner || (this._navigator?.sessionData?.hasSecurity(5) ?? false));
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get popularTagsArrived()
    get popularTagsArrived(): boolean
    {
        return this._lastMessage !== null && 'tags' in this._lastMessage;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get guestRoomSearchArrived()
    get guestRoomSearchArrived(): boolean
    {
        return this._lastMessage !== null && 'rooms' in this._lastMessage;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get officialRoomsArrived()
    get officialRoomsArrived(): boolean
    {
        return this._lastMessage !== null && 'entries' in this._lastMessage;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get categoriesWithUserCountArrived()
    get categoriesWithUserCountArrived(): boolean
    {
        return this._lastMessage !== null && 'categories' in this._lastMessage;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get guestRoomSearchResults()
    get guestRoomSearchResults(): GuestRoomSearchResultData | null
    {
        return this._lastMessage as GuestRoomSearchResultData | null;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set guestRoomSearchResults()
    set guestRoomSearchResults(value: GuestRoomSearchResultData | null)
    {
        this.disposeCurrentMessage();

        this._lastMessage = value;

        if(value)
        {
            this._adRoom = value.ad;
        }

        this._isLoading = false;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get popularTags()
    get popularTags(): PopularTagsData | null
    {
        return this._lastMessage as PopularTagsData | null;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set popularTags()
    set popularTags(value: PopularTagsData | null)
    {
        this.disposeCurrentMessage();

        this._lastMessage = value;
        this._isLoading = false;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get officialRooms()
    get officialRooms(): OfficialRoomsData | null
    {
        return this._lastMessage as OfficialRoomsData | null;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set officialRooms()
    set officialRooms(value: OfficialRoomsData | null)
    {
        this.disposeCurrentMessage();

        this._lastMessage = value;
        this._isLoading = false;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get categoriesWithVisitorData()
    get categoriesWithVisitorData(): CategoriesWithVisitorCountData | null
    {
        return this._lastMessage as CategoriesWithVisitorCountData | null;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set categoriesWithVisitorData()
    set categoriesWithVisitorData(value: CategoriesWithVisitorCountData | null)
    {
        this.disposeCurrentMessage();

        this._lastMessage = value;
        this._isLoading = false;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set categories()
    set categories(value: FlatCategory[])
    {
        this._allCategories = value;
        this._categoryByNodeId.clear();
        this._visibleCategories = [];

        for(const cat of value)
        {
            this._categoryByNodeId.set(cat.nodeId, cat);

            if(cat.visible)
            {
                this._visibleCategories.push(cat);
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::set eventCategories()
    set eventCategories(value: EventCategory[])
    {
        this._allEventCategories = value;
        this._eventCategoryById.clear();
        this._visibleEventCategories = [];

        for(const cat of value)
        {
            this._eventCategoryById.set(cat.categoryId, cat);

            if(cat.visible)
            {
                this._visibleEventCategories.push(cat);
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::onRoomEnter()
    onRoomEnter(roomEnterOrGuestRoomId: { readonly guestRoomId: number; readonly owner: boolean } | number, isOwner: boolean = false): void
    {
        const guestRoomId = typeof roomEnterOrGuestRoomId === 'number' ? roomEnterOrGuestRoomId : roomEnterOrGuestRoomId.guestRoomId;
        const owner = typeof roomEnterOrGuestRoomId === 'number' ? isOwner : roomEnterOrGuestRoomId.owner;

        this._enteredGuestRoom = null;
        this._currentRoomOwner = owner;
        this._currentRoomId = guestRoomId;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::onRoomExit()
    onRoomExit(): void
    {
        if(this._roomEventData !== null)
        {
            this.roomEventData = null;
        }

        if(this._enteredGuestRoom !== null)
        {
            this._enteredGuestRoom.dispose();
            this._enteredGuestRoom = null;
        }

        this._currentRoomOwner = false;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::getCategoryById()
    getCategoryById(nodeId: number): FlatCategory | null
    {
        return this._categoryByNodeId.get(nodeId) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/domain/NavigatorData.as::getEventCategoryById()
    // Deliberate divergence, not an oversight: AS3's real body iterates _allCategories (room
    // categories, FlatCategory - which carries nodeId, not categoryId) and compares against
    // .categoryId, a property that doesn't exist on that type - so it always returns null. AS3 also
    // has zero callers for this method anywhere in the client, same as this port, so there is no
    // observable behavior to be bug-compatible with; this queries the correctly-separated
    // _eventCategoryById map instead of reproducing the dead, self-evidently broken lookup.
    getEventCategoryById(categoryId: number): EventCategory | null
    {
        return this._eventCategoryById.get(categoryId) ?? null;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::onFavourites()
    onFavourites(favouritesOrLimit: { readonly limit: number; readonly favouriteRoomIds: number[] } | number, roomIds: number[] = []): void
    {
        const limit = typeof favouritesOrLimit === 'number' ? favouritesOrLimit : favouritesOrLimit.limit;
        const favouriteRoomIds = typeof favouritesOrLimit === 'number' ? roomIds : favouritesOrLimit.favouriteRoomIds;

        this._favouriteLimit = limit;
        this._favouriteCount = favouriteRoomIds.length;
        this._favouriteRoomIds.clear();

        for(const roomId of favouriteRoomIds)
        {
            this._favouriteRoomIds.set(roomId, true);
        }
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::favouriteChanged()
    favouriteChanged(roomId: number, added: boolean): void
    {
        if(added)
        {
            this._favouriteRoomIds.set(roomId, true);
            this._favouriteCount++;
        }
        else
        {
            this._favouriteRoomIds.delete(roomId);
            this._favouriteCount--;
        }
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::isCurrentRoomFavourite()
    isCurrentRoomFavourite(): boolean
    {
        if(!this._enteredGuestRoom)
        {
            return false;
        }
        return this._favouriteRoomIds.has(this._enteredGuestRoom.flatId);
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::isCurrentRoomHome()
    isCurrentRoomHome(): boolean
    {
        if(!this._enteredGuestRoom)
        {
            return false;
        }
        return this._homeRoomId === this._enteredGuestRoom.flatId;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::isRoomFavourite()
    isRoomFavourite(roomId: number): boolean
    {
        return this._favouriteRoomIds.has(roomId);
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::isFavouritesFull()
    isFavouritesFull(): boolean
    {
        return this._favouriteCount >= this._favouriteLimit;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::isRoomHome()
    isRoomHome(roomId: number): boolean
    {
        return roomId === this._homeRoomId;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::startLoading()
    startLoading(): void
    {
        this._isLoading = true;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::isLoading()
    isLoading(): boolean
    {
        return this._isLoading;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::get friendList()
    get friendList(): RoomSettingsFriendListManager
    {
        return this._friendList;
    }

    // AS3: .../src/com/sulake/habbo/navigator/domain/NavigatorData.as::getAndResetSessionTags()
    getAndResetSessionTags(): RoomSessionTags | null
    {
        const tags = this._roomSessionTags;

        this._roomSessionTags = null;

        return tags;
    }

    dispose(): void
    {
        this.disposeCurrentMessage();

        if(this._enteredGuestRoom)
        {
            this._enteredGuestRoom.dispose();
            this._enteredGuestRoom = null;
        }

        if(this._promotedRooms)
        {
            this._promotedRooms.dispose();
            this._promotedRooms = null;
        }

        this._favouriteRoomIds.clear();

        this._allCategories.length = 0;
        this._categoryByNodeId.clear();
        this._visibleCategories.length = 0;
        this._allEventCategories.length = 0;
        this._eventCategoryById.clear();
        this._visibleEventCategories.length = 0;
    }

    private disposeCurrentMessage(): void
    {
        if(this._lastMessage === null)
        {
            return;
        }

        this._lastMessage.dispose();

        this._lastMessage = null;
    }
}
