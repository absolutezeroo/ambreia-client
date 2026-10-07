/**
 * The two members almost everything in the engine carries.
 *
 * Obfuscated as `_SafeCls_47` in the primary tree, readable as `IDisposable.as` in PRODUCTION —
 * both cited below, since the primary is the current build and PRODUCTION is where the name comes
 * from.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_47.as
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/runtime/IDisposable.as
 */
export interface IDisposable
{
    /**
	 * Whether this object has been disposed
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_47.as::get disposed()
    readonly disposed: boolean;

    /**
	 * Dispose of this object and release all resources
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_47.as::dispose()
    dispose(): void;
}
