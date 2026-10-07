import type {IID} from './IID';

/**
 * Gives a borrowed interface back to the component that provided it.
 *
 * AS3 writes `_communication.release(new IIDHabboCommunicationManager())` — the release goes to the
 * *provider*, because that is where `queueInterface()` bumped the count. `this.release(iid)` is a
 * different thing and only works when the component provides that interface itself; calling it for
 * a borrowed one throws "Attempting to release unknown interface" on every teardown.
 *
 * The cast is the whole reason this exists: this port's manager interfaces (`IHabboCatalog`,
 * `IRoomEngine`, …) do not declare `IUnknown` even though every implementation is a `Component`, so
 * there is no typed way to call `release()` through one. Releasing is a no-op on anything that is
 * not a Component.
 *
 * TS-only: no AS3 counterpart — AS3's interfaces all extend `IUnknown`, so it just calls the method.
 */
export function releaseProvider(provider: unknown, iid: IID): void
{
    const releasable = provider as {release?: (iid: IID) => number} | null;

    if(releasable !== null && typeof releasable.release === 'function') releasable.release(iid);
}
