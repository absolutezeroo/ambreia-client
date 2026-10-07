import type {IDisposable} from '../core/runtime/index';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IUserData} from './IUserData';
import type {ISelectedBadge} from '@ambreia/protocol/parser/users/HabboUserBadgesMessageParser';

/**
 * Interface for user data manager
 * Based on AS3 com.sulake.habbo.session.class_3525 (IUserDataManager)
 */
export interface IUserDataManager extends IDisposable
{
    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::set connection()
    set connection(connection: IConnection | null);

    /**
	 * Get user data by webID (user type only)
	 */
    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::getUserData()
    getUserData(webId: number): IUserData | null;

    /**
	 * Get user data by webID and type
	 */
    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::getUserDataByType()
    getUserDataByType(webId: number, type: number): IUserData | null;

    /**
	 * Get user data by room object index
	 */
    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::getUserDataByIndex()
    getUserDataByIndex(roomIndex: number): IUserData | null;

    /**
	 * Get user data by name
	 */
    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::getUserDataByName()
    getUserDataByName(name: string): IUserData | null;

    /**
	 * Get pet user data by webID
	 */
    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::getPetUserData()
    getPetUserData(webId: number): IUserData | null;

    /**
	 * Get rentable bot user data by webID
	 */
    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::getRentableBotUserData()
    getRentableBotUserData(webId: number): IUserData | null;

    /**
	 * Request a user's selected badges from the server.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/UserDataManager.as::requestUserSelectedBadges()
    requestUserSelectedBadges(userId: number): void;

    /**
	 * Set user data
	 */
    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::setUserData()
    setUserData(userData: IUserData): void;

    /**
	 * Set user badges
	 */
    setUserBadges(userId: number, badges: string[]): void;

    /**
	 * Pure cache read of a user's selected badges - no network request.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/UserDataManager.as::getUserSelectedBadges()
    getUserSelectedBadges(userId: number): ISelectedBadge[];

    // TS-only: the setter behind `getUserSelectedBadges()` — AS3 writes the map inline.
    setUserSelectedBadges(userId: number, badges: ISelectedBadge[]): void;

    /**
	 * Remove user data by room index
	 */
    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::removeUserDataByRoomIndex()
    removeUserDataByRoomIndex(roomIndex: number): void;

    /**
	 * Update user figure
	 */
    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::updateFigure()
    updateFigure(roomIndex: number, figure: string, sex: string, hasSaddle: boolean, isRiding: boolean): void;

    /**
	 * Update pet level
	 */
    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::updatePetLevel()
    updatePetLevel(roomIndex: number, level: number): void;

    /**
	 * Update custom data (motto)
	 */
    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::updateCustom()
    updateCustom(roomIndex: number, custom: string): void;

    /**
	 * Update achievement score
	 */
    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::updateAchievementScore()
    updateAchievementScore(roomIndex: number, score: number): void;

    /**
	 * Update badges rank
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/_SafeCls_2765.as::updateBadgesRank()
    updateBadgesRank(roomIndex: number, badgesRank: number): void;

    /**
	 * Update name by room index
	 */
    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::updateNameByIndex()
    updateNameByIndex(roomIndex: number, name: string): void;

    /**
	 * Mark user data as blocked/unblocked by room index
	 */
    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::markAsBlocked()
    markAsBlocked(roomIndex: number, blocked?: boolean): void;

    /**
	 * Request pet info from server
	 */
    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::requestPetInfo()
    requestPetInfo(webId: number): void;

    /**
	 * Get all user IDs in the room
	 */
    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::getAllUserIds()
    getAllUserIds(): number[];
}
