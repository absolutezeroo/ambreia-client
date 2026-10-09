/** Says something on a channel, or whispers to a player by name. (F3c §10.1, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-chat-design.md) */
export class RpgChatSendMessage
{
    constructor(
        /** `general`, `world`, `whisper`, `group` or `guild`. */
        readonly channel: string,
        /** The player's name for `whisper`, empty otherwise. */
        readonly target: string,
        readonly text: string
    ) {}
}
