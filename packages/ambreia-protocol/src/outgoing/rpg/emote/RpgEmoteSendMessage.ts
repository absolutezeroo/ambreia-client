/** Plays an RP action (`wave`…) on the player's avatar; at most one every 2 s. (F3c §16, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-chat-design.md) */
export class RpgEmoteSendMessage
{
    constructor(
        readonly key: string
    ) {}
}
