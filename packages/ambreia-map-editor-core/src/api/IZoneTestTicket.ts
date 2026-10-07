/** The editor's test mode: open the game client with this ticket and it starts in that room. */
export interface IZoneTestTicket
{
    readonly ssoToken: string;
    readonly roomId: number;
}
