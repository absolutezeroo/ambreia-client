/** A part of the owner's windows bound to the editor: re-read after each change. */
export interface IPanelUi
{
    render(): void;
    /** The camera moved or zoomed (mini-map, zoom readout). */
    onViewChange?(): void;
    /** The panel's window leaves its slot (another category took it). */
    dispose?(): void;
}
