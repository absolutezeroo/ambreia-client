import {RpgCharacterResultMessage} from '@ambreia/protocol/incoming/rpg/characters/RpgCharacterResultMessage';
import {RpgCharacterChooseClassMessage} from '@ambreia/protocol/outgoing/rpg/characters/RpgCharacterChooseClassMessage';
import {RpgCharacterCreateMessage} from '@ambreia/protocol/outgoing/rpg/characters/RpgCharacterCreateMessage';
import type {ICharacterDraft} from '../create/ICharacterDraft';
import type {ICreationOutcome} from './ICreationOutcome';

/** The two refusals the wizard's name step shows itself. */
const NAME_REFUSALS = new Set(['character.name_taken', 'character.name_invalid']);

/**
 * The wizard's requests: a new character is created first, then given its class (two requests, two
 * answers); a starter character only chooses its class.
 */
export class CreationFlow
{
    /** The class to give the character being created, once the server says it exists. */
    private _pendingClass: string | null = null;

    constructor(private readonly _send: (message: object) => unknown) {}

    submit(draft: Readonly<ICharacterDraft>): void
    {
        if(draft.playerId > 0)
        {
            this._send(new RpgCharacterChooseClassMessage(draft.playerId, draft.classId));

            return;
        }

        this._pendingClass = draft.classId;
        this._send(new RpgCharacterCreateMessage(draft.name, draft.figure, draft.gender));
    }

    result(result: RpgCharacterResultMessage): ICreationOutcome
    {
        const ok = result.code === 'ok';

        if(result.action === RpgCharacterResultMessage.ACTION_CREATE)
        {
            if(!ok) return {kind: 'refused', code: result.code, alert: !NAME_REFUSALS.has(result.code)};
            if(!this._pendingClass || result.playerId <= 0) return {kind: 'ignored'};

            this._send(new RpgCharacterChooseClassMessage(result.playerId, this._pendingClass));
            this._pendingClass = null;

            return {kind: 'classing', playerId: result.playerId};
        }

        // Created but still classless on a refusal: the list offers to choose again.
        if(result.action === RpgCharacterResultMessage.ACTION_CHOOSE_CLASS) return {kind: 'done', playerId: result.playerId, refusal: ok ? null : result.code};

        return {kind: 'ignored'};
    }

    /** The wizard closed: an answer still on its way changes nothing. */
    reset(): void
    {
        this._pendingClass = null;
    }
}
