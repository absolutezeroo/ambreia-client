import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * The command set a pet knows, and which of them are currently enabled (header 332) — the data
 * behind the pet training view.
 *
 * Read order matches Revision20260701's PetCommandsMessageComposerSerializer exactly (petId, then
 * a counted int list of all command ids, then a counted int list of the enabled ones); one of only
 * two pet messages where client and server agree.
 *
 * Both AS3 loops are written `while(count-- > 0)`, i.e. correctly counted — this parser is free of
 * the `while(0 < count)` decompiler corruption that affects its siblings in this tree.
 *
 * AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetCommandsMessageEventParser.as
 */
export class PetCommandsMessageEventParser implements IMessageParser
{
    private _petId: number = -1;

    private _allCommands: number[] = [];

    private _enabledCommands: number[] = [];

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetCommandsMessageEventParser.as::get petId()
    get petId(): number
    {
        return this._petId;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetCommandsMessageEventParser.as::get allCommands()
    get allCommands(): number[]
    {
        return this._allCommands;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetCommandsMessageEventParser.as::get enabledCommands()
    get enabledCommands(): number[]
    {
        return this._enabledCommands;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetCommandsMessageEventParser.as::flush()
    // AS3 resets petId to -1 (not 0) here; kept as-is.
    flush(): boolean
    {
        this._petId = -1;
        this._allCommands = [];
        this._enabledCommands = [];

        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetCommandsMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._petId = wrapper.readInt();

        const allCount = wrapper.readInt();

        this._allCommands = [];

        for(let i = 0; i < allCount; i++) this._allCommands.push(wrapper.readInt());

        const enabledCount = wrapper.readInt();

        this._enabledCommands = [];

        for(let i = 0; i < enabledCount; i++) this._enabledCommands.push(wrapper.readInt());

        return true;
    }
}
