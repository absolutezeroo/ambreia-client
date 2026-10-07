import type {IMessageComposer} from './IMessageComposer';

/**
 * Base class for outgoing message composers
 *
 * Provides default implementation of IDisposable (via IMessageComposer).
 */
export abstract class MessageComposer<T extends unknown[] = unknown[]> implements IMessageComposer<T>
{
    protected _disposed: boolean = false;

    get disposed(): boolean
    {
        return this._disposed;
    }

    abstract getMessageArray(): T;

    dispose(): void
    {
        this._disposed = true;
    }
}
