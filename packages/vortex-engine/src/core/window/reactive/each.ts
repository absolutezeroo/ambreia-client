import type {IWindow} from '../IWindow';
import {Scope, effect, untrack} from '@ambreia/common/reactive/Effect';
import {signal} from '@ambreia/common/reactive/Signal';
import type {SignalReader, SignalWriter} from '@ambreia/common/reactive/Signal';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('core.window.reactive.each');

// No `AS3:` traces in this file: nothing here was ported. Window adapter of the
// TS-only reactive layer (docs/REACTIVE-UI.md §6).

/**
 * The slice of `ItemListController` the reconciler drives — structural, so any
 * list-shaped window qualifies.
 */
// TS-only: matches ItemListController's real members.
export interface IReconcilableList
{
    addListItem(item: IWindow): IWindow;
    addListItemAt(item: IWindow, index: number): IWindow;
    removeListItem(item: IWindow): IWindow | null;
    getListItemIndex(item: IWindow): number;
}

// TS-only: options of {@link each}.
export interface IEachOptions<T, K>
{
    /** Stable identity per item; duplicate keys are logged and skipped. */
    key: (item: T) => K;

    /**
     * Builds the row window for a new key, inside a scope of its own. `item`
     * is a reader that tracks the latest data for this key — bindings created
     * here should read through it. Returning null skips the item.
     */
    create: (item: SignalReader<T>, initial: T) => IWindow | null;
}

interface IRowRecord<T>
{
    window: IWindow;
    scope: Scope;
    set: SignalWriter<T>;
}

/**
 * Keyed list reconciliation over an `ItemListController`-shaped window.
 *
 * One effect: reads `items()`, then creates rows for new keys, feeds updated
 * data to surviving rows (their bindings do the rest), removes rows whose key
 * vanished — scope disposed, window destroyed — and fixes ordering with
 * minimal `addListItemAt` moves (`addChildAt` re-parents, and the controller
 * re-arranges positions on every insertion).
 *
 * Membership and order only: spacing, auto-arrange and scrolling stay the
 * controller's job.
 *
 * @param scope - Owns the reconciler and every row scope
 * @param list - The list window to reconcile into
 * @param items - The reactive array of row data
 * @param options - Key and row factory
 * @returns A disposer for the reconciler (rows die with `scope`)
 */
// TS-only: replaces the clear-and-rebuild pattern in TS-only views.
export function each<T, K>(
    scope: Scope,
    list: IReconcilableList,
    items: () => readonly T[],
    options: IEachOptions<T, K>
): () => void
{
    const rows: Map<K, IRowRecord<T>> = new Map();

    scope.addCleanup(() => rows.clear());

    return scope.run(() => effect(() =>
    {
        const next = items();
        const seen: Set<K> = new Set();

        // Create new rows; push fresh data into surviving ones.
        for(const item of next)
        {
            const key = options.key(item);

            if(seen.has(key))
            {
                log.warn('duplicate key in each() — keeping the first row:', key);
                continue;
            }

            seen.add(key);

            const existing = rows.get(key);

            if(existing)
            {
                existing.set(item);
                continue;
            }

            const rowScope = new Scope(scope);
            let window: IWindow | null = null;
            let write: SignalWriter<T> | null = null;

            rowScope.run(() =>
            {
                const [read, set] = signal(item);

                write = set;
                // untracked: nothing the factory reads may subscribe the
                // reconciler itself — rows own their reactivity.
                window = untrack(() => options.create(read, item));
            });

            if(!window || !write)
            {
                rowScope.dispose();
                continue;
            }

            list.addListItem(window);
            rows.set(key, {window, scope: rowScope, set: write});
        }

        // Remove rows whose key vanished: unbind first, then destroy.
        for(const [key, record] of rows)
        {
            if(seen.has(key))
            {
                continue;
            }

            rows.delete(key);
            record.scope.dispose();
            list.removeListItem(record.window);

            if(!record.window.disposed)
            {
                record.window.destroy();
            }
        }

        // Minimal-move ordering pass.
        let index = 0;

        for(const item of next)
        {
            const record = rows.get(options.key(item));

            if(!record)
            {
                continue;
            }

            if(list.getListItemIndex(record.window) !== index)
            {
                list.addListItemAt(record.window, index);
            }

            index++;
        }
    }));
}
