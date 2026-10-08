import {Incoming, Outgoing} from './Headers.generated';

/**
 * The server headers served by the new network style (`@ambreia/net/style/MessageMap`, spec §6)
 * instead of an inherited event or composer in HabboMessages. A message moving to the new style
 * leaves HabboMessages and its header comes here: map.install() refuses a header both serve, and
 * the registration tests accept either style.
 */
export const NewStyleHeaders = {
    incoming: new Set<number>([
        // F3a: the characters screen and the character's state (features/character).
        Incoming.RpgCharacterListMessageComposer,
        Incoming.RpgClassListMessageComposer,
        Incoming.RpgCharacterResultMessageComposer,
        Incoming.RpgCharacterStateMessageComposer,
        Incoming.RpgCharacterProgressMessageComposer,
        Incoming.RpgCharacterStatsMessageComposer
    ]),
    outgoing: new Set<number>([
        Outgoing.RpgCharacterListRequestMessageEvent,
        Outgoing.RpgCharacterCreateMessageEvent,
        Outgoing.RpgCharacterChooseClassMessageEvent,
        Outgoing.RpgEnterWorldMessageEvent
    ])
};

/** The names of `headers` served by neither style. */
export function unservedHeaders(headers: Readonly<Record<string, number>>, legacy: ReadonlySet<number>, newStyle: ReadonlySet<number>): string[]
{
    return Object.entries(headers).filter(([, id]) => !legacy.has(id) && !newStyle.has(id)).map(([name]) => name);
}

/** The names of `headers` served by both styles. */
export function overlappingHeaders(headers: Readonly<Record<string, number>>, legacy: ReadonlySet<number>, newStyle: ReadonlySet<number>): string[]
{
    return Object.entries(headers).filter(([, id]) => legacy.has(id) && newStyle.has(id)).map(([name]) => name);
}
