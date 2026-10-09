import type {EventEmitter} from 'eventemitter3';
import type {RpgCharacterListMessage} from '@ambreia/protocol/incoming/rpg/characters/RpgCharacterListMessage';
import type {IRpgCharacterListEntry} from '@ambreia/protocol/incoming/rpg/characters/IRpgCharacterListEntry';
import type {RpgClassListMessage} from '@ambreia/protocol/incoming/rpg/characters/RpgClassListMessage';
import type {RpgCharacterResultMessage} from '@ambreia/protocol/incoming/rpg/characters/RpgCharacterResultMessage';
import type {RpgCharacterStateMessage} from '@ambreia/protocol/incoming/rpg/characters/RpgCharacterStateMessage';
import type {RpgCharacterProgressMessage} from '@ambreia/protocol/incoming/rpg/characters/RpgCharacterProgressMessage';
import type {RpgCharacterStatsMessage} from '@ambreia/protocol/incoming/rpg/characters/RpgCharacterStatsMessage';

/** What the character session announces: one event per message the server sends (F3a §6.2). */
export interface IRpgCharacterSessionEvents
{
    characters: [RpgCharacterListMessage];
    classes: [RpgClassListMessage];
    result: [RpgCharacterResultMessage];
    state: [RpgCharacterStateMessage];
    progress: [RpgCharacterProgressMessage];
    stats: [RpgCharacterStatsMessage];
}

/**
 * The account's characters and the played character, as the server last sent them (F3a). Other
 * features read it through this interface — the HUD, the characters screen — never the feature.
 */
export interface IRpgCharacterSession
{
    readonly events: EventEmitter<IRpgCharacterSessionEvents>;
    readonly characters: RpgCharacterListMessage | null;
    readonly classes: RpgClassListMessage | null;
    readonly state: RpgCharacterStateMessage | null;
    /**
     * The played character as the account's list names it (name, figure): the server sends no
     * UserObject for a character, so the session data has neither. Null before the world or
     * without a list (an editor test ticket).
     */
    readonly played: IRpgCharacterListEntry | null;
    /** Sends one of the client's messages (RpgCharacterCreateMessage…); false if not connected. */
    send(message: object): boolean;
}
