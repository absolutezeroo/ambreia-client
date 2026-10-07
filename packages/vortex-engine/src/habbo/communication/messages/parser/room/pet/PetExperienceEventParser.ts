import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * A pet gained experience — drives the floating "+N" bubble over the pet (header 946).
 *
 * The server used to write five ints here (`PetId, Experience, ExperienceForNextLevel, Level,
 * MaxLevel`) against the AS3's three, which failed silently because there was more than enough
 * data on the wire for the reads to succeed with the wrong values. Revision20260701's
 * PetExperienceMessageComposerSerializer now writes exactly `PetId, PetRoomIndex,
 * GainedExperience`, so client and server agree; keep the AS3 order, it is the real protocol.
 *
 * AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetExperienceEventParser.as
 */
export class PetExperienceEventParser implements IMessageParser
{
    private _petId: number = 0;

    private _petRoomIndex: number = 0;

    private _gainedExperience: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetExperienceEventParser.as::get petId()
    get petId(): number
    {
        return this._petId;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetExperienceEventParser.as::get petRoomIndex()
    get petRoomIndex(): number
    {
        return this._petRoomIndex;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetExperienceEventParser.as::get gainedExperience()
    get gainedExperience(): number
    {
        return this._gainedExperience;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetExperienceEventParser.as::flush()
    flush(): boolean
    {
        this._petId = 0;
        this._petRoomIndex = 0;
        this._gainedExperience = 0;

        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetExperienceEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._petId = wrapper.readInt();
        this._petRoomIndex = wrapper.readInt();
        this._gainedExperience = wrapper.readInt();

        return true;
    }
}
