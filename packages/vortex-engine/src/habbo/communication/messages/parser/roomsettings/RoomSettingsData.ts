import type {RoomChatSettings} from './RoomChatSettings';
import type {RoomModerationSettings} from './RoomModerationSettings';
import type {RoomSettingsController} from './RoomSettingsController';
import type {RoomSettingsBannedUser} from './RoomSettingsBannedUser';

export class RoomSettingsData
{
    static readonly DOOR_MODE_OPEN: number = 0;
    static readonly DOOR_MODE_CLOSED: number = 1;
    static readonly DOOR_MODE_PASSWORD: number = 2;
    static readonly DOOR_MODE_INVISIBLE: number = 3;
    static readonly DOOR_MODE_NOOBS_ONLY: number = 4;

    static readonly TRADE_MODE_NOT_ALLOWED: number = 0;
    static readonly TRADE_MODE_NOT_WITH_CONTROLLER: number = 1;
    static readonly TRADE_MODE_ALLOWED: number = 2;

    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get roomId()
    roomId: number = 0;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get name()
    name: string = '';
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get description()
    description: string = '';
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get doorMode()
    doorMode: number = 0;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get categoryId()
    categoryId: number = 0;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get maximumVisitors()
    maximumVisitors: number = 0;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get maximumVisitorsLimit()
    maximumVisitorsLimit: number = 0;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get tags()
    tags: string[] = [];
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get tradeMode()
    tradeMode: number = 0;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get allowPets()
    allowPets: boolean = false;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get allowFoodConsume()
    allowFoodConsume: boolean = false;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get allowWalkThrough()
    allowWalkThrough: boolean = false;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get hideWalls()
    hideWalls: boolean = false;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get wallThickness()
    wallThickness: number = 0;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get floorThickness()
    floorThickness: number = 0;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get chatSettings()
    chatSettings: RoomChatSettings | null = null;

    /**
     * The six fields this revision inserted between the chat block and the moderation
     * block. `RoomSettingsCtrl` does not draw them yet; they are read so the rest of the
     * packet lands on the right fields, which is what the dialog actually needs.
     */
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::leaveOnDoorTileEnabled
    leaveOnDoorTileEnabled: boolean = false;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get idleSleepEnabled()
    idleSleepEnabled: boolean = true;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get idleSleepTimeoutSeconds()
    idleSleepTimeoutSeconds: number = 0;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get idleAutokickEnabled()
    idleAutokickEnabled: boolean = false;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get idleAutokickTimeoutSeconds()
    idleAutokickTimeoutSeconds: number = 0;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get muteAllPets()
    muteAllPets: boolean = false;

    /**
     * Read from the wire by an earlier build, but NOT by this revision's parser — AS3's
     * `_SafeCls_3719.as` never touches it. `RoomSettingsCtrl` still ticks its checkbox from
     * this field, so it is kept and simply stays false until something sets it.
     */
    allowNavigatorDynamicCats: boolean = false;

    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get roomModerationSettings()
    roomModerationSettings: RoomModerationSettings | null = null;
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get hiddenByBc()
    hiddenByBc: boolean = false;

    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get controllersById()
    controllersById: Map<number, RoomSettingsController> = new Map();
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get bannedUsersById()
    bannedUsersById: Map<number, RoomSettingsBannedUser> = new Map();

    /**
     * One-shot latches for the two lists that are fetched lazily when their tab is first shown.
     *
     * AS3 carries this state in the dictionaries themselves: `controllersById`/`bannedUsersById`
     * start null, and `refreshFlatControllers()`/`refreshBannedUsers()` assign an empty
     * `Dictionary` right before sending the request, so the request fires once per settings
     * dialog. These maps are non-null from construction, so the "not requested yet" state has to
     * live somewhere — without it, a room with zero controllers (or zero bans) answers with an
     * empty list, the list stays empty, and the refresh triggered by the answer asks again, in a
     * loop, until the server rate-limits the session.
     */
    // TS-only: no AS3 counterpart; stands in for the null-vs-empty `Dictionary` state above.
    controllersRequested: boolean = false;

    // TS-only: no AS3 counterpart; stands in for the null-vs-empty `Dictionary` state above.
    bannedUsersRequested: boolean = false;

    private _controllerListDirty: boolean = true;
    private _controllerList: RoomSettingsController[] | null = null;
    private _bannedListDirty: boolean = true;
    private _bannedList: RoomSettingsBannedUser[] | null = null;

    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::getDoorModeLocalizationKey()
    static getDoorModeLocalizationKey(doorMode: number): string
    {
        switch(doorMode)
        {
            case 0: return '${navigator.door.mode.open}';
            case 1: return '${navigator.door.mode.closed}';
            case 2: return '${navigator.door.mode.password}';
            case 3: return '${navigator.door.mode.invisible}';
            case 4: return '${navigator.door.mode.noobs_only}';
            default: return '';
        }
    }

    /**
     * AS3 also records the id it just changed (`_SafeStr_8812`). That field is written here and
     * read nowhere in any tree, so it is not carried.
     */
    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::setFlatController()
    setFlatController(userId: number, controller: RoomSettingsController): void
    {
        this.controllersById.set(userId, controller);
        this._controllerListDirty = true;
        this._controllerList = null;
    }

    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get controllerList()
    get controllerList(): RoomSettingsController[]
    {
        if(this._controllerList === null || this._controllerListDirty)
        {
            this._controllerList = Array.from(this.controllersById.values())
                .sort((a, b) => a.userName.localeCompare(b.userName));
            this._controllerListDirty = false;
        }

        return this._controllerList;
    }

    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::setBannedUser()
    setBannedUser(userId: number, banned: RoomSettingsBannedUser): void
    {
        this.bannedUsersById.set(userId, banned);
        this._bannedListDirty = true;
        this._bannedList = null;
    }

    // AS3: .../src/unknowns/_SafePkg_1710/_SafeCls_1961.as::get bannedUsersList()
    get bannedUsersList(): RoomSettingsBannedUser[]
    {
        if(this._bannedList === null || this._bannedListDirty)
        {
            this._bannedList = Array.from(this.bannedUsersById.values())
                .sort((a, b) => a.userName.localeCompare(b.userName));
            this._bannedListDirty = false;
        }

        return this._bannedList;
    }
}
