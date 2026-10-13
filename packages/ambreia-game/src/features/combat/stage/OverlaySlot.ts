import type {CombatOverlay} from '../CombatOverlay';

/** The combat overlay, built on first use: the window manager comes up after the feature. */
export class OverlaySlot
{
    private _overlay: CombatOverlay | null = null;

    constructor(private readonly _make: () => CombatOverlay | null) {}

    get(): CombatOverlay | null
    {
        return this._overlay ??= this._make();
    }

    dispose(): void
    {
        this._overlay?.dispose();
        this._overlay = null;
    }
}
