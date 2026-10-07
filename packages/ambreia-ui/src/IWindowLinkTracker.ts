/**
 * Receives the links a text window dispatches. Same shape as the engine's ILinkEventTracker, declared
 * here so the window system depends on nothing outside itself (spec §3 rule 1).
 */
export interface IWindowLinkTracker
{
    readonly linkPattern: string;

    linkReceived(link: string): void;
}
