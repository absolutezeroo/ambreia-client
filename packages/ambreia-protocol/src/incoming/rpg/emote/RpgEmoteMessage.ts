/**
 * An avatar of the room plays an RP action (F3c §16, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-chat-design.md): sent to the whole room, the sender
 * too. The server keeps nothing: the client plays it on the avatar (a dance lasts until it walks).
 */
export class RpgEmoteMessage
{
    constructor(
        /** The avatar's room object id (its Users room index). */
        readonly objectId: number,
        /** `wave`, `laugh`, `clap`, `dance`, `sad`, `surprised`. */
        readonly key: string
    ) {}
}
