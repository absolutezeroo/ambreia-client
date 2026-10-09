/**
 * A refused chat send (F3c §10.2, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-chat-design.md):
 * the channel and a code the client translates (`empty`, `too_long`, `rate_limited`, `not_in_zone`,
 * `player_not_found`, `player_offline`, `not_in_group`, `not_in_guild`, `unknown_channel`, `refused`).
 */
export class RpgChatResultMessage
{
    constructor(
        readonly channel: string,
        readonly code: string
    ) {}
}
