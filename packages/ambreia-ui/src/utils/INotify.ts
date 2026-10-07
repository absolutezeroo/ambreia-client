import type {IDisposable} from '@ambreia/common/IDisposable';

/**
 * A notification: a title, a summary, and the callback fired when it is acted
 * on.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/INotify.as
 */
export interface INotify extends IDisposable
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/INotify.as::get title()
    title: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/INotify.as::get summary()
    summary: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/INotify.as::get callback()
    // AS3 types this as a bare `Function`; there is no call site in the window
    // tree that fixes the signature, so it stays unconstrained here too.
    callback: ((...args: unknown[]) => unknown) | null;
}
