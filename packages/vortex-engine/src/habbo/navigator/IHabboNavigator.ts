import type EventEmitter from 'eventemitter3';
import type {EventCategory, GuestRoomData} from '../communication/messages/incoming/navigator';
import type {ISessionDataManager} from '../session/ISessionDataManager';
import type {NavigatorData} from './domain';

/**
 * Interface for the Habbo Navigator component
 *
 */
export interface IHabboNavigator
{
    /**
	 * Get the navigator data model
	 */
    readonly data: NavigatorData;

    /**
	 * Get the home room ID
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboNavigator.as::get homeRoomId()
    readonly homeRoomId: number;

    /**
	 * Get the entered guest room data
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboNavigator.as::get enteredGuestRoomData()
    readonly enteredGuestRoomData: GuestRoomData | null;

    /**
	 * Get visible event categories
	 */
    readonly visibleEventCategories: EventCategory[];

    /**
	 * Get the session data manager.
	 */
    readonly sessionData: ISessionDataManager | null;

    /**
	 * Go to the user's home room
	 * @returns true if successful, false if no home room is set
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboNavigator.as::goToHomeRoom()
    goToHomeRoom(): boolean;

    /**
	 * Perform a tag search
	 * @param tag The tag to search for
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboNavigator.as::performTagSearch()
    performTagSearch(tag: string): void;

    /**
	 * Perform a text search
	 * @param searchText The text to search for
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboNavigator.as::performTextSearch()
    performTextSearch(searchText: string): void;

    /**
	 * Perform a guild base search
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboNavigator.as::performGuildBaseSearch()
    performGuildBaseSearch(): void;

    /**
	 * Perform a competition rooms search
	 * @param goalId The goal ID
	 * @param pageIndex The page index
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboNavigator.as::performCompetitionRoomsSearch()
    performCompetitionRoomsSearch(goalId: number, pageIndex: number): void;

    /**
	 * Show the user's own rooms
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboNavigator.as::showOwnRooms()
    showOwnRooms(): void;

    /**
	 * Go to a private room
	 * @param roomId The room ID
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboNavigator.as::goToPrivateRoom()
    goToPrivateRoom(roomId: number): void;

    /**
	 * Check if user has room rights but is not owner
	 * @param roomId The room ID
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboNavigator.as::hasRoomRightsButIsNotOwner()
    hasRoomRightsButIsNotOwner(roomId: number): boolean;

    /**
	 * Remove room rights for a room
	 * @param roomId The room ID
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboNavigator.as::removeRoomRights()
    removeRoomRights(roomId: number): void;

    /**
	 * Go to a room in the network
	 * @param roomId The room ID
	 * @param useHomeRoom Whether to use home room as fallback
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboNavigator.as::goToRoomNetwork()
    goToRoomNetwork(roomId: number, useHomeRoom: boolean): void;

    /**
	 * Start room creation process
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboNavigator.as::startRoomCreation()
    startRoomCreation(): void;

    /**
	 * Create a new room
	 */
    createRoom(name: string, description: string, model: string, categoryId: number, maxUsers: number, tradeMode: number): void;

    /**
	 * Open the navigator window
	 */
    /**
	 * @param position where the caller would like the window centred. **Ignored**, and not by
	 *   omission: `HabboNavigator.openNavigator()` has an empty body in the 2026 client, so the
	 *   argument every caller passes goes nowhere there either. Declared for signature parity.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/_SafeCls_93.as::openNavigator()
    openNavigator(position?: {x: number; y: number} | null): void;

    /**
	 * Close the navigator window
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboNavigator.as::closeNavigator()
    closeNavigator(): void;

    /**
	 * Toggle room info visibility
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboNavigator.as::toggleRoomInfoVisibility()
    toggleRoomInfoVisibility(): void;

    /**
	 * Check if a room is in favourites
	 * @param roomId The room ID
	 */
    isRoomFavorite(roomId: number): boolean;

    /**
	 * Check if a room is the home room
	 * @param roomId The room ID
	 */
    isRoomHome(roomId: number): boolean;

    /**
	 * Dispose the navigator
	 */
    dispose(): void;

    /**
	 * The component's own event emitter, which callers subscribe to for navigator state changes.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/_SafeCls_93.as::get events()
    readonly events: EventEmitter;

    /**
	 * The toolbar's navigator-button hover, shown and hidden.
	 *
	 * Empty in every AS3 implementor — the toolbar drives its own hover — but declared on the
	 * interface, so callers holding an `IHabboNavigator` can make the call the AS3 API offers.
	 */
    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_93.as::showToolbarHover()
    showToolbarHover(point: { readonly x: number; readonly y: number } | number, y?: number): void;

    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_93.as::hideToolbarHover()
    hideToolbarHover(immediate?: boolean): void;
}
