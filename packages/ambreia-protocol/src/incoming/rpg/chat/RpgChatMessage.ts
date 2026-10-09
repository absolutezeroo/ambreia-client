/**
 * A chat line (F3c §10.2, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-chat-design.md):
 * a player's message on a channel, a whisper (the sender gets a copy) or a system line.
 */
export class RpgChatMessage
{
    constructor(
        /** `general`, `world`, `whisper`, `group`, `guild` or `system`. */
        readonly channel: string,
        /** 0 for `system`. */
        readonly senderId: number,
        readonly senderName: string,
        /** May hold `[item:<id>]` links. */
        readonly text: string,
        /** Seconds since the Unix epoch, UTC. */
        readonly sentAt: number,
        /** For `whisper`, the other player of the conversation; empty otherwise. */
        readonly target: string
    ) {}
}
