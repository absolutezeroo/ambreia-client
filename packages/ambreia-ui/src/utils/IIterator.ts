import type {IWindow} from '../IWindow';

/**
 * Iterator over a container's children.
 *
 * **AS3 declares only two members here**, `length` and `indexOf`. Its implementations extend
 * `flash.utils.Proxy` and get the rest of an array's shape for free: `iterator[i]` reads a child
 * through `flash_proxy getProperty`, `iterator[i] = w` writes one through `setProperty` (assigning
 * at `length` appends — that is how `WindowParser` adds a parsed child), and
 * `for each (w in iterator)` walks it through `nextNameIndex`/`nextValue`.
 *
 * TypeScript has no `Proxy` namespace to override, so the walk is exposed as the cursor pair
 * `next()`/`reset()` — the same two operations `nextNameIndex`/`nextValue` implement, and what
 * every ported `for each (… in iterator)` becomes. The **write** half is deliberately not
 * reproduced: no port call site assigns through an iterator, and `WindowParser.ts` appends with
 * `addChild()` instead, which says what it does.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IIterator.as
 */
export interface IIterator
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IIterator.as::get length()
    readonly length: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IIterator.as::indexOf()
    indexOf(window: IWindow | null): number;

    // TS-only: AS3 gets this from `flash_proxy nextValue` — see the class note above.
    next(): IWindow | null;

    // TS-only: AS3 gets this from `flash_proxy nextNameIndex` restarting at 0.
    reset(): void;
}
