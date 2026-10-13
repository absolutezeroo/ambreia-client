/**
 * The HUD target frame closed by the player: the frame going from a target to none asks the server to
 * clear it too. Any other HUD update is ignored, a target the HUD has not drawn yet included (the
 * model writes its target before the HUD does, and other frames update in between).
 */
export class HudTargetClose
{
    private _shown = false;

    constructor(private readonly _select: (objectId: number) => void) {}

    changed(target: object | null): void
    {
        const closed = this._shown && target === null;

        this._shown = target !== null;
        if(closed) this._select(0);
    }
}
