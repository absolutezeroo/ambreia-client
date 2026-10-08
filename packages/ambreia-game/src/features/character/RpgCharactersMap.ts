import {MessageMap} from '@ambreia/net/style/MessageMap';
import {Incoming, Outgoing} from '@ambreia/protocol/Headers.generated';
import {RpgCharacterListMessageParser} from '@ambreia/protocol/parser/rpg/characters/RpgCharacterListMessageParser';
import {RpgClassListMessageParser} from '@ambreia/protocol/parser/rpg/characters/RpgClassListMessageParser';
import {RpgCharacterResultMessageParser} from '@ambreia/protocol/parser/rpg/characters/RpgCharacterResultMessageParser';
import {RpgCharacterStateMessageParser} from '@ambreia/protocol/parser/rpg/characters/RpgCharacterStateMessageParser';
import {RpgCharacterProgressMessageParser} from '@ambreia/protocol/parser/rpg/characters/RpgCharacterProgressMessageParser';
import {RpgCharacterStatsMessageParser} from '@ambreia/protocol/parser/rpg/characters/RpgCharacterStatsMessageParser';
import {RpgCharacterListRequestMessage} from '@ambreia/protocol/outgoing/rpg/characters/RpgCharacterListRequestMessage';
import {RpgCharacterCreateMessage} from '@ambreia/protocol/outgoing/rpg/characters/RpgCharacterCreateMessage';
import {RpgCharacterChooseClassMessage} from '@ambreia/protocol/outgoing/rpg/characters/RpgCharacterChooseClassMessage';
import {RpgEnterWorldMessage} from '@ambreia/protocol/outgoing/rpg/characters/RpgEnterWorldMessage';
import {RpgCharacterListRequestMessageSerializer} from '@ambreia/protocol/serializer/rpg/characters/RpgCharacterListRequestMessageSerializer';
import {RpgCharacterCreateMessageSerializer} from '@ambreia/protocol/serializer/rpg/characters/RpgCharacterCreateMessageSerializer';
import {RpgCharacterChooseClassMessageSerializer} from '@ambreia/protocol/serializer/rpg/characters/RpgCharacterChooseClassMessageSerializer';
import {RpgEnterWorldMessageSerializer} from '@ambreia/protocol/serializer/rpg/characters/RpgEnterWorldMessageSerializer';
import type {IRpgCharacterSessionEvents} from './IRpgCharacterSession';

/**
 * The characters' messages and where they go: the client's counterpart of the server's
 * RpgCharactersMap.cs (F3a §6). Each incoming message is announced as the session event it feeds.
 */
export function rpgCharactersMap(announce: <E extends keyof IRpgCharacterSessionEvents>(event: E, ...args: IRpgCharacterSessionEvents[E]) => void): MessageMap
{
    return new MessageMap()
        .incoming(Incoming.RpgCharacterListMessageComposer, new RpgCharacterListMessageParser(), {handle: message => announce('characters', message)})
        .incoming(Incoming.RpgClassListMessageComposer, new RpgClassListMessageParser(), {handle: message => announce('classes', message)})
        .incoming(Incoming.RpgCharacterResultMessageComposer, new RpgCharacterResultMessageParser(), {handle: message => announce('result', message)})
        .incoming(Incoming.RpgCharacterStateMessageComposer, new RpgCharacterStateMessageParser(), {handle: message => announce('state', message)})
        .incoming(Incoming.RpgCharacterProgressMessageComposer, new RpgCharacterProgressMessageParser(), {handle: message => announce('progress', message)})
        .incoming(Incoming.RpgCharacterStatsMessageComposer, new RpgCharacterStatsMessageParser(), {handle: message => announce('stats', message)})
        .outgoing(RpgCharacterListRequestMessage, Outgoing.RpgCharacterListRequestMessageEvent, new RpgCharacterListRequestMessageSerializer())
        .outgoing(RpgCharacterCreateMessage, Outgoing.RpgCharacterCreateMessageEvent, new RpgCharacterCreateMessageSerializer())
        .outgoing(RpgCharacterChooseClassMessage, Outgoing.RpgCharacterChooseClassMessageEvent, new RpgCharacterChooseClassMessageSerializer())
        .outgoing(RpgEnterWorldMessage, Outgoing.RpgEnterWorldMessageEvent, new RpgEnterWorldMessageSerializer());
}
