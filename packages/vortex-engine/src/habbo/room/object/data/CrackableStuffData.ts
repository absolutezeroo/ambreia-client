/**
 * CrackableStuffData
 *
 * Based on AS3: com.sulake.habbo.room.object.data.CrackableStuffData
 *
 * Crackable furniture data (format type 7).
 */
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IRoomObjectModel} from '@room/object/IRoomObjectModel';
import type {IRoomObjectModelController} from '@room/object/IRoomObjectModelController';
import {RoomObjectVariableEnum} from '../RoomObjectVariableEnum';
import type {IStuffData} from './IStuffData';
import {StuffDataBase} from './StuffDataBase';

export class CrackableStuffData extends StuffDataBase implements IStuffData
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/CrackableStuffData.as::FORMAT_KEY
    public static readonly FORMAT_KEY = 7;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/CrackableStuffData.as::_state
    private _state: string = '';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/CrackableStuffData.as::_hits
    private _hits: number = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/CrackableStuffData.as::get hits()
    get hits(): number
    {
        return this._hits;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/CrackableStuffData.as::_target
    private _target: number = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/CrackableStuffData.as::get target()
    get target(): number
    {
        return this._target;
    }

    override initializeFromIncomingMessage(wrapper: IMessageDataWrapper): void
    {
        this._state = wrapper.readString();
        this._hits = wrapper.readInt();
        this._target = wrapper.readInt();
        super.initializeFromIncomingMessage(wrapper);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/CrackableStuffData.as::initializeFromRoomObjectModel()
    override initializeFromRoomObjectModel(model: IRoomObjectModel): void
    {
        super.initializeFromRoomObjectModel(model);

        // AS3 reads all three crackable keys. The old body read only the state, and
        // under the wrong key (FURNITURE_DATA), so hits/target fell back to 0 on every
        // round-trip through the model — cracked-egg progress reset to 0/0.
        this._state = model.getString(RoomObjectVariableEnum.FURNITURE_CRACKABLE_STATE);
        this._hits = model.getNumber(RoomObjectVariableEnum.FURNITURE_CRACKABLE_HITS);
        this._target = model.getNumber(RoomObjectVariableEnum.FURNITURE_CRACKABLE_TARGET);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/CrackableStuffData.as::writeRoomObjectModel()
    override writeRoomObjectModel(model: IRoomObjectModelController): void
    {
        super.writeRoomObjectModel(model);
        model.setNumber(RoomObjectVariableEnum.FURNITURE_DATA_FORMAT, CrackableStuffData.FORMAT_KEY);
        model.setString(RoomObjectVariableEnum.FURNITURE_CRACKABLE_STATE, this._state);
        model.setNumber(RoomObjectVariableEnum.FURNITURE_CRACKABLE_HITS, this._hits);
        model.setNumber(RoomObjectVariableEnum.FURNITURE_CRACKABLE_TARGET, this._target);
    }

    override getLegacyString(): string
    {
        return this._state;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/CrackableStuffData.as::compare()
    override compare(_data: IStuffData): boolean
    {
        // AS3 returns true unconditionally — two crackables always group together,
        // regardless of state/hits/target. The old body compared the state string.
        return true;
    }
}
