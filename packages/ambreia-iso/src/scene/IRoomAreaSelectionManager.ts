/**
 * IRoomAreaSelectionManager — the room-engine service that lets a tool (e.g. the wired InArea selector)
 * activate an interactive tile-area selection over the room, highlight a rectangle, and receive the
 * picked (x, y, width, height) via a callback.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomAreaSelectionManager.as
 */
export interface IRoomAreaSelectionManager
{
    // AS3: IRoomAreaSelectionManager.as::activate()
    activate(callback: (x: number, y: number, width: number, height: number) => void, highlight: string): boolean;

    // AS3: IRoomAreaSelectionManager.as::deactivate()
    deactivate(): void;

    // AS3: IRoomAreaSelectionManager.as::startSelecting()
    startSelecting(): void;

    // AS3: IRoomAreaSelectionManager.as::clearHighlight()
    clearHighlight(): void;

    // AS3: IRoomAreaSelectionManager.as::setHighlight()
    setHighlight(x: number, y: number, width: number, height: number): void;
}
