import type {EventEmitter} from 'eventemitter3';
import type {IFriendEntity} from './IFriendEntity';
import type {IFriendRequest} from './IFriendRequest';

/**
 * IHabboFriendBarData
 *
 * The friend bar's model, as its views see it: the friends and pending requests, plus
 * every action a slot or a request row can trigger. The view holds no friend state of
 * its own and sends nothing itself — it calls through here.
 *
 * The primary tree obfuscates this interface to `_SafeCls_1720` and no tree recovers
 * it. **The name `IHabboFriendBarData` is derived**, from its sole implementor
 * `HabboFriendBarData` (unobfuscated). It extends `IUnknown` in AS3, i.e. it is a DI
 * component interface, not a plain data holder.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/data/_SafeCls_1720.as
 */
export interface IHabboFriendBarData
{
    // AS3: .../data/_SafeCls_1720.as::get events()
    readonly events: EventEmitter;

    // AS3: .../data/_SafeCls_1720.as::get numFriends()
    readonly numFriends: number;

    // AS3: .../data/_SafeCls_1720.as::getFriendAt()
    getFriendAt(index: number): IFriendEntity | null;

    // AS3: .../data/_SafeCls_1720.as::getFriendByID()
    getFriendByID(id: number): IFriendEntity | null;

    // AS3: .../data/_SafeCls_1720.as::getFriendByName()
    getFriendByName(name: string): IFriendEntity | null;

    // AS3: .../data/_SafeCls_1720.as::get numFriendRequests()
    readonly numFriendRequests: number;

    // AS3: .../data/_SafeCls_1720.as::getFriendRequestAt()
    getFriendRequestAt(index: number): IFriendRequest | null;

    // AS3: .../data/_SafeCls_1720.as::getFriendRequestByID()
    getFriendRequestByID(id: number): IFriendRequest | null;

    // AS3: .../data/_SafeCls_1720.as::getFriendRequestByName()
    getFriendRequestByName(name: string): IFriendRequest | null;

    // AS3: .../data/_SafeCls_1720.as::getFriendRequestList()
    getFriendRequestList(): IFriendRequest[];

    // AS3: .../data/_SafeCls_1720.as::acceptFriendRequest()
    acceptFriendRequest(id: number): void;

    // AS3: .../data/_SafeCls_1720.as::acceptAllFriendRequests()
    acceptAllFriendRequests(): void;

    // AS3: .../data/_SafeCls_1720.as::declineFriendRequest()
    declineFriendRequest(id: number): void;

    // AS3: .../data/_SafeCls_1720.as::declineAllFriendRequests()
    declineAllFriendRequests(): void;

    // AS3: .../data/_SafeCls_1720.as::followToRoom()
    followToRoom(id: number): void;

    // AS3: .../data/_SafeCls_1720.as::startConversation()
    startConversation(id: number): void;

    // AS3: .../data/_SafeCls_1720.as::findNewFriends()
    findNewFriends(): void;

    // AS3: .../data/_SafeCls_1720.as::openUserTextSearch()
    openUserTextSearch(): void;

    // AS3: .../data/_SafeCls_1720.as::toggleFriendList()
    toggleFriendList(): void;

    // AS3: .../data/_SafeCls_1720.as::toggleMessenger()
    toggleMessenger(): void;

    // AS3: .../data/_SafeCls_1720.as::showProfile()
    showProfile(id: number): void;

    // AS3: .../data/_SafeCls_1720.as::showProfileByName()
    showProfileByName(name: string): void;
}
