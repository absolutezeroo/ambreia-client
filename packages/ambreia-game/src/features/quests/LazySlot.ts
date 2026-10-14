/**
 * A piece built on first use, once what it needs exists (the window manager comes up after the
 * features are created), as combat's OverlaySlot; disposed with the feature.
 */
export class LazySlot<T extends {dispose(): void}>
{
    private _value: T | null = null;
    private _disposed = false;

    constructor(private readonly _make: () => T | null) {}

    get(): T | null
    {
        if(this._disposed) return null;

        return this._value ??= this._make();
    }

    /** The piece if it was built, without building it. */
    peek(): T | null
    {
        return this._value;
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._value?.dispose();
        this._value = null;
    }
}
