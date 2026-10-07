/**
 * HighScoreStuffData
 *
 * Based on AS3: com.sulake.habbo.room.object.data.HighScoreStuffData
 *
 * High score furniture data (format type 6).
 */
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IRoomObjectModel} from '@room/object/IRoomObjectModel';
import type {IRoomObjectModelController} from '@room/object/IRoomObjectModelController';
import {RoomObjectVariableEnum} from '../RoomObjectVariableEnum';
import type {IStuffData} from './IStuffData';
import {StuffDataBase} from './StuffDataBase';

/**
 * One score row. AS3 gives this its own class with `score`/`users` accessors and an `addUser()`;
 * the port keeps the two fields and lets callers push, since nothing outside the parse loops ever
 * added a user.
 */
// DEVIATION: a plain shape rather than AS3's class, for the reason above.
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/data/HighScoreData.as
export interface IHighScoreEntry
{
    users: string[];
    score: number;
}

export class HighScoreStuffData extends StuffDataBase implements IStuffData
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/HighScoreStuffData.as::FORMAT_KEY
    public static readonly FORMAT_KEY = 6;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/HighScoreStuffData.as::_state
    private _state: string = '';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/HighScoreStuffData.as::_scoreType
    private _scoreType: number = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/HighScoreStuffData.as::get scoreType()
    get scoreType(): number
    {
        return this._scoreType;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/HighScoreStuffData.as::_clearType
    private _clearType: number = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/HighScoreStuffData.as::get clearType()
    get clearType(): number
    {
        return this._clearType;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/HighScoreStuffData.as::_entries
    private _entries: IHighScoreEntry[] = [];

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/HighScoreStuffData.as::get entries()
    get entries(): IHighScoreEntry[]
    {
        return this._entries;
    }

    override initializeFromIncomingMessage(wrapper: IMessageDataWrapper): void
    {
        this._state = wrapper.readString();
        this._scoreType = wrapper.readInt();
        this._clearType = wrapper.readInt();

        this._entries = [];

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const score = wrapper.readInt();
            const userCount = wrapper.readInt();
            const users: string[] = [];

            for(let j = 0; j < userCount; j++)
            {
                users.push(wrapper.readString());
            }

            this._entries.push({users, score});
        }

        // AS3 is the one StuffData override that deliberately does NOT call
        // super.initializeFromIncomingMessage(). The base reads the unique-serial
        // trailer (serial + edition) when the 0x0100 flag is set; a HighScore item
        // never carries it here, so calling super consumed two ints that were not on
        // the wire and desynced the rest of the packet.
    }

    override initializeFromRoomObjectModel(model: IRoomObjectModel): void
    {
        super.initializeFromRoomObjectModel(model);

        // AS3 does not read/write FURNITURE_DATA (the state string) in the model
        // methods — the state lives only on the field set from the incoming message.
        this._scoreType = model.getNumber(RoomObjectVariableEnum.FURNITURE_HIGHSCORE_SCORE_TYPE);
        this._clearType = model.getNumber(RoomObjectVariableEnum.FURNITURE_HIGHSCORE_CLEAR_TYPE);

        this._entries = [];

        const count = model.getNumber(RoomObjectVariableEnum.FURNITURE_HIGHSCORE_DATA_ENTRY_COUNT);

        for(let i = 0; i < count; i++)
        {
            const users = model.getStringArray(RoomObjectVariableEnum.FURNITURE_HIGHSCORE_DATA_ENTRY_BASE_USERS + i);
            const score = model.getNumber(RoomObjectVariableEnum.FURNITURE_HIGHSCORE_DATA_ENTRY_BASE_SCORE + i);

            this._entries.push({users: users ? [...users] : [], score});
        }
    }

    override writeRoomObjectModel(model: IRoomObjectModelController): void
    {
        super.writeRoomObjectModel(model);

        model.setNumber(RoomObjectVariableEnum.FURNITURE_DATA_FORMAT, HighScoreStuffData.FORMAT_KEY);
        model.setNumber(RoomObjectVariableEnum.FURNITURE_HIGHSCORE_SCORE_TYPE, this._scoreType);
        model.setNumber(RoomObjectVariableEnum.FURNITURE_HIGHSCORE_CLEAR_TYPE, this._clearType);
        model.setNumber(RoomObjectVariableEnum.FURNITURE_HIGHSCORE_DATA_ENTRY_COUNT, this._entries.length);

        for(let i = 0; i < this._entries.length; i++)
        {
            const entry = this._entries[i];

            model.setStringArray(RoomObjectVariableEnum.FURNITURE_HIGHSCORE_DATA_ENTRY_BASE_USERS + i, entry.users);
            model.setNumber(RoomObjectVariableEnum.FURNITURE_HIGHSCORE_DATA_ENTRY_BASE_SCORE + i, entry.score);
        }
    }

    override getLegacyString(): string
    {
        return this._state;
    }

    override compare(data: IStuffData): boolean
    {
        return this._state === data.getLegacyString();
    }
}
