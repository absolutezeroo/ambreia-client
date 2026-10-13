import type {IUserDataManager} from './IUserDataManager';
import type {IUserData} from './IUserData';
import {UserDataType} from './UserData';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import {GetPetInfoMessageComposer} from '@ambreia/protocol/outgoing/room/pet/GetPetInfoMessageComposer';

/**
 * Room user data manager
 * Based on AS3 com.sulake.habbo.session.UserDataManager
 *
 * The RPG fork removed pet breeding and monsterplants: AS3's updatePetBreedingStatus() is not
 * ported.
 */
export class UserDataManager implements IUserDataManager
{
    private _usersByTypeAndWebId: Map<number, Map<number, IUserData>> = new Map();
    private _usersByRoomIndex: Map<number, IUserData> = new Map();
    private _connection: IConnection | null = null;

    constructor()
    {
    }

    private _disposed: boolean = false;

    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::set connection()
    set connection(connection: IConnection | null)
    {
        this._connection = connection;
    }

    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._usersByTypeAndWebId.clear();
        this._usersByRoomIndex.clear();
        this._connection = null;
        this._disposed = true;
    }

    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::getUserData()
    getUserData(webId: number): IUserData | null
    {
        return this.getUserDataByType(webId, UserDataType.USER);
    }

    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::getUserDataByType()
    getUserDataByType(webId: number, type: number): IUserData | null
    {
        const typeMap = this._usersByTypeAndWebId.get(type);

        if(typeMap)
        {
            return typeMap.get(webId) ?? null;
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::getUserDataByIndex()
    getUserDataByIndex(roomIndex: number): IUserData | null
    {
        return this._usersByRoomIndex.get(roomIndex) ?? null;
    }

    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::getUserDataByName()
    getUserDataByName(name: string): IUserData | null
    {
        for(const userData of this._usersByRoomIndex.values())
        {
            if(userData.name === name)
            {
                return userData;
            }
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::getPetUserData()
    getPetUserData(webId: number): IUserData | null
    {
        return this.getUserDataByType(webId, UserDataType.PET);
    }

    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::getRentableBotUserData()
    getRentableBotUserData(webId: number): IUserData | null
    {
        return this.getUserDataByType(webId, UserDataType.RENTABLE_BOT);
    }

    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::setUserData()
    setUserData(userData: IUserData): void
    {
        if(!userData) return;

        // Remove any existing data for this room index
        this.removeUserDataByRoomIndex(userData.roomObjectId);

        // Get or create the type map
        let typeMap = this._usersByTypeAndWebId.get(userData.type);

        if(!typeMap)
        {
            typeMap = new Map();
            this._usersByTypeAndWebId.set(userData.type, typeMap);
        }

        // Add by webID
        typeMap.set(userData.webID, userData);

        // Add by room index
        this._usersByRoomIndex.set(userData.roomObjectId, userData);
    }

    // TS-only: see IUserDataManager.getUserCount().
    getUserCount(type: number): number
    {
        return this._usersByTypeAndWebId.get(type)?.size ?? 0;
    }

    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::removeUserDataByRoomIndex()
    removeUserDataByRoomIndex(roomIndex: number): void
    {
        const userData = this._usersByRoomIndex.get(roomIndex);

        if(userData)
        {
            this._usersByRoomIndex.delete(roomIndex);

            const typeMap = this._usersByTypeAndWebId.get(userData.type);

            if(typeMap)
            {
                typeMap.delete(userData.webID);
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::updateFigure()
    updateFigure(roomIndex: number, figure: string, sex: string, hasSaddle: boolean, isRiding: boolean): void
    {
        const userData = this.getUserDataByIndex(roomIndex);

        if(userData)
        {
            userData.figure = figure;
            userData.sex = sex;
            userData.hasSaddle = hasSaddle;
            userData.isRiding = isRiding;
        }
    }

    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::updatePetLevel()
    updatePetLevel(roomIndex: number, level: number): void
    {
        const userData = this.getUserDataByIndex(roomIndex);

        if(userData)
        {
            userData.petLevel = level;
        }
    }

    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::updateCustom()
    updateCustom(roomIndex: number, custom: string): void
    {
        const userData = this.getUserDataByIndex(roomIndex);

        if(userData)
        {
            userData.custom = custom;
        }
    }

    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::updateAchievementScore()
    updateAchievementScore(roomIndex: number, score: number): void
    {
        const userData = this.getUserDataByIndex(roomIndex);

        if(userData)
        {
            userData.achievementScore = score;
        }
    }

    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::updateNameByIndex()
    updateNameByIndex(roomIndex: number, name: string): void
    {
        const userData = this.getUserDataByIndex(roomIndex);

        if(userData)
        {
            userData.name = name;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/UserDataManager.as::requestPetInfo()
    // First link of AS3's pet-infostand chain. The RPG server sends no pet info back and nothing
    // here listens for it any more.
    requestPetInfo(webId: number): void
    {
        const petData = this.getPetUserData(webId);

        if(petData && this._connection)
        {
            this._connection.send(new GetPetInfoMessageComposer(petData.webID));
        }
    }

    // AS3: .../src/com/sulake/habbo/session/UserDataManager.as::getAllUserIds()
    getAllUserIds(): number[]
    {
        const userIds: number[] = [];

        for(const userData of this._usersByRoomIndex.values())
        {
            userIds.push(userData.webID);
        }

        return userIds;
    }
}
