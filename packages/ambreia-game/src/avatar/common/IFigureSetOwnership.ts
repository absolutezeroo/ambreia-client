/**
 * "Do I own this sellable clothing item?"
 *
 * TS-only: AS3 passes the whole `IHabboInventory` to `CategoryData.hasInvalidSellableItems()` and
 * `stripInvalidSellableItems()`, which call exactly one method on it. Narrowed to that method;
 * `HabboInventory` satisfies it structurally, and the list behind it is fed by message 1231.
 */
export interface IFigureSetOwnership
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_588.as::hasFigureSetIdInInventory()
    hasFigureSetIdInInventory(figureSetId: number): boolean;
}
